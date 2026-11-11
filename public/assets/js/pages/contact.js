/** Contact: validated inquiry form with confirmation, plus direct contact details. */
(function () {
  var U = PK.util, t = PK.t, loc = PK.loc, esc = U.esc, ui = PK.ui;
  var C = PK.CONFIG.contact;
  var root = U.qs('#contact-root');
  var user = PK.store.auth.current();
  ui.breadcrumb([{ label: t('contact.title') }]);

  var TOPICS = ['general', 'quote', 'custom', 'order'];
  var preTopic = TOPICS.indexOf(U.param('topic')) !== -1 ? U.param('topic') : 'general';
  var preMessage = U.param('message') || '';

  function renderForm(values) {
    values = values || {};
    root.innerHTML =
      '<form id="contact-form" class="grid gap-5 sm:grid-cols-2" novalidate>' +
        ui.field({ id: 'c-name', name: 'name', label: t('field.name'), rules: 'required', autocomplete: 'name', value: values.name || (user && user.name) }) +
        ui.field({ id: 'c-email', name: 'email', label: t('field.email'), type: 'email', rules: 'required email', autocomplete: 'email', value: values.email || (user && user.email) }) +
        ui.field({ id: 'c-phone', name: 'phone', label: t('contact.phoneOptional'), type: 'tel', rules: 'phone', autocomplete: 'tel', inputmode: 'tel', optional: true, value: values.phone || (user && user.phone) }) +
        ui.field({ id: 'c-topic', name: 'topic', label: t('field.topic'), type: 'select', options: TOPICS.map(function (k) {
          return '<option value="' + k + '"' + (k === (values.topic || preTopic) ? ' selected' : '') + '>' + esc(t('topic.' + k)) + '</option>';
        }).join('') }) +
        ui.field({ id: 'c-message', name: 'message', label: t('field.message'), type: 'textarea', rules: 'required', placeholder: t('field.messagePh'), value: values.message || preMessage, className: 'sm:col-span-2' }) +
        '<p id="c-error" class="rounded-[20px] bg-bad-soft px-4 py-3 text-sm text-bad sm:col-span-2" role="alert" hidden></p>' +
        '<div class="sm:col-span-2"><button type="submit" id="c-submit" class="btn btn-primary w-full sm:w-auto">' + esc(t('contact.send')) + '</button></div>' +
      '</form>';

    var form = U.qs('#contact-form');
    ui.liveClear(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = U.qs('#c-error');
      err.hidden = true;
      if (!ui.validate(form)) return;
      var data = {
        name: U.qs('#c-name').value.trim(), email: U.qs('#c-email').value.trim(), phone: U.qs('#c-phone').value.trim(),
        topic: U.qs('#c-topic').value, message: U.qs('#c-message').value.trim(), lang: PK.i18n.lang, page: document.referrer || '',
      };
      var btn = U.qs('#c-submit');
      btn.disabled = true;
      btn.textContent = t('contact.sending');
      PK.api.send('contact', data).then(function () {
        PK.store.inquiries.create(data);
        renderSuccess(data);
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = t('contact.send');
        err.textContent = t('err.send');
        err.hidden = false;
      });
    });
  }

  function renderSuccess(data) {
    root.innerHTML =
      '<div class="panel p-6 sm:p-8" role="status" tabindex="-1" id="c-ok">' +
        '<span class="flex h-11 w-11 items-center justify-center rounded-full bg-ok-soft text-ok">' + ui.icon('check', 'h-6 w-6') + '</span>' +
        '<h2 class="mt-4 text-xl font-semibold">' + esc(t('contact.okTitle')) + '</h2>' +
        '<p class="mt-2 leading-relaxed text-muted">' + esc(t('contact.okBody', { name: data.name, email: data.email })) + '</p>' +
        '<button type="button" id="c-again" class="btn btn-secondary mt-6">' + esc(t('contact.again')) + '</button>' +
      '</div>';
    U.qs('#c-ok').focus();
    U.qs('#c-again').addEventListener('click', function () {
      preMessage = '';
      renderForm({ name: data.name, email: data.email, phone: data.phone });
      U.qs('#c-message').focus();
    });
  }

  /* Direct contact details */
  var row = function (ic, label, value) {
    return '<li class="flex gap-4 py-4"><span class="mt-0.5 text-muted">' + ui.icon(ic) + '</span><div><p class="text-sm text-muted">' + esc(label) + '</p><div class="mt-0.5 font-medium">' + value + '</div></div></li>';
  };
  U.qs('#contact-direct').innerHTML =
    '<div class="tile p-6 sm:p-8">' +
      '<h2 class="text-lg font-semibold">' + esc(t('contact.direct')) + '</h2>' +
      '<ul class="mt-2 divide-y divide-line">' +
        row('phone', t('contact.phone'), '<a class="link" href="' + C.phoneHref + '">' + esc(C.phone) + '</a>') +
        row('mail', t('contact.email'), '<a class="link" href="mailto:' + esc(C.email) + '">' + esc(C.email) + '</a>') +
        row('pin', t('contact.address'), esc(loc(C.address)) + '<br><a class="link mt-1 inline-block text-sm" href="' + esc(C.mapUrl) + '" target="_blank" rel="noopener">' + esc(t('contact.map')) + '</a>') +
        row('clock', t('footer.hours'), '<span class="font-normal">' + loc(C.hours).map(esc).join('<br>') + '</span>') +
      '</ul>' +
      '<div class="mt-4 flex gap-2">' + PK.CONFIG.social.map(function (s) {
        return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">' + ui.icon(s.id) + esc(s.label) + '</a>';
      }).join('') + '</div>' +
    '</div>';

  renderForm();
})();
