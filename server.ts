import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { Product, Order, StoreSettings } from './src/types';

// Persistent store state is kept in Supabase.
// IMPORTANT: SUPABASE_SERVICE_ROLE_KEY is a server-only secret. Never expose it in the browser.
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the hosting environment.'
  );
}

async function supabaseRequest(pathname: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Trust reverse proxy (e.g. Cloud Run, Nginx) for accurate client IP identification
app.set('trust proxy', 1);

// Enable JSON & urlencoded parser
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Strict Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const lowerUrl = req.url.toLowerCase();
  if (
    lowerUrl.includes('.env') ||
    lowerUrl.includes('.git') ||
    lowerUrl.includes('full_source_code') ||
    lowerUrl.includes('dr-sabreen-store-code') ||
    lowerUrl.includes('store_data') ||
    lowerUrl.includes('admin_sessions')
  ) {
    return res.status(403).json({ error: 'Access Denied' });
  }

  next();
});

// Helper for string sanitization and XSS prevention
function sanitizeString(str: any, maxLength = 300): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

// Sessions are intentionally kept separate from store data. Store data itself is NOT stored on disk.
const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'admin_sessions.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let runtimeStoreData: StoreData | null = null;

async function loadStoreDataFromSupabase(): Promise<StoreData | null> {
  const rows = await supabaseRequest('store_state?id=eq.1&select=data');
  return Array.isArray(rows) && rows[0]?.data ? (rows[0].data as StoreData) : null;
}

async function saveStoreDataToSupabase(data: StoreData): Promise<void> {
  await supabaseRequest('store_state', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: 1, data }),
  });
}

function createInitialStoreData(): StoreData {
  // Preserve the exact store state from the project when Supabase is empty.
  // This file is server-side only and is never exposed as a public asset.
  try {
    const seedFile = path.join(process.cwd(), 'data', 'store_seed.json');
    if (fs.existsSync(seedFile)) {
      const seeded = JSON.parse(fs.readFileSync(seedFile, 'utf-8')) as StoreData;
      if (seeded && Array.isArray(seeded.products) && seeded.settings && seeded.admin) {
        return seeded;
      }
    }
  } catch (e) {
    console.error('Could not load store seed; using built-in defaults:', e);
  }

  return {
    products: initialProducts,
    orders: [],
    settings: defaultSettings,
    admin: { username: 'sabreen', salt: defaultAdminSalt, passwordHash: defaultAdminHash }
  };
}

function getStoreData(): StoreData {
  if (!runtimeStoreData) {
    throw new Error('Store data has not been initialized yet.');
  }
  return runtimeStoreData;
}

async function saveStoreData(data: StoreData): Promise<void> {
  runtimeStoreData = data;
  await saveStoreDataToSupabase(data);
}

async function initializePersistence(): Promise<void> {
  const remote = await loadStoreDataFromSupabase();
  if (remote) {
    runtimeStoreData = remote;
    console.log('Persistence: Supabase (existing store state loaded)');
    return;
  }

  const initialData = createInitialStoreData();
  await saveStoreDataToSupabase(initialData);
  runtimeStoreData = initialData;
  console.log('Persistence: Supabase (initial store state created)');
}

// Order submission anti-spam rate limiting (max 10 orders per 15 min per IP)
interface OrderRateLimit {
  count: number;
  resetTime: number;
}
const orderRateLimits = new Map<string, OrderRateLimit>();

function isOrderRateLimited(ip: string): boolean {
  const now = Date.now();
  const limit = orderRateLimits.get(ip);
  if (!limit || now > limit.resetTime) {
    orderRateLimits.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return false;
  }
  if (limit.count >= 10) {
    return true;
  }
  limit.count += 1;
  return false;
}// Security & Brute-force protection tracking
interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}
const loginAttempts = new Map<string, LoginAttempt>();

interface AdminSession {
  token: string;
  createdAt: number;
  lastActive: number;
  username: string;
  ip: string;
}

// Load persisted sessions across restarts
function loadSessions(): Map<string, AdminSession> {
  const map = new Map<string, AdminSession>();
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const list = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      if (Array.isArray(list)) list.forEach((session: AdminSession) => { if (session.token) map.set(session.token, session); });
    }
  } catch (e) { console.error('Error loading sessions from disk:', e); }
  return map;
}

const activeAdminSessions = loadSessions();

function saveSessions() {
  try { fs.writeFileSync(SESSIONS_FILE, JSON.stringify(Array.from(activeAdminSessions.values()), null, 2), 'utf-8'); }
  catch (e) { console.error('Error saving sessions to disk:', e); }
}

// High-security password hashing with PBKDF2 (100,000 rounds of sha512)
function hashPassword(password: string, salt: string, iterations = 100000): string {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
}

// Timing-safe password verification preventing timing side-channel attacks
function verifyPassword(providedPassword: string, salt: string, storedHash: string): boolean {
  if (!providedPassword || !salt || !storedHash) return false;
  try {
    // Check 100,000 iterations (standard)
    const hash100k = hashPassword(providedPassword, salt, 100000);
    const buf100k = Buffer.from(hash100k, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (buf100k.length === storedBuf.length && crypto.timingSafeEqual(buf100k, storedBuf)) {
      return true;
    }
    // Backward compatibility for legacy initial seed (10,000 iterations)
    const hash10k = hashPassword(providedPassword, salt, 10000);
    const buf10k = Buffer.from(hash10k, 'hex');
    if (buf10k.length === storedBuf.length && crypto.timingSafeEqual(buf10k, storedBuf)) {
      return true;
    }
  } catch (err) {
    console.error('Password verification error:', err);
  }
  return false;
}  {
    id: 'prod-7',
    name: 'صابونة حليب الماعز والعسل الطبيعي',
    description: 'صابون فائق النعومة مخصص للبشرة الجافة والحساسة والطفولية، غني بأحماض ألفا هيدروكسي الطبيعية من حليب الماعز الطازج والعسل الجبلي الصافي.',
    price: 40,
    category: 'صابون',
    image: 'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=800&q=80',
    stock: 22,
    hidden: false,
    isBestSeller: false,
    createdAt: now - ONE_DAY * 1, // 1 day ago -> New!
    volume: '130 غرام',
    benefits: ['تقشير خفيف وترطيب لطيف جداً', 'تهدئة التحسس والاحمرار', 'توازن حموضة البشرة (pH)'],
    usage: 'مناسبة للاستخدام اليومي للوجه والجسم للأطفال والكبار.',
    ingredients: 'حليب ماعز طازج، عسل جبلي نقي، زيت زيتون، زيت جوز هند، زبدة شيا.'
  },
  {
    id: 'prod-8',
    name: 'ماسك الطين المغربي الأخضر لتنقية المسام',
    description: 'قناع بودرة الطين البركاني الطبيعي المعزز بمستخلص الشاي الأخضر وزيت شجرة الشاي. يمتص الدهون الزائدة وينظف الرؤوس السوداء والشوائب بفعالية.',
    price: 60,
    category: 'مقشرات وأقنعة',
    image: 'https://images.unsplash.com/photo-1567928815116-f2882f056c70?auto=format&fit=crop&w=800&q=80',
    stock: 16,
    hidden: false,
    isBestSeller: false,
    createdAt: now - ONE_DAY * 12,
    volume: '150 غرام',
    benefits: ['تنقية عميقة وقبض للمسام الواسعة', 'التحكم في إفراز الدهون وتجفيف الحبوب', 'إشراقة وانتعاش فوري'],
    usage: 'تُخلط ملعقة من الطين مع ماء الورد أو الزبادي، يوضع على الوجه 10 دقائق ثم يُشطف قبل أن يجف تماماً.',
    ingredients: 'طين أخضر مغربي نقي 100%، بودرة أوراق الشاي الأخضر، خلاصة زيت شجرة الشاي النقي.'
  }
];

const defaultSettings: StoreSettings = {
  bankName: 'بنك فلسطين، كافة البنوك، محافظ جوال باي (Jawwal Pay)، بال باي (PalPay) وجميع المحافظ',
  accountNumber: '1234567 / محفظة جوال باي أو بال باي: 0597096510',
  accountHolder: 'د. صابرين بشير - Sabreen Basheer Natural Care',
  walletName: 'جوال باي (Jawwal Pay)، بال باي (PalPay)، ريفلكت أو أي محفظة إلكترونية',
  walletNumber: '0597096510',
  instagramUrl: 'https://www.instagram.com/dr.sabreenbasheer?igsi=bzdiczhjNWYxenQ3',
  facebookUrl: 'https://www.facebook.com/dr.sabreenbasheer',
  whatsappNumber: '+972 59-709-6510',
  shippingFee: 0, // رسوم التوصيل يحددها مندوب الدليفري عند الاستلام
  storeName: 'د. صابرين بشير للعناية الطبيعية | Sabreen Basheer',
  storeBio: 'منتجات طبيعية 100% مستخلصة بعناية وحرفية فائقة، خالية من المواد الكيميائية الضارة، لبشرة صحية ومشرقة وجمال طبيعي متألق.',
  phoneContact: '0597096510',
  location: 'داخل قطاع غزة والجنوب فقط حالياً',
  orderHours: 'في أي وقت طوال اليوم (24/7 على مدار الساعة)',
  deliveryAreas: 'مدينة غزة، المنطقة الوسطى (دير البلح، النصيرات، الزوايدة، البريج، المغازي)، خانيونس، ورفح والمواصي'
};

// Default admin account
const defaultAdminSalt = '7c28cf325f8cea992abf1955785cfbbd538d394789ff25a78927e0fbfd804a0c';
const defaultAdminPassword = 'Sabreen@2026'; // New default password
const defaultAdminHash = '7dbf329c7c707d4bcd9b11ce1561737c5a09e47e0ac595b8d2f1c6b539ddca0416d8890c3558797bd1d01f3ad05bddb5e280e5491ebeeba2a7777c23612b9985';

interface StoreData {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  admin: {
    username: string;
    salt: string;
    passwordHash: string;
  };
}

// Middleware: Admin Auth check with session validation
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query?.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'غير مصرح بالدخول، يرجى تسجيل الدخول كمدير' });
  }
  const session = activeAdminSessions.get(token);
  if (!session) {
    return res.status(401).json({ success: false, error: 'جلسة التسجيل منتهية، يرجى تسجيل الدخول مجدداً' });
  }

  // Session lifespan: 30 days of persistent validity
  const MAX_SESSION_LIFESPAN_MS = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - session.createdAt > MAX_SESSION_LIFESPAN_MS) {
    activeAdminSessions.delete(token);
    saveSessions();
    return res.status(401).json({ success: false, error: 'انتهت مدة الجلسة، يرجى تسجيل الدخول مجدداً.' });
  }

  // Update activity timestamp
  session.lastActive = Date.now();
  saveSessions();
  next();
}

// --- PUBLIC & API ROUTES ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 2. Get all active/visible products for customers (or all for admin if authorized)
app.get('/api/products', (req, res) => {
  const data = getStoreData();
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const isAdmin = Boolean(token && activeAdminSessions.has(token));
  
  if (isAdmin) {
    return res.json({ success: true, products: data.products });
  }

  // Customers see non-hidden products
  const customerProducts = data.products.filter(p => !p.hidden);
  res.json({ success: true, products: customerProducts });
});

// 3. Get Store Settings
app.get('/api/settings', (req, res) => {
  const data = getStoreData();
  res.json({ success: true, settings: data.settings });
});

// 4. Submit Order (Customer Checkout with anti-spam & sanitization)
app.post('/api/orders', async (req, res) => {
  const clientIp = ((req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()) || req.socket.remoteAddress || 'unknown';

  // Anti-spam rate limiting: max 10 orders per 15 minutes
  if (isOrderRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'تم تجاوز الحد الأقصى لإرسال الطلبات مؤقتاً، يرجى الانتظار بضع دقائق قبل إرسال طلب جديد.'
    });
  }

  const { customerName, phone, deliveryZone, address, transferInfo, receiptImage, items } = req.body;

  // Validation
  if (!customerName || !phone || !address || !transferInfo || !receiptImage || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'جميع الحقول مطلوبة مع رفع صورة إثبات التحويل.'
    });
  }

  // Image receipt format and size validation
  if (typeof receiptImage !== 'string' || (!receiptImage.startsWith('data:image/') && !receiptImage.startsWith('http'))) {
    return res.status(400).json({
      success: false,
      error: 'صيغة صورة إثبات التحويل غير صالحة. يرجى رفع صورة بصيغة JPG أو PNG.'
    });
  }
  if (receiptImage.length > 15 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      error: 'حجم صورة الإشعار كبير جداً (الحد الأقصى 10 ميجابايت).'
    });
  }

  // Sanitize and constrain input field lengths
  const cleanName = sanitizeString(customerName, 80);
  const cleanPhone = sanitizeString(phone, 30);
  const cleanZone = sanitizeString(deliveryZone || 'داخل قطاع غزة والجنوب', 60);
  const cleanAddress = sanitizeString(address, 300);
  const cleanTransferInfo = sanitizeString(transferInfo, 300);

  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال اسم صحيح لا يقل عن حرفين' });
  }
  if (!cleanPhone || cleanPhone.length < 7) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال رقم هاتف صحيح للتواصل' });
  }

  const data = getStoreData();

  // Calculate total with strict validation  await saveStoreData(data);
  res.json({ success: true, message: 'تم حذف الطلب بنجاح من السجل' });
});

// Admin: Add new product
app.post('/api/admin/products', requireAdminAuth, async (req, res) => {
  const { name, description, price, category, image, stock, volume, ingredients, usage, isBestSeller } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ success: false, error: 'اسم المنتج، السعر والتصنيف حقول مطلوبة' });
  }

  const data = getStoreData();
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: name.trim(),
    description: description?.trim() || '',
    price: Number(price),
    category: category.trim(),
    image: image || 'https://images.unsplash.com/photo-1608248597359-46700c25a58a?auto=format&fit=crop&w=800&q=80',
    stock: stock !== undefined ? Number(stock) : 10,
    hidden: false,
    isBestSeller: Boolean(isBestSeller),
    createdAt: Date.now(), // Auto new badge for 7 days
    volume: volume?.trim(),
    ingredients: ingredients?.trim(),
    usage: usage?.trim()
  };

  data.products.unshift(newProduct);
  await saveStoreData(data);

  res.status(201).json({ success: true, product: newProduct });
});

// Admin: Edit product or toggle hidden
app.put('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const data = getStoreData();
  const prodIndex = data.products.findIndex(p => p.id === id);

  if (prodIndex === -1) {
    return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
  }

  const existing = data.products[prodIndex];
  data.products[prodIndex] = {
    ...existing,
    ...req.body,
    id: existing.id, // prevent ID change
    createdAt: existing.createdAt // preserve creation date for new badge
  };

  await saveStoreData(data);
  res.json({ success: true, product: data.products[prodIndex] });
});

// Admin: Delete product permanently
app.delete('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const data = getStoreData();
  const initialLength = data.products.length;
  data.products = data.products.filter(p => p.id !== id);

  if (data.products.length === initialLength) {
    return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
  }

  await saveStoreData(data);
  res.json({ success: true, message: 'تم حذف المنتج نهائياً' });
});

// Admin: Update store settings (Bank, account, WhatsApp, Instagram, etc.)
app.put('/api/admin/settings', requireAdminAuth, async (req, res) => {
  const data = getStoreData();
  data.settings = {
    ...data.settings,
    ...req.body
  };
  await saveStoreData(data);
  res.json({ success: true, settings: data.settings });
});

// Admin: Change credentials (username and/or password) with high-strength validation
app.put('/api/admin/change-credentials', requireAdminAuth, async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ success: false, error: 'يجب إدخال كلمة السر الحالية للتأكيد الأمني' });
  }

  const data = getStoreData();
  const isCurrentValid = verifyPassword(currentPassword, data.admin.salt, data.admin.passwordHash);

  if (!isCurrentValid) {
    return res.status(400).json({ success: false, error: 'كلمة السر الحالية غير صحيحة' });
  }

  // Username update
  if (newUsername !== undefined && newUsername.trim() !== '') {
    const trimmedUser = newUsername.trim();
    if (trimmedUser.length < 3) {
      return res.status(400).json({ success: false, error: 'اسم المستخدم الجديد يجب أن يتكون من 3 أحرف على الأقل' });
    }
    data.admin.username = trimmedUser;
  }

  // Password update (at least 4 characters)
  if (newPassword !== undefined && newPassword.trim() !== '') {
    const trimmedPass = newPassword.trim();
    if (trimmedPass.length < 4) {
      return res.status(400).json({ success: false, error: 'كلمة السر الجديدة يجب أن تكون 4 خانات على الأقل' });
    }

    // Generate fresh cryptographic 32-byte salt and 100,000 PBKDF2 sha512 iterations
    const newSalt = crypto.randomBytes(32).toString('hex');
    data.admin.salt = newSalt;
    data.admin.passwordHash = hashPassword(trimmedPass, newSalt, 100000);
  }

  // Save permanently in Supabase
  await saveStoreData(data);

  // Keep current active session updated with new username
  const authHeader = req.headers.authorization;
  const currentToken = authHeader?.split(' ')[1];
  if (currentToken && activeAdminSessions.has(currentToken)) {
    const sess = activeAdminSessions.get(currentToken)!;
    sess.username = data.admin.username;
    saveSessions();
  }

  res.json({
    success: true,
    message: 'تم حفظ وتحديث بيانات الأمان وكلمة المرور الجديدة بنجاح في قاعدة البيانات',
    username: data.admin.username
  });
});

// --- VITE & STATIC FILES ---
async function startServer() {
  await initializePersistence();
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sabreen Basheer Natural Care server running on port ${PORT}`);
  });
}

startServer();
