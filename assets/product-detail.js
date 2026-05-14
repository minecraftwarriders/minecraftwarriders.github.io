(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

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

    document.title = `${product.name} - Minecraft War Riders`;
    target.innerHTML = `
      <div class="crumbs"><a href="../index.html">Home</a> › <a href="./store.html">Store</a> › <span>${escapeHtml(product.name)}</span></div>
      <section class="hero-card page-hero product-detail-hero" style="background-image: url('${escapeHtml(image)}')">
        <div class="detail-panel">
          <div>
            <div class="kicker">${escapeHtml(label)}</div>
            <h1>${escapeHtml(product.name)}</h1>
            <p>${escapeHtml(product.description || "")}</p>
          </div>
          <div class="detail-meta">
            <span class="pill good">Cosmetic only</span>
            <span class="pill">${escapeHtml(price)}</span>
            ${coinText ? `<span class="pill">${escapeHtml(coinText)}</span>` : ""}
            ${product.badge ? `<span class="pill warn">${escapeHtml(product.badge)}</span>` : ""}
          </div>
          <div class="hero-actions">
            <a class="btn primary" href="./store.html?product=${encodeURIComponent(product.id)}">Buy ${escapeHtml(product.name)}</a>
            <a class="btn" href="./store.html">Back to Store</a>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="detail-section-grid">
          <div class="detail-section">
            <h2>What It Is</h2>
            <p>${escapeHtml(product.description || "A cosmetic unlock for your player.")}</p>
          </div>
          <div class="detail-section">
            <h2>What You Get</h2>
            <p>${includes.map(escapeHtml).join(", ") || "Permanent cosmetic unlock."}</p>
          </div>
          <div class="detail-section">
            <h2>After Purchase</h2>
            <p>Once your order is confirmed, this cosmetic is added to your player automatically.</p>
          </div>
        </div>
      </section>
    `;
  }

  async function init() {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      renderMissing();
      return;
    }

    const response = await fetch("../assets/store.json", { cache: "no-store" });
    const data = await response.json();
    const products = (data.products || []).filter((product) => product.displayInStore !== false);
    const product = products.find((item) => item.id === id);
    if (!product) {
      renderMissing();
      return;
    }
    renderProduct(product, data.categories || []);
  }

  init().catch(renderMissing);
})();
