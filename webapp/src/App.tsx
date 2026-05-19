import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentStatus from './pages/PaymentStatus';
import Admin from './pages/Admin';
import BottomNav from './components/BottomNav';

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
      };
    };
  }
}

function App() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.setHeaderColor('secondary_bg_color');
      window.Telegram.WebApp.setBackgroundColor('bg_color');
    }
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
