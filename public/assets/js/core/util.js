/** Small DOM, formatting and URL helpers shared by every page. */
window.PK = window.PK || {};

PK.util = (function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }

  /** 1410 → "1,410₮" */
  function money(n) {
    var v = Math.round(Number(n) || 0);
    return v.toLocaleString('en-US') + PK.CONFIG.currency.symbol;
  }

  /** 32.5 → "32.5", 12 → "12" */
  function num(n) {
    if (n == null || isNaN(n)) return '';
    return String(Math.round(n * 10) / 10);
  }

  function int(n) { return Math.round(Number(n) || 0).toLocaleString('en-US'); }

  function param(name) { return new URLSearchParams(location.search).get(name); }

  /** Replace the URL query with the given (non-empty) values without reloading. */
  function setParams(obj) {
    var p = new URLSearchParams();
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (v !== '' && v != null && v !== false) p.set(k, v);
    });
    var qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function uid(prefix) { return (prefix || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function formatDate(iso) {
    var d = new Date(iso);
    var pad = function (x) { return String(x).padStart(2, '0'); };
    return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function isEmail(v) { return EMAIL_RE.test(String(v).trim()); }
  /** Mongolian numbers: 8 digits, optional +976 prefix, spaces/dashes allowed. */
  function isPhone(v) {
    var d = String(v).replace(/[\s-]/g, '').replace(/^\+?976/, '');
    return /^\d{8}$/.test(d);
  }

  return {
    qs: qs, qsa: qsa, esc: esc, money: money, num: num, int: int,
    param: param, setParams: setParams, debounce: debounce, uid: uid, clamp: clamp,
    formatDate: formatDate, isEmail: isEmail, isPhone: isPhone,
  };
})();
