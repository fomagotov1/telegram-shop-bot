import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Database } from '../services/database';
import { CryptoCurrency, getPaymentDetails, getRate } from '../services/crypto';

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

  return c.json({
    order_id: order.id,
    ...paymentDetails,
    crypto_amount: paymentDetails.amount,
    usd_amount: data.total_amount,
    rate: getRate(cryptoCurrency),
  }, 201);
});

router.get('/currencies', (c) => {
  return c.json({ currencies: ['TON', 'USDT_TRC20', 'USDT_ERC20', 'ETH', 'BTC'] });
});

router.get('/:id', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const order = await database.getOrderById(c.req.param('id'));
  if (!order) return c.json({ error: 'Order not found' }, 404);
  return c.json(order);
});

router.get('/user/:telegramId', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const telegramId = parseInt(c.req.param('telegramId'));
  const result = await db.prepare('SELECT * FROM orders WHERE telegram_user_id = ? ORDER BY created_at DESC').bind(telegramId).all();
  return c.json(result.results);
});

export { router as orderRouter };
