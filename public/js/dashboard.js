(function () {
  const form = document.getElementById('crawl-form');
  if (!form) return;
  const submitBtn = document.getElementById('submit-btn');
  const panel = document.getElementById('job-panel');
  const urlEl = document.getElementById('job-url');
  const pill = document.getElementById('job-status-pill');
  const dot = document.getElementById('job-status-dot');
  const statusText = document.getElementById('job-status-text');
  const empty = document.getElementById('job-empty');
  const md = document.getElementById('job-markdown');
  const rendered = document.getElementById('job-rendered');
  let viewMode = 'rendered';
  const imgs = document.getElementById('job-images');
  const meta = document.getElementById('job-meta');
  const copyBtn = document.getElementById('copy-btn');
  const dlBtn = document.getElementById('download-btn');

  let pollTimer = null;
  let currentMarkdown = '';
  let currentUrl = '';

  function setStatus(status) {
    const tones = {
      queued: ['bg-ink-100 text-ink-700', 'bg-ink-400'],
      running: ['bg-amber-50 text-amber-700', 'bg-amber-500 animate-pulse'],
      succeeded: ['bg-brand-50 text-brand-700', 'bg-brand-500'],
      failed: ['bg-red-50 text-red-700', 'bg-red-500'],
    };
    const [pillCls, dotCls] = tones[status] || tones.queued;
    pill.className = 'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ' + pillCls;
    dot.className = 'w-1.5 h-1.5 rounded-full ' + dotCls;
    statusText.textContent = status;
  }

  function applyView() {
    const hasContent = !!md.textContent;
    if (!hasContent) {
      md.classList.add('hidden');
      rendered.classList.add('hidden');
      return;
    }
    empty.classList.add('hidden');
    if (viewMode === 'raw') {
      md.classList.remove('hidden');
      rendered.classList.add('hidden');
    } else {
      rendered.innerHTML = window.renderMarkdown(md.textContent);
      rendered.querySelectorAll('a[href]').forEach((a) => {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      });
      rendered.classList.remove('hidden');
      md.classList.add('hidden');
    }
  }

  function renderJob(job) {
    setStatus(job.status);
    if (job.result?.markdown) {
      currentMarkdown = job.result.markdown;
      md.textContent = job.result.markdown;
      md.classList.remove('text-red-600');
    }
    if (job.status === 'failed') {
      md.textContent = job.error || 'Unknown error.';
      md.classList.add('text-red-600');
    }
    applyView();
    imgs.innerHTML = '';
    (job.result?.images || []).forEach((src) => {
      const a = document.createElement('a');
      a.href = src;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'block truncate text-brand-700 hover:underline';
      a.textContent = src;
      imgs.appendChild(a);
    });
    if (!job.result?.images?.length) {
      imgs.innerHTML = '<div class="text-ink-400">No images extracted.</div>';
    }
    meta.innerHTML = `
      <div><span class="text-ink-400">Provider:</span> ${job.provider}</div>
      ${job.startedAt ? `<div><span class="text-ink-400">Started:</span> ${new Date(job.startedAt).toLocaleTimeString()}</div>` : ''}
      ${job.finishedAt ? `<div><span class="text-ink-400">Finished:</span> ${new Date(job.finishedAt).toLocaleTimeString()}</div>` : ''}
    `;
  }

  async function poll(jobId) {
    try {
      const { job } = await window.api.req('/api/jobs/' + jobId);
      renderJob(job);
      if (job.status === 'succeeded' || job.status === 'failed') {
        clearInterval(pollTimer);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Run crawl';
      }
    } catch (e) {
      clearInterval(pollTimer);
      window.toast(e.message, 'error');
      submitBtn.disabled = false;
    }
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const url = document.getElementById('url').value.trim();
    const connectorId = document.getElementById('connectorId').value;
    const includeImages = document.getElementById('includeImages').checked;
    const waitForTimeout = Number(document.getElementById('waitForTimeout').value || 0);
    if (!url || !connectorId) return;
    currentUrl = url;
    panel.classList.remove('hidden');
    urlEl.textContent = url;
    md.classList.add('hidden');
    md.textContent = '';
    md.classList.remove('text-red-600');
    empty.classList.remove('hidden');
    empty.textContent = 'Submitting…';
    setStatus('queued');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Running…';
    try {
      const { jobId } = await window.api.req('/api/crawl', {
        method: 'POST',
        body: JSON.stringify({ url, connectorId, options: { includeImages, waitForTimeout } }),
      });
      empty.textContent = 'Waiting for output…';
      clearInterval(pollTimer);
      pollTimer = setInterval(() => poll(jobId), 1000);
      poll(jobId);
    } catch (e) {
      window.toast(e.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Run crawl';
    }
  });

  document.querySelectorAll('.view-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      viewMode = btn.dataset.view;
      document.querySelectorAll('.view-tab').forEach((b) => {
        const active = b.dataset.view === viewMode;
        b.className = `view-tab text-xs px-2.5 py-1 rounded ${active ? 'bg-ink-900 text-white' : 'text-ink-600'}`;
      });
      applyView();
    });
  });

  copyBtn?.addEventListener('click', () => currentMarkdown && window.copyText(currentMarkdown));
  dlBtn?.addEventListener('click', () => {
    if (!currentMarkdown) return;
    const safe = (currentUrl || 'crawl').replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
    window.downloadText(safe + '.md', currentMarkdown);
  });
})();
