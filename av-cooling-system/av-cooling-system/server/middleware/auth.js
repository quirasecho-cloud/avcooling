const jwt = require('jsonwebtoken');
const perms = require('../config/permissions');
const db = require('../repositories/db');
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const sign = u => jwt.sign({ id: u.id }, SECRET, { expiresIn: '8h' });
function authenticate(req, res, next) {
  try {
    const t = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET);
    const user = db.users.find(t.id);
    if (!user || !user.active) throw new Error();
    req.user = user; next();
  } catch { res.status(401).json({ message: 'Please log in.' }); }
}
const can = (user, p) => (perms[user.role] || []).includes(p);
const requirePermission = (...ps) => (req, res, next) =>
  ps.some(p => can(req.user, p)) ? next() : res.status(403).json({ message: 'Unauthorized access.' });
const requireRole = (...rs) => (req, res, next) =>
  rs.includes(req.user.role) ? next() : res.status(403).json({ message: 'Unauthorized access.' });
module.exports = { sign, authenticate, requirePermission, requireRole, can };
