const r = require('express').Router();
const c = require('../controllers/controllers');
const { authenticate: A, requirePermission: P, requireRole: R } = require('../middleware/auth');
// public
r.post('/auth/register', c.register); r.post('/auth/login', c.login); r.post('/staff/login', c.staffLogin);
r.get('/products', c.products); r.get('/products/:id', c.product); r.get('/services', c.services); r.get('/availability', c.availability);
// any logged-in user (services enforce ownership / role scoping)
r.get('/me', A, c.me); r.get('/orders', A, c.orders); r.get('/orders/:id', A, c.order);
r.get('/appointments', A, c.appointments); r.post('/appointments/:id/status', A, c.apptStatus); r.get('/notifications', A, c.notifications);
// customer only
r.post('/checkout', A, R('customer'), c.checkout); r.post('/bookings', A, R('customer'), c.book);
r.post('/feedback', A, R('customer'), c.submitFeedback); r.post('/orders/:id/cancel', A, R('customer'), c.cancelOrder);
// technician only
r.post('/orders/:id/tech-status', A, R('technician'), c.techOrderStatus);
// staff (permission-checked)
r.put('/orders/:id/status', A, P('update_orders'), c.orderStatus); r.post('/orders/:id/assign', A, P('assign_technicians'), c.assignDelivery);
r.post('/pos/sale', A, P('access_pos'), c.pos);
r.post('/appointments/:id/assign', A, P('assign_technicians'), c.assignTech); r.post('/appointments/:id/reschedule', A, P('manage_appointments'), c.reschedule);
r.get('/technicians', A, P('assign_technicians'), c.technicians); r.get('/customers', A, P('view_customers'), c.customers);
r.post('/products', A, P('manage_products'), c.saveProduct); r.put('/products/:id', A, P('manage_products'), c.saveProduct); r.delete('/products/:id', A, P('manage_products'), c.delProduct);
r.post('/services', A, P('manage_services'), c.saveService); r.put('/services/:id', A, P('manage_services'), c.saveService);
r.get('/inventory', A, P('view_inventory'), c.inventory); r.get('/stock-movements', A, P('view_inventory'), c.movements); r.post('/inventory/adjust', A, P('manage_inventory'), c.adjust);
r.get('/restocks', A, P('view_inventory', 'approve_restock'), c.restocks); r.post('/restocks', A, P('create_restock'), c.createRestock);
r.post('/restocks/:id/approve', A, P('approve_restock'), c.approveRestock); r.post('/restocks/:id/reject', A, P('approve_restock'), c.rejectRestock);
r.post('/restocks/:id/receive', A, P('receive_stock'), c.receiveRestock);
r.get('/feedback', A, P('view_sentiment'), c.feedbackList); r.get('/sentiment', A, P('view_sentiment'), c.sentiment);
r.get('/dashboard', A, P('view_reports', 'view_orders'), c.dashboard); r.get('/reports/:type', A, P('view_reports'), c.report);
r.get('/staff', A, P('manage_staff'), c.listStaff); r.post('/staff', A, P('manage_staff'), c.createStaff);
r.get('/audit-logs', A, P('view_audit_logs'), c.audit);
r.get('/settings', A, P('manage_settings'), c.settings); r.put('/settings', A, P('manage_settings'), c.saveSettings);
module.exports = r;
