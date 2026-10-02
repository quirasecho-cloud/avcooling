const db = require('../repositories/db');
exports.dashboard = () => ({
  totalSales: db.orders.where(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0),
  totalOrders: db.orders.all().length, pending: db.orders.where(o => o.status === 'Pending').length, completed: db.orders.where(o => o.status === 'Completed').length,
  customers: db.users.where(u => u.role === 'customer').length, products: db.products.all().length,
  lowStock: db.products.where(p => p.stock <= p.reorderLevel).length, pendingRestock: db.restockRequests.where(r => r.status === 'Pending').length,
  upcomingAppointments: db.appointments.where(a => ['Requested','Assigned'].includes(a.status)).length });
exports.report = (type, { from, to } = {}) => {
  const ok = x => (!from || x.createdAt >= from) && (!to || x.createdAt <= to + 'T23:59:59');
  const m = { sales: () => db.orders.where(o => o.status !== 'Cancelled' && ok(o)), orders: () => db.orders.where(ok), payments: () => db.payments.where(ok),
    inventory: () => db.products.all(), stock: () => db.stockMovements.where(ok), restock: () => db.restockRequests.where(ok),
    appointments: () => db.appointments.where(ok), feedback: () => db.feedback.where(ok) };
  if (!m[type]) throw Object.assign(new Error('Unknown report.'), { status: 400 }); return m[type]();
};
