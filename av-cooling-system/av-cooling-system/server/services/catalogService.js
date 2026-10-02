const db = require('../repositories/db');
const audit = require('./audit');
const err = (m, s = 400) => Object.assign(new Error(m), { status: s });
const finalPrice = p => +(p.price * (1 - p.discount / 100)).toFixed(2);
exports.finalPrice = finalPrice;
exports.listProducts = ({ q, category, brand, sort } = {}) => {
  let r = db.products.where(p => p.active);
  if (q) r = r.filter(p => (p.name + p.brand + p.model).toLowerCase().includes(q.toLowerCase()));
  if (category) r = r.filter(p => p.category === category);
  if (brand) r = r.filter(p => p.brand === brand);
  if (sort === 'price_asc') r.sort((a, b) => finalPrice(a) - finalPrice(b));
  if (sort === 'price_desc') r.sort((a, b) => finalPrice(b) - finalPrice(a));
  return r.map(p => ({ ...p, finalPrice: finalPrice(p), inStock: p.stock > 0 }));
};
exports.saveProduct = (user, id, body) => {
  const f = { name: body.name, brand: body.brand, model: body.model, category: body.category, price: +body.price, discount: +body.discount || 0, description: body.description };
  if (!f.name || !(f.price >= 0) || f.discount < 0 || f.discount > 100) throw err('Invalid product data.');
  if (id) { const p = db.products.update(id, f); audit.log(user, 'UPDATE', 'products', 'Updated ' + f.name, p.id); return p; }
  const p = db.products.insert({ ...f, stock: 0, reorderLevel: 5, active: true });
  audit.log(user, 'CREATE', 'products', 'Created ' + f.name, p.id); return p;
};
exports.deactivateProduct = (user, id) => { const p = db.products.update(id, { active: false }); audit.log(user, 'DEACTIVATE', 'products', p.name, p.id); return p; };
exports.listServices = () => db.services.where(s => s.active);
exports.saveService = (user, id, body) => {
  const f = { name: body.name, description: body.description, price: +body.price, durationMin: +body.durationMin, instructions: body.instructions || '' };
  if (!f.name || !(f.price >= 0) || !(f.durationMin > 0)) throw err('Invalid service data.');
  const s = id ? db.services.update(id, f) : db.services.insert({ ...f, active: true });
  audit.log(user, id ? 'UPDATE' : 'CREATE', 'services', f.name, s.id); return s;
};
