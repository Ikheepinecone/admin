/**
 * Catalog logic: size resolution, pricing, labels, search and fit checks.
 * Reads PK.TEMPLATES / PK.PRODUCTS / PK.CONFIG; owns no state.
 */
window.PK = window.PK || {};

PK.shop = (function () {
  var U = PK.util;
  var byId = {};
  function index() { byId = {}; PK.PRODUCTS.forEach(function (p) { byId[p.id] = p; }); }
  index();
  function isActive(p) { return p && p.active !== false; }

  /* ───────── Pricing ───────── */

  function roundPrice(v) {
    if (v >= 1000) return Math.round(v / 10) * 10;
    if (v >= 100) return Math.round(v / 5) * 5;
    return Math.round(v);
  }

  /** Approximate flat blank for dies with no format recorded (bag construction rule of thumb). */
  function estimateFormat(s) {
    var w = s.w || 0;
    return [2 * (s.l + w) + 1.5, s.h + w * 0.6 + 4];
  }

  function diePrice(p, s) {
    var f = s.format || estimateFormat(s);
    var areaM2 = (f[0] * f[1]) / 10000;
    return roundPrice(p.pricing.base + areaM2 * p.pricing.perM2);
  }

  /** Heavier paper costs more; paper is roughly 60% of the unit cost. */
  function gsmFactor(p, gsm) {
    if (!p.gsm || !gsm || gsm === p.gsmDefault) return 1;
    return 1 + ((gsm - p.gsmDefault) / p.gsmDefault) * 0.6;
  }

  function tier(qty) {
    var cur = PK.CONFIG.priceTiers[0];
    PK.CONFIG.priceTiers.forEach(function (t) { if (qty >= t.min) cur = t; });
    return cur;
  }

  /** Unit price for a product size, paper weight and quantity (tier discount applied). */
  function unitPrice(p, s, opts) {
    opts = opts || {};
    var v = s.basePrice * gsmFactor(p, opts.gsm);
    var off = opts.qty ? tier(opts.qty).off : 0;
    return roundPrice(v * (1 - off / 100));
  }

  /* ───────── Sizes ───────── */

  var sizeCache = {};
  /** Resolved sizes for a product. fresh=true skips the cache (used for unsaved admin drafts). */
  function sizes(p, fresh) {
    var cacheable = !fresh && String(p.id).indexOf('__') !== 0;   // '__preview' drafts are never cached
    if (cacheable && sizeCache[p.id]) return sizeCache[p.id];
    var list = p.sizes.map(function (entry) {
      var s;
      if (typeof entry === 'string') {
        var t = PK.TEMPLATE_BY_CODE[entry];
        if (!t) { console.warn('Unknown die code', entry, 'in', p.id); return null; }
        s = { code: t.code, l: t.l, w: t.w, h: t.h, format: t.format, note: t.note || null, die: true };
      } else {
        s = Object.assign({ die: false, note: null }, entry);
      }
      s.status = sizeStatus(p, s);
      s.volume = (p.shape === 'bag' || p.shape === 'box') && s.w ? (s.l * s.w * s.h) / 1000 : null;
      s.basePrice = s.price != null ? s.price : diePrice(p, s);
      s.sortKey = p.shape === 'roll' ? s.l : p.shape === 'sheet' ? s.l * s.w : s.l * (s.w || 2) * s.h;
      return s;
    }).filter(Boolean);
    if (cacheable) sizeCache[p.id] = list;
    return list;
  }

  /* ───────── Stock ───────── */

  /** Units on hand for one SKU (admin-set value, else the starting default). */
  function stockQty(p, code, color) {
    var key = PK.SKU(p.id, code, color);
    return Object.prototype.hasOwnProperty.call(PK.INVENTORY, key) ? PK.INVENTORY[key] : PK.defaultStock(p, code, color);
  }

  /** 'stock' when units are on hand (for the colour, or any colour), otherwise 'mto' (made to order). */
  function sizeStatus(p, s, color) {
    if (color) return stockQty(p, s.code, color) > 0 ? 'stock' : 'mto';
    return p.colors.some(function (c) { return stockQty(p, s.code, c) > 0; }) ? 'stock' : 'mto';
  }

  /** Low-stock alert level for a product (admin-editable). */
  function lowStockLevel(p) { return p.lowStock != null ? p.lowStock : Math.max(p.moq * 3, (p.step || 1) * 4); }

  function size(p, code) {
    var list = sizes(p);
    for (var i = 0; i < list.length; i++) if (list[i].code === code) return list[i];
    return null;
  }

  function lightestGsm(p) { return p.gsm ? Math.min.apply(null, p.gsm) : null; }

  function minPrice(p) {
    var g = lightestGsm(p);
    return Math.min.apply(null, sizes(p).map(function (s) { return unitPrice(p, s, { gsm: g }); }));
  }

  /** "32.5 × 12 × 31.5" (no unit) */
  function dims(p, s) {
    var n = U.num;
    if (p.shape === 'roll') return n(s.l) + ' ' + PK.t('common.cm') + ' × ' + n(s.length) + ' ' + PK.t('common.m');
    if (p.shape === 'sheet' || !s.w) return n(s.l) + ' × ' + n(p.shape === 'sheet' ? s.w : s.h);
    return n(s.l) + ' × ' + n(s.w) + ' × ' + n(s.h);
  }

  /** dims + unit, e.g. "32.5 × 12 × 31.5 см" */
  function dimsUnit(p, s) {
    return p.shape === 'roll' ? dims(p, s) : dims(p, s) + ' ' + PK.t('common.cm');
  }

  function legendKey(p, s) {
    if (p.shape === 'roll') return 'product.sizeLegendRoll';
    if (p.shape === 'sheet') return 'product.sizeLegendSheet';
    if (s && !s.w) return 'product.sizeLegendFlat';
    return 'product.sizeLegend';
  }

  function formatText(s) {
    return s.format ? U.num(s.format[0]) + ' × ' + U.num(s.format[1]) + ' ' + PK.t('common.cm') : null;
  }

  function volumeText(s) {
    return s.volume ? U.num(s.volume) + ' ' + PK.t('common.l') : null;
  }

  function unitLabel(p) { return PK.loc(PK.UNITS[p.unit]); }

  function gsmText(p) {
    if (p.gsm) return p.gsm.join(' / ') + ' ' + PK.t('unit.gsm');
    return p.thickness ? PK.loc(p.thickness) : '—';
  }

  /** Height range text for cards, e.g. "11–42 см өндөр" → we show size count instead; keep for tables. */
  function sizeSpan(p) {
    var list = sizes(p);
    if (list.length === 1) return dimsUnit(p, list[0]);
    var keyed = list.slice().sort(function (a, b) { return a.sortKey - b.sortKey; });
    return dims(p, keyed[0]) + ' … ' + dimsUnit(p, keyed[keyed.length - 1]);
  }

  /* ───────── Fit & search ───────── */

  var CLEARANCE = 0.5; // cm of play around the item

  /** Does an item {l, w, h} (cm, any may be 0/empty) fit inside this size? Only bags and boxes hold items. */
  function fits(p, s, item) {
    if (p.shape !== 'bag' && p.shape !== 'box') return false;
    var a = +item.l || 0, b = +item.w || 0, c = +item.h || 0;
    var sw = s.w || 2; // flat bags take items up to ~2 cm thick
    var c1 = CLEARANCE;
    var flatOk = (s.l >= a + c1 && sw >= b + (b ? c1 : 0)) || (s.l >= b + c1 && sw >= a + (a ? c1 : 0));
    return flatOk && s.h >= c + (c ? c1 : 0);
  }

  function hasFit(item) { return !!(item && (+item.l || +item.w || +item.h)); }

  function norm(str) {
    return String(str || '').toLowerCase().replace(/[×х*]/g, 'x').replace(/\s*x\s*/g, 'x').replace(/,/g, '.');
  }

  function productHaystack(p) {
    var cat = category(p.category);
    return norm([p.name.mn, p.name.en, p.summary.mn, p.summary.en, p.material.mn, p.material.en,
      cat ? cat.name.mn + ' ' + cat.name.en : '', p.colors.map(function (c) { return PK.COLORS[c].mn + ' ' + PK.COLORS[c].en; }).join(' ')].join(' '));
  }

  function sizeHaystack(p, s) {
    return norm(s.code + ' ' + U.num(s.l) + 'x' + U.num(s.w) + 'x' + U.num(s.h) + ' ' + U.num(s.l) + 'x' + U.num(s.h) + ' ' + U.num(s.l) + 'x' + U.num(s.w));
  }

  /** Every whitespace-separated token must appear in the product or one of its sizes. */
  function matches(p, query, s) {
    var q = norm(query).trim();
    if (!q) return true;
    var hay = productHaystack(p) + ' ' + (s ? sizeHaystack(p, s) : sizes(p).map(function (x) { return sizeHaystack(p, x); }).join(' '));
    return q.split(/\s+/).every(function (tok) { return hay.indexOf(tok) !== -1; });
  }

  /* ───────── Lookups ───────── */

  function product(id) { return isActive(byId[id]) ? byId[id] : null; }
  function products() { return PK.PRODUCTS.filter(isActive); }
  function category(id) {
    for (var i = 0; i < PK.CATEGORIES.length; i++) if (PK.CATEGORIES[i].id === id) return PK.CATEGORIES[i];
    return null;
  }
  function inCategory(id) { return PK.PRODUCTS.filter(function (p) { return isActive(p) && p.category === id; }); }

  /** Rebuild lookups after the admin changes PK.PRODUCTS or PK.INVENTORY. */
  function refresh() { index(); sizeCache = {}; }

  function url(p, s) { return 'product.html?id=' + encodeURIComponent(p.id) + (s ? '&size=' + encodeURIComponent(s.code) : ''); }

  /** Drawing spec consumed by PK.art for a product + size + colour. */
  function artSpec(p, s, color) {
    return {
      shape: p.shape, handle: p.handle, lid: p.lid,
      l: s.l, w: s.w, h: s.h, length: s.length, d: s.d,
      color: color || p.colors[0],
    };
  }

  /* ───────── Cart maths ───────── */

  /** Resolve a stored cart/order line into product, size and prices. Returns null if it no longer exists. */
  function line(item) {
    var p = product(item.productId);
    if (!p) return null;
    var s = size(p, item.size);
    if (!s) return null;
    var unit = unitPrice(p, s, { gsm: item.gsm, qty: item.qty });
    return { item: item, product: p, size: s, unit: unit, total: unit * item.qty, tier: tier(item.qty) };
  }

  function totals(items, method) {
    var lines = items.map(line).filter(Boolean);
    var subtotal = lines.reduce(function (sum, l) { return sum + l.total; }, 0);
    var d = PK.CONFIG.delivery;
    var delivery = method === 'pickup' || subtotal === 0 || subtotal >= d.freeOver ? 0 : d.fee;
    return { lines: lines, subtotal: subtotal, delivery: delivery, total: subtotal + delivery, freeLeft: Math.max(0, d.freeOver - subtotal) };
  }

  return {
    product: product, products: products, category: category, inCategory: inCategory,
    sizes: sizes, size: size, unitPrice: unitPrice, minPrice: minPrice, tier: tier, lightestGsm: lightestGsm,
    dims: dims, dimsUnit: dimsUnit, legendKey: legendKey, formatText: formatText, volumeText: volumeText,
    unitLabel: unitLabel, gsmText: gsmText, sizeSpan: sizeSpan,
    fits: fits, hasFit: hasFit, matches: matches, url: url, artSpec: artSpec,
    line: line, totals: totals,
    stockQty: stockQty, sizeStatus: sizeStatus, lowStockLevel: lowStockLevel, refresh: refresh,
  };
})();
