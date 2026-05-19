import { Request, Response } from 'express';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

const SERVER_URL = process.env.SERVER_URL || 'https://your-domain.com';

export const productController = {
  getAll(_req: Request, res: Response) {
    const products = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC').all();
    res.json(products);
  },

  getById(req: Request, res: Response) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  },

  create(req: Request, res: Response) {
    const { name, description, price, currency, category, stock } = req.body;
    const id = uuidv4();
    const image_url = req.file ? `${SERVER_URL}/uploads/${(req.file as any).filename}` : null;

    db.prepare(`
      INSERT INTO products (id, name, description, price, currency, image_url, category, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || '', price, currency || 'USD', image_url, category || '', stock || 0);

    res.status(201).json({ id, name, description, price, currency: currency || 'USD', image_url, category, stock: stock || 0 });
  },

  update(req: Request, res: Response) {
    const { name, description, price, currency, category, stock, is_active } = req.body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    let image_url = (existing as any).image_url;
    if (req.file) {
      image_url = `${SERVER_URL}/uploads/${(req.file as any).filename}`;
    }

    db.prepare(`
      UPDATE products
      SET name = ?, description = ?, price = ?, currency = ?, image_url = ?, category = ?, stock = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description || '', price, currency || 'USD', image_url, category || '', stock, is_active !== undefined ? is_active : 1, req.params.id);

    res.json({ id: req.params.id, name, description, price, currency: currency || 'USD', image_url, category, stock, is_active: is_active !== undefined ? is_active : 1 });
  },

  delete(req: Request, res: Response) {
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    if ((result as any).changes === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true });
  },
};
