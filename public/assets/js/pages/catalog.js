/**
 * Catalog: category / colour / stock / "item to fit" filters, search, sort,
 * and two views — product cards or every size as a price list.
 * Filter state lives in the URL so results can be shared and bookmarked.
 */
(function () {
  var U = PK.util, t = PK.t, loc = PK.loc, esc = U.esc, ui = PK.ui, shop = PK.shop;
  var P = U.param;

  var numParam = function (k) { var v = parseFloat(P(k)); return v > 0 ? v : ''; };
  var state = {
    cat: shop.category(P('cat')) ? P('cat') : '',
    q: (P('q') || '').trim(),
    colors: (P('color') || '').split(',').filter(function (c) { return PK.COLORS[c]; }),
    fl: numParam('fl'), fw: numParam('fw'), fh: numParam('fh'),
    stock: P('stock') === '1',
    sort: ['popular', 'priceAsc', 'priceDesc', 'sizeAsc', 'sizeDesc'].indexOf(P('sort')) !== -1 ? P('sort') : 'popular',
    view: P('view') === 'sizes' ? 'sizes' : 'products',
  };

  var els = {
    filters: U.qs('#filters'), results: U.qs('#results'), count: U.qs('#result-count'),
    title: U.qs('#catalog-title'), sort: U.qs('#sort'), view: U.qs('#view-toggle'),
    chips: U.qs('#active-filters'), open: U.qs('#filters-open'),
  };

  /* ───────── Filtering ───────── */
  function item() { return { l: state.fl, w: state.fw, h: state.fh }; }
  function fitActive() { return shop.hasFit(item()); }

  function sizePasses(p, s) {
    if (state.stock && s.status !== 'stock') return false;
    if (fitActive() && !shop.fits(p, s, item())) return false;
    return true;
  }

  function productPasses(p, ignoreCat) {
    if (!ignoreCat && state.cat && p.category !== state.cat) return false;
    if (state.colors.length && !state.colors.some(function (c) { return p.colors.indexOf(c) !== -1; })) return false;
    if (!shop.matches(p, state.q)) return false;
    return shop.sizes(p).some(function (s) { return sizePasses(p, s); });
  }

  function passingSizes(p) {
    return shop.sizes(p).filter(function (s) { return sizePasses(p, s); }).sort(function (a, b) { return a.sortKey - b.sortKey; });
  }

  function fromPrice(p, s) { return shop.unitPrice(p, s, { gsm: shop.lightestGsm(p) }); }

  function productList() {
    var list = shop.products().filter(function (p) { return productPasses(p); });
    var minKey = function (p) { var s = passingSizes(p); return s.length ? s[0].sortKey : Infinity; };
    var cmp = {
      popular: function (a, b) { return (a.popular || 99) - (b.popular || 99); },
      priceAsc: function (a, b) { return shop.minPrice(a) - shop.minPrice(b); },
      priceDesc: function (a, b) { return shop.minPrice(b) - shop.minPrice(a); },
      sizeAsc: function (a, b) { return minKey(a) - minKey(b); },
      sizeDesc: function (a, b) { return minKey(b) - minKey(a); },
    }[state.sort];
    return list.sort(cmp);
  }

  function sizeRows() {
    var rows = [];
    shop.products().forEach(function (p) {
      if (state.cat && p.category !== state.cat) return;
      if (state.colors.length && !state.colors.some(function (c) { return p.colors.indexOf(c) !== -1; })) return;
      shop.sizes(p).forEach(function (s) {
        if (sizePasses(p, s) && shop.matches(p, state.q, s)) rows.push({ p: p, s: s, price: fromPrice(p, s) });
      });
    });
    var cmp = {
      popular: function (a, b) { return (a.p.popular || 99) - (b.p.popular || 99) || a.s.sortKey - b.s.sortKey; },
      priceAsc: function (a, b) { return a.price - b.price; },
      priceDesc: function (a, b) { return b.price - a.price; },
      sizeAsc: function (a, b) { return a.s.sortKey - b.s.sortKey; },
      sizeDesc: function (a, b) { return b.s.sortKey - a.s.sortKey; },
    }[state.sort];
    return rows.sort(cmp);
  }

  /* ───────── URL + header search ───────── */
  function syncUrl() {
    U.setParams({
      view: state.view === 'sizes' ? 'sizes' : '', cat: state.cat, q: state.q,
      color: state.colors.join(','), fl: state.fl, fw: state.fw, fh: state.fh,
      stock: state.stock ? '1' : '', sort: state.sort === 'popular' ? '' : state.sort,
    });
  }

  U.qsa('#site-header form[role="search"]').forEach(function (form) {
    var input = form.querySelector('input');
    form.addEventListener('submit', function (e) { e.preventDefault(); state.q = input.value.trim(); update(); });
    input.addEventListener('input', U.debounce(function () { state.q = input.value.trim(); update(); }, 250));
  });

  /* ───────── Sidebar ───────── */
  function renderFilters() {
    var catRow = function (id, label) {
      return '<li><label class="flex cursor-pointer items-center justify-between gap-3 rounded-ctl px-3 py-2.5 text-[15px] transition-colors hover:bg-mist has-[:checked]:bg-mist has-[:checked]:font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink">' +
        '<input type="radio" name="cat" value="' + id + '" class="sr-only"' + (state.cat === id ? ' checked' : '') + '>' +
        '<span>' + esc(label) + '</span><span class="text-sm font-normal text-muted tnum" data-cat-count="' + id + '"></span></label></li>';
    };
    var numInput = function (k, labelKey) {
      return '<div><label for="f-' + k + '" class="mb-1 block text-xs text-muted">' + esc(t(labelKey)) + '</label>' +
        '<input id="f-' + k + '" data-fit="' + k + '" type="number" inputmode="decimal" min="0" step="0.5" value="' + state[k] + '" class="field-input h-10 px-2.5 text-sm tnum"></div>';
    };
    var colorRow = function (c) {
      return '<label class="flex cursor-pointer items-center gap-3 py-1.5 text-[15px]"><input type="checkbox" class="check" name="color" value="' + c + '"' + (state.colors.indexOf(c) !== -1 ? ' checked' : '') + '>' +
        '<span class="swatch swatch-lg !h-5 !w-5" style="background:' + PK.COLORS[c].swatch + '"></span>' + esc(loc(PK.COLORS[c])) + '</label>';
    };

    els.filters.innerHTML =
      '<div class="space-y-8 lg:sticky lg:top-24 lg:rounded-panel lg:bg-white lg:p-4 lg:py-6 lg:shadow-card">' +
        '<div class="flex items-center justify-between lg:hidden">' +
          '<h2 id="filters-h" class="text-xl font-semibold">' + esc(t('filter.title')) + '</h2>' +
          '<button type="button" class="icon-btn" data-filters-close aria-label="' + esc(t('common.close')) + '">' + ui.icon('close') + '</button>' +
        '</div>' +
        '<fieldset><legend class="mb-2 px-3 text-sm font-semibold">' + esc(t('filter.category')) + '</legend><ul class="space-y-0.5">' +
          catRow('', t('filter.all')) + PK.CATEGORIES.map(function (c) { return catRow(c.id, loc(c.name)); }).join('') +
        '</ul></fieldset>' +
        '<fieldset class="px-3"><legend class="text-sm font-semibold">' + esc(t('filter.fit')) + '</legend>' +
          '<p class="mb-3 mt-1 text-xs leading-relaxed text-muted">' + esc(t('filter.fitHint')) + '</p>' +
          '<div class="grid grid-cols-3 gap-2">' + numInput('fl', 'dim.l') + numInput('fw', 'dim.w') + numInput('fh', 'dim.h') + '</div></fieldset>' +
        '<fieldset class="px-3"><legend class="mb-2 text-sm font-semibold">' + esc(t('filter.color')) + '</legend>' + Object.keys(PK.COLORS).map(colorRow).join('') + '</fieldset>' +
        '<div class="px-3"><label class="flex cursor-pointer items-center gap-3 text-[15px]"><input type="checkbox" class="check" name="stock"' + (state.stock ? ' checked' : '') + '>' + esc(t('filter.stock')) + '</label></div>' +
        '<div class="px-3"><button type="button" class="link text-sm" data-filters-clear>' + esc(t('filter.clear')) + '</button></div>' +
        '<div class="sticky bottom-0 -mx-4 border-t border-line bg-white p-4 lg:hidden"><button type="button" class="btn btn-primary w-full" data-filters-close data-show-results></button></div>' +
      '</div>';

    els.filters.addEventListener('change', function (e) {
      var el = e.target;
      if (el.name === 'cat') state.cat = el.value;
      else if (el.name === 'color') state.colors = U.qsa('input[name="color"]:checked', els.filters).map(function (i) { return i.value; });
      else if (el.name === 'stock') state.stock = el.checked;
      else return;
      update();
    });
    els.filters.addEventListener('input', U.debounce(function (e) {
      var k = e.target.getAttribute('data-fit');
      if (!k) return;
      var v = parseFloat(e.target.value);
      state[k] = v > 0 ? v : '';
      update();
    }, 250));
    els.filters.addEventListener('click', function (e) {
      if (e.target.closest('[data-filters-clear]')) clearAll();
      if (e.target.closest('[data-filters-close]')) closeDrawer();
    });
  }

  function syncFilterInputs() {
    U.qsa('input[name="cat"]', els.filters).forEach(function (i) { i.checked = i.value === state.cat; });
    U.qsa('input[name="color"]', els.filters).forEach(function (i) { i.checked = state.colors.indexOf(i.value) !== -1; });
    U.qs('input[name="stock"]', els.filters).checked = state.stock;
    ['fl', 'fw', 'fh'].forEach(function (k) {
      var input = U.qs('#f-' + k);
      if (document.activeElement !== input) input.value = state[k];
    });
    U.qsa('#site-header input[name="q"]').forEach(function (i) { if (document.activeElement !== i) i.value = state.q; });
  }

  function clearAll() {
    state.cat = ''; state.q = ''; state.colors = []; state.fl = state.fw = state.fh = ''; state.stock = false;
    update();
  }

  /* ───────── Mobile drawer ───────── */
  var drawerOpen = false;
  function openDrawer() {
    drawerOpen = true;
    els.filters.classList.remove('hidden');
    els.filters.classList.add('fixed', 'inset-0', 'z-50', 'overflow-y-auto', 'bg-white', 'px-4', 'pt-4');
    els.filters.setAttribute('role', 'dialog');
    els.filters.setAttribute('aria-modal', 'true');
    els.open.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    U.qs('[data-filters-close]', els.filters).focus();
  }
  function closeDrawer() {
    if (!drawerOpen) return;
    drawerOpen = false;
    els.filters.classList.add('hidden');
    els.filters.classList.remove('fixed', 'inset-0', 'z-50', 'overflow-y-auto', 'bg-white', 'px-4', 'pt-4');
    els.filters.removeAttribute('role');
    els.filters.removeAttribute('aria-modal');
    els.open.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    els.open.focus();
  }
  els.open.addEventListener('click', openDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) closeDrawer(); });

  /* ───────── Toolbar ───────── */
  function renderToolbar() {
    var btn = function (view, iconName, key) {
      var on = state.view === view;
      return '<button type="button" data-view="' + view + '" aria-pressed="' + on + '" class="inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors ' +
        (on ? 'bg-ink text-white' : 'text-ink hover:bg-mist') + '">' + ui.icon(iconName, 'h-4 w-4') + esc(t(key)) + '</button>';
    };
    els.view.setAttribute('aria-label', t('catalog.view'));
    els.view.innerHTML = btn('products', 'grid', 'catalog.viewProducts') + btn('sizes', 'rows', 'catalog.viewSizes');
    els.sort.innerHTML = ['popular', 'priceAsc', 'priceDesc', 'sizeAsc', 'sizeDesc'].map(function (k) {
      return '<option value="' + k + '"' + (state.sort === k ? ' selected' : '') + '>' + esc(t('sort.' + k)) + '</option>';
    }).join('');
  }
  els.view.addEventListener('click', function (e) {
    var b = e.target.closest('[data-view]');
    if (!b) return;
    state.view = b.getAttribute('data-view');
    renderToolbar();
    update();
  });
  els.sort.addEventListener('change', function () { state.sort = els.sort.value; update(); });

  function renderChips() {
    var chips = [];
    var chip = function (label, action) {
      return '<button type="button" data-remove="' + action + '" class="chip hover:border-ink/50"><span>' + esc(label) + '</span>' + ui.icon('close', 'h-3.5 w-3.5 text-muted') +
        '<span class="sr-only">' + esc(t('common.remove')) + '</span></button>';
    };
    if (state.q) chips.push(chip(t('filter.searchFor', { q: state.q }), 'q'));
    if (fitActive()) chips.push(chip(t('filter.fitChip', { dims: [state.fl || '–', state.fw || '–', state.fh || '–'].join(' × ') }), 'fit'));
    state.colors.forEach(function (c) { chips.push(chip(loc(PK.COLORS[c]), 'color:' + c)); });
    if (state.stock) chips.push(chip(t('filter.stock'), 'stock'));
    els.chips.innerHTML = chips.length ? '<span class="sr-only">' + esc(t('filter.active')) + '</span>' + chips.join('') : '';
    var n = chips.length + (state.cat ? 1 : 0);
    els.open.innerHTML = ui.icon('sliders', 'h-[18px] w-[18px]') + esc(t('filter.open')) + (n ? ' <span class="tnum">(' + n + ')</span>' : '');
  }
  els.chips.addEventListener('click', function (e) {
    var b = e.target.closest('[data-remove]');
    if (!b) return;
    var a = b.getAttribute('data-remove');
    if (a === 'q') state.q = '';
    else if (a === 'fit') state.fl = state.fw = state.fh = '';
    else if (a === 'stock') state.stock = false;
    else if (a.indexOf('color:') === 0) state.colors = state.colors.filter(function (c) { return c !== a.slice(6); });
    update();
  });

  /* ───────── Results ───────── */
  function emptyState() {
    var fit = fitActive() ? '&message=' + encodeURIComponent(t('filter.fitChip', { dims: [state.fl || '–', state.fw || '–', state.fh || '–'].join(' × ') })) : '';
    return '<div class="tile flex flex-col items-center px-6 py-16 text-center">' +
      '<span class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-muted">' + ui.icon('search') + '</span>' +
      '<h2 class="mt-4 text-xl font-semibold">' + esc(t('catalog.emptyTitle')) + '</h2>' +
      '<p class="mt-2 max-w-md leading-relaxed text-muted">' + esc(t('catalog.emptyBody')) + '</p>' +
      '<div class="mt-6 flex flex-wrap justify-center gap-3"><button type="button" class="btn btn-secondary" data-empty-clear>' + esc(t('filter.clear')) + '</button>' +
      '<a class="btn btn-primary" href="contact.html?topic=custom' + fit + '">' + esc(t('custom.cta')) + '</a></div></div>';
  }

  function renderProducts() {
    var list = productList();
    els.count.textContent = t('common.productsN', { n: list.length });
    if (!list.length) return emptyState();
    var fit = fitActive();
    return '<div class="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:grid-cols-3">' + list.map(function (p) {
      var sizes = passingSizes(p);
      return ui.productCard(p, fit ? { fitCount: sizes.length, size: sizes[0] } : (state.stock ? { size: sizes[0] } : {}));
    }).join('') + '</div>';
  }

  function statusBadge(s) {
    return s.status === 'stock'
      ? '<span class="badge badge-stock">' + esc(t('common.inStock')) + '</span>'
      : '<span class="badge badge-mto">' + esc(t('common.madeToOrder')) + '</span>';
  }

  function compareBox(p, s) {
    var on = PK.store.compare.has(p.id, s.code);
    return '<label class="inline-flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" class="check" data-compare="' + p.id + '|' + s.code + '"' + (on ? ' checked' : '') + '>' +
      '<span class="sr-only">' + esc(t('compare.add') + ': ' + loc(p.name) + ', ' + s.code) + '</span><span class="md:sr-only">' + esc(t('common.compare')) + '</span></label>';
  }

  function renderSizes() {
    var rows = sizeRows();
    els.count.textContent = t('common.sizesN', { n: rows.length });
    if (!rows.length) return emptyState();
    var thumb = function (r, cls) {
      return '<a href="' + shop.url(r.p, r.s) + '" class="tile block shrink-0 p-1 ' + cls + '" tabindex="-1" aria-hidden="true">' + ui.productImage(r.p, r.s, r.p.colors[0], { pad: 0.04 }) + '</a>';
    };
    var price = function (r) {
      return '<span class="text-muted">' + esc(t('common.from')) + '</span> <span class="font-semibold">' + U.money(r.price) + '</span><span class="text-muted"> / ' + esc(shop.unitLabel(r.p)) + '</span>';
    };
    var table = '<div class="panel hidden px-5 py-2 md:block"><table class="data-table"><thead><tr>' +
      '<th class="w-16"><span class="sr-only">' + esc(t('table.product')) + '</span></th><th>' + esc(t('table.product')) + '</th><th>' + esc(t('table.code')) + '</th>' +
      '<th>' + esc(t('dim.dims')) + '</th><th>' + esc(t('table.volume')) + '</th><th>' + esc(t('table.priceFrom')) + '</th><th>' + esc(t('table.status')) + '</th>' +
      '<th>' + esc(t('table.compare')) + '</th><th><span class="sr-only">' + esc(t('common.select')) + '</span></th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + thumb(r, 'h-14 w-14') + '</td>' +
          '<td class="min-w-[13rem]"><a href="' + shop.url(r.p, r.s) + '" class="font-medium hover:underline hover:underline-offset-4">' + esc(loc(r.p.name)) + '</a></td>' +
          '<td class="font-semibold tnum">' + esc(r.s.code) + '</td>' +
          '<td class="whitespace-nowrap tnum">' + esc(shop.dimsUnit(r.p, r.s)) + '</td>' +
          '<td class="whitespace-nowrap tnum text-muted">' + esc(shop.volumeText(r.s) || '—') + '</td>' +
          '<td class="whitespace-nowrap tnum"><span class="font-semibold">' + U.money(r.price) + '</span><span class="text-muted"> / ' + esc(shop.unitLabel(r.p)) + '</span></td>' +
          '<td>' + statusBadge(r.s) + '</td>' +
          '<td>' + compareBox(r.p, r.s) + '</td>' +
          '<td class="text-right"><a href="' + shop.url(r.p, r.s) + '" class="btn btn-secondary btn-sm">' + esc(t('common.select')) + '</a></td></tr>';
      }).join('') + '</tbody></table></div>';
    var list = '<ul class="divide-y divide-line border-y border-line md:hidden">' + rows.map(function (r) {
      return '<li class="flex gap-3 py-4">' + thumb(r, 'h-20 w-20') +
        '<div class="min-w-0 flex-1"><a href="' + shop.url(r.p, r.s) + '" class="font-medium leading-snug">' + esc(loc(r.p.name)) + '</a>' +
        '<p class="mt-1 text-sm tnum"><span class="font-semibold">' + esc(r.s.code) + '</span> <span class="text-muted">' + esc(shop.dimsUnit(r.p, r.s)) + '</span></p>' +
        '<p class="mt-1 text-sm tnum">' + price(r) + '</p>' +
        '<div class="mt-2 flex items-center justify-between gap-2">' + statusBadge(r.s) + compareBox(r.p, r.s) + '</div></div></li>';
    }).join('') + '</ul>';
    return table + list;
  }

  els.results.addEventListener('change', function (e) {
    var key = e.target.getAttribute('data-compare');
    if (!key) return;
    var parts = key.split('|');
    var res = ui.toggleCompare(parts[0], parts[1]);
    if (res === 'full') e.target.checked = false;
  });
  els.results.addEventListener('click', function (e) { if (e.target.closest('[data-empty-clear]')) clearAll(); });
  window.addEventListener('pk:compare', function () {
    U.qsa('[data-compare]', els.results).forEach(function (cb) {
      var parts = cb.getAttribute('data-compare').split('|');
      cb.checked = PK.store.compare.has(parts[0], parts[1]);
    });
  });

  /* ───────── Update cycle ───────── */
  function update() {
    syncUrl();
    syncFilterInputs();
    var cat = shop.category(state.cat);
    els.title.textContent = cat ? loc(cat.name) : t('catalog.title');
    document.title = (cat ? loc(cat.name) : t('meta.products')) + ' | ' + PK.CONFIG.brand.name;
    ui.breadcrumb(cat ? [{ label: t('nav.products'), href: 'products.html' }, { label: loc(cat.name) }] : [{ label: t('nav.products') }]);

    // category counts reflect every other active filter
    var counted = shop.products().filter(function (p) { return productPasses(p, true); });
    U.qsa('[data-cat-count]', els.filters).forEach(function (el) {
      var id = el.getAttribute('data-cat-count');
      el.textContent = id ? counted.filter(function (p) { return p.category === id; }).length : counted.length;
    });

    renderChips();
    els.results.innerHTML = state.view === 'sizes' ? renderSizes() : renderProducts();
    var showBtn = U.qs('[data-show-results]', els.filters);
    if (showBtn) showBtn.textContent = t('filter.show', { n: els.count.textContent.replace(/\D/g, '') || 0 });
  }

  renderFilters();
  renderToolbar();
  update();
})();
