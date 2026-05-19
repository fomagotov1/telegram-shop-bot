import axios from 'axios';
import crypto from 'crypto';

const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID!;
const API_KEY = process.env.CRYPTOMUS_API_KEY!;
const SERVER_URL = process.env.SERVER_URL || 'https://your-domain.com';

function generateSign(data: string): string {
  const encoded = Buffer.from(JSON.stringify(JSON.parse(data))).toString('base64');
  const sign = crypto.createHash('md5').update(encoded + API_KEY).digest('hex');
  return sign;
}

async function cryptomusRequest(method: string, data: Record<string, any>) {
  const dataStr = JSON.stringify(data);
  const sign = generateSign(dataStr);

  const response = await axios.post(
    `https://api.cryptomus.com/v1/${method}`,
    dataStr,
    {
      headers: {
        'merchant': MERCHANT_ID,
        'sign': sign,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

export async function createPayment({ order_id, amount, currency }: { order_id: string; amount: number; currency: string }) {
  const data = {
    amount: amount.toString(),
    currency,
    order_id,
    url_return: `${SERVER_URL}/payment/success`,
    url_success: `${SERVER_URL}/payment/success`,
    url_callback: `${SERVER_URL}/api/payments/webhook`,
    lifetime: 1800,
  };

  const response = await cryptomusRequest('payment', data);

  if (response.state !== 0) {
    throw new Error(response.message || 'Failed to create payment');
  }

  return {
    uuid: response.result.uuid,
    url: response.result.url,
    currency: response.result.currency,
  };
}

export async function checkPaymentStatus(uuid: string) {
  const data = { uuid };
  const response = await cryptomusRequest('payment/info', data);

  if (response.state !== 0) {
    throw new Error(response.message || 'Failed to check payment');
  }

  return {
    status: response.result.status,
    amount: response.result.amount,
    currency: response.result.currency,
    paid_amount: response.result.paid_amount,
  };
}
