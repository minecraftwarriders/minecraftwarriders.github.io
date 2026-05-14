# War Riders Store Setup

This repo now has three store pieces:

- `pages/store.html` + `assets/store.js`: the GitHub Pages storefront.
- `store-api/`: the public Stripe API and paid-delivery queue.
- `paper-store-bridge/`: the Paper plugin that polls the API and applies grants.

Players still connect to Minecraft through:

```txt
panda.cloudns.nz -> Raspberry Pi BungeeCord proxy -> Paper server
```

Purchases flow through:

```txt
GitHub Pages store -> Store API -> Stripe Checkout -> Stripe webhook -> delivery queue -> Paper StoreBridge -> LuckPerms/cosmetic permissions
```

## 1. Storefront

The store catalog shown to players is `assets/store.json`.

Set this value to the public URL where `store-api` is hosted:

```json
"apiBaseUrl": "https://store-api.minecraftwarriders.com"
```

The browser sends only:

```json
{
  "productId": "trail-personal-sunshine",
  "minecraftName": "PlayerName"
}
```

The browser does not contain Stripe secrets or grant commands.

## 2. Store API

Deploy `store-api/` somewhere public with HTTPS. Stripe webhooks must be able to reach it.

Install and run:

```sh
cd store-api
npm install
cp .env.example .env
npm start
```

Required `.env` values:

```txt
PORT=8787
PUBLIC_SITE_URL=https://minecraftwarriders.github.io
CORS_ORIGIN=https://minecraftwarriders.github.io
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
BRIDGE_TOKEN=use-a-long-random-secret
DATA_FILE=./data/orders.json
```

If you create products/prices in Stripe, put the `price_...` IDs in `.env`:

```txt
STRIPE_PRICE_TRAIL_PERSONAL_SUNSHINE=price_...
STRIPE_PRICE_PET_BUSINESS_CAT=price_...
STRIPE_PRICE_HAT_FEDORA=price_...
STRIPE_PRICE_TAG_DOING_MY_BEST=price_...
```

Do not use `prod_...` IDs or `buy.stripe.com` Payment Link URLs for the API checkout. The API creates Checkout Sessions directly so it can attach the Minecraft username, product ID, order ID, and delivery target to Stripe metadata.

Create a Stripe webhook endpoint:

```txt
https://store-api.minecraftwarriders.com/api/stripe/webhook
```

Subscribe to:

```txt
checkout.session.completed
checkout.session.async_payment_succeeded
```

The API creates Stripe Checkout sessions using the server-side catalog in:

```txt
store-api/src/catalog.js
```

This is where prices, delivery target, and grant commands live.

## 3. Paper StoreBridge

Build the plugin:

```sh
cd paper-store-bridge
mvn package
```

Copy the built jar to the Paper server:

```txt
paper-store-bridge/target/paper-store-bridge-1.0.0.jar
```

Place it in:

```txt
plugins/
```

Restart Paper once so it creates:

```txt
plugins/WarRidersStoreBridge/config.yml
```

Then configure:

```yaml
api-base-url: "https://store-api.minecraftwarriders.com"
bridge-token: "same value as BRIDGE_TOKEN"
server-id: "survival"
poll-interval-seconds: 20
```

The plugin polls:

```txt
GET /api/deliveries/pending?server=survival
```

Then runs commands from console, for example:

```txt
lp user PlayerName parent add knight
lp user PlayerName permission set warriders.cosmetic.rank.knight true
```

## 4. LuckPerms Plan

Right now LuckPerms is on Paper only, so the first version should grant on Paper.

For a hub and future servers, use LuckPerms on:

- BungeeCord
- survival Paper
- hub Paper
- future Paper servers

Point all of them at the same SQL database, then use server/context-specific permissions where needed:

```txt
lp user PlayerName permission set warriders.cosmetic.trail.personal_sunshine true server=survival
lp user PlayerName permission set warriders.cosmetic.hub.glow true server=hub
lp user PlayerName permission set warriders.cosmetic.tag.doing_my_best true
```

Keep BungeeCord on the Raspberry Pi as the proxy. It does not need Stripe code.

## 5. Product Grants

Current server-side product grants are in `store-api/src/catalog.js`.

Example:

```js
{
  id: "trail-personal-sunshine",
  targetServer: "survival",
  commands: ["lp user {player} permission set warriders.cosmetic.trail.personal_sunshine true"]
}
```

Use `{player}` exactly. The Paper plugin replaces it with the buyer's Minecraft username.

## 6. Going Live Checklist

- Rotate any Stripe secret or restricted keys that were pasted into chat, Discord, screenshots, or docs.
- Deploy `store-api` to a public HTTPS host.
- Set real Stripe secret and webhook secrets.
- Change `assets/store.json` `apiBaseUrl` to the deployed API URL.
- Build and install `paper-store-bridge` on the Paper server.
- Set the same long random token in both `.env` and plugin `config.yml`.
- Confirm LuckPerms commands work from the Paper console.
- Make a Stripe test-mode purchase before using live mode.
