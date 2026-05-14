(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const state = { data: null, product: null };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const fmtMoney = (value, currency = "USD") => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "";
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
    } catch {
      return `${n.toFixed(2)} ${currency}`;
    }
  };

  function categoryLabel(product, categories) {
    return categories.find((category) => category.id === product.category)?.label || product.category || "Cosmetic";
  }

  function getStoreApiBaseUrl() {
    const configured = state.data?.meta?.purchase?.apiBaseUrl || window.WAR_RIDERS_STORE_API_URL || "";
    return String(configured).replace(/\/+$/, "");
  }

  function validMinecraftName(name) {
    return /^[A-Za-z0-9_]{3,16}$/.test(name);
  }

  function setCheckoutStatus(message, isError = false) {
    const el = $("#productCheckoutStatus");
    if (!el) return;
    el.textContent = message || "";
    el.style.color = isError ? "#9f1d2f" : "rgba(23, 19, 15, 0.68)";
  }

  function resetCheckoutButton() {
    const button = $("#productCheckoutButton");
    if (!button) return;
    button.disabled = false;
    button.textContent = "Pay";
  }

  async function startCheckout() {
    const apiBaseUrl = getStoreApiBaseUrl();
    if (!apiBaseUrl) {
      setCheckoutStatus("Payments are not available yet. Please check back soon.", true);
      return;
    }

    const minecraftName = ($("#productMinecraftName")?.value || "").trim();
    if (!validMinecraftName(minecraftName)) {
      setCheckoutStatus("Enter a valid Minecraft username: 3-16 letters, numbers, or underscores.", true);
      return;
    }

    const productId = state.product?.id;
    if (!productId) {
      setCheckoutStatus("Choose an item before checking out.", true);
      return;
    }

    const button = $("#productCheckoutButton");
    if (button) {
      button.disabled = true;
      button.textContent = "Opening payment...";
    }
    setCheckoutStatus("Opening secure payment...");

    try {
      const res = await fetch(`${apiBaseUrl}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, minecraftName }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.url) {
        throw new Error(payload.error || `Payment returned HTTP ${res.status}.`);
      }
      window.location.assign(payload.url);
    } catch (err) {
      setCheckoutStatus(`Payment is not available right now. ${String(err?.message || err)}`, true);
      resetCheckoutButton();
    }
  }

  function renderMissing() {
    const target = $("#productDetail");
    if (!target) return;
    target.innerHTML = `
      <section class="hero-card page-hero">
        <div>
          <div class="kicker">Cosmetic Not Found</div>
          <h1>That cosmetic is not in the catalog.</h1>
          <p>Return to the store and pick a current cosmetic.</p>
          <div class="hero-actions">
            <a class="btn primary" href="./store.html">Back to Store</a>
          </div>
        </div>
      </section>
    `;
  }

  function renderProduct(product, categories) {
    const target = $("#productDetail");
    if (!target) return;

    const price = fmtMoney(product.price, product.currency || "USD");
    const coinPrice = Number(product.coinPrice);
    const coinText = Number.isFinite(coinPrice) ? `${coinPrice.toLocaleString()} coins in-game` : "";
    const includes = Array.isArray(product.includes) ? product.includes : [];
    const image = product.image || "../assets/images/war-riders-store-bg.png";
    const label = categoryLabel(product, categories);
    const shortLabel = String(label || "Cosmetic").replace("Chat Tags", "Tag");

    document.title = `${product.name} - Minecraft War Riders`;
    target.innerHTML = `
      <div class="crumbs"><a href="../index.html">Home</a> › <a href="./store.html">Store</a> › <span>${escapeHtml(product.name)}</span></div>
      <section class="product-page">
        <div class="product-gallery">
          <div class="product-main-image">
            <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)} cosmetic preview" />
          </div>
        </div>

        <aside class="product-buy-box">
          <div class="product-rating">
            <span>5.0 style score</span>
            <span>Cosmetic only</span>
          </div>
          <h1>${escapeHtml(product.name)}</h1>
          <div class="product-price-line">
            <span class="product-old-price">${escapeHtml(fmtMoney(Number(product.price) * 1.35, product.currency || "USD"))}</span>
            <strong>${escapeHtml(price)}</strong>
          </div>
          <div class="product-field">
            <span>Color</span>
            <strong>${escapeHtml(product.badge || product.name)}</strong>
          </div>
          <div class="product-field">
            <span>Type</span>
            <div class="product-options">
              <span class="product-option active">${escapeHtml(shortLabel)}</span>
              <span class="product-option">Permanent</span>
              <span class="product-option">No P2W</span>
            </div>
          </div>
          <p class="product-description">${escapeHtml(product.description || "A cosmetic unlock for your player.")}</p>
          <form id="productCheckoutForm" class="product-checkout-form">
            <label for="productMinecraftName">Minecraft username</label>
            <input
              id="productMinecraftName"
              name="minecraftName"
              type="text"
              autocomplete="username"
              inputmode="text"
              minlength="3"
              maxlength="16"
              pattern="[A-Za-z0-9_]{3,16}"
              placeholder="Your in-game name"
              required
            />
            <div class="product-actions">
              <button id="productCheckoutButton" class="btn primary" type="submit">Pay</button>
              <a class="btn" href="./store.html">Back to Store</a>
            </div>
            <div id="productCheckoutStatus" class="product-checkout-status" role="status" aria-live="polite">
              Enter your exact Minecraft username. Once your order is confirmed, this cosmetic is added to your player.
            </div>
          </form>
          <div class="product-delivery">Once your order is confirmed, this cosmetic is added to your player automatically.</div>
          ${coinText ? `<div class="product-coin-price">${escapeHtml(coinText)}</div>` : ""}
        </aside>
      </section>

      <section class="product-feature-row" aria-label="Cosmetic details">
        <div class="product-feature">
          <div class="product-feature-mark">MC</div>
          <strong>In-Game Style</strong>
          <span>Made to feel like it belongs in Minecraft.</span>
        </div>
        <div class="product-feature">
          <div class="product-feature-mark">TYPE</div>
          <strong>${escapeHtml(shortLabel)}</strong>
          <span>${escapeHtml(includes[0] || "Cosmetic unlock")}</span>
        </div>
        <div class="product-feature">
          <div class="product-feature-mark">OK</div>
          <strong>Order Confirmed</strong>
          <span>Added to your player automatically.</span>
        </div>
        <div class="product-feature">
          <div class="product-feature-mark">COIN</div>
          <strong>Coin Option</strong>
          <span>${escapeHtml(coinText || "Available in the store")}</span>
        </div>
      </section>
    `;

    $("#productCheckoutForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      startCheckout();
    });
  }

  async function init() {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      renderMissing();
      return;
    }

    const response = await fetch("../assets/store.json", { cache: "no-store" });
    const data = await response.json();
    state.data = data;
    const products = (data.products || []).filter((product) => product.displayInStore !== false);
    const product = products.find((item) => item.id === id);
    if (!product) {
      renderMissing();
      return;
    }
    state.product = product;
    renderProduct(product, data.categories || []);
  }

  init().catch(renderMissing);
})();
