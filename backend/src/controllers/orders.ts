import { Request, Response } from 'express';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import {
  CryptoCurrency,
  getSupportedCurrencies,
  getPaymentDetails,
  generateMemo,
} from '../services/crypto';
import { getCryptoRate, getAllRates, convertRubToUsd } from '../services/rates';
import { generateDepositAddress, getNextIndex } from '../services/hd-wallet';

const ORDER_TIMEOUT_MINUTES = 30;

export const orderController = {
  async create(req: Request, res: Response) {
    try {
      const { telegram_user_id, telegram_username, items, total_amount, currency, crypto_currency } = req.body;

      const id = uuidv4();
      const selectedCurrency: CryptoCurrency = (crypto_currency || 'TON') as CryptoCurrency;

      let usdAmount = total_amount;
      if (currency === 'RUB') {
        usdAmount = convertRubToUsd(total_amount);
      }

      const rate = await getCryptoRate(selectedCurrency);
      const cryptoAmount = (usdAmount / rate).toFixed(selectedCurrency === 'BTC' ? 8 : 6);

      const index = getNextIndex(db, selectedCurrency);
      let depositAddress: string | null = null;
      let memo: string | undefined;

      if (selectedCurrency === 'TON') {
        const wallet = getPaymentDetails(selectedCurrency, id, usdAmount);
        depositAddress = wallet?.address || process.env.WALLET_ADDRESS_TON || '';
        memo = generateMemo(id);
      } else {
        const hdAddress = generateDepositAddress(selectedCurrency, index);
        depositAddress = hdAddress.address;
      }

      if (!depositAddress) {
        res.status(400).json({ error: 'Failed to generate deposit address' });
        return;
      }

      const expiresAt = new Date(Date.now() + ORDER_TIMEOUT_MINUTES * 60 * 1000).toISOString();

      db.prepare(`
        INSERT INTO orders (id, telegram_user_id, telegram_username, items, total_amount, currency, status, crypto_currency, expires_at, deposit_address, address_index)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
      `).run(id, telegram_user_id, telegram_username, JSON.stringify(items), usdAmount, currency || 'USD', selectedCurrency, expiresAt, depositAddress, index);

      const network = selectedCurrency === 'TON' ? 'TON' :
                      selectedCurrency === 'USDT_TRC20' ? 'TRON' :
                      selectedCurrency === 'USDT_ERC20' ? 'Ethereum' :
                      selectedCurrency === 'ETH' ? 'Ethereum' : 'Bitcoin';

      res.status(201).json({
        order_id: id,
        wallet_address: depositAddress,
        memo,
        crypto_amount: cryptoAmount,
        currency: selectedCurrency,
        network,
        usd_amount: usdAmount,
        rub_amount: currency === 'RUB' ? total_amount : null,
        rate,
        expires_at: expiresAt,
        address_index: index,
      });
    } catch (error: any) {
      console.error('Order creation error:', error);
      res.status(500).json({ error: error.message || 'Failed to create order' });
    }
  },

  async getSupportedCurrencies(req: Request, res: Response) {
    try {
      const currencies = getSupportedCurrencies();
      const rates = await getAllRates();

      const result = currencies.map(currency => ({
        currency,
        rate: rates[currency] || 1,
        symbol: currency === 'TON' ? 'TON' :
                currency === 'USDT_TRC20' ? 'USDT (TRC20)' :
                currency === 'USDT_ERC20' ? 'USDT (ERC20)' :
                currency === 'ETH' ? 'ETH' : 'BTC',
      }));

      res.json({ currencies: result });
    } catch (error: any) {
      console.error('Get currencies error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getById(req: Request, res: Response) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  },

  getByUser(req: Request, res: Response) {
    const orders = db.prepare('SELECT * FROM orders WHERE telegram_user_id = ? ORDER BY created_at DESC').all(req.params.telegramId);
    res.json(orders);
  },

  async getAll(req: Request, res: Response) {
    try {
      const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
      res.json(orders);
    } catch (error: any) {
      console.error('Get all orders error:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
