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

router.get('/:id/media', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const media = await database.getProductMedia(c.req.param('id'));
  return c.json(media);
});

router.post('/:id/media', zValidator('json', z.object({
  url: z.string().min(1),
  type: z.enum(['image', 'video']).default('image'),
  sort_order: z.number().int().default(0),
})), async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const data = c.req.valid('json');
  const media = await database.addProductMedia({
    product_id: c.req.param('id'),
    url: data.url,
    type: data.type,
    sort_order: data.sort_order,
  });
  return c.json(media, 201);
});

router.delete('/media/:mediaId', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const success = await database.deleteProductMedia(c.req.param('mediaId'));
  if (!success) return c.json({ error: 'Media not found' }, 404);
  return c.json({ success: true });
});

router.get('/:id/locations', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const locations = await database.getProductLocations(c.req.param('id'));
  return c.json(locations);
});

router.post('/:id/locations', zValidator('json', z.object({
  latitude: z.number(),
  longitude: z.number(),
})), async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const data = c.req.valid('json');
  const location = await database.addProductLocation({
    product_id: c.req.param('id'),
    latitude: data.latitude,
    longitude: data.longitude,
  });
  return c.json(location, 201);
});

router.delete('/locations/:locationId', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const success = await database.deleteProductLocation(c.req.param('locationId'));
  if (!success) return c.json({ error: 'Location not found' }, 404);
  return c.json({ success: true });
});

export { router as productRouter };
