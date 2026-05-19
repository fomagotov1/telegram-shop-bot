import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentStatus.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function PaymentStatus() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    fetchOrderStatus();
  }, []);

  async function fetchOrderStatus() {
    if (!orderId) return;

    try {
      const res = await axios.get(`${API_URL}/orders/${orderId}`);
      const order = res.data;

      if (order.status === 'paid') {
        setStatus('paid');
        return;
      }

      setPaymentUrl(order.payment_url);

      if (!checkedRef.current) {
        checkedRef.current = true;
        const interval = setInterval(async () => {
          try {
            const checkRes = await axios.post(`${API_URL}/payments/check/${orderId}`);
            if (checkRes.data.status === 'paid') {
              setStatus('paid');
              clearInterval(interval);
            }
          } catch (e) {
            console.error('Poll error:', e);
          }
        }, 5000);

        return () => clearInterval(interval);
      }
    } catch (e) {
      console.error('Fetch order error:', e);
    }
  }

  if (status === 'paid') {
    return (
      <div className="payment-status payment-success">
        <div className="payment-success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1 className="payment-success-title">Оплата подтверждена</h1>
        <p className="payment-success-text">
          Ваш заказ оплачен. Спасибо за покупку!
        </p>
        <button className="payment-success-btn" onClick={() => navigate('/')}>
          Вернуться в каталог
        </button>
      </div>
    );
  }

  return (
    <div className="payment-status">
      <header className="payment-header">
        <button className="payment-back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="payment-title">Ожидание оплаты</h1>
        <div style={{ width: 20 }} />
      </header>

      <div className="payment-waiting">
        <div className="payment-waiting-icon">
          <div className="payment-spinner" />
        </div>
        <h2 className="payment-waiting-title">Ожидание оплаты</h2>
        <p className="payment-waiting-text">
          Нажмите кнопку ниже для перехода к оплате криптовалютой.
          Статус обновится автоматически.
        </p>

        {paymentUrl && (
          <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="payment-link-btn">
            Перейти к оплате
          </a>
        )}

        <div className="payment-steps">
          <div className="payment-step">
            <span className="payment-step-num">1</span>
            <p>Перейдите на страницу оплаты</p>
          </div>
          <div className="payment-step">
            <span className="payment-step-num">2</span>
            <p>Отправьте криптовалюту на указанный адрес</p>
          </div>
          <div className="payment-step">
            <span className="payment-step-num">3</span>
            <p>Дождитесь подтверждения транзакции</p>
          </div>
        </div>
      </div>
    </div>
  );
}
