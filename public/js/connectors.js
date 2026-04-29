(function () {
  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.toggle;
      try {
        const { enabled } = await window.api.req(`/api/connectors/${id}/toggle`, { method: 'POST' });
        const label = btn.querySelector('[data-toggle-label]');
        label.textContent = enabled ? 'enabled' : 'disabled';
        btn.className = `inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full ${enabled ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-600'}`;
        btn.querySelector('span.w-1\\.5').className = `w-1.5 h-1.5 rounded-full ${enabled ? 'bg-brand-500' : 'bg-ink-400'}`;
        window.toast(`Connector ${enabled ? 'enabled' : 'disabled'}`, 'success');
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
