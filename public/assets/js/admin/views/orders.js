/** Orders: status tabs, search, CSV export, and a detail panel with a one-click "next step" workflow. */
(function () {
  var A = PK.admin, ui = PK.aui, app = PK.adminApp, t = PK.t, U = PK.util, esc = U.esc, loc = PK.loc;
  var state = { status: 'all', q: '' };
  var PAY = { transfer: 'pay.transfer', qpay: 'pay.qpay', cash: 'pay.cash' };

  function detailHtml(o) {
    var next = A.nextStatus(o.status);
    var flowIndex = A.FLOW.indexOf(o.status);
    var steps = '<ol class="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">' + A.FLOW.map(function (s, i) {
      var done = o.status !== 'cancelled' && i <= flowIndex;
      var current = s === o.status;
      return '<li class="flex items-center gap-2">' + (i ? '<span class="h-px w-4 bg-line-strong" aria-hidden="true"></span>' : '') +
        '<span class="inline-flex items-center gap-1.5 ' + (current ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-muted') + '"' + (current ? ' aria-current="step"' : '') + '>' +
        (done ? ui.icon('okCircle', 'h-4 w-4') : '<span class="h-4 w-4 rounded-full border border-line-strong"></span>') + esc(t('a.os.' + s)) + '</span></li>';
    }).join('') + '</ol>';
    var c = o.customer;
    var addr = o.delivery.method === 'courier'
      ? esc(o.delivery.district + ', ' + t('field.khoroo') + ' ' + o.delivery.khoroo + ', ' + o.delivery.address)
      : esc(t('order.pickup'));
    return '<div class="space-y-6">' +
      '<div class="flex flex-wrap items-center justify-between gap-3"><p class="text-sm text-muted tnum">' + esc(U.formatDate(o.createdAt)) + (o.sample ? ' <span class="ml-1 rounded-full bg-canvas px-2 py-0.5 text-xs">' + esc(t('a.ord.sample')) + '</span>' : '') + '</p>' + ui.orderPill(o.status) + '</div>' +
      '<section><h3 class="mb-3 text-sm font-semibold">' + esc(t('a.ord.progress')) + '</h3>' + (o.status === 'cancelled' ? ui.orderPill('cancelled') : steps) +
        '<div class="mt-4 flex flex-wrap gap-2">' +
          (next ? '<button type="button" data-next="' + next + '" class="btn btn-primary">' + esc(t('a.next.' + next)) + '</button>' : '') +
          (o.status !== 'completed' && o.status !== 'cancelled' ? '<button type="button" data-cancel-order class="btn btn-quiet text-bad hover:bg-bad-soft">' + esc(t('a.ord.cancel')) + '</button>' : '') +
        '</div></section>' +
      '<section class="grid gap-4 sm:grid-cols-2">' +
        '<div class="rounded-[20px] bg-canvas p-4"><h3 class="text-sm font-semibold">' + esc(t('a.ord.contact')) + '</h3><p class="mt-2 font-medium">' + esc(c.name) + '</p>' +
          (c.company ? '<p class="text-sm text-muted">' + esc(c.company) + '</p>' : '') +
          '<p class="mt-1 text-sm"><a class="link" href="tel:' + esc(String(c.phone).replace(/[^\d+]/g, '')) + '">' + esc(c.phone) + '</a></p>' +
          '<p class="text-sm"><a class="link" href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></p></div>' +
        '<div class="rounded-[20px] bg-canvas p-4"><h3 class="text-sm font-semibold">' + esc(t('a.ord.address')) + '</h3><p class="mt-2 text-sm">' + addr + '</p>' +
          '<h3 class="mt-3 text-sm font-semibold">' + esc(t('a.ord.col.payment')) + '</h3><p class="mt-1 text-sm">' + esc(t(PAY[o.payment] || 'pay.transfer')) + '</p>' +
          '<h3 class="mt-3 text-sm font-semibold">' + esc(t('a.ord.receipt')) + '</h3><p class="mt-1 text-sm">' + esc(o.receipt && o.receipt.type === 'org' ? t('checkout.org') + (o.receipt.regno ? ', ' + o.receipt.regno : '') : t('checkout.person')) + '</p></div>' +
      '</section>' +
      '<section><h3 class="mb-2 text-sm font-semibold">' + esc(t('a.ord.col.items')) + '</h3><table class="data-table"><tbody>' +
        o.items.map(function (it) {
          return '<tr><td><span class="font-medium">' + esc(loc(it.name)) + '</span><br><span class="text-xs text-muted tnum">' + esc(it.size + ', ' + it.dims + ', ' + loc(PK.COLORS[it.color] || { mn: it.color })) + (it.gsm ? ', ' + it.gsm + ' ' + esc(t('unit.gsm')) : '') + '</span></td>' +
            '<td class="whitespace-nowrap text-right tnum">' + U.int(it.qty) + ' × ' + U.money(it.unit) + '</td><td class="whitespace-nowrap text-right font-medium tnum">' + U.money(it.total) + '</td></tr>';
        }).join('') +
        '<tr><td colspan="2" class="text-muted">' + esc(t('cart.subtotal')) + '</td><td class="text-right tnum">' + U.money(o.subtotal) + '</td></tr>' +
        '<tr><td colspan="2" class="text-muted">' + esc(t('cart.delivery')) + '</td><td class="text-right tnum">' + (o.deliveryFee ? U.money(o.deliveryFee) : esc(t('common.free'))) + '</td></tr>' +
        '<tr><td colspan="2" class="font-semibold">' + esc(t('cart.total')) + '</td><td class="text-right font-semibold tnum">' + U.money(o.total) + '</td></tr>' +
      '</tbody></table></section>' +
      (o.note ? '<section><h3 class="text-sm font-semibold">' + esc(t('a.ord.note')) + '</h3><p class="mt-1 rounded-[20px] bg-canvas p-4 text-sm">' + esc(o.note) + '</p></section>' : '') +
      '<section><label for="o-note" class="field-label">' + esc(t('a.ord.internal')) + '</label>' +
        '<textarea id="o-note" class="field-input min-h-[6rem]" placeholder="' + esc(t('a.ord.internalPh')) + '">' + esc(o.internalNote || '') + '</textarea>' +
        '<button type="button" data-save-note class="btn btn-secondary btn-sm mt-2">' + esc(t('a.ord.saveNote')) + '</button></section>' +
    '</div>';
  }

  function openOrder(id, onChange) {
    var o = A.order(id);
    if (!o) return;
    var d = ui.drawer({ title: t('order.no', { id: o.id }), html: detailHtml(o), wide: true });
    var bind = function () {
      var cur = A.order(id);
      var next = d.el.querySelector('[data-next]');
      if (next) next.addEventListener('click', function () {
        var s = next.getAttribute('data-next');
        A.setStatus(id, s);
        d.setHtml(detailHtml(A.order(id))); bind(); onChange();
        PK.ui.toast(t('a.ord.moved', { id: id, status: t('a.os.' + s) }));
        var again = d.el.querySelector('[data-next]') || d.el.querySelector('#o-note');
        if (again) again.focus();
      });
      var cancel = d.el.querySelector('[data-cancel-order]');
      if (cancel) cancel.addEventListener('click', function () {
        ui.dialog({
          title: t('a.ord.cancelTitle', { id: id }), body: esc(t('a.ord.cancelBody')), confirm: t('a.ord.cancel'), cancel: t('a.ord.keep'), danger: true,
          onConfirm: function () {
            var before = cur.status;
            A.setStatus(id, 'cancelled');
            d.setHtml(detailHtml(A.order(id))); bind(); onChange();
            PK.ui.toast(t('a.ord.moved', { id: id, status: t('a.os.cancelled') }), { action: { label: t('common.undo'), onClick: function () { A.setStatus(id, before); d.setHtml(detailHtml(A.order(id))); bind(); onChange(); } } });
          },
        });
      });
      d.el.querySelector('[data-save-note]').addEventListener('click', function () {
        A.setNote(id, d.el.querySelector('#o-note').value.trim());
        PK.ui.toast(t('a.ord.noteSaved'));
      });
    };
    bind();
  }

  app.view('orders', function (main, r) {
    function filtered(all) {
      var q = state.q.trim().toLowerCase();
      return all.filter(function (o) {
        if (state.status !== 'all' && o.status !== state.status) return false;
        if (!q) return true;
        return (o.id + ' ' + o.customer.name + ' ' + o.customer.phone + ' ' + o.customer.email + ' ' + (o.customer.company || '')).toLowerCase().indexOf(q) !== -1;
      });
    }

    function render() {
      var all = A.orders();
      var counts = A.statusCounts(all);
      var list = filtered(all);
      var tabs = [{ id: 'all', label: t('a.all'), count: counts.all }].concat(A.STATUSES.map(function (s) { return { id: s, label: t('a.os.' + s), count: counts[s] }; }));
      main.innerHTML = app.header(t('a.nav.orders'), '<button type="button" data-export class="btn btn-secondary">' + ui.icon('download', 'h-[18px] w-[18px]') + esc(t('a.export')) + '</button>') +
        '<div class="mb-4 flex flex-col gap-3">' + app.tabs(tabs, state.status, 'data-status') + app.search('o-q', t('a.ord.searchPh'), state.q) + '</div>' +
        '<div class="panel overflow-hidden">' +
          (list.length
            ? '<div class="overflow-x-auto"><table class="data-table min-w-[820px]"><thead><tr>' +
                '<th class="pl-5">' + esc(t('a.ord.col.no')) + '</th><th>' + esc(t('a.ord.col.date')) + '</th><th>' + esc(t('a.ord.col.customer')) + '</th>' +
                '<th class="text-right">' + esc(t('a.ord.col.items')) + '</th><th class="text-right">' + esc(t('a.ord.col.total')) + '</th><th>' + esc(t('a.ord.col.payment')) + '</th><th class="pr-5">' + esc(t('a.ord.col.status')) + '</th></tr></thead><tbody>' +
                list.map(function (o) {
                  return '<tr data-id="' + esc(o.id) + '" class="cursor-pointer">' +
                    '<td class="pl-5"><button type="button" data-open class="font-semibold tnum hover:underline hover:underline-offset-4">' + esc(o.id) + '</button>' + (o.sample ? '<span class="ml-2 rounded-full bg-canvas px-2 py-0.5 text-xs text-muted">' + esc(t('a.ord.sample')) + '</span>' : '') + '</td>' +
                    '<td class="whitespace-nowrap tnum text-muted">' + esc(U.formatDate(o.createdAt)) + '</td>' +
                    '<td><span class="block font-medium">' + esc(o.customer.name) + '</span><span class="block text-xs text-muted">' + esc(o.customer.company || o.customer.email) + '</span></td>' +
                    '<td class="text-right tnum">' + o.items.length + '</td>' +
                    '<td class="whitespace-nowrap text-right font-medium tnum">' + U.money(o.total) + '</td>' +
                    '<td class="whitespace-nowrap">' + esc(t(PAY[o.payment] || 'pay.transfer')) + '</td>' +
                    '<td class="pr-5">' + ui.orderPill(o.status) + '</td></tr>';
                }).join('') + '</tbody></table></div>'
            : (all.length ? ui.empty(t('a.noMatch'), '', '<button type="button" data-clear class="btn btn-secondary mt-5">' + esc(t('a.clearFilters')) + '</button>') : ui.empty(t('a.ord.empty'), ''))) +
        '</div>';

      main.querySelectorAll('[data-status]').forEach(function (b) { b.addEventListener('click', function () { state.status = b.getAttribute('data-status'); render(); }); });
      var q = U.qs('#o-q', main);
      q.addEventListener('input', U.debounce(function () {
        state.q = q.value; render();
        var again = U.qs('#o-q', main); again.focus(); again.setSelectionRange(again.value.length, again.value.length);
      }, 200));
      var clear = U.qs('[data-clear]', main);
      if (clear) clear.addEventListener('click', function () { state.status = 'all'; state.q = ''; render(); });
      main.querySelectorAll('tr[data-id]').forEach(function (tr) {
        tr.addEventListener('click', function () { openOrder(tr.getAttribute('data-id'), function () { render(); app.refreshNav(); }); });
      });
      U.qs('[data-export]', main).addEventListener('click', function () {
        var csv = A.toCsv([
          { label: t('a.ord.col.no'), value: function (o) { return o.id; } },
          { label: t('a.ord.col.date'), value: function (o) { return o.createdAt; } },
          { label: t('a.ord.col.status'), value: function (o) { return t('a.os.' + o.status); } },
          { label: t('field.name'), value: function (o) { return o.customer.name; } },
          { label: t('field.company'), value: function (o) { return o.customer.company; } },
          { label: t('field.phone'), value: function (o) { return o.customer.phone; } },
          { label: t('field.email'), value: function (o) { return o.customer.email; } },
          { label: t('a.ord.col.items'), value: function (o) { return o.items.map(function (it) { return loc(it.name) + ' ' + it.size + ' × ' + it.qty; }).join('; '); } },
          { label: t('cart.subtotal'), value: function (o) { return o.subtotal; } },
          { label: t('cart.delivery'), value: function (o) { return o.deliveryFee; } },
          { label: t('cart.total'), value: function (o) { return o.total; } },
          { label: t('a.ord.col.payment'), value: function (o) { return t(PAY[o.payment] || 'pay.transfer'); } },
        ], filtered(A.orders()));
        A.download('orders-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
      });
    }

    render();
    var open = r.params.get('open');
    if (open) openOrder(open, function () { render(); app.refreshNav(); });
  });

  PK.adminOrders = { open: openOrder };
})();
