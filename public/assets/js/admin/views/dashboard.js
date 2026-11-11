/** Overview: KPIs vs the previous period, revenue over time, best sellers, categories, low stock, recent orders. */
(function () {
  var A = PK.admin, ui = PK.aui, app = PK.adminApp, t = PK.t, U = PK.util, esc = U.esc, loc = PK.loc, shop = PK.shop;
  var range = +(PK.store.read('admin.range', 30)) || 30;
  var showTable = false;

  function pct(cur, prev) { return prev ? ((cur - prev) / prev) * 100 : null; }

  app.view('dashboard', function (main) {
    function render() {
      var a = A.analytics(range);
      var daily = a.bucket === 'day';
      var points = a.series.map(function (b) {
        var d = new Date(b.start);
        var full = daily ? d.getFullYear() + '.' + ui.shortDate(b.start) + (range <= 7 ? ', ' + ui.weekday(b.start) : '') : t('a.chart.weekOf', { date: ui.shortDate(b.start) });
        return { label: range <= 7 ? ui.weekday(b.start) : ui.shortDate(b.start), full: full, value: b.value, sub: t('a.chart.ordersN', { n: b.orders }) };
      });

      var top = a.top.slice(0, 5).map(function (r) {
        var unit = r.p ? shop.unitLabel(r.p) : '';
        return { label: loc(r.name), value: r.revenue, display: ui.compactMoney(r.revenue), meta: U.int(r.units) + ' ' + unit };
      });
      var catTotal = a.categories.reduce(function (s, c) { return s + c.revenue; }, 0) || 1;
      var cats = a.categories.map(function (c) {
        return { label: c.cat ? loc(c.cat.name) : '—', value: c.revenue, display: ui.compactMoney(c.revenue), meta: Math.round((c.revenue / catTotal) * 100) + '%' };
      });

      var lowList = a.low.slice(0, 6).map(function (r) {
        return '<li class="flex items-center gap-3 py-2.5">' + ui.thumb(r.p, r.s, r.color, 'h-10 w-10') +
          '<div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">' + esc(loc(r.p.name)) + '</p>' +
          '<p class="text-xs text-muted tnum">' + esc(r.s.code + ', ' + loc(PK.COLORS[r.color])) + '</p></div>' +
          '<div class="text-right"><p class="text-sm font-semibold tnum">' + U.int(r.qty) + '</p>' + ui.stockPill(r.status) + '</div></li>';
      }).join('');

      var recent = a.recent.map(function (o) {
        return '<li><a href="#/orders?open=' + encodeURIComponent(o.id) + '" class="-mx-2 flex items-center gap-3 rounded-[14px] px-2 py-2.5 hover:bg-canvas">' +
          '<div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">' + esc(o.customer.name) + '</p><p class="text-xs text-muted tnum">' + esc(o.id) + '</p></div>' +
          '<div class="text-right"><p class="text-sm font-semibold tnum">' + U.money(o.total) + '</p>' + ui.orderPill(o.status) + '</div></a></li>';
      }).join('');

      main.innerHTML = app.header(t('a.nav.dashboard')) +
        '<div class="mb-5 flex flex-wrap items-center gap-3"><span class="text-sm text-muted">' + esc(t('a.range.label')) + '</span>' +
          app.tabs([{ id: '7', label: t('a.range.7') }, { id: '30', label: t('a.range.30') }, { id: '90', label: t('a.range.90') }], String(range), 'data-range') + '</div>' +
        '<section class="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4" aria-label="' + esc(t('a.nav.dashboard')) + '">' +
          ui.statTile(t('a.kpi.revenue'), ui.compactMoney(a.cur.revenue), pct(a.cur.revenue, a.prev.revenue), range) +
          ui.statTile(t('a.kpi.orders'), U.int(a.cur.orders), pct(a.cur.orders, a.prev.orders), range) +
          ui.statTile(t('a.kpi.aov'), ui.compactMoney(a.cur.aov), pct(a.cur.aov, a.prev.aov), range) +
          ui.statTile(t('a.kpi.customers'), U.int(a.newCustomers), pct(a.newCustomers, a.prevNewCustomers), range) +
        '</section>' +
        '<div class="mt-4 grid gap-4 lg:grid-cols-3">' +
          '<section class="panel min-w-0 p-5 lg:col-span-2" aria-labelledby="rev-h">' +
            '<div class="flex flex-wrap items-baseline justify-between gap-2"><h2 id="rev-h" class="h-section">' + esc(t(daily ? 'a.chart.daily' : 'a.chart.weekly')) + '</h2>' +
            '<button type="button" data-table class="link text-sm">' + esc(t(showTable ? 'a.chart.chart' : 'a.chart.table')) + '</button></div>' +
            (showTable
              ? '<div class="mt-4 max-h-[280px] overflow-y-auto"><table class="data-table"><thead><tr><th>' + esc(t('a.chart.period')) + '</th><th class="text-right">' + esc(t('a.kpi.orders')) + '</th><th class="text-right">' + esc(t('a.kpi.revenue')) + '</th></tr></thead><tbody>' +
                a.series.map(function (b, i) { return '<tr><td class="tnum">' + esc(points[i].full) + '</td><td class="text-right tnum">' + b.orders + '</td><td class="text-right tnum">' + U.money(b.value) + '</td></tr>'; }).join('') + '</tbody></table></div>'
              : '<div id="rev-chart" class="relative mt-4"></div>') +
          '</section>' +
          '<section class="panel min-w-0 p-5" aria-labelledby="top-h"><h2 id="top-h" class="h-section">' + esc(t('a.top.title')) + '</h2>' +
            '<div class="mt-5">' + (top.length ? ui.rankedBars(top) : '<p class="text-sm text-muted">' + esc(t('a.noOrders')) + '</p>') + '</div></section>' +
        '</div>' +
        '<div class="mt-4 grid gap-4 lg:grid-cols-3">' +
          '<section class="panel min-w-0 p-5" aria-labelledby="cat-h"><h2 id="cat-h" class="h-section">' + esc(t('a.cat.title')) + '</h2>' +
            '<div class="mt-5">' + (cats.length ? ui.rankedBars(cats) : '<p class="text-sm text-muted">' + esc(t('a.noOrders')) + '</p>') + '</div></section>' +
          '<section class="panel min-w-0 p-5" aria-labelledby="low-h"><div class="flex items-baseline justify-between gap-2"><h2 id="low-h" class="h-section">' + esc(t('a.low.title')) + '</h2>' +
            '<a href="#/inventory?status=low" class="link text-sm">' + esc(t('a.low.all')) + '</a></div>' +
            (a.low.length ? '<p class="mt-1 text-sm text-muted tnum">' + esc(t('a.st.out')) + ': ' + a.outCount + ', ' + esc(t('a.st.low').toLowerCase()) + ': ' + a.lowCount + '</p><ul class="mt-2 divide-y divide-line">' + lowList + '</ul>'
              : '<p class="mt-4 text-sm text-muted">' + esc(t('a.low.none')) + '</p>') + '</section>' +
          '<section class="panel min-w-0 p-5" aria-labelledby="rec-h"><div class="flex items-baseline justify-between gap-2"><h2 id="rec-h" class="h-section">' + esc(t('a.recent.title')) + '</h2>' +
            '<a href="#/orders" class="link text-sm">' + esc(t('a.recent.all')) + '</a></div>' +
            (recent ? '<ul class="mt-3">' + recent + '</ul>' : '<p class="mt-4 text-sm text-muted">' + esc(t('a.ord.empty')) + '</p>') + '</section>' +
        '</div>';

      var chartHost = U.qs('#rev-chart', main);
      if (chartHost) ui.columnChart(chartHost, points, { height: 260, label: t(daily ? 'a.chart.daily' : 'a.chart.weekly') });

      main.querySelectorAll('[data-range]').forEach(function (b) {
        b.addEventListener('click', function () {
          range = +b.getAttribute('data-range');
          PK.store.write('admin.range', range);
          render();
        });
      });
      U.qs('[data-table]', main).addEventListener('click', function () { showTable = !showTable; render(); });
    }
    render();
  });
})();
