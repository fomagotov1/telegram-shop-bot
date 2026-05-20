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
  usd_amount?: number;
  rub_amount?: number;
  rate?: number;
  expires_at?: string;
}

const CURRENCY_ICONS: Record<string, string> = {
  TON: '💎',
  USDT_TRC20: '₮',
  USDT_ERC20: '₮',
  ETH: 'Ξ',
  BTC: '',
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
  const [status, setStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
  const [copied, setCopied] = useState<'address' | 'memo' | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (paymentData.expires_at) {
      const expiresAt = new Date(paymentData.expires_at).getTime();
      const updateTimer = () => {
        const remaining = expiresAt - Date.now();
        if (remaining <= 0) {
          setTimeLeft(0);
          setStatus('expired');
          if (timerRef.current) clearInterval(timerRef.current);
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          setTimeLeft(Math.floor(remaining / 1000));
        }
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paymentData.expires_at]);

  useEffect(() => {
    if (!orderId || status === 'paid' || status === 'expired') return;

    pollRef.current = setInterval(async () => {
      try {
        const checkRes = await axios.post(`${API_URL}/payments/check/${orderId}`);
        if (checkRes.data.status === 'paid') {
          setStatus('paid');
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        } else if (checkRes.data.status === 'expired') {
          setStatus('expired');
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId, status]);

  function copyToClipboard(text: string, type: 'address' | 'memo') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  if (status === 'expired') {
    return (
      <div className="payment-status payment-expired">
        <div className="payment-expired-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="payment-expired-title">Время оплаты истекло</h1>
        <p className="payment-expired-text">
          Заказ не был оплачен в течение 30 минут.
        </p>
        <button className="payment-expired-btn" onClick={() => navigate('/cart')}>
          Вернуться в корзину
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
        {timeLeft !== null && (
          <div className={`payment-timer ${timeLeft < 300 ? 'warning' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Осталось: {formatTime(timeLeft)}</span>
          </div>
        )}

        <div className="ton-amount-display">
          <div className="ton-icon">
            <span className="currency-icon-large">{currencyIcon}</span>
          </div>
          <span className="ton-amount-value">{paymentData.crypto_amount} {currencyName}</span>
        </div>

        {paymentData.rub_amount && paymentData.rate && (
          <p className="payment-usd-equiv">
             {paymentData.rub_amount.toLocaleString('ru-RU')} ₽ ≈ {paymentData.crypto_amount} {currencyName} (1 {currencyName} = ${paymentData.rate.toFixed(2)})
          </p>
        )}

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
