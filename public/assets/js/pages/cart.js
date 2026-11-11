/** Cart: edit size / paper weight / colour / quantity per line, remove with undo, order summary. */
(function () {
  var U = PK.util, t = PK.t, loc = PK.loc, esc = U.esc, ui = PK.ui, shop = PK.shop;
  var cart = PK.store.cart;
  var root = U.qs('#cart-root');
  ui.breadcrumb([{ label: t('cart.title') }]);

  function selectField(id, label, name, options) {
    return '<div><label for="' + id + '" class="mb-1 block text-xs text-muted">' + esc(label) + '</label>' +
      '<select id="' + id + '" data-edit="' + name + '" class="field-input h-10 w-auto max-w-full py-0 pl-3 text-sm tnum">' + options + '</select></div>';
  }

  function lineHtml(l) {
    var p = l.product, s = l.size, it = l.item, unit = shop.unitLabel(p);
    var url = shop.url(p, s) + (it.color !== p.colors[0] ? '&color=' + it.color : '');
    var sizeOpts = shop.sizes(p).slice().sort(function (a, b) { return a.sortKey - b.sortKey; }).map(function (x) {
      return '<option value="' + x.code + '"' + (x.code === s.code ? ' selected' : '') + '>' + esc(x.code + ': ' + shop.dimsUnit(p, x)) + '</option>';
    }).join('');
    var gsmOpts = p.gsm && p.gsm.length > 1 ? p.gsm.map(function (g) {
      return '<option value="' + g + '"' + (g === it.gsm ? ' selected' : '') + '>' + g + ' ' + esc(t('unit.gsm')) + '</option>';
    }).join('') : '';
    var colorOpts = p.colors.length > 1 ? p.colors.map(function (c) {
      return '<option value="' + c + '"' + (c === it.color ? ' selected' : '') + '>' + esc(loc(PK.COLORS[c])) + '</option>';
    }).join('') : '';
    return '<li class="grid grid-cols-[84px_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6" data-line="' + it.id + '">' +
      '<a href="' + url + '" class="tile block aspect-square p-2" tabindex="-1" aria-hidden="true">' + ui.productImage(p, s, it.color, { pad: 0.05 }) + '</a>' +
      '<div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8">' +
        '<div class="min-w-0">' +
          '<a href="' + url + '" class="font-semibold leading-snug hover:underline hover:underline-offset-4">' + esc(loc(p.name)) + '</a>' +
          '<p class="mt-1 text-sm text-muted tnum">' + esc(t('cart.each', { price: U.money(l.unit), unit: unit })) +
            (l.tier.off ? ' <span class="font-medium text-ink">−' + l.tier.off + '%</span>' : '') + '</p>' +
          '<div class="mt-3 flex flex-wrap gap-3">' +
            selectField('size-' + it.id, t('product.size'), 'size', sizeOpts) +
            (gsmOpts ? selectField('gsm-' + it.id, t('product.gsm'), 'gsm', gsmOpts) : '') +
            (colorOpts ? selectField('color-' + it.id, t('product.color'), 'color', colorOpts) : '') +
          '</div>' +
        '</div>' +
        '<div class="flex flex-wrap items-end justify-between gap-4 md:flex-col md:items-end md:justify-start">' +
          '<div><span class="mb-1 block text-xs text-muted md:text-right">' + esc(t('product.qty')) + ', ' + esc(unit) + '</span>' +
            ui.qtyStepper('qty-' + it.id, it.qty, p.moq, p.step, t('product.qty') + ', ' + loc(p.name) + ' ' + s.code) + '</div>' +
          '<div class="text-right"><span class="sr-only">' + esc(t('cart.line')) + '</span><p class="text-lg font-semibold tnum">' + U.money(l.total) + '</p>' +
          '<button type="button" data-remove class="mt-1 inline-flex items-center gap-1.5 text-sm text-muted hover:text-bad">' + ui.icon('trash', 'h-4 w-4') + esc(t('common.remove')) + '<span class="sr-only">: ' + esc(loc(p.name) + ' ' + s.code) + '</span></button></div>' +
        '</div>' +
      '</div>' +
    '</li>';
  }

  function render() {
    var focusId = document.activeElement && document.activeElement.id;
    var items = cart.items();
    var tot = shop.totals(items, 'courier');
    U.qs('#cart-count').textContent = items.length ? t('common.itemsN', { n: items.length }) : '';

    if (!tot.lines.length) {
      root.innerHTML = '<div class="tile flex flex-col items-center px-6 py-20 text-center">' +
        '<span class="flex h-14 w-14 items-center justify-center rounded-full bg-white text-muted">' + ui.icon('bag', 'h-6 w-6') + '</span>' +
        '<h2 class="mt-4 text-xl font-semibold">' + esc(t('cart.emptyTitle')) + '</h2>' +
        '<p class="mt-2 max-w-md text-muted">' + esc(t('cart.emptyBody')) + '</p>' +
        '<a href="products.html" class="btn btn-primary mt-6">' + esc(t('cart.browse')) + '</a></div>';
      return;
    }

    var d = PK.CONFIG.delivery;
    var pct = Math.min(100, Math.round((tot.subtotal / d.freeOver) * 100));
    root.innerHTML =
      '<div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">' +
        '<ul class="divide-y divide-line border-y border-line">' + tot.lines.map(lineHtml).join('') + '</ul>' +
        '<aside aria-labelledby="sum-h"><div class="panel p-6 lg:sticky lg:top-24">' +
          '<h2 id="sum-h" class="text-lg font-semibold">' + esc(t('cart.summary')) + '</h2>' +
          '<dl class="mt-5 space-y-3 text-[15px]">' +
            '<div class="flex justify-between gap-4"><dt class="text-muted">' + esc(t('cart.subtotal')) + '</dt><dd class="font-medium tnum">' + U.money(tot.subtotal) + '</dd></div>' +
            '<div class="flex justify-between gap-4"><dt class="text-muted">' + esc(t('cart.delivery')) + '</dt><dd class="tnum">' + esc(tot.freeLeft ? t('cart.deliveryLater') : t('common.free')) + '</dd></div>' +
          '</dl>' +
          '<div class="mt-5 rounded-[20px] bg-stage p-4">' +
            '<p class="text-sm">' + esc(tot.freeLeft ? t('cart.freeLeft', { amount: U.money(tot.freeLeft) }) : t('cart.freeReached')) + '</p>' +
            '<div class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="' + esc(t('cart.freeProgress')) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><div class="h-full rounded-full bg-ink" style="width:' + pct + '%"></div></div>' +
          '</div>' +
          '<div class="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-5"><span class="font-semibold">' + esc(t('cart.total')) + '</span><span class="text-2xl font-semibold tnum">' + U.money(tot.subtotal) + '</span></div>' +
          '<a href="checkout.html" class="btn btn-primary mt-5 w-full">' + esc(t('cart.checkout')) + '</a>' +
          '<a href="products.html" class="btn btn-quiet mt-2 w-full">' + esc(t('cart.continue')) + '</a>' +
          '<p class="mt-3 text-center text-xs text-muted">' + esc(t('common.vatIncl')) + '</p>' +
        '</div></aside>' +
      '</div>';

    U.qsa('[data-line]', root).forEach(function (li) {
      var id = li.getAttribute('data-line');
      ui.bindQty(U.qs('[data-qty]', li), function (v) { cart.update(id, { qty: v }); });
    });
    if (focusId) { var f = document.getElementById(focusId); if (f) f.focus(); }
  }

  root.addEventListener('change', function (e) {
    var field = e.target.getAttribute('data-edit');
    if (!field) return;
    var id = e.target.closest('[data-line]').getAttribute('data-line');
    var patch = {};
    patch[field] = field === 'gsm' ? +e.target.value : e.target.value;
    cart.update(id, patch);
  });

  root.addEventListener('click', function (e) {
    if (!e.target.closest('[data-remove]')) return;
    var id = e.target.closest('[data-line]').getAttribute('data-line');
    var snap = cart.remove(id);
    if (snap) ui.toast(t('cart.removed'), { action: { label: t('common.undo'), onClick: function () { cart.restore(snap); } } });
  });

  window.addEventListener('pk:cart', render);
  render();
})();
