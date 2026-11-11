/** Products: list (search, filters, bulk actions, show/hide, duplicate, delete with undo) and the create/edit form. */
(function () {
  var A = PK.admin, ui = PK.aui, app = PK.adminApp, t = PK.t, U = PK.util, esc = U.esc, loc = PK.loc, shop = PK.shop;

  /* ═════════════════════════ List ═════════════════════════ */
  var list = { q: '', cat: '', status: 'all', sort: 'manual', dir: 1, selected: {} };

  app.view('products', function (main) {
    function filtered() {
      var q = list.q.trim().toLowerCase();
      var rows = A.products().filter(function (p) {
        if (list.cat && p.category !== list.cat) return false;
        if (list.status === 'active' && p.active === false) return false;
        if (list.status === 'hidden' && p.active !== false) return false;
        if (!q) return true;
        var hay = (p.name.mn + ' ' + (p.name.en || '') + ' ' + p.id + ' ' + shop.sizes(p).map(function (s) { return s.code; }).join(' ')).toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      if (list.sort !== 'manual') {
        var key = {
          name: function (p) { return loc(p.name).toLowerCase(); },
          price: function (p) { return shop.minPrice(p); },
          stock: function (p) { return A.productStock(p).units; },
        }[list.sort];
        rows = rows.slice().sort(function (a, b) { var x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * list.dir; });
      }
      return rows;
    }

    function sortHead(id, label, cls) {
      var on = list.sort === id;
      return '<th class="' + (cls || '') + '" aria-sort="' + (on ? (list.dir > 0 ? 'ascending' : 'descending') : 'none') + '">' +
        '<button type="button" data-sort="' + id + '" class="inline-flex items-center gap-1 hover:text-ink">' + esc(label) + ui.icon(on ? (list.dir > 0 ? 'up' : 'down') : 'sort', 'h-3.5 w-3.5') + '</button></th>';
    }

    function render() {
      var all = A.products();
      var rows = filtered();
      var sel = Object.keys(list.selected).filter(function (id) { return list.selected[id] && A.product(id); });
      var allOn = rows.length && rows.every(function (p) { return list.selected[p.id]; });
      var counts = { all: all.length, active: all.filter(function (p) { return p.active !== false; }).length };
      counts.hidden = counts.all - counts.active;

      main.innerHTML = app.header(t('a.nav.products'), '<a href="#/products/new" class="btn btn-primary">' + PK.ui.icon('plus', 'h-[18px] w-[18px]') + esc(t('a.prod.new')) + '</a>') +
        '<div class="mb-4 flex flex-wrap items-center gap-3">' +
          app.search('p-q', t('a.prod.searchPh'), list.q) +
          '<label class="sr-only" for="p-cat">' + esc(t('a.prod.col.category')) + '</label>' +
          '<select id="p-cat" class="field-input h-11 w-auto text-sm"><option value="">' + esc(t('filter.all')) + '</option>' +
            PK.CATEGORIES.map(function (c) { return '<option value="' + c.id + '"' + (list.cat === c.id ? ' selected' : '') + '>' + esc(loc(c.name)) + '</option>'; }).join('') + '</select>' +
          app.tabs([{ id: 'all', label: t('a.all'), count: counts.all }, { id: 'active', label: t('a.prod.active'), count: counts.active }, { id: 'hidden', label: t('a.prod.hidden'), count: counts.hidden }], list.status, 'data-status') +
        '</div>' +
        (sel.length
          ? '<div class="mb-3 flex flex-wrap items-center gap-2 rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-sm text-white" role="region" aria-label="' + esc(t('a.actions')) + '">' +
              '<span class="mr-auto font-medium tnum">' + esc(t('a.selected', { n: sel.length })) + '</span>' +
              '<button type="button" data-bulk="show" class="btn btn-sm bg-white/10 text-white hover:bg-white/20">' + ui.icon('eye', 'h-4 w-4') + esc(t('a.prod.show')) + '</button>' +
              '<button type="button" data-bulk="hide" class="btn btn-sm bg-white/10 text-white hover:bg-white/20">' + ui.icon('eyeOff', 'h-4 w-4') + esc(t('a.prod.hide')) + '</button>' +
              '<button type="button" data-bulk="delete" class="btn btn-sm bg-white text-bad hover:bg-bad-soft">' + PK.ui.icon('trash', 'h-4 w-4') + esc(t('a.delete')) + '</button>' +
              '<button type="button" data-bulk="clear" class="icon-btn h-9 w-9 text-white hover:bg-white/10" aria-label="' + esc(t('a.close')) + '">' + PK.ui.icon('close', 'h-4 w-4') + '</button>' +
            '</div>'
          : '') +
        '<div class="panel overflow-hidden">' +
          (rows.length
            ? '<div class="overflow-x-auto"><table class="data-table min-w-[820px]"><thead><tr>' +
                '<th class="w-12 pl-5"><input type="checkbox" class="check" data-all aria-label="' + esc(t('a.all')) + '"' + (allOn ? ' checked' : '') + '></th>' +
                sortHead('name', t('a.prod.col.product')) + '<th>' + esc(t('a.prod.col.category')) + '</th><th>' + esc(t('a.prod.col.sizes')) + '</th>' +
                sortHead('price', t('a.prod.col.price')) + sortHead('stock', t('a.prod.col.stock')) +
                '<th>' + esc(t('a.prod.col.visible')) + '</th><th class="pr-5 text-right"><span class="sr-only">' + esc(t('a.actions')) + '</span></th></tr></thead><tbody>' +
                rows.map(rowHtml).join('') + '</tbody></table></div>'
            : (all.length
              ? ui.empty(t('a.noMatch'), '', '<button type="button" data-clear class="btn btn-secondary mt-5">' + esc(t('a.clearFilters')) + '</button>')
              : ui.empty(t('a.prod.empty'), t('a.prod.emptyBody'), '<a href="#/products/new" class="btn btn-primary mt-5">' + esc(t('a.prod.new')) + '</a>'))) +
        '</div>';
      bind();
    }

    function rowHtml(p) {
      var sizes = shop.sizes(p);
      var st = A.productStock(p);
      var cat = shop.category(p.category);
      var on = p.active !== false;
      return '<tr data-id="' + esc(p.id) + '"' + (on ? '' : ' class="text-muted"') + '>' +
        '<td class="pl-5"><input type="checkbox" class="check" data-pick aria-label="' + esc(loc(p.name)) + '"' + (list.selected[p.id] ? ' checked' : '') + '></td>' +
        '<td><a href="#/products/' + encodeURIComponent(p.id) + '" class="flex items-center gap-3">' + ui.thumb(p, sizes[0], p.colors[0]) +
          '<span class="min-w-0"><span class="block font-medium text-ink hover:underline hover:underline-offset-4">' + esc(loc(p.name)) + '</span><span class="block text-xs text-muted">' + esc(p.id) + '</span></span></a></td>' +
        '<td>' + esc(cat ? loc(cat.name) : '—') + '</td>' +
        '<td class="tnum">' + sizes.length + '</td>' +
        '<td class="whitespace-nowrap tnum">' + U.money(shop.minPrice(p)) + '</td>' +
        '<td class="whitespace-nowrap tnum">' + esc(t('a.prod.units', { n: U.int(st.units), unit: shop.unitLabel(p) })) +
          (st.low ? '<span class="ml-2 inline-flex items-center gap-1 rounded-full bg-[#FFF4DA] px-2 py-0.5 text-xs font-medium text-[#7A4D00]">' + ui.icon('alert', 'h-3 w-3') + esc(t('a.prod.lowN', { n: st.low })) + '</span>' : '') + '</td>' +
        '<td>' + ui.toggle('data-active', on, t('a.prod.col.visible') + ': ' + loc(p.name)) + '</td>' +
        '<td class="pr-5"><div class="flex justify-end gap-0.5">' +
          '<a href="#/products/' + encodeURIComponent(p.id) + '" class="icon-btn h-9 w-9" aria-label="' + esc(t('a.edit') + ': ' + loc(p.name)) + '" title="' + esc(t('a.edit')) + '">' + ui.icon('edit', 'h-[18px] w-[18px]') + '</a>' +
          '<button type="button" data-dup class="icon-btn h-9 w-9" aria-label="' + esc(t('a.duplicate') + ': ' + loc(p.name)) + '" title="' + esc(t('a.duplicate')) + '">' + ui.icon('copy', 'h-[18px] w-[18px]') + '</button>' +
          '<button type="button" data-del class="icon-btn h-9 w-9 hover:bg-bad-soft hover:text-bad" aria-label="' + esc(t('a.delete') + ': ' + loc(p.name)) + '" title="' + esc(t('a.delete')) + '">' + PK.ui.icon('trash', 'h-[18px] w-[18px]') + '</button>' +
        '</div></td></tr>';
    }

    function confirmDelete(ids) {
      var one = ids.length === 1 ? A.product(ids[0]) : null;
      ui.dialog({
        title: one ? t('a.prod.deleteTitle', { name: loc(one.name) }) : t('a.prod.deleteMany', { n: ids.length }),
        body: esc(t('a.prod.deleteBody')), confirm: t('a.delete'), danger: true,
        onConfirm: function () {
          var snaps = A.removeProducts(ids);
          ids.forEach(function (id) { delete list.selected[id]; });
          render(); app.refreshNav();
          PK.ui.toast(one ? t('a.deleted') + ': ' + loc(one.name) : t('a.prod.deletedN', { n: snaps.length }), {
            action: { label: t('common.undo'), onClick: function () { A.restoreProducts(snaps); render(); app.refreshNav(); } },
          });
        },
      });
    }

    function bind() {
      var q = U.qs('#p-q', main);
      q.addEventListener('input', U.debounce(function () {
        list.q = q.value; render();
        var again = U.qs('#p-q', main); again.focus(); again.setSelectionRange(again.value.length, again.value.length);
      }, 200));
      U.qs('#p-cat', main).addEventListener('change', function (e) { list.cat = e.target.value; render(); });
      main.querySelectorAll('[data-status]').forEach(function (b) { b.addEventListener('click', function () { list.status = b.getAttribute('data-status'); render(); }); });
      main.querySelectorAll('[data-sort]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-sort');
          if (list.sort === id) list.dir = -list.dir; else { list.sort = id; list.dir = 1; }
          render();
          U.qs('[data-sort="' + id + '"]', main).focus();
        });
      });
      var all = U.qs('[data-all]', main);
      if (all) all.addEventListener('change', function () { filtered().forEach(function (p) { list.selected[p.id] = all.checked; }); render(); });
      var clear = U.qs('[data-clear]', main);
      if (clear) clear.addEventListener('click', function () { list.q = ''; list.cat = ''; list.status = 'all'; render(); });

      main.querySelectorAll('tr[data-id]').forEach(function (tr) {
        var id = tr.getAttribute('data-id');
        var p = A.product(id);
        tr.querySelector('[data-pick]').addEventListener('change', function (e) { list.selected[id] = e.target.checked; render(); });
        tr.querySelector('[data-active]').addEventListener('click', function () {
          var next = p.active === false;
          A.setActive([id], next);
          render(); app.refreshNav();
          U.qs('tr[data-id="' + CSS.escape(id) + '"] [data-active]', main).focus();
          PK.ui.toast(t(next ? 'a.prod.shownN' : 'a.prod.hiddenN', { n: 1 }) + ': ' + loc(p.name));
        });
        tr.querySelector('[data-dup]').addEventListener('click', function () {
          var copy = A.duplicate(id);
          render();
          PK.ui.toast(t('a.duplicated') + ': ' + loc(copy.name), { action: { label: t('a.edit'), href: '#/products/' + encodeURIComponent(copy.id) } });
        });
        tr.querySelector('[data-del]').addEventListener('click', function () { confirmDelete([id]); });
      });

      main.querySelectorAll('[data-bulk]').forEach(function (b) {
        b.addEventListener('click', function () {
          var ids = Object.keys(list.selected).filter(function (id) { return list.selected[id] && A.product(id); });
          var act = b.getAttribute('data-bulk');
          if (act === 'clear') { list.selected = {}; render(); return; }
          if (act === 'delete') { confirmDelete(ids); return; }
          A.setActive(ids, act === 'show');
          render(); app.refreshNav();
          PK.ui.toast(t(act === 'show' ? 'a.prod.shownN' : 'a.prod.hiddenN', { n: ids.length }));
        });
      });
    }

    render();
  });

  /* ═════════════════════════ Editor ═════════════════════════ */

  var SHAPE_STYLE = { bag: { key: 'handle', options: ['twisted', 'flat', 'none', 'ribbon', 'window'] }, box: { key: 'lid', options: ['window', 'mailer'] } };

  function num(v) { var n = parseFloat(String(v).replace(',', '.').replace(/\s/g, '')); return isFinite(n) ? n : NaN; }

  /** Convert stored sizes to editable rows. */
  function toRows(p) {
    return (p.sizes || []).map(function (s) {
      if (typeof s === 'string') {
        var tpl = PK.TEMPLATE_BY_CODE[s];
        return { kind: 'die', code: s, l: tpl.l, w: tpl.w, h: tpl.h, format: tpl.format, price: '' };
      }
      return { kind: PK.TEMPLATE_BY_CODE[s.code] ? 'die' : 'custom', code: s.code, l: s.l, w: s.w, h: s.h, length: s.length, d: s.d, format: s.format, price: s.price != null ? s.price : '' };
    });
  }

  app.view('product-edit', function (main, r) {
    var original = r.id ? A.product(r.id) : null;
    if (r.id && !original) { main.innerHTML = app.header(t('product.notFound'), '<a href="#/products" class="btn btn-secondary">' + esc(t('a.nav.products')) + '</a>'); return; }

    var d = JSON.parse(JSON.stringify(original || A.blankProduct()));
    var rows = toRows(d);
    var mode = d.pricing ? 'formula' : 'manual';
    var pricing = d.pricing || { base: 300, perM2: 4000 };
    var images = (d.images || []).slice();
    var snapshot = null;

    /* Build the product object from the form state. */
    function collect() {
      var get = function (id) { var el = U.qs('#' + id, main); return el ? el.value.trim() : ''; };
      var gsm = get('e-gsm').split(/[^\d.,]+/).map(num).filter(function (n) { return n > 0; });
      var p = {
        id: original ? original.id : '__preview',
        category: get('e-cat'), shape: get('e-shape') || d.shape,
        name: { mn: get('e-name-mn'), en: get('e-name-en') },
        summary: { mn: get('e-sum-mn'), en: get('e-sum-en') },
        description: { mn: get('e-desc-mn'), en: get('e-desc-en') },
        uses: d.uses || { mn: [], en: [] },
        material: { mn: get('e-mat-mn'), en: get('e-mat-en') },
        colors: U.qsa('input[name="e-color"]:checked', main).map(function (c) { return c.value; }),
        gsm: gsm.length ? gsm : null,
        unit: get('e-unit'), moq: num(get('e-moq')), step: num(get('e-step')),
        images: images.filter(Boolean),
        active: U.qs('#e-active', main).getAttribute('aria-checked') === 'true',
      };
      if (p.gsm) {
        var def = num(get('e-gsm-def'));
        p.gsmDefault = p.gsm.indexOf(def) !== -1 ? def : p.gsm[0];
      } else {
        var th = get('e-thick');
        if (th) p.thickness = { mn: th, en: th.replace('мм', 'mm') };
      }
      var styleKey = SHAPE_STYLE[p.shape] && SHAPE_STYLE[p.shape].key;
      if (styleKey) p[styleKey] = get('e-style');
      var low = get('e-low'); if (low !== '') p.lowStock = num(low);
      var pop = get('e-pop'); if (pop !== '') p.popular = num(pop);
      if (mode === 'formula') p.pricing = { base: num(pricing.base), perM2: num(pricing.perM2) };
      p.sizes = rows.map(function (row) {
        if (row.kind === 'die' && mode === 'formula') return row.code;
        var o = { code: row.code, l: num(row.l) };
        if (p.shape === 'roll') { o.length = num(row.length); o.d = num(row.d) || 12; }
        else if (p.shape === 'sheet') { o.w = num(row.w); }
        else { o.w = row.w === '' || row.w == null ? null : num(row.w); o.h = num(row.h); }
        if (row.format) o.format = row.format;
        o.price = num(row.price);
        return o;
      });
      if (original && original.sample) p.sample = original.sample;
      return p;
    }

    function serialize() { try { return JSON.stringify(collect()); } catch (e) { return ''; } }
    function dirty() { return snapshot !== null && serialize() !== snapshot; }

    /* ───────── Markup ───────── */
    function opt(value, label, current) { return '<option value="' + esc(value) + '"' + (String(current) === String(value) ? ' selected' : '') + '>' + esc(label) + '</option>'; }
    function card(title, body, id) { return '<section class="panel p-5 sm:p-6"' + (id ? ' id="' + id + '"' : '') + '><h2 class="h-section">' + esc(title) + '</h2><div class="mt-5">' + body + '</div></section>'; }
    function f(o) { return PK.ui.field(o); }

    function sizeRowsHtml() {
      var shape = U.qs('#e-shape', main) ? U.qs('#e-shape', main).value : d.shape;
      var cols = shape === 'roll' ? ['l', 'length'] : shape === 'sheet' ? ['l', 'w'] : ['l', 'w', 'h'];
      var colLabel = { l: t(shape === 'roll' ? 'dim.rollW' : 'a.ed.col.l') + ', см', w: t('a.ed.col.w') + ', см', h: t('a.ed.col.h') + ', см', length: t('dim.rollLen') + ', м' };
      if (!rows.length) return '<p class="rounded-[20px] bg-canvas px-4 py-6 text-center text-sm text-muted" id="e-sizes-empty">' + esc(t('a.err.sizes')) + '</p>';
      var tmp = collect();
      var resolved = shop.sizes(Object.assign({}, tmp, { id: '__preview' }), true);
      return '<div class="overflow-x-auto"><table class="data-table min-w-[560px]"><thead><tr><th>' + esc(t('a.ed.col.code')) + '</th>' +
        cols.map(function (c) { return '<th>' + esc(colLabel[c]) + '</th>'; }).join('') + '<th>' + esc(t('a.ed.col.price')) + '</th><th><span class="sr-only">' + esc(t('a.actions')) + '</span></th></tr></thead><tbody>' +
        rows.map(function (row, i) {
          var isDie = row.kind === 'die';
          var computed = isDie && mode === 'formula' && resolved[i] ? resolved[i].basePrice : null;
          var cell = function (key) {
            if (isDie && key !== 'price') return '<td class="tnum text-muted">' + esc(row[key] == null ? '—' : U.num(row[key])) + '</td>';
            return '<td><input data-row="' + i + '" data-key="' + key + '" inputmode="decimal" value="' + esc(row[key] == null ? '' : row[key]) + '" aria-label="' + esc((row.code || '#' + (i + 1)) + ', ' + colLabel[key]) + '" class="field-input h-9 w-24 px-3 text-sm tnum"></td>';
          };
          return '<tr><td class="whitespace-nowrap">' + (isDie
              ? '<span class="font-semibold tnum">' + esc(row.code) + '</span> <span class="ml-1 rounded-full bg-canvas px-2 py-0.5 text-xs text-muted">' + esc(t('a.ed.dieBadge')) + '</span>'
              : '<input data-row="' + i + '" data-key="code" value="' + esc(row.code || '') + '" aria-label="' + esc(t('a.ed.col.code') + ' #' + (i + 1)) + '" class="field-input h-9 w-28 px-3 text-sm">') + '</td>' +
            cols.map(cell).join('') +
            (computed != null ? '<td class="tnum text-muted">' + U.money(computed) + '</td>' : cell('price')) +
            '<td class="text-right"><button type="button" data-remove-row="' + i + '" class="icon-btn h-9 w-9 hover:bg-bad-soft hover:text-bad" aria-label="' + esc(t('a.ed.removeSize', { code: row.code || '#' + (i + 1) })) + '">' + PK.ui.icon('trash', 'h-4 w-4') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    function dieOptions() {
      var used = rows.map(function (x) { return x.code; });
      var free = PK.TEMPLATES.filter(function (tp) { return used.indexOf(tp.code) === -1; });
      if (!free.length) return '<option value="">' + esc(t('a.ed.allDiesAdded')) + '</option>';
      return '<option value="">' + esc(t('a.ed.pickDie')) + '</option>' + free.map(function (tp) {
        return '<option value="' + tp.code + '">' + esc(tp.code + ': ' + U.num(tp.l) + ' × ' + (tp.w ? U.num(tp.w) + ' × ' : '') + U.num(tp.h) + ' см') + '</option>';
      }).join('');
    }

    function imagesHtml() {
      return '<ul class="space-y-2">' + images.map(function (src, i) {
        return '<li class="flex items-center gap-2"><span class="tile flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">' + (src ? '<img src="' + esc(src) + '" alt="" class="h-full w-full object-cover" onerror="this.style.display=\'none\'">' : '') + '</span>' +
          '<label class="sr-only" for="e-img-' + i + '">' + esc(t('a.ed.images')) + ' ' + (i + 1) + '</label>' +
          '<input id="e-img-' + i + '" data-img="' + i + '" value="' + esc(src) + '" placeholder="assets/img/products/…" class="field-input h-11 flex-1 text-sm">' +
          '<button type="button" data-remove-img="' + i + '" class="icon-btn hover:bg-bad-soft hover:text-bad" aria-label="' + esc(t('a.ed.removeImage')) + '">' + PK.ui.icon('trash', 'h-4 w-4') + '</button></li>';
      }).join('') + '</ul>' +
      '<button type="button" data-add-img class="btn btn-secondary btn-sm mt-3">' + PK.ui.icon('plus', 'h-4 w-4') + esc(t('a.ed.addImage')) + '</button>';
    }

    function styleField(shape, current) {
      var s = SHAPE_STYLE[shape];
      if (!s) return '<div id="e-style-wrap"></div>';
      return '<div id="e-style-wrap">' + f({ id: 'e-style', label: t('a.ed.' + s.key), type: 'select', options: s.options.map(function (o) { return opt(o, t('a.ed.' + s.key + '.' + o), current); }).join('') }) + '</div>';
    }

    var title = original ? loc(original.name) : t('a.ed.newTitle');
    main.innerHTML =
      '<a href="#/products" class="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">' + PK.ui.icon('arrowLeft', 'h-4 w-4') + esc(t('a.nav.products')) + '</a>' +
      app.header(title) +
      '<form id="ed" class="grid gap-5 pb-28 lg:grid-cols-[minmax(0,1fr)_300px]" novalidate>' +
        '<div class="min-w-0 space-y-5">' +
          card(t('a.ed.basics'),
            '<div class="grid gap-4 sm:grid-cols-2">' +
              f({ id: 'e-name-mn', label: t('a.ed.nameMn'), rules: 'required', value: d.name.mn }) +
              f({ id: 'e-name-en', label: t('a.ed.nameEn'), value: d.name.en, optional: true }) +
              f({ id: 'e-sum-mn', label: t('a.ed.summaryMn'), value: d.summary.mn, optional: true }) +
              f({ id: 'e-sum-en', label: t('a.ed.summaryEn'), value: d.summary.en, optional: true }) +
              f({ id: 'e-desc-mn', label: t('a.ed.descMn'), type: 'textarea', value: d.description.mn, optional: true }) +
              f({ id: 'e-desc-en', label: t('a.ed.descEn'), type: 'textarea', value: d.description.en, optional: true }) +
              f({ id: 'e-cat', label: t('a.ed.category'), type: 'select', options: PK.CATEGORIES.map(function (c) { return opt(c.id, loc(c.name), d.category); }).join('') }) +
              '<div class="grid grid-cols-2 gap-4">' +
                f({ id: 'e-shape', label: t('a.ed.shape'), type: 'select', options: ['bag', 'box', 'sheet', 'roll'].map(function (s) { return opt(s, t('a.ed.shape.' + s), d.shape); }).join('') }) +
                styleField(d.shape, d.handle || d.lid) +
              '</div>' +
            '</div>') +
          card(t('a.ed.materials'),
            '<div class="grid gap-4 sm:grid-cols-2">' +
              f({ id: 'e-mat-mn', label: t('a.ed.materialMn'), rules: 'required', value: d.material.mn }) +
              f({ id: 'e-mat-en', label: t('a.ed.materialEn'), value: d.material.en, optional: true }) +
              '<fieldset class="sm:col-span-2" id="e-colors"><legend class="field-label">' + esc(t('a.ed.colors')) + '</legend><div class="flex flex-wrap gap-2">' +
                Object.keys(PK.COLORS).map(function (c) {
                  return '<div><input type="checkbox" class="opt-input" name="e-color" id="e-color-' + c + '" value="' + c + '"' + (d.colors.indexOf(c) !== -1 ? ' checked' : '') + '>' +
                    '<label for="e-color-' + c + '" class="opt opt-round items-center gap-2 py-1.5 pl-1.5 pr-4"><span class="swatch swatch-lg" style="background:' + PK.COLORS[c].swatch + '"></span>' + esc(loc(PK.COLORS[c])) + '</label></div>';
                }).join('') + '</div></fieldset>' +
              f({ id: 'e-gsm', label: t('a.ed.gsm'), value: (d.gsm || []).join(', '), hint: t('a.ed.gsmHint'), inputmode: 'numeric' }) +
              '<div id="e-gsm-def-wrap"></div>' +
              '<div id="e-thick-wrap" class="sm:col-span-2">' + f({ id: 'e-thick', label: t('a.ed.thickness'), value: d.thickness ? d.thickness.mn : '', hint: t('a.ed.thicknessHint'), optional: true }) + '</div>' +
            '</div>') +
          card(t('a.ed.sizes'),
            '<fieldset><legend class="field-label">' + esc(t('a.ed.pricing')) + '</legend><div class="grid gap-2 sm:grid-cols-2">' +
              ['manual', 'formula'].map(function (m) {
                return '<div><input type="radio" class="opt-input" name="e-mode" id="e-mode-' + m + '" value="' + m + '"' + (mode === m ? ' checked' : '') + '>' +
                  '<label for="e-mode-' + m + '" class="opt h-full text-sm font-medium">' + esc(t('a.ed.pricing.' + m)) + '</label></div>';
              }).join('') + '</div></fieldset>' +
            '<div id="e-formula" class="mt-4 grid gap-4 sm:grid-cols-2"' + (mode === 'formula' ? '' : ' hidden') + '>' +
              f({ id: 'e-base', label: t('a.ed.base'), value: pricing.base, inputmode: 'decimal' }) +
              f({ id: 'e-perm2', label: t('a.ed.perM2'), value: pricing.perM2, inputmode: 'decimal' }) +
              '<p class="text-sm text-muted sm:col-span-2">' + esc(t('a.ed.formulaHint')) + '</p></div>' +
            '<div id="e-sizes" class="mt-5"></div>' +
            '<p id="e-sizes-error" class="field-error" hidden></p>' +
            '<div class="mt-4 flex flex-wrap items-center gap-2">' +
              '<label class="sr-only" for="e-die">' + esc(t('a.ed.pickDie')) + '</label>' +
              '<select id="e-die" class="field-input h-10 w-auto max-w-full text-sm"></select>' +
              '<button type="button" data-add-die class="btn btn-secondary btn-sm">' + PK.ui.icon('plus', 'h-4 w-4') + esc(t('a.ed.addDie')) + '</button>' +
              '<button type="button" data-add-custom class="btn btn-quiet btn-sm">' + PK.ui.icon('plus', 'h-4 w-4') + esc(t('a.ed.addCustom')) + '</button>' +
            '</div>') +
          card(t('a.ed.sales'),
            '<div class="grid gap-4 sm:grid-cols-3">' +
              f({ id: 'e-unit', label: t('a.ed.unit'), type: 'select', options: ['pcs', 'sheet', 'roll'].map(function (u) { return opt(u, t('a.ed.unit.' + u), d.unit); }).join('') }) +
              f({ id: 'e-moq', label: t('a.ed.moq'), value: d.moq, inputmode: 'numeric', rules: 'required' }) +
              f({ id: 'e-step', label: t('a.ed.step'), value: d.step, inputmode: 'numeric', rules: 'required' }) +
              f({ id: 'e-low', label: t('a.ed.lowStock'), value: d.lowStock != null ? d.lowStock : '', placeholder: String(shop.lowStockLevel(d)), inputmode: 'numeric', optional: true }) +
              f({ id: 'e-pop', label: t('a.ed.popular'), value: d.popular != null ? d.popular : '', hint: t('a.ed.popularHint'), inputmode: 'numeric', optional: true, className: 'sm:col-span-2' }) +
            '</div>' +
            '<div class="mt-5 flex items-start justify-between gap-4 rounded-[20px] bg-canvas p-4"><div><p class="font-medium" id="e-active-label">' + esc(t('a.ed.visible')) + '</p>' +
              '<p class="mt-0.5 text-sm text-muted">' + esc(t('a.ed.visibleHint')) + '</p></div>' + ui.toggle('id="e-active" aria-labelledby="e-active-label"', d.active !== false, t('a.ed.visible')) + '</div>' +
            (original ? '<a href="#/inventory?q=' + encodeURIComponent(original.id) + '" class="link mt-4 inline-block text-sm">' + esc(t('a.ed.stockLink')) + '</a>' : '')) +
          card(t('a.ed.images'), '<p class="mb-4 text-sm text-muted">' + esc(t('a.ed.imagesHint')) + '</p><div id="e-images"></div>') +
        '</div>' +
        '<aside class="lg:sticky lg:top-6 lg:self-start"><p class="mb-3 text-sm font-medium text-muted">' + esc(t('a.ed.preview')) + '</p><div id="e-preview" inert></div></aside>' +
        '<div class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:left-64">' +
          '<div class="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">' +
            (original ? '<button type="button" data-delete class="btn btn-quiet text-bad hover:bg-bad-soft">' + PK.ui.icon('trash', 'h-[18px] w-[18px]') + esc(t('a.delete')) + '</button>' : '') +
            '<div class="ml-auto flex flex-wrap items-center justify-end gap-3">' +
              '<p id="e-dirty" class="hidden items-center gap-2 text-sm text-muted"><span class="h-2 w-2 rounded-full bg-[#fab219]"></span>' + esc(t('a.unsaved')) + '</p>' +
              '<p id="e-error" class="text-sm text-bad" role="alert" hidden></p>' +
              '<a href="#/products" class="btn btn-secondary">' + esc(t('a.cancel')) + '</a>' +
              '<button type="submit" class="btn btn-primary">' + esc(t('a.save')) + '</button>' +
            '</div>' +
          '</div></div>' +
      '</form>';

    var form = U.qs('#ed', main);

    /* ───────── Dynamic parts ───────── */
    function renderGsmDefault() {
      var gsm = U.qs('#e-gsm', main).value.split(/[^\d.,]+/).map(num).filter(function (n) { return n > 0; });
      var cur = U.qs('#e-gsm-def', main) ? num(U.qs('#e-gsm-def', main).value) : d.gsmDefault;
      U.qs('#e-gsm-def-wrap', main).innerHTML = gsm.length
        ? f({ id: 'e-gsm-def', label: t('a.ed.gsmDefault'), type: 'select', options: gsm.map(function (g) { return opt(g, g + ' ' + t('unit.gsm'), cur); }).join('') })
        : '';
      U.qs('#e-thick-wrap', main).hidden = gsm.length > 0;
    }
    function renderSizes() {
      U.qs('#e-sizes', main).innerHTML = sizeRowsHtml();
      U.qs('#e-die', main).innerHTML = dieOptions();
      var dieAllowed = U.qs('#e-shape', main).value === 'bag';
      U.qs('#e-die', main).hidden = !dieAllowed;
      U.qs('[data-add-die]', main).hidden = !dieAllowed;
    }
    function renderImages() { U.qs('#e-images', main).innerHTML = imagesHtml(); }
    var renderPreview = U.debounce(function () {
      var p = collect();
      p.id = '__preview';
      var host = U.qs('#e-preview', main);
      if (!host) return;
      try {
        var ok = p.sizes.length && p.colors.length && p.sizes.every(function (s) { return typeof s === 'string' || (isFinite(s.l) && s.price > 0); });
        host.innerHTML = ok ? '<div class="max-w-[300px]">' + PK.ui.productCard(p) + '</div>' : '<div class="tile flex aspect-square items-center justify-center p-6 text-center text-sm text-muted">' + esc(t('a.err.sizes')) + '</div>';
      } catch (e) { host.innerHTML = ''; }
      var isDirty = dirty();
      var flag = U.qs('#e-dirty', main);
      flag.classList.toggle('hidden', !isDirty);
      flag.classList.toggle('inline-flex', isDirty);
    }, 150);

    renderGsmDefault();
    renderSizes();
    renderImages();
    snapshot = serialize();
    renderPreview();
    app.setGuard(dirty);
    PK.ui.liveClear(form);

    /* ───────── Events ───────── */
    form.addEventListener('input', function (e) {
      var el = e.target;
      if (el.hasAttribute('data-row')) {
        var i = +el.getAttribute('data-row');
        rows[i][el.getAttribute('data-key')] = el.value;
        el.removeAttribute('aria-invalid');
      }
      if (el.hasAttribute('data-img')) images[+el.getAttribute('data-img')] = el.value.trim();
      if (el.id === 'e-base') pricing.base = el.value;
      if (el.id === 'e-perm2') pricing.perM2 = el.value;
      if (el.id === 'e-gsm') renderGsmDefault();
      if ((el.id === 'e-base' || el.id === 'e-perm2') && mode === 'formula') {
        // refresh computed prices without losing focus
        var focusId = el.id;
        renderSizes();
        U.qs('#' + focusId, main).focus();
      }
      renderPreview();
    });
    form.addEventListener('change', function (e) {
      var el = e.target;
      if (el.name === 'e-mode') { mode = el.value; U.qs('#e-formula', main).hidden = mode !== 'formula'; renderSizes(); }
      if (el.id === 'e-shape') {
        var wrap = U.qs('#e-style-wrap', main);
        wrap.outerHTML = styleField(el.value, null);
        if (el.value !== 'bag') rows = rows.map(function (r) { return Object.assign({}, r, { kind: 'custom' }); });
        renderSizes();
      }
      renderPreview();
    });
    form.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.id === 'e-active') {
        var on = b.getAttribute('aria-checked') !== 'true';
        b.outerHTML = ui.toggle('id="e-active" aria-labelledby="e-active-label"', on, t('a.ed.visible'));
        U.qs('#e-active', main).focus();
        renderPreview();
      } else if (b.hasAttribute('data-add-die')) {
        var code = U.qs('#e-die', main).value;
        if (!code) { U.qs('#e-die', main).focus(); return; }
        var tp = PK.TEMPLATE_BY_CODE[code];
        rows.push({ kind: 'die', code: code, l: tp.l, w: tp.w, h: tp.h, format: tp.format, price: '' });
        renderSizes(); renderPreview();
        U.qs('#e-die', main).focus();
      } else if (b.hasAttribute('data-add-custom')) {
        rows.push({ kind: 'custom', code: '', l: '', w: '', h: '', length: 50, d: 12, price: '' });
        renderSizes(); renderPreview();
        var last = U.qsa('[data-key="code"]', main).pop();
        if (last) last.focus();
      } else if (b.hasAttribute('data-remove-row')) {
        rows.splice(+b.getAttribute('data-remove-row'), 1);
        renderSizes(); renderPreview();
      } else if (b.hasAttribute('data-add-img')) {
        images.push('');
        renderImages();
        U.qs('#e-img-' + (images.length - 1), main).focus();
      } else if (b.hasAttribute('data-remove-img')) {
        images.splice(+b.getAttribute('data-remove-img'), 1);
        renderImages(); renderPreview();
      } else if (b.hasAttribute('data-delete')) {
        ui.dialog({
          title: t('a.prod.deleteTitle', { name: loc(original.name) }), body: esc(t('a.prod.deleteBody')), confirm: t('a.delete'), danger: true,
          onConfirm: function () {
            var snaps = A.removeProducts([original.id]);
            app.setGuard(null);
            location.hash = '#/products';
            PK.ui.toast(t('a.deleted') + ': ' + loc(original.name), { action: { label: t('common.undo'), onClick: function () { A.restoreProducts(snaps); app.rerender(); } } });
          },
        });
      }
    });

    /* ───────── Validation + save ───────── */
    function validate(p) {
      var okBasic = PK.ui.validate(form);
      var first = null;
      var mark = function (el, key) { if (!el) return; PK.ui.setError(el, key); if (!first) first = el; };
      ['e-moq', 'e-step'].forEach(function (id) { var el = U.qs('#' + id, main); if (!(num(el.value) >= 1)) mark(el, 'a.err.number'); });
      if (mode === 'formula') ['e-base', 'e-perm2'].forEach(function (id) { var el = U.qs('#' + id, main); if (!(num(el.value) >= 0)) mark(el, 'a.err.number'); });
      var colorsBox = U.qs('#e-colors', main);
      var colorErr = U.qs('#e-colors-error', main);
      if (!p.colors.length) {
        if (!colorErr) colorsBox.insertAdjacentHTML('beforeend', '<p id="e-colors-error" class="field-error">' + esc(t('a.err.colors')) + '</p>');
        if (!first) first = U.qs('input[name="e-color"]', main);
      } else if (colorErr) colorErr.remove();

      var sizeErr = U.qs('#e-sizes-error', main);
      var problem = '';
      if (!rows.length) problem = t('a.err.sizes');
      var codes = {};
      rows.forEach(function (row, i) {
        var bad = function (key, msg) {
          var el = U.qs('[data-row="' + i + '"][data-key="' + key + '"]', main);
          if (el) { el.setAttribute('aria-invalid', 'true'); if (!first) first = el; }
          problem = problem || msg;
        };
        var code = String(row.code || '').trim();
        if (!code || codes[code]) bad('code', t('a.err.code'));
        codes[code] = true;
        if (row.kind !== 'die') {
          if (!(num(row.l) > 0)) bad('l', t('a.err.dims'));
          if (p.shape === 'roll' && !(num(row.length) > 0)) bad('length', t('a.err.dims'));
          if (p.shape === 'sheet' && !(num(row.w) > 0)) bad('w', t('a.err.dims'));
          if ((p.shape === 'bag' || p.shape === 'box') && !(num(row.h) > 0)) bad('h', t('a.err.dims'));
        }
        if (!(row.kind === 'die' && mode === 'formula') && !(num(row.price) > 0)) bad('price', t('a.err.price'));
      });
      sizeErr.textContent = problem;
      sizeErr.hidden = !problem;
      if (problem && !first) first = U.qs('[data-add-custom]', main);
      if (first) first.focus();
      return okBasic && !first;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = collect();
      var errBox = U.qs('#e-error', main);
      if (!validate(p)) {
        errBox.textContent = t('a.err.form'); errBox.hidden = false;
        U.qs('#e-dirty', main).classList.add('hidden');
        return;
      }
      errBox.hidden = true;
      if (!p.name.en) p.name.en = p.name.mn;
      if (!p.material.en) p.material.en = p.material.mn;
      var saved = A.saveProduct(p, original ? original.id : null);
      app.setGuard(null);
      snapshot = null;
      PK.ui.toast(t(original ? 'a.ed.updated' : 'a.ed.created') + ': ' + loc(saved.name), { action: { label: t('a.nav.store'), href: 'product.html?id=' + encodeURIComponent(saved.id) } });
      if (original) app.rerender(); else location.hash = '#/products/' + encodeURIComponent(saved.id);
      app.refreshNav();
    });
  });
})();
