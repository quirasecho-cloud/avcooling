import { createContext, useContext, useEffect, useState } from 'react'; import { api } from './client.js';
const Ctx = createContext(); export const useAuth = () => useContext(Ctx);
const NAV = { // UI only; real security is enforced by the server
  admin: [['Dashboard','/staff'],['POS','/staff/pos'],['Orders','/staff/orders'],['Products','/staff/products'],['Inventory','/staff/inventory'],['Restock','/staff/restock'],['Appointments','/staff/appointments'],['Feedback','/staff/feedback'],['Reports','/staff/reports'],['Staff','/staff/accounts'],['Audit Logs','/staff/audit']],
  manager: [['Dashboard','/staff'],['Orders','/staff/orders'],['Inventory','/staff/inventory'],['Restock','/staff/restock'],['Appointments','/staff/appointments'],['Feedback','/staff/feedback'],['Reports','/staff/reports']],
  ecom: [['Dashboard','/staff'],['Orders','/staff/orders'],['Appointments','/staff/appointments']],
  cashier: [['POS','/staff/pos'],['Transactions','/staff/orders']],
  inventory: [['Inventory','/staff/inventory'],['Restock','/staff/restock'],['Products','/staff/products']],
  technician: [['My Jobs','/staff/jobs']] };
export const navFor = r => NAV[r] || [];
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false);
  useEffect(() => { localStorage.getItem('token') ? api('/me').then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setReady(true)) : setReady(true); }, []);
  const login = async (email, password, staff) => { const r = await api(staff ? '/staff/login' : '/auth/login', { method: 'POST', body: { email, password } }); localStorage.setItem('token', r.token); setUser(r.user); return r.user; };
  const register = async b => { const r = await api('/auth/register', { method: 'POST', body: b }); localStorage.setItem('token', r.token); setUser(r.user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  return <Ctx.Provider value={{ user, ready, login, register, logout }}>{children}</Ctx.Provider>;
}
