(function () {
  const section = document.querySelector('[data-job-id]');
  if (!section) return;
  const jobId = section.dataset.jobId;
  let status = section.dataset.jobStatus;
  const md = document.getElementById('job-markdown');
  const copyBtn = document.getElementById('copy-btn');
  const dlBtn = document.getElementById('download-btn');

  copyBtn?.addEventListener('click', () => md.textContent && window.copyText(md.textContent));
  dlBtn?.addEventListener('click', () => {
    if (!md.textContent) return;
    window.downloadText(`job-${jobId}.md`, md.textContent);
  });

  if (status === 'queued' || status === 'running') {
    const timer = setInterval(async () => {
      try {
        const { job } = await window.api.req('/api/jobs/' + jobId);
        if (job.status === 'succeeded' || job.status === 'failed') {
          clearInterval(timer);
          location.reload();
        }
      } catch (e) {
        clearInterval(timer);
      }
    }, 1500);
  }
})();
