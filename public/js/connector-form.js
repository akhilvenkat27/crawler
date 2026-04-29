(function () {
  const form = document.getElementById('connector-form');
  if (!form) return;
  const msg = document.getElementById('form-message');
  const id = form.dataset.id;
  const provider = form.dataset.provider;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const label = form.querySelector('[name="label"]').value.trim();
    const credentials = {};
    form.querySelectorAll('[data-credential]').forEach((el) => {
      const v = el.value.trim();
      // Empty password field on edit means "keep current"; empty text field
      // means "clear". For new connectors, always send what's typed.
      if (el.type === 'password' && id && !v) return;
      credentials[el.dataset.credential] = v;
    });
    const config = {};
    form.querySelectorAll('[data-config]').forEach((el) => {
      if (el.type === 'checkbox') config[el.dataset.config] = el.checked;
      else if (el.type === 'number') config[el.dataset.config] = el.value === '' ? null : Number(el.value);
      else config[el.dataset.config] = el.value;
    });

    msg.textContent = id ? 'Saving…' : 'Testing credentials…';
    msg.className = 'text-xs text-ink-500';

    try {
      if (id) {
        await window.api.req(`/api/connectors/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ label, credentials, config }),
        });
      } else {
        await window.api.req('/api/connectors', {
          method: 'POST',
          body: JSON.stringify({ provider, label, credentials, config }),
        });
      }
      msg.textContent = 'Saved.';
      msg.className = 'text-xs text-brand-700';
      window.toast('Connector saved', 'success');
      setTimeout(() => (location.href = '/connectors'), 500);
    } catch (e) {
      msg.textContent = e.message;
      msg.className = 'text-xs text-red-600';
      window.toast(e.message, 'error');
    }
  });
})();
