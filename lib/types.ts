export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_path: string | null;
  created_at: string;
}

export interface VerifiedDevice {
  id: number;
  device_id: string;
  name: string;
  phone: string;
  verified_at: string;
}

export interface Inquiry {
  id: number;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  product_id: number;
  created_at: string;
}

export interface CustomerSession {
  deviceId: string;
  name: string;
  phone: string;
  verified: boolean;
}

export interface OwnerMessage {
  id: number;
  type: 'verification' | 'inquiry';
  title: string;
  content: string;
  metadata: string | null;
  is_read: number;
  created_at: string;
}
