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
  }

  function add(productId) {
    const id = String(productId || "");
    if (!id) return;
    const items = read();
    if (id.startsWith("coin-") || !items.includes(id)) items.push(id);
    write(items);
  }

  function removeAt(index) {
    const items = read();
    items.splice(index, 1);
    write(items);
  }

  function clear() {
    write([]);
  }

  window.WarRidersCart = { add, clear, read, removeAt, write };
})();
