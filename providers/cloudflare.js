const axios = require('axios');

/**
 * Cloudflare Browser Rendering REST API adapter.
 * Uses /markdown for primary output and /scrape (best-effort) for image refs.
 *
 * Required credentials:
 *   - accountId: Cloudflare account ID
 *   - apiToken : API token with "Browser Rendering" permission
 */

const BASE = 'https://api.cloudflare.com/client/v4';

async function callMarkdown({ accountId, apiToken, url, options }) {
  const endpoint = `${BASE}/accounts/${accountId}/browser-rendering/markdown`;
  const body = { url };
  if (options?.waitForTimeout) body.waitForTimeout = Number(options.waitForTimeout);
  if (options?.userAgent) body.userAgent = options.userAgent;

  const res = await axios.post(endpoint, body, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 90_000,
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    const msg =
      res.data?.errors?.map((e) => e.message).join('; ') ||
      res.data?.error ||
      `HTTP ${res.status}`;
    throw new Error(`Cloudflare markdown failed: ${msg}`);
  }
  // Cloudflare wraps responses as { success, result, errors }
  const markdown =
    typeof res.data?.result === 'string' ? res.data.result : res.data?.result?.markdown || '';
  return markdown;
}

/**
 * Pull image URLs out of the markdown itself. Catches both inline images
 * `![alt](url)` and reference-style nested inside links `[![alt](url)](href)`.
 * Faster and more accurate than a second Browser Rendering call, since the
 * markdown is exactly what we surface in the UI.
 */
function extractImagesFromMarkdown(markdown, baseUrl) {
  if (!markdown) return [];
  const re = /!\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;
  const out = [];
  let m;
  while ((m = re.exec(markdown)) !== null) {
    let src = m[1].trim();
    if (!src) continue;
    if (src.startsWith('//')) {
      src = 'https:' + src;
    } else if (src.startsWith('/') && baseUrl) {
      try {
        src = new URL(src, baseUrl).toString();
      } catch {}
    }
    out.push(src);
  }
  return Array.from(new Set(out)).slice(0, 100);
}

module.exports = {
  key: 'cloudflare',
  name: 'Cloudflare Browser Rendering',
  description:
    'Render and extract content from any URL using Cloudflare’s headless browser fleet. Returns clean markdown plus referenced images.',
  docsUrl: 'https://developers.cloudflare.com/browser-rendering/',
  iconUrl: '/icons/cloudflare.png',
  credentialFields: [
    {
      name: 'accountId',
      label: 'Account ID',
      type: 'text',
      required: true,
      placeholder: 'a1b2c3d4e5f6...',
      help: 'Found on the right sidebar of the Cloudflare dashboard.',
    },
    {
      name: 'apiToken',
      label: 'API Token',
      type: 'password',
      required: true,
      placeholder: 'cf-token-...',
      help: 'Create a token with the "Browser Rendering — Edit" permission.',
    },
  ],
  optionFields: [
    {
      name: 'includeImages',
      label: 'Extract image references',
      type: 'boolean',
      default: true,
    },
    {
      name: 'waitForTimeout',
      label: 'Wait (ms) before snapshot',
      type: 'number',
      default: 0,
      min: 0,
      max: 30000,
    },
  ],

  async testCredentials(creds) {
    if (!creds?.accountId || !creds?.apiToken) {
      return { ok: false, message: 'Account ID and API Token are required.' };
    }
    try {
      await callMarkdown({
        accountId: creds.accountId,
        apiToken: creds.apiToken,
        url: 'https://example.com',
        options: {},
      });
      return { ok: true, message: 'Credentials verified against example.com.' };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  },

  async run({ url, credentials, options = {} }) {
    const markdown = await callMarkdown({
      accountId: credentials.accountId,
      apiToken: credentials.apiToken,
      url,
      options,
    });

    const images =
      options.includeImages !== false ? extractImagesFromMarkdown(markdown, url) : [];

    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return {
      markdown,
      title: titleMatch ? titleMatch[1].trim() : '',
      images,
      meta: { provider: 'cloudflare', sourceUrl: url },
    };
  },
};
