const express = require('express');
const Connector = require('../models/Connector');
const Job = require('../models/Job');
const providers = require('../providers');

const router = express.Router();

router.get('/', async (req, res) => {
  const userId = req.user._id;
  const enabledConnectors = await Connector.find({ user: userId, enabled: true }).sort({
    updatedAt: -1,
  });
  const recentJobs = await Job.find({ user: userId }).sort({ createdAt: -1 }).limit(8).lean();
  res.render('dashboard', {
    page: 'dashboard',
    enabledConnectors,
    providerCatalog: providers.list(),
    recentJobs,
  });
});

router.get('/connectors', async (req, res) => {
  const userId = req.user._id;
  const items = await Connector.find({ user: userId }).sort({ createdAt: -1 }).lean();
  res.render('connectors', {
    page: 'connectors',
    connectors: items,
    catalog: providers.list(),
  });
});

router.get('/connectors/new', async (req, res) => {
  const key = req.query.provider;
  const provider = key ? providers.get(key) : null;

  if (provider) {
    const existing = await Connector.findOne({ user: req.user._id, provider: key }).sort({
      updatedAt: -1,
    });
    if (existing) return res.redirect(`/connectors/${existing._id}/edit`);
  }

  res.render('connector_form', {
    page: 'connectors',
    catalog: providers.list(),
    provider,
    connector: null,
  });
});

router.get('/connectors/:id/edit', async (req, res) => {
  const c = await Connector.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!c) return res.redirect('/connectors');
  const provider = providers.get(c.provider);
  res.render('connector_form', {
    page: 'connectors',
    catalog: providers.list(),
    provider,
    connector: c,
  });
});

router.get('/jobs', async (req, res) => {
  const items = await Job.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.render('jobs', { page: 'jobs', jobs: items });
});

router.get('/jobs/:id', async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!job) return res.redirect('/jobs');
  res.render('job_detail', { page: 'jobs', job });
});

module.exports = router;
