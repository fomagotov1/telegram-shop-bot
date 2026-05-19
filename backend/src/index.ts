import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './db';
import { productRouter } from './routes/products';
import { orderRouter } from './routes/orders';
import { paymentRouter } from './routes/payments';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Init database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/payments', paymentRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start bot only if token is set
if (process.env.BOT_TOKEN) {
  import('./bot').then(({ bot }) => {
    bot.launch();
    console.log('Bot started');
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  });
} else {
  console.log('Bot not started (BOT_TOKEN not set)');
}
