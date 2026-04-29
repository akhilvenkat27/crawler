(function () {
  document.querySelectorAll('[data-delete-job]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteJob;
      if (!confirm('Delete this job? This cannot be undone.')) return;
      btn.disabled = true;
      try {
        await window.api.req(`/api/jobs/${id}`, { method: 'DELETE' });
        document.querySelector(`[data-job-row="${id}"]`)?.remove();
        window.toast('Job deleted', 'success');
      } catch (e) {
        btn.disabled = false;
        window.toast(e.message, 'error');
      }
    });
  });
})();
