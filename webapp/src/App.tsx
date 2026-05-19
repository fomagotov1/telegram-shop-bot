import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentStatus from './pages/PaymentStatus';
import Admin from './pages/Admin';
import BottomNav from './components/BottomNav';

function App() {
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor('secondary_bg_color');
    WebApp.setBackgroundColor('bg_color');
  }, []);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment/:orderId" element={<PaymentStatus />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default App;
