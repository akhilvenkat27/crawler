# Crawler

Single-node Express + EJS + Tailwind dashboard for running URL crawls through pluggable providers.

## Stack

- Node.js (Express, EJS server-rendered views)
- Tailwind via CDN (premium light, shadcn-style)
- MongoDB via Mongoose (sessions, users, connectors, jobs)
- Pluggable provider registry (`providers/`). First provider: **Cloudflare Browser Rendering**.

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000

## Provider model

A connector is `{ user, provider, credentials, config, enabled }`. Providers live in `providers/` and expose:

```js
{
  key, name, description, docsUrl,
  credentialFields: [...],         // rendered into the form
  optionFields:    [...],          // optional defaults
  testCredentials(creds, config),  // → { ok, message }
  run({ url, credentials, config, options }) // → { markdown, title, images, meta }
}
```

To add a provider, drop a file in `providers/<name>.js` and register it in `providers/index.js`.

## Pages

- `/` — dashboard with crawl form + live polling (1s)
- `/jobs`, `/jobs/:id` — history + per-job detail (markdown + copy/download + image refs)
- `/connectors`, `/connectors/new`, `/connectors/:id/edit` — manage providers
