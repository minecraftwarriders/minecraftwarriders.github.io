(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const state = { product: null };

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

  function renderMissing() {
    const target = $("#coinDetail");
    if (!target) return;
    target.innerHTML = `
      <section class="hero-card page-hero">
        <div>
          <div class="kicker">Coin Bundle Not Found</div>
          <h1>That coin bundle is not available.</h1>
          <p>Return to the coins page and pick a current bundle.</p>
          <div class="hero-actions">
            <a class="btn primary" href="./coins.html">Back to Coins</a>
          </div>
        </div>
      </section>
    `;
  }

  async function goToCart(event) {
    if (!state.product?.id) return;
    const button = event?.currentTarget;
    if (button) {
      button.disabled = true;
      button.textContent = "Added";
    }
    window.WarRidersCart?.add?.(state.product.id);
    await window.WarRidersCart?.animateAdd?.(button, state.product.image);
    window.location.assign("./cart.html");
  }

  function renderProduct(product) {
    const target = $("#coinDetail");
    if (!target) return;

    const image = product.image || "../assets/images/war-riders-store-bg.png";
    const price = fmtMoney(product.price, product.currency || "USD");
    const coins = Number(product.coins || 0).toLocaleString();
    document.title = `${product.name} - Minecraft War Riders Coins`;
    target.innerHTML = `
      <div class="crumbs"><a href="../index.html">Home</a> › <a href="./coins.html">Coins</a> › <span>${escapeHtml(product.name)}</span></div>
      <section class="product-page">
        <div class="product-gallery">
          <div class="product-main-image">
            <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)} coin bundle preview" />
          </div>
        </div>

        <aside class="product-buy-box">
          <div class="product-rating">
            <span>War Riders Coins</span>
            <span>Cosmetic-only currency</span>
          </div>
          <h1>${escapeHtml(product.name)}</h1>
          <div class="product-price-line">
            <strong>${escapeHtml(price)}</strong>
          </div>
          <div class="product-field">
            <span>Bundle</span>
            <strong>${escapeHtml(coins)} coins</strong>
          </div>
          <div class="product-field">
            <span>Use Coins For</span>
            <div class="product-options">
              <span class="product-option active">Trails</span>
              <span class="product-option">Pets</span>
              <span class="product-option">Hats</span>
              <span class="product-option">Tags</span>
            </div>
          </div>
          <p class="product-description">${escapeHtml(product.description || "A War Riders coin bundle.")}</p>
          <div class="product-actions">
            <button id="coinCartButton" class="btn primary" type="button">Add to Cart</button>
            <a class="btn" href="./cart.html">View Cart</a>
            <a class="btn" href="./coins.html">Back to Coins</a>
          </div>
          <div class="product-delivery">Add this bundle to your cart, then review everything together before checkout.</div>
        </aside>
      </section>
    `;
    $("#coinCartButton")?.addEventListener("click", goToCart);
  }

  async function init() {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      renderMissing();
      return;
    }

    const response = await fetch("../assets/store.json", { cache: "no-store" });
    const data = await response.json();
    const product = (data.products || []).find((item) => item.id === id && item.category === "coins");
    if (!product) {
      renderMissing();
      return;
    }

    state.product = product;
    renderProduct(product);
  }

  init().catch(renderMissing);
})();
