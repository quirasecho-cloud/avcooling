import { Link, Outlet, Navigate, useNavigate } from 'react-router-dom'; import { useAuth, navFor } from '../api/auth.jsx';
export function Shop() {
  const { user, logout } = useAuth();
  return (<><nav className="navbar navbar-expand-md navbar-dark bg-primary"><div className="container">
    <Link className="navbar-brand fw-bold" to="/">AV COOLING SYSTEM</Link>
    <div className="d-flex flex-wrap gap-3 text-white">
      {[['Home','/'],['Shop','/shop'],['Services','/services'],['About','/about'],['Contact','/contact'],['Cart','/cart']].map(([l,t]) => <Link key={t} className="text-white" to={t}>{l}</Link>)}
      {user ? <><Link className="text-white" to="/account">My Account</Link><a role="button" className="text-white" onClick={logout}>Logout</a></> : <Link className="text-white" to="/login">Login</Link>}
    </div></div></nav><div className="container py-4"><Outlet/></div>
    <footer className="bg-dark text-white-50 text-center py-3">© AV COOLING SYSTEM · Air-conditioning sales, installation & repair</footer></>);
}
export function Staff() {
  const { user, ready, logout } = useAuth(); const nav = useNavigate();
  if (!ready) return null; if (!user || user.role === 'customer') return <Navigate to="/staff-login"/>;
  return (<div className="d-md-flex min-vh-100"><aside className="bg-dark p-3" style={{ minWidth: 220 }}>
    <h6 className="text-white">AV COOLING</h6><small className="text-white-50 d-block mb-3">{user.name} ({user.role})</small>
    <ul className="nav flex-md-column">{navFor(user.role).map(([l,t]) => <li key={t} className="nav-item"><Link className="nav-link text-white-50" to={t}>{l}</Link></li>)}
      <li><a role="button" className="nav-link text-warning" onClick={() => { logout(); nav('/staff-login'); }}>Logout</a></li></ul></aside>
    <main className="flex-grow-1 p-3 overflow-auto"><Outlet/></main></div>);
}
export const Money = ({ v }) => <>₱{Number(v).toLocaleString()}</>;
export const Msg = ({ m }) => m ? <div className={'alert ' + (m.err ? 'alert-danger' : 'alert-success')}>{m.text}</div> : null;
