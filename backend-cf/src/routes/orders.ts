import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Database } from '../services/database';
import { CryptoCurrency, getPaymentDetails, getRate } from '../services/crypto';

const RUB_USD_RATE = 0.011;
const PAYMENT_TIMEOUT_MINUTES = 15;

const router = new Hono<{ Bindings: Env }>();

const orderSchema = z.object({
  telegram_user_id: z.number(),
  telegram_username: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
  })),
  total_amount: z.number().positive(),
  currency: z.string().default('USD'),
  crypto_currency: z.enum(['TON', 'USDT_TRC20', 'USDT_ERC20', 'ETH', 'BTC']).default('TON'),
});

router.post('/', zValidator('json', orderSchema), async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const data = c.req.valid('json');
  
  const cryptoCurrency = data.crypto_currency as CryptoCurrency;
  const walletAddress = c.env.WALLET_ADDRESS_TON || '';

  // Check stock for all items first
  for (const item of data.items) {
    const product = await database.getProductById(item.id);
    if (!product || product.stock < item.quantity) {
      return c.json({ error: `Not enough stock for ${item.name}` }, 400);
    }
  }
  
  const order = await database.createOrder({
    telegram_user_id: data.telegram_user_id,
    telegram_username: data.telegram_username || null,
    items: JSON.stringify(data.items),
    total_amount: data.total_amount,
    currency: data.currency,
    status: 'pending',
    crypto_currency: cryptoCurrency,
    payment_id: null,
  });

  // Reserve locations
  for (const item of data.items) {
    const success = await database.reserveLocationsForOrder(order.id, item.id, item.quantity);
    if (!success) {
      // In a real system we'd rollback order creation here, but D1 doesn't support full transactions.
      // We'll just release any reserved so far and cancel the order.
      await database.releaseOrderLocations(order.id);
      await database.cancelOrder(order.id);
      return c.json({ error: `Failed to reserve stock for ${item.name}` }, 400);
    }
  }

  const paymentDetails = getPaymentDetails(cryptoCurrency, order.id, data.total_amount, walletAddress);
  
  const payment = await database.createPayment({
    order_id: order.id,
    currency: paymentDetails.currency,
    address: paymentDetails.address,
    memo: paymentDetails.memo || null,
    amount: paymentDetails.amount,
    network: paymentDetails.network,
    status: 'pending',
    tx_hash: null,
  });

  const expiresAt = new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000).toISOString();

  return c.json({
    order_id: order.id,
    ...paymentDetails,
    crypto_amount: paymentDetails.amount,
    usd_amount: data.total_amount,
    rub_amount: Math.round(data.total_amount / RUB_USD_RATE),
    rate: getRate(cryptoCurrency),
    expires_at: expiresAt,
  }, 201);
});

router.get('/currencies', (c) => {
  const currencies = ['TON', 'USDT_TRC20', 'USDT_ERC20', 'ETH', 'BTC'].map((code) => ({
    currency: code,
    rate: getRate(code as CryptoCurrency),
    symbol: code === 'TON' ? '💎' : code === 'USDT_TRC20' || code === 'USDT_ERC20' ? '₮' : code === 'ETH' ? 'Ξ' : '₿',
    icon: code === 'TON' ? 'https://cryptologos.cc/logos/toncoin-ton-logo.png' :
          code === 'USDT_TRC20' || code === 'USDT_ERC20' ? 'https://cryptologos.cc/logos/tether-usdt-logo.png' :
          code === 'ETH' ? 'https://cryptologos.cc/logos/ethereum-eth-logo.png' :
          'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  }));
  return c.json({ currencies });
});

router.get('/:id', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const order = await database.getOrderById(c.req.param('id'));
  if (!order) return c.json({ error: 'Order not found' }, 404);
  const payment = await database.getPaymentByOrderId(order.id);
  
  let locations = [];
  if (order.status === 'paid') {
    locations = await database.getOrderLocations(order.id);
  }

  return c.json({
    ...order,
    wallet_address: c.env.WALLET_ADDRESS_TON || '',
    memo: payment?.memo || null,
    crypto_amount: payment?.amount || '0',
    network: payment?.network || '',
    rate: payment ? getRate(order.crypto_currency as CryptoCurrency) : 1,
    rub_amount: order.currency === 'USD' ? Math.round(order.total_amount / RUB_USD_RATE) : order.total_amount,
    expires_at: new Date(new Date(order.created_at).getTime() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000).toISOString(),
    locations,
  });
});

router.get('/user/:telegramId', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const telegramId = parseInt(c.req.param('telegramId'));
  const orders = await database.getOrdersByUser(telegramId);
  
  const enrichedOrders = await Promise.all(orders.map(async (order) => {
    let locations = [];
    if (order.status === 'paid') {
      locations = await database.getOrderLocations(order.id);
    }
    return { ...order, locations };
  }));

  return c.json(enrichedOrders);
});

router.post('/:id/cancel', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const orderId = c.req.param('id');
  const order = await database.getOrderById(orderId);
  if (!order) return c.json({ error: 'Order not found' }, 404);
  if (order.status !== 'pending') return c.json({ error: 'Order cannot be cancelled' }, 400);
  await database.cancelOrder(orderId);
  const payment = await database.getPaymentByOrderId(orderId);
  if (payment) {
    await database.updatePaymentStatus(payment.id, 'cancelled');
  }
  return c.json({ status: 'cancelled' });
});

export { router as orderRouter };