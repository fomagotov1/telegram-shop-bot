import axios from 'axios';
import { db } from '../db';

export type CryptoCurrency = 'TON' | 'USDT_TRC20' | 'USDT_ERC20' | 'ETH' | 'BTC';

export interface CryptoWallet {
  currency: CryptoCurrency;
  address: string;
  network: string;
  minAmount: number;
  confirmations: number;
}

export interface PaymentDetails {
  currency: CryptoCurrency;
  address: string;
  memo?: string;
  amount: string;
  network: string;
}

const WALLETS: Record<CryptoCurrency, CryptoWallet> = {
  TON: {
    currency: 'TON',
    address: process.env.WALLET_ADDRESS_TON || process.env.WALLET_ADDRESS || '',
    network: 'TON',
    minAmount: 0.1,
    confirmations: 1,
  },
  USDT_TRC20: {
    currency: 'USDT_TRC20',
    address: process.env.WALLET_ADDRESS_USDT_TRC20 || '',
    network: 'TRON',
    minAmount: 1,
    confirmations: 19,
  },
  USDT_ERC20: {
    currency: 'USDT_ERC20',
    address: process.env.WALLET_ADDRESS_USDT_ERC20 || '',
    network: 'Ethereum',
    minAmount: 1,
    confirmations: 12,
  },
  ETH: {
    currency: 'ETH',
    address: process.env.WALLET_ADDRESS_ETH || '',
    network: 'Ethereum',
    minAmount: 0.001,
    confirmations: 12,
  },
  BTC: {
    currency: 'BTC',
    address: process.env.WALLET_ADDRESS_BTC || '',
    network: 'Bitcoin',
    minAmount: 0.0001,
    confirmations: 3,
  },
};

export function getSupportedCurrencies(): CryptoCurrency[] {
  return Object.keys(WALLETS).filter(
    (key) => WALLETS[key as CryptoCurrency].address
  ) as CryptoCurrency[];
}

export function getWallet(currency: CryptoCurrency): CryptoWallet | null {
  const wallet = WALLETS[currency];
  if (!wallet || !wallet.address) return null;
  return wallet;
}

export function generateMemo(orderId: string): string {
  return `order_${orderId.slice(0, 8)}`;
}

export function getPaymentDetails(
  currency: CryptoCurrency,
  orderId: string,
  amountUSD: number
): PaymentDetails | null {
  const wallet = getWallet(currency);
  if (!wallet) return null;

  const memo = currency === 'TON' ? generateMemo(orderId) : undefined;

  return {
    currency,
    address: wallet.address,
    memo,
    amount: amountUSD.toFixed(2),
    network: wallet.network,
  };
}

export async function checkPayment(
  orderId: string,
  currency: CryptoCurrency,
  expectedAmount: number
): Promise<{ paid: boolean; txHash?: string }> {
  const wallet = getWallet(currency);
  if (!wallet) return { paid: false };

  try {
    switch (currency) {
      case 'TON':
        return await checkTonPayment(wallet.address, orderId, expectedAmount);
      case 'USDT_TRC20':
        return await checkTronPayment(wallet.address, orderId, expectedAmount, 'USDT');
      case 'USDT_ERC20':
        return await checkEthPayment(wallet.address, orderId, expectedAmount, 'USDT');
      case 'ETH':
        return await checkEthPayment(wallet.address, orderId, expectedAmount, 'ETH');
      case 'BTC':
        return await checkBtcPayment(wallet.address, orderId, expectedAmount);
      default:
        return { paid: false };
    }
  } catch (error) {
    console.error(`Payment check error for ${currency}:`, error);
    return { paid: false };
  }
}

async function checkTonPayment(
  address: string,
  orderId: string,
  expectedAmount: number
): Promise<{ paid: boolean; txHash?: string }> {
  try {
    const response = await axios.get(`https://tonapi.io/v2/accounts/${address}/transactions`, {
      params: { limit: 50, lt: 0 },
    });

    const transactions = response.data.events || [];

    for (const tx of transactions) {
      const value = tx?.value || 0;
      const comment = tx?.in_msg?.decoded?.comment || tx?.in_msg?.decoded?.text || '';
      const txHash = tx?.tx_hash || '';
      const txTime = tx?.time || 0;

      const hoursAgo = (Date.now() / 1000 - txTime) / 3600;
      if (hoursAgo > 24) continue;

      const amountNano = Math.round(value);
      const amountTon = amountNano / 1e9;

      if (comment.includes(orderId) && amountTon >= expectedAmount * 0.95) {
        return { paid: true, txHash };
      }
    }

    return { paid: false };
  } catch (error) {
    console.error('TON check error:', error);
    return { paid: false };
  }
}

async function checkTronPayment(
  address: string,
  orderId: string,
  expectedAmount: number,
  token: string
): Promise<{ paid: boolean; txHash?: string }> {
  try {
    const response = await axios.get(`https://api.trongrid.io/v1/accounts/${address}/transactions/trc20`, {
      params: {
        limit: 50,
        contract_address: token === 'USDT' ? 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' : undefined,
      },
    });

    const transactions = response.data.data || [];

    for (const tx of transactions) {
      const txTime = tx.block_timestamp || 0;
      const hoursAgo = (Date.now() - txTime) / (1000 * 3600);
      if (hoursAgo > 24) continue;

      const value = parseFloat(tx.value) / 1e6;
      const txHash = tx.transaction_id || '';

      if (value >= expectedAmount * 0.95) {
        return { paid: true, txHash };
      }
    }

    return { paid: false };
  } catch (error) {
    console.error('TRON check error:', error);
    return { paid: false };
  }
}

async function checkEthPayment(
  address: string,
  orderId: string,
  expectedAmount: number,
  token: string
): Promise<{ paid: boolean; txHash?: string }> {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY || '';
    const contractAddress = token === 'USDT' ? '0xdac17f958d2ee523a2206206994597c13d831ec7' : '';
    const baseUrl = contractAddress
      ? `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${contractAddress}&address=${address}`
      : `https://api.etherscan.io/api?module=account&action=txlist&address=${address}`;

    const url = apiKey ? `${baseUrl}&apikey=${apiKey}` : baseUrl;
    const response = await axios.get(url);

    const transactions = response.data.result || [];

    for (const tx of transactions) {
      const txTime = parseInt(tx.timeStamp || '0');
      const hoursAgo = (Date.now() / 1000 - txTime) / 3600;
      if (hoursAgo > 24) continue;

      const value = contractAddress
        ? parseFloat(tx.value) / 1e6
        : parseFloat(tx.value) / 1e18;
      const txHash = tx.hash || '';

      if (value >= expectedAmount * 0.95) {
        return { paid: true, txHash };
      }
    }

    return { paid: false };
  } catch (error) {
    console.error('ETH check error:', error);
    return { paid: false };
  }
}

async function checkBtcPayment(
  address: string,
  orderId: string,
  expectedAmount: number
): Promise<{ paid: boolean; txHash?: string }> {
  try {
    const response = await axios.get(`https://blockchain.info/rawaddr/${address}?limit=50`);

    const transactions = response.data.txs || [];

    for (const tx of transactions) {
      const txTime = tx.time || 0;
      const hoursAgo = (Date.now() / 1000 - txTime) / 3600;
      if (hoursAgo > 24) continue;

      const received = tx.out
        .filter((output: any) => output.addr === address)
        .reduce((sum: number, output: any) => sum + output.value, 0);

      const amountBtc = received / 1e8;
      const txHash = tx.hash || '';

      if (amountBtc >= expectedAmount * 0.95) {
        return { paid: true, txHash };
      }
    }

    return { paid: false };
  } catch (error) {
    console.error('BTC check error:', error);
    return { paid: false };
  }
}
