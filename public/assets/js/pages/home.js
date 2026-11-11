/** Home: floating product constellation, pill search, category pills, size finder, categories, popular, contact. */
(function () {
  var U = PK.util, t = PK.t, loc = PK.loc, esc = U.esc, ui = PK.ui, shop = PK.shop;

  /* Hero constellation: real products floating above the title, the centre one largest. */
  var FLOAT = [
    { id: 'kraft-paper-roll',   size: 'KR-70', color: 'kraft', cls: 'z-0 hidden w-36 sm:block lg:w-40', lift: 'mb-14' },
    { id: 'window-pastry-box',  size: 'BW-20', color: 'white', cls: 'z-[5] w-24 sm:w-44',            lift: 'mb-6' },
    { id: 'twisted-handle-bag', size: 'T031',  color: 'white', cls: 'w-32 sm:w-56 lg:w-60 z-10',    lift: 'mb-0' },
    { id: 'flat-handle-bag',    size: 'T005',  color: 'kraft', cls: 'z-[5] w-24 sm:w-44',            lift: 'mb-9' },
    { id: 'kraft-mailer-box',   size: 'MB-30', color: 'kraft', cls: 'z-0 hidden w-36 sm:block lg:w-40', lift: 'mb-16' },
  ];
  U.qs('#constellation').setAttribute('aria-label', t('home.popular'));
  U.qs('#constellation').innerHTML = FLOAT.map(function (f) {
    var p = shop.product(f.id), s = p && shop.size(p, f.size);
    if (!s) return '';
    return '<a href="' + shop.url(p, s) + (f.color !== p.colors[0] ? '&color=' + f.color : '') + '" aria-label="' + esc(loc(p.name) + ', ' + shop.dimsUnit(p, s)) + '" ' +
      'class="relative -mx-1.5 block shrink-0 rounded-panel bg-white p-2 shadow-card transition-shadow hover:shadow-float sm:-mx-2 ' + f.cls + ' ' + f.lift + '">' +
      '<span class="tile block aspect-square p-[13%]">' + PK.art.product(shop.artSpec(p, s, f.color), { pad: 0.04 }) + '</span>' +
      '<span class="block px-2 pb-1.5 pt-2.5 text-left"><span class="block text-[13px] font-semibold tnum">' + esc(s.code) + '</span>' +
      '<span class="hidden truncate text-[12px] text-muted tnum sm:block">' + esc(shop.dimsUnit(p, s)) + '</span></span></a>';
  }).join('');

  /* Hero search */
  U.qs('#hero-search').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = U.qs('#hero-q').value.trim();
    location.href = 'products.html' + (q ? '?q=' + encodeURIComponent(q) : '');
  });

  /* Category pills: order now, all products, then each category with a small product image. */
  var pill = function (href, label, img) {
    return '<a href="' + href + '" class="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white pl-1.5 pr-4 text-[15px] shadow-pill transition-colors hover:border-black/20">' +
      '<span class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-stage p-1">' + img + '</span>' + esc(label) + '</a>';
  };
  U.qs('#hero-pills').innerHTML =
    '<a href="products.html?view=sizes" class="btn btn-primary h-11 px-5">' + esc(t('hero.order')) + '</a>' +
    pill('products.html', t('hero.explore'), ui.icon('grid', 'h-4 w-4')) +
    PK.CATEGORIES.map(function (c) {
      var spec = Object.assign({ shape: c.art.shape, handle: c.art.handle, lid: c.art.lid, color: c.art.color }, c.art.dims);
      return pill('products.html?cat=' + c.id, loc(c.name), PK.art.product(spec, { pad: 0.02 }));
    }).join('');

  /* Size finder → catalog "All sizes" view, smallest fitting size first. */
  U.qs('#finder-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var p = new URLSearchParams({ view: 'sizes', sort: 'sizeAsc' });
    ['fl', 'fw', 'fh'].forEach(function (k) {
      var v = parseFloat(U.qs('#' + k).value);
      if (v > 0) p.set(k, String(v));
    });
    location.href = 'products.html?' + p.toString();
  });

  /* Category image tiles: the image is the card, the label sits on it. */
  U.qs('#category-grid').innerHTML = PK.CATEGORIES.map(function (c) {
    var count = shop.inCategory(c.id).length;
    var spec = Object.assign({ shape: c.art.shape, handle: c.art.handle, lid: c.art.lid, color: c.art.color }, c.art.dims);
    return '<a href="products.html?cat=' + c.id + '" class="group relative block aspect-[4/3] overflow-hidden rounded-panel bg-stage transition-shadow hover:shadow-float">' +
      '<span class="absolute inset-0 px-[14%] pb-[24%] pt-[10%]">' + PK.art.product(spec, { pad: 0.04 }) + '</span>' +
      '<span class="absolute bottom-3 left-3 rounded-xl bg-white/85 px-3 py-2 text-left backdrop-blur">' +
        '<span class="block text-sm font-semibold">' + esc(loc(c.name)) + '</span>' +
        '<span class="block text-xs text-muted tnum">' + esc(t('common.productsN', { n: count })) + '</span></span></a>';
  }).join('');

  /* Popular */
  var popular = shop.products().filter(function (p) { return p.popular; })
    .sort(function (a, b) { return a.popular - b.popular; }).slice(0, 4);
  U.qs('#popular-grid').innerHTML = popular.map(function (p) { return ui.productCard(p); }).join('');

  /* Contact card */
  var C = PK.CONFIG.contact;
  var row = function (ic, label, value) {
    return '<li class="flex gap-3"><span class="mt-0.5 text-muted">' + ui.icon(ic) + '</span><span><span class="block text-[13px] text-muted">' + esc(label) + '</span>' + value + '</span></li>';
  };
  U.qs('#home-contact').innerHTML =
    '<h2 class="h-section">' + esc(t('home.contactTitle')) + '</h2>' +
    '<ul class="mt-5 space-y-4">' +
      row('phone', t('contact.phone'), '<a class="link" href="' + C.phoneHref + '">' + esc(C.phone) + '</a>') +
      row('mail', t('contact.email'), '<a class="link" href="mailto:' + esc(C.email) + '">' + esc(C.email) + '</a>') +
      row('clock', t('footer.hours'), '<span>' + loc(C.hours).map(esc).join('<br>') + '</span>') +
    '</ul>' +
    '<a href="contact.html" class="btn btn-secondary mt-6 w-full sm:w-auto">' + esc(t('home.contactCta')) + '</a>';
})();
