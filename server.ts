import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { Product, Order, StoreSettings, Inquiry, Review, Visitor } from './src/types';

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

// --- Supabase Storage helpers (used for uploaded promo video files) ---
// Storage keeps large binary files out of the store_state JSON blob, which
// must stay small since it is read/written on nearly every request.
const PROMO_MEDIA_BUCKET = 'promo-media';
let promoMediaBucketReady = false;

async function ensurePromoMediaBucket(): Promise<void> {
  if (promoMediaBucketReady) return;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: PROMO_MEDIA_BUCKET, name: PROMO_MEDIA_BUCKET, public: true }),
  });
  // A 400/409 here just means the bucket already exists from a previous run — that's fine.
  if (res.ok || res.status === 400 || res.status === 409) {
    promoMediaBucketReady = true;
    return;
  }
  throw new Error(`Failed to prepare storage bucket: ${res.status} ${await res.text()}`);
}

async function uploadPromoVideoFile(fileName: string, contentType: string, fileBuffer: Buffer): Promise<string> {
  await ensurePromoMediaBucket();
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${PROMO_MEDIA_BUCKET}/${safeName}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });
  if (!res.ok) throw new Error(`Storage upload failed: ${res.status} ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${PROMO_MEDIA_BUCKET}/${safeName}`;
}

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Trust reverse proxy (e.g. Cloud Run, Nginx) for accurate client IP identification
app.set('trust proxy', 1);

// Enable JSON & urlencoded parser
// Limit raised from 25mb to accommodate base64-encoded promo video uploads
// (admin-only, authenticated route) alongside the existing receipt images.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Extracts the real client IP, honoring the reverse proxy (Render/Nginx) as configured above
function getClientIp(req: Request): string {
  return ((req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()) || req.socket.remoteAddress || 'unknown';
}

// Blocks visitors the admin has marked as blocked (by IP). Admin routes are
// exempt so a mistaken self-block can never lock the owner out of the dashboard.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/admin')) return next();

  let data: StoreData | null = null;
  try {
    data = getStoreData();
  } catch {
    return next(); // Store not initialized yet (startup race) — fail open.
  }

  const ip = getClientIp(req);
  const visitor = data.visitors.find(v => v.ip === ip);
  if (visitor?.blocked) {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ success: false, error: 'تم حظر الوصول لهذا الموقع من هذا الجهاز.' });
    }
    return res.status(403).send('<html dir="rtl"><body style="font-family:sans-serif;text-align:center;padding:60px 20px;"><h2>تم حظر الوصول</h2><p>لا يمكنك الوصول لهذا الموقع من هذا الجهاز.</p></body></html>');
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
        if (!Array.isArray(seeded.inquiries)) seeded.inquiries = [];
        if (!Array.isArray(seeded.reviews)) seeded.reviews = [];
        if (!Array.isArray(seeded.visitors)) seeded.visitors = [];
        return seeded;
      }
    }
  } catch (e) {
    console.error('Could not load store seed; using built-in defaults:', e);
  }

  return {
    products: initialProducts,
    orders: [],
    inquiries: [],
    reviews: [],
    visitors: [],
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
    // Backward-compatibility: older store states saved before the inquiries
    // feature existed won't have this field yet.
    if (!Array.isArray(remote.inquiries)) remote.inquiries = [];
    if (!Array.isArray(remote.reviews)) remote.reviews = [];
    if (!Array.isArray(remote.visitors)) remote.visitors = [];
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
}

// Inquiry submission anti-spam rate limiting (max 10 inquiries per 15 min per IP)
const inquiryRateLimits = new Map<string, OrderRateLimit>();

function isInquiryRateLimited(ip: string): boolean {
  const now = Date.now();
  const limit = inquiryRateLimits.get(ip);
  if (!limit || now > limit.resetTime) {
    inquiryRateLimits.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return false;
  }
  if (limit.count >= 10) {
    return true;
  }
  limit.count += 1;
  return false;
}

// Security & Brute-force protection tracking
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
}

// Initial default products
const now = Date.now();
const ONE_DAY = 24 * 60 * 60 * 1000;

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'صابون الغار وزيت الزيتون العضوي',
    description: 'صابون بلدي تقليدي فاخر مصنوع على البارد من أجود أنواع زيت الزيتون الفلسطيني النقي وخلاصة ورق الغار الطبيعي. ينظف بلطف ويغذي البشرة الجافة والحساسة.',
    price: 35,
    category: 'صابون',
    image: 'https://images.unsplash.com/photo-1607006314594-ef8879685162?auto=format&fit=crop&w=800&q=80',
    stock: 25,
    hidden: false,
    isBestSeller: true,
    createdAt: now - ONE_DAY * 2, // 2 days ago -> New!
    volume: '150 غرام',
    benefits: ['مرطب عميق للبشرة', 'مناسب للبشرة الحساسة والإكزيما', 'خالٍ من العطور الصناعية والكيماويات'],
    usage: 'يُدلك على بشرة مبللة حتى تتكون رغوة غنية وناعمة، ثم يُشطف بالماء الفاتر.',
    ingredients: 'زيت زيتون بكر ممتاز، زيت غار نقي، هيدروكسيد الصوديوم، ماء مقطر.'
  },
  {
    id: 'prod-2',
    name: 'سيروم الورد الدمشقي وفيتامين C للنضارة',
    description: 'إكسير نضارة مكثف غني بمستخلص الورد الدمشقي العضوي مع فيتامين C الطبيعي من ثمار الورد. يوحد لون البشرة ويمنحها إشراقة وتوهجاً مخملياً.',
    price: 110,
    category: 'كريمات',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    stock: 18,
    hidden: false,
    isBestSeller: true,
    createdAt: now - ONE_DAY * 1, // 1 day ago -> New!
    volume: '30 مل',
    benefits: ['تفتيح وتوحيد لون البشرة', 'مقاومة الخطوط الرفيعة والتصبغات', 'ترطيب عميق وسريع الامتصاص'],
    usage: 'توضع 3-4 قطرات على الوجه والرقبة النظيفين صباحاً ومساءً قبل المرطب.',
    ingredients: 'ماء الورد الدمشقي، زيت بذور ثمار الورد، حمض الهيالورونيك النباتي، فيتامين C المستقر، فيتامين E.'
  },
  {
    id: 'prod-3',
    name: 'زيت إكليل الجبل والروزماري لإنبات وتكثيف الشعر',
    description: 'تركيبة زيتية طبيعية مركزة بنسبة 100% من زيت إكليل الجبل النقي وزيت الخروع الأسود وزيت الأرغان. يحفز الدورة الدموية في فروة الرأس ويوقف التساقط ويعزز كثافة الشعر.',
    price: 85,
    category: 'زيوت شعر',
    image: 'https://images.unsplash.com/photo-1608248597359-46700c25a58a?auto=format&fit=crop&w=800&q=80',
    stock: 30,
    hidden: false,
    isBestSeller: true,
    createdAt: now - ONE_DAY * 3, // 3 days ago -> New!
    volume: '50 مل',
    benefits: ['تحفيز نمو بصيلات الشعر وإنبات الفراغات', 'تقوية جذور الشعر ومنع التقصف', 'تهدئة حكة وقشرة الرأس'],
    usage: 'توضع قطرات على فروة الرأس وتُدلك بأطراف الأصابع لمدة 5 دقائق. يُترك من ساعتين إلى ليلة كاملة ثم يُغسل.',
    ingredients: 'زيت إكليل الجبل النقي، زيت خروع نقي، زيت جوجوبا، زيت أرغان مغربي، زيت النعناع الفلفلي.'
  },
  {
    id: 'prod-4',
    name: 'زبدة الشيا المخفوقة مع زيت اللوز والفانيليا',
    description: 'زبدة جسم غنية وفاخرة مخفوقة بقوام سحابي ناعم، تذوب فور ملامسة الجلد لتمنح ترطيباً يدوم 48 ساعة مع رائحة فانيليا طبيعية دافئة ومريحة.',
    price: 65,
    category: 'عناية شخصية',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    stock: 20,
    hidden: false,
    isBestSeller: false,
    createdAt: now - ONE_DAY * 10, // Older than 7 days
    volume: '200 مل',
    benefits: ['علاج تشققات وجفاف الجلد الشديد', 'مرونة ونعومة حريرية للجسم', 'آمنة تماماً وطبيعية 100%'],
    usage: 'يُدلك كامل الجسم بعد الاستحمام مباشرة أو عند الحاجة للترطيب المكثف.',
    ingredients: 'زبدة شيا عضوية غير مكررة، زيت اللوز الحلو، زيت جوز الهند البكر، خلاصة الفانيليا الطبيعية.'
  },
  {
    id: 'prod-5',
    name: 'مقشر القهوة العربية والزيوت المغذية للجسم',
    description: 'سكراب طبيعي منعش بحبيبات البن العربي المحمص مع السكر البني وزيت اللوز. يقشر خلايا الجلد الميتة، يحسن مظهر السيلوليت ويترك البشرة ناعمة كالحرير.',
    price: 55,
    category: 'مقشرات وأقنعة',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    hidden: false,
    isBestSeller: false,
    createdAt: now - ONE_DAY * 4, // 4 days ago -> New!
    volume: '250 غرام',
    benefits: ['إزالة الجلد الميت والشعر تحت الجلد', 'تنشيط الدورة الدموية ومقاومة السيلوليت', 'رائحة قهوة منعشة وطاقة للجسم'],
    usage: 'يُفرك بحركات دائرية لطيفة على بشرة رطبة أثناء الاستحمام لمدة 3-5 دقائق ثم يُشطف.',
    ingredients: 'قهوة عربية مطحونة، سكر قصب عضوي، زيت لوز حلو، زيت فيتامين E، زيت قرفة خفيف.'
  },
  {
    id: 'prod-6',
    name: 'كريم الليل المرمم بخلاصة اللبان الذكر وحمض الهيالورونيك',
    description: 'كريم ليلي مجدد للبشرة بخصائص صمغ اللبان الذكر العماني الكولاجينية الطبيعية. يشد البشرة، يقلل الخطوط التعبيرية، ويستعيد حيويتها أثناء النوم.',
    price: 120,
    category: 'كريمات',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    stock: 12,
    hidden: false,
    isBestSeller: true,
    createdAt: now - ONE_DAY * 14,
    volume: '50 مل',
    benefits: ['كولاجين طبيعي لشد وتجديد البشرة', 'تقليل مظهر التجاعيد والتجويفات', 'تغذية ليلية فائقة دون انسداد المسام'],
    usage: 'يُوزع كمية مناسبة على الوجه والرقبة مساءً بحركات تصاعدية لطيفة قبل النوم.',
    ingredients: 'مستخلص لبان الذكر الأصلي، ماء ورد، زيت بذور الرمان، زبدة الكاكاو، حمض الهيالورونيك الطبيعي.'
  },
  {
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
  inquiries: Inquiry[];
  reviews: Review[];
  visitors: Visitor[];
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

  // Calculate total with strict validation
  let totalAmount = 0;
  const verifiedItems = items.slice(0, 50).map((item: any) => {
    const product = data.products.find(p => p.id === item.productId);
    const itemPrice = product ? product.price : (Number(item.price) || 0);
    const quantity = Math.min(Math.max(1, parseInt(item.quantity, 10) || 1), 99);
    totalAmount += itemPrice * quantity;
    return {
      productId: sanitizeString(item.productId, 50),
      productName: product ? product.name : sanitizeString(item.productName || 'منتج', 100),
      price: itemPrice,
      quantity,
      image: product ? product.image : (typeof item.image === 'string' ? item.image.slice(0, 500) : '')
    };
  });

  // Add delivery fee if applicable
  const shippingFee = data.settings.shippingFee || 0;
  const finalTotal = totalAmount + shippingFee;

  const newOrder: Order = {
    id: `SB-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: Date.now(),
    customerName: cleanName,
    phone: cleanPhone,
    deliveryZone: cleanZone,
    address: cleanAddress,
    transferInfo: cleanTransferInfo,
    receiptImage,
    items: verifiedItems,
    totalAmount: finalTotal,
    status: 'pending'
  };

  data.orders.unshift(newOrder);
  await saveStoreData(data);

  res.status(201).json({
    success: true,
    message: 'تم استلام طلبك بنجاح وسنتواصل معك بعد تدقيق التحويل!',
    order: newOrder
  });
});

// Public: Submit a contact inquiry (from the "تواصل" page form)
app.post('/api/inquiries', async (req, res) => {
  const clientIp = ((req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()) || req.socket.remoteAddress || 'unknown';

  if (isInquiryRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'تم تجاوز الحد الأقصى لإرسال الاستفسارات مؤقتاً، يرجى الانتظار بضع دقائق قبل المحاولة مجدداً.'
    });
  }

  const { name, phone, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'الاسم ورقم الجوال ونص الاستفسار كلها حقول مطلوبة.'
    });
  }

  const cleanName = sanitizeString(name, 80);
  const cleanPhone = sanitizeString(phone, 30);
  const cleanMessage = sanitizeString(message, 1000);

  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال اسم صحيح لا يقل عن حرفين' });
  }
  if (!cleanPhone || cleanPhone.length < 7) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال رقم جوال أو واتساب صحيح للتواصل' });
  }
  if (!cleanMessage || cleanMessage.length < 3) {
    return res.status(400).json({ success: false, error: 'يرجى كتابة نص الاستفسار أو الرسالة' });
  }

  const data = getStoreData();

  const newInquiry: Inquiry = {
    id: `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: Date.now(),
    name: cleanName,
    phone: cleanPhone,
    message: cleanMessage,
    status: 'unread'
  };

  data.inquiries.unshift(newInquiry);
  await saveStoreData(data);

  res.status(201).json({
    success: true,
    message: 'تم استلام رسالتك بنجاح، وسنتواصل معك في أقرب وقت ممكن.',
    inquiry: newInquiry
  });
});

// Public: Submit a product review (goes to "pending" until an admin approves it)
app.post('/api/reviews', async (req, res) => {
  const { productId, customerName, rating, comment } = req.body;

  if (!productId || !customerName || !rating || !comment) {
    return res.status(400).json({ success: false, error: 'يرجى تعبئة جميع الحقول (الاسم، التقييم، والتعليق)' });
  }

  const cleanRating = Number(rating);
  if (!Number.isInteger(cleanRating) || cleanRating < 1 || cleanRating > 5) {
    return res.status(400).json({ success: false, error: 'التقييم يجب أن يكون رقماً من 1 إلى 5' });
  }

  const cleanName = sanitizeString(customerName, 80);
  const cleanComment = sanitizeString(comment, 500);

  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال اسم صحيح لا يقل عن حرفين' });
  }
  if (!cleanComment || cleanComment.length < 3) {
    return res.status(400).json({ success: false, error: 'يرجى كتابة تعليق التقييم' });
  }

  const data = getStoreData();
  const product = data.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
  }

  const newReview: Review = {
    id: `REV-${Math.floor(1000 + Math.random() * 9000)}`,
    productId,
    productName: product.name,
    customerName: cleanName,
    rating: cleanRating,
    comment: cleanComment,
    status: 'pending',
    createdAt: Date.now(),
  };

  data.reviews.unshift(newReview);
  await saveStoreData(data);

  res.status(201).json({
    success: true,
    message: 'شكراً لتقييمك! سيظهر تعليقك بعد مراجعته من إدارة المتجر.',
  });
});

// Public: Fetch approved reviews for one product
app.get('/api/reviews', (req, res) => {
  const { productId } = req.query;
  const data = getStoreData();
  const approved = data.reviews.filter(r => r.status === 'approved' && (!productId || r.productId === productId));
  res.json({ success: true, reviews: approved });
});

// Public: Log a homepage visit (called once per browser session from the frontend).
// Visitors are deduplicated by IP so this endpoint is safe to call repeatedly
// without the visitors list growing per page view.
app.post('/api/track-visit', async (req, res) => {
  const ip = getClientIp(req);
  const userAgent = (req.headers['user-agent'] as string) || '';

  let device = 'جهاز غير معروف';
  if (/iphone|ipad|ipod/i.test(userAgent)) device = 'آيفون / آيباد';
  else if (/android/i.test(userAgent)) device = 'أندرويد';
  else if (/windows/i.test(userAgent)) device = 'كمبيوتر (ويندوز)';
  else if (/macintosh|mac os/i.test(userAgent)) device = 'كمبيوتر (ماك)';
  else if (/linux/i.test(userAgent)) device = 'كمبيوتر (لينكس)';

  let browser = 'غير معروف';
  if (/edg\//i.test(userAgent)) browser = 'Edge';
  else if (/chrome\//i.test(userAgent)) browser = 'Chrome';
  else if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) browser = 'Safari';
  else if (/firefox\//i.test(userAgent)) browser = 'Firefox';

  const data = getStoreData();
  const existing = data.visitors.find(v => v.ip === ip);
  const now = Date.now();

  if (existing) {
    existing.lastSeen = now;
    existing.visitCount += 1;
    existing.device = device;
    existing.browser = browser;
  } else {
    data.visitors.unshift({
      ip,
      device,
      browser,
      firstSeen: now,
      lastSeen: now,
      visitCount: 1,
      blocked: false,
    });
    // Cap the list so it can't grow unbounded on a public endpoint
    const MAX_VISITORS = 500;
    if (data.visitors.length > MAX_VISITORS) {
      data.visitors.sort((a, b) => b.lastSeen - a.lastSeen);
      data.visitors = data.visitors.slice(0, MAX_VISITORS);
    }
  }

  await saveStoreData(data);
  res.json({ success: true });
});

// --- ADMIN SECURE ROUTES ---

// Admin Login with advanced brute force attack protection & timing-safe checks
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const clientIp = ((req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()) || req.socket.remoteAddress || 'unknown';

  const attempt = loginAttempts.get(clientIp) || { count: 0, lastAttempt: Date.now() };

  // Check if IP is currently locked out
  if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
    const remainingSeconds = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    return res.status(429).json({
      success: false,
      error: `تم قفل محاولات الدخول مؤقتاً لحماية المتجر بعد تكرار المحاولات الخاطئة. الرجاء الانتظار ${remainingMinutes} دقيقة (${remainingSeconds} ثانية) قبل المحاولة مجدداً.`
    });
  }

  const data = getStoreData();

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال اسم المستخدم وكلمة السر' });
  }

  // Constant-time and timing-safe password check
  const isUsernameMatch = username.trim().toLowerCase() === data.admin.username.toLowerCase();
  const isPasswordMatch = verifyPassword(password, data.admin.salt, data.admin.passwordHash);
  const isValid = isUsernameMatch && isPasswordMatch;

  if (!isValid) {
    attempt.count += 1;
    attempt.lastAttempt = Date.now();
    if (attempt.count >= 5) {
      // Lock for 15 minutes after 5 consecutive failed attempts
      attempt.lockedUntil = Date.now() + 15 * 60 * 1000;
      loginAttempts.set(clientIp, attempt);
      return res.status(429).json({
        success: false,
        error: 'تم حظر محاولات الدخول مؤقتاً لمدة 15 دقيقة بعد 5 محاولات فاشلة متتالية لحماية حساب الإدارة من هجمات التخمين.'
      });
    }
    loginAttempts.set(clientIp, attempt);
    const triesLeft = 5 - attempt.count;
    return res.status(401).json({
      success: false,
      error: `اسم المستخدم أو كلمة السر غير صحيحة. متبقي ${triesLeft} محاولات قبل القفل الأمني المؤقت لحسابك.`
    });
  }

  // Reset attempt count on successful authentication
  loginAttempts.delete(clientIp);

  // Generate cryptographically secure 512-bit token
  const token = crypto.randomBytes(64).toString('hex');
  const currentTime = Date.now();
  activeAdminSessions.set(token, {
    token,
    createdAt: currentTime,
    lastActive: currentTime,
    username: data.admin.username,
    ip: clientIp
  });
  saveSessions();

  res.json({
    success: true,
    token,
    username: data.admin.username,
    message: 'تم تسجيل الدخول بنجاح إلى لوحة التحكم'
  });
});

// Admin Verify Token
app.get('/api/admin/verify', requireAdminAuth, (req, res) => {
  const data = getStoreData();
  res.json({ success: true, username: data.admin.username });
});

// Protected endpoint to get current admin username
app.get('/api/admin/current-user', requireAdminAuth, (req, res) => {
  const data = getStoreData();
  res.json({ success: true, username: data.admin.username });
});

// Admin Logout - Immediately and permanently revokes active session token
app.post('/api/admin/logout', (req, res) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.body?.token) {
    token = req.body.token;
  }
  if (token) {
    activeAdminSessions.delete(token);
    saveSessions();
  }
  res.json({ success: true, message: 'تم إنهاء الجلسة وإلغاء التصريح بنجاح' });
});

// Admin: Get all orders
app.get('/api/admin/orders', requireAdminAuth, (req, res) => {
  const data = getStoreData();
  res.json({ success: true, orders: data.orders });
});

// Admin: Update order status (Approve with note / Reject with reason / Mark completed)
app.put('/api/admin/orders/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status, adminNote, rejectionReason } = req.body;

  const data = getStoreData();
  const orderIndex = data.orders.findIndex(o => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
  }

  if (status) data.orders[orderIndex].status = status;
  if (adminNote !== undefined) data.orders[orderIndex].adminNote = adminNote;
  if (rejectionReason !== undefined) data.orders[orderIndex].rejectionReason = rejectionReason;

  await saveStoreData(data);
  res.json({ success: true, order: data.orders[orderIndex] });
});

// Admin: Delete order (e.g. completed order removed from record)
app.delete('/api/admin/orders/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const data = getStoreData();

  const initialLength = data.orders.length;
  data.orders = data.orders.filter(o => o.id !== id);

  if (data.orders.length === initialLength) {
    return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
  }

  await saveStoreData(data);
  res.json({ success: true, message: 'تم حذف الطلب بنجاح من السجل' });
});

// Admin: List all contact inquiries
app.get('/api/admin/inquiries', requireAdminAuth, (req, res) => {
  const data = getStoreData();
  res.json({ success: true, inquiries: data.inquiries });
});

// Admin: Update inquiry status (mark as read/unread)
app.put('/api/admin/inquiries/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'read' && status !== 'unread') {
    return res.status(400).json({ success: false, error: 'حالة الاستفسار غير صالحة' });
  }

  const data = getStoreData();
  const inquiryIndex = data.inquiries.findIndex(i => i.id === id);

  if (inquiryIndex === -1) {
    return res.status(404).json({ success: false, error: 'الاستفسار غير موجود' });
  }

  data.inquiries[inquiryIndex].status = status;
  await saveStoreData(data);
  res.json({ success: true, inquiry: data.inquiries[inquiryIndex] });
});

// Admin: Delete inquiry
app.delete('/api/admin/inquiries/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const data = getStoreData();

  const initialLength = data.inquiries.length;
  data.inquiries = data.inquiries.filter(i => i.id !== id);

  if (data.inquiries.length === initialLength) {
    return res.status(404).json({ success: false, error: 'الاستفسار غير موجود' });
  }

  await saveStoreData(data);
  res.json({ success: true, message: 'تم حذف الاستفسار بنجاح من السجل' });
});

// Admin: Fetch all reviews (pending, approved, rejected)
app.get('/api/admin/reviews', requireAdminAuth, (req, res) => {
  const data = getStoreData();
  res.json({ success: true, reviews: data.reviews });
});

// Admin: Approve / reject a review
app.put('/api/admin/reviews/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'حالة التقييم غير صالحة' });
  }

  const data = getStoreData();
  const reviewIndex = data.reviews.findIndex(r => r.id === id);

  if (reviewIndex === -1) {
    return res.status(404).json({ success: false, error: 'التقييم غير موجود' });
  }

  data.reviews[reviewIndex].status = status;
  await saveStoreData(data);
  res.json({ success: true, review: data.reviews[reviewIndex] });
});

// Admin: Delete a review
app.delete('/api/admin/reviews/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const data = getStoreData();

  const initialLength = data.reviews.length;
  data.reviews = data.reviews.filter(r => r.id !== id);

  if (data.reviews.length === initialLength) {
    return res.status(404).json({ success: false, error: 'التقييم غير موجود' });
  }

  await saveStoreData(data);
  res.json({ success: true, message: 'تم حذف التقييم بنجاح' });
});

// Admin: Fetch all logged visitors (devices that have visited the site)
app.get('/api/admin/visitors', requireAdminAuth, (req, res) => {
  const data = getStoreData();
  const sorted = [...data.visitors].sort((a, b) => b.lastSeen - a.lastSeen);
  res.json({ success: true, visitors: sorted });
});

// Admin: Block or unblock a visitor by IP
app.put('/api/admin/visitors/:ip/block', requireAdminAuth, async (req, res) => {
  const { ip } = req.params;
  const { blocked } = req.body;

  const data = getStoreData();
  const visitor = data.visitors.find(v => v.ip === ip);

  if (!visitor) {
    return res.status(404).json({ success: false, error: 'الزائر غير موجود' });
  }

  visitor.blocked = !!blocked;
  await saveStoreData(data);
  res.json({ success: true, visitor });
});

// Admin: Remove a visitor entry from the log entirely
app.delete('/api/admin/visitors/:ip', requireAdminAuth, async (req, res) => {
  const { ip } = req.params;
  const data = getStoreData();

  const initialLength = data.visitors.length;
  data.visitors = data.visitors.filter(v => v.ip !== ip);

  if (data.visitors.length === initialLength) {
    return res.status(404).json({ success: false, error: 'الزائر غير موجود' });
  }

  await saveStoreData(data);
  res.json({ success: true, message: 'تم حذف سجل الزائر' });
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

// Admin: Upload a promo video file (stored in Supabase Storage, not the JSON
// state, since videos are too large to keep in store_state). Returns a
// public URL; the admin still needs to call PUT /api/admin/settings with
// { promoVideo: { enabled, sourceType: 'upload', url } } to activate it.
app.post('/api/admin/promo-video/upload', requireAdminAuth, async (req, res) => {
  const { fileBase64, fileName, mimeType } = req.body;

  if (!fileBase64 || !fileName || !mimeType) {
    return res.status(400).json({ success: false, error: 'بيانات الملف ناقصة (الملف، الاسم، أو النوع)' });
  }

  if (!mimeType.startsWith('video/')) {
    return res.status(400).json({ success: false, error: 'الملف يجب أن يكون فيديو صالح' });
  }

  try {
    const base64Data = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const buffer = Buffer.from(base64Data, 'base64');

    // ~35MB file limit (comfortably under the 50mb JSON body cap after base64 overhead)
    const MAX_VIDEO_BYTES = 35 * 1024 * 1024;
    if (buffer.length > MAX_VIDEO_BYTES) {
      return res.status(413).json({
        success: false,
        error: 'حجم الفيديو أكبر من الحد المسموح (35 ميغابايت). يرجى ضغط الفيديو أو استخدام خيار الرابط بدلاً من الرفع المباشر.'
      });
    }

    const publicUrl = await uploadPromoVideoFile(fileName, mimeType, buffer);
    res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Promo video upload error:', err);
    res.status(500).json({ success: false, error: 'تعذر رفع الفيديو، يرجى المحاولة مرة أخرى' });
  }
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
