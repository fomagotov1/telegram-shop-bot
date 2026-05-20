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

const RATES: Record<string, number> = {
  TON: 2.5,
  USDT_TRC20: 1,
  USDT_ERC20: 1,
  ETH: 2500,
  BTC: 65000,
};

export function getRate(currency: CryptoCurrency): number {
  return RATES[currency] || 1;
}

export function generateMemo(orderId: string): string {
  return `order_${orderId.slice(0, 8)}`;
}

export function getPaymentDetails(
  currency: CryptoCurrency,
  orderId: string,
  amountUSD: number,
  walletAddress: string
): PaymentDetails {
  const memo = currency === 'TON' ? generateMemo(orderId) : undefined;
  const rate = getRate(currency);
  const cryptoAmount = (amountUSD / rate).toFixed(currency === 'BTC' ? 8 : 6);

  return {
    currency,
    address: walletAddress,
    memo,
    amount: cryptoAmount,
    network: currency === 'TON' ? 'TON' : currency === 'USDT_TRC20' ? 'TRON' : currency === 'BTC' ? 'Bitcoin' : 'Ethereum',
  };
}

export async function checkPayment(
  orderId: string,
  currency: CryptoCurrency,
  expectedAmount: number,
  walletAddress: string
): Promise<{ paid: boolean; txHash?: string }> {
  try {
    switch (currency) {
      case 'TON':
        return await checkTonPayment(walletAddress, orderId, expectedAmount);
      case 'USDT_TRC20':
        return await checkTronPayment(walletAddress, expectedAmount);
      case 'USDT_ERC20':
        return await checkEthPayment(walletAddress, expectedAmount, true);
      case 'ETH':
        return await checkEthPayment(walletAddress, expectedAmount, false);
      case 'BTC':
        return await checkBtcPayment(walletAddress, expectedAmount);
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
    const response = await fetch(`https://tonapi.io/v2/accounts/${address}/transactions?limit=50&lt=0`);
    const data: any = await response.json();
    const transactions = data.events || [];

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
  expectedAmount: number
): Promise<{ paid: boolean; txHash?: string }> {
  try {
    const response = await fetch(
      `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=50&contract_address=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
    );
    const data: any = await response.json();
    const transactions = data.data || [];

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
  expectedAmount: number,
  isUSDT: boolean
): Promise<{ paid: boolean; txHash?: string }> {
  try {
    const contractAddress = isUSDT ? '0xdac17f958d2ee523a2206206994597c13d831ec7' : '';
    const baseUrl = contractAddress
      ? `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${contractAddress}&address=${address}`
      : `https://api.etherscan.io/api?module=account&action=txlist&address=${address}`;

    const response = await fetch(baseUrl);
    const data: any = await response.json();
    const transactions = data.result || [];

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
  expectedAmount: number
): Promise<{ paid: boolean; txHash?: string }> {
  try {
    const response = await fetch(`https://blockchain.info/rawaddr/${address}?limit=50`);
    const data: any = await response.json();
    const transactions = data.txs || [];

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
