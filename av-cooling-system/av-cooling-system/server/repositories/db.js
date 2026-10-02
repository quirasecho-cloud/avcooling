// 3rd layer: data access. In-memory now; replace internals with Mongoose later.
const data = require('../data/mockData');
let seq = 1000;
const col = name => ({
  all: () => data[name],
  find: id => data[name].find(x => x.id === Number(id)),
  where: fn => data[name].filter(fn),
  insert: obj => { const o = { id: ++seq, createdAt: new Date().toISOString(), ...obj }; data[name].push(o); return o; },
  update: (id, patch) => { const o = data[name].find(x => x.id === Number(id)); if (o) Object.assign(o, patch, { updatedAt: new Date().toISOString() }); return o; }
});
const names = ['users','products','services','orders','payments','appointments','stockMovements','restockRequests','feedback','notifications','auditLogs'];
module.exports = { data, ...Object.fromEntries(names.map(n => [n, col(n)])) };
