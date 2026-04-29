(function () {
  const section = document.querySelector('[data-job-id]');
  if (!section) return;
  const jobId = section.dataset.jobId;
  const status = section.dataset.jobStatus;
  const md = document.getElementById('job-markdown');
  const rendered = document.getElementById('job-rendered');
  const copyBtn = document.getElementById('copy-btn');
  const dlBtn = document.getElementById('download-btn');

  function paint() {
    if (rendered) rendered.innerHTML = window.renderMarkdown(md.textContent);
    rendered?.querySelectorAll('a[href]').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }
  paint();

  document.querySelectorAll('.view-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      document.querySelectorAll('.view-tab').forEach((b) => {
        const active = b.dataset.view === view;
        b.className = `view-tab text-xs px-2.5 py-1 rounded ${active ? 'bg-ink-900 text-white' : 'text-ink-600'}`;
      });
      if (view === 'raw') {
        md.classList.remove('hidden');
        rendered.classList.add('hidden');
      } else {
        md.classList.add('hidden');
        rendered.classList.remove('hidden');
      }
    });
  });

  copyBtn?.addEventListener('click', () => md.textContent && window.copyText(md.textContent));
  dlBtn?.addEventListener('click', () => {
    if (!md.textContent) return;
    window.downloadText(`job-${jobId}.md`, md.textContent);
  });
  document.getElementById('delete-btn')?.addEventListener('click', async () => {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    try {
      await window.api.req(`/api/jobs/${jobId}`, { method: 'DELETE' });
      window.toast('Job deleted', 'success');
      setTimeout(() => (location.href = '/jobs'), 400);
    } catch (e) {
      window.toast(e.message, 'error');
    }
  });

  if (status === 'queued' || status === 'running') {
    const timer = setInterval(async () => {
      try {
        const { job } = await window.api.req('/api/jobs/' + jobId);
        if (job.status === 'succeeded' || job.status === 'failed') {
          clearInterval(timer);
          location.reload();
        }
      } catch {
        clearInterval(timer);
      }
    }, 1500);
  }
})();
