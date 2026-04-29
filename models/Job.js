const { Schema, model } = require('mongoose');

const JobSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    connector: { type: Schema.Types.ObjectId, ref: 'Connector', required: true },
    provider: { type: String, required: true },
    url: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'succeeded', 'failed'],
      default: 'queued',
      index: true,
    },
    options: { type: Schema.Types.Mixed, default: {} },
    result: {
      markdown: { type: String, default: '' },
      title: { type: String, default: '' },
      images: { type: [String], default: [] },
      meta: { type: Schema.Types.Mixed, default: {} },
    },
    error: { type: String, default: '' },
    startedAt: { type: Date },
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = model('Job', JobSchema);
