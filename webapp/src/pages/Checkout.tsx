import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../hooks/useCart';
import type { CurrencyInfo } from '../types';
import './Checkout.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-e853.up.railway.app/api';

type CryptoCurrency = 'TON' | 'USDT_TRC20' | 'USDT_ERC20' | 'ETH' | 'BTC';

interface CurrencyOption {
  currency: CryptoCurrency;
  name: string;
  network: string;
  icon: string;
  rate: number;
}

const CURRENCY_META: Record<CryptoCurrency, { name: string; network: string; icon: string }> = {
  TON: {
    name: 'TON',
    network: 'TON Network',
    icon: '💎',
  },
  USDT_TRC20: {
    name: 'USDT',
    network: 'TRC-20 (TRON)',
    icon: '₮',
  },
  USDT_ERC20: {
    name: 'USDT',
    network: 'ERC-20 (Ethereum)',
    icon: '₮',
  },
  ETH: {
    name: 'ETH',
    network: 'Ethereum',
    icon: 'Ξ',
  },
  BTC: {
    name: 'BTC',
    network: 'Bitcoin',
    icon: '',
  },
};

const RUB_TO_USD = 0.011;

export default function Checkout() {
  const navigate = useNavigate();
  const items = useCart((state) => state.items);
  const clearCart = useCart((state) => state.clearCart);
  const [loading, setLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency>('TON');
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyOption[]>([]);
  const [cryptoAmount, setCryptoAmount] = useState('0');

  const totalPriceUsd = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPriceRub = Math.round(totalPriceUsd / RUB_TO_USD);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (availableCurrencies.length > 0 && !availableCurrencies.find(c => c.currency === selectedCurrency)) {
      setSelectedCurrency(availableCurrencies[0].currency);
    }
  }, [availableCurrencies]);

  useEffect(() => {
    const selected = availableCurrencies.find(c => c.currency === selectedCurrency);
    if (selected && totalPriceUsd > 0) {
      const amount = totalPriceUsd / selected.rate;
      const decimals = selectedCurrency === 'BTC' ? 8 : 6;
      setCryptoAmount(amount.toFixed(decimals));
    }
  }, [selectedCurrency, availableCurrencies, totalPriceUsd]);

  async function fetchCurrencies() {
    try {
      const res = await axios.get(`${API_URL}/orders/currencies`);
      const currencies: CurrencyOption[] = res.data.currencies.map((c: CurrencyInfo) => ({
        currency: c.currency as CryptoCurrency,
        name: CURRENCY_META[c.currency as CryptoCurrency]?.name || c.currency,
        network: CURRENCY_META[c.currency as CryptoCurrency]?.network || '',
        icon: CURRENCY_META[c.currency as CryptoCurrency]?.icon || '💰',
        rate: c.rate,
      }));
      setAvailableCurrencies(currencies);
    } catch (e) {
      console.error('Failed to fetch currencies:', e);
      setAvailableCurrencies([
        { currency: 'TON', name: 'TON', network: 'TON Network', icon: '💎', rate: 2.5 },
      ]);
    }
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  async function handlePay() {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/orders`, {
        telegram_user_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id,
        telegram_username: window.Telegram?.WebApp?.initDataUnsafe?.user?.username,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total_amount: totalPriceRub,
        currency: 'RUB',
        crypto_currency: selectedCurrency,
      });

      clearCart();

      navigate(`/payment/${res.data.order_id}`, {
        state: {
          wallet_address: res.data.wallet_address,
          memo: res.data.memo,
          crypto_amount: res.data.crypto_amount,
          currency: res.data.currency,
          network: res.data.network,
          usd_amount: res.data.usd_amount,
          rub_amount: res.data.rub_amount,
          rate: res.data.rate,
          expires_at: res.data.expires_at,
        },
      });
    } catch (e) {
      console.error('Checkout error:', e);
      alert('Ошибка при создании заказа. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  }

  const selectedInfo = availableCurrencies.find(c => c.currency === selectedCurrency) || availableCurrencies[0];

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
        {items.map((item) => {
          const itemPriceRub = Math.round(item.price / RUB_TO_USD);
          return (
            <div key={item.id} className="checkout-item">
              <div className="checkout-item-info">
                <h3>{item.name}</h3>
                <p>× {item.quantity}</p>
              </div>
              <span className="checkout-item-total">{(itemPriceRub * item.quantity).toLocaleString('ru-RU')} ₽</span>
            </div>
          );
        })}
      </div>

      <div className="checkout-summary">
        <div className="checkout-summary-row">
          <span>К оплате</span>
          <span className="checkout-total">{totalPriceRub.toLocaleString('ru-RU')} ₽</span>
        </div>
        {selectedInfo && (
          <div className="checkout-summary-row crypto-amount">
            <span>≈ {cryptoAmount} {selectedInfo.name}</span>
            <span className="crypto-rate">1 {selectedInfo.name} = ${selectedInfo.rate.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="currency-selector">
        <label className="currency-label">Выберите криптовалюту:</label>
        <div className="currency-options">
          {availableCurrencies.map((currency) => {
            const isSelected = selectedCurrency === currency.currency;
            return (
              <button
                key={currency.currency}
                className={`currency-option ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedCurrency(currency.currency)}
              >
                <span className="currency-icon">{currency.icon}</span>
                <div className="currency-info">
                  <span className="currency-name">{currency.name}</span>
                  <span className="currency-network">{currency.network}</span>
                </div>
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="checkout-payment-info">
        <div className="payment-method">
          <div className="payment-icon">
            <span className="payment-icon-text">{selectedInfo?.icon}</span>
          </div>
          <div className="payment-details">
            <h3>{selectedInfo?.name}</h3>
            <p>Оплата через {selectedInfo?.network}</p>
          </div>
        </div>
        <p className="payment-note">
          После нажатия «Оплатить» вы получите адрес кошелька для перевода.
          <br />
           Заказ действителен 30 минут.
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
          `Оплатить ${totalPriceRub.toLocaleString('ru-RU')} ₽`
        )}
      </button>
    </div>
  );
}
