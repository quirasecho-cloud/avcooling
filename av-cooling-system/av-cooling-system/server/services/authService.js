const bcrypt = require('bcryptjs');
const db = require('../repositories/db');
const { sign } = require('../middleware/auth');
const audit = require('./audit');
const safe = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const err = (m, s = 400) => Object.assign(new Error(m), { status: s });
exports.safe = safe;
exports.register = ({ name, email, password, confirmPassword }) => {
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '')) throw err('Invalid name or email.');
  if (!password || password.length < 8) throw err('Password must be at least 8 characters.');
  if (password !== confirmPassword) throw err('Passwords do not match.');
  if (db.users.where(u => u.email === email.toLowerCase())[0]) throw err('Email already registered.');
  const u = db.users.insert({ name, email: email.toLowerCase(), role: 'customer', active: true, passwordHash: bcrypt.hashSync(password, 8) });
  return { token: sign(u), user: safe(u) };
};
exports.login = ({ email, password }, staffOnly) => {
  const u = db.users.where(x => x.email === (email || '').toLowerCase())[0];
  if (!u || !u.active || !bcrypt.compareSync(password || '', u.passwordHash)) throw err('Invalid email or password.', 401);
  if (staffOnly === (u.role === 'customer')) throw err('Invalid email or password.', 401);
  audit.log(u, 'LOGIN', 'auth', 'User logged in', u.id);
  return { token: sign(u), user: safe(u) };
};
exports.createStaff = (admin, { name, email, password, role }) => {
  if (!['admin','manager','ecom','cashier','inventory','technician'].includes(role)) throw err('Invalid role.');
  if (!name || !email || !password || password.length < 8) throw err('Name, email and 8+ char password required.');
  if (db.users.where(u => u.email === email.toLowerCase())[0]) throw err('Email already registered.');
  const u = db.users.insert({ name, email: email.toLowerCase(), role, active: true, passwordHash: bcrypt.hashSync(password, 8) });
  audit.log(admin, 'CREATE', 'staff', `Created ${role} ${email}`, u.id);
  return safe(u);
};
