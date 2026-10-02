const P = ['view_orders','create_orders','update_orders','cancel_orders','view_products','manage_products','view_inventory','manage_inventory','create_restock','approve_restock','receive_stock','view_customers','manage_customers','view_services','manage_services','manage_appointments','assign_technicians','process_payments','access_pos','view_reports','view_sentiment','manage_staff','view_audit_logs','manage_settings'];
module.exports = {
  admin: P,
  manager: ['view_orders','update_orders','cancel_orders','view_products','view_inventory','approve_restock','view_customers','view_services','manage_appointments','assign_technicians','process_payments','view_reports','view_sentiment'],
  ecom: ['view_orders','update_orders','process_payments','view_services','manage_appointments','view_customers'],
  cashier: ['access_pos','process_payments','view_products','view_orders'],
  inventory: ['view_products','manage_products','view_inventory','manage_inventory','create_restock','receive_stock'],
  technician: [],
  customer: []
};
