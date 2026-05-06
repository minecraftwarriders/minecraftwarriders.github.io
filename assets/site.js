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
})();

