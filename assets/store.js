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
    const filtered = products.filter(productMatches);
    grid.innerHTML = filtered
      .map((p) => {
        const badge = (p.badge || "").trim();
        const catLabel = categoriesById.get(p.category)?.label || p.category;
        return `
          <div class="item-card" data-prod="${escapeHtml(p.id)}">
            <div class="item-header">
              <div class="item-icon" aria-hidden="true">
                <img class="item-icon-img" src="${escapeHtml(p.image || "")}" alt="" loading="lazy" decoding="async" />
              </div>
              <div class="item-info">
                <div class="item-name">${escapeHtml(p.name)}</div>
                <div class="item-category">${escapeHtml(catLabel)}</div>
              </div>
            </div>
            <div style="display:flex; gap:10px; align-items:center; justify-content:space-between;">
              <div>
                <div class="price-label">Price</div>
                <div class="price-value">${escapeHtml(fmtMoney(p.price, p.currency || "USD"))}</div>
              </div>
              ${badge ? `<span class="pill warn">${escapeHtml(badge)}</span>` : `<span class="pill">Cosmetic</span>`}
            </div>
            <div style="margin-top:10px; color:var(--muted); font-size:12px; line-height:1.5;">
              ${escapeHtml(p.description || "")}
            </div>
            <div style="margin-top:12px; display:flex; gap:10px;">
              <button class="btn primary" data-buy="${escapeHtml(p.id)}">Buy</button>
              <button class="btn" data-details="${escapeHtml(p.id)}">Details</button>
            </div>
          </div>
        `;
      })
      .join("");

    if (empty) empty.style.display = filtered.length ? "none" : "block";

    $$("[data-buy]", grid).forEach((b) => b.addEventListener("click", () => openModal(b.dataset.buy || "")));
    $$("[data-details]", grid).forEach((b) =>
      b.addEventListener("click", () => openModal(b.dataset.details || "", { focusDetails: true })),
    );
  }

  function setCheckoutStatus(message, isError = false) {
    const el = $("#checkoutStatus");
    if (!el) return;
    el.textContent = message || "";
    el.style.color = isError ? "var(--bad)" : "var(--muted)";
  }

  function getStoreApiBaseUrl() {
    const configured = state.data?.meta?.purchase?.apiBaseUrl || window.WAR_RIDERS_STORE_API_URL || "";
    return String(configured).replace(/\/+$/, "");
  }

  function validMinecraftName(name) {
    return /^[A-Za-z0-9_]{3,16}$/.test(name);
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

    $("#modalTitle").textContent = p.name || "Purchase";
    $("#modalPrice").textContent = fmtMoney(p.price, p.currency || "USD");
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
    setCheckoutStatus("");

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
    if (!apiBaseUrl) {
      setCheckoutStatus("Store checkout is not configured yet. Set meta.purchase.apiBaseUrl in assets/store.json.", true);
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
      button.textContent = "Opening Stripe...";
    }
    setCheckoutStatus("Creating secure Stripe checkout...");

    try {
      const res = await fetch(`${apiBaseUrl}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, minecraftName }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.url) {
        throw new Error(payload.error || "Checkout failed. Please try again.");
      }
      window.location.assign(payload.url);
    } catch (err) {
      setCheckoutStatus(String(err?.message || err), true);
      if (button) {
        button.disabled = false;
        button.textContent = "Checkout with Stripe";
      }
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

    $("#storeTitle").textContent = data.meta?.title || "Store";
    $("#storeSub").textContent = data.meta?.subtitle || "";

    renderChips(data.categories || []);
    render();

    $("#storeSearch")?.addEventListener("input", (e) => setQuery(e.target.value || ""));
  }

  init().catch((err) => {
    const el = $("#storeError");
    if (el) el.textContent = `Failed to load store config: ${String(err)}`;
  });
})();

