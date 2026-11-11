/**
 * Admin shell: demo sign-in, sidebar navigation, hash router (#/products/…),
 * unsaved-changes guard, and shared page-header / tabs / search helpers.
 */
window.PK = window.PK || {};

PK.adminApp = (function () {
  var A = PK.admin, ui = PK.aui, t = PK.t, U = PK.util, esc = U.esc;
  var root = document.getElementById('admin');

  // Demo credentials. A live site must check sign-in on a server.
  var DEMO = { email: 'admin@demo.mn', password: 'admin123' };
  var SESSION = 'pk.admin.session';
  var memorySession = false;

  var views = {};
  var guard = null;        // () => true when the current view has unsaved changes
  var lastHash = location.hash;
  var ignoreNextHash = false;

  var NAV = [
    { id: 'dashboard', hash: '#/', icon: 'overview', key: 'a.nav.dashboard' },
    { id: 'products', hash: '#/products', icon: 'products', key: 'a.nav.products' },
    { id: 'inventory', hash: '#/inventory', icon: 'inventory', key: 'a.nav.inventory' },
    { id: 'orders', hash: '#/orders', icon: 'orders', key: 'a.nav.orders' },
    { id: 'customers', hash: '#/customers', icon: 'customers', key: 'a.nav.customers' },
    { id: 'messages', hash: '#/messages', icon: 'messages', key: 'a.nav.messages' },
    { id: 'settings', hash: '#/settings', icon: 'settings', key: 'a.nav.settings' },
  ];

  /* ───────── Session ───────── */
  function signedIn() {
    try { return sessionStorage.getItem(SESSION) === '1' || memorySession; } catch (e) { return memorySession; }
  }
  function setSession(on) {
    memorySession = on;
    try { if (on) sessionStorage.setItem(SESSION, '1'); else sessionStorage.removeItem(SESSION); } catch (e) { /* memory only */ }
  }

  function renderLogin() {
    document.title = t('a.login.title') + ' | ' + PK.CONFIG.brand.name;
    root.innerHTML =
      '<main class="flex min-h-screen items-center justify-center px-4 py-10">' +
        '<form id="login" class="panel w-full max-w-sm p-7" novalidate>' +
          '<p class="text-[1.2rem] font-semibold" style="letter-spacing:-0.05em">package<span class="text-violet">.</span>mgl <span class="ml-1 rounded-full bg-canvas px-2 py-0.5 align-middle text-xs font-medium tracking-normal">' + esc(t('a.title')) + '</span></p>' +
          '<h1 class="h-section mt-6">' + esc(t('a.login.title')) + '</h1>' +
          '<div class="mt-5 space-y-4">' +
            PK.ui.field({ id: 'l-email', name: 'email', label: t('field.email'), type: 'email', rules: 'required email', autocomplete: 'username', value: DEMO.email }) +
            PK.ui.field({ id: 'l-pass', name: 'password', label: t('field.password'), type: 'password', rules: 'required', autocomplete: 'current-password' }) +
          '</div>' +
          '<p id="l-error" class="mt-4 rounded-[20px] bg-bad-soft px-4 py-3 text-sm text-bad" role="alert" hidden></p>' +
          '<button type="submit" class="btn btn-primary mt-6 w-full">' + esc(t('a.login.submit')) + '</button>' +
          '<p class="mt-5 rounded-[20px] bg-canvas px-4 py-3 text-[13px] leading-relaxed text-muted">' + esc(t('a.login.demo', DEMO)) + '<br>' + esc(t('a.login.note')) + '</p>' +
        '</form>' +
      '</main>';
    var form = U.qs('#login');
    PK.ui.liveClear(form);
    U.qs('#l-pass').focus();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!PK.ui.validate(form)) return;
      var ok = U.qs('#l-email').value.trim().toLowerCase() === DEMO.email && U.qs('#l-pass').value === DEMO.password;
      if (!ok) { var err = U.qs('#l-error'); err.textContent = t('a.login.error'); err.hidden = false; return; }
      setSession(true);
      start();
    });
  }

  /* ───────── Shell ───────── */
  function navCounts() {
    var counts = A.statusCounts(A.orders());
    var stock = A.stockRows();
    return {
      orders: counts.new,
      messages: A.unreadCount(),
      inventory: stock.filter(function (r) { return r.status !== 'ok'; }).length,
    };
  }

  function navList(current) {
    var c = navCounts();
    return '<ul class="space-y-1">' + NAV.map(function (n) {
      var on = n.id === current;
      var badge = '';
      if (n.id === 'orders' && c.orders) badge = '<span class="ml-auto rounded-full bg-ink px-2 text-xs font-semibold leading-5 text-white tnum">' + c.orders + '</span>';
      if (n.id === 'messages' && c.messages) badge = '<span class="ml-auto rounded-full bg-ink px-2 text-xs font-semibold leading-5 text-white tnum">' + c.messages + '</span>';
      if (n.id === 'inventory' && c.inventory) badge = '<span class="ml-auto inline-flex items-center gap-1 rounded-full bg-[#FFF4DA] px-2 text-xs font-semibold leading-5 text-[#7A4D00] tnum">' + ui.icon('alert', 'h-3 w-3') + c.inventory + '</span>';
      return '<li><a href="' + n.hash + '" class="flex h-11 items-center gap-3 rounded-[20px] px-3 text-[15px] transition-colors ' +
        (on ? 'bg-canvas font-medium text-ink' : 'text-muted hover:bg-canvas/60 hover:text-ink') + '"' + (on ? ' aria-current="page"' : '') + '>' +
        ui.icon(n.icon) + '<span>' + esc(t(n.key)) + '</span>' + badge + '</a></li>';
    }).join('') + '</ul>';
  }

  function sideFooter() {
    return '<div class="space-y-1 border-t border-line pt-3">' +
      '<a href="index.html" target="_blank" rel="noopener" class="flex h-11 items-center gap-3 rounded-[20px] px-3 text-[15px] text-muted hover:bg-canvas/60 hover:text-ink">' + ui.icon('external') + esc(t('a.nav.store')) + '</a>' +
      '<button type="button" data-lang class="flex h-11 w-full items-center gap-3 rounded-[20px] px-3 text-left text-[15px] text-muted hover:bg-canvas/60 hover:text-ink">' + PK.ui.icon('globe') + esc(t('lang.other')) + '</button>' +
      '<button type="button" data-logout class="flex h-11 w-full items-center gap-3 rounded-[20px] px-3 text-left text-[15px] text-muted hover:bg-canvas/60 hover:text-ink">' + PK.ui.icon('logout') + esc(t('a.nav.logout')) + '</button>' +
    '</div>';
  }

  function brand() {
    return '<a href="#/" class="flex items-center gap-2 px-3 py-2"><span class="text-[1.15rem] font-semibold" style="letter-spacing:-0.05em">package<span class="text-violet">.</span>mgl</span>' +
      '<span class="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium">' + esc(t('a.title')) + '</span></a>';
  }

  function renderShell() {
    root.innerHTML =
      '<a href="#a-main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">' + esc(t('skip')) + '</a>' +
      '<div class="lg:flex">' +
        '<aside class="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 bg-white p-3 lg:flex" aria-label="' + esc(t('a.title')) + '">' +
          brand() + '<nav id="a-nav" class="flex-1 overflow-y-auto" aria-label="' + esc(t('a.title')) + '"></nav>' + sideFooter() +
        '</aside>' +
        '<header class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-white px-2 lg:hidden">' +
          '<button type="button" id="a-menu" class="icon-btn" aria-label="' + esc(t('a.nav.menu')) + '" aria-expanded="false">' + PK.ui.icon('menu') + '</button>' + brand() +
        '</header>' +
        '<div class="min-w-0 flex-1">' +
          '<div id="a-banner"></div>' +
          '<main id="a-main" class="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"></main>' +
        '</div>' +
      '</div>';
    root.querySelectorAll('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { PK.i18n.setLang(PK.i18n.lang === 'mn' ? 'en' : 'mn'); }); });
    root.querySelectorAll('[data-logout]').forEach(function (b) { b.addEventListener('click', logout); });
    U.qs('#a-menu').addEventListener('click', openMobileNav);
  }

  function openMobileNav() {
    var btn = U.qs('#a-menu');
    btn.setAttribute('aria-expanded', 'true');
    var wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-50 bg-black/25 lg:hidden';
    wrap.innerHTML = '<nav class="flex h-full w-72 max-w-[85vw] flex-col gap-4 bg-white p-3 shadow-float" aria-label="' + esc(t('a.title')) + '">' +
      '<div class="flex items-center justify-between">' + brand() + '<button type="button" data-close class="icon-btn" aria-label="' + esc(t('a.close')) + '">' + PK.ui.icon('close') + '</button></div>' +
      '<div class="flex-1 overflow-y-auto">' + navList(currentView) + '</div>' + sideFooter() + '</nav>';
    document.body.appendChild(wrap);
    var close = function () { wrap.remove(); btn.setAttribute('aria-expanded', 'false'); btn.focus(); };
    wrap.addEventListener('click', function (e) { if (e.target === wrap || e.target.closest('[data-close]') || e.target.closest('a[href^="#"]')) close(); });
    wrap.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    wrap.querySelectorAll('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { PK.i18n.setLang(PK.i18n.lang === 'mn' ? 'en' : 'mn'); }); });
    wrap.querySelectorAll('[data-logout]').forEach(function (b) { b.addEventListener('click', logout); });
    wrap.querySelector('[data-close]').focus();
  }

  function renderBanner() {
    var host = U.qs('#a-banner');
    if (!host) return;
    var n = A.sampleCounts().orders;
    host.innerHTML = n ? '<div class="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-4 text-[13px] text-muted sm:px-6 lg:px-8">' +
      '<span class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-pill"><span class="h-2 w-2 rounded-full bg-[#fab219]"></span>' + esc(t('a.demo.banner')) +
      ' <a class="link text-[13px]" href="#/settings">' + esc(t('a.demo.manage')) + '</a></span></div>' : '';
  }

  function refreshNav() {
    var nav = U.qs('#a-nav');
    if (nav) nav.innerHTML = navList(currentView);
    renderBanner();
  }

  function logout() {
    setSession(false);
    location.hash = '';
    renderLogin();
  }

  /* ───────── Router ───────── */
  var currentView = 'dashboard';
  function parse(hash) {
    var h = (hash || '').replace(/^#/, '') || '/';
    var q = h.split('?');
    var parts = q[0].split('/').filter(Boolean);
    var params = new URLSearchParams(q[1] || '');
    if (!parts.length) return { view: 'dashboard', params: params };
    if (parts[0] === 'products' && parts[1]) return { view: 'product-edit', id: parts[1] === 'new' ? null : decodeURIComponent(parts[1]), params: params };
    return { view: views[parts[0]] ? parts[0] : 'dashboard', params: params };
  }

  function route() {
    PK.catalogStore.reload();     // always render from the latest saved data (other tabs may have changed it)
    var r = parse(location.hash);
    currentView = r.view === 'product-edit' ? 'products' : r.view;
    guard = null;
    var main = U.qs('#a-main');
    main.innerHTML = '';
    views[r.view](main, r);
    refreshNav();
    var h1 = main.querySelector('h1');
    document.title = (h1 ? h1.textContent : t('a.title')) + ' | ' + t('a.title');
    window.scrollTo(0, 0);
    if (h1 && document.activeElement && document.activeElement !== document.body) h1.focus({ preventScroll: true });
    lastHash = location.hash;
  }

  function onHashChange() {
    if (ignoreNextHash) { ignoreNextHash = false; return; }
    if (guard && guard()) {
      var target = location.hash;
      ignoreNextHash = true;
      location.hash = lastHash;
      ui.dialog({
        title: t('a.leave.title'), body: esc(t('a.leave.body')), confirm: t('a.leave.confirm'), cancel: t('a.leave.stay'), danger: true,
        onConfirm: function () { guard = null; location.hash = target; },
      });
      return;
    }
    route();
  }

  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  /* ───────── Shared page pieces ───────── */
  function header(title, actions, sub) {
    return '<div class="mb-6 flex flex-wrap items-end justify-between gap-4"><div class="min-w-0"><h1 class="h-page outline-none" tabindex="-1">' + esc(title) + '</h1>' +
      (sub ? '<p class="mt-1 text-muted">' + sub + '</p>' : '') + '</div>' +
      (actions ? '<div class="flex flex-wrap items-center gap-2">' + actions + '</div>' : '') + '</div>';
  }

  /** Pill tabs. items: [{ id, label, count }] */
  function tabs(items, active, attr) {
    return '<div class="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-pill" role="group">' + items.map(function (it) {
      var on = it.id === active;
      return '<button type="button" ' + attr + '="' + it.id + '" aria-pressed="' + on + '" class="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm transition-colors ' +
        (on ? 'bg-ink font-medium text-white' : 'text-muted hover:text-ink') + '">' + esc(it.label) +
        (it.count != null ? '<span class="tnum ' + (on ? 'text-white/70' : 'text-muted') + '">' + it.count + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }

  function search(id, placeholder, value) {
    return '<label class="relative block w-full sm:w-72"><span class="sr-only">' + esc(placeholder) + '</span>' +
      '<span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">' + PK.ui.icon('search', 'h-[18px] w-[18px]') + '</span>' +
      '<input id="' + id + '" type="search" value="' + esc(value || '') + '" placeholder="' + esc(placeholder) + '" autocomplete="off" class="field-input h-11 pl-11 text-sm"></label>';
  }

  /* ───────── Boot ───────── */
  function start() {
    A.seedOnce();
    renderShell();
    route();
  }

  document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('beforeunload', function (e) { if (guard && guard()) { e.preventDefault(); e.returnValue = ''; } });
    // Another tab (e.g. the storefront) saved orders, stock or products: refresh, unless an edit is in progress.
    window.addEventListener('storage', U.debounce(function (e) {
      if (!e.key || e.key.indexOf('pk.') !== 0 || !signedIn() || !U.qs('#a-main')) return;
      if (guard && guard()) return;
      if (document.querySelector('[role="dialog"]')) { refreshNav(); return; }
      route();
    }, 300));
    if (signedIn()) start(); else renderLogin();
  });

  return {
    view: function (name, fn) { views[name] = fn; },
    setGuard: function (fn) { guard = fn; },
    go: go, refreshNav: refreshNav, header: header, tabs: tabs, search: search, rerender: route,
  };
})();
