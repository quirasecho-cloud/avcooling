import { useEffect, useState } from 'react'; import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../api/client.js'; import { useAuth } from '../api/auth.jsx'; import { addToCart, getCart, setCart } from '../api/cart.js'; import { Money, Msg } from '../components/Layout.jsx';

export const Home = () => { const [p, setP] = useState([]), [s, setS] = useState([]);
  useEffect(() => { api('/products').then(x => setP(x.slice(0, 3))); api('/services').then(x => setS(x.slice(0, 3))); }, []);
  return (<><div className="p-5 mb-4 bg-info-subtle rounded"><h1>Stay cool with AV COOLING SYSTEM</h1><p>Sales, installation, cleaning and repair of air conditioners. <b>Promo: up to 10% off select units.</b></p><Link className="btn btn-primary" to="/shop">Shop now</Link></div>
    <h4>Featured products</h4><div className="row g-3 mb-4">{p.map(x => <div className="col-md-4" key={x.id}><Card p={x}/></div>)}</div>
    <h4>Featured services</h4><div className="row g-3">{s.map(x => <div className="col-md-4" key={x.id}><div className="card p-3"><b>{x.name}</b><small>{x.description}</small></div></div>)}</div></>); };

function Card({ p }) { const [m, setM] = useState();
  return (<div className="card h-100"><div className="bg-light text-center py-5 text-muted">No image</div><div className="card-body">
    <h6>{p.name}</h6><small className="text-muted">{p.brand} · {p.model}</small>
    <div>{p.discount > 0 && <s className="text-muted me-2"><Money v={p.price}/></s>}<b><Money v={p.finalPrice}/></b> {p.discount > 0 && <span className="badge bg-danger">-{p.discount}%</span>}</div>
    <span className={'badge ' + (p.inStock ? 'bg-success' : 'bg-secondary')}>{p.inStock ? p.stock + ' in stock' : 'Out of stock'}</span><Msg m={m}/>
    <div className="mt-2 d-flex gap-2"><Link className="btn btn-sm btn-outline-primary" to={'/product/' + p.id}>View Details</Link>
      <button disabled={!p.inStock} className="btn btn-sm btn-primary" onClick={() => { addToCart(p.id); setM({ text: 'Added to cart' }); }}>Add to Cart</button></div></div></div>); }

export const Shop = () => { const [f, setF] = useState({ q: '', category: '', brand: '', sort: '' }), [p, setP] = useState([]);
  useEffect(() => { api('/products?' + new URLSearchParams(f)).then(setP); }, [f]); const set = k => e => setF({ ...f, [k]: e.target.value });
  return (<><div className="row g-2 mb-3"><div className="col-md-4"><input className="form-control" placeholder="Search products" value={f.q} onChange={set('q')}/></div>
    <div className="col-md-3"><select className="form-select" value={f.category} onChange={set('category')}><option value="">All categories</option>{['Split-Type','Window-Type','Inverter','Portable','AC Parts','AC Accessories'].map(c => <option key={c}>{c}</option>)}</select></div>
    <div className="col-md-2"><select className="form-select" value={f.brand} onChange={set('brand')}><option value="">All brands</option>{['CoolMax','FrostAir','EcoChill'].map(c => <option key={c}>{c}</option>)}</select></div>
    <div className="col-md-3"><select className="form-select" value={f.sort} onChange={set('sort')}><option value="">Sort</option><option value="price_asc">Price ↑</option><option value="price_desc">Price ↓</option></select></div></div>
    <div className="row g-3">{p.map(x => <div className="col-sm-6 col-lg-4" key={x.id}><Card p={x}/></div>)}{!p.length && <p>No products found.</p>}</div></>); };

export const Product = () => { const { id } = useParams(), [p, setP] = useState(), [q, setQ] = useState(1), [m, setM] = useState();
  useEffect(() => { api('/products/' + id).then(setP).catch(e => setM({ err: 1, text: e.message })); }, [id]);
  if (!p) return <Msg m={m}/>;
  return (<div><h3>{p.name}</h3><p>{p.brand} · {p.model}</p><p>{p.description}</p><h4><Money v={p.finalPrice}/></h4><p>{p.stock > 0 ? p.stock + ' available' : 'Out of stock'}</p>
    <input type="number" min="1" max={p.stock} className="form-control w-auto d-inline me-2" value={q} onChange={e => setQ(+e.target.value)}/>
    <button className="btn btn-primary" disabled={p.stock < 1 || q < 1 || q > p.stock} onClick={() => { addToCart(p.id, q); setM({ text: 'Added to cart' }); }}>Add to Cart</button><Msg m={m}/></div>); };

export const Services = () => { const [s, setS] = useState([]); useEffect(() => { api('/services').then(setS); }, []);
  return (<div className="row g-3">{s.map(x => <div className="col-md-4" key={x.id}><div className="card p-3 h-100"><h5>{x.name}</h5><p>{x.description}</p><small>₱{x.price} · ~{x.durationMin} min</small><small className="text-muted">{x.instructions}</small>
    <Link className="btn btn-primary btn-sm mt-2" to={'/book?service=' + x.id}>Book</Link></div></div>)}</div>); };

export const About = () => <><h3>About Us</h3><p>AV COOLING SYSTEM is your trusted air-conditioning partner.</p></>;
export const Contact = () => <><h3>Contact Us</h3><p>Email: hello@av.test · Phone: 0900-000-0000 · Mon–Sat 8am–5pm</p></>;

export const Cart = () => { const [items, setItems] = useState([]), [prods, setProds] = useState({}), nav = useNavigate(), { user } = useAuth();
  const load = () => { setItems(getCart()); api('/products').then(l => setProds(Object.fromEntries(l.map(p => [p.id, p])))); };
  useEffect(load, []);
  const upd = (id, d) => { setCart(getCart().map(i => i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i)); load(); };
  const del = id => { setCart(getCart().filter(i => i.productId !== id)); load(); };
  const rows = items.filter(i => prods[i.productId]); const total = rows.reduce((s, i) => s + prods[i.productId].finalPrice * i.quantity, 0);
  return (<><h3>Cart</h3><div className="table-responsive"><table className="table"><tbody>{rows.map(i => { const p = prods[i.productId]; return (<tr key={i.productId}><td>{p.name}</td><td><Money v={p.finalPrice}/></td>
    <td><button className="btn btn-sm btn-light" onClick={() => upd(i.productId, -1)}>−</button> {i.quantity} <button className="btn btn-sm btn-light" onClick={() => upd(i.productId, 1)}>+</button></td>
    <td><Money v={p.finalPrice * i.quantity}/></td><td><button className="btn btn-sm btn-outline-danger" onClick={() => del(i.productId)}>Remove</button></td></tr>); })}</tbody></table></div>
    <h5>Total (estimate): <Money v={total}/></h5><Link className="btn btn-light me-2" to="/shop">Continue shopping</Link>
    <button className="btn btn-primary" disabled={!rows.length} onClick={() => nav(user ? '/checkout' : '/login', { state: { from: '/checkout' } })}>Proceed to Checkout</button></>); };

export const Login = ({ staff }) => { const { login } = useAuth(), nav = useNavigate(), loc = useLocation(), [f, setF] = useState({ email: '', password: '' }), [m, setM] = useState();
  const go = async e => { e.preventDefault(); try { const u = await login(f.email, f.password, staff); nav(staff ? (u.role === 'technician' ? '/staff/jobs' : u.role === 'cashier' ? '/staff/pos' : '/staff') : loc.state?.from || '/account'); } catch (x) { setM({ err: 1, text: x.message }); } };
  return (<form onSubmit={go} className="mx-auto" style={{ maxWidth: 380 }}><h3>{staff ? 'Staff Login' : 'Login'}</h3><Msg m={m}/>
    <input className="form-control mb-2" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })}/>
    <input type="password" className="form-control mb-2" placeholder="Password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })}/>
    <button className="btn btn-primary w-100">Login</button>{!staff && <p className="mt-2"><Link to="/register" state={loc.state}>Register</Link> · <a href="#!" onClick={e => { e.preventDefault(); setM({ text: 'Password reset is not available in the mock build.' }); }}>Forgot password</a></p>}</form>); };

export const Register = () => { const { register } = useAuth(), nav = useNavigate(), loc = useLocation(), [f, setF] = useState({ name: '', email: '', password: '', confirmPassword: '' }), [m, setM] = useState();
  const go = async e => { e.preventDefault(); try { await register(f); nav(loc.state?.from || '/account'); } catch (x) { setM({ err: 1, text: x.message }); } };
  return (<form onSubmit={go} className="mx-auto" style={{ maxWidth: 380 }}><h3>Register</h3><Msg m={m}/>
    {[['name','Name','text'],['email','Email','email'],['password','Password','password'],['confirmPassword','Confirm Password','password']].map(([k,l,t]) => <input key={k} type={t} className="form-control mb-2" placeholder={l} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })}/>)}
    <button className="btn btn-primary w-100">Create account</button></form>); };
