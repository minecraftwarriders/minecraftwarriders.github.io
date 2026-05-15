(() => {
  const KEY = "warRidersOrderItems";

  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items.filter(Boolean).map(String)));
    window.dispatchEvent(new CustomEvent("war-riders-cart-change"));
  }

  function add(productId) {
    const id = String(productId || "");
    if (!id) return;
    const items = read();
    if (id.startsWith("coin-") || !items.includes(id)) items.push(id);
    write(items);
  }

  function animateAdd(sourceEl, imageUrl) {
    return new Promise((resolve) => {
      const source = sourceEl instanceof Element ? sourceEl : null;
      const target = document.querySelector('a[href$="cart.html"] .cart-icon') || document.querySelector('a[href$="cart.html"]');
      if (!source || !target) {
        resolve();
        return;
      }

      const start = source.getBoundingClientRect();
      const end = target.getBoundingClientRect();
      const flyer = document.createElement("div");
      flyer.className = "cart-flyer";
      flyer.style.left = `${start.left + start.width / 2 - 20}px`;
      flyer.style.top = `${start.top + start.height / 2 - 20}px`;

      if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = "";
        flyer.appendChild(image);
      }

      document.body.appendChild(flyer);
      requestAnimationFrame(() => {
        flyer.style.transform = `translate(${end.left + end.width / 2 - start.left - start.width / 2}px, ${end.top + end.height / 2 - start.top - start.height / 2}px) scale(0.34)`;
        flyer.style.opacity = "0.18";
      });

      target.closest("a")?.classList.add("cart-pop");
      setTimeout(() => {
        flyer.remove();
        target.closest("a")?.classList.remove("cart-pop");
        resolve();
      }, 540);
    });
  }

  function removeAt(index) {
    const items = read();
    items.splice(index, 1);
    write(items);
  }

  function clear() {
    write([]);
  }

  window.WarRidersCart = { add, animateAdd, clear, read, removeAt, write };
})();
