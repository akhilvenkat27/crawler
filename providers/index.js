const cloudflare = require('./cloudflare');

/**
 * Provider registry. Each provider exposes:
 *   key, name, description, docsUrl, credentialFields[], optionFields[],
 *   testCredentials(creds, config), run({ url, credentials, config, options })
 *
 * `run` returns: { markdown, title, images[], meta }
 */
const registry = {
  [cloudflare.key]: cloudflare,
};

function list() {
  return Object.values(registry).map((p) => ({
    key: p.key,
    name: p.name,
    description: p.description,
    docsUrl: p.docsUrl,
    iconUrl: p.iconUrl || null,
    credentialFields: p.credentialFields,
    optionFields: p.optionFields || [],
  }));
}

function get(key) {
  return registry[key] || null;
}

module.exports = { list, get };
