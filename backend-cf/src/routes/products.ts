import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Database } from '../services/database';

const router = new Hono<{ Bindings: Env }>();

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().default('USD'),
  image_url: z.string().optional(),
  category: z.string().optional(),
  stock: z.number().int().default(0),
});

router.get('/', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const products = await database.getAllProducts();
  return c.json(products);
});

router.get('/:id', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const product = await database.getProductById(c.req.param('id'));
  if (!product) return c.json({ error: 'Product not found' }, 404);
  return c.json(product);
});

router.post('/', zValidator('json', productSchema), async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const data = c.req.valid('json');
  const product = await database.createProduct({
    ...data,
    description: data.description || null,
    image_url: data.image_url || null,
    category: data.category || null,
  });
  return c.json(product, 201);
});

router.put('/:id', zValidator('json', productSchema.partial()), async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const data = c.req.valid('json');
  const product = await database.updateProduct(c.req.param('id'), data);
  if (!product) return c.json({ error: 'Product not found' }, 404);
  return c.json(product);
});

router.delete('/:id', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const success = await database.deleteProduct(c.req.param('id'));
  if (!success) return c.json({ error: 'Product not found' }, 404);
  return c.json({ success: true });
});

export { router as productRouter };
