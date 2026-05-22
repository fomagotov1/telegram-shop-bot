export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  url: string;
  type: string;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  telegram_user_id: number;
  telegram_username: string | null;
  items: string;
  total_amount: number;
  currency: string;
  status: string;
  crypto_currency: string;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  currency: string;
  address: string;
  memo: string | null;
  amount: string;
  network: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  order_id: string | null;
  telegram_user_id: number;
  telegram_username: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProductLocation {
  id: string;
  product_id: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

export interface OrderLocation {
  id: string;
  order_id: string;
  location_id: string;
  created_at: string;
}

export class Database {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async getAllProducts(): Promise<Product[]> {
    const result = await this.db.prepare(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM product_locations pl WHERE pl.product_id = p.id AND pl.status = 'available') as stock 
      FROM products p 
      ORDER BY p.created_at DESC
    `).all();
    return (result.results || []) as unknown as Product[];
  }

  async getProductById(id: string): Promise<Product | null> {
    const result = await this.db.prepare(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM product_locations pl WHERE pl.product_id = p.id AND pl.status = 'available') as stock 
      FROM products p 
      WHERE p.id = ?
    `).bind(id).first();
    return result as Product | null;
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const id = crypto.randomUUID();
    await this.db.prepare(
      'INSERT INTO products (id, name, description, price, currency, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, product.name, product.description, product.price, product.currency, product.image_url, product.category, product.stock).run();
    return { ...product, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
    if (fields.length === 0) return null;
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    
    await this.db.prepare(
      `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(...values, id).run();
    
    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    await this.db.prepare('DELETE FROM product_media WHERE product_id = ?').bind(id).run();
    await this.db.prepare('DELETE FROM product_locations WHERE product_id = ?').bind(id).run();
    const result = await this.db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    return result.success;
  }

  async getProductMedia(productId: string): Promise<ProductMedia[]> {
    const result = await this.db.prepare(
      'SELECT * FROM product_media WHERE product_id = ? ORDER BY sort_order ASC'
    ).bind(productId).all();
    return (result.results || []) as unknown as ProductMedia[];
  }

  async addProductMedia(media: Omit<ProductMedia, 'id' | 'created_at'>): Promise<ProductMedia> {
    const id = crypto.randomUUID();
    await this.db.prepare(
      'INSERT INTO product_media (id, product_id, url, type, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, media.product_id, media.url, media.type, media.sort_order).run();
    return { ...media, id, created_at: new Date().toISOString() };
  }

  async deleteProductMedia(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM product_media WHERE id = ?').bind(id).run();
    return result.success;
  }

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    const id = crypto.randomUUID();
    await this.db.prepare(
      'INSERT INTO orders (id, telegram_user_id, telegram_username, items, total_amount, currency, status, crypto_currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, order.telegram_user_id, order.telegram_username, order.items, order.total_amount, order.currency, order.status, order.crypto_currency).run();
    return { ...order, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Order;
  }

  async getOrderById(id: string): Promise<Order | null> {
    const result = await this.db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
    return result as Order | null;
  }

  async updateOrderStatus(id: string, status: string, paymentId?: string): Promise<Order | null> {
    await this.db.prepare(
      'UPDATE orders SET status = ?, payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(status, paymentId || null, id).run();
    return this.getOrderById(id);
  }

  async createPayment(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
    const id = crypto.randomUUID();
    await this.db.prepare(
      'INSERT INTO payments (id, order_id, currency, address, memo, amount, network, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, payment.order_id, payment.currency, payment.address, payment.memo, payment.amount, payment.network, payment.status).run();
    return { ...payment, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Payment;
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    const result = await this.db.prepare('SELECT * FROM payments WHERE order_id = ?').bind(orderId).first();
    return result as Payment | null;
  }

  async updatePaymentStatus(id: string, status: string, txHash?: string): Promise<Payment | null> {
    await this.db.prepare(
      'UPDATE payments SET status = ?, tx_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(status, txHash || null, id).run();
    const result = await this.db.prepare('SELECT * FROM payments WHERE id = ?').bind(id).first();
    return result as Payment | null;
  }

  async cancelOrder(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      "UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(id).run();
    await this.releaseOrderLocations(id);
    return result.success;
  }

  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>): Promise<SupportTicket> {
    const id = crypto.randomUUID();
    await this.db.prepare(
      'INSERT INTO support_tickets (id, order_id, telegram_user_id, telegram_username, message, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, ticket.order_id, ticket.telegram_user_id, ticket.telegram_username, ticket.message, ticket.status).run();
    return { ...ticket, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as SupportTicket;
  }

  async getTicketsByUser(telegramUserId: number): Promise<SupportTicket[]> {
    const result = await this.db.prepare(
      'SELECT * FROM support_tickets WHERE telegram_user_id = ? ORDER BY created_at DESC'
    ).bind(telegramUserId).all();
    return (result.results || []) as unknown as SupportTicket[];
  }

  async getOrdersByUser(telegramUserId: number): Promise<Order[]> {
    const result = await this.db.prepare(
      "SELECT * FROM orders WHERE telegram_user_id = ? ORDER BY created_at DESC"
    ).bind(telegramUserId).all();
    return (result.results || []) as unknown as Order[];
  }

  // Location Methods
  
  async getProductLocations(productId: string): Promise<ProductLocation[]> {
    const result = await this.db.prepare(
      'SELECT * FROM product_locations WHERE product_id = ? ORDER BY created_at DESC'
    ).bind(productId).all();
    return (result.results || []) as unknown as ProductLocation[];
  }

  async addProductLocation(location: Omit<ProductLocation, 'id' | 'created_at' | 'status'>): Promise<ProductLocation> {
    const id = crypto.randomUUID();
    await this.db.prepare(
      'INSERT INTO product_locations (id, product_id, latitude, longitude, status) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, location.product_id, location.latitude, location.longitude, 'available').run();
    return { ...location, id, status: 'available', created_at: new Date().toISOString() };
  }

  async deleteProductLocation(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM product_locations WHERE id = ?').bind(id).run();
    return result.success;
  }

  async reserveLocationsForOrder(orderId: string, productId: string, count: number): Promise<boolean> {
    const available = await this.db.prepare(
      'SELECT id FROM product_locations WHERE product_id = ? AND status = ? LIMIT ?'
    ).bind(productId, 'available', count).all();
    
    if (!available.results || available.results.length < count) {
      return false; // Not enough stock
    }
    
    const locationIds = available.results.map((r: any) => r.id);
    const statements = [];
    for (const locId of locationIds) {
      statements.push(
        this.db.prepare('UPDATE product_locations SET status = ? WHERE id = ?').bind('reserved', locId)
      );
      const orderLocId = crypto.randomUUID();
      statements.push(
        this.db.prepare('INSERT INTO order_locations (id, order_id, location_id) VALUES (?, ?, ?)')
        .bind(orderLocId, orderId, locId)
      );
    }
    
    await this.db.batch(statements);
    return true;
  }

  async markOrderLocationsAsSold(orderId: string): Promise<void> {
    await this.db.prepare(`
      UPDATE product_locations 
      SET status = 'sold' 
      WHERE id IN (SELECT location_id FROM order_locations WHERE order_id = ?)
    `).bind(orderId).run();
  }

  async releaseOrderLocations(orderId: string): Promise<void> {
    const statements = [
      this.db.prepare(`
        UPDATE product_locations 
        SET status = 'available' 
        WHERE id IN (SELECT location_id FROM order_locations WHERE order_id = ?)
      `).bind(orderId),
      this.db.prepare('DELETE FROM order_locations WHERE order_id = ?').bind(orderId)
    ];
    await this.db.batch(statements);
  }

  async getOrderLocations(orderId: string): Promise<ProductLocation[]> {
    const result = await this.db.prepare(`
      SELECT pl.* 
      FROM product_locations pl
      JOIN order_locations ol ON pl.id = ol.location_id
      WHERE ol.order_id = ?
    `).bind(orderId).all();
    return (result.results || []) as unknown as ProductLocation[];
  }
}
