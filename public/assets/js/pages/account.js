/** Account: email login / sign-up tabs, then order history with reorder and profile. */
(function () {
  var U = PK.util, t = PK.t, loc = PK.loc, esc = U.esc, ui = PK.ui, shop = PK.shop;
  var auth = PK.store.auth;
  var root = U.qs('#account-root');
  var next = U.param('next') === 'checkout' ? 'checkout.html' : null;

  /* ───────── Logged out ───────── */
  function passwordField(id, autocomplete, hint) {
    return '<div data-field><div class="mb-1.5 flex items-baseline justify-between"><label for="' + id + '" class="field-label mb-0">' + esc(t('field.password')) + '</label>' +
      '<button type="button" class="text-sm font-medium text-muted hover:text-ink" data-toggle-pw="' + id + '" aria-controls="' + id + '" aria-pressed="false">' + esc(t('field.show')) + '</button></div>' +
      '<input id="' + id + '" name="password" type="password" data-rules="required password" aria-required="true" autocomplete="' + autocomplete + '" class="field-input"' + (hint ? ' aria-describedby="' + id + '-hint"' : '') + '>' +
      (hint ? '<p id="' + id + '-hint" class="field-hint">' + esc(hint) + '</p>' : '') + '</div>';
  }

  function renderAuth(tab) {
    ui.breadcrumb([{ label: t('account.title') }]);
    var tabBtn = function (id, key) {
      var on = tab === id;
      return '<button type="button" role="tab" id="tab-' + id + '" aria-controls="panel-' + id + '" aria-selected="' + on + '" tabindex="' + (on ? '0' : '-1') + '" data-tab="' + id + '" ' +
        'class="h-10 rounded-full text-[15px] font-medium transition-colors ' + (on ? 'bg-ink text-white' : 'text-ink hover:bg-mist') + '">' + esc(t(key)) + '</button>';
    };
    root.innerHTML =
      '<div class="mx-auto max-w-md pt-4">' +
        '<h1 class="h-page">' + esc(t('account.title')) + '</h1>' +
        '<p class="mt-2 leading-relaxed text-muted">' + esc(t('auth.why')) + '</p>' +
        '<div role="tablist" aria-label="' + esc(t('account.title')) + '" class="mt-6 grid grid-cols-2 gap-1 rounded-full border border-line bg-white p-1 shadow-pill">' + tabBtn('login', 'auth.login') + tabBtn('register', 'auth.register') + '</div>' +
        '<div class="panel mt-4 p-6 sm:p-7">' +
          '<form id="panel-login" role="tabpanel" aria-labelledby="tab-login" class="space-y-5" novalidate' + (tab === 'login' ? '' : ' hidden') + '>' +
            '<h2 class="text-lg font-semibold">' + esc(t('auth.loginTitle')) + '</h2>' +
            ui.field({ id: 'login-email', name: 'email', label: t('field.email'), type: 'email', rules: 'required email', autocomplete: 'email' }) +
            passwordField('login-password', 'current-password') +
            '<p class="form-error hidden rounded-[20px] bg-bad-soft px-4 py-3 text-sm text-bad" role="alert"></p>' +
            '<button type="submit" class="btn btn-primary w-full">' + esc(t('auth.login')) + '</button>' +
            '<p class="text-center text-sm text-muted">' + esc(t('auth.noAccount')) + ' <button type="button" class="link" data-tab="register">' + esc(t('auth.register')) + '</button></p>' +
          '</form>' +
          '<form id="panel-register" role="tabpanel" aria-labelledby="tab-register" class="space-y-5" novalidate' + (tab === 'register' ? '' : ' hidden') + '>' +
            '<h2 class="text-lg font-semibold">' + esc(t('auth.registerTitle')) + '</h2>' +
            ui.field({ id: 'reg-name', name: 'name', label: t('field.name'), rules: 'required', autocomplete: 'name' }) +
            ui.field({ id: 'reg-email', name: 'email', label: t('field.email'), type: 'email', rules: 'required email', autocomplete: 'email' }) +
            ui.field({ id: 'reg-phone', name: 'phone', label: t('field.phone'), type: 'tel', rules: 'required phone', autocomplete: 'tel', inputmode: 'tel' }) +
            passwordField('reg-password', 'new-password', t('field.passwordHint')) +
            '<p class="form-error hidden rounded-[20px] bg-bad-soft px-4 py-3 text-sm text-bad" role="alert"></p>' +
            '<button type="submit" class="btn btn-primary w-full">' + esc(t('auth.register')) + '</button>' +
            '<p class="text-center text-sm text-muted">' + esc(t('auth.haveAccount')) + ' <button type="button" class="link" data-tab="login">' + esc(t('auth.login')) + '</button></p>' +
          '</form>' +
        '</div>' +
        '<p class="mt-4 text-xs leading-relaxed text-muted">' + esc(t('auth.demo')) + '</p>' +
      '</div>';

    U.qsa('form', root).forEach(ui.liveClear);

    root.querySelector('[role="tablist"]').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var nextTab = tab === 'login' ? 'register' : 'login';
      renderAuth(nextTab);
      U.qs('#tab-' + nextTab).focus();
    });

    root.addEventListener('click', onAuthClick);
    U.qs('#panel-login').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target, err = U.qs('.form-error', form);
      err.classList.add('hidden');
      if (!ui.validate(form)) return;
      auth.login(U.qs('#login-email').value, U.qs('#login-password').value).then(function (res) {
        if (!res.ok) { err.textContent = t(res.error); err.classList.remove('hidden'); return; }
        done(t('auth.welcome', { name: auth.current().name }));
      });
    });
    U.qs('#panel-register').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target, err = U.qs('.form-error', form);
      err.classList.add('hidden');
      if (!ui.validate(form)) return;
      auth.register({ name: U.qs('#reg-name').value, email: U.qs('#reg-email').value, phone: U.qs('#reg-phone').value, password: U.qs('#reg-password').value }).then(function (res) {
        if (!res.ok) { err.textContent = t(res.error); err.classList.remove('hidden'); return; }
        done(t('auth.created'));
      });
    });
  }

  function onAuthClick(e) {
    var tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      root.removeEventListener('click', onAuthClick);
      var tab = tabBtn.getAttribute('data-tab');
      renderAuth(tab);
      U.qs('#tab-' + tab).focus();
      return;
    }
    var pw = e.target.closest('[data-toggle-pw]');
    if (pw) {
      var input = U.qs('#' + pw.getAttribute('data-toggle-pw'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      pw.textContent = t(show ? 'field.hide' : 'field.show');
      pw.setAttribute('aria-pressed', String(show));
    }
  }

  function done(message) {
    root.removeEventListener('click', onAuthClick);
    if (next) { location.href = next; return; }
    ui.toast(message);
    renderDashboard();
  }

  /* ───────── Logged in ───────── */
  var STATUS_DOT = { new: '#fab219', confirmed: '#6F6C6B', paid: '#0ca30c', shipped: '#000000', completed: '#0ca30c', cancelled: '#d03b3b' };
  function statusBadge(status) {
    var st = status === 'received' ? 'new' : (STATUS_DOT[status] ? status : 'new');
    return '<span class="badge bg-stage text-ink"><span class="h-1.5 w-1.5 rounded-full" style="background:' + STATUS_DOT[st] + '"></span>' + esc(t('order.status.' + st)) + '</span>';
  }

  function orderCard(o) {
    var lines = o.items.map(function (it) {
      var p = shop.product(it.productId), s = p && shop.size(p, it.size);
      return { it: it, p: p, s: s };
    });
    var count = t('common.itemsN', { n: o.items.length });
    return '<article class="panel p-5 sm:p-6" data-order="' + esc(o.id) + '">' +
      '<div class="flex flex-wrap items-start justify-between gap-4">' +
        '<div><h3 class="font-semibold tnum">' + esc(t('order.no', { id: o.id })) + '</h3>' +
        '<p class="mt-1 text-sm text-muted tnum">' + esc(U.formatDate(o.createdAt)) + '<span class="mx-2 text-line-strong">/</span>' + esc(count) + '</p></div>' +
        '<div class="text-right">' + statusBadge(o.status) + '<p class="mt-2 text-lg font-semibold tnum">' + U.money(o.total) + '</p></div>' +
      '</div>' +
      '<div class="mt-4 flex gap-2 overflow-x-auto">' + lines.slice(0, 6).map(function (l) {
        return l.s ? '<span class="tile h-14 w-14 shrink-0 p-1" title="' + esc(loc(l.p.name) + ', ' + l.s.code) + '">' + ui.productImage(l.p, l.s, l.it.color, { pad: 0.04 }) + '</span>' : '';
      }).join('') + '</div>' +
      '<details class="group mt-4"><summary class="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium">' + esc(t('order.details')) +
        '<span class="transition-transform group-open:rotate-180">' + ui.icon('chevronDown', 'h-4 w-4') + '</span></summary>' +
        '<div class="relative mt-3 overflow-x-auto"><table class="data-table min-w-[480px]"><tbody>' + lines.map(function (l) {
          return '<tr><td><span class="font-medium">' + esc(loc(l.it.name)) + '</span><br><span class="text-muted tnum">' + esc(l.it.size + ', ' + l.it.dims) + '</span></td>' +
            '<td class="whitespace-nowrap tnum">' + U.int(l.it.qty) + ' × ' + U.money(l.it.unit) + '</td><td class="whitespace-nowrap text-right font-medium tnum">' + U.money(l.it.total) + '</td></tr>';
        }).join('') +
        '<tr><td colspan="2" class="text-muted">' + esc(t('cart.delivery')) + ': ' + esc(o.delivery.method === 'courier' ? t('order.courier') + ', ' + o.delivery.district : t('order.pickup')) + '</td><td class="text-right tnum">' + (o.deliveryFee ? U.money(o.deliveryFee) : esc(t('common.free'))) + '</td></tr>' +
        '</tbody></table></div></details>' +
      '<button type="button" data-reorder="' + esc(o.id) + '" class="btn btn-secondary btn-sm mt-4">' + esc(t('order.reorder')) + '</button>' +
    '</article>';
  }

  function renderDashboard() {
    var user = auth.current();
    if (!user) { renderAuth('login'); return; }
    ui.breadcrumb([{ label: t('account.title') }]);
    var orders = PK.store.orders.forEmail(user.email);
    root.innerHTML =
      '<div class="flex flex-wrap items-end justify-between gap-4">' +
        '<div><h1 class="h-page">' + esc(t('auth.welcome', { name: user.name })) + '</h1><p class="mt-1 text-muted">' + esc(user.email) + '</p></div>' +
        '<button type="button" id="logout" class="btn btn-secondary btn-sm">' + ui.icon('logout', 'h-[18px] w-[18px]') + esc(t('auth.logout')) + '</button>' +
      '</div>' +
      '<div class="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">' +
        '<section aria-labelledby="orders-h"><h2 id="orders-h" class="h-section">' + esc(t('account.orders')) + '</h2>' +
          '<div id="orders" class="mt-5 space-y-4">' + (orders.length ? orders.map(orderCard).join('') :
            '<div class="tile px-6 py-12 text-center"><h3 class="text-lg font-semibold">' + esc(t('account.noOrders')) + '</h3><p class="mt-1 text-muted">' + esc(t('account.noOrdersBody')) + '</p>' +
            '<a href="products.html" class="btn btn-primary mt-5">' + esc(t('cart.browse')) + '</a></div>') + '</div></section>' +
        '<aside aria-labelledby="profile-h"><div class="panel p-6"><h2 id="profile-h" class="text-lg font-semibold">' + esc(t('account.profile')) + '</h2>' +
          '<dl class="mt-4 space-y-3 text-[15px]">' +
            [[t('field.name'), user.name], [t('field.email'), user.email], [t('field.phone'), user.phone], [t('field.company'), user.company]].filter(function (r) { return r[1]; }).map(function (r) {
              return '<div><dt class="text-sm text-muted">' + esc(r[0]) + '</dt><dd class="font-medium">' + esc(r[1]) + '</dd></div>';
            }).join('') +
          '</dl></div></aside>' +
      '</div>';

    U.qs('#logout').addEventListener('click', function () { auth.logout(); ui.toast(t('auth.loggedOut')); renderAuth('login'); });
    U.qs('#orders').addEventListener('click', function (e) {
      var b = e.target.closest('[data-reorder]');
      if (!b) return;
      var o = orders.filter(function (x) { return x.id === b.getAttribute('data-reorder'); })[0];
      o.items.forEach(function (it) {
        var p = shop.product(it.productId);
        if (p && shop.size(p, it.size)) PK.store.cart.add({ productId: it.productId, size: it.size, color: it.color, gsm: it.gsm, qty: it.qty });
      });
      ui.toast(t('order.reordered'), { action: { label: t('product.viewCart'), href: 'cart.html' } });
    });
  }

  if (auth.current()) renderDashboard();
  else renderAuth(U.param('tab') === 'register' ? 'register' : 'login');
})();
