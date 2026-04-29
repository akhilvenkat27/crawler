const express = require('express');
const mongoose = require('mongoose');
const Connector = require('../models/Connector');
const Job = require('../models/Job');
const providers = require('../providers');

const router = express.Router();

const isValidId = (id) => mongoose.isValidObjectId(id);

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
  if (!isValidId(req.params.id)) return res.redirect('/connectors');
  const c = await Connector.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!c) return res.redirect('/connectors');
  const provider = providers.get(c.provider);
  if (!provider) {
    // Provider was removed from the registry — fall back to the picker so the
    // user can delete the orphan from the connectors list.
    return res.redirect('/connectors');
  }
  res.render('connector_form', {
    page: 'connectors',
    catalog: providers.list(),
    provider,
    connector: c,
  });
});

router.get('/jobs', async (req, res) => {
  const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
  const sizeRaw = parseInt(req.query.size, 10) || 20;
  const size = Math.min(100, Math.max(5, sizeRaw));

  const q = (req.query.q || '').trim();
  const allowedStatuses = ['queued', 'running', 'succeeded', 'failed'];
  const status = allowedStatuses.includes(req.query.status) ? req.query.status : '';
  const from = req.query.from || '';
  const to = req.query.to || '';

  const filter = { user: req.user._id };
  if (status) filter.status = status;
  if (q) {
    // case-insensitive substring on URL; escape regex special chars
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.url = { $regex: safe, $options: 'i' };
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) {
      const d = new Date(from);
      if (!isNaN(d)) filter.createdAt.$gte = d;
    }
    if (to) {
      // Inclusive of the entire "to" day
      const d = new Date(to);
      if (!isNaN(d)) {
        d.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = d;
      }
    }
    if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
  }

  const [items, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * size)
      .limit(size)
      .lean(),
    Job.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / size));
  res.render('jobs', {
    page: 'jobs',
    jobs: items,
    pagination: { page: pageNum, size, total, totalPages },
    filters: { q, status, from, to },
  });
});

router.get('/jobs/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.redirect('/jobs');
  const job = await Job.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!job) return res.redirect('/jobs');
  res.render('job_detail', { page: 'jobs', job });
});

module.exports = router;
