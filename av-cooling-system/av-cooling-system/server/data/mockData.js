const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync(process.env.DEMO_PASSWORD || 'Password123!', 8);
const u = (id, name, email, role) => ({ id, name, email, role, passwordHash: hash, active: true });
const prod = (id, name, brand, model, category, price, discount, stock) => ({ id, name, brand, model, category, price, discount, stock, reorderLevel: 5, active: true, description: name + ' by ' + brand, image: '' });
module.exports = {
  users: [u(1,'Ana Admin','admin@av.test','admin'),u(2,'Mark Manager','manager@av.test','manager'),u(3,'Eve Ecom','ecom@av.test','ecom'),u(4,'Carl Cashier','cashier@av.test','cashier'),u(5,'Ian Inventory','inventory@av.test','inventory'),u(6,'Tim Tech','tech@av.test','technician'),u(7,'Cathy Customer','customer@av.test','customer'),u(8,'Tom Tech2','tech2@av.test','technician')],
  products: [
    prod(1,'Split-Type Air Conditioner 1.5HP','CoolMax','CM-S15','Split-Type',32000,10,12),
    prod(2,'Window-Type Air Conditioner 1HP','FrostAir','FA-W10','Window-Type',18500,0,8),
    prod(3,'Inverter Air Conditioner 2HP','EcoChill','EC-I20','Inverter',45000,5,6),
    prod(4,'Portable Air Conditioner','FrostAir','FA-P09','Portable',21000,0,4),
    prod(5,'AC Compressor (Part)','CoolMax','CM-CP1','AC Parts',6500,0,20),
    prod(6,'Remote Control Universal','EcoChill','EC-RC','AC Accessories',450,0,50)],
  services: [
    { id:1, name:'Installation', description:'Professional AC installation', price:2500, durationMin:180, instructions:'Ensure access to mounting area.', active:true },
    { id:2, name:'Cleaning', description:'Deep cleaning of indoor/outdoor unit', price:800, durationMin:60, instructions:'Clear space around unit.', active:true },
    { id:3, name:'Maintenance', description:'Preventive maintenance check', price:1200, durationMin:90, instructions:'', active:true },
    { id:4, name:'Repair', description:'Diagnosis and repair', price:1500, durationMin:120, instructions:'', active:true },
    { id:5, name:'Troubleshooting', description:'Fault finding', price:600, durationMin:60, instructions:'', active:true },
    { id:6, name:'Emergency Service', description:'Same-day urgent service', price:3000, durationMin:120, instructions:'', active:true }],
  orders: [], payments: [], appointments: [], stockMovements: [], restockRequests: [],
  feedback: [], notifications: [], auditLogs: [],
  settings: { gcashEnabled:false, bankTransferEnabled:false, workStart:'08:00', workEnd:'17:00' }
};
