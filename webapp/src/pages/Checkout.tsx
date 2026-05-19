import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';
import { useCart } from '../hooks/useCart';
import './Checkout.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Checkout() {
  const navigate = useNavigate();
  const items = useCart((state) => state.items);
  const clearCart = useCart((state) => state.clearCart);
  const [loading, setLoading] = useState(false);

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  async function handlePay() {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/orders`, {
        telegram_user_id: WebApp.initDataUnsafe?.user?.id,
        telegram_username: WebApp.initDataUnsafe?.user?.username,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total_amount: totalPrice,
        currency: 'USD',
      });

      clearCart();

      navigate(`/payment/${res.data.order_id}`, {
        state: {
          wallet_address: res.data.wallet_address,
          memo: res.data.memo,
          ton_amount: res.data.ton_amount,
        },
      });
    } catch (e) {
      console.error('Checkout error:', e);
      alert('Ошибка при создании заказа. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="checkout">
      <header className="checkout-header">
        <button className="checkout-back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="checkout-title">Оплата</h1>
        <div style={{ width: 20 }} />
      </header>

      <div className="checkout-items">
        {items.map((item) => (
          <div key={item.id} className="checkout-item">
            <div className="checkout-item-info">
              <h3>{item.name}</h3>
              <p>× {item.quantity}</p>
            </div>
            <span className="checkout-item-total">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="checkout-summary">
        <div className="checkout-summary-row">
          <span>К оплате</span>
          <span className="checkout-total">${totalPrice.toFixed(2)}</span>
        </div>
        <div className="checkout-ton-row">
          <span>≈ TON</span>
        </div>
      </div>

      <div className="checkout-payment-info">
        <div className="payment-method">
          <div className="payment-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.93 0 3.68.7 5.05 1.85L12 12 6.95 5.85C8.32 4.7 10.07 4 12 4zm-7 8c0-1.93.7-3.68 1.85-5.05L12 12l-5.15 5.05C5.7 15.68 5 13.93 5 12zm7 7c-1.93 0-3.68-.7-5.05-1.85L12 12l5.05 5.15C15.68 18.3 13.93 19 12 19zm5-7c0 1.93-.7 3.68-1.85 5.05L12 12l5.15-5.05C18.3 8.32 19 10.07 19 12z"/>
            </svg>
          </div>
          <div className="payment-details">
            <h3>TON</h3>
            <p>Оплата криптовалютой TON</p>
          </div>
        </div>
        <p className="payment-note">
          После нажатия «Оплатить» вы получите адрес кошелька и комментарий для перевода.
        </p>
      </div>

      <button
        className="checkout-pay-btn"
        onClick={handlePay}
        disabled={loading}
      >
        {loading ? (
          <span className="spinner" />
        ) : (
          `Оплатить ${totalPrice.toFixed(2)} USD`
        )}
      </button>
    </div>
  );
}
