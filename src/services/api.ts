import { Product, Order, StoreSettings } from '../types';

export const API_BASE = '/api';

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`);
  const data = await res.json();
  return data.products || [];
}

export async function fetchAdminProducts(token: string): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.products || [];
}

export async function fetchSettings(): Promise<StoreSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  const data = await res.json();
  return data.settings;
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

