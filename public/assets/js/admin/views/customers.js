/** Customers (accounts + guest buyers, built from orders) and Messages (contact-form inbox). */
(function () {
  var A = PK.admin, ui = PK.aui, app = PK.adminApp, t = PK.t, U = PK.util, esc = U.esc;

  /* ═════════════════════════ Customers ═════════════════════════ */
  var state = { tab: 'all', q: '', sort: 'spent' };

  function initials(name) { return String(name || '?').replace(/^[^\s.]+\.\s*/, '').charAt(0).toUpperCase() || '?'; }

  function profileHtml(c) {
    return '<div class="space-y-6">' +
      '<div class="flex items-center gap-4"><span class="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-lg font-semibold text-white">' + esc(initials(c.name)) + '</span>' +
        '<div><p class="text-lg font-semibold">' + esc(c.name || c.email) + '</p>' + (c.company ? '<p class="text-sm text-muted">' + esc(c.company) + '</p>' : '') +
        '<p class="mt-1">' + (c.account ? '<span class="badge bg-canvas text-ink">' + esc(t('a.cus.account')) + '</span>' : '<span class="badge bg-white text-muted ring-1 ring-inset ring-line">' + esc(t('a.cus.guest')) + '</span>') + '</p></div></div>' +
      '<dl class="grid grid-cols-2 gap-3">' +
        [[t('field.email'), '<a class="link" href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>'],
         [t('field.phone'), c.phone ? '<a class="link" href="tel:' + esc(String(c.phone).replace(/[^\d+]/g, '')) + '">' + esc(c.phone) + '</a>' : '—'],
         [t('a.cus.col.orders'), U.int(c.orders.length)],
         [t('a.cus.col.spent'), U.money(c.spent)],
         [t('a.cus.first'), c.first ? esc(U.formatDate(c.first).slice(0, 10)) : '—'],
         [t('a.cus.col.last'), c.last ? esc(U.formatDate(c.last).slice(0, 10)) : '—']].map(function (r) {
          return '<div class="rounded-[20px] bg-canvas p-4"><dt class="text-xs text-muted">' + esc(r[0]) + '</dt><dd class="mt-1 break-words font-medium tnum">' + r[1] + '</dd></div>';
        }).join('') + '</dl>' +
      '<section><h3 class="mb-2 text-sm font-semibold">' + esc(t('a.cus.history')) + '</h3>' +
        (c.orders.length ? '<ul class="divide-y divide-line">' + c.orders.map(function (o) {
          return '<li><a href="#/orders?open=' + encodeURIComponent(o.id) + '" class="-mx-2 flex items-center gap-3 rounded-[14px] px-2 py-3 hover:bg-canvas">' +
            '<div class="min-w-0 flex-1"><p class="text-sm font-medium tnum">' + esc(o.id) + '</p><p class="text-xs text-muted tnum">' + esc(U.formatDate(o.createdAt)) + '</p></div>' +
            '<div class="text-right"><p class="text-sm font-semibold tnum">' + U.money(o.total) + '</p>' + ui.orderPill(o.status) + '</div></a></li>';
        }).join('') + '</ul>' : '<p class="text-sm text-muted">' + esc(t('a.ord.empty')) + '</p>') + '</section>' +
    '</div>';
  }

  app.view('customers', function (main) {
    function filtered(all) {
      var q = state.q.trim().toLowerCase();
      var rows = all.filter(function (c) {
        if (state.tab === 'registered' && !c.account) return false;
        if (state.tab === 'guest' && c.account) return false;
        if (state.tab === 'repeat' && c.orders.length < 2) return false;
        if (!q) return true;
        return (c.name + ' ' + c.email + ' ' + c.phone + ' ' + c.company).toLowerCase().indexOf(q) !== -1;
      });
      var key = {
        spent: function (c) { return -c.spent; },
        last: function (c) { return -(Date.parse(c.last || 0) || 0); },
        orders: function (c) { return -c.orders.length; },
        name: function (c) { return (c.name || c.email).toLowerCase(); },
      }[state.sort];
      return rows.sort(function (a, b) { var x = key(a), y = key(b); return x > y ? 1 : x < y ? -1 : 0; });
    }

    function render() {
      var all = A.customers();
      var list = filtered(all);
      var counts = {
        all: all.length,
        registered: all.filter(function (c) { return c.account; }).length,
        repeat: all.filter(function (c) { return c.orders.length > 1; }).length,
      };
      counts.guest = counts.all - counts.registered;
      main.innerHTML = app.header(t('a.nav.customers'), '<button type="button" data-export class="btn btn-secondary">' + ui.icon('download', 'h-[18px] w-[18px]') + esc(t('a.export')) + '</button>', esc(t('a.cus.privacy'))) +
        '<div class="mb-4 flex flex-wrap items-center gap-3">' +
          app.tabs([{ id: 'all', label: t('a.all'), count: counts.all }, { id: 'registered', label: t('a.cus.tab.registered'), count: counts.registered }, { id: 'guest', label: t('a.cus.tab.guest'), count: counts.guest }, { id: 'repeat', label: t('a.cus.tab.repeat'), count: counts.repeat }], state.tab, 'data-tab') +
          app.search('c-q', t('a.cus.searchPh'), state.q) +
          '<label class="sr-only" for="c-sort">' + esc(t('catalog.sort')) + '</label>' +
          '<select id="c-sort" class="field-input h-11 w-auto text-sm">' +
            [['spent', t('a.cus.col.spent')], ['last', t('a.cus.col.last')], ['orders', t('a.cus.col.orders')], ['name', t('a.cus.col.name')]].map(function (o) {
              return '<option value="' + o[0] + '"' + (state.sort === o[0] ? ' selected' : '') + '>' + esc(t('catalog.sort') + ': ' + o[1]) + '</option>';
            }).join('') + '</select>' +
        '</div>' +
        '<div class="panel overflow-hidden">' +
          (list.length
            ? '<div class="overflow-x-auto"><table class="data-table min-w-[820px]"><thead><tr>' +
                '<th class="pl-5">' + esc(t('a.cus.col.name')) + '</th><th>' + esc(t('a.cus.col.phone')) + '</th><th>' + esc(t('a.cus.col.company')) + '</th>' +
                '<th class="text-right">' + esc(t('a.cus.col.orders')) + '</th><th class="text-right">' + esc(t('a.cus.col.spent')) + '</th><th class="pr-5">' + esc(t('a.cus.col.last')) + '</th></tr></thead><tbody>' +
                list.map(function (c) {
                  return '<tr data-email="' + esc(c.email) + '" class="cursor-pointer">' +
                    '<td class="pl-5"><button type="button" class="flex items-center gap-3 text-left"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-sm font-semibold">' + esc(initials(c.name)) + '</span>' +
                      '<span><span class="block font-medium hover:underline hover:underline-offset-4">' + esc(c.name || c.email) + '</span><span class="block text-xs text-muted">' + esc(c.email) + '</span></span></button></td>' +
                    '<td class="whitespace-nowrap tnum">' + esc(c.phone || '—') + '</td>' +
                    '<td>' + esc(c.company || '—') + (c.account ? ' <span class="ml-1 rounded-full bg-canvas px-2 py-0.5 text-xs">' + esc(t('a.cus.account')) + '</span>' : '') + '</td>' +
                    '<td class="text-right tnum">' + c.orders.length + '</td>' +
                    '<td class="whitespace-nowrap text-right font-medium tnum">' + U.money(c.spent) + '</td>' +
                    '<td class="whitespace-nowrap pr-5 tnum text-muted">' + (c.last ? esc(U.formatDate(c.last).slice(0, 10)) : '—') + '</td></tr>';
                }).join('') + '</tbody></table></div>'
            : (all.length ? ui.empty(t('a.noMatch'), '', '<button type="button" data-clear class="btn btn-secondary mt-5">' + esc(t('a.clearFilters')) + '</button>') : ui.empty(t('a.cus.empty'), ''))) +
        '</div>';

      main.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { state.tab = b.getAttribute('data-tab'); render(); }); });
      var q = U.qs('#c-q', main);
      q.addEventListener('input', U.debounce(function () {
        state.q = q.value; render();
        var again = U.qs('#c-q', main); again.focus(); again.setSelectionRange(again.value.length, again.value.length);
      }, 200));
      U.qs('#c-sort', main).addEventListener('change', function (e) { state.sort = e.target.value; render(); });
      var clear = U.qs('[data-clear]', main);
      if (clear) clear.addEventListener('click', function () { state.tab = 'all'; state.q = ''; render(); });
      main.querySelectorAll('tr[data-email]').forEach(function (tr) {
        tr.addEventListener('click', function () {
          var c = A.customers().find(function (x) { return x.email === tr.getAttribute('data-email'); });
          var d = ui.drawer({ title: c.name || c.email, html: profileHtml(c) });
          d.el.addEventListener('click', function (e) { if (e.target.closest('a[href^="#/orders"]')) d.close(); });
        });
      });
      U.qs('[data-export]', main).addEventListener('click', function () {
        var csv = A.toCsv([
          { label: t('field.name'), value: function (c) { return c.name; } },
          { label: t('field.email'), value: function (c) { return c.email; } },
          { label: t('field.phone'), value: function (c) { return c.phone; } },
          { label: t('field.company'), value: function (c) { return c.company; } },
          { label: t('a.cus.account'), value: function (c) { return c.account ? t('common.yes') : ''; } },
          { label: t('a.cus.col.orders'), value: function (c) { return c.orders.length; } },
          { label: t('a.cus.col.spent'), value: function (c) { return c.spent; } },
          { label: t('a.cus.first'), value: function (c) { return c.first || ''; } },
          { label: t('a.cus.col.last'), value: function (c) { return c.last || ''; } },
        ], filtered(A.customers()));
        A.download('customers-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
      });
    }
    render();
  });

  /* ═════════════════════════ Messages ═════════════════════════ */
  var msgState = { tab: 'all' };

  app.view('messages', function (main) {
    function render() {
      var all = A.inquiries();
      var unread = all.filter(function (q) { return !q.read; }).length;
      var list = msgState.tab === 'unread' ? all.filter(function (q) { return !q.read; }) : all;
      main.innerHTML = app.header(t('a.nav.messages')) +
        '<div class="mb-4">' + app.tabs([{ id: 'all', label: t('a.all'), count: all.length }, { id: 'unread', label: t('a.msg.unread'), count: unread }], msgState.tab, 'data-tab') + '</div>' +
        '<div class="panel overflow-hidden">' +
          (list.length ? '<ul class="divide-y divide-line">' + list.map(function (q) {
            return '<li><button type="button" data-id="' + esc(q.id) + '" class="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-canvas">' +
              '<span class="mt-2 h-2 w-2 shrink-0 rounded-full ' + (q.read ? 'bg-transparent' : 'bg-ink') + '"><span class="sr-only">' + (q.read ? '' : esc(t('a.msg.unread'))) + '</span></span>' +
              '<span class="min-w-0 flex-1"><span class="flex flex-wrap items-baseline justify-between gap-x-3"><span class="' + (q.read ? 'font-medium' : 'font-semibold') + '">' + esc(q.name) + '</span>' +
              '<span class="text-xs text-muted tnum">' + esc(U.formatDate(q.createdAt)) + '</span></span>' +
              '<span class="mt-0.5 block text-xs text-muted">' + esc(t('topic.' + (q.topic || 'general'))) + '</span>' +
              '<span class="mt-1 block truncate text-sm ' + (q.read ? 'text-muted' : 'text-ink') + '">' + esc(q.message) + '</span></span></button></li>';
          }).join('') + '</ul>' : ui.empty(t('a.msg.empty'), '')) +
        '</div>';
      main.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { msgState.tab = b.getAttribute('data-tab'); render(); }); });
      main.querySelectorAll('[data-id]').forEach(function (b) {
        b.addEventListener('click', function () {
          var q = A.inquiries().find(function (x) { return x.id === b.getAttribute('data-id'); });
          A.setRead(q.id, true);
          render(); app.refreshNav();
          var subject = encodeURIComponent(t('topic.' + (q.topic || 'general')));
          var d = ui.drawer({
            title: q.name, onClose: function () { render(); app.refreshNav(); },
            html: '<div class="space-y-5"><div class="flex flex-wrap items-center justify-between gap-2"><span class="badge bg-canvas text-ink">' + esc(t('topic.' + (q.topic || 'general'))) + '</span><span class="text-sm text-muted tnum">' + esc(U.formatDate(q.createdAt)) + '</span></div>' +
              '<p class="whitespace-pre-line rounded-[20px] bg-canvas p-5 leading-relaxed">' + esc(q.message) + '</p>' +
              '<dl class="space-y-2 text-sm"><div><dt class="text-muted">' + esc(t('field.email')) + '</dt><dd><a class="link" href="mailto:' + esc(q.email) + '">' + esc(q.email) + '</a></dd></div>' +
                (q.phone ? '<div><dt class="text-muted">' + esc(t('field.phone')) + '</dt><dd class="tnum">' + esc(q.phone) + '</dd></div>' : '') + '</dl>' +
              '<div class="flex flex-wrap gap-2"><a class="btn btn-primary" href="mailto:' + esc(q.email) + '?subject=' + subject + '">' + PK.ui.icon('mail', 'h-[18px] w-[18px]') + esc(t('a.msg.reply')) + '</a>' +
              '<button type="button" data-unread class="btn btn-secondary">' + esc(t('a.msg.markUnread')) + '</button></div></div>',
          });
          d.el.querySelector('[data-unread]').addEventListener('click', function () { A.setRead(q.id, false); d.close(); });
        });
      });
    }
    render();
  });
})();
