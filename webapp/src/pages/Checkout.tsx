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
      navigate(`/payment/${res.data.order_id}`);
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
      </div>

      <div className="checkout-payment-info">
        <div className="payment-method">
          <div className="payment-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div className="payment-details">
            <h3>Cryptomus</h3>
            <p>Оплата криптовалютой</p>
          </div>
        </div>
        <p className="payment-note">
          После нажатия «Оплатить» вы будете перенаправлены на страницу оплаты.
          Оплата будет подтверждена автоматически.
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
          `Оплатить $${totalPrice.toFixed(2)}`
        )}
      </button>
    </div>
  );
}
