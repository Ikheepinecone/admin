/**
 * Shared page chrome and UI building blocks:
 * header, footer, icons, toasts, compare tray, product card, quantity stepper,
 * and form validation. Runs on every page before the page script.
 */
window.PK = window.PK || {};

(function () {
  var U = PK.util, t = PK.t, loc = PK.loc, esc = U.esc;
  var C = PK.CONFIG;

  /* ───────────────────────── Icons ───────────────────────── */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    bag: '<path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    user: '<circle cx="12" cy="8" r="3.75"/><path d="M4.5 20c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.9 12.5h9.2L17.5 7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
    compare: '<rect x="3.5" y="8" width="8" height="12" rx="1"/><rect x="12.5" y="4" width="8" height="16" rx="1"/>',
    phone: '<path d="M6.5 4h3l1.6 4.2-2 1.3a11 11 0 0 0 5.4 5.4l1.3-2L20 14.5v3a2 2 0 0 1-2.1 2A15.5 15.5 0 0 1 4.5 6.1 2 2 0 0 1 6.5 4z"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7.5l8 5.5 8-5.5"/>',
    pin: '<path d="M12 21s-6.5-5.9-6.5-11a6.5 6.5 0 0 1 13 0c0 5.1-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    truck: '<path d="M3 6.5h11v9.5H3zM14 9.5h3.8l3.2 3.3V16H14"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    rows: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    ruler: '<path d="M3.5 16.5L16.5 3.5l4 4-13 13z"/><path d="M7 13l1.8 1.8M10 10l1.8 1.8M13 7l1.8 1.8"/>',
    logout: '<path d="M9.5 4H5.5v16h4M14 8l4 4-4 4M18 12H9"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.3 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.3-3.5-8.5s1.1-6 3.5-8.5z"/>',
    facebook: '<path fill="currentColor" stroke="none" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z"/>',
  };

  function icon(name, cls) {
    return '<svg class="' + (cls || 'h-5 w-5') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }

  /* ───────────────────────── Header ───────────────────────── */
  var page = document.body.getAttribute('data-page') || '';

  function logo() {
    return '<a href="index.html" class="flex shrink-0 items-center gap-2.5 rounded-ctl" aria-label="' + esc(C.brand.name) + ', ' + esc(t('nav.home')) + '">' +
      '<svg class="h-7 w-7" viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="11" width="22" height="18" rx="4" fill="#fff" stroke="#000" stroke-width="2"/>' +
      '<path d="M11 11.5c0-5 1.8-7.5 5-7.5s5 2.5 5 7.5" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<span class="text-[1.2rem] font-semibold" style="letter-spacing:-0.05em">package<span class="text-violet">.</span>mgl</span></a>';
  }

  var NAV = [
    { key: 'nav.products', href: 'products.html', id: 'products' },
    { key: 'nav.finder', href: 'products.html?view=sizes', id: 'sizes' },
    { key: 'nav.about', href: 'index.html#about', id: 'about' },
    { key: 'nav.contact', href: 'contact.html', id: 'contact' },
  ];

  function isCurrent(item) {
    if (item.id === 'products') return page === 'products' && U.param('view') !== 'sizes' || page === 'product';
    if (item.id === 'sizes') return page === 'products' && U.param('view') === 'sizes';
    return item.id === page;
  }

  function renderHeader() {
    var host = document.getElementById('site-header');
    if (!host) return;
    var user = PK.store.auth.current();
    var q = page === 'products' ? (U.param('q') || '') : '';
    var navLinks = NAV.map(function (n) {
      var cur = isCurrent(n);
      return '<a href="' + n.href + '" class="whitespace-nowrap rounded-full px-4 py-2 text-[15px] transition-colors hover:bg-mist' +
        (cur ? ' bg-mist font-medium text-ink' : ' text-muted hover:text-ink') + '"' + (cur ? ' aria-current="page"' : '') + '>' + esc(t(n.key)) + '</a>';
    }).join('');

    var searchForm = function (idSuffix, extra) {
      return '<form action="products.html" method="get" role="search" class="relative ' + (extra || '') + '">' +
        '<label for="q-' + idSuffix + '" class="sr-only">' + esc(t('search.label')) + '</label>' +
        '<input id="q-' + idSuffix + '" name="q" type="search" value="' + esc(q) + '" placeholder="' + esc(t('search.placeholder')) + '" autocomplete="off" class="field-input h-11 pl-5 pr-12 text-sm">' +
        '<button type="submit" class="btn-search absolute right-1 top-1 h-9 w-9" aria-label="' + esc(t('search.label')) + '">' + icon('arrowRight', 'h-4 w-4') + '</button></form>';
    };

    host.innerHTML =
      '<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-ctl focus:bg-ink focus:px-4 focus:py-2 focus:text-white">' + esc(t('skip')) + '</a>' +
      '<header class="border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">' +
        '<div class="container-page flex h-16 items-center gap-3 lg:gap-6">' +
          logo() +
          '<nav class="hidden items-center gap-0.5 xl:flex" aria-label="Main">' + navLinks + '</nav>' +
          searchForm('desk', 'ml-auto hidden w-full max-w-sm xl:max-w-[16rem] ' + (page === 'home' ? '' : 'md:block')) +
          '<div class="ml-auto flex items-center gap-0.5' + (page === 'home' ? '' : ' md:ml-0') + '">' +
            '<button type="button" data-lang-toggle class="icon-btn hidden w-auto gap-1.5 px-2.5 text-sm font-semibold sm:inline-flex" aria-label="' + esc(t('lang.switchLabel')) + '">' + icon('globe', 'h-[18px] w-[18px]') + esc(t('lang.otherShort')) + '</button>' +
            '<a href="account.html" class="icon-btn w-auto gap-2 px-2.5"' + (page === 'account' ? ' aria-current="page"' : '') + ' aria-label="' + esc(user ? t('nav.account') : t('nav.login')) + '">' +
              (user ? '<span class="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">' + esc(user.name.charAt(0).toUpperCase()) + '</span>' : icon('user')) +
              '<span class="hidden max-w-[9rem] truncate whitespace-nowrap text-sm font-medium xl:inline">' + esc(user ? user.name.split(' ')[0] : t('nav.login')) + '</span></a>' +
            '<a href="cart.html" class="icon-btn relative" data-cart-link' + (page === 'cart' ? ' aria-current="page"' : '') + '>' + icon('bag') +
              '<span data-cart-count class="absolute right-0 top-0 hidden min-w-[1.25rem] rounded-full bg-ink px-1 text-center text-[11px] font-semibold leading-5 text-white ring-2 ring-white tnum"></span></a>' +
            '<button type="button" class="icon-btn xl:hidden" data-menu-open aria-expanded="false" aria-controls="mobile-menu" aria-label="' + esc(t('nav.menu')) + '">' + icon('menu') + '</button>' +
          '</div>' +
        '</div>' +
        '<div id="mobile-menu" class="border-t border-line bg-white xl:hidden" hidden>' +
          '<div class="container-page space-y-4 py-4">' +
            searchForm('mob', 'md:hidden') +
            '<nav class="grid gap-1" aria-label="Main">' + NAV.map(function (n) {
              return '<a href="' + n.href + '" class="flex items-center justify-between rounded-full px-4 py-3 text-base hover:bg-mist"' + (isCurrent(n) ? ' aria-current="page"' : '') + '>' + esc(t(n.key)) + icon('chevronRight', 'h-4 w-4 text-muted') + '</a>';
            }).join('') + '</nav>' +
            '<button type="button" data-lang-toggle class="btn btn-secondary btn-sm w-full sm:hidden">' + icon('globe', 'h-[18px] w-[18px]') + esc(t('lang.other')) + '</button>' +
          '</div>' +
        '</div>' +
      '</header>';

    if (page !== 'products') {
      host.querySelectorAll('form[role="search"]').forEach(function (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var q = form.querySelector('input').value.trim();
          location.href = 'products.html' + (q ? '?q=' + encodeURIComponent(q) : '');
        });
      });
    }
    host.querySelectorAll('[data-lang-toggle]').forEach(function (b) {
      b.addEventListener('click', function () { PK.i18n.setLang(PK.i18n.lang === 'mn' ? 'en' : 'mn'); });
    });
    var btn = host.querySelector('[data-menu-open]');
    var menu = host.querySelector('#mobile-menu');
    btn.addEventListener('click', function () {
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', t(open ? 'nav.close' : 'nav.menu'));
      btn.innerHTML = icon(open ? 'close' : 'menu');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.innerHTML = icon('menu'); btn.focus(); }
    });
    updateCartCount();
  }

  function updateCartCount() {
    var n = PK.store.cart.count();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = n > 99 ? '99+' : String(n);
      el.classList.toggle('hidden', n === 0);
    });
    document.querySelectorAll('[data-cart-link]').forEach(function (a) { a.setAttribute('aria-label', t('nav.cartCount', { n: n })); });
  }

  /* ───────────────────────── Footer ───────────────────────── */
  function renderFooter() {
    var host = document.getElementById('site-footer');
    if (!host) return;
    var cats = PK.CATEGORIES.map(function (c) {
      return '<li><a class="hover:text-white" href="products.html?cat=' + c.id + '">' + esc(loc(c.name)) + '</a></li>';
    }).join('');
    host.innerHTML =
      '<footer class="mt-20 bg-ink text-white/70">' +
        '<div class="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">' +
          '<div class="space-y-4">' +
            '<p class="text-lg font-semibold text-white" style="letter-spacing:-0.05em">package<span class="text-violet-wash">.</span>mgl</p>' +
            '<p class="max-w-xs text-sm leading-relaxed">' + esc(t('footer.tagline')) + '</p>' +
            '<ul class="space-y-2 text-sm">' +
              '<li><a class="inline-flex items-center gap-2 hover:text-white" href="' + C.contact.phoneHref + '">' + icon('phone', 'h-4 w-4') + esc(C.contact.phone) + '</a></li>' +
              '<li><a class="inline-flex items-center gap-2 hover:text-white" href="mailto:' + esc(C.contact.email) + '">' + icon('mail', 'h-4 w-4') + esc(C.contact.email) + '</a></li>' +
              '<li class="inline-flex items-center gap-2">' + icon('pin', 'h-4 w-4') + esc(loc(C.contact.address)) + '</li>' +
            '</ul>' +
          '</div>' +
          '<div><h2 class="mb-4 text-sm font-semibold text-white">' + esc(t('footer.shop')) + '</h2><ul class="space-y-2.5 text-sm">' + cats +
            '<li><a class="hover:text-white" href="products.html?view=sizes">' + esc(t('nav.finder')) + '</a></li></ul></div>' +
          '<div><h2 class="mb-4 text-sm font-semibold text-white">' + esc(t('footer.help')) + '</h2><ul class="space-y-2.5 text-sm">' +
            '<li><a class="hover:text-white" href="compare.html">' + esc(t('footer.compare')) + '</a></li>' +
            '<li><a class="hover:text-white" href="contact.html?topic=custom">' + esc(t('footer.custom')) + '</a></li>' +
            '<li><a class="hover:text-white" href="account.html">' + esc(t('nav.account')) + '</a></li></ul></div>' +
          '<div><h2 class="mb-4 text-sm font-semibold text-white">' + esc(t('footer.hours')) + '</h2><ul class="space-y-1.5 text-sm">' +
            loc(C.contact.hours).map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' +
            (C.social.length ? '<h2 class="mb-3 mt-7 text-sm font-semibold text-white">' + esc(t('footer.follow')) + '</h2><div class="flex gap-2">' +
            C.social.map(function (s) {
              return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener" class="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-sm hover:border-white/60 hover:text-white">' + icon(s.id, 'h-5 w-5') + esc(s.label) + '</a>';
            }).join('') + '</div>' : '') + '</div>' +
        '</div>' +
        '<div class="border-t border-white/10"><div class="container-page flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">' +
          '<p>© ' + new Date().getFullYear() + ' ' + esc(loc(C.brand.legalName)) + '. ' + esc(t('footer.rights')) + '</p>' +
          '<p>' + esc(t('common.vatIncl')) + '</p>' +
        '</div></div>' +
      '</footer>';
  }

  /* ───────────────────────── Toasts ───────────────────────── */
  function toast(message, opts) {
    opts = opts || {};
    var host = document.getElementById('toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toasts';
      host.setAttribute('aria-live', 'polite');
      host.className = 'pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4';
      document.body.appendChild(host);
    }
    var tray = document.getElementById('compare-tray');
    host.style.bottom = tray && !tray.hidden ? (tray.offsetHeight + 16) + 'px' : '';
    var el = document.createElement('div');
    el.className = 'toast-enter pointer-events-auto flex max-w-md items-center gap-4 rounded-[20px] bg-ink px-5 py-3 text-sm text-white shadow-float';
    el.innerHTML = '<span class="flex items-center gap-2">' + (opts.tone === 'error' ? '' : icon('check', 'h-[18px] w-[18px] text-[#9FE0BF]')) + esc(message) + '</span>';
    if (opts.action) {
      var a = document.createElement(opts.action.href ? 'a' : 'button');
      a.className = 'shrink-0 font-semibold underline underline-offset-4';
      a.textContent = opts.action.label;
      if (opts.action.href) a.href = opts.action.href;
      else { a.type = 'button'; a.addEventListener('click', function () { opts.action.onClick(); el.remove(); }); }
      el.appendChild(a);
    }
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, opts.duration || 4500);
  }

  /* ───────────────────────── Compare tray ───────────────────────── */
  function renderCompareTray() {
    var tray = document.getElementById('compare-tray');
    if (!tray) {
      tray = document.createElement('aside');
      tray.id = 'compare-tray';
      tray.setAttribute('aria-label', t('compare.title'));
      tray.className = 'fixed inset-x-0 bottom-0 z-30 bg-white/95 shadow-float backdrop-blur';
      document.body.appendChild(tray);
    }
    var list = PK.store.compare.list();
    if (!list.length || page === 'compare' || page === 'checkout') { tray.hidden = true; document.body.style.paddingBottom = ''; return; }
    tray.hidden = false;
    var thumbs = list.map(function (c) {
      var p = PK.shop.product(c.productId), s = p && PK.shop.size(p, c.size);
      if (!s) return '';
      return '<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stage p-1" title="' + esc(loc(p.name) + ', ' + s.code) + '">' + PK.art.product(PK.shop.artSpec(p, s), { pad: 0.04 }) + '</span>';
    }).join('');
    tray.innerHTML = '<div class="container-page flex items-center gap-3 py-3">' +
      '<div class="hidden gap-2 sm:flex">' + thumbs + '</div>' +
      '<p class="hidden text-sm font-medium tnum sm:block">' + esc(t('compare.tray', { n: list.length })) + '</p>' +
      '<div class="ml-auto flex gap-2"><button type="button" class="btn btn-quiet btn-sm" data-compare-clear>' + esc(t('compare.clear')) + '</button>' +
      '<a href="compare.html" class="btn btn-primary btn-sm">' + icon('compare', 'h-[18px] w-[18px]') + esc(t('compare.go')) + ' <span class="tnum sm:hidden">' + list.length + '/' + PK.store.compare.max + '</span></a></div></div>';
    tray.querySelector('[data-compare-clear]').addEventListener('click', function () { PK.store.compare.clear(); });
    document.body.style.paddingBottom = tray.offsetHeight + 'px';
  }

  function toggleCompare(productId, code) {
    var res = PK.store.compare.toggle(productId, code);
    if (res === 'full') toast(t('compare.full'), { tone: 'error', action: { label: t('compare.go'), href: 'compare.html' } });
    else toast(t(res === 'added' ? 'compare.added' : 'compare.removed'));
    return res;
  }

  /* ───────────────────────── Product card ───────────────────────── */
  function productImage(p, s, color, opts) {
    if (p.images && p.images.length) {
      return '<img src="' + esc(p.images[0]) + '" alt="' + esc(loc(p.name)) + '" loading="lazy" class="h-full w-full object-contain mix-blend-multiply">';
    }
    return PK.art.product(PK.shop.artSpec(p, s, color), Object.assign({ label: loc(p.name) + ', ' + PK.shop.dimsUnit(p, s) }, opts || {}));
  }

  /** opts.fitCount: number of sizes that fit the active fit filter */
  function productCard(p, opts) {
    opts = opts || {};
    var sizes = PK.shop.sizes(p);
    var s = opts.size || sizes[0];
    var url = PK.shop.url(p, opts.size);
    var badge = opts.fitCount != null
      ? '<span class="badge absolute left-2.5 top-2.5 bg-ink text-white">' + esc(t('catalog.fitsN', { n: opts.fitCount })) + '</span>'
      : '<span class="badge absolute left-2.5 top-2.5 bg-white text-ink shadow-pill">' + esc(t('common.sizesN', { n: sizes.length })) + '</span>';
    var swatches = p.colors.map(function (c) {
      return '<span class="swatch" style="background:' + PK.COLORS[c].swatch + '" title="' + esc(loc(PK.COLORS[c])) + '"></span>';
    }).join('');
    return '<article class="group flex flex-col rounded-panel bg-white p-2 shadow-card transition-shadow hover:shadow-float">' +
      '<a href="' + url + '" class="tile relative block aspect-square overflow-hidden" aria-label="' + esc(loc(p.name)) + '">' +
        badge +
        '<span class="absolute inset-0 p-[10%] pt-[16%]">' + productImage(p, s, p.colors[0], { pad: 0.06 }) + '</span>' +
      '</a>' +
      '<div class="flex flex-1 flex-col gap-0.5 px-2.5 pb-2 pt-3">' +
        '<h3 class="text-[15px] font-semibold leading-snug" style="letter-spacing:-0.03em"><a href="' + url + '" class="hover:underline hover:decoration-black/25 hover:underline-offset-4">' + esc(loc(p.name)) + '</a></h3>' +
        '<p class="text-[13px] text-muted">' + esc(loc(p.material)) + '</p>' +
        '<div class="mt-auto flex items-center justify-between gap-3 pt-2.5">' +
          '<p class="text-sm"><span class="text-muted">' + esc(t('common.from')) + '</span> <span class="font-semibold tnum">' + U.money(PK.shop.minPrice(p)) + '</span></p>' +
          '<span class="flex gap-1" aria-label="' + esc(t('product.color')) + ': ' + esc(p.colors.map(function (c) { return loc(PK.COLORS[c]); }).join(', ')) + '">' + swatches + '</span>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* ───────────────────────── Quantity stepper ───────────────────────── */
  function qtyStepper(id, value, min, step, label) {
    return '<div class="qty" data-qty data-min="' + min + '" data-step="' + step + '">' +
      '<button type="button" data-qty-dec aria-label="' + esc(t('product.qtyDec')) + '">' + icon('minus', 'h-4 w-4') + '</button>' +
      '<input id="' + id + '" type="number" inputmode="numeric" min="' + min + '" step="' + step + '" value="' + value + '" aria-label="' + esc(label || t('product.qty')) + '">' +
      '<button type="button" data-qty-inc aria-label="' + esc(t('product.qtyInc')) + '">' + icon('plus', 'h-4 w-4') + '</button></div>';
  }

  /** Wire a stepper. onChange(value) fires with a value snapped to min/step. */
  function bindQty(root, onChange) {
    var input = root.querySelector('input');
    var min = +root.getAttribute('data-min'), step = +root.getAttribute('data-step');
    var dec = root.querySelector('[data-qty-dec]');
    function snap(v) {
      v = Math.round(+v || 0);
      if (v < min) v = min;
      var over = (v - min) % step;
      if (over) v = v - over + step;
      return v;
    }
    function set(v) {
      v = snap(v);
      input.value = v;
      dec.disabled = v <= min;
      onChange(v);
    }
    dec.disabled = +input.value <= min;
    dec.addEventListener('click', function () { set(+input.value - step); });
    root.querySelector('[data-qty-inc]').addEventListener('click', function () { set(+input.value + step); });
    input.addEventListener('change', function () { set(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); set(input.value); } });
    return { set: set, snap: snap };
  }

  /* ───────────────────────── Forms ───────────────────────── */
  /**
   * Validate fields carrying data-rules="required email phone password regno".
   * Shows inline messages, focuses the first invalid field, returns true when valid.
   */
  function validate(form) {
    var firstBad = null;
    U.qsa('[data-rules]', form).forEach(function (field) {
      if (field.closest('[hidden]') || field.disabled) { setError(field, null); return; }
      var rules = field.getAttribute('data-rules').split(/\s+/);
      var v = field.type === 'checkbox' ? (field.checked ? 'on' : '') : String(field.value || '').trim();
      var err = null;
      if (rules.indexOf('required') !== -1 && !v) err = 'err.required';
      else if (v && rules.indexOf('email') !== -1 && !U.isEmail(v)) err = 'err.email';
      else if (v && rules.indexOf('phone') !== -1 && !U.isPhone(v)) err = 'err.phone';
      else if (v && rules.indexOf('password') !== -1 && v.length < 6) err = 'err.password';
      else if (v && rules.indexOf('regno') !== -1 && !/^\d{7}$/.test(v)) err = 'err.regno';
      setError(field, err);
      if (err && !firstBad) firstBad = field;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function setError(field, key) {
    var id = field.id + '-error';
    var msg = document.getElementById(id);
    if (key) {
      if (!msg) {
        msg = document.createElement('p');
        msg.id = id;
        msg.className = 'field-error';
        (field.closest('[data-field]') || field.parentNode).appendChild(msg);
      }
      msg.textContent = t(key);
      field.setAttribute('aria-invalid', 'true');
      var described = (field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      if (described.indexOf(id) === -1) described.push(id);
      field.setAttribute('aria-describedby', described.join(' '));
    } else {
      if (msg) msg.remove();
      field.removeAttribute('aria-invalid');
    }
  }

  function liveClear(form) {
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') setError(e.target, null);
    });
  }

  /** Markup for a labelled input. opts: { id, label, type, rules, value, placeholder, autocomplete, hint, optional } */
  function field(o) {
    var label = esc(o.label) + (o.optional ? ' <span class="font-normal text-muted">(' + esc(t('common.optional')) + ')</span>' : '');
    var hintId = o.hint ? o.id + '-hint' : '';
    var attrs = 'id="' + o.id + '" name="' + (o.name || o.id) + '"' +
      (o.rules ? ' data-rules="' + o.rules + '"' : '') +
      (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : '') +
      (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') +
      (o.inputmode ? ' inputmode="' + o.inputmode + '"' : '') +
      (hintId ? ' aria-describedby="' + hintId + '"' : '') +
      (o.rules && o.rules.indexOf('required') !== -1 ? ' aria-required="true"' : '');
    var control = o.type === 'textarea'
      ? '<textarea ' + attrs + ' class="field-input" rows="5">' + esc(o.value || '') + '</textarea>'
      : o.type === 'select'
        ? '<select ' + attrs + ' class="field-input">' + o.options + '</select>'
        : '<input ' + attrs + ' type="' + (o.type || 'text') + '" value="' + esc(o.value || '') + '" class="field-input">';
    return '<div data-field class="' + (o.className || '') + '"><label for="' + o.id + '" class="field-label">' + label + '</label>' + control +
      (o.hint ? '<p id="' + hintId + '" class="field-hint">' + esc(o.hint) + '</p>' : '') + '</div>';
  }

  /** items: [{ label, href? }] — the last item is the current page. */
  function breadcrumb(items) {
    var host = document.getElementById('breadcrumb');
    if (!host) return;
    var all = [{ label: t('common.home'), href: 'index.html' }].concat(items);
    host.innerHTML = all.map(function (it, i) {
      var last = i === all.length - 1;
      var sep = i ? '<li aria-hidden="true" class="text-line-strong">/</li>' : '';
      return sep + '<li>' + (last || !it.href ? '<span' + (last ? ' aria-current="page" class="text-ink"' : '') + '>' + esc(it.label) + '</span>'
        : '<a class="hover:text-ink hover:underline hover:underline-offset-4" href="' + it.href + '">' + esc(it.label) + '</a>') + '</li>';
    }).join('');
  }

  /* ───────────────────────── Boot ───────────────────────── */
  var isAdmin = document.body.getAttribute('data-app') === 'admin';
  var titleKey = document.body.getAttribute('data-title');
  if (titleKey) document.title = t(titleKey) + ' | ' + C.brand.name;
  if (!isAdmin) {
    renderHeader();
    renderFooter();
    PK.i18n.apply(document);
    renderCompareTray();
    window.addEventListener('pk:cart', updateCartCount);
    window.addEventListener('pk:compare', renderCompareTray);
    window.addEventListener('pk:auth', renderHeader);
  }

  PK.ui = {
    icon: icon, toast: toast, productCard: productCard, productImage: productImage,
    qtyStepper: qtyStepper, bindQty: bindQty, toggleCompare: toggleCompare,
    validate: validate, setError: setError, liveClear: liveClear, field: field, breadcrumb: breadcrumb,
  };
})();
