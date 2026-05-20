export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  stock: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  telegram_user_id: number;
  telegram_username: string | null;
  items: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_id: string | null;
  payment_url: string | null;
  crypto_currency: string | null;
  paid_amount: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CurrencyInfo {
  currency: string;
  rate: number;
  symbol: string;
}

export interface PaymentResponse {
  order_id: string;
  wallet_address: string;
  memo?: string;
  crypto_amount: string;
  currency: string;
  network: string;
  usd_amount: number;
  rate: number;
  expires_at: string;
}
