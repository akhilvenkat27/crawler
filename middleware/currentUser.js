const User = require('../models/User');

/**
 * Demo-grade auth: attaches a single persistent user to the session.
 * Replace with real auth (OAuth/passkeys/etc.) before production.
 */
async function currentUser(req, res, next) {
  try {
    if (!req.session.userId) {
      const email = 'demo@local';
      let user = await User.findOne({ email });
      if (!user) user = await User.create({ email, name: 'Demo User' });
      req.session.userId = user._id.toString();
      req.user = user;
    } else {
      req.user = await User.findById(req.session.userId);
      if (!req.user) {
        req.session.userId = null;
        return next(new Error('Session user missing.'));
      }
    }
    res.locals.user = req.user;
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = currentUser;
