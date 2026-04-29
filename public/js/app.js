window.api = {
  async req(path, opts = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },
};

window.toast = function (message, kind = 'info') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  const tones = {
    info: 'bg-ink-900 text-white',
    success: 'bg-brand-600 text-white',
    error: 'bg-red-600 text-white',
  };
  el.className = `pointer-events-auto px-3.5 py-2 rounded-lg text-sm shadow-soft ${tones[kind] || tones.info}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .4s ease, transform .4s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 400);
  }, 2600);
};

window.copyText = async function (text) {
  try {
    await navigator.clipboard.writeText(text);
    window.toast('Copied to clipboard', 'success');
  } catch {
    window.toast('Copy failed', 'error');
  }
};

window.downloadText = function (filename, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
