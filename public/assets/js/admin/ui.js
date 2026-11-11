/**
 * Admin UI kit: icons, dialogs, drawers, switches, status pills, stat tiles and charts.
 * Charts follow the dataviz rules: one hue per series, thin marks with 4px rounded
 * data-ends, hairline solid grid, hover + keyboard tooltips, and a table view twin.
 */
window.PK = window.PK || {};

PK.aui = (function () {
  var U = PK.util, t = PK.t, esc = U.esc;

  /* ───────── Icons (admin set, falls back to the storefront set) ───────── */
  var ICONS = {
    overview: '<rect x="3.5" y="3.5" width="7" height="9" rx="2"/><rect x="13.5" y="3.5" width="7" height="5" rx="2"/><rect x="13.5" y="11.5" width="7" height="9" rx="2"/><rect x="3.5" y="15.5" width="7" height="5" rx="2"/>',
    products: '<path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    inventory: '<path d="M3.5 9.5L12 4.5l8.5 5V20h-17z"/><path d="M8 20v-6h8v6M8 17h8"/>',
    orders: '<path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z"/><path d="M9 8.5h6M9 12h6"/>',
    customers: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.9-3 3-4.5 5.5-4.5s4.6 1.5 5.5 4.5"/><path d="M15.5 5.2a3 3 0 0 1 0 5.6M17.5 14.8c1.4.6 2.4 1.9 3 4.2"/>',
    messages: '<path d="M4 5.5h16v11H9l-5 4z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h0a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    external: '<path d="M14 4.5h5.5V10M19.5 4.5L11 13M17 14v5.5H4.5V7H10"/>',
    edit: '<path d="M4.5 19.5l1-4 10.5-10.5 3 3L8.5 18.5z"/><path d="M14 7l3 3"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V5.5a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    eyeOff: '<path d="M3.5 3.5l17 17M10.6 6a9.6 9.6 0 0 1 1.4-.1c6 0 9.5 6.1 9.5 6.1a17 17 0 0 1-2.6 3.3M6.6 6.7A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5a9.2 9.2 0 0 0 4.4-1.1M9.9 10a2.8 2.8 0 0 0 4 4"/>',
    download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
    up: '<path d="M12 19V5M6.5 10.5L12 5l5.5 5.5"/>',
    down: '<path d="M12 5v14M6.5 13.5L12 19l5.5-5.5"/>',
    alert: '<path d="M12 4l9 15.5H3z"/><path d="M12 10v4M12 16.8v.2"/>',
    xCircle: '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
    okCircle: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.5 2.5 4.5-5"/>',
    sort: '<path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4"/>',
  };
  function icon(name, cls) {
    if (!ICONS[name]) return PK.ui.icon(name, cls);
    return '<svg class="' + (cls || 'h-5 w-5') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICONS[name] + '</svg>';
  }

  /* ───────── Formatting ───────── */
  function compact(n) {
    var mn = PK.i18n.lang === 'mn', a = Math.abs(n), v;
    if (a >= 1e9) { v = n / 1e9; return trim(v) + (mn ? ' тэрбум' : 'B'); }
    if (a >= 1e6) { v = n / 1e6; return trim(v) + (mn ? ' сая' : 'M'); }
    if (a >= 1e4) { v = n / 1e3; return Math.round(v) + (mn ? ' мянга' : 'K'); }
    return U.int(n);
  }
  function trim(v) { return (Math.round(v * 10) / 10).toString(); }
  function compactMoney(n) { return compact(n) + (PK.i18n.lang === 'mn' && Math.abs(n) >= 1e4 ? ' ₮' : '₮'); }
  function shortDate(ms) { var d = new Date(ms); return String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0'); }
  var WEEKDAYS = { mn: ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
  function weekday(ms) { return WEEKDAYS[PK.i18n.lang][new Date(ms).getDay()]; }

  /* ───────── Status pills (icon/dot + label, never colour alone) ───────── */
  var ORDER_DOT = { new: '#fab219', confirmed: '#6F6C6B', paid: '#0ca30c', shipped: '#000000', completed: '#0ca30c', cancelled: '#d03b3b' };
  function orderPill(status) {
    return '<span class="badge bg-canvas text-ink"><span class="h-2 w-2 rounded-full" style="background:' + ORDER_DOT[status] + '"></span>' + esc(t('a.os.' + status)) + '</span>';
  }
  function stockPill(status) {
    if (status === 'out') return '<span class="badge bg-bad-soft text-bad">' + icon('xCircle', 'h-3.5 w-3.5') + esc(t('a.st.out')) + '</span>';
    if (status === 'low') return '<span class="badge bg-[#FFF4DA] text-[#7A4D00]">' + icon('alert', 'h-3.5 w-3.5') + esc(t('a.st.low')) + '</span>';
    return '<span class="badge bg-canvas text-ink"><span class="h-2 w-2 rounded-full bg-[#0ca30c]"></span>' + esc(t('a.st.ok')) + '</span>';
  }

  /* ───────── Switch ───────── */
  function toggle(attrs, on, label) {
    return '<button type="button" role="switch" aria-checked="' + on + '" aria-label="' + esc(label) + '" ' + attrs + ' class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ' + (on ? 'bg-ink' : 'bg-line-strong') + '">' +
      '<span class="inline-block h-5 w-5 rounded-full bg-white shadow-pill transition-transform ' + (on ? 'translate-x-[22px]' : 'translate-x-0.5') + '"></span></button>';
  }

  /* ───────── Dialogs & drawers (focus-trapped, Escape to close) ───────── */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function trap(root, onEscape) {
    var handler = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); onEscape(); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    root.addEventListener('keydown', handler);
  }

  /** opts: { title, body, confirm, cancel, danger, onConfirm(form) -> false keeps it open, initial } */
  function dialog(opts) {
    var back = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-[60] flex items-end justify-center bg-black/30 p-4 backdrop-blur-[2px] sm:items-center';
    wrap.innerHTML = '<form role="dialog" aria-modal="true" aria-labelledby="dlg-title" class="w-full max-w-md rounded-panel bg-white p-6 shadow-float" novalidate>' +
      '<h2 id="dlg-title" class="h-section">' + esc(opts.title) + '</h2>' +
      (opts.body ? '<div class="mt-2 text-[15px] leading-relaxed text-muted">' + opts.body + '</div>' : '') +
      '<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">' +
        '<button type="button" data-cancel class="btn btn-secondary">' + esc(opts.cancel || t('a.cancel')) + '</button>' +
        '<button type="submit" class="btn ' + (opts.danger ? 'bg-bad text-white hover:bg-[#8F1C13]' : 'btn-primary') + '">' + esc(opts.confirm) + '</button>' +
      '</div></form>';
    document.body.appendChild(wrap);
    var form = wrap.querySelector('form');
    var close = function () { wrap.remove(); if (back && back.focus) back.focus(); };
    trap(form, close);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
    form.querySelector('[data-cancel]').addEventListener('click', close);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (opts.onConfirm && opts.onConfirm(form) === false) return;
      close();
    });
    (form.querySelector(opts.initial || 'input, [data-cancel]') || form).focus();
    return close;
  }

  /** Right-hand panel. opts: { title, html, onClose, wide }. Returns { el, close, setHtml }. */
  function drawer(opts) {
    var back = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-50 flex justify-end bg-black/25';
    wrap.innerHTML = '<aside role="dialog" aria-modal="true" aria-labelledby="drw-title" class="flex h-full w-full flex-col bg-white shadow-float ' + (opts.wide ? 'max-w-2xl' : 'max-w-lg') + '">' +
      '<header class="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6"><h2 id="drw-title" class="h-section">' + esc(opts.title) + '</h2>' +
      '<button type="button" data-close class="icon-btn" aria-label="' + esc(t('a.close')) + '">' + icon('close') + '</button></header>' +
      '<div data-body class="flex-1 overflow-y-auto px-5 py-5 sm:px-6"></div></aside>';
    document.body.appendChild(wrap);
    document.body.style.overflow = 'hidden';
    var panel = wrap.querySelector('aside');
    var body = wrap.querySelector('[data-body]');
    body.innerHTML = opts.html || '';
    var close = function () {
      wrap.remove();
      document.body.style.overflow = '';
      if (opts.onClose) opts.onClose();
      if (back && back.focus) back.focus();
    };
    trap(panel, close);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('[data-close]').addEventListener('click', close);
    wrap.querySelector('[data-close]').focus();
    return { el: body, close: close, setHtml: function (h) { body.innerHTML = h; } };
  }

  /* ───────── Stat tile ───────── */
  /** label, value (display string), delta (percent or null), periodDays, upIsGood */
  function statTile(label, value, delta, days) {
    var deltaHtml = '';
    if (delta != null && isFinite(delta)) {
      var r = Math.round(delta * 10) / 10;
      if (r === 0) deltaHtml = '<p class="mt-2 text-[13px] text-muted">' + esc(t('a.kpi.same')) + '</p>';
      else {
        var up = r > 0;
        deltaHtml = '<p class="mt-2 flex flex-wrap items-center gap-x-1 text-[13px]"><span class="inline-flex items-center gap-0.5 font-semibold ' + (up ? 'text-[#006300]' : 'text-bad') + '">' +
          icon(up ? 'up' : 'down', 'h-3.5 w-3.5') + (up ? '+' : '−') + Math.abs(r) + '%</span><span class="text-muted">' + esc(t('a.kpi.vs', { n: days })) + '</span></p>';
      }
    }
    return '<div class="panel p-5"><p class="text-sm text-muted">' + esc(label) + '</p>' +
      '<p class="mt-2 text-[28px] font-semibold leading-none" style="letter-spacing:-0.04em">' + esc(value) + '</p>' + deltaHtml + '</div>';
  }

  /* ───────── Ranked bars (meter list, one hue) ───────── */
  /** rows: [{ label, meta, value, display }] */
  function rankedBars(rows) {
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    return '<ol class="space-y-4">' + rows.map(function (r) {
      var pct = Math.max(2, Math.round((r.value / max) * 100));
      return '<li><div class="flex items-baseline justify-between gap-3"><span class="min-w-0 truncate text-sm font-medium" title="' + esc(r.label) + '">' + esc(r.label) + '</span>' +
        '<span class="shrink-0 text-sm font-semibold tnum">' + esc(r.display) + '</span></div>' +
        '<div class="mt-1.5 flex items-center gap-3"><span class="h-2 flex-1 overflow-hidden rounded-full bg-canvas"><span class="block h-full rounded-full bg-ink" style="width:' + pct + '%"></span></span>' +
        (r.meta ? '<span class="w-20 shrink-0 text-right text-xs text-muted tnum">' + esc(r.meta) + '</span>' : '') + '</div></li>';
    }).join('') + '</ol>';
  }

  /* ───────── Column chart ───────── */
  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }

  /**
   * points: [{ label, full, value }] — label for the axis, full for tooltip/table.
   * Renders into host (position: relative). Re-renders on resize.
   */
  function columnChart(host, points, opts) {
    opts = opts || {};
    var H = opts.height || 240;
    function draw() {
      var W = Math.max(280, host.clientWidth);
      var m = { top: 14, right: 6, bottom: 30, left: 64 };
      var iw = W - m.left - m.right, ih = H - m.top - m.bottom;
      var max = Math.max.apply(null, points.map(function (p) { return p.value; }).concat([0]));
      var step = niceStep(Math.max(max, 1) / 4);
      var top = Math.max(step, Math.ceil(max / step) * step);
      var ticks = [];
      for (var v = 0; v <= top + 1e-9; v += step) ticks.push(v);
      var band = iw / points.length;
      var bw = Math.max(3, Math.min(24, band * 0.62));
      var every = points.length <= 8 ? 1 : points.length <= 16 ? 2 : 5;
      var svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" class="block" role="img" aria-label="' + esc(opts.label || '') + '">';
      ticks.forEach(function (tv) {
        var y = m.top + ih - (tv / top) * ih;
        svg += '<line x1="' + m.left + '" x2="' + (W - m.right) + '" y1="' + y + '" y2="' + y + '" stroke="' + (tv === 0 ? '#CCCCCC' : '#EBEBEB') + '" stroke-width="1"/>' +
          '<text x="' + (m.left - 10) + '" y="' + y + '" text-anchor="end" dominant-baseline="middle" font-size="12" fill="#6F6C6B" style="font-variant-numeric:tabular-nums">' + esc(compact(tv)) + '</text>';
      });
      points.forEach(function (p, i) {
        var x = m.left + i * band + (band - bw) / 2;
        var h = (p.value / top) * ih;
        var y = m.top + ih - h;
        var r = Math.min(4, h, bw / 2);
        var d = h <= 0 ? '' : 'M' + x + ',' + (m.top + ih) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + y + ' ' + (x + bw) + ',' + (y + r) + 'V' + (m.top + ih) + 'Z';
        svg += '<g data-i="' + i + '" tabindex="0" role="img" aria-label="' + esc(p.full + ': ' + U.money(p.value)) + '" class="outline-none">' +
          '<rect x="' + (m.left + i * band) + '" y="' + m.top + '" width="' + band + '" height="' + ih + '" fill="transparent"/>' +
          (d ? '<path d="' + d + '" fill="#1F1F1F" data-bar/>' : '') + '</g>';
        if (i % every === 0 || i === points.length - 1 && points.length <= 8) {
          svg += '<text x="' + (m.left + i * band + band / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="12" fill="#6F6C6B">' + esc(p.label) + '</text>';
        }
      });
      svg += '</svg>';
      host.innerHTML = svg + '<div data-tip class="pointer-events-none absolute z-10 hidden min-w-[8rem] rounded-xl bg-white px-3 py-2 shadow-float"></div>';
      var tip = host.querySelector('[data-tip]');
      var show = function (g) {
        var i = +g.getAttribute('data-i');
        var p = points[i];
        host.querySelectorAll('[data-bar]').forEach(function (b) { b.setAttribute('fill', '#1F1F1F'); });
        var bar = g.querySelector('[data-bar]');
        if (bar) bar.setAttribute('fill', '#5A5A5A');
        tip.innerHTML = '';
        var val = document.createElement('p'); val.className = 'text-sm font-semibold tnum'; val.textContent = U.money(p.value);
        var lab = document.createElement('p'); lab.className = 'text-xs text-muted'; lab.textContent = p.full;
        tip.appendChild(val); tip.appendChild(lab);
        if (p.sub) { var s = document.createElement('p'); s.className = 'text-xs text-muted'; s.textContent = p.sub; tip.appendChild(s); }
        tip.classList.remove('hidden');
        var cx = m.left + i * band + band / 2;
        var left = Math.min(Math.max(cx - tip.offsetWidth / 2, 0), W - tip.offsetWidth);
        var barTop = m.top + ih - (p.value / top) * ih;
        tip.style.left = left + 'px';
        tip.style.top = Math.max(0, barTop - tip.offsetHeight - 8) + 'px';
      };
      var hide = function () {
        tip.classList.add('hidden');
        host.querySelectorAll('[data-bar]').forEach(function (b) { b.setAttribute('fill', '#1F1F1F'); });
      };
      host.querySelectorAll('g[data-i]').forEach(function (g) {
        g.addEventListener('pointerenter', function () { show(g); });
        g.addEventListener('focus', function () { show(g); });
        g.addEventListener('pointerleave', hide);
        g.addEventListener('blur', hide);
      });
    }
    draw();
    if (window.ResizeObserver) {
      var last = host.clientWidth;
      var ro = new ResizeObserver(U.debounce(function () { if (host.isConnected && host.clientWidth !== last) { last = host.clientWidth; draw(); } }, 120));
      ro.observe(host);
    }
  }

  /* ───────── Misc ───────── */
  function thumb(p, s, color, cls) {
    return '<span class="tile flex shrink-0 items-center justify-center p-1 ' + (cls || 'h-11 w-11') + '">' + PK.ui.productImage(p, s, color || p.colors[0], { pad: 0.04 }) + '</span>';
  }
  function swatch(c) {
    return '<span class="swatch shrink-0" style="background:' + PK.COLORS[c].swatch + '"></span>';
  }
  function empty(title, body, action) {
    return '<div class="flex flex-col items-center px-6 py-14 text-center"><p class="h-section">' + esc(title) + '</p>' +
      (body ? '<p class="mt-1.5 max-w-sm text-muted">' + esc(body) + '</p>' : '') + (action || '') + '</div>';
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
    }
    return Promise.resolve(false);
  }

  return {
    icon: icon, compact: compact, compactMoney: compactMoney, shortDate: shortDate, weekday: weekday,
    orderPill: orderPill, stockPill: stockPill, toggle: toggle, dialog: dialog, drawer: drawer,
    statTile: statTile, rankedBars: rankedBars, columnChart: columnChart, thumb: thumb, swatch: swatch,
    empty: empty, copyText: copyText,
  };
})();
