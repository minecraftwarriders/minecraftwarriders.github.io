(() => {
  // Lightweight: mark active nav link by pathname
  const path = window.location.pathname;
  document.querySelectorAll("[data-nav]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!href) return;
    // Normalize: treat /pages/items.html same as ending with items.html
    if (path.endsWith(href.replace("./", "/").replace("../", "/")) || path.endsWith(href.split("/").pop() || "")) {
      a.classList.add("active");
    }
  });

  // Cmd/Ctrl+K focuses the most relevant search input (if present)
  const focusSearch = () => {
    const el =
      document.getElementById("storeSearch") ||
      document.getElementById("globalSearch") ||
      document.getElementById("searchInput") ||
      document.querySelector('input[type="search"]:not([disabled])');
    if (el) {
      el.focus();
      el.select?.();
    }
  };
  document.addEventListener("keydown", (e) => {
    const isK = (e.key || "").toLowerCase() === "k";
    const mod = e.metaKey || e.ctrlKey;
    if (mod && isK) {
      e.preventDefault();
      focusSearch();
    }
  });

  // Click-to-copy helpers
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    }
  }

  document.querySelectorAll("[data-copy]").forEach((el) => {
    el.addEventListener("click", async () => {
      const text = el.getAttribute("data-copy") || "";
      if (!text) return;
      const ok = await copyText(text);
      const badge = el.querySelector("[data-copy-badge]");
      if (badge) {
        const prev = badge.textContent;
        badge.textContent = ok ? "COPIED" : "FAILED";
        setTimeout(() => (badge.textContent = prev), 900);
      }
    });
  });
})();

