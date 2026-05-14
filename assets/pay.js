(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const state = { data: null, products: [] };

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

  function getStoreApiBaseUrl() {
    const configured = state.data?.meta?.purchase?.apiBaseUrl || window.WAR_RIDERS_STORE_API_URL || "";
    return String(configured).replace(/\/+$/, "");
  }

  function validMinecraftName(name) {
    return /^[A-Za-z0-9_]{3,16}$/.test(name);
  }

  function cartIds() {
    return window.WarRidersCart?.read?.() || [];
  }

  function findProduct(id) {
    return state.products.find((product) => product.id === id);
  }

  function groupedItems() {
    const groups = [];
    for (const id of cartIds()) {
      const product = findProduct(id);
      if (!product) continue;
      const existing = groups.find((group) => group.product.id === id);
      if (existing) existing.quantity += 1;
      else groups.push({ product, quantity: 1 });
    }
    return groups;
  }

  function setStatus(message, isError = false) {
    const el = $("#payStatus");
    if (!el) return;
    el.textContent = message || "";
    el.style.color = isError ? "var(--bad)" : "var(--muted)";
  }

  function render() {
    const list = $("#payItems");
    const empty = $("#payEmpty");
    const form = $("#payForm");
    const groups = groupedItems();
    if (!list || !empty || !form) return;

    if (!groups.length) {
      list.innerHTML = "";
      empty.style.display = "block";
      form.style.display = "none";
      $("#payTotal").textContent = "$0.00";
      return;
    }

    empty.style.display = "none";
    form.style.display = "grid";
    list.innerHTML = groups
      .map(({ product, quantity }) => {
        const unit = Number(product.price || 0);
        const lineTotal = unit * quantity;
        return `
          <article class="pay-item">
            <img src="${escapeHtml(product.image || "../assets/images/war-riders-store-bg.png")}" alt="" />
            <div>
              <strong>${escapeHtml(product.name)}</strong>
              <span>${escapeHtml(product.category === "coins" ? `${Number(product.coins || 0).toLocaleString()} coins` : product.description || "Cosmetic unlock")}</span>
              <button class="link-button" type="button" data-remove="${escapeHtml(product.id)}">Remove one</button>
            </div>
            <div class="pay-item-price">
              <strong>${escapeHtml(fmtMoney(lineTotal, product.currency || "USD"))}</strong>
              <span>${quantity > 1 ? `Qty ${quantity}` : fmtMoney(unit, product.currency || "USD")}</span>
            </div>
          </article>
        `;
      })
      .join("");

    const total = groups.reduce((sum, group) => sum + Number(group.product.price || 0) * group.quantity, 0);
    $("#payTotal").textContent = fmtMoney(total, groups[0]?.product.currency || "USD");
    list.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        const ids = cartIds();
        const index = ids.indexOf(button.dataset.remove || "");
        if (index >= 0) window.WarRidersCart.removeAt(index);
        render();
      });
    });
  }

  async function startCheckout() {
    const productIds = cartIds().filter((id) => findProduct(id));
    if (!productIds.length) {
      setStatus("Your order is empty.", true);
      return;
    }

    const minecraftName = ($("#payMinecraftName")?.value || "").trim();
    if (!validMinecraftName(minecraftName)) {
      setStatus("Enter a valid Minecraft username: 3-16 letters, numbers, or underscores.", true);
      return;
    }

    const apiBaseUrl = getStoreApiBaseUrl();
    if (!apiBaseUrl) {
      setStatus("Payments are not available yet. Please check back soon.", true);
      return;
    }

    const button = $("#payButton");
    if (button) {
      button.disabled = true;
      button.textContent = "Opening payment...";
    }
    setStatus("Opening secure payment...");

    try {
      const res = await fetch(`${apiBaseUrl}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, minecraftName }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.url) {
        throw new Error(payload.error || `Payment returned HTTP ${res.status}.`);
      }
      window.location.assign(payload.url);
    } catch (err) {
      setStatus(`Payment is not available right now. ${String(err?.message || err)}`, true);
      if (button) {
        button.disabled = false;
        button.textContent = "Pay";
      }
    }
  }

  async function init() {
    const response = await fetch("../assets/store.json", { cache: "no-store" });
    state.data = await response.json();
    state.products = state.data.products || [];

    const add = new URLSearchParams(window.location.search).get("add");
    if (add) window.WarRidersCart?.add?.(add);

    $("#payForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      startCheckout();
    });
    $("#clearOrder")?.addEventListener("click", () => {
      window.WarRidersCart?.clear?.();
      render();
    });

    render();
  }

  init().catch((err) => setStatus(`Order could not load. ${String(err)}`, true));
})();
