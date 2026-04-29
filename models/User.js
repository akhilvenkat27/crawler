const { Schema, model } = require('mongoose');

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = model('User', UserSchema);
