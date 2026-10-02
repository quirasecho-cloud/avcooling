const db = require('../repositories/db');
const err = (m, s = 400) => Object.assign(new Error(m), { status: s });
const POS = ['good','great','excellent','fast','love','happy','recommend','professional','amazing'];
const NEG = ['bad','poor','slow','late','broken','terrible','rude','worst','disappointed','damaged'];
exports.sentiment = (text, rating) => {
  const t = (text || '').toLowerCase(); let s = rating - 3;
  POS.forEach(w => { if (t.includes(w)) s++; }); NEG.forEach(w => { if (t.includes(w)) s--; });
  return s > 0 ? 'Positive' : s < 0 ? 'Negative' : 'Neutral';
};
exports.submit = (user, { type, refId, rating, comment }) => {
  const r = +rating; if (!(r >= 1 && r <= 5)) throw err('Rating must be 1-5.');
  const ref = type === 'order' ? db.orders.find(refId) : type === 'service' ? db.appointments.find(refId) : null;
  if (!ref || ref.customerId !== user.id || ref.status !== 'Completed') throw err('Only your completed orders/services can be reviewed.');
  if (db.feedback.where(f => f.type === type && f.refId === +refId && f.customerId === user.id).length) throw err('Already reviewed.');
  return db.feedback.insert({ customerId: user.id, type, refId: +refId, rating: r, comment, sentiment: exports.sentiment(comment, r) });
};
exports.summary = () => { const c = { Positive: 0, Neutral: 0, Negative: 0 }; db.feedback.all().forEach(f => { c[f.sentiment]++; }); return { total: db.feedback.all().length, ...c }; };
