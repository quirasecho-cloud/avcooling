const db = require('../repositories/db');
exports.log = (user, action, module, description, recordId) =>
  db.auditLogs.insert({ userId: user && user.id, userName: user && user.name, action, module, description, recordId });
exports.notify = (userId, message) => db.notifications.insert({ userId, message, read: false });
exports.notifyRole = (role, message) => db.users.where(u => u.role === role).forEach(u => exports.notify(u.id, message));
