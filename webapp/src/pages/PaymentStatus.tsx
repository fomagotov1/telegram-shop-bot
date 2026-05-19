import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './PaymentStatus.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface PaymentData {
  wallet_address: string;
  memo: string;
  ton_amount: string;
}

export default function PaymentStatus() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'pending' | 'paid'>('pending');
  const [copied, setCopied] = useState<'address' | 'memo' | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const paymentData = (location.state as PaymentData | null) || {
    wallet_address: '',
    memo: '',
    ton_amount: '',
  };

  useEffect(() => {
    if (!orderId) return;

    pollRef.current = setInterval(async () => {
      try {
        const checkRes = await axios.post(`${API_URL}/payments/check/${orderId}`);
        if (checkRes.data.status === 'paid') {
          setStatus('paid');
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId]);

  function copyToClipboard(text: string, type: 'address' | 'memo') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  const tonAddressShort = paymentData.wallet_address
    ? `${paymentData.wallet_address.slice(0, 12)}...${paymentData.wallet_address.slice(-8)}`
    : '';

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
        <h1 className="payment-title">Оплата TON</h1>
        <div style={{ width: 20 }} />
      </header>

      <div className="payment-waiting">
        <div className="ton-amount-display">
          <div className="ton-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.93 0 3.68.7 5.05 1.85L12 12 6.95 5.85C8.32 4.7 10.07 4 12 4zm-7 8c0-1.93.7-3.68 1.85-5.05L12 12l-5.15 5.05C5.7 15.68 5 13.93 5 12zm7 7c-1.93 0-3.68-.7-5.05-1.85L12 12l5.05 5.15C15.68 18.3 13.93 19 12 19zm5-7c0 1.93-.7 3.68-1.85 5.05L12 12l5.15-5.05C18.3 8.32 19 10.07 19 12z"/>
            </svg>
          </div>
          <span className="ton-amount-value">{paymentData.ton_amount} TON</span>
        </div>

        <div className="payment-details">
          <div className="payment-detail-row">
            <label>Адрес кошелька</label>
            <div className="payment-detail-value" onClick={() => copyToClipboard(paymentData.wallet_address, 'address')}>
              <span>{tonAddressShort}</span>
              <span className={`copy-label ${copied === 'address' ? 'visible' : ''}`}>
                {copied === 'address' ? '✓ Скопировано' : 'Копировать'}
              </span>
            </div>
          </div>

          <div className="payment-detail-row">
            <label>Комментарий (memo)</label>
            <div className="payment-detail-value" onClick={() => copyToClipboard(paymentData.memo, 'memo')}>
              <span className="memo-text">{paymentData.memo}</span>
              <span className={`copy-label ${copied === 'memo' ? 'visible' : ''}`}>
                {copied === 'memo' ? '✓ Скопировано' : 'Копировать'}
              </span>
            </div>
          </div>
        </div>

        <div className="payment-steps">
          <div className="payment-step">
            <span className="payment-step-num">1</span>
            <p>Откройте TON Wallet</p>
          </div>
          <div className="payment-step">
            <span className="payment-step-num">2</span>
            <p>Отправьте <strong>{paymentData.ton_amount} TON</strong> на указанный адрес</p>
          </div>
          <div className="payment-step">
            <span className="payment-step-num">3</span>
            <p>Обязательно укажите <strong>комментарий (memo)</strong></p>
          </div>
          <div className="payment-step">
            <span className="payment-step-num">4</span>
            <p>Статус обновится автоматически</p>
          </div>
        </div>

        <div className="payment-spinner-row">
          <div className="payment-spinner-small" />
          <span>Ожидание оплаты...</span>
        </div>
      </div>
    </div>
  );
}
