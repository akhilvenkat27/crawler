const { Schema, model } = require('mongoose');

/**
 * Generic per-user connector record. `provider` is the registry key
 * (e.g. "cloudflare"). `credentials` is provider-specific and validated
 * by the provider adapter, not the schema.
 */
const ConnectorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, required: true, index: true },
    label: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    credentials: { type: Schema.Types.Mixed, default: {} },
    config: { type: Schema.Types.Mixed, default: {} },
    lastTestedAt: { type: Date },
    lastTestStatus: { type: String, enum: ['ok', 'error', 'untested'], default: 'untested' },
    lastTestMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

ConnectorSchema.index({ user: 1, provider: 1 }, { unique: false });

module.exports = model('Connector', ConnectorSchema);
