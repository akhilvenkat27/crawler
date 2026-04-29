(function () {
  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.toggle;
      try {
        const { enabled } = await window.api.req(`/api/connectors/${id}/toggle`, { method: 'POST' });
        window.toast(`Connector ${enabled ? 'enabled' : 'disabled'}`, 'success');
        setTimeout(() => location.reload(), 400);
      } catch (e) {
        window.toast(e.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-test]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = 'Testing…';
      try {
        const r = await window.api.req(`/api/connectors/${btn.dataset.test}/test`, { method: 'POST' });
        window.toast(r.ok ? 'Credentials OK' : `Failed: ${r.message}`, r.ok ? 'success' : 'error');
        if (r.ok) setTimeout(() => location.reload(), 600);
      } catch (e) {
        window.toast(e.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  });

  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this connector? Existing jobs will keep their data.')) return;
      try {
        await window.api.req(`/api/connectors/${btn.dataset.delete}`, { method: 'DELETE' });
        document.querySelector(`[data-connector-row="${btn.dataset.delete}"]`)?.remove();
        window.toast('Connector deleted', 'success');
      } catch (e) {
        window.toast(e.message, 'error');
      }
    });
  });
})();
