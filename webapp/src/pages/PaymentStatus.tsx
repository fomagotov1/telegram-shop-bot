import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './PaymentStatus.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-e853.up.railway.app/api';

interface PaymentData {
  wallet_address: string;
  memo?: string;
  crypto_amount: string;
  currency: string;
  network: string;
}

const CURRENCY_ICONS: Record<string, string> = {
  TON: '💎',
  USDT_TRC20: '₮',
  USDT_ERC20: '₮',
  ETH: 'Ξ',
  BTC: '₿',
};

const CURRENCY_NAMES: Record<string, string> = {
  TON: 'TON',
  USDT_TRC20: 'USDT',
  USDT_ERC20: 'USDT',
  ETH: 'ETH',
  BTC: 'BTC',
};

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
    crypto_amount: '',
    currency: 'TON',
    network: '',
  };

  const currency = paymentData.currency || 'TON';
  const currencyIcon = CURRENCY_ICONS[currency] || '💰';
  const currencyName = CURRENCY_NAMES[currency] || currency;
  const needsMemo = currency === 'TON';

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

  const addressShort = paymentData.wallet_address
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
        <h1 className="payment-title">Оплата {currencyName}</h1>
        <div style={{ width: 20 }} />
      </header>

      <div className="payment-waiting">
        <div className="ton-amount-display">
          <div className="ton-icon">
            <span className="currency-icon-large">{currencyIcon}</span>
          </div>
          <span className="ton-amount-value">{paymentData.crypto_amount} {currencyName}</span>
        </div>

        <div className="payment-details">
          <div className="payment-detail-row">
            <label>Адрес кошелька</label>
            <div className="payment-detail-value" onClick={() => copyToClipboard(paymentData.wallet_address, 'address')}>
              <span>{addressShort}</span>
              <span className={`copy-label ${copied === 'address' ? 'visible' : ''}`}>
                {copied === 'address' ? '✓ Скопировано' : 'Копировать'}
              </span>
            </div>
          </div>

          {needsMemo && paymentData.memo && (
            <div className="payment-detail-row">
              <label>Комментарий (memo)</label>
              <div className="payment-detail-value" onClick={() => copyToClipboard(paymentData.memo!, 'memo')}>
                <span className="memo-text">{paymentData.memo}</span>
                <span className={`copy-label ${copied === 'memo' ? 'visible' : ''}`}>
                  {copied === 'memo' ? '✓ Скопировано' : 'Копировать'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="payment-steps">
          <div className="payment-step">
            <span className="payment-step-num">1</span>
            <p>Откройте кошелёк {currencyName}</p>
          </div>
          <div className="payment-step">
            <span className="payment-step-num">2</span>
            <p>Отправьте <strong>{paymentData.crypto_amount} {currencyName}</strong> на указанный адрес</p>
          </div>
          {needsMemo && (
            <div className="payment-step">
              <span className="payment-step-num">3</span>
              <p>Обязательно укажите <strong>комментарий (memo)</strong></p>
            </div>
          )}
          <div className="payment-step">
            <span className="payment-step-num">{needsMemo ? '4' : '3'}</span>
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
