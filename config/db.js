const mongoose = require('mongoose');

async function connect(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('[db] connected');
}

module.exports = { connect, mongoose };
