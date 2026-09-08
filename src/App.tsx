import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, Filter, Star, Search, ArrowUpDown, ChevronDown, Check,
  ShoppingBag, ShieldCheck, Heart, Leaf, Package, AlertCircle
} from 'lucide-react';
import { Product, CartItem, StoreSettings, Order } from './types';
import { fetchProducts, fetchSettings, verifyAdminToken, fetchCurrentAdminUser } from './services/api';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { PolicyPage } from './components/PolicyPage';
import { Footer } from './components/Footer';

export default function App() {
  // Main Data
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sb_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sb_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart:', e);
    }
  }, [cart]);

  // Admin Session State - Persistent in localStorage so owner stays logged in
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sb_admin_token') || null;
    } catch {
      return null;
    }
  });

  const [adminUsername, setAdminUsername] = useState<string>(() => {
    try {
      return localStorage.getItem('sb_admin_user') || 'sabreen';
    } catch {
      return 'sabreen';
    }
  });

  // Navigation & Filtering
  const [currentView, setCurrentView] = useState<string>('store'); // 'store' | 'new' | 'bestsellers' | 'about' | 'contact' | 'policy'
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');

  // Modals & Drawers
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(() => {
    try {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      const hasToken = Boolean(localStorage.getItem('sb_admin_token'));
      const isAdminRoute = p === '/admin' || p.startsWith('/admin') || h === '#admin' || h === '#/admin';
      return isAdminRoute && !hasToken;
    } catch {
      return false;
    }
  });
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(() => {
    try {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      const hasToken = Boolean(localStorage.getItem('sb_admin_token'));
      const isAdminRoute = p === '/admin' || p.startsWith('/admin') || h === '#admin' || h === '#/admin';
      return isAdminRoute && hasToken;
    } catch {
      return false;
    }
  });

  // Toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial Data Load & Session Verification
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodsData, settingsData, currentAdmin] = await Promise.all([
        fetchProducts(),
        fetchSettings(),
        fetchCurrentAdminUser()
      ]);
      setProducts(prodsData);
      setSettings(settingsData);

      if (currentAdmin) {
        setAdminUsername(currentAdmin);
        try {
          localStorage.setItem('sb_admin_user', currentAdmin);
        } catch {}
      }

      // Check and verify existing token if stored
      const savedToken = localStorage.getItem('sb_admin_token');
      if (savedToken) {
        const isValid = await verifyAdminToken(savedToken);
        if (isValid) {
          setAdminToken(savedToken);
        } else {
          setAdminToken(null);
          try {
            localStorage.removeItem('sb_admin_token');
          } catch {}
        }
      }
    } catch (err: any) {
      console.error('Error fetching store data:', err);
      setError('تعذر تحميل بيانات المتجر، يرجى إعادة تحديث الصفحة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen to hash / URL changes (e.g., #admin or /admin) and secret keyboard shortcut (Ctrl+Shift+A)
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const p = window.location.pathname.toLowerCase();
        const h = window.location.hash.toLowerCase();
        const isAdminRoute = p === '/admin' || p.startsWith('/admin') || h === '#admin' || h === '#/admin';
        if (isAdminRoute) {
          if (adminToken) {
            setIsAdminDashboardOpen(true);
            setIsAdminLoginOpen(false);
          } else {
            setIsAdminLoginOpen(true);
          }
        }
      } catch (err) {
        console.error('Error handling admin route:', err);
      }
    };

    // Secret shortcut for store owner: Ctrl + Shift + A (or Cmd + Shift + A on Mac)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA')) {
        e.preventDefault();
        if (adminToken) {
          setIsAdminDashboardOpen(true);
          setIsAdminLoginOpen(false);
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [adminToken]);

  // Cart Operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`تمت إضافة "${product.name}" إلى سلة المشتريات`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    setCart([]); // Clear cart after successful checkout
  };

  // Admin Login / Logout - Persistent Session Management
  const handleLoginSuccess = (token: string, username: string) => {
    setAdminToken(token);
    setAdminUsername(username);
    try {
      localStorage.setItem('sb_admin_token', token);
      localStorage.setItem('sb_admin_user', username);
    } catch {}
    setIsAdminDashboardOpen(true);
    showToast(`مرحباً بك يا ${username} في لوحة التحكم`);
  };

  const handleLogout = () => {
    if (adminToken) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ token: adminToken })
      }).catch(() => {});
    }
    setAdminToken(null);
    try {
      localStorage.removeItem('sb_admin_token');
    } catch {}
    setIsAdminDashboardOpen(false);
    setIsAdminLoginOpen(false);
    if (window.location.pathname.startsWith('/admin') || window.location.hash.includes('admin')) {
      try {
        window.history.pushState(null, '', '/');
      } catch {}
    }
    showToast('تم تسجيل الخروج بنجاح');
  };

  const handleAdminAccess = (updateUrl = true) => {
    if (updateUrl && window.location.pathname !== '/admin') {
      try {
        window.history.pushState(null, '', '/admin');
      } catch {}
    }
    if (adminToken) {
      setIsAdminDashboardOpen(true);
      setIsAdminLoginOpen(false);
    } else {
      setIsAdminLoginOpen(true);
      setIsAdminDashboardOpen(false);
    }
  };

  const handleCloseAdmin = () => {
    setIsAdminLoginOpen(false);
    setIsAdminDashboardOpen(false);
    if (window.location.pathname.startsWith('/admin') || window.location.hash.includes('admin')) {
      try {
        window.history.pushState(null, '', '/');
      } catch {}
    }
  };

  // Dedicated Admin URL Link Listener: /admin, /admin/, #admin, ?admin
  useEffect(() => {
    const checkUrlAdmin = () => {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = new URLSearchParams(window.location.search);

      const isAdminUrl =
        pathname === '/admin' ||
        pathname === '/admin/' ||
        pathname.startsWith('/admin') ||
        hash === '#admin' ||
        hash === '#/admin' ||
        search.has('admin');

      if (isAdminUrl) {
        handleAdminAccess(false);
      }
    };

    checkUrlAdmin();
    window.addEventListener('popstate', checkUrlAdmin);
    window.addEventListener('hashchange', checkUrlAdmin);

    return () => {
      window.removeEventListener('popstate', checkUrlAdmin);
      window.removeEventListener('hashchange', checkUrlAdmin);
    };
  }, [adminToken]);

  // Categories list dynamically derived from all active products plus default categories
  const categories = useMemo(() => {
    const productCategories = products
      .map((p) => p.category?.trim())
      .filter((cat): cat is string => Boolean(cat));
    const baseCategories = ['الكل', 'صابون', 'كريمات', 'زيوت شعر', 'عناية شخصية'];
    return Array.from(new Set([...baseCategories, ...productCategories]));
  }, [products]);

  // Filtered and Sorted Products
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const newArrivals = useMemo(() => {
    return products.filter((p) => !p.hidden && Date.now() - p.createdAt < SEVEN_DAYS_MS);
  }, [products]);

  const bestSellers = useMemo(() => {
    return products.filter((p) => !p.hidden && p.isBestSeller);
  }, [products]);

  const displayedProducts = useMemo(() => {
    let list = [...products].filter((p) => !p.hidden);

    // If on "New Arrivals" view
    if (currentView === 'new') {
      list = list.filter((p) => Date.now() - p.createdAt < SEVEN_DAYS_MS);
    } else if (currentView === 'bestsellers') {
      list = list.filter((p) => p.isBestSeller);
    }

    // Filter by Category
    if (selectedCategory !== 'الكل') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.ingredients && p.ingredients.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } else {
      // Default: newer first
      list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return list;
  }, [products, currentView, selectedCategory, searchQuery, sortBy]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1A1A1A]" dir="rtl">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F0F10] text-[#FAF8F5] border border-[#D4AF37]/50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-slideUp">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={handleAdminAccess}
        isAdminLoggedIn={Boolean(adminToken)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        settings={settings}
      />

      {/* Main Content Areas based on currentView */}
      <main className="flex-1">
        
        {/* ================= VIEW: ABOUT US ================= */}
        {currentView === 'about' && <AboutPage />}

        {/* ================= VIEW: CONTACT US ================= */}
        {currentView === 'contact' && <ContactPage settings={settings} />}

        {/* ================= VIEW: SHIPPING & POLICIES ================= */}
        {currentView === 'policy' && <PolicyPage />}

        {/* ================= VIEW: STORE & PRODUCTS ================= */}
        {(currentView === 'store' || currentView === 'new' || currentView === 'bestsellers') && (
          <div>
            
            {/* Hero only on main store view */}
            {currentView === 'store' && !searchQuery && (
              <Hero
                onExploreClick={() => {
                  const el = document.getElementById('products-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                onNewArrivalsClick={() => {
                  setCurrentView('new');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            <div id="products-section" className="container mx-auto px-4 py-10 max-w-7xl">
              
              {/* Section Titles according to view */}
              <div className="mb-8 text-right">
                {currentView === 'new' && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#B38938] px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 inline-block">
                      قسم وصل حديثاً
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#141416] font-serif-luxury">
                      أحدث إبداعات صابرين بشير للعناية الطبيعية
                    </h2>
                    <p className="text-xs sm:text-sm text-[#736B5E]">
                      تظهر هنا المنتجات المضافة حديثاً بشارة &quot;جديد&quot; تلقائياً لمدة أسبوع من تاريخ إضافتها
                    </p>
                  </div>
                )}

                {currentView === 'bestsellers' && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#B38938] px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 inline-block">
                      الأكثر مبيعاً ورواجاً
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#141416] font-serif-luxury">
                      المنتجات الأكثر طلباً وإشادة من زبائننا
                    </h2>
                    <p className="text-xs sm:text-sm text-[#736B5E]">
                      خلاصات طبيعية نالت ثقة ومحبة عميلاتنا بنتائجها المثبتة
                    </p>
                  </div>
                )}

                {currentView === 'store' && (
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-[#B38938] tracking-wider uppercase">
                        المجموعة الطبيعية المتكاملة
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#141416] font-serif-luxury mt-1">
                        استكشفي مستحضرات العناية النقية
                      </h2>
                    </div>
                    <span className="text-xs text-[#736B5E] font-medium">
                      عرض {displayedProducts.length} منتج متوفر
                    </span>
                  </div>
                )}
              </div>

              {/* Dedicated New Arrivals Row on Store View */}
              {currentView === 'store' && !searchQuery && newArrivals.length > 0 && selectedCategory === 'الكل' && (
                <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#171719] via-[#1D1D20] to-[#171719] text-[#FAF8F5] border border-[#D4AF37]/30 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37]">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold font-serif-luxury text-[#FAF8F5]">
                          وصل حديثاً إلى المتجر
                        </h3>
                        <p className="text-xs text-[#FAF8F5]/70">
                          منتجات أضيفت خلال هذا الأسبوع بشارة &quot;جديد&quot; التلقائية
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentView('new')}
                      className="text-xs font-bold text-[#D4AF37] hover:underline self-start sm:self-auto"
                    >
                      عرض كل المنتجات الجديدة ←
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                    {newArrivals.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onViewDetails={setSelectedProductDetails}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Filter & Sorting Toolbar */}
              <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E6E1D8] shadow-sm mb-8 space-y-4">
                {/* Categories Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      id={`btn-cat-${cat}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#141416] text-[#FAF8F5] shadow-sm'
                          : 'bg-[#FAF8F5] text-[#544E43] hover:bg-[#EAE5DC] border border-[#E6E1D8]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search query notice & Sorting */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#F0EBE1] text-xs">
                  {searchQuery ? (
                    <div className="flex items-center gap-2 text-[#736B5E]">
                      <Search className="w-3.5 h-3.5 text-[#B38938]" />
                      <span>نتائج البحث عن: &quot;{searchQuery}&quot;</span>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-red-500 font-bold underline mr-1"
                      >
                        إلغاء البحث
                      </button>
                    </div>
                  ) : (
                    <span className="text-[#8C8270]">
                      جميع الأسعار موضحة بالشيكل الفلسطيني (₪)
                    </span>
                  )}

                  {/* Sorting dropdown */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[#8C8270] font-medium">ترتيب حسب:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg px-3 py-1.5 text-xs text-[#141416] focus:border-[#D4AF37] focus:outline-none"
                    >
                      <option value="default">الأحدث أولاً</option>
                      <option value="price-asc">السعر: من الأقل للأعلى</option>
                      <option value="price-desc">السعر: من الأعلى للأقل</option>
                      <option value="name">الاسم أبجدياً</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Main Products Grid */}
              {loading ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-[#8C8270]">جاري تحميل منتجات صابرين بشير الطبيعية...</p>
                </div>
              ) : displayedProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#E6E1D8] shadow-sm max-w-lg mx-auto space-y-3">
                  <Package className="w-12 h-12 text-[#B38938]/60 mx-auto" />
                  <h3 className="font-bold text-base text-[#141416]">لم نجد أي منتجات مطابقة</h3>
                  <p className="text-xs text-[#736B5E]">
                    جربي تغيير معايير البحث أو اختيار تصنيف آخر للاطلاع على تشكيلتنا
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('الكل');
                      setSearchQuery('');
                      setCurrentView('store');
                    }}
                    className="px-5 py-2 rounded-xl bg-[#141416] text-[#FAF8F5] text-xs font-bold hover:bg-[#D4AF37] hover:text-black transition-colors"
                  >
                    عرض كل المنتجات
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onViewDetails={setSelectedProductDetails}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdmin={handleAdminAccess}
        isAdminLoggedIn={Boolean(adminToken)}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProductDetails}
        onClose={() => setSelectedProductDetails(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={handleProceedToCheckout}
        shippingFee={settings?.shippingFee || 0}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        settings={settings}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={handleCloseAdmin}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Admin Dashboard Full Screen Suite */}
      {isAdminDashboardOpen && adminToken && (
        <AdminDashboard
          token={adminToken}
          adminUsername={adminUsername}
          onLogout={handleLogout}
          onClose={handleCloseAdmin}
          initialSettings={settings}
          onSettingsUpdated={(newSettings) => setSettings(newSettings)}
          onProductsUpdated={loadData}
          onCredentialsUpdated={(newUsername) => {
            setAdminUsername(newUsername);
            try {
              localStorage.setItem('sb_admin_user', newUsername);
            } catch {}
          }}
        />
      )}

    </div>
  );
}
