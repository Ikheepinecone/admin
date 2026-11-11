/** Compare up to four sizes: to-scale lineup next to an A4 sheet plus a spec table. */
(function () {
  var U = PK.util, t = PK.t, loc = PK.loc, esc = U.esc, ui = PK.ui, shop = PK.shop;
  var root = U.qs('#compare-root');
  ui.breadcrumb([{ label: t('nav.products'), href: 'products.html' }, { label: t('compare.title') }]);

  function items() {
    return PK.store.compare.list().map(function (c) {
      var p = shop.product(c.productId), s = p && shop.size(p, c.size);
      return s ? { p: p, s: s } : null;
    }).filter(Boolean);
  }

  function render() {
    var list = items();
    if (!list.length) {
      root.innerHTML = '<div class="tile flex flex-col items-center px-6 py-16 text-center">' +
        '<span class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-muted">' + ui.icon('compare') + '</span>' +
        '<h2 class="mt-4 text-xl font-semibold">' + esc(t('compare.emptyTitle')) + '</h2>' +
        '<p class="mt-2 max-w-md leading-relaxed text-muted">' + esc(t('compare.emptyBody')) + '</p>' +
        '<a href="products.html?view=sizes" class="btn btn-primary mt-6">' + esc(t('compare.browse')) + '</a></div>';
      return;
    }

    var specs = list.map(function (x) { return shop.artSpec(x.p, x.s); });
    var cell = function (fn) { return list.map(function (x) { return '<td class="border-b border-line p-3 align-top tnum">' + fn(x) + '</td>'; }).join(''); };
    var row = function (label, fn) { return '<tr><th scope="row" class="sticky left-0 border-b border-line bg-white py-3 pr-4 text-left text-sm font-medium text-muted">' + esc(label) + '</th>' + cell(fn) + '</tr>'; };

    root.innerHTML =
      '<div class="flex flex-wrap items-baseline justify-between gap-4"><p class="text-muted">' + esc(t('compare.sub')) + '</p>' +
      '<button type="button" class="link text-sm" data-clear>' + esc(t('compare.clear')) + '</button></div>' +
      '<figure class="tile mt-5 px-4 py-6 sm:px-8"><div class="mx-auto aspect-[21/8] max-h-[340px] w-full">' + PK.art.lineup(specs, { label: t('compare.scale') }) + '</div>' +
      '<figcaption class="mt-3 text-center text-sm text-muted">' + esc(t('compare.scale')) + '</figcaption></figure>' +
      '<div class="relative mt-8 overflow-x-auto"><table class="w-full min-w-[640px] border-collapse text-[15px]">' +
        '<thead><tr><th class="sticky left-0 w-36 bg-white"><span class="sr-only">' + esc(t('dim.dims')) + '</span></th>' + list.map(function (x, i) {
          return '<th scope="col" class="w-1/4 p-3 text-left align-top font-normal">' +
            '<div class="relative"><span class="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white tnum">' + (i + 1) + '</span>' +
            '<a href="' + shop.url(x.p, x.s) + '" class="tile block aspect-square p-4" tabindex="-1" aria-hidden="true">' + ui.productImage(x.p, x.s, x.p.colors[0], { pad: 0.06 }) + '</a>' +
            '<button type="button" data-remove="' + x.p.id + '|' + x.s.code + '" class="icon-btn absolute right-1 top-1 h-9 w-9 bg-white/80" aria-label="' + esc(t('common.remove') + ': ' + x.s.code) + '">' + ui.icon('close', 'h-4 w-4') + '</button></div>' +
            '<a href="' + shop.url(x.p, x.s) + '" class="mt-3 block font-semibold leading-snug hover:underline hover:underline-offset-4">' + esc(loc(x.p.name)) + '</a>' +
            '<p class="text-sm text-muted tnum">' + esc(x.s.code) + '</p></th>';
        }).join('') + '</tr></thead><tbody>' +
        row(t('dim.dims'), function (x) { return '<span class="font-semibold">' + esc(shop.dimsUnit(x.p, x.s)) + '</span>'; }) +
        row(t('dim.volume'), function (x) { return esc(shop.volumeText(x.s) || '—'); }) +
        row(t('dim.format'), function (x) { return esc(shop.formatText(x.s) || '—'); }) +
        row(t('spec.material'), function (x) { return esc(loc(x.p.material)); }) +
        row(t('spec.gsm'), function (x) { return esc(shop.gsmText(x.p)); }) +
        row(t('spec.colors'), function (x) { return esc(x.p.colors.map(function (c) { return loc(PK.COLORS[c]); }).join(', ')); }) +
        row(t('spec.moq'), function (x) { return esc(U.int(x.p.moq) + ' ' + shop.unitLabel(x.p)); }) +
        row(t('table.price'), function (x) { return '<span class="text-muted">' + esc(t('common.from')) + '</span> <span class="font-semibold">' + U.money(shop.unitPrice(x.p, x.s, { gsm: shop.lightestGsm(x.p) })) + '</span> <span class="text-muted">/ ' + esc(shop.unitLabel(x.p)) + '</span>'; }) +
        row(t('spec.status'), function (x) { return x.s.status === 'stock' ? '<span class="badge badge-stock">' + esc(t('common.inStock')) + '</span>' : '<span class="badge badge-mto">' + esc(t('common.madeToOrder')) + '</span>'; }) +
        '<tr><th class="sticky left-0 bg-white"></th>' + list.map(function (x) {
          return '<td class="p-3"><a href="' + shop.url(x.p, x.s) + '" class="btn btn-primary btn-sm w-full">' + esc(t('common.select')) + '</a></td>';
        }).join('') + '</tr>' +
      '</tbody></table></div>';
  }

  root.addEventListener('click', function (e) {
    var r = e.target.closest('[data-remove]');
    if (r) { var parts = r.getAttribute('data-remove').split('|'); PK.store.compare.toggle(parts[0], parts[1]); }
    if (e.target.closest('[data-clear]')) PK.store.compare.clear();
  });
  window.addEventListener('pk:compare', render);
  render();
})();
