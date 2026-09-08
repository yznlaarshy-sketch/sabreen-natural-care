export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in Shekels (ILS / ₪)
  category: string;
  image: string;
  stock: number;
  hidden: boolean;
  isBestSeller?: boolean;
  createdAt: number; // Timestamp in ms
  volume?: string; // e.g. "100 مل"
  benefits?: string[];
  usage?: string;
  ingredients?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  createdAt: number;
  customerName: string;
  phone: string;
  deliveryZone?: string;
  address: string;
  transferInfo: string;
  receiptImage: string; // Base64 or URL
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  adminNote?: string;
  rejectionReason?: string;
}

export interface StoreSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  walletName?: string;
  walletNumber?: string;
  instagramUrl: string;
  facebookUrl?: string;
  whatsappNumber: string;
  shippingFee: number; // In shekels
  storeName: string;
  storeBio: string;
  phoneContact: string;
  location: string;
  orderHours?: string;
  deliveryAreas?: string;
}

export interface AdminUser {
  username: string;
  passwordHash: string;
  salt: string;
}

export interface Inquiry {
  id: string;
  createdAt: number;
  name: string;
  phone: string;
  message: string;
  status: 'unread' | 'read';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
