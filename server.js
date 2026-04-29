require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');

const db = require('./config/db');
const currentUser = require('./middleware/currentUser');
const pages = require('./routes/pages');
const api = require('./routes/api');

const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crawler';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';

async function main() {
  await db.connect(MONGODB_URI);

  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: MONGODB_URI }),
      cookie: { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 },
    })
  );
  app.use(currentUser);

  app.use('/api', api);
  app.use('/', pages);

  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).render('error', { page: '', message: err.message || 'Server error' });
  });

  app.listen(PORT, () => console.log(`[crawler] listening on http://localhost:${PORT}`));
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
