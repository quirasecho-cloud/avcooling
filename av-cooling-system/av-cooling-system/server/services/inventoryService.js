const db = require('../repositories/db');
const audit = require('./audit');
const err = (m, s = 400) => Object.assign(new Error(m), { status: s });
exports.list = () => db.products.all().map(p => ({ id: p.id, name: p.name, stock: p.stock, reorderLevel: p.reorderLevel, low: p.stock <= p.reorderLevel }));
exports.adjust = (user, productId, quantity, reason) => {
  const p = db.products.find(productId); const q = parseInt(quantity, 10);
  if (!p || !q || !reason) throw err('Product, non-zero quantity and reason are required.');
  if (p.stock + q < 0) throw err('Stock cannot go negative.');
  db.products.update(p.id, { stock: p.stock + q });
  const m = db.stockMovements.insert({ productId: p.id, type: 'ADJUSTMENT', quantity: q, reference: reason, userId: user.id });
  audit.log(user, 'ADJUST', 'inventory', `${p.name} ${q}`, p.id); return m;
};
exports.createRestock = (user, { productId, quantity }) => {
  if (!db.products.find(productId) || !(+quantity > 0)) throw err('Invalid restock request.');
  const r = db.restockRequests.insert({ productId: +productId, quantity: +quantity, requestedBy: user.id, status: 'Pending' });
  audit.notifyRole('manager', 'New restock request'); return r;
};
exports.decide = (user, id, approve) => {
  const r = db.restockRequests.find(id); if (!r || r.status !== 'Pending') throw err('Request not pending.');
  db.restockRequests.update(id, { status: approve ? 'Approved' : 'Rejected' }); // stock NOT increased here
  audit.log(user, approve ? 'APPROVE' : 'REJECT', 'restock', 'Restock #' + id, id); return r;
};
exports.receive = (user, id) => {
  const r = db.restockRequests.find(id); if (!r || r.status !== 'Approved') throw err('Only approved requests can be received.');
  const p = db.products.find(r.productId); db.products.update(p.id, { stock: p.stock + r.quantity });
  db.stockMovements.insert({ productId: p.id, type: 'RESTOCK_RECEIVED', quantity: r.quantity, reference: 'Restock #' + id, userId: user.id });
  db.restockRequests.update(id, { status: 'Received' }); audit.log(user, 'RECEIVE', 'inventory', `${p.name} +${r.quantity}`, id); return r;
};
