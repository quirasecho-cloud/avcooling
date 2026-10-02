import { Routes, Route } from 'react-router-dom'; import { Shop as ShopLayout, Staff } from './components/Layout.jsx';
import * as P from './pages/Public.jsx'; import * as C from './pages/Customer.jsx'; import * as S from './pages/Staff.jsx';
const G = ({ el }) => <C.Guard>{el}</C.Guard>;
export default function App() {
  return (<Routes>
    <Route element={<ShopLayout/>}>
      <Route path="/" element={<P.Home/>}/><Route path="/shop" element={<P.Shop/>}/><Route path="/product/:id" element={<P.Product/>}/><Route path="/services" element={<P.Services/>}/>
      <Route path="/about" element={<P.About/>}/><Route path="/contact" element={<P.Contact/>}/><Route path="/cart" element={<P.Cart/>}/>
      <Route path="/login" element={<P.Login/>}/><Route path="/register" element={<P.Register/>}/>
      <Route path="/checkout" element={<G el={<C.Checkout/>}/>}/><Route path="/book" element={<G el={<C.Book/>}/>}/><Route path="/account" element={<G el={<C.Account/>}/>}/>
    </Route>
    <Route path="/staff-login" element={<div className="container py-5"><P.Login staff/></div>}/>
    <Route path="/staff" element={<Staff/>}>
      <Route index element={<S.Dashboard/>}/><Route path="pos" element={<S.Pos/>}/><Route path="orders" element={<S.Orders/>}/><Route path="products" element={<S.Products/>}/>
      <Route path="inventory" element={<S.Inventory/>}/><Route path="restock" element={<S.Restock/>}/><Route path="appointments" element={<S.Appointments/>}/><Route path="jobs" element={<S.Jobs/>}/>
      <Route path="feedback" element={<S.Feedback/>}/><Route path="reports" element={<S.Reports/>}/><Route path="accounts" element={<S.Accounts/>}/><Route path="audit" element={<S.Audit/>}/>
    </Route></Routes>);
}
