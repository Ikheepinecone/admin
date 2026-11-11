/**
 * Admin-managed catalog and inventory.
 *
 * Loaded on every page right after data/catalog.js. If the admin dashboard has
 * saved edits, they replace PK.PRODUCTS here so the storefront shows them.
 * Stock is kept per SKU ("productId|sizeCode|color") in PK.INVENTORY; SKUs the
 * admin never touched fall back to PK.defaultStock().
 *
 * Demo persistence is localStorage (this browser only). For a shared, live
 * catalog, replace load()/save() with calls to your API or database.
 */
window.PK = window.PK || {};

(function () {
  var KEYS = { catalog: 'pk.catalog', inventory: 'pk.inventory' };

  function read(key) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }

  // Keep the original file catalog so the admin can reset to it.
  PK.FILE_PRODUCTS = JSON.parse(JSON.stringify(PK.PRODUCTS));

  var saved = read(KEYS.catalog);
  if (saved && Array.isArray(saved.products) && saved.products.length) PK.PRODUCTS = saved.products;
  // Stock published in catalog.js (PK.STOCK) is the base; this browser's admin edits sit on top.
  PK.INVENTORY = Object.assign({}, PK.STOCK || {}, read(KEYS.inventory) || {});

  /* Deterministic starting stock so a fresh install shows a realistic mix of
     healthy, low and empty shelves. Dies marked "hiih" (to be made) start at 0. */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967295;
  }
  PK.defaultStock = function (p, code, color) {
    var t = PK.TEMPLATE_BY_CODE && PK.TEMPLATE_BY_CODE[code];
    if (t && t.note === 'hiih') return 0;
    var r = hash(p.id + '|' + code + '|' + color);
    if (p.unit === 'roll') return r < 0.1 ? 0 : Math.round(4 + r * 56);
    var step = p.step || 50;
    if (r < 0.06) return 0;
    if (r < 0.18) return Math.round((r * 1600) / step) * step + step;          // low: ~100–300
    return Math.round((600 + r * 5200) / step) * step;                          // healthy
  };

  PK.SKU = function (productId, code, color) { return productId + '|' + code + '|' + color; };

  PK.catalogStore = {
    keys: KEYS,
    saveProducts: function (products) { return write(KEYS.catalog, { products: products, savedAt: new Date().toISOString() }); },
    savedAt: function () { var s = read(KEYS.catalog); return s ? s.savedAt : null; },
    resetProducts: function () { remove(KEYS.catalog); },
    saveInventory: function (inv) { return write(KEYS.inventory, inv); },
    resetInventory: function () { remove(KEYS.inventory); PK.INVENTORY = Object.assign({}, PK.STOCK || {}); },
    /** Re-read products and stock saved by another tab (storefront ↔ admin). */
    reload: function () {
      var s = read(KEYS.catalog);
      PK.PRODUCTS = s && Array.isArray(s.products) && s.products.length ? s.products : JSON.parse(JSON.stringify(PK.FILE_PRODUCTS));
      PK.INVENTORY = Object.assign({}, PK.STOCK || {}, read(KEYS.inventory) || {});
      if (PK.shop) PK.shop.refresh();
    },
  };
})();
