import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { productRouter } from './routes/products';
import { orderRouter } from './routes/orders';
import { paymentRouter } from './routes/payments';
import { supportRouter } from './routes/support';
import { setupBot } from './bot';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.use('/api/*', async (c, next) => {
  await next();
  c.res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  c.res.headers.set('Pragma', 'no-cache');
  c.res.headers.set('Expires', '0');
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.route('/api/products', productRouter);
app.route('/api/orders', orderRouter);
app.route('/api/payments', paymentRouter);
app.route('/api/support', supportRouter);

setupBot(app);

export default app;
