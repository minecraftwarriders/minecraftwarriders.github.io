(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const state = { data: null, selected: null };

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

  function setStatus(message, isError = false) {
    const el = $("#coinCheckoutStatus");
    if (!el) return;
    el.textContent = message || "";
    el.style.color = isError ? "var(--bad)" : "var(--muted)";
  }

  function selectBundle(id) {
    const product = (state.data?.products || []).find((item) => item.id === id);
    if (!product) return;
    state.selected = product;
    $("#coinSelectedName").textContent = product.name;
    $("#coinSelectedAmount").textContent = `${Number(product.coins || 0).toLocaleString()} coins`;
    $("#coinSelectedPrice").textContent = fmtMoney(product.price, product.currency || "USD");
    $$("[data-coin-buy]").forEach((button) => button.classList.toggle("active", button.dataset.coinBuy === id));
    setStatus("Enter your exact Minecraft username, then pay for this coin bundle.");
    $("#coinCheckout")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function startCheckout() {
    if (!state.selected) {
      setStatus("Choose a coin bundle first.", true);
      return;
    }

    const apiBaseUrl = getStoreApiBaseUrl();
    if (!apiBaseUrl) {
      setStatus("Payments are not available yet. Please check back soon.", true);
      return;
    }

    const minecraftName = ($("#coinMinecraftName")?.value || "").trim();
    if (!validMinecraftName(minecraftName)) {
      setStatus("Enter a valid Minecraft username: 3-16 letters, numbers, or underscores.", true);
      return;
    }

    const button = $("#coinCheckoutButton");
    if (button) {
      button.disabled = true;
      button.textContent = "Opening payment...";
    }
    setStatus("Opening secure payment...");

    try {
      const res = await fetch(`${apiBaseUrl}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: state.selected.id, minecraftName }),
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

    $$("[data-coin-buy]").forEach((button) => {
      button.addEventListener("click", () => selectBundle(button.dataset.coinBuy || ""));
    });

    $("#coinCheckoutForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      startCheckout();
    });

    selectBundle(new URLSearchParams(window.location.search).get("bundle") || "coin-little-treat");
  }

  init().catch(() => setStatus("Coin bundles could not load. Please refresh the page.", true));
})();
