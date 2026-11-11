/** Inventory: every SKU (product × size × colour) with on-hand units, alert level, status; inline edits and bulk restock. */
(function () {
  var A = PK.admin, ui = PK.aui, app = PK.adminApp, t = PK.t, U = PK.util, esc = U.esc, loc = PK.loc, shop = PK.shop;
  var state = { tab: 'all', q: '', cat: '', selected: {} };

  app.view('inventory', function (main, r) {
    if (r.params.get('status')) state.tab = r.params.get('status') === 'low' ? 'low' : r.params.get('status');
    if (r.params.get('q')) state.q = r.params.get('q');

    function rows() {
      var q = state.q.trim().toLowerCase();
      return A.stockRows().filter(function (row) {
        if (state.cat && row.p.category !== state.cat) return false;
        if (state.tab === 'low' && row.status !== 'low') return false;
        if (state.tab === 'out' && row.status !== 'out') return false;
        if (!q) return true;
        return (loc(row.p.name) + ' ' + row.p.id + ' ' + row.s.code + ' ' + loc(PK.COLORS[row.color])).toLowerCase().indexOf(q) !== -1;
      }).sort(function (a, b) {
        var rank = { out: 0, low: 1, ok: 2 };
        return rank[a.status] - rank[b.status] || a.qty - b.qty;
      });
    }

    function render() {
      var all = A.stockRows();
      var list = rows();
      var counts = { all: all.length, low: 0, out: 0 };
      all.forEach(function (x) { if (x.status !== 'ok') counts[x.status] += 1; });
      var selKeys = Object.keys(state.selected).filter(function (k) { return state.selected[k]; });
      var allOn = list.length && list.every(function (x) { return state.selected[x.key]; });

      main.innerHTML = app.header(t('a.nav.inventory'), '<button type="button" data-export class="btn btn-secondary">' + ui.icon('download', 'h-[18px] w-[18px]') + esc(t('a.export')) + '</button>', esc(t('a.inv.hint'))) +
        '<div class="mb-4 flex flex-wrap items-center gap-3">' +
          app.tabs([{ id: 'all', label: t('a.inv.tab.all'), count: counts.all }, { id: 'low', label: t('a.inv.tab.low'), count: counts.low }, { id: 'out', label: t('a.inv.tab.out'), count: counts.out }], state.tab, 'data-tab') +
          app.search('i-q', t('a.inv.searchPh'), state.q) +
          '<label class="sr-only" for="i-cat">' + esc(t('a.prod.col.category')) + '</label>' +
          '<select id="i-cat" class="field-input h-11 w-auto text-sm"><option value="">' + esc(t('filter.all')) + '</option>' +
            PK.CATEGORIES.map(function (c) { return '<option value="' + c.id + '"' + (state.cat === c.id ? ' selected' : '') + '>' + esc(loc(c.name)) + '</option>'; }).join('') + '</select>' +
        '</div>' +
        (selKeys.length
          ? '<div class="mb-3 flex flex-wrap items-center gap-2 rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-sm text-white">' +
              '<span class="mr-auto font-medium tnum">' + esc(t('a.selected', { n: selKeys.length })) + '</span>' +
              '<button type="button" data-restock class="btn btn-sm bg-white text-ink hover:bg-canvas">' + PK.ui.icon('plus', 'h-4 w-4') + esc(t('a.inv.restock')) + '</button>' +
              '<button type="button" data-unselect class="icon-btn h-9 w-9 text-white hover:bg-white/10" aria-label="' + esc(t('a.close')) + '">' + PK.ui.icon('close', 'h-4 w-4') + '</button></div>'
          : '') +
        '<div class="panel overflow-hidden">' +
          (list.length
            ? '<div class="overflow-x-auto"><table class="data-table min-w-[760px]"><thead><tr>' +
                '<th class="w-12 pl-5"><input type="checkbox" class="check" data-all aria-label="' + esc(t('a.all')) + '"' + (allOn ? ' checked' : '') + '></th>' +
                '<th>' + esc(t('a.inv.col.product')) + '</th><th>' + esc(t('a.inv.col.size')) + '</th><th>' + esc(t('a.inv.col.color')) + '</th>' +
                '<th>' + esc(t('a.inv.col.qty')) + '</th><th>' + esc(t('a.inv.col.alert')) + '</th><th class="pr-5">' + esc(t('a.inv.col.status')) + '</th></tr></thead><tbody>' +
                list.map(function (x) {
                  var label = loc(x.p.name) + ', ' + x.s.code + ', ' + loc(PK.COLORS[x.color]);
                  return '<tr data-key="' + esc(x.key) + '">' +
                    '<td class="pl-5"><input type="checkbox" class="check" data-pick aria-label="' + esc(label) + '"' + (state.selected[x.key] ? ' checked' : '') + '></td>' +
                    '<td><a href="#/products/' + encodeURIComponent(x.p.id) + '" class="flex items-center gap-3">' + ui.thumb(x.p, x.s, x.color, 'h-10 w-10') +
                      '<span class="font-medium hover:underline hover:underline-offset-4">' + esc(loc(x.p.name)) + '</span></a></td>' +
                    '<td class="whitespace-nowrap tnum"><span class="font-semibold">' + esc(x.s.code) + '</span> <span class="text-muted">' + esc(shop.dimsUnit(x.p, x.s)) + '</span></td>' +
                    '<td class="whitespace-nowrap"><span class="inline-flex items-center gap-2">' + ui.swatch(x.color) + esc(loc(PK.COLORS[x.color])) + '</span></td>' +
                    '<td><div class="flex items-center gap-2"><input type="number" min="0" step="' + (x.p.step || 1) + '" inputmode="numeric" value="' + x.qty + '" data-qty aria-label="' + esc(t('a.inv.qtyLabel', { sku: label })) + '" class="field-input h-9 w-28 px-3 text-sm tnum">' +
                      '<span class="text-xs text-muted">' + esc(shop.unitLabel(x.p)) + '</span></div></td>' +
                    '<td class="tnum text-muted">' + U.int(x.level) + '</td>' +
                    '<td class="pr-5" data-status>' + ui.stockPill(x.status) + '</td></tr>';
                }).join('') + '</tbody></table></div>'
            : ui.empty(t('a.noMatch'), '', '<button type="button" data-clear class="btn btn-secondary mt-5">' + esc(t('a.clearFilters')) + '</button>')) +
        '</div>';
      bind(list);
    }

    function bind(list) {
      main.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { state.tab = b.getAttribute('data-tab'); render(); }); });
      var q = U.qs('#i-q', main);
      q.addEventListener('input', U.debounce(function () {
        state.q = q.value; render();
        var again = U.qs('#i-q', main); again.focus(); again.setSelectionRange(again.value.length, again.value.length);
      }, 200));
      U.qs('#i-cat', main).addEventListener('change', function (e) { state.cat = e.target.value; render(); });
      var clear = U.qs('[data-clear]', main);
      if (clear) clear.addEventListener('click', function () { state.tab = 'all'; state.q = ''; state.cat = ''; render(); });
      var all = U.qs('[data-all]', main);
      if (all) all.addEventListener('change', function () { list.forEach(function (x) { state.selected[x.key] = all.checked; }); render(); });
      var unselect = U.qs('[data-unselect]', main);
      if (unselect) unselect.addEventListener('click', function () { state.selected = {}; render(); });

      main.querySelectorAll('tr[data-key]').forEach(function (tr) {
        var key = tr.getAttribute('data-key');
        tr.querySelector('[data-pick]').addEventListener('change', function (e) { state.selected[key] = e.target.checked; render(); });
        var input = tr.querySelector('[data-qty]');
        input.addEventListener('change', function () {
          var row = A.stockRows().find(function (x) { return x.key === key; });
          var before = row.qty;
          var v = Math.max(0, Math.round(parseFloat(String(input.value).replace(',', '.')) || 0));
          input.value = v;
          if (v === before) return;
          A.setStock(key, v);
          var now = A.stockRows().find(function (x) { return x.key === key; });
          tr.querySelector('[data-status]').innerHTML = ui.stockPill(now.status);
          app.refreshNav();
          var sku = loc(row.p.name) + ' ' + row.s.code;
          PK.ui.toast(t('a.inv.updated', { sku: sku, qty: U.int(v) }), { action: { label: t('common.undo'), onClick: function () { A.setStock(key, before); render(); app.refreshNav(); } } });
        });
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
      });

      var restock = U.qs('[data-restock]', main);
      if (restock) restock.addEventListener('click', function () {
        var keys = Object.keys(state.selected).filter(function (k) { return state.selected[k]; });
        ui.dialog({
          title: t('a.inv.restockTitle', { n: keys.length }),
          body: '<div class="mt-2">' + PK.ui.field({ id: 'restock-n', label: t('a.inv.amount'), value: '500', inputmode: 'numeric', rules: 'required' }) + '</div>',
          confirm: t('a.inv.restock'), initial: '#restock-n',
          onConfirm: function (form) {
            var n = Math.round(parseFloat(form.querySelector('#restock-n').value));
            if (!(n > 0)) { PK.ui.setError(form.querySelector('#restock-n'), 'a.err.number'); return false; }
            var targets = A.stockRows().filter(function (x) { return keys.indexOf(x.key) !== -1; });
            A.addStock(targets, n);
            state.selected = {};
            render(); app.refreshNav();
            PK.ui.toast(t('a.inv.restocked', { n: targets.length, qty: U.int(n) }));
          },
        });
      });

      U.qs('[data-export]', main).addEventListener('click', function () {
        var csv = A.toCsv([
          { label: 'SKU', value: function (x) { return x.key; } },
          { label: t('a.inv.col.product'), value: function (x) { return loc(x.p.name); } },
          { label: t('a.inv.col.size'), value: function (x) { return x.s.code; } },
          { label: t('dim.dims'), value: function (x) { return shop.dimsUnit(x.p, x.s); } },
          { label: t('a.inv.col.color'), value: function (x) { return loc(PK.COLORS[x.color]); } },
          { label: t('a.inv.col.qty'), value: function (x) { return x.qty; } },
          { label: t('a.inv.col.alert'), value: function (x) { return x.level; } },
          { label: t('a.inv.col.status'), value: function (x) { return t('a.st.' + x.status); } },
        ], rows());
        A.download('inventory-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
      });
    }

    render();
  });
})();
