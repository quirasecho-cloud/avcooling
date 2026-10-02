import { useEffect, useState } from 'react'; import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js'; import { useAuth } from '../api/auth.jsx'; import { getCart, setCart } from '../api/cart.js'; import { Money, Msg } from '../components/Layout.jsx';

export const Guard = ({ children }) => { const { user, ready } = useAuth(); if (!ready) return null; return user && user.role === 'customer' ? children : <Navigate to="/login" state={{ from: location.pathname }}/>; };

export const Checkout = () => { const nav = useNavigate(), [f, setF] = useState({ fulfillment: 'Delivery', contactNumber: '', address: '', notes: '', installationDate: '', paymentMethod: 'COD' }), [m, setM] = useState();
  const place = async () => { try { const o = await api('/checkout', { method: 'POST', body: { ...f, items: getCart() } }); setCart([]); nav('/account?placed=' + o.orderNo); } catch (e) { setM({ err: 1, text: e.message }); } };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (<div style={{ maxWidth: 520 }}><h3>Checkout</h3><Msg m={m}/>
    <select className="form-select mb-2" value={f.fulfillment} onChange={set('fulfillment')}><option>Delivery</option><option>Pickup</option></select>
    <input className="form-control mb-2" placeholder="Contact number" value={f.contactNumber} onChange={set('contactNumber')}/>
    {f.fulfillment === 'Delivery' && <input className="form-control mb-2" placeholder="Delivery address" value={f.address} onChange={set('address')}/>}
    <label className="small">Installation date (optional)</label><input type="date" className="form-control mb-2" value={f.installationDate} onChange={set('installationDate')}/>
    <textarea className="form-control mb-2" placeholder="Order notes" value={f.notes} onChange={set('notes')}/>
    <div className="mb-2">Payment: <b>Cash on Delivery</b> (other methods unavailable)</div>
    <p className="text-muted small">Final prices and stock are verified by the server when you place the order.</p>
    <button className="btn btn-primary" onClick={place}>Place Order</button></div>); };

export const Book = () => { const [sp] = useSearchParams(), [svcs, setSvcs] = useState([]), [f, setF] = useState({ serviceId: sp.get('service') || '', acUnit: '', problem: '', address: '', date: '', time: '09:00', notes: '' }), [m, setM] = useState();
  useEffect(() => { api('/services').then(setSvcs); }, []); const set = k => e => setF({ ...f, [k]: e.target.value });
  const go = async () => { try { await api('/bookings', { method: 'POST', body: f }); setM({ text: 'Booking received!' }); } catch (e) { setM({ err: 1, text: e.message }); } };
  return (<div style={{ maxWidth: 520 }}><h3>Book a Service</h3><Msg m={m}/>
    <select className="form-select mb-2" value={f.serviceId} onChange={set('serviceId')}><option value="">Select service</option>{svcs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
    {[['acUnit','AC unit (brand/model)'],['problem','Problem / description'],['address','Service address'],['notes','Additional notes']].map(([k,l]) => <input key={k} className="form-control mb-2" placeholder={l} value={f[k]} onChange={set(k)}/>)}
    <div className="d-flex gap-2 mb-2"><input type="date" className="form-control" value={f.date} onChange={set('date')}/><input type="time" className="form-control" value={f.time} onChange={set('time')}/></div>
    <button className="btn btn-primary" onClick={go}>Book</button></div>); };

export const Account = () => { const [sp] = useSearchParams(), [o, setO] = useState([]), [a, setA] = useState([]), [n, setN] = useState([]), [m, setM] = useState(sp.get('placed') ? { text: 'Order placed: ' + sp.get('placed') } : null);
  const load = () => { api('/orders').then(setO); api('/appointments').then(setA); api('/notifications').then(setN); }; useEffect(load, []);
  const act = async (fn) => { try { await fn(); load(); } catch (e) { setM({ err: 1, text: e.message }); } };
  const review = (type, refId) => { const rating = prompt('Rating 1-5'); if (!rating) return; const comment = prompt('Comment') || ''; act(() => api('/feedback', { method: 'POST', body: { type, refId, rating, comment } })); };
  return (<><h3>My Account</h3><Msg m={m}/><h5>My Orders</h5><div className="table-responsive"><table className="table"><thead><tr><th>No.</th><th>Total</th><th>Payment</th><th>Status</th><th/></tr></thead><tbody>{o.map(x => <tr key={x.id}><td>{x.orderNo}</td><td><Money v={x.total}/></td><td>{x.paymentStatus}</td><td><span className="badge bg-info">{x.status}</span></td>
    <td>{['Pending','Confirmed'].includes(x.status) && <button className="btn btn-sm btn-outline-danger" onClick={() => act(() => api(`/orders/${x.id}/cancel`, { method: 'POST' }))}>Cancel</button>}{x.status === 'Completed' && <button className="btn btn-sm btn-outline-primary" onClick={() => review('order', x.id)}>Review</button>}</td></tr>)}</tbody></table></div>
    <h5>My Service Bookings</h5><div className="table-responsive"><table className="table"><tbody>{a.map(x => <tr key={x.id}><td>{x.serviceName}</td><td>{x.date} {x.time}</td><td>{x.technicianId ? 'Technician assigned' : 'Awaiting assignment'}</td><td>{x.status}</td>
    <td>{['Requested','Assigned'].includes(x.status) && <button className="btn btn-sm btn-outline-danger" onClick={() => act(() => api(`/appointments/${x.id}/status`, { method: 'POST', body: { status: 'Cancelled' } }))}>Cancel</button>}{x.status === 'Completed' && <button className="btn btn-sm btn-outline-primary" onClick={() => review('service', x.id)}>Review</button>}</td></tr>)}</tbody></table></div>
    <h5>Notifications</h5><ul>{n.map(x => <li key={x.id}>{x.message}</li>)}</ul></>); };
