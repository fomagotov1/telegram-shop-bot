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

export class Database {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async getAllProducts(): Promise<Product[]> {
    const result = await this.db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    return (result.results || []) as unknown as Product[];
  }

  async getProductById(id: string): Promise<Product | null> {
    const result = await this.db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
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
    const result = await this.db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
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
}
