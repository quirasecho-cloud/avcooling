import { useEffect, useState } from 'react'; import { api } from '../api/client.js'; import { useAuth } from '../api/auth.jsx'; import { Money, Msg } from '../components/Layout.jsx';
const useLoad = path => { const [d, setD] = useState([]), [m, setM] = useState(); const load = () => api(path).then(setD).catch(e => setM({ err: 1, text: e.message })); useEffect(() => { load(); }, [path]); return [d, load, m, setM]; };
const Table = ({ cols, rows }) => <div className="table-responsive"><table className="table table-sm table-striped"><thead><tr>{cols.map(c => <th key={c[0]}>{c[0]}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={r.id || i}>{cols.map(c => <td key={c[0]}>{c[1](r)}</td>)}</tr>)}</tbody></table></div>;
const run = async (fn, reload, setM) => { try { await fn(); setM({ text: 'Done' }); reload(); } catch (e) { setM({ err: 1, text: e.message }); } };

export const Dashboard = () => { const [d, , m] = useLoad('/dashboard'); const [s] = useLoad('/sentiment');
  return (<><h3>Dashboard</h3><Msg m={m}/><div className="row g-3">{Object.entries(d || {}).map(([k, v]) => <div className="col-6 col-md-3" key={k}><div className="card p-3"><small className="text-muted">{k}</small><b>{k === 'totalSales' ? <Money v={v}/> : v}</b></div></div>)}</div>
    {s.total !== undefined && <p className="mt-3">Sentiment: +{s.Positive} / ={s.Neutral} / −{s.Negative}</p>}</>); };

export const Orders = () => { const [o, load, m, setM] = useLoad('/orders'); const { user } = useAuth();
  const [techs] = useLoad(user.role === 'admin' || user.role === 'manager' ? '/technicians' : '/me');
  const next = { Pending: 'Confirmed', Confirmed: 'Processing', Processing: 'Out for Delivery', 'Out for Delivery': 'Completed', 'Ready for Pickup': 'Completed' };
  return (<><h3>Orders</h3><Msg m={m}/><Table rows={[...o].reverse()} cols={[['No.', r => r.orderNo], ['Channel', r => r.channel], ['Total', r => <Money v={r.total}/>], ['Payment', r => r.paymentStatus], ['Status', r => r.status],
    ['Actions', r => user.role !== 'cashier' && <>{next[r.status] && <button className="btn btn-sm btn-primary me-1" onClick={() => run(() => api(`/orders/${r.id}/status`, { method: 'PUT', body: { status: next[r.status] } }), load, setM)}>→ {next[r.status]}</button>}
      {['Pending', 'Confirmed', 'Processing'].includes(r.status) && <button className="btn btn-sm btn-outline-danger me-1" onClick={() => run(() => api(`/orders/${r.id}/status`, { method: 'PUT', body: { status: 'Cancelled' } }), load, setM)}>Cancel</button>}
      {Array.isArray(techs) && r.channel === 'online' && <select className="form-select form-select-sm d-inline w-auto" value={r.technicianId || ''} onChange={e => run(() => api(`/orders/${r.id}/assign`, { method: 'POST', body: { technicianId: +e.target.value } }), load, setM)}><option value="">Assign</option>{techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</>]]}/></>); };

export const Pos = () => { const [p] = useLoad('/products'), [cart, setCart] = useState([]), [pay, setPay] = useState('Cash'), [disc, setDisc] = useState(0), [m, setM] = useState(), [receipt, setReceipt] = useState();
  const add = id => setCart(c => c.find(i => i.productId === id) ? c.map(i => i.productId === id ? { ...i, quantity: i.quantity + 1 } : i) : [...c, { productId: id, quantity: 1 }]);
  const est = cart.reduce((s, i) => s + (p.find(x => x.id === i.productId)?.finalPrice || 0) * i.quantity, 0);
  const confirm = async () => { try { const o = await api('/pos/sale', { method: 'POST', body: { items: cart, paymentMethod: pay, approvedDiscount: disc } }); setReceipt(o); setCart([]); setM({ text: 'Sale saved' }); } catch (e) { setM({ err: 1, text: e.message }); } };
  return (<><h3>POS</h3><Msg m={m}/><div className="row"><div className="col-md-7"><div className="row g-2">{p.map(x => <div className="col-6" key={x.id}><button disabled={!x.inStock} className="btn btn-outline-primary w-100 text-start" onClick={() => add(x.id)}>{x.name}<br/><small><Money v={x.finalPrice}/> · {x.stock} left</small></button></div>)}</div></div>
    <div className="col-md-5"><h5>Current sale</h5>{cart.map(i => <div key={i.productId}>{p.find(x => x.id === i.productId)?.name} × {i.quantity}</div>)}<p>Estimate: <Money v={est}/> (server verifies)</p>
      <input type="number" className="form-control mb-2" placeholder="Approved discount (max 10%)" value={disc} onChange={e => setDisc(e.target.value)}/>
      <select className="form-select mb-2" value={pay} onChange={e => setPay(e.target.value)}><option>Cash</option><option>Card</option><option>GCash</option></select>
      <button className="btn btn-success" disabled={!cart.length} onClick={confirm}>Confirm Transaction</button>
      {receipt && <div className="border p-2 mt-3"><b>Receipt {receipt.orderNo}</b>{receipt.items.map(i => <div key={i.productId}>{i.name} × {i.quantity} = <Money v={i.lineTotal}/></div>)}<b>Total <Money v={receipt.total}/></b> ({receipt.paymentMethod})<br/><button className="btn btn-sm btn-light" onClick={() => window.print()}>Print</button></div>}</div></div></>); };

export const Products = () => { const [p, load, m, setM] = useLoad('/products'); const [f, setF] = useState({ name: '', brand: '', model: '', category: '', price: '', discount: 0 });
  return (<><h3>Products</h3><Msg m={m}/><div className="d-flex flex-wrap gap-2 mb-3">{['name', 'brand', 'model', 'category', 'price', 'discount'].map(k => <input key={k} className="form-control w-auto" placeholder={k} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })}/>)}<button className="btn btn-primary" onClick={() => run(() => api('/products', { method: 'POST', body: f }), load, setM)}>Add</button></div>
    <Table rows={p} cols={[['Name', r => r.name], ['Price', r => <Money v={r.finalPrice}/>], ['Stock', r => r.stock], ['', r => <button className="btn btn-sm btn-outline-danger" onClick={() => run(() => api('/products/' + r.id, { method: 'DELETE' }), load, setM)}>Deactivate</button>]]}/></>); };

export const Inventory = () => { const [i, load, m, setM] = useLoad('/inventory'), [mv] = useLoad('/stock-movements');
  const adj = id => { const quantity = prompt('Quantity (+/-)'), reason = prompt('Reason'); if (quantity) run(() => api('/inventory/adjust', { method: 'POST', body: { productId: id, quantity, reason } }), load, setM); };
  return (<><h3>Inventory</h3><Msg m={m}/><Table rows={i} cols={[['Product', r => r.name], ['Stock', r => <span className={r.low ? 'text-danger fw-bold' : ''}>{r.stock}</span>], ['', r => <button className="btn btn-sm btn-light" onClick={() => adj(r.id)}>Adjust</button>]]}/>
    <h5>Stock movements</h5><Table rows={[...mv].reverse()} cols={[['Type', r => r.type], ['Product', r => r.productId], ['Qty', r => r.quantity], ['Ref', r => r.reference]]}/></>); };

export const Restock = () => { const { user } = useAuth(), [r, load, m, setM] = useLoad('/restocks'), [p] = useLoad('/products'), [f, setF] = useState({ productId: '', quantity: '' });
  const can = ['admin', 'inventory'].includes(user.role), approve = ['admin', 'manager'].includes(user.role);
  const post = (id, a) => run(() => api(`/restocks/${id}/${a}`, { method: 'POST' }), load, setM);
  return (<><h3>Restock Requests</h3><Msg m={m}/>{can && <div className="d-flex gap-2 mb-3"><select className="form-select w-auto" value={f.productId} onChange={e => setF({ ...f, productId: e.target.value })}><option value="">Product</option>{p.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
    <input className="form-control w-auto" placeholder="Qty" value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })}/><button className="btn btn-primary" onClick={() => run(() => api('/restocks', { method: 'POST', body: f }), load, setM)}>Request</button></div>}
    <Table rows={r} cols={[['Product', x => x.productId], ['Qty', x => x.quantity], ['Status', x => x.status], ['', x => <>{approve && x.status === 'Pending' && <><button className="btn btn-sm btn-success me-1" onClick={() => post(x.id, 'approve')}>Approve</button><button className="btn btn-sm btn-danger me-1" onClick={() => post(x.id, 'reject')}>Reject</button></>}{can && x.status === 'Approved' && <button className="btn btn-sm btn-primary" onClick={() => post(x.id, 'receive')}>Receive stock</button>}</>]]}/></>); };

export const Appointments = () => { const [a, load, m, setM] = useLoad('/appointments'), [t] = useLoad('/technicians');
  return (<><h3>Appointments</h3><Msg m={m}/><Table rows={a} cols={[['Service', r => r.serviceName], ['When', r => r.date + ' ' + r.time], ['Status', r => r.status],
    ['Technician', r => <select className="form-select form-select-sm" value={r.technicianId || ''} onChange={e => run(() => api(`/appointments/${r.id}/assign`, { method: 'POST', body: { technicianId: +e.target.value } }), load, setM)}><option value="">Assign</option>{Array.isArray(t) && t.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>],
    ['', r => <button className="btn btn-sm btn-light" onClick={() => { const date = prompt('New date YYYY-MM-DD', r.date), time = prompt('New time HH:MM', r.time); if (date && time) run(() => api(`/appointments/${r.id}/reschedule`, { method: 'POST', body: { date, time } }), load, setM); }}>Reschedule</button>]]}/></>); };

export const Jobs = () => { const [a, load, m, setM] = useLoad('/appointments'), [o, loadO] = useLoad('/orders');
  const st = (id, status) => run(() => api(`/appointments/${id}/status`, { method: 'POST', body: { status, notes: status === 'Completed' ? prompt('Service notes') || '' : undefined } }), load, setM);
  return (<><h3>My Assigned Jobs</h3><Msg m={m}/><h5>Services</h5><Table rows={a} cols={[['Service', r => r.serviceName], ['When', r => r.date + ' ' + r.time], ['Address', r => r.address], ['Status', r => r.status],
    ['', r => <>{r.status === 'Assigned' && <button className="btn btn-sm btn-primary me-1" onClick={() => st(r.id, 'In Progress')}>Start</button>}{r.status === 'In Progress' && <button className="btn btn-sm btn-success" onClick={() => st(r.id, 'Completed')}>Complete</button>}</>]]}/>
    <h5>Deliveries</h5><Table rows={o} cols={[['Order', r => r.orderNo], ['Address', r => r.address], ['Status', r => r.status], ['', r => ['Out for Delivery'].includes(r.status) && <button className="btn btn-sm btn-success" onClick={() => run(() => api(`/orders/${r.id}/tech-status`, { method: 'POST', body: { status: 'Completed' } }), loadO, setM)}>Delivered</button>]]}/></>); };

export const Feedback = () => { const [f] = useLoad('/feedback'); return <><h3>Feedback & Sentiment</h3><Table rows={f} cols={[['Type', r => r.type], ['Rating', r => r.rating], ['Comment', r => r.comment], ['Sentiment', r => <span className={'badge ' + (r.sentiment === 'Positive' ? 'bg-success' : r.sentiment === 'Negative' ? 'bg-danger' : 'bg-secondary')}>{r.sentiment}</span>]]}/></>; };

export const Reports = () => { const [t, setT] = useState('sales'), [r, , m] = useLoad('/reports/' + t); const keys = r[0] ? Object.keys(r[0]).filter(k => typeof r[0][k] !== 'object') : [];
  return (<><h3>Reports</h3><Msg m={m}/><select className="form-select w-auto d-inline me-2" value={t} onChange={e => setT(e.target.value)}>{['sales', 'orders', 'payments', 'inventory', 'stock', 'restock', 'appointments', 'feedback'].map(x => <option key={x}>{x}</option>)}</select><button className="btn btn-light" onClick={() => window.print()}>Print</button>
    <Table rows={r} cols={keys.map(k => [k, x => String(x[k])])}/></>); };

export const Accounts = () => { const [s, load, m, setM] = useLoad('/staff'), [f, setF] = useState({ name: '', email: '', password: '', role: 'cashier' });
  return (<><h3>Staff Accounts</h3><Msg m={m}/><div className="d-flex flex-wrap gap-2 mb-3">{['name', 'email', 'password'].map(k => <input key={k} type={k === 'password' ? 'password' : 'text'} className="form-control w-auto" placeholder={k} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })}/>)}
    <select className="form-select w-auto" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>{['admin', 'manager', 'ecom', 'cashier', 'inventory', 'technician'].map(x => <option key={x}>{x}</option>)}</select><button className="btn btn-primary" onClick={() => run(() => api('/staff', { method: 'POST', body: f }), load, setM)}>Create</button></div>
    <Table rows={s} cols={[['Name', r => r.name], ['Email', r => r.email], ['Role', r => r.role]]}/></>); };

export const Audit = () => { const [l] = useLoad('/audit-logs'); return <><h3>Audit Logs</h3><Table rows={l} cols={[['When', r => r.createdAt], ['User', r => r.userName], ['Action', r => r.action], ['Module', r => r.module], ['Description', r => r.description]]}/></>; };
