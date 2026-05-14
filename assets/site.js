(() => {
  const inPages = window.location.pathname.includes("/pages/");
  const root = inPages ? "../" : "./";
  const page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

  function href(path) {
    return `${root}${path}`;
  }

  function currentKey() {
    if (page === "store.html" || page === "store-success.html" || page === "store-cancel.html") return "store";
    if (page === "items.html") return "items";
    if (page === "wiki.html") return "wiki";
    return "home";
  }

  function menuLink(item, activeKey) {
    const active = item.key === activeKey ? " active" : "";
    return `
      <a class="site-menu-link${active}" href="${item.url}" data-menu-link>
        <div>
          <strong>${item.label}</strong>
          <span>${item.desc}</span>
        </div>
        <span aria-hidden="true">›</span>
      </a>
    `;
  }

  function buildMenu() {
    const topbar = document.querySelector(".topbar");
    const topbarLeft = document.querySelector(".topbar-left");
    if (!topbar || !topbarLeft || document.querySelector("[data-menu-toggle]")) return;

    const activeKey = currentKey();
    const primary = [
      { key: "home", label: "Home", desc: "Start here and copy the server IP.", url: href("index.html") },
      { key: "wiki", label: "Server Guide", desc: "Commands, plugins, and beginner help.", url: href("pages/wiki.html") },
      { key: "items", label: "Item Prices", desc: "Search buy/sell values.", url: href("pages/items.html") },
      { key: "store", label: "Cosmetic Store", desc: "Ranks, particles, pets, and no P2W.", url: href("pages/store.html") },
    ];
    const player = [
      { key: "beginner", label: "Beginner's Guide", desc: "First steps after joining.", url: href("pages/wiki.html#beginners") },
      { key: "commands", label: "All Commands", desc: "Teleport, economy, social, and utility commands.", url: href("pages/wiki.html#commands") },
      { key: "economy", label: "Economy & Trading", desc: "Shop, auction house, banking, and prices.", url: href("pages/wiki.html#cat-econ") },
    ];

    const button = document.createElement("button");
    button.className = "menu-toggle";
    button.type = "button";
    button.setAttribute("data-menu-toggle", "");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = `<span class="bars" aria-hidden="true"><span></span><span></span><span></span></span><span>Menu</span>`;
    topbarLeft.insertAdjacentElement("afterend", button);

    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="menu-overlay" data-menu-overlay></div>
      <aside class="site-menu" data-site-menu aria-hidden="true" aria-label="Site menu">
        <div class="site-menu-head">
          <div class="site-menu-brand">
            <div class="badge">MC<br />WR</div>
            <div>
              <div>War Riders</div>
              <div style="color: var(--muted); font-size: 12px;">panda.cloudns.nz</div>
            </div>
          </div>
          <button class="site-menu-close" type="button" data-menu-close aria-label="Close menu">×</button>
        </div>
        <div class="site-menu-body">
          <div class="site-menu-section">
            <div class="site-menu-title">Pages</div>
            ${primary.map((item) => menuLink(item, activeKey)).join("")}
          </div>
          <div class="site-menu-section">
            <div class="site-menu-title">Player Shortcuts</div>
            ${player.map((item) => menuLink(item, activeKey)).join("")}
          </div>
          <div class="site-menu-section">
            <div class="site-menu-title">Join</div>
            <button class="btn primary site-menu-copy" type="button" data-copy="panda.cloudns.nz">
              Copy Server IP <span class="kbd" data-copy-badge>IP</span>
            </button>
          </div>
        </div>
      </aside>
    `
    );

    const menu = document.querySelector("[data-site-menu]");
    const overlay = document.querySelector("[data-menu-overlay]");
    const close = () => {
      menu?.classList.remove("open");
      overlay?.classList.remove("open");
      menu?.setAttribute("aria-hidden", "true");
      button.setAttribute("aria-expanded", "false");
    };
    const open = () => {
      menu?.classList.add("open");
      overlay?.classList.add("open");
      menu?.setAttribute("aria-hidden", "false");
      button.setAttribute("aria-expanded", "true");
      document.querySelector("[data-menu-close]")?.focus();
    };

    button.addEventListener("click", () => (menu?.classList.contains("open") ? close() : open()));
    overlay?.addEventListener("click", close);
    document.querySelector("[data-menu-close]")?.addEventListener("click", close);
    document.querySelectorAll("[data-menu-link]").forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  buildMenu();

  document.querySelectorAll("img").forEach((img) => {
    const markMissing = () => {
      img.hidden = true;
      img.parentElement?.classList.add("image-missing");
    };
    if (img.complete && img.naturalWidth === 0) markMissing();
    img.addEventListener("error", markMissing, { once: true });
  });

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

