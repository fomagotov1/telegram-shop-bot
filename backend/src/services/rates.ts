import axios from 'axios';

export type CryptoId = 'the-open-network' | 'tether' | 'ethereum' | 'bitcoin';

export interface CryptoRate {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

const COINGECKO_IDS: Record<string, CryptoId> = {
  TON: 'the-open-network',
  USDT_TRC20: 'tether',
  USDT_ERC20: 'tether',
  ETH: 'ethereum',
  BTC: 'bitcoin',
};

const RUB_TO_USD_RATE = 0.011; // ~90 RUB = 1 USD (обновляется вручную или через API)

let cachedRates: Map<string, { rate: number; timestamp: number }> = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

export async function getCryptoRate(currency: string): Promise<number> {
  const cached = cachedRates.get(currency);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rate;
  }

  const coingeckoId = COINGECKO_IDS[currency];
  if (!coingeckoId) {
    return 1; // fallback for stablecoins
  }

  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price`,
      {
        params: {
          ids: coingeckoId,
          vs_currencies: 'usd',
        },
        timeout: 5000,
      }
    );

    const rate = response.data[coingeckoId]?.usd;
    if (rate) {
      cachedRates.set(currency, { rate, timestamp: Date.now() });
      return rate;
    }

    return getFallbackRate(currency);
  } catch (error) {
    console.error(`Failed to fetch rate for ${currency}:`, error);
    return getFallbackRate(currency);
  }
}

export async function getAllRates(): Promise<Record<string, number>> {
  const currencies = Object.keys(COINGECKO_IDS);
  const rates: Record<string, number> = {};

  for (const currency of currencies) {
    rates[currency] = await getCryptoRate(currency);
  }

  return rates;
}

export function convertRubToUsd(rubAmount: number): number {
  return rubAmount * RUB_TO_USD_RATE;
}

export function convertUsdToRub(usdAmount: number): number {
  return usdAmount / RUB_TO_USD_RATE;
}

function getFallbackRate(currency: string): number {
  const fallbacks: Record<string, number> = {
    TON: 2.5,
    USDT_TRC20: 1,
    USDT_ERC20: 1,
    ETH: 2500,
    BTC: 65000,
  };
  return fallbacks[currency] || 1;
}

export function clearCache() {
  cachedRates.clear();
}
