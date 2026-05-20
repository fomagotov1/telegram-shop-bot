import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { productRouter } from './routes/products';
import { orderRouter } from './routes/orders';
import { paymentRouter } from './routes/payments';
import { setupBot } from './bot';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.route('/api/products', productRouter);
app.route('/api/orders', orderRouter);
app.route('/api/payments', paymentRouter);

if (typeof process !== 'undefined' && process.env.BOT_TOKEN) {
  setupBot(app, process.env.BOT_TOKEN, process.env.SERVER_URL || '');
}

export default app;
