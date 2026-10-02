// Controllers (HTTP layer): parse request, call a service, send response.
const auth = require('../services/authService'), cat = require('../services/catalogService'), ord = require('../services/orderService');
const svc = require('../services/serviceBookingService'), inv = require('../services/inventoryService'), fb = require('../services/feedbackService');
const rep = require('../services/reportService'), db = require('../repositories/db');
const w = fn => (req, res, next) => { try { res.json(fn(req)); } catch (e) { next(e); } };
module.exports = {
  register: w(r => auth.register(r.body)), login: w(r => auth.login(r.body, false)), staffLogin: w(r => auth.login(r.body, true)), me: w(r => auth.safe(r.user)),
  createStaff: w(r => auth.createStaff(r.user, r.body)), listStaff: w(() => db.users.where(u => u.role !== 'customer').map(auth.safe)),
  customers: w(() => db.users.where(u => u.role === 'customer').map(auth.safe)), technicians: w(() => db.users.where(u => u.role === 'technician').map(auth.safe)),
  products: w(r => cat.listProducts(r.query)),
  product: w(r => { const p = db.products.find(r.params.id); if (!p || !p.active) throw Object.assign(new Error('Not found'), { status: 404 }); return { ...p, finalPrice: cat.finalPrice(p) }; }),
  saveProduct: w(r => cat.saveProduct(r.user, r.params.id, r.body)), delProduct: w(r => cat.deactivateProduct(r.user, r.params.id)),
  services: w(() => cat.listServices()), saveService: w(r => cat.saveService(r.user, r.params.id, r.body)),
  checkout: w(r => ord.checkout(r.user, r.body)), orders: w(r => ord.listFor(r.user)), order: w(r => ord.get(r.user, r.params.id)),
  orderStatus: w(r => ord.updateStatus(r.user, r.params.id, r.body.status)), cancelOrder: w(r => ord.cancelOwn(r.user, r.params.id)),
  techOrderStatus: w(r => ord.techUpdate(r.user, r.params.id, r.body.status)), assignDelivery: w(r => ord.assignDelivery(r.user, r.params.id, r.body.technicianId)),
  pos: w(r => ord.posSale(r.user, r.body)),
  book: w(r => svc.book(r.user, r.body)),
  availability: w(r => ({ available: svc.isAvailable(db.services.find(r.query.serviceId) || { durationMin: 60 }, r.query.date, r.query.time) })),
  appointments: w(r => svc.listFor(r.user)), assignTech: w(r => svc.assign(r.user, r.params.id, r.body.technicianId)),
  reschedule: w(r => svc.reschedule(r.user, r.params.id, r.body.date, r.body.time)), apptStatus: w(r => svc.setStatus(r.user, r.params.id, r.body.status, r.body.notes)),
  inventory: w(() => inv.list()), movements: w(() => db.stockMovements.all()), adjust: w(r => inv.adjust(r.user, r.body.productId, r.body.quantity, r.body.reason)),
  restocks: w(() => db.restockRequests.all()), createRestock: w(r => inv.createRestock(r.user, r.body)),
  approveRestock: w(r => inv.decide(r.user, r.params.id, true)), rejectRestock: w(r => inv.decide(r.user, r.params.id, false)), receiveRestock: w(r => inv.receive(r.user, r.params.id)),
  submitFeedback: w(r => fb.submit(r.user, r.body)), feedbackList: w(() => db.feedback.all()), sentiment: w(() => fb.summary()),
  dashboard: w(() => rep.dashboard()), report: w(r => rep.report(r.params.type, r.query)), audit: w(() => [...db.auditLogs.all()].reverse()),
  notifications: w(r => db.notifications.where(n => n.userId === r.user.id)),
  settings: w(() => db.data.settings),
  saveSettings: w(r => Object.assign(db.data.settings, { gcashEnabled: !!r.body.gcashEnabled, bankTransferEnabled: !!r.body.bankTransferEnabled }))
};
