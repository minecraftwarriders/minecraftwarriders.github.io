(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const fmtMoney = (n, currency = "USD") => {
    const v = Number(n);
    if (!Number.isFinite(v)) return "—";
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v);
    } catch {
      return `${v.toFixed(2)} ${currency}`;
    }
  };

  const escapeHtml = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const state = { data: null, category: "all", q: "", selectedProductId: "" };

  function setCategory(cat) {
    state.category = cat;
    $$(".chip[data-cat]").forEach((c) => c.classList.toggle("active", c.dataset.cat === cat));
    render();
  }

  function setQuery(q) {
    state.q = q.trim().toLowerCase();
    render();
  }

  function productMatches(p) {
    if (state.category !== "all" && p.category !== state.category) return false;
    if (!state.q) return true;
    const hay = `${p.name} ${p.description} ${(p.includes || []).join(" ")}`.toLowerCase();
    return hay.includes(state.q);
  }

  function renderChips(categories) {
    const row = $("#storeCats");
    if (!row) return;
    row.innerHTML = [
      `<div class="chip active" data-cat="all">All</div>`,
      ...categories.map((c) => `<div class="chip" data-cat="${escapeHtml(c.id)}">${escapeHtml(c.label)}</div>`),
    ].join("");
    $$(".chip[data-cat]", row).forEach((c) => c.addEventListener("click", () => setCategory(c.dataset.cat || "all")));
  }

  function renderGrid(products, categoriesById) {
    const grid = $("#storeGrid");
    const empty = $("#storeEmpty");
    if (!grid) return;
    const filtered = products.filter((p) => p.displayInStore !== false).filter(productMatches);
    grid.innerHTML = filtered
      .map((p) => {
        const badge = (p.badge || "").trim();
        const catLabel = categoriesById.get(p.category)?.label || p.category;
        const coinPrice = Number(p.coinPrice);
        const coinLabel = Number.isFinite(coinPrice) ? `${coinPrice.toLocaleString()} coins in-game` : "";
        const detailHref = `./cosmetic.html?id=${encodeURIComponent(p.id)}`;
        return `
          <div class="item-card" data-prod="${escapeHtml(p.id)}">
            <a class="item-header" href="${escapeHtml(detailHref)}" aria-label="View ${escapeHtml(p.name)} details">
              <div class="item-icon" aria-hidden="true">
                <img class="item-icon-img" src="${escapeHtml(p.image || "")}" alt="" loading="lazy" decoding="async" />
              </div>
              <div class="item-info">
                <div class="item-name">${escapeHtml(p.name)}</div>
                <div class="item-category">${escapeHtml(catLabel)}</div>
              </div>
            </a>
            <div class="item-card-body">
              <div class="item-price-row">
                <div>
                  <div class="price-label">Price</div>
                  <div class="price-value">${escapeHtml(fmtMoney(p.price, p.currency || "USD"))}</div>
                  ${coinLabel ? `<div class="coin-value">${escapeHtml(coinLabel)}</div>` : ""}
                </div>
                ${badge ? `<span class="pill warn">${escapeHtml(badge)}</span>` : `<span class="pill">Cosmetic</span>`}
              </div>
              <p class="item-description">${escapeHtml(p.description || "")}</p>
            </div>
            <div class="item-actions">
              <a class="btn primary" href="${escapeHtml(detailHref)}">Buy</a>
              <a class="btn" href="${escapeHtml(detailHref)}">Details</a>
            </div>
          </div>
        `;
      })
      .join("");

    if (empty) empty.style.display = filtered.length ? "none" : "block";
  }

  function setCheckoutStatus(message, isError = false) {
    const el = $("#checkoutStatus");
    if (!el) return;
    el.textContent = message || "";
    el.style.color = isError ? "var(--bad)" : "var(--muted)";
  }

  function setCheckoutNotice(message, isError = false) {
    const el = $("#storeCheckoutNotice");
    if (!el) return;
    el.textContent = message || "";
    el.style.display = message ? "block" : "none";
    el.style.color = isError ? "var(--bad)" : "var(--ok)";
  }

  function getStoreApiBaseUrl() {
    const configured = state.data?.meta?.purchase?.apiBaseUrl || window.WAR_RIDERS_STORE_API_URL || "";
    return String(configured).replace(/\/+$/, "");
  }

  function checkoutIsConfigured() {
    const apiBaseUrl = getStoreApiBaseUrl();
    return Boolean(apiBaseUrl);
  }

  function validMinecraftName(name) {
    return /^[A-Za-z0-9_]{3,16}$/.test(name);
  }

  function resetCheckoutButton() {
    const button = $("#checkoutButton");
    if (!button) return;
    button.disabled = false;
    button.textContent = "Pay";
  }

  function openModal(id) {
    const data = state.data;
    if (!data) return;
    const p = (data.products || []).find((x) => x.id === id);
    if (!p) return;
    state.selectedProductId = p.id;

    const backdrop = $("#buyModal");
    if (!backdrop) return;

    const meta = data.meta || {};
    const purchase = meta.purchase || {};
    const instructions = Array.isArray(purchase.instructions) ? purchase.instructions : [];
    const configured = checkoutIsConfigured();

    $("#modalTitle").textContent = p.name || "Purchase";
    const coinPrice = Number(p.coinPrice);
    $("#modalPrice").textContent = Number.isFinite(coinPrice)
      ? `${fmtMoney(p.price, p.currency || "USD")} or ${coinPrice.toLocaleString()} coins in-game`
      : fmtMoney(p.price, p.currency || "USD");
    $("#modalDesc").textContent = p.description || "";
    $("#modalIncludes").innerHTML = (p.includes || [])
      .map((x) => `<li style="margin:6px 0; color:var(--muted); font-size:13px;">${escapeHtml(x)}</li>`)
      .join("");

    $("#modalMethod").textContent = purchase.methodLabel || "Purchase method";
    $("#modalSteps").innerHTML = instructions
      .map((x) => `<li style="margin:6px 0; color:var(--muted); font-size:13px;">${escapeHtml(x)}</li>`)
      .join("");

    const nameInput = $("#minecraftName");
    if (nameInput) nameInput.value = "";
    resetCheckoutButton();
    setCheckoutStatus(
      configured
        ? "Next: enter your exact Minecraft username. Once your order is confirmed, this is added to your player."
        : "Payments are not available yet. You can still browse the store."
    );

    backdrop.classList.add("open");
    backdrop.setAttribute("aria-hidden", "false");
    setTimeout(() => nameInput?.focus(), 0);
  }

  function closeModal() {
    const backdrop = $("#buyModal");
    if (!backdrop) return;
    backdrop.classList.remove("open");
    backdrop.setAttribute("aria-hidden", "true");
  }

  function wireModal() {
    const backdrop = $("#buyModal");
    if (!backdrop) return;
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });
    $("#modalClose")?.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && backdrop.classList.contains("open")) closeModal();
    });
  }

  async function startCheckout() {
    const apiBaseUrl = getStoreApiBaseUrl();
    if (!checkoutIsConfigured()) {
      setCheckoutStatus("Payments are not available yet. Please check back soon.", true);
      return;
    }

    const minecraftName = ($("#minecraftName")?.value || "").trim();
    if (!validMinecraftName(minecraftName)) {
      setCheckoutStatus("Enter a valid Minecraft username: 3-16 letters, numbers, or underscores.", true);
      return;
    }

    const productId = state.selectedProductId;
    if (!productId) {
      setCheckoutStatus("Choose an item before checking out.", true);
      return;
    }

    const button = $("#checkoutButton");
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
      if (button) {
        button.disabled = false;
        button.textContent = "Pay";
      }
    }
  }

  async function checkCheckoutHealth() {
    const apiBaseUrl = getStoreApiBaseUrl();
    if (!apiBaseUrl) {
      setCheckoutNotice("Payments are not available yet. You can still browse the store.", true);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/health`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCheckoutNotice("Payments are online. Once an order is confirmed, it is added to your player.");
    } catch {
      setCheckoutNotice("Payments are temporarily unavailable. You can still browse the store.", true);
    }
  }

  function render() {
    const data = state.data;
    if (!data) return;
    const categories = data.categories || [];
    const products = data.products || [];
    const byId = new Map(categories.map((c) => [c.id, c]));
    renderGrid(products, byId);
  }

  async function init() {
    wireModal();
    $("#checkoutForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      startCheckout();
    });

    const res = await fetch("../assets/store.json", { cache: "no-store" });
    const data = await res.json();
    state.data = data;

    const title = $("#storeTitle");
    const subtitle = $("#storeSub");
    if (title && !title.dataset.staticTitle) title.textContent = data.meta?.title || "Store";
    if (subtitle && !subtitle.dataset.staticSubtitle) subtitle.textContent = data.meta?.subtitle || "";

    renderChips(data.categories || []);
    render();
    checkCheckoutHealth();

    const searchInputs = [$("#storeSearch"), $("#globalSearch")].filter(Boolean);
    searchInputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        searchInputs.forEach((other) => {
          if (other !== e.target) other.value = e.target.value || "";
        });
        setQuery(e.target.value || "");
      });
    });

  }

  init().catch((err) => {
    const el = $("#storeError");
    if (el) el.textContent = `Failed to load store config: ${String(err)}`;
  });
})();

