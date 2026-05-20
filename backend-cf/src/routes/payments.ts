import { Hono } from 'hono';
import { Database } from '../services/database';
import { checkPayment, CryptoCurrency } from '../services/crypto';
import { Bot } from 'grammy';

const router = new Hono<{ Bindings: Env }>();

router.post('/check/:orderId', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const orderId = c.req.param('orderId');

  const order = await database.getOrderById(orderId);
  if (!order) return c.json({ error: 'Order not found' }, 404);

  if (order.status === 'paid') {
    return c.json({ status: 'paid', order });
  }

  const cryptoCurrency = order.crypto_currency as CryptoCurrency;
  const rate = cryptoCurrency === 'TON' ? 2.5 : cryptoCurrency === 'USDT_TRC20' || cryptoCurrency === 'USDT_ERC20' ? 1 : cryptoCurrency === 'ETH' ? 2500 : 65000;
  const expectedAmount = order.total_amount / rate;
  const walletAddress = c.env.WALLET_ADDRESS_TON || '';

  const payment = await checkPayment(orderId, cryptoCurrency, expectedAmount, walletAddress);

  if (payment.paid) {
    await database.updateOrderStatus(orderId, 'paid', payment.txHash || 'confirmed');
    await database.updatePaymentStatus(orderId, 'paid', payment.txHash);

    const updatedOrder = await database.getOrderById(orderId);
    
    try {
      const bot = new Bot(c.env.BOT_TOKEN);
      await bot.api.sendMessage(
        order.telegram_user_id,
        `✅ Оплата подтверждена!\n\nЗаказ #${orderId}\nСпасибо за покупку!`
      );
    } catch (e) {
      console.error('Failed to notify user:', e);
    }

    return c.json({ status: 'paid', order: updatedOrder });
  }

  return c.json({ status: 'pending', order });
});

router.post('/webhook', async (c) => {
  const body = await c.req.json();
  console.log('Webhook received:', body);
  return c.json({ received: true });
});

export { router as paymentRouter };
