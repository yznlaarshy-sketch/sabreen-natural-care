import { Product, Order, StoreSettings, Inquiry, Review, Visitor, Chat } from '../types';

export const API_BASE = '/api';

// Small local snapshots let the storefront remain useful when the connection is slow or briefly offline.
function readLocalCache<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export function getCachedProducts(): Product[] {
  return readLocalCache<Product[]>('sb_public_products_cache') || [];
}

export function getCachedSettings(): StoreSettings | null {
  return readLocalCache<StoreSettings>('sb_store_settings_cache');
}

function writeLocalCache<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    // Avoid filling mobile storage with large product images or base64 data URLs.
    if (serialized.length <= 1_500_000) localStorage.setItem(key, serialized);
  } catch {
    // Storage can be unavailable or full; network requests must still work.
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const cached = readLocalCache<Product[]>('sb_public_products_cache');
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error(`Products request failed: ${res.status}`);
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];
    writeLocalCache('sb_public_products_cache', products);
    return products;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

export async function fetchAdminProducts(token: string): Promise<Product[]> {
  const cached = readLocalCache<Product[]>('sb_admin_products_cache');
  try {
    const res = await fetch(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Admin products request failed: ${res.status}`);
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];
    writeLocalCache('sb_admin_products_cache', products);
    return products;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

export async function fetchSettings(): Promise<StoreSettings> {
  const cached = readLocalCache<StoreSettings>('sb_store_settings_cache');
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error(`Settings request failed: ${res.status}`);
    const data = await res.json();
    if (data.settings) writeLocalCache('sb_store_settings_cache', data.settings);
    return data.settings || cached as StoreSettings;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

export async function submitOrder(orderData: {
  customerName: string;
  phone: string;
  deliveryZone?: string;
  address: string;
  transferInfo: string;
  receiptImage: string;
  items: { productId: string; quantity: number }[];
}): Promise<{ success: boolean; message?: string; error?: string; order?: Order }> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  return res.json();
}

export async function submitInquiry(inquiryData: {
  name: string;
  phone: string;
  message: string;
}): Promise<{ success: boolean; message?: string; error?: string; inquiry?: Inquiry }> {
  const res = await fetch(`${API_BASE}/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inquiryData)
  });
  return res.json();
}

export async function fetchAdminInquiries(token: string): Promise<Inquiry[]> {
  const res = await fetch(`${API_BASE}/admin/inquiries`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.inquiries || [];
}

export async function updateInquiryStatus(
  token: string,
  id: string,
  status: Inquiry['status']
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/inquiries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  return data.success;
}

export async function deleteInquiry(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/inquiries/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.success;
}

export async function adminLogin(username: string, password: string): Promise<{
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
  message?: string;
}> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function fetchAdminOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/admin/orders`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.orders || [];
}

export async function updateOrderStatus(
  token: string,
  id: string,
  updates: { status?: Order['status']; adminNote?: string; rejectionReason?: string }
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  return data.success;
}

export async function deleteOrder(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.success;
}

export async function createProduct(token: string, productData: Partial<Product>): Promise<Product | null> {
  const res = await fetch(`${API_BASE}/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  const data = await res.json();
  return data.product || null;
}

export async function updateProduct(token: string, id: string, productData: Partial<Product>): Promise<Product | null> {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  const data = await res.json();
  return data.product || null;
}

export async function deleteProduct(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.success;
}

export async function uploadPromoVideo(
  token: string,
  fileBase64: string,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/admin/promo-video/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ fileBase64, fileName, mimeType })
  });
  return res.json();
}

export async function updateStoreSettings(token: string, settings: Partial<StoreSettings>): Promise<StoreSettings | null> {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });
  const data = await res.json();
  return data.settings || null;
}

export async function changeAdminCredentials(
  token: string,
  credentials: { currentPassword: string; newUsername?: string; newPassword?: string }
): Promise<{ success: boolean; error?: string; message?: string; username?: string }> {
  const res = await fetch(`${API_BASE}/admin/change-credentials`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(credentials)
  });
  return res.json();
}

export async function fetchCurrentAdminUser(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/admin/current-user`);
    const data = await res.json();
    return data.username || 'sabreen';
  } catch {
    return 'sabreen';
  }
}

// --- Reviews ---

export async function submitReview(reviewData: {
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewData)
  });
  return res.json();
}

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  const res = await fetch(`${API_BASE}/reviews?productId=${encodeURIComponent(productId)}`);
  const data = await res.json();
  return data.reviews || [];
}

export async function fetchAdminReviews(token: string): Promise<Review[]> {
  const res = await fetch(`${API_BASE}/admin/reviews`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.reviews || [];
}

export async function updateReviewStatus(
  token: string,
  id: string,
  status: Review['status']
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/reviews/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  return data.success;
}

export async function deleteReview(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/reviews/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.success;
}

// --- Visitors ---

export async function trackVisit(): Promise<void> {
  try {
    await fetch(`${API_BASE}/track-visit`, { method: 'POST' });
  } catch {
    // Silently ignore — visitor tracking should never disrupt the shopping experience
  }
}

export async function fetchAdminVisitors(token: string): Promise<Visitor[]> {
  const res = await fetch(`${API_BASE}/admin/visitors`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.visitors || [];
}

export async function setVisitorBlocked(token: string, ip: string, blocked: boolean): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/visitors/${encodeURIComponent(ip)}/block`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ blocked })
  });
  const data = await res.json();
  return data.success;
}

export async function deleteVisitor(token: string, ip: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/visitors/${encodeURIComponent(ip)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.success;
}

// ---------------- Customer <-> admin chat ----------------
type ChatResult = { success: boolean; error?: string; chat?: Chat; token?: string };

export async function startChat(input: { name: string; phone: string; message: string }): Promise<ChatResult> {
  const res = await fetch(`${API_BASE}/chat/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return res.json();
}

// `status` lets the widget tell "conversation deleted" (404) apart from a network hiccup.
export async function fetchCustomerChat(
  id: string,
  token: string,
  markRead: boolean
): Promise<ChatResult & { status: number }> {
  const res = await fetch(`${API_BASE}/chat/${encodeURIComponent(id)}${markRead ? '?markRead=1' : ''}`, {
    headers: { 'x-chat-token': token }
  });
  const data = await res.json().catch(() => ({ success: false }));
  return { ...data, status: res.status };
}

export async function sendCustomerChatMessage(id: string, token: string, message: string): Promise<ChatResult> {
  const res = await fetch(`${API_BASE}/chat/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-chat-token': token },
    body: JSON.stringify({ message })
  });
  return res.json();
}

export async function fetchAdminChats(token: string): Promise<Chat[]> {
  const res = await fetch(`${API_BASE}/admin/chats`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.chats || [];
}

export async function sendAdminChatMessage(token: string, id: string, message: string): Promise<ChatResult> {
  const res = await fetch(`${API_BASE}/admin/chats/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message })
  });
  return res.json();
}

export async function markAdminChatRead(token: string, id: string): Promise<void> {
  await fetch(`${API_BASE}/admin/chats/${encodeURIComponent(id)}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function deleteAdminChat(token: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/chats/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return Boolean(data.success);
}

// --- Order tracking (public) ---

export interface TrackedOrder {
  id: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  totalAmount: number;
  itemsCount: number;
  items: { productName: string; quantity: number }[];
  adminNote: string;
  rejectionReason: string;
}

export async function trackOrder(
  orderId: string,
  phone: string
): Promise<{ success: boolean; error?: string; order?: TrackedOrder }> {
  const res = await fetch(`${API_BASE}/orders/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, phone })
  });
  return res.json();
}

// --- Product statistics ---

// Fire-and-forget counter: never blocks or breaks the storefront if it fails.
export function trackProductEvent(productId: string, event: 'view' | 'cart' | 'link'): void {
  try {
    fetch(`${API_BASE}/products/${encodeURIComponent(productId)}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
      keepalive: true
    }).catch(() => {});
  } catch {}
}

export interface ProductStatRow {
  productId: string;
  views: number;
  linkVisits: number;
  cartAdds: number;
  unitsSold: number;
  revenue: number;
}

export async function fetchAdminStats(token: string): Promise<ProductStatRow[]> {
  const res = await fetch(`${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.stats || [];
}

// --- Backup ---

// Downloads the full store backup as a JSON file in the browser.
export async function downloadBackup(token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/backup`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return false;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sabreen-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}
