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

  function goToPay() {
    if (!state.product?.id) return;
    window.WarRidersCart?.add?.(state.product.id);
    window.location.assign("./pay.html");
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
          <div class="product-actions">
            <button id="productPayButton" class="btn primary" type="button">Pay</button>
            <a class="btn" href="./store.html">Back to Store</a>
          </div>
          <div class="product-delivery">Pay takes this item to the order page, where you can review everything and add more before checkout.</div>
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

    $("#productPayButton")?.addEventListener("click", goToPay);
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
