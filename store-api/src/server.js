import crypto from "node:crypto";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import Stripe from "stripe";
import { getProduct } from "./catalog.js";
import { FileStore } from "./store.js";

dotenv.config();

const port = Number(process.env.PORT || 8787);
const publicSiteUrl = trimTrailingSlash(process.env.PUBLIC_SITE_URL || "https://minecraftwarriders.github.io");
const corsOrigin = process.env.CORS_ORIGIN || publicSiteUrl;
const bridgeToken = process.env.BRIDGE_TOKEN || "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const dataFile = process.env.DATA_FILE || "./data/orders.json";

if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is required");
if (!stripeWebhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is required");
if (!bridgeToken) throw new Error("BRIDGE_TOKEN is required");

const stripe = new Stripe(stripeSecretKey);
const store = new FileStore(dataFile);
const app = express();

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], stripeWebhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await handleCheckoutPaid(event.data.object, event.id);
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler failed:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "warriders-store-api" });
});

app.post("/api/create-checkout-session", async (req, res) => {
  const productId = String(req.body?.productId || "");
  const minecraftName = String(req.body?.minecraftName || "").trim();
  const product = getProduct(productId);

  if (!product) return res.status(404).json({ error: "Unknown product." });
  if (!validMinecraftName(minecraftName)) {
    return res.status(400).json({ error: "Minecraft username must be 3-16 letters, numbers, or underscores." });
  }

  const orderId = crypto.randomUUID();
  const successUrl = `${publicSiteUrl}/pages/store-success.html?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${publicSiteUrl}/pages/store-cancel.html`;

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: orderId,
        line_items: [checkoutLineItem(product)],
        metadata: {
          orderId,
          productId: product.id,
          minecraftName,
          targetServer: product.targetServer
        }
      },
      { idempotencyKey: `checkout:${orderId}` }
    );

    await store.update((state) => {
      state.orders.push({
        id: orderId,
        stripeSessionId: session.id,
        productId: product.id,
        minecraftName,
        targetServer: product.targetServer,
        amountCents: product.amountCents,
        currency: product.currency,
        status: "checkout_created",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout creation failed:", err);
    res.status(500).json({ error: "Could not create Stripe checkout session." });
  }
});

app.get("/api/deliveries/pending", requireBridgeAuth, async (req, res) => {
  const serverId = String(req.query.server || "survival");
  const staleBefore = Date.now() - 2 * 60 * 1000;
  const now = new Date().toISOString();

  const deliveries = await store.update((state) => {
    const pending = state.deliveries
      .filter((delivery) => {
        if (delivery.targetServer !== serverId) return false;
        if (delivery.status === "pending") return true;
        if (delivery.status !== "processing" || !delivery.processingAt) return false;
        return Date.parse(delivery.processingAt) < staleBefore;
      })
      .slice(0, 10);

    for (const delivery of pending) {
      delivery.status = "processing";
      delivery.processingAt = now;
      delivery.updatedAt = now;
      delivery.attempts = Number(delivery.attempts || 0) + 1;
    }

    return pending.map(publicDelivery);
  });

  res.json({ deliveries });
});

app.post("/api/deliveries/:id/complete", requireBridgeAuth, async (req, res) => {
  const deliveryId = String(req.params.id || "");
  const success = Boolean(req.body?.success);
  const message = String(req.body?.message || "").slice(0, 1000);
  const now = new Date().toISOString();

  const result = await store.update((state) => {
    const delivery = state.deliveries.find((item) => item.id === deliveryId);
    if (!delivery) return { found: false };

    delivery.status = success ? "delivered" : "failed";
    delivery.completedAt = now;
    delivery.updatedAt = now;
    delivery.message = message;

    const order = state.orders.find((item) => item.id === delivery.orderId);
    if (order) {
      order.status = success ? "delivered" : "delivery_failed";
      order.updatedAt = now;
      order.deliveryMessage = message;
    }

    return { found: true, delivery: publicDelivery(delivery) };
  });

  if (!result.found) return res.status(404).json({ error: "Delivery not found." });
  res.json({ ok: true, delivery: result.delivery });
});

app.post("/api/deliveries/:id/retry", requireBridgeAuth, async (req, res) => {
  const deliveryId = String(req.params.id || "");
  const now = new Date().toISOString();

  const result = await store.update((state) => {
    const delivery = state.deliveries.find((item) => item.id === deliveryId);
    if (!delivery) return { found: false };
    delivery.status = "pending";
    delivery.updatedAt = now;
    delivery.message = "Manually queued for retry.";
    return { found: true, delivery: publicDelivery(delivery) };
  });

  if (!result.found) return res.status(404).json({ error: "Delivery not found." });
  res.json({ ok: true, delivery: result.delivery });
});

app.listen(port, () => {
  console.log(`War Riders Store API listening on ${port}`);
});

async function handleCheckoutPaid(session, stripeEventId) {
  if (session.payment_status !== "paid") return;

  const orderId = session.metadata?.orderId || session.client_reference_id;
  const productId = session.metadata?.productId;
  const minecraftName = session.metadata?.minecraftName;
  const product = getProduct(productId);

  if (!orderId || !product || !validMinecraftName(minecraftName || "")) {
    throw new Error(`Invalid paid checkout metadata for session ${session.id}`);
  }

  const now = new Date().toISOString();

  await store.update((state) => {
    let order = state.orders.find((item) => item.id === orderId);
    if (!order) {
      order = {
        id: orderId,
        stripeSessionId: session.id,
        productId: product.id,
        minecraftName,
        targetServer: product.targetServer,
        amountCents: product.amountCents,
        currency: product.currency,
        createdAt: now
      };
      state.orders.push(order);
    }

    order.status = "paid";
    order.updatedAt = now;
    order.stripePaymentIntentId = session.payment_intent || "";
    order.stripeEventId = stripeEventId;

    const existingDelivery = state.deliveries.find((delivery) => delivery.orderId === orderId);
    if (!existingDelivery) {
      state.deliveries.push({
        id: crypto.randomUUID(),
        orderId,
        stripeSessionId: session.id,
        productId: product.id,
        minecraftName,
        targetServer: product.targetServer,
        commands: product.commands,
        status: "pending",
        attempts: 0,
        createdAt: now,
        updatedAt: now
      });
    }
  });
}

function requireBridgeAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!safeEqual(token, bridgeToken)) return res.status(401).json({ error: "Unauthorized." });
  next();
}

function checkoutLineItem(product) {
  if (product.stripePriceId) {
    return {
      quantity: 1,
      price: product.stripePriceId
    };
  }

  return {
    quantity: 1,
    price_data: {
      currency: product.currency,
      unit_amount: product.amountCents,
      product_data: {
        name: product.name,
        description: product.description
      }
    }
  };
}

function publicDelivery(delivery) {
  return {
    id: delivery.id,
    orderId: delivery.orderId,
    productId: delivery.productId,
    minecraftName: delivery.minecraftName,
    targetServer: delivery.targetServer,
    commands: delivery.commands,
    attempts: delivery.attempts
  };
}

function validMinecraftName(name) {
  return /^[A-Za-z0-9_]{3,16}$/.test(String(name));
}

function trimTrailingSlash(value) {
  return String(value).replace(/\/+$/, "");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
