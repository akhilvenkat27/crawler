const Job = require('../models/Job');
const Connector = require('../models/Connector');
const providers = require('../providers');

/**
 * Fire-and-forget runner. The HTTP route returns the job id immediately;
 * the UI polls /api/jobs/:id for progress. We keep this in-process — fine
 * for a single-node deployment.
 */
async function execute(jobId) {
  const job = await Job.findById(jobId);
  if (!job) return;
  const connector = await Connector.findById(job.connector);
  if (!connector || !connector.enabled) {
    job.status = 'failed';
    job.error = 'Connector is missing or disabled.';
    job.finishedAt = new Date();
    await job.save();
    return;
  }
  const provider = providers.get(connector.provider);
  if (!provider) {
    job.status = 'failed';
    job.error = `Unknown provider: ${connector.provider}`;
    job.finishedAt = new Date();
    await job.save();
    return;
  }

  job.status = 'running';
  job.startedAt = new Date();
  await job.save();

  try {
    // Per-run options from the dashboard form override per-connector defaults.
    const mergedOptions = { ...(connector.config || {}), ...(job.options || {}) };
    const result = await provider.run({
      url: job.url,
      credentials: connector.credentials,
      config: connector.config,
      options: mergedOptions,
    });
    job.result = {
      markdown: result.markdown || '',
      title: result.title || '',
      images: result.images || [],
      meta: result.meta || {},
    };
    job.status = 'succeeded';
  } catch (e) {
    job.status = 'failed';
    job.error = e.message || String(e);
  } finally {
    job.finishedAt = new Date();
    await job.save();
  }
}

function start(jobId) {
  setImmediate(() => {
    execute(jobId).catch((e) => console.error('[jobRunner]', e));
  });
}

module.exports = { start, execute };
