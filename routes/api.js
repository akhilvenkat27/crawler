const express = require('express');
const mongoose = require('mongoose');
const Connector = require('../models/Connector');
const Job = require('../models/Job');
const providers = require('../providers');
const jobRunner = require('../services/jobRunner');

const router = express.Router();

// Reject malformed :id params before they hit Mongoose so we return JSON 400s
// instead of bubbling up a CastError to the global error handler.
router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id.' });
  next();
});

router.get('/providers', (req, res) => {
  res.json({ providers: providers.list() });
});

router.post('/connectors', async (req, res) => {
  const { provider: key, label, credentials, config } = req.body || {};
  const provider = providers.get(key);
  if (!provider) return res.status(400).json({ error: 'Unknown provider.' });

  const test = await provider.testCredentials(credentials || {}, config || {});
  if (!test.ok) return res.status(400).json({ error: test.message });

  const connector = await Connector.create({
    user: req.user._id,
    provider: key,
    label: label || provider.name,
    credentials: credentials || {},
    config: config || {},
    enabled: true,
    lastTestedAt: new Date(),
    lastTestStatus: 'ok',
    lastTestMessage: test.message,
  });
  res.json({ connector: { id: connector._id } });
});

router.put('/connectors/:id', async (req, res) => {
  const { label, credentials, config } = req.body || {};
  const c = await Connector.findOne({ _id: req.params.id, user: req.user._id });
  if (!c) return res.status(404).json({ error: 'Not found.' });
  const provider = providers.get(c.provider);
  const nextCreds = { ...c.credentials, ...(credentials || {}) };
  const test = await provider.testCredentials(nextCreds, config || c.config);
  if (!test.ok) return res.status(400).json({ error: test.message });
  c.label = label ?? c.label;
  c.credentials = nextCreds;
  c.config = config || c.config;
  c.lastTestedAt = new Date();
  c.lastTestStatus = 'ok';
  c.lastTestMessage = test.message;
  await c.save();
  res.json({ ok: true });
});

router.post('/connectors/:id/toggle', async (req, res) => {
  const c = await Connector.findOne({ _id: req.params.id, user: req.user._id });
  if (!c) return res.status(404).json({ error: 'Not found.' });
  c.enabled = !c.enabled;
  await c.save();
  res.json({ enabled: c.enabled });
});

router.post('/connectors/:id/test', async (req, res) => {
  const c = await Connector.findOne({ _id: req.params.id, user: req.user._id });
  if (!c) return res.status(404).json({ error: 'Not found.' });
  const provider = providers.get(c.provider);
  const test = await provider.testCredentials(c.credentials, c.config);
  c.lastTestedAt = new Date();
  c.lastTestStatus = test.ok ? 'ok' : 'error';
  c.lastTestMessage = test.message;
  await c.save();
  res.json(test);
});

router.delete('/connectors/:id', async (req, res) => {
  await Connector.deleteOne({ _id: req.params.id, user: req.user._id });
  res.json({ ok: true });
});

router.post('/crawl', async (req, res) => {
  const { url, connectorId, options } = req.body || {};
  if (!url || !connectorId) {
    return res.status(400).json({ error: 'url and connectorId are required.' });
  }
  let parsed;
  try {
    parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ error: 'Invalid URL — must be http(s).' });
  }
  const connector = await Connector.findOne({
    _id: connectorId,
    user: req.user._id,
    enabled: true,
  });
  if (!connector) return res.status(400).json({ error: 'Connector not found or disabled.' });

  const job = await Job.create({
    user: req.user._id,
    connector: connector._id,
    provider: connector.provider,
    url: parsed.toString(),
    options: options || {},
    status: 'queued',
  });
  jobRunner.start(job._id);
  res.json({ jobId: job._id });
});

router.get('/jobs/:id', async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!job) return res.status(404).json({ error: 'Not found.' });
  res.json({ job });
});

module.exports = router;
