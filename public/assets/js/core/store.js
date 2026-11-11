/**
 * Client-side state: cart, compare list, accounts, orders and inquiries.
 *
 * Everything is persisted in localStorage under "pk.*" keys so the front-end
 * works without a server. When PK.CONFIG.endpoints.order / .contact are set,
 * PK.api.send() also POSTs the payload there (see config.js). Swap these
 * functions for real API calls when a back-end is ready — pages only talk to
 * this module.
 *
 * Events (window): 'pk:cart', 'pk:compare', 'pk:auth'
 */
window.PK = window.PK || {};

(function () {
  var NS = 'pk.';
  var U = PK.util;

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(NS + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(NS + key, JSON.stringify(value)); } catch (e) { /* storage full or blocked */ }
  }
  function emit(name, detail) { window.dispatchEvent(new CustomEvent('pk:' + name, { detail: detail })); }

  // Re-broadcast changes made in another tab.
  window.addEventListener('storage', function (e) {
    if (!e.key || e.key.indexOf(NS) !== 0) return;
    var k = e.key.slice(NS.length);
    if (k === 'cart') emit('cart');
    if (k === 'compare') emit('compare');
    if (k === 'session' || k === 'users') emit('auth');
  });

  /* ───────── Cart ───────── */
  function sameConfig(a, b) {
    return a.productId === b.productId && a.size === b.size && a.color === b.color && String(a.gsm) === String(b.gsm);
  }

  var cart = {
    items: function () { return read('cart', []); },
    count: function () { return cart.items().length; },
    add: function (entry) {
      var items = cart.items();
      var existing = items.find(function (i) { return sameConfig(i, entry); });
      if (existing) existing.qty += entry.qty;
      else items.push({ id: U.uid('c'), productId: entry.productId, size: entry.size, color: entry.color, gsm: entry.gsm, qty: entry.qty });
      write('cart', items);
      emit('cart');
    },
    /** Change size / colour / gsm / qty of a line. Merges into an identical line if one exists. */
    update: function (id, patch) {
      var items = cart.items();
      var line = items.find(function (i) { return i.id === id; });
      if (!line) return;
      Object.assign(line, patch);
      var twin = items.find(function (i) { return i.id !== id && sameConfig(i, line); });
      if (twin) {
        twin.qty += line.qty;
        items = items.filter(function (i) { return i.id !== id; });
      }
      write('cart', items);
      emit('cart');
    },
    remove: function (id) {
      var items = cart.items();
      var idx = items.findIndex(function (i) { return i.id === id; });
      if (idx === -1) return null;
      var removed = items.splice(idx, 1)[0];
      write('cart', items);
      emit('cart');
      return { item: removed, index: idx };
    },
    restore: function (snapshot) {
      var items = cart.items();
      items.splice(Math.min(snapshot.index, items.length), 0, snapshot.item);
      write('cart', items);
      emit('cart');
    },
    clear: function () { write('cart', []); emit('cart'); },
  };

  /* ───────── Compare (max 4 sizes) ───────── */
  var COMPARE_MAX = 4;
  var compare = {
    max: COMPARE_MAX,
    list: function () { return read('compare', []); },
    has: function (productId, code) {
      return compare.list().some(function (c) { return c.productId === productId && c.size === code; });
    },
    /** Returns 'added' | 'removed' | 'full' */
    toggle: function (productId, code) {
      var list = compare.list();
      var idx = list.findIndex(function (c) { return c.productId === productId && c.size === code; });
      var result;
      if (idx !== -1) { list.splice(idx, 1); result = 'removed'; }
      else if (list.length >= COMPARE_MAX) { return 'full'; }
      else { list.push({ productId: productId, size: code }); result = 'added'; }
      write('compare', list);
      emit('compare');
      return result;
    },
    clear: function () { write('compare', []); emit('compare'); },
  };

  /* ───────── Accounts (demo: browser-only) ───────── */
  function hash(text) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      });
    }
    // Fallback for non-secure contexts: simple non-cryptographic hash (demo only).
    var h = 0;
    for (var i = 0; i < text.length; i++) { h = (h << 5) - h + text.charCodeAt(i); h |= 0; }
    return Promise.resolve('x' + (h >>> 0).toString(16));
  }

  function normEmail(e) { return String(e || '').trim().toLowerCase(); }

  var auth = {
    current: function () {
      var email = read('session', null);
      if (!email) return null;
      var users = read('users', {});
      return users[email] ? Object.assign({ email: email }, users[email], { passHash: undefined }) : null;
    },
    register: function (data) {
      var email = normEmail(data.email);
      var users = read('users', {});
      if (users[email]) return Promise.resolve({ ok: false, error: 'err.emailTaken' });
      return hash(email + ':' + data.password).then(function (h) {
        users[email] = { name: data.name.trim(), phone: (data.phone || '').trim(), company: (data.company || '').trim(), passHash: h, createdAt: new Date().toISOString() };
        write('users', users);
        write('session', email);
        emit('auth');
        return { ok: true };
      });
    },
    login: function (emailRaw, password) {
      var email = normEmail(emailRaw);
      var users = read('users', {});
      if (!users[email]) return Promise.resolve({ ok: false, error: 'err.login' });
      return hash(email + ':' + password).then(function (h) {
        if (h !== users[email].passHash) return { ok: false, error: 'err.login' };
        write('session', email);
        emit('auth');
        return { ok: true };
      });
    },
    logout: function () {
      try { localStorage.removeItem(NS + 'session'); } catch (e) { /* ignore */ }
      emit('auth');
    },
  };

  /* ───────── Orders & inquiries ───────── */
  function orderId() {
    var d = new Date();
    var ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    return 'PK' + ymd + '-' + String(Math.floor(1000 + Math.random() * 9000));
  }

  var orders = {
    all: function () { return read('orders', []); },
    forEmail: function (email) {
      var e = normEmail(email);
      return orders.all().filter(function (o) { return normEmail(o.customer.email) === e; })
        .sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
    },
    create: function (order) {
      PK.catalogStore.reload();   // pick up stock changed in another tab before deducting
      var saved = Object.assign({ id: orderId(), createdAt: new Date().toISOString(), status: 'new' }, order);
      var list = orders.all();
      list.push(saved);
      write('orders', list);
      // Ordered units leave the shelf (never below zero; the rest is made to order).
      (saved.items || []).forEach(function (it) {
        var p = PK.shop.product(it.productId);
        if (!p) return;
        var key = PK.SKU(p.id, it.size, it.color);
        PK.INVENTORY[key] = Math.max(0, PK.shop.stockQty(p, it.size, it.color) - it.qty);
      });
      PK.catalogStore.saveInventory(PK.INVENTORY);
      return saved;
    },
    /** Admin: change status, add notes. */
    update: function (id, patch) {
      var list = orders.all();
      var o = list.find(function (x) { return x.id === id; });
      if (!o) return null;
      Object.assign(o, patch, { updatedAt: new Date().toISOString() });
      write('orders', list);
      return o;
    },
    replaceAll: function (list) { write('orders', list); },
  };

  var inquiries = {
    all: function () { return read('inquiries', []); },
    update: function (id, patch) {
      var list = read('inquiries', []);
      var q = list.find(function (x) { return x.id === id; });
      if (q) { Object.assign(q, patch); write('inquiries', list); }
      return q;
    },
    replaceAll: function (list) { write('inquiries', list); },
    create: function (data) {
      var list = read('inquiries', []);
      var saved = Object.assign({ id: U.uid('q'), createdAt: new Date().toISOString() }, data);
      list.push(saved);
      write('inquiries', list);
      return saved;
    },
  };

  /* ───────── Network ───────── */
  PK.api = {
    /** POST to the configured endpoint, or resolve after a short delay in demo mode. */
    send: function (kind, payload) {
      var url = PK.CONFIG.endpoints[kind];
      if (!url) return new Promise(function (resolve) { setTimeout(function () { resolve({ ok: true, demo: true }); }, 500); });
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return { ok: true };
      });
    },
  };

  var users = {
    /** Admin: registered accounts without password hashes. */
    all: function () {
      var map = read('users', {});
      return Object.keys(map).map(function (email) { var u = Object.assign({ email: email }, map[email]); delete u.passHash; return u; });
    },
  };

  PK.store = { cart: cart, compare: compare, auth: auth, orders: orders, inquiries: inquiries, users: users, read: read, write: write };
})();
