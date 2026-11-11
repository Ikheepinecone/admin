/** Settings: publish the catalog file, manage sample data, restore defaults, language, and the path to a live back-end. */
(function () {
  var A = PK.admin, ui = PK.aui, app = PK.adminApp, t = PK.t, U = PK.util, esc = U.esc;

  app.view('settings', function (main) {
    function render() {
      var saved = A.productsSavedAt();
      var samples = A.sampleCounts();
      var section = function (title, body, actions) {
        return '<section class="panel p-5 sm:p-6"><h2 class="h-section">' + esc(title) + '</h2><div class="mt-2 max-w-prose leading-relaxed text-muted">' + body + '</div>' +
          (actions ? '<div class="mt-5 flex flex-wrap gap-2">' + actions + '</div>' : '') + '</section>';
      };
      main.innerHTML = app.header(t('a.nav.settings')) +
        '<div class="grid gap-4 lg:grid-cols-2">' +
          section(t('a.set.publish'),
            '<p>' + esc(t('a.set.publishBody')) + '</p><p class="mt-3 text-sm">' + esc(saved ? t('a.set.publishState', { date: U.formatDate(saved) }) : t('a.set.publishNone')) + '</p>',
            '<button type="button" data-download class="btn btn-primary">' + ui.icon('download', 'h-[18px] w-[18px]') + esc(t('a.set.download')) + '</button>' +
            '<button type="button" data-copy class="btn btn-secondary">' + ui.icon('copy', 'h-[18px] w-[18px]') + esc(t('a.set.copyCode')) + '</button>') +
          section(t('a.set.samples'),
            '<p>' + esc(samples.orders ? t('a.set.samplesBody', { orders: samples.orders, msgs: samples.msgs }) : t('a.set.samplesNone')) + '</p>',
            samples.orders
              ? '<button type="button" data-remove-samples class="btn btn-secondary">' + PK.ui.icon('trash', 'h-[18px] w-[18px]') + esc(t('a.set.removeSamples')) + '</button>'
              : '<button type="button" data-add-samples class="btn btn-secondary">' + PK.ui.icon('plus', 'h-[18px] w-[18px]') + esc(t('a.set.addSamples')) + '</button>') +
          section(t('a.set.resetProducts'), '<p>' + esc(t('a.set.resetProductsBody')) + '</p>',
            '<button type="button" data-reset-products class="btn btn-quiet text-bad hover:bg-bad-soft">' + esc(t('a.set.resetProducts')) + '</button>') +
          section(t('a.set.resetStock'), '<p>' + esc(t('a.set.resetStockBody')) + '</p>',
            '<button type="button" data-reset-stock class="btn btn-quiet text-bad hover:bg-bad-soft">' + esc(t('a.set.resetStock')) + '</button>') +
          section(t('a.set.lang'), '<p>' + esc(PK.i18n.lang === 'mn' ? 'Монгол' : 'English') + '</p>',
            '<button type="button" data-lang class="btn btn-secondary">' + PK.ui.icon('globe', 'h-[18px] w-[18px]') + esc(t('lang.other')) + '</button>') +
          section(t('a.set.live'), '<p>' + esc(t('a.set.liveBody')) + '</p>') +
        '</div>';

      U.qs('[data-download]', main).addEventListener('click', function () {
        var ok = A.download('catalog.js', A.catalogJs(), 'text/javascript;charset=utf-8');
        if (!ok) PK.ui.toast(t('a.downloadBlocked'), { tone: 'error' });
      });
      U.qs('[data-copy]', main).addEventListener('click', function () {
        ui.copyText(A.catalogJs()).then(function (ok) { PK.ui.toast(ok ? t('a.copied') : t('a.downloadBlocked'), ok ? {} : { tone: 'error' }); });
      });
      var rm = U.qs('[data-remove-samples]', main);
      if (rm) rm.addEventListener('click', function () {
        ui.dialog({
          title: t('a.set.removeSamples') + '?', body: esc(t('a.set.samplesBody', { orders: samples.orders, msgs: samples.msgs })), confirm: t('a.set.removeSamples'), danger: true,
          onConfirm: function () { A.removeSamples(); render(); app.refreshNav(); PK.ui.toast(t('a.set.samplesRemoved')); },
        });
      });
      var add = U.qs('[data-add-samples]', main);
      if (add) add.addEventListener('click', function () { A.addSamples(); render(); app.refreshNav(); PK.ui.toast(t('a.set.samplesAdded')); });
      U.qs('[data-reset-products]', main).addEventListener('click', function () {
        ui.dialog({
          title: t('a.set.resetProducts') + '?', body: esc(t('a.set.resetProductsBody')), confirm: t('a.set.resetProducts'), danger: true,
          onConfirm: function () { A.resetProducts(); render(); app.refreshNav(); PK.ui.toast(t('a.set.restored')); },
        });
      });
      U.qs('[data-reset-stock]', main).addEventListener('click', function () {
        ui.dialog({
          title: t('a.set.resetStock') + '?', body: esc(t('a.set.resetStockBody')), confirm: t('a.set.resetStock'), danger: true,
          onConfirm: function () { A.resetStock(); render(); app.refreshNav(); PK.ui.toast(t('a.set.restored')); },
        });
      });
      U.qs('[data-lang]', main).addEventListener('click', function () { PK.i18n.setLang(PK.i18n.lang === 'mn' ? 'en' : 'mn'); });
    }
    render();
  });
})();
