/**
 * Admin data layer. Every read and write the dashboard makes goes through here,
 * so connecting a real back-end means replacing these functions with API calls.
 *
 * Demo persistence: products (pk.catalog), stock (pk.inventory), orders, users and
 * inquiries live in this browser's localStorage, shared with the storefront.
 */
window.PK = window.PK || {};

PK.admin = (function () {
  var shop = PK.shop, store = PK.store, U = PK.util;
  var DAY = 86400000;

  var STATUSES = ['new', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled'];
  var FLOW = ['new', 'confirmed', 'paid', 'shipped', 'completed'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function startOfDay(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }

  /* ───────────────────────── Products ───────────────────────── */

  function products() { return PK.PRODUCTS; }
  function product(id) { return PK.PRODUCTS.find(function (p) { return p.id === id; }) || null; }
  function persistProducts() { PK.catalogStore.saveProducts(PK.PRODUCTS); shop.refresh(); }

  function slug(text) {
    return String(text || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 40);
  }
  function uniqueId(base) {
    var id = slug(base) || 'product';
    var n = 1, out = id;
    while (product(out)) { n += 1; out = id + '-' + n; }
    return out;
  }

  /** Create (no originalId) or update a product. Ids never change, so carts and orders keep working. */
  function saveProduct(draft, originalId) {
    var p = clone(draft);
    if (originalId) {
      var i = PK.PRODUCTS.findIndex(function (x) { return x.id === originalId; });
      p.id = originalId;
      PK.PRODUCTS[i] = p;
    } else {
      p.id = uniqueId(p.name.en || p.name.mn);
      PK.PRODUCTS.unshift(p);
    }
    persistProducts();
    return p;
  }

  /** Returns snapshots for undo. */
  function removeProducts(ids) {
    var snaps = [];
    ids.forEach(function (id) {
      var i = PK.PRODUCTS.findIndex(function (x) { return x.id === id; });
      if (i !== -1) snaps.push({ product: PK.PRODUCTS[i], index: i });
    });
    PK.PRODUCTS = PK.PRODUCTS.filter(function (p) { return ids.indexOf(p.id) === -1; });
    persistProducts();
    return snaps;
  }
  function restoreProducts(snaps) {
    snaps.slice().sort(function (a, b) { return a.index - b.index; }).forEach(function (s) {
      PK.PRODUCTS.splice(Math.min(s.index, PK.PRODUCTS.length), 0, s.product);
    });
    persistProducts();
  }
  function setActive(ids, active) {
    PK.PRODUCTS.forEach(function (p) { if (ids.indexOf(p.id) !== -1) p.active = active; });
    persistProducts();
  }
  function duplicate(id) {
    var src = product(id);
    var copy = clone(src);
    var suffix = { mn: ' (хуулбар)', en: ' (copy)' };
    copy.name = { mn: src.name.mn + suffix.mn, en: (src.name.en || src.name.mn) + suffix.en };
    copy.id = uniqueId((src.name.en || src.name.mn) + ' copy');
    copy.active = false;
    delete copy.popular;
    PK.PRODUCTS.splice(PK.PRODUCTS.indexOf(src) + 1, 0, copy);
    persistProducts();
    return copy;
  }
  function resetProducts() {
    PK.catalogStore.resetProducts();
    PK.PRODUCTS = clone(PK.FILE_PRODUCTS);
    shop.refresh();
  }
  function productsSavedAt() { return PK.catalogStore.savedAt(); }

  /** A blank product draft with sensible defaults (Tesler's law: the system carries the complexity). */
  function blankProduct() {
    return {
      category: PK.CATEGORIES[0].id, shape: 'bag', handle: 'twisted',
      name: { mn: '', en: '' }, summary: { mn: '', en: '' }, description: { mn: '', en: '' },
      uses: { mn: [], en: [] }, material: { mn: 'Крафт цаас', en: 'Kraft paper' },
      colors: ['white'], gsm: [120], gsmDefault: 120,
      unit: 'pcs', moq: 100, step: 50, sizes: [], images: [], active: true,
    };
  }

  /* ───────────────────────── Inventory ───────────────────────── */

  function stockRows() {
    var rows = [];
    PK.PRODUCTS.forEach(function (p) {
      var level = shop.lowStockLevel(p);
      shop.sizes(p).forEach(function (s) {
        p.colors.forEach(function (c) {
          var qty = shop.stockQty(p, s.code, c);
          rows.push({ key: PK.SKU(p.id, s.code, c), p: p, s: s, color: c, qty: qty, level: level, status: qty <= 0 ? 'out' : qty < level ? 'low' : 'ok' });
        });
      });
    });
    return rows;
  }
  function persistStock() { PK.catalogStore.saveInventory(PK.INVENTORY); shop.refresh(); }
  function setStock(key, qty) { PK.INVENTORY[key] = Math.max(0, Math.round(qty) || 0); persistStock(); }
  function addStock(rows, n) {
    rows.forEach(function (r) { PK.INVENTORY[r.key] = Math.max(0, r.qty + Math.round(n)); });
    persistStock();
  }
  function resetStock() { PK.catalogStore.resetInventory(); PK.INVENTORY = Object.assign({}, PK.STOCK || {}); shop.refresh(); }
  function productStock(p) {
    var units = 0, low = 0;
    var level = shop.lowStockLevel(p);
    shop.sizes(p).forEach(function (s) {
      p.colors.forEach(function (c) { var q = shop.stockQty(p, s.code, c); units += q; if (q < level) low += 1; });
    });
    return { units: units, low: low };
  }

  /* ───────────────────────── Orders ───────────────────────── */

  function orders() {
    return store.orders.all().map(function (o) {
      if (o.status === 'received' || STATUSES.indexOf(o.status) === -1) o.status = 'new';
      return o;
    }).sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
  }
  function order(id) { return orders().find(function (o) { return o.id === id; }) || null; }
  function nextStatus(status) {
    var i = FLOW.indexOf(status);
    return i === -1 || i === FLOW.length - 1 ? null : FLOW[i + 1];
  }
  function setStatus(id, status) {
    var o = order(id);
    var history = (o.history || []).concat([{ status: status, at: new Date().toISOString() }]);
    return store.orders.update(id, { status: status, history: history });
  }
  function setNote(id, note) { return store.orders.update(id, { internalNote: note }); }
  function statusCounts(list) {
    var c = { all: list.length };
    STATUSES.forEach(function (s) { c[s] = 0; });
    list.forEach(function (o) { c[o.status] += 1; });
    return c;
  }

  /* ───────────────────────── Customers ───────────────────────── */

  function customers() {
    var map = {};
    var get = function (email) {
      var key = String(email || '').trim().toLowerCase();
      if (!map[key]) map[key] = { email: key, name: '', phone: '', company: '', orders: [], spent: 0, first: null, last: null, account: false, sample: false };
      return map[key];
    };
    orders().slice().reverse().forEach(function (o) {
      var c = get(o.customer.email);
      c.name = o.customer.name || c.name;
      c.phone = o.customer.phone || c.phone;
      c.company = o.customer.company || c.company;
      c.orders.push(o);
      if (o.status !== 'cancelled') c.spent += o.subtotal;
      c.first = c.first || o.createdAt;
      c.last = o.createdAt;
      if (o.customer.account) c.account = true;
      if (o.sample) c.sample = true;
    });
    store.users.all().forEach(function (u) {
      var c = get(u.email);
      c.account = true;
      c.registeredAt = u.createdAt;
      c.name = c.name || u.name;
      c.phone = c.phone || u.phone;
      c.company = c.company || u.company;
    });
    return Object.keys(map).map(function (k) { map[k].orders.reverse(); return map[k]; });
  }

  /* ───────────────────────── Messages ───────────────────────── */

  function inquiries() {
    return store.inquiries.all().slice().sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
  }
  function setRead(id, read) { return store.inquiries.update(id, { read: read }); }
  function unreadCount() { return inquiries().filter(function (q) { return !q.read; }).length; }

  /* ───────────────────────── Analytics ───────────────────────── */

  function analytics(days) {
    var end = startOfDay(Date.now()) + DAY;
    var start = end - days * DAY;
    var prevStart = start - days * DAY;
    var all = orders();
    var live = all.filter(function (o) { return o.status !== 'cancelled'; });
    var within = function (o, a, b) { var t = Date.parse(o.createdAt); return t >= a && t < b; };
    var cur = live.filter(function (o) { return within(o, start, end); });
    var prev = live.filter(function (o) { return within(o, prevStart, start); });

    var kpi = function (list) {
      var revenue = list.reduce(function (s, o) { return s + o.subtotal; }, 0);
      return { revenue: revenue, orders: list.length, aov: list.length ? revenue / list.length : 0 };
    };
    var custs = customers();
    var firstIn = function (a, b) {
      return custs.filter(function (c) {
        var firstLive = c.orders.filter(function (o) { return o.status !== 'cancelled'; })[0];
        if (!firstLive) return false;
        var t = Date.parse(firstLive.createdAt);
        return t >= a && t < b;
      }).length;
    };

    // Revenue buckets: daily up to 30 days, weekly beyond.
    var bucket = days > 30 ? 'week' : 'day';
    var size = bucket === 'week' ? 7 * DAY : DAY;
    var series = [];
    for (var t = start; t < end; t += size) series.push({ start: t, value: 0, orders: 0 });
    cur.forEach(function (o) {
      var i = Math.floor((Date.parse(o.createdAt) - start) / size);
      if (series[i]) { series[i].value += o.subtotal; series[i].orders += 1; }
    });

    // Product and category performance from order lines.
    var byProduct = {}, byCat = {};
    cur.forEach(function (o) {
      o.items.forEach(function (it) {
        var p = product(it.productId);
        var row = byProduct[it.productId] || (byProduct[it.productId] = { id: it.productId, p: p, name: it.name, revenue: 0, units: 0 });
        row.revenue += it.total;
        row.units += it.qty;
        var cat = p ? p.category : 'other';
        byCat[cat] = (byCat[cat] || 0) + it.total;
      });
    });
    var top = Object.keys(byProduct).map(function (k) { return byProduct[k]; }).sort(function (a, b) { return b.revenue - a.revenue; });
    var categories = Object.keys(byCat).map(function (k) { return { id: k, cat: shop.category(k), revenue: byCat[k] }; }).sort(function (a, b) { return b.revenue - a.revenue; });

    var stock = stockRows();
    var low = stock.filter(function (r) { return r.status !== 'ok'; }).sort(function (a, b) { return a.qty - b.qty || a.qty / a.level - b.qty / b.level; });

    return {
      days: days, start: start, end: end, bucket: bucket, series: series,
      cur: kpi(cur), prev: kpi(prev), newCustomers: firstIn(start, end), prevNewCustomers: firstIn(prevStart, start),
      top: top, categories: categories,
      low: low, lowCount: low.filter(function (r) { return r.status === 'low'; }).length, outCount: low.filter(function (r) { return r.status === 'out'; }).length,
      recent: all.slice(0, 6),
    };
  }

  /* ───────────────────────── Sample data ───────────────────────── */

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var PEOPLE = [
    ['Б. Сарангэрэл', 'sarangerel'], ['Г. Тэмүүлэн', 'temuulen'], ['Д. Ану', 'anu'], ['О. Батбаяр', 'batbayar'],
    ['Э. Номин', 'nomin'], ['Ц. Мөнхзул', 'munkhzul'], ['Ж. Энхтуяа', 'enkhtuya'], ['С. Билгүүн', 'bilguun'],
    ['Н. Оюунчимэг', 'oyunchimeg'], ['Т. Ганбат', 'ganbat'], ['Л. Хулан', 'khulan'], ['А. Төгөлдөр', 'tuguldur'],
    ['Б. Анударь', 'anudari'], ['М. Цэцэг', 'tsetseg'], ['Х. Баярмаа', 'bayarmaa'], ['П. Жавхлан', 'javkhlan'],
    ['Р. Солонго', 'solongo'], ['У. Мишээл', 'misheel'], ['Ч. Отгонбаяр', 'otgonbayar'], ['Д. Нандин', 'nandin'],
    ['Э. Түвшин', 'tuvshin'], ['Г. Сувд', 'suvd'], ['О. Ундрах', 'undrakh'], ['Т. Эрдэнэ', 'erdene'],
  ];
  var COMPANIES = ['Кофе шоп', 'Бэйкери', 'Цэцгийн дэлгүүр', 'Хувцасны дэлгүүр', 'Гоо сайхны дэлгүүр', 'Онлайн дэлгүүр', 'Ресторан', 'Бэлэгний дэлгүүр', '', '', ''];
  var INQUIRIES = [
    ['quote', '40 × 30 × 15 см хэмжээтэй цаасан уут 2000 ширхэг хэрэгтэй байна. Үнийн санал илгээнэ үү.'],
    ['custom', 'Манай лого бүхий бор крафт уут хийлгэх боломжтой юу? Сард ойролцоогоор 3000 ширхэг авна.'],
    ['order', 'Өчигдөр өгсөн захиалгын хүргэлт хэзээ ирэх вэ?'],
    ['general', 'Агуулахаас очиж авах боломжтой юу? Хаяг нь хаана байдаг вэ?'],
    ['quote', 'Цонхтой бялууны хайрцаг 20 × 20 см-ээс 500 ширхэг авъя гэж байна.'],
    ['custom', 'Тосонд тэсвэртэй цаасан дээр хэвлэл хийдэг үү?'],
  ];
  var QTY = { pcs: [100, 200, 300, 500, 500, 1000, 1000, 2000, 3000], sheet: [500, 1000, 1000, 2000, 3000], roll: [1, 2, 3, 5, 10] };

  function addSamples() {
    var rnd = mulberry32(20261110);
    var pick = function (arr) { return arr[Math.floor(rnd() * arr.length)]; };
    var catalog = shop.products();
    var weights = catalog.map(function (p) { return p.popular ? 13 - Math.min(p.popular, 12) : 1; });
    var totalW = weights.reduce(function (a, b) { return a + b; }, 0);
    var pickProduct = function () {
      var r = rnd() * totalW;
      for (var i = 0; i < catalog.length; i++) { r -= weights[i]; if (r <= 0) return catalog[i]; }
      return catalog[0];
    };
    var people = PEOPLE.map(function (x, i) {
      var company = COMPANIES[i % COMPANIES.length];
      return { name: x[0], email: x[1] + '@example.com', phone: '+976 0000-' + String(1000 + i * 37).slice(-4), company: company, account: i % 3 !== 2 };
    });
    var now = Date.now();
    var list = [];
    for (var n = 0; n < 160; n++) {
      var ageDays = Math.floor(Math.pow(rnd(), 1.4) * 90);
      var created = new Date(startOfDay(now - ageDays * DAY) + (8 + Math.floor(rnd() * 11)) * 3600000 + Math.floor(rnd() * 59) * 60000);
      if (created.getTime() > now) created = new Date(now - Math.floor(rnd() * 3600000));
      var who = rnd() < 0.55 ? people[Math.floor(rnd() * 10)] : pick(people);
      var lines = 1 + (rnd() < 0.35 ? 1 : 0) + (rnd() < 0.1 ? 1 : 0);
      var items = [];
      for (var l = 0; l < lines; l++) {
        var p = pickProduct();
        var sizes = shop.sizes(p);
        var s = sizes[Math.floor(rnd() * sizes.length)];
        var qty = Math.max(p.moq, pick(QTY[p.unit] || QTY.pcs));
        var unit = shop.unitPrice(p, s, { gsm: p.gsmDefault, qty: qty });
        items.push({ productId: p.id, name: p.name, size: s.code, dims: shop.dimsUnit(p, s), color: pick(p.colors), gsm: p.gsmDefault || null, qty: qty, unit: unit, total: unit * qty });
      }
      var subtotal = items.reduce(function (sum, it) { return sum + it.total; }, 0);
      var courier = rnd() < 0.7;
      var fee = courier && subtotal < PK.CONFIG.delivery.freeOver ? PK.CONFIG.delivery.fee : 0;
      var status = ageDays < 1 ? pick(['new', 'new', 'confirmed']) : ageDays < 3 ? pick(['confirmed', 'paid', 'new']) : ageDays < 7 ? pick(['paid', 'shipped', 'shipped']) : rnd() < 0.06 ? 'cancelled' : 'completed';
      var ymd = String(created.getFullYear()).slice(2) + String(created.getMonth() + 1).padStart(2, '0') + String(created.getDate()).padStart(2, '0');
      list.push({
        id: 'PK' + ymd + '-' + String(1000 + Math.floor(rnd() * 9000)),
        createdAt: created.toISOString(), status: status, sample: true,
        customer: { name: who.name, phone: who.phone, email: who.email, company: who.company, account: who.account },
        delivery: courier ? { method: 'courier', district: pick(PK.CONFIG.districts.slice(0, 6)), khoroo: String(1 + Math.floor(rnd() * 20)), address: (10 + Math.floor(rnd() * 80)) + '-р байр, ' + (1 + Math.floor(rnd() * 120)) + ' тоот' } : { method: 'pickup' },
        receipt: { type: who.company && rnd() < 0.6 ? 'org' : 'person', regno: '' },
        payment: pick(['transfer', 'transfer', 'qpay', 'qpay', 'cash']),
        note: '', items: items, subtotal: subtotal, deliveryFee: fee, total: subtotal + fee, currency: 'MNT', lang: 'mn',
      });
    }
    store.orders.replaceAll(store.orders.all().concat(list));
    var msgs = INQUIRIES.map(function (m, i) {
      var who = people[(i * 5) % people.length];
      return { id: 'qsample' + i, createdAt: new Date(now - (i * 1.7 + 0.2) * DAY).toISOString(), name: who.name, email: who.email, phone: who.phone, topic: m[0], message: m[1], lang: 'mn', read: i > 2, sample: true };
    });
    store.inquiries.replaceAll(store.inquiries.all().concat(msgs));
    store.write('seeded', true);
  }

  function removeSamples() {
    store.orders.replaceAll(store.orders.all().filter(function (o) { return !o.sample; }));
    store.inquiries.replaceAll(store.inquiries.all().filter(function (q) { return !q.sample; }));
  }
  function sampleCounts() {
    return {
      orders: store.orders.all().filter(function (o) { return o.sample; }).length,
      msgs: store.inquiries.all().filter(function (q) { return q.sample; }).length,
    };
  }
  function seedOnce() { if (!store.read('seeded', false)) addSamples(); }

  /* ───────────────────────── Export ───────────────────────── */

  /** catalog.js with the current products and stock, ready to replace public/assets/js/data/catalog.js. */
  function catalogJs() {
    var stock = {};
    stockRows().forEach(function (r) { stock[r.key] = r.qty; });
    var j = function (x) { return JSON.stringify(x, null, 2); };
    return '/**\n * Product catalog — exported from the admin dashboard on ' + new Date().toISOString().slice(0, 10) + '.\n' +
      ' * Field reference: see README.md ("Updating products, sizes, prices and photos").\n */\n' +
      'window.PK = window.PK || {};\n\n' +
      'PK.COLORS = ' + j(PK.COLORS) + ';\n\n' +
      'PK.UNITS = ' + j(PK.UNITS) + ';\n\n' +
      'PK.CATEGORIES = ' + j(PK.CATEGORIES) + ';\n\n' +
      'PK.PRODUCTS = ' + j(PK.PRODUCTS) + ';\n\n' +
      '/* Units on hand per SKU ("productId|size|colour"). */\n' +
      'PK.STOCK = ' + j(stock) + ';\n';
  }

  /** RFC 4180 CSV with a BOM (so Excel reads Cyrillic) and formula-injection guarding. */
  function toCsv(columns, rows) {
    var cell = function (v) {
      var s = v == null ? '' : String(v);
      if (/^[=+\-@]/.test(s)) s = "'" + s;
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return '﻿' + [columns.map(function (c) { return cell(c.label); }).join(',')]
      .concat(rows.map(function (r) { return columns.map(function (c) { return cell(c.value(r)); }).join(','); })).join('\r\n');
  }

  function download(filename, text, mime) {
    try {
      var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      return true;
    } catch (e) { return false; }
  }

  return {
    STATUSES: STATUSES, FLOW: FLOW,
    products: products, product: product, saveProduct: saveProduct, removeProducts: removeProducts, restoreProducts: restoreProducts,
    setActive: setActive, duplicate: duplicate, resetProducts: resetProducts, productsSavedAt: productsSavedAt, blankProduct: blankProduct,
    stockRows: stockRows, setStock: setStock, addStock: addStock, resetStock: resetStock, productStock: productStock,
    orders: orders, order: order, nextStatus: nextStatus, setStatus: setStatus, setNote: setNote, statusCounts: statusCounts,
    customers: customers, inquiries: inquiries, setRead: setRead, unreadCount: unreadCount,
    analytics: analytics, addSamples: addSamples, removeSamples: removeSamples, sampleCounts: sampleCounts, seedOnce: seedOnce,
    catalogJs: catalogJs, toCsv: toCsv, download: download,
  };
})();
