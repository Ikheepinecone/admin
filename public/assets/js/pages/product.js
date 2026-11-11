/**
 * Product page: gallery (3D / front / next to A4 / photos), size, paper weight,
 * colour and quantity selection with live tier pricing, add to cart / order now,
 * compare, size guide, specifications, all-sizes price list and related products.
 */
(function () {
  var U = PK.util, t = PK.t, loc = PK.loc, esc = U.esc, ui = PK.ui, shop = PK.shop;
  var root = U.qs('#product-root');
  var p = shop.product(U.param('id'));

  if (!p) {
    ui.breadcrumb([{ label: t('nav.products'), href: 'products.html' }, { label: t('product.notFound') }]);
    root.innerHTML = '<div class="tile flex flex-col items-center px-6 py-20 text-center"><h1 class="text-2xl font-semibold">' + esc(t('product.notFound')) + '</h1>' +
      '<p class="mt-2 text-muted">' + esc(t('product.notFoundBody')) + '</p><a href="products.html" class="btn btn-primary mt-6">' + esc(t('cart.browse')) + '</a></div>';
    return;
  }

  var cat = shop.category(p.category);
  var sizes = shop.sizes(p).slice().sort(function (a, b) { return a.sortKey - b.sortKey; });
  var unit = shop.unitLabel(p);
  var SHOW_FIRST = 9;

  var state = {
    size: shop.size(p, U.param('size')) || shop.sizes(p)[0],
    color: p.colors.indexOf(U.param('color')) !== -1 ? U.param('color') : p.colors[0],
    gsm: p.gsm ? (p.gsm.indexOf(+U.param('gsm')) !== -1 ? +U.param('gsm') : p.gsmDefault) : null,
    qty: p.moq,
    view: '3d',
    expanded: false,
  };

  document.title = loc(p.name) + ' | ' + PK.CONFIG.brand.name;
  ui.breadcrumb([{ label: t('nav.products'), href: 'products.html' }, { label: loc(cat.name), href: 'products.html?cat=' + cat.id }, { label: loc(p.name) }]);

  /* ───────── Static skeleton ───────── */
  var legend = t(shop.legendKey(p, state.size));
  root.innerHTML =
    '<div class="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-12">' +
      '<div class="lg:sticky lg:top-24 lg:self-start">' +
        '<div class="tile relative aspect-square overflow-hidden !rounded-panel">' +
          '<div id="stage" class="absolute inset-0 p-[5%] pb-[10%]"></div>' +
          '<p id="stage-caption" class="absolute bottom-4 left-5 right-5 text-sm text-muted tnum"></p>' +
        '</div>' +
        '<div id="views" class="relative mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="' + esc(t('product.views')) + '"></div>' +
      '</div>' +

      '<div id="buy">' +
        '<a href="products.html?cat=' + cat.id + '" class="text-sm text-muted hover:text-ink hover:underline hover:underline-offset-4">' + esc(loc(cat.name)) + '</a>' +
        '<h1 class="h-page mt-1">' + esc(loc(p.name)) + '</h1>' +
        '<p class="mt-3 max-w-prose leading-relaxed text-muted">' + esc(loc(p.summary)) + '</p>' +

        '<div class="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">' +
          '<p><span id="unit-price" class="text-[28px] font-semibold tnum" style="letter-spacing:-0.04em"></span> <span class="text-muted">/ ' + esc(unit) + '</span></p>' +
          '<p id="price-note" class="text-sm text-muted"></p>' +
        '</div>' +
        '<p class="mt-1 text-sm text-muted">' + esc(t('common.vatIncl')) + '</p>' +

        '<form id="buy-form" class="mt-7 space-y-7" novalidate>' +
          '<fieldset>' +
            '<div class="flex flex-wrap items-baseline justify-between gap-2"><legend class="font-semibold">' + esc(t('product.size')) + '</legend>' +
            '<span class="text-sm text-muted">' + esc(legend) + '</span></div>' +
            '<div id="size-options" class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"></div>' +
            (sizes.length > SHOW_FIRST ? '<button type="button" id="size-more" class="link mt-3 text-sm"></button>' : '') +
          '</fieldset>' +
          (p.gsm && p.gsm.length > 1 ? '<fieldset><legend class="font-semibold">' + esc(t('product.gsm')) + '</legend><div id="gsm-options" class="mt-3 flex flex-wrap gap-2"></div></fieldset>' : '') +
          (p.colors.length > 1
            ? '<fieldset><legend class="font-semibold">' + esc(t('product.color')) + ': <span id="color-name" class="font-normal text-muted"></span></legend><div id="color-options" class="mt-3 flex flex-wrap gap-2"></div></fieldset>'
            : '') +
          '<div>' +
            '<label for="qty" class="font-semibold">' + esc(t('product.qty')) + '</label>' +
            '<div class="mt-3 flex flex-wrap items-center gap-3">' + ui.qtyStepper('qty', state.qty, p.moq, p.step) + '<div id="qty-quick" class="flex flex-wrap gap-2"></div></div>' +
            '<p class="field-hint">' + esc(t('product.moq', { moq: U.int(p.moq), step: U.int(p.step), unit: unit })) + '</p>' +
          '</div>' +
          '<div class="flex items-center justify-between gap-4 border-t border-line pt-5">' +
            '<span class="font-semibold">' + esc(t('product.total')) + '</span>' +
            '<span id="total" class="text-2xl font-semibold tnum" aria-live="polite"></span>' +
          '</div>' +
          '<div class="grid gap-3 sm:grid-cols-2">' +
            '<button type="submit" class="btn btn-primary">' + ui.icon('bag', 'h-[18px] w-[18px]') + esc(t('common.addToCart')) + '</button>' +
            '<button type="button" id="buy-now" class="btn btn-secondary">' + esc(t('common.orderNow')) + '</button>' +
          '</div>' +
          '<div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 text-sm">' +
            '<p id="lead" class="flex items-start gap-2 text-muted"></p>' +
            '<button type="button" id="compare-btn" class="inline-flex items-center gap-2 font-medium hover:underline hover:underline-offset-4"></button>' +
          '</div>' +
        '</form>' +
      '</div>' +
    '</div>' +

    '<section class="mt-20 grid gap-12 lg:grid-cols-2" aria-labelledby="guide-h">' +
      '<div>' +
        '<h2 id="guide-h" class="h-section">' + esc(t('product.sizeGuide')) + '</h2>' +
        '<p class="mt-2 text-sm text-muted">' + esc(t('product.sizeGuideHint')) + '</p>' +
        '<div id="guide" class="tile mt-5 aspect-[4/3] p-5 !rounded-panel"></div>' +
      '</div>' +
      '<div>' +
        '<h2 class="h-section">' + esc(t('product.specs')) + '</h2>' +
        '<dl id="specs" class="mt-5 divide-y divide-line border-y border-line"></dl>' +
        '<h3 class="mt-10 text-lg font-semibold">' + esc(t('product.tiers')) + '</h3>' +
        '<table class="data-table mt-3"><tbody id="tiers"></tbody></table>' +
      '</div>' +
    '</section>' +

    (sizes.length > 1
      ? '<section class="mt-20" aria-labelledby="all-h"><h2 id="all-h" class="h-section">' + esc(t('product.allSizes')) + '</h2><div class="panel relative mt-5 overflow-x-auto px-5 py-2"><table class="data-table min-w-[640px]" id="all-sizes"></table></div></section>'
      : '') +

    '<section class="mt-20 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">' +
      '<div><h2 class="h-section">' + esc(t('product.about')) + '</h2><p class="mt-4 max-w-prose text-[17px] leading-relaxed">' + esc(loc(p.description)) + '</p></div>' +
      '<div><h2 class="h-section">' + esc(t('product.uses')) + '</h2><ul class="mt-4 space-y-3">' + (p.uses[PK.i18n.lang] || p.uses.mn).map(function (u) {
        return '<li class="flex items-center gap-3"><span class="text-ink">' + ui.icon('check', 'h-5 w-5') + '</span>' + esc(u) + '</li>';
      }).join('') + '</ul></div>' +
    '</section>' +

    '<section class="mt-20" aria-labelledby="rel-h"><h2 id="rel-h" class="h-section">' + esc(t('product.related')) + '</h2><div id="related" class="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4"></div></section>';

  var el = {
    stage: U.qs('#stage'), caption: U.qs('#stage-caption'), views: U.qs('#views'),
    unitPrice: U.qs('#unit-price'), priceNote: U.qs('#price-note'), total: U.qs('#total'),
    sizeOpts: U.qs('#size-options'), sizeMore: U.qs('#size-more'), gsmOpts: U.qs('#gsm-options'),
    colorOpts: U.qs('#color-options'), colorName: U.qs('#color-name'), quick: U.qs('#qty-quick'),
    lead: U.qs('#lead'), compare: U.qs('#compare-btn'), guide: U.qs('#guide'), specs: U.qs('#specs'),
    tiers: U.qs('#tiers'), all: U.qs('#all-sizes'), form: U.qs('#buy-form'),
  };

  /* ───────── Options ───────── */
  function renderSizeOptions() {
    var list = state.expanded ? sizes : sizes.slice(0, SHOW_FIRST);
    if (!state.expanded && list.indexOf(state.size) === -1) list = list.slice(0, SHOW_FIRST - 1).concat([state.size]);
    el.sizeOpts.innerHTML = list.map(function (s) {
      var id = 'size-' + s.code;
      return '<div><input type="radio" class="opt-input" name="size" id="' + id + '" value="' + s.code + '"' + (s === state.size ? ' checked' : '') + '>' +
        '<label for="' + id + '" class="opt h-full flex-col gap-0.5"><span class="text-[15px] font-semibold tnum">' + esc(shop.dims(p, s)) + '</span>' +
        '<span class="flex items-center justify-between gap-2 text-xs text-muted"><span class="tnum">' + esc(s.code) + '</span>' +
        (s.status === 'mto' ? '<span>' + esc(t('common.madeToOrder')) + '</span>' : '') + '</span></label></div>';
    }).join('');
    if (el.sizeMore) el.sizeMore.textContent = state.expanded ? t('product.showFewer') : t('product.showAll', { n: sizes.length });
  }

  function renderGsmOptions() {
    if (!el.gsmOpts) return;
    el.gsmOpts.innerHTML = p.gsm.map(function (g) {
      var id = 'gsm-' + g;
      return '<div><input type="radio" class="opt-input" name="gsm" id="' + id + '" value="' + g + '"' + (g === state.gsm ? ' checked' : '') + '>' +
        '<label for="' + id + '" class="opt opt-round min-w-[5.5rem] justify-center py-2.5 font-semibold tnum">' + g + ' <span class="ml-1 font-normal text-muted">' + esc(t('unit.gsm')) + '</span></label></div>';
    }).join('');
  }

  function renderColorOptions() {
    if (!el.colorOpts) return;
    el.colorOpts.innerHTML = p.colors.map(function (c) {
      var id = 'color-' + c;
      return '<div><input type="radio" class="opt-input" name="color" id="' + id + '" value="' + c + '"' + (c === state.color ? ' checked' : '') + '>' +
        '<label for="' + id + '" class="opt opt-round items-center gap-2.5 py-1.5 pl-1.5 pr-4"><span class="swatch swatch-lg" style="background:' + PK.COLORS[c].swatch + '"></span>' + esc(loc(PK.COLORS[c])) + '</label></div>';
    }).join('');
    el.colorName.textContent = loc(PK.COLORS[state.color]);
  }

  function quickValues() {
    var vals = p.moq >= 50 ? [p.moq, 500, 1000, 3000] : [p.moq, 5, 10, 25];
    return vals.filter(function (v, i, a) { return v >= p.moq && a.indexOf(v) === i; }).map(qty.snap);
  }

  function renderQuick() {
    el.quick.innerHTML = quickValues().map(function (v) {
      var off = shop.tier(v).off;
      var on = v === state.qty;
      return '<button type="button" data-q="' + v + '" aria-pressed="' + on + '" class="chip tnum ' + (on ? 'border-ink bg-ink text-white' : 'hover:border-ink/50') + '">' +
        U.int(v) + (off ? ' <span class="' + (on ? 'text-white/70' : 'text-muted') + '">−' + off + '%</span>' : '') + '</button>';
    }).join('');
  }

  /* ───────── Gallery ───────── */
  function spec() { return shop.artSpec(p, state.size, state.color); }
  function viewList() {
    var v = [
      { id: '3d', label: t('product.view3d'), render: function (o) { return PK.art.product(spec(), o); } },
      { id: 'front', label: t('product.viewFront'), render: function (o) { return PK.art.front(spec(), o); } },
    ];
    if (p.shape === 'bag' || p.shape === 'box') v.push({ id: 'a4', label: t('product.viewScale'), render: function (o) { return PK.art.overlay([spec()], 0, o); } });
    (p.images || []).forEach(function (src, i) {
      v.push({ id: 'photo' + i, label: t('product.viewPhoto', { n: i + 1 }), photo: src });
    });
    return v;
  }

  function renderGallery() {
    var views = viewList();
    var cur = views.filter(function (v) { return v.id === state.view; })[0] || views[0];
    var label = loc(p.name) + ', ' + state.size.code + ', ' + shop.dimsUnit(p, state.size);
    el.stage.innerHTML = cur.photo
      ? '<img src="' + esc(cur.photo) + '" alt="' + esc(label) + '" class="h-full w-full object-contain">'
      : cur.render({ dims: true, label: label, className: 'h-full w-full' });
    el.caption.innerHTML = '<span class="font-semibold text-ink">' + esc(state.size.code) + '</span>&ensp;' + esc(shop.dimsUnit(p, state.size));
    el.views.innerHTML = views.map(function (v) {
      var on = v.id === cur.id;
      return '<button type="button" data-view="' + v.id + '" aria-pressed="' + on + '" aria-label="' + esc(v.label) + '" title="' + esc(v.label) + '" class="tile h-[4.5rem] w-[4.5rem] shrink-0 p-1.5 transition-colors ' + (on ? '!border-ink ring-1 ring-ink' : 'hover:border-ink/40') + '">' +
        (v.photo ? '<img src="' + esc(v.photo) + '" alt="" class="h-full w-full rounded object-cover">' : v.render({ pad: 0.06 })) + '</button>';
    }).join('');
  }

  /* ───────── Details ───────── */
  function renderSpecs() {
    var s = state.size;
    var rows = [
      [t('spec.code'), s.code],
      [t(shop.legendKey(p, s)).replace(/, см$|, cm$/, ''), shop.dimsUnit(p, s)],
      s.volume ? [t('dim.volume'), shop.volumeText(s)] : null,
      s.format ? [t('dim.format'), shop.formatText(s)] : null,
      [t('spec.material'), loc(p.material)],
      p.gsm ? [t('spec.gsm'), shop.gsmText(p)] : [t('spec.thickness'), loc(p.thickness)],
      [t('spec.colors'), p.colors.map(function (c) { return loc(PK.COLORS[c]); }).join(', ')],
      [t('spec.moq'), U.int(p.moq) + ' ' + unit],
      [t('spec.status'), shop.sizeStatus(p, s, state.color) === 'stock' ? t('common.inStock') : t('common.madeToOrder')],
    ].filter(Boolean);
    el.specs.innerHTML = rows.map(function (r) {
      return '<div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4 py-3 text-[15px]"><dt class="text-muted">' + esc(r[0]) + '</dt><dd class="font-medium tnum">' + esc(r[1]) + '</dd></div>';
    }).join('');
  }

  function renderTiers() {
    var tiers = PK.CONFIG.priceTiers;
    var current = shop.tier(state.qty);
    el.tiers.innerHTML = tiers.map(function (tr, i) {
      var next = tiers[i + 1];
      var min = Math.max(tr.min, p.moq);
      if (next && next.min - 1 < p.moq) return '';
      var label = next ? t('product.tierBase', { min: U.int(min), max: U.int(next.min - 1), unit: unit }) : t('product.tierFrom', { min: U.int(min), unit: unit });
      var price = shop.unitPrice(p, state.size, { gsm: state.gsm, qty: Math.max(tr.min, p.moq) });
      var on = tr === current;
      return '<tr class="' + (on ? 'font-semibold' : '') + '"><td class="tnum">' + esc(label) + (on ? ' <span class="sr-only">(' + esc(t('common.selected')) + ')</span>' : '') + '</td>' +
        '<td class="tnum text-muted">' + (tr.off ? '−' + tr.off + '%' : '') + '</td>' +
        '<td class="text-right tnum">' + U.money(price) + ' <span class="font-normal text-muted">/ ' + esc(unit) + '</span></td></tr>';
    }).join('');
  }

  function renderAllSizes() {
    if (!el.all) return;
    el.all.innerHTML = '<thead><tr><th>' + esc(t('table.code')) + '</th><th>' + esc(t(shop.legendKey(p, sizes[0]))) + '</th>' +
      (p.shape === 'bag' || p.shape === 'box' ? '<th>' + esc(t('table.volume')) + '</th>' : '') +
      (sizes.some(function (s) { return s.format; }) ? '<th>' + esc(t('dim.format')) + '</th>' : '') +
      '<th>' + esc(t('table.price')) + '</th><th>' + esc(t('table.status')) + '</th><th><span class="sr-only">' + esc(t('common.select')) + '</span></th></tr></thead><tbody>' +
      sizes.map(function (s) {
        var on = s === state.size;
        return '<tr class="' + (on ? 'bg-stage' : '') + '"><td class="font-semibold tnum">' + esc(s.code) + '</td><td class="whitespace-nowrap tnum">' + esc(shop.dims(p, s)) + '</td>' +
          (p.shape === 'bag' || p.shape === 'box' ? '<td class="tnum text-muted">' + esc(shop.volumeText(s) || '—') + '</td>' : '') +
          (sizes.some(function (x) { return x.format; }) ? '<td class="whitespace-nowrap tnum text-muted">' + esc(shop.formatText(s) || '—') + '</td>' : '') +
          '<td class="whitespace-nowrap tnum">' + U.money(shop.unitPrice(p, s, { gsm: state.gsm })) + '</td>' +
          '<td>' + (s.status === 'stock' ? '<span class="badge badge-stock">' + esc(t('common.inStock')) + '</span>' : '<span class="badge badge-mto">' + esc(t('common.madeToOrder')) + '</span>') + '</td>' +
          '<td class="text-right"><button type="button" data-pick="' + s.code + '" aria-pressed="' + on + '" class="btn btn-sm ' + (on ? 'btn-primary' : 'btn-secondary') + '">' + esc(on ? t('common.selected') : t('common.select')) + '</button></td></tr>';
      }).join('') + '</tbody>';
  }

  function renderGuide() {
    var specs = sizes.map(function (s) { return shop.artSpec(p, s, state.color); });
    el.guide.innerHTML = PK.art.overlay(specs, sizes.indexOf(state.size), { label: t('product.sizeGuide') + ': ' + state.size.code });
  }

  function renderRelated() {
    var same = shop.inCategory(p.category).filter(function (x) { return x.id !== p.id; });
    var others = shop.products().filter(function (x) { return x.category !== p.category; }).sort(function (a, b) { return (a.popular || 99) - (b.popular || 99); });
    U.qs('#related').innerHTML = same.concat(others).slice(0, 4).map(function (x) { return ui.productCard(x); }).join('');
  }

  /* ───────── Price + state ───────── */
  function renderPrice() {
    var price = shop.unitPrice(p, state.size, { gsm: state.gsm, qty: state.qty });
    var off = shop.tier(state.qty).off;
    el.unitPrice.textContent = U.money(price);
    el.priceNote.textContent = off ? t('product.saving', { off: off }) : '';
    el.total.textContent = U.money(price * state.qty);
    var days = PK.CONFIG.delivery.leadDays;
    el.lead.innerHTML = '<span class="mt-px">' + ui.icon('truck', 'h-[18px] w-[18px]') + '</span><span>' +
      esc(shop.sizeStatus(p, state.size, state.color) === 'stock' ? t('product.leadStock', { days: days.inStock }) : t('product.leadMto', { days: days.madeToOrder })) + '</span>';
  }

  function renderCompareBtn() {
    var on = PK.store.compare.has(p.id, state.size.code);
    el.compare.setAttribute('aria-pressed', String(on));
    el.compare.innerHTML = ui.icon(on ? 'check' : 'compare', 'h-[18px] w-[18px]') + esc(on ? t('compare.inList') : t('compare.add'));
  }

  function syncUrl() {
    U.setParams({ id: p.id, size: state.size.code, color: state.color !== p.colors[0] ? state.color : '', gsm: state.gsm && state.gsm !== p.gsmDefault ? state.gsm : '' });
  }

  function refresh(parts) {
    parts = parts || {};
    if (parts.sizes) renderSizeOptions();
    renderGallery();
    renderPrice();
    renderQuick();
    renderSpecs();
    renderTiers();
    renderAllSizes();
    renderGuide();
    renderCompareBtn();
    syncUrl();
  }

  /* ───────── Events ───────── */
  var qty = ui.bindQty(U.qs('[data-qty]', el.form), function (v) { state.qty = v; renderPrice(); renderQuick(); renderTiers(); });

  el.form.addEventListener('change', function (e) {
    var n = e.target.name;
    if (n === 'size') { state.size = shop.size(p, e.target.value); refresh(); }
    else if (n === 'gsm') { state.gsm = +e.target.value; refresh(); }
    else if (n === 'color') { state.color = e.target.value; el.colorName.textContent = loc(PK.COLORS[state.color]); refresh(); }
  });
  if (el.sizeMore) el.sizeMore.addEventListener('click', function () { state.expanded = !state.expanded; renderSizeOptions(); });
  el.quick.addEventListener('click', function (e) {
    var b = e.target.closest('[data-q]');
    if (b) qty.set(+b.getAttribute('data-q'));
  });
  el.views.addEventListener('click', function (e) {
    var b = e.target.closest('[data-view]');
    if (b) { state.view = b.getAttribute('data-view'); renderGallery(); }
  });
  el.compare.addEventListener('click', function () { ui.toggleCompare(p.id, state.size.code); });
  window.addEventListener('pk:compare', renderCompareBtn);
  if (el.all) el.all.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick]');
    if (!b) return;
    state.size = shop.size(p, b.getAttribute('data-pick'));
    refresh({ sizes: true });
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    U.qs('#buy').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    var radio = U.qs('#size-' + state.size.code);
    if (radio) radio.focus({ preventScroll: true });
  });

  function addToCart() {
    PK.store.cart.add({ productId: p.id, size: state.size.code, color: state.color, gsm: state.gsm, qty: state.qty });
  }
  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    addToCart();
    ui.toast(t('product.added') + ': ' + state.size.code + ', ' + U.int(state.qty) + ' ' + unit, { action: { label: t('product.viewCart'), href: 'cart.html' } });
  });
  U.qs('#buy-now').addEventListener('click', function () { addToCart(); location.href = 'checkout.html'; });

  renderSizeOptions();
  renderGsmOptions();
  renderColorOptions();
  renderRelated();
  refresh();
})();
