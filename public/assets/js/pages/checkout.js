/**
 * One-page checkout: contact → delivery → e-receipt & payment, with a live
 * order summary. Guest checkout is allowed; an account can be created inline.
 */
(function () {
  var U = PK.util, t = PK.t, loc = PK.loc, esc = U.esc, ui = PK.ui, shop = PK.shop;
  var C = PK.CONFIG;
  var root = U.qs('#checkout-root');
  var user = PK.store.auth.current();
  ui.breadcrumb([{ label: t('cart.title'), href: 'cart.html' }, { label: t('checkout.title') }]);

  var items = PK.store.cart.items();
  if (!shop.totals(items).lines.length) {
    root.innerHTML = '<div class="tile flex flex-col items-center px-6 py-20 text-center"><h2 class="text-xl font-semibold">' + esc(t('checkout.emptyTitle')) + '</h2>' +
      '<p class="mt-2 text-muted">' + esc(t('checkout.emptyBody')) + '</p><a href="products.html" class="btn btn-primary mt-6">' + esc(t('cart.browse')) + '</a></div>';
    return;
  }

  var days = C.delivery.leadDays.inStock;
  var section = function (n, title, body) {
    return '<section class="panel p-5 sm:p-8" aria-labelledby="sec-' + n + '"><h2 id="sec-' + n + '" class="flex items-center gap-3 text-lg font-semibold">' +
      '<span class="flex h-7 w-7 items-center justify-center rounded-full border border-ink text-sm tnum">' + n + '</span>' + esc(title) + '</h2>' + body + '</section>';
  };
  var radioCard = function (name, value, title, desc, right, checked) {
    var id = name + '-' + value;
    return '<div><input type="radio" class="opt-input" name="' + name + '" id="' + id + '" value="' + value + '"' + (checked ? ' checked' : '') + '>' +
      '<label for="' + id + '" class="opt h-full items-start justify-between gap-4 p-4"><span><span class="block font-semibold">' + esc(title) + '</span>' +
      (desc ? '<span class="mt-0.5 block text-sm text-muted">' + esc(desc) + '</span>' : '') + '</span>' +
      (right ? '<span class="shrink-0 text-sm font-semibold tnum">' + right + '</span>' : '') + '</label></div>';
  };
  var districts = '<option value="">' + esc(t('field.districtPick')) + '</option>' + C.districts.map(function (d) { return '<option>' + esc(d) + '</option>'; }).join('');

  root.innerHTML =
    '<form id="checkout-form" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10" novalidate>' +
      '<div class="space-y-6">' +
        section(1, t('checkout.contact'),
          (user ? '' : '<p class="mt-2 text-sm text-muted">' + esc(t('checkout.haveAccount')) + ' <a class="link" href="account.html?next=checkout">' + esc(t('checkout.loginLink')) + '</a></p>') +
          '<div class="mt-6 grid gap-5 sm:grid-cols-2">' +
            ui.field({ id: 'name', label: t('field.name'), rules: 'required', autocomplete: 'name', value: user && user.name }) +
            ui.field({ id: 'phone', label: t('field.phone'), type: 'tel', rules: 'required phone', autocomplete: 'tel', inputmode: 'tel', value: user && user.phone }) +
            ui.field({ id: 'email', label: t('field.email'), type: 'email', rules: 'required email', autocomplete: 'email', value: user && user.email }) +
            ui.field({ id: 'company', label: t('field.company'), optional: true, autocomplete: 'organization', value: user && user.company }) +
          '</div>') +
        section(2, t('checkout.delivery'),
          '<fieldset class="mt-6"><legend class="sr-only">' + esc(t('checkout.delivery')) + '</legend><div class="grid gap-3 sm:grid-cols-2">' +
            radioCard('method', 'courier', t('checkout.courier'), t('checkout.courierDesc', { days: days }), '<span id="fee-label"></span>', true) +
            radioCard('method', 'pickup', t('checkout.pickup'), t('checkout.pickupDesc'), esc(t('common.free')), false) +
          '</div></fieldset>' +
          '<div id="address-block" class="mt-6 grid gap-5 sm:grid-cols-2">' +
            ui.field({ id: 'district', label: t('field.district'), type: 'select', rules: 'required', options: districts }) +
            ui.field({ id: 'khoroo', label: t('field.khoroo'), rules: 'required', inputmode: 'numeric', placeholder: '3' }) +
            ui.field({ id: 'address', label: t('field.address'), rules: 'required', autocomplete: 'street-address', placeholder: t('field.addressPh'), className: 'sm:col-span-2' }) +
          '</div>' +
          '<div id="pickup-block" class="mt-6 flex gap-3 rounded-[20px] bg-stage p-4 text-sm" hidden><span class="text-muted">' + ui.icon('pin') + '</span><div>' +
            '<p class="font-semibold">' + esc(t('checkout.pickupAt')) + '</p><p class="mt-1">' + esc(loc(C.contact.address)) + '</p>' +
            '<p class="mt-1 text-muted">' + loc(C.contact.hours).map(esc).join('<br>') + '</p></div></div>') +
        section(3, t('checkout.payment'),
          '<fieldset class="mt-6"><legend class="mb-3 text-sm font-semibold">' + esc(t('checkout.receipt')) + '</legend><div class="grid gap-3 sm:grid-cols-2">' +
            radioCard('receipt', 'person', t('checkout.person'), '', '', true) +
            radioCard('receipt', 'org', t('checkout.org'), '', '', false) +
          '</div></fieldset>' +
          '<div id="regno-block" class="mt-5 max-w-xs" hidden>' + ui.field({ id: 'regno', label: t('field.regno'), rules: 'required regno', inputmode: 'numeric', placeholder: '1234567' }) + '</div>' +
          '<fieldset class="mt-8"><legend class="mb-3 text-sm font-semibold">' + esc(t('checkout.payment')) + '</legend><div class="grid gap-3 sm:grid-cols-3">' +
            radioCard('payment', 'transfer', t('pay.transfer'), t('pay.transferDesc'), '', true) +
            radioCard('payment', 'qpay', t('pay.qpay'), t('pay.qpayDesc'), '', false) +
            radioCard('payment', 'cash', t('pay.cash'), t('pay.cashDesc'), '', false) +
          '</div></fieldset>' +
          '<div class="mt-8">' + ui.field({ id: 'note', label: t('field.note'), type: 'textarea', optional: true, placeholder: t('field.notePh') }) + '</div>' +
          (user ? '' :
            '<div class="mt-6 rounded-[20px] border border-line p-4"><label class="flex cursor-pointer items-start gap-3"><input type="checkbox" id="create-account" class="check mt-0.5">' +
            '<span>' + esc(t('checkout.createAccount')) + '</span></label>' +
            '<div id="password-block" class="mt-4 max-w-xs" hidden>' + ui.field({ id: 'password', label: t('field.password'), type: 'password', rules: 'required password', autocomplete: 'new-password', hint: t('field.passwordHint') }) + '</div></div>')) +
      '</div>' +
      '<aside aria-labelledby="sum-h"><div class="panel p-5 sm:p-6 lg:sticky lg:top-24">' +
        '<div class="flex items-baseline justify-between"><h2 id="sum-h" class="text-lg font-semibold">' + esc(t('cart.summary')) + '</h2><a href="cart.html" class="link text-sm">' + esc(t('cart.edit')) + '</a></div>' +
        '<ul id="sum-lines" class="mt-4 max-h-[22rem] divide-y divide-line overflow-y-auto border-y border-line"></ul>' +
        '<dl class="mt-4 space-y-2.5 text-[15px]">' +
          '<div class="flex justify-between"><dt class="text-muted">' + esc(t('cart.subtotal')) + '</dt><dd id="sum-sub" class="tnum"></dd></div>' +
          '<div class="flex justify-between"><dt class="text-muted">' + esc(t('cart.delivery')) + '</dt><dd id="sum-del" class="tnum"></dd></div>' +
        '</dl>' +
        '<div class="mt-4 flex items-baseline justify-between border-t border-line pt-4"><span class="font-semibold">' + esc(t('cart.total')) + '</span><span id="sum-total" class="text-2xl font-semibold tnum"></span></div>' +
        '<p id="form-error" class="mt-4 rounded-[20px] bg-bad-soft px-4 py-3 text-sm text-bad" role="alert" hidden></p>' +
        '<button type="submit" id="submit" class="btn btn-primary mt-5 w-full">' + esc(t('checkout.submit')) + '</button>' +
        '<p class="mt-3 text-center text-xs leading-relaxed text-muted">' + esc(t('checkout.payLater')) + ' ' + esc(t('common.vatIncl')) + '</p>' +
      '</div></aside>' +
    '</form>';

  var form = U.qs('#checkout-form');
  ui.liveClear(form);

  function method() { return U.qs('input[name="method"]:checked', form).value; }

  function renderSummary() {
    var tot = shop.totals(PK.store.cart.items(), method());
    U.qs('#sum-lines').innerHTML = tot.lines.map(function (l) {
      var unit = shop.unitLabel(l.product);
      return '<li class="flex gap-3 py-3"><span class="tile h-14 w-14 shrink-0 p-1">' + ui.productImage(l.product, l.size, l.item.color, { pad: 0.04 }) + '</span>' +
        '<div class="min-w-0 flex-1 text-sm"><p class="font-medium leading-snug">' + esc(loc(l.product.name)) + '</p>' +
        '<p class="text-muted tnum">' + esc(l.size.code + ', ' + shop.dimsUnit(l.product, l.size)) + '</p>' +
        '<p class="text-muted tnum">' + esc(t('checkout.summaryQty', { qty: U.int(l.item.qty), unit: unit, price: U.money(l.unit) })) + '</p></div>' +
        '<p class="text-sm font-semibold tnum">' + U.money(l.total) + '</p></li>';
    }).join('');
    U.qs('#sum-sub').textContent = U.money(tot.subtotal);
    U.qs('#sum-del').textContent = tot.delivery ? U.money(tot.delivery) : t('common.free');
    U.qs('#sum-total').textContent = U.money(tot.total);
    var fee = shop.totals(PK.store.cart.items(), 'courier').delivery;
    U.qs('#fee-label').textContent = fee ? U.money(fee) : t('common.free');
    return tot;
  }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'method') {
      var courier = method() === 'courier';
      U.qs('#address-block').hidden = !courier;
      U.qs('#pickup-block').hidden = courier;
      renderSummary();
    }
    if (e.target.name === 'receipt') U.qs('#regno-block').hidden = e.target.value !== 'org';
    if (e.target.id === 'create-account') U.qs('#password-block').hidden = !e.target.checked;
  });

  // Hide the summary error once every flagged field has been fixed.
  form.addEventListener('input', function () {
    var errBox = U.qs('#form-error');
    if (!errBox.hidden && !U.qs('[aria-invalid="true"]', form)) errBox.hidden = true;
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errBox = U.qs('#form-error');
    if (!ui.validate(form)) { errBox.textContent = t('err.form'); errBox.hidden = false; return; }
    errBox.hidden = true;

    var v = function (id) { var el = U.qs('#' + id); return el ? el.value.trim() : ''; };
    var tot = renderSummary();
    var m = method();
    var order = {
      customer: { name: v('name'), phone: v('phone'), email: v('email').toLowerCase(), company: v('company') },
      delivery: m === 'courier' ? { method: m, district: v('district'), khoroo: v('khoroo'), address: v('address') } : { method: m },
      receipt: { type: U.qs('input[name="receipt"]:checked').value, regno: v('regno') },
      payment: U.qs('input[name="payment"]:checked').value,
      note: v('note'),
      items: tot.lines.map(function (l) {
        return { productId: l.product.id, name: l.product.name, size: l.size.code, dims: shop.dimsUnit(l.product, l.size), color: l.item.color, gsm: l.item.gsm, qty: l.item.qty, unit: l.unit, total: l.total };
      }),
      subtotal: tot.subtotal, deliveryFee: tot.delivery, total: tot.total, currency: C.currency.code, lang: PK.i18n.lang,
    };

    var btn = U.qs('#submit');
    btn.disabled = true;
    btn.textContent = t('checkout.sending');
    var wantsAccount = !user && U.qs('#create-account') && U.qs('#create-account').checked;

    PK.api.send('order', order)
      .then(function () {
        return wantsAccount ? PK.store.auth.register({ name: order.customer.name, email: order.customer.email, phone: order.customer.phone, company: order.customer.company, password: v('password') }) : null;
      })
      .then(function () {
        var saved = PK.store.orders.create(order);
        PK.store.cart.clear();
        showSuccess(saved, !!(user || wantsAccount));
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = t('checkout.submit');
        errBox.textContent = t('err.send');
        errBox.hidden = false;
      });
  });

  function showSuccess(order, hasAccount) {
    var h1 = U.qs('#checkout-title');
    h1.textContent = t('checkout.okTitle');
    h1.setAttribute('tabindex', '-1');
    ui.breadcrumb([{ label: t('checkout.okTitle') }]);
    root.innerHTML =
      '<div class="max-w-2xl">' +
        '<div class="panel p-6 sm:p-8" role="status">' +
          '<div class="flex items-start gap-4"><span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">' + ui.icon('check', 'h-6 w-6') + '</span>' +
          '<p class="text-lg leading-relaxed">' + esc(t('checkout.okBody', { id: order.id, email: order.customer.email })) + '</p></div>' +
          '<dl class="mt-6 grid grid-cols-2 gap-4 border-y border-line py-4 text-sm sm:grid-cols-3">' +
            '<div><dt class="text-muted">' + esc(t('order.no', { id: '' }).trim()) + '</dt><dd class="mt-1 font-semibold tnum">' + esc(order.id) + '</dd></div>' +
            '<div><dt class="text-muted">' + esc(t('cart.total')) + '</dt><dd class="mt-1 font-semibold tnum">' + U.money(order.total) + '</dd></div>' +
            '<div><dt class="text-muted">' + esc(t('checkout.delivery')) + '</dt><dd class="mt-1 font-semibold">' + esc(order.delivery.method === 'courier' ? t('order.courier') : t('order.pickup')) + '</dd></div>' +
          '</dl>' +
          '<h2 class="mt-6 font-semibold">' + esc(t('checkout.next')) + '</h2>' +
          '<ol class="mt-3 space-y-3">' + ['checkout.next1', 'checkout.next2', 'checkout.next3'].map(function (k, i) {
            return '<li class="flex gap-3"><span class="text-sm font-semibold text-muted tnum">' + (i + 1) + '</span><span class="leading-relaxed">' + esc(t(k)) + '</span></li>';
          }).join('') + '</ol>' +
          '<div class="mt-8 flex flex-wrap gap-3">' +
            (hasAccount ? '<a href="account.html" class="btn btn-primary">' + esc(t('checkout.viewOrders')) + '</a>' : '') +
            '<a href="index.html" class="btn ' + (hasAccount ? 'btn-secondary' : 'btn-primary') + '">' + esc(t('checkout.backHome')) + '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    window.scrollTo(0, 0);
    h1.focus();
  }

  renderSummary();
})();
