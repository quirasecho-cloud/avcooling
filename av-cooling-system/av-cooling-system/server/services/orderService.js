const db = require('../repositories/db');
const audit = require('./audit');
const { finalPrice } = require('./catalogService');
const err = (m, s = 400) => Object.assign(new Error(m), { status: s });
const FLOW = { Pending:['Confirmed','Cancelled'], Confirmed:['Processing','Cancelled'], Processing:['Ready for Pickup','Out for Delivery','Cancelled'], 'Ready for Pickup':['Completed'], 'Out for Delivery':['Completed'], Completed:[], Cancelled:[] };

// Server recomputes everything; client sends only productId + quantity.
function priceItems(items) {
  if (!Array.isArray(items) || !items.length) throw err('Cart is empty.');
  return items.map(i => {
    const p = db.products.find(i.productId); const q = parseInt(i.quantity, 10);
    if (!p || !p.active) throw err('Product unavailable.');
    if (!(q > 0)) throw err('Invalid quantity.');
    if (p.stock < q) throw err(`Insufficient stock for ${p.name}.`);
    const unit = finalPrice(p);
    return { productId: p.id, name: p.name, quantity: q, listPrice: p.price, discount: p.discount, unitPrice: unit, lineTotal: +(unit * q).toFixed(2) };
  });
}
function deduct(items, ref, user) {
  items.forEach(i => { const p = db.products.find(i.productId); db.products.update(p.id, { stock: p.stock - i.quantity });
    db.stockMovements.insert({ productId: p.id, type: 'SALE', quantity: -i.quantity, reference: ref, userId: user.id }); });
}
function restore(o, user) {
  o.items.forEach(i => { const p = db.products.find(i.productId); db.products.update(p.id, { stock: p.stock + i.quantity });
    db.stockMovements.insert({ productId: p.id, type: 'RETURN', quantity: i.quantity, reference: o.orderNo, userId: user.id }); });
}
exports.checkout = (user, body) => {
  const items = priceItems(body.items);
  const { fulfillment, contactNumber, address, notes, installationDate } = body;
  if (!['Delivery','Pickup'].includes(fulfillment)) throw err('Choose delivery or pickup.');
  if (!contactNumber) throw err('Contact number required.');
  if (fulfillment === 'Delivery' && !address) throw err('Delivery address required.');
  if (body.paymentMethod !== 'COD') throw err('Payment method not available.');
  const subtotal = +items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2);
  const order = db.orders.insert({ orderNo: 'AV-' + Date.now().toString().slice(-8), customerId: user.id, channel: 'online', items, subtotal, total: subtotal,
    paymentMethod: 'COD', paymentStatus: 'Unpaid', status: 'Pending', fulfillment, contactNumber, address, notes, installationDate, technicianId: null });
  db.payments.insert({ orderId: order.id, method: 'COD', amount: subtotal, status: 'Unpaid' });
  deduct(items, order.orderNo, user); // held on order; restored if cancelled
  audit.notify(user.id, `Order ${order.orderNo} placed.`); audit.notifyRole('ecom', `New order ${order.orderNo}`);
  return order;
};
exports.listFor = user => user.role === 'customer' ? db.orders.where(o => o.customerId === user.id)
  : user.role === 'technician' ? db.orders.where(o => o.technicianId === user.id) : db.orders.all();
exports.get = (user, id) => { const o = db.orders.find(id);
  const ok = o && (user.role === 'customer' ? o.customerId === user.id : user.role === 'technician' ? o.technicianId === user.id : true);
  if (!ok) throw err('Order not found.', 404); return o; };
exports.updateStatus = (user, id, status) => {
  const o = db.orders.find(id); if (!o) throw err('Order not found.', 404);
  if (!(FLOW[o.status] || []).includes(status)) throw err(`Cannot change ${o.status} to ${status}.`);
  if (status === 'Cancelled') restore(o, user);
  if (status === 'Completed' && o.paymentMethod === 'COD') { o.paymentStatus = 'Paid'; db.payments.where(p => p.orderId === o.id).forEach(p => { p.status = 'Paid'; }); }
  db.orders.update(id, { status });
  audit.log(user, 'STATUS', 'orders', `${o.orderNo} -> ${status}`, o.id); if (o.customerId) audit.notify(o.customerId, `Order ${o.orderNo} is now ${status}.`); return o;
};
exports.cancelOwn = (user, id) => { const o = exports.get(user, id);
  if (!['Pending','Confirmed'].includes(o.status)) throw err('Order can no longer be cancelled.'); return exports.updateStatus(user, id, 'Cancelled'); };
exports.techUpdate = (user, id, status) => { const o = exports.get(user, id);
  if (!['Out for Delivery','Completed'].includes(status)) throw err('Not allowed.', 403); return exports.updateStatus(user, id, status); };
exports.posSale = (user, body) => {
  const items = priceItems(body.items);
  if (!['Cash','Card','GCash'].includes(body.paymentMethod)) throw err('Select a payment method.');
  const subtotal = +items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2);
  const extra = Math.min(Math.max(+body.approvedDiscount || 0, 0), subtotal * 0.1); // capped
  const order = db.orders.insert({ orderNo: 'POS-' + Date.now().toString().slice(-8), channel: 'pos', cashierId: user.id, items, subtotal, discountExtra: extra, total: +(subtotal - extra).toFixed(2), paymentMethod: body.paymentMethod, paymentStatus: 'Paid', status: 'Completed' });
  db.payments.insert({ orderId: order.id, method: body.paymentMethod, amount: order.total, status: 'Paid' });
  deduct(items, order.orderNo, user); audit.log(user, 'POS_SALE', 'pos', order.orderNo, order.id); return order;
};
exports.assignDelivery = (user, id, technicianId) => {
  const t = db.users.find(technicianId); if (!t || t.role !== 'technician') throw err('Invalid technician.');
  const o = db.orders.update(id, { technicianId: t.id }); if (!o) throw err('Order not found.', 404);
  audit.log(user, 'ASSIGN', 'orders', `${o.orderNo} -> ${t.name}`, o.id); audit.notify(t.id, `Delivery ${o.orderNo} assigned.`); return o;
};
