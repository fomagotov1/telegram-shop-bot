import axios from 'axios';
import { db } from '../db';

const WALLET_ADDRESS = process.env.WALLET_ADDRESS!;
const TONAPI_URL = 'https://tonapi.io/v2';

export async function checkTonPayment(orderId: string, expectedAmount: number): Promise<{ paid: boolean; txHash?: string }> {
  try {
    const response = await axios.get(`${TONAPI_URL}/accounts/${WALLET_ADDRESS}/transactions`, {
      params: {
        limit: 50,
        lt: 0,
      },
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

export function generateMemo(orderId: string): string {
  return `order_${orderId.slice(0, 8)}`;
}

export function getWalletAddress(): string {
  return WALLET_ADDRESS;
}

export function tonToNano(ton: number): string {
  return Math.round(ton * 1e9).toString();
}
