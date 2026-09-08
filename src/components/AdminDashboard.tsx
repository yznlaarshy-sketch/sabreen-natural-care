import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, ShoppingBag, Settings, KeyRound, LogOut, Check, X,
  Clock, CheckCircle, XCircle, Trash2, Plus, Edit, Eye, EyeOff,
  Phone, MessageCircle, ExternalLink, AlertTriangle, Sparkles, Image,
  DollarSign, ShieldAlert, ArrowLeft, RefreshCw, Layers, Lock, ShieldCheck,
  Facebook, Instagram
} from 'lucide-react';
import { Product, Order, StoreSettings, OrderStatus } from '../types';
import {
  fetchAdminOrders,
  fetchAdminProducts,
  updateOrderStatus,
  deleteOrder,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStoreSettings,
  changeAdminCredentials
} from '../services/api';

interface AdminDashboardProps {
  token: string;
  adminUsername: string;
  onLogout: () => void;
  onClose: () => void;
  initialSettings: StoreSettings | null;
  onSettingsUpdated: (newSettings: StoreSettings) => void;
  onProductsUpdated: () => void;
  onCredentialsUpdated?: (newUsername: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  adminUsername,
  onLogout,
  onClose,
  initialSettings,
  onSettingsUpdated,
  onProductsUpdated,
  onCredentialsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings' | 'security'>('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [actionOrder, setActionOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNote, setActionNote] = useState('');

  // Delete Confirmation Modal State (replaces blocked window.confirm)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'order' | 'product';
    id: string;
    title: string;
    extraInfo?: string;
  } | null>(null);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: 'https://images.unsplash.com/photo-1607006314594-ef8879685162?auto=format&fit=crop&w=800&q=80',
    stock: '20',
    volume: '150 مل',
    benefits: '',
    usage: '',
    ingredients: '',
    isBestSeller: false,
  });

  // Settings State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({
    bankName: initialSettings?.bankName || '',
    accountNumber: initialSettings?.accountNumber || '',
    accountHolder: initialSettings?.accountHolder || '',
    walletName: initialSettings?.walletName || '',
    walletNumber: initialSettings?.walletNumber || '',
    instagramUrl: initialSettings?.instagramUrl || '',
    facebookUrl: initialSettings?.facebookUrl || '',
    whatsappNumber: initialSettings?.whatsappNumber || '',
    shippingFee: initialSettings?.shippingFee || 0,
    storeName: initialSettings?.storeName || '',
    storeBio: initialSettings?.storeBio || '',
    phoneContact: initialSettings?.phoneContact || '',
    location: initialSettings?.location || 'داخل قطاع غزة والجنوب فقط حالياً',
    orderHours: initialSettings?.orderHours || 'في أي وقت طوال اليوم (24/7 على مدار الساعة)',
    deliveryAreas: initialSettings?.deliveryAreas || 'مدينة غزة، المنطقة الوسطى (دير البلح، النصيرات، الزوايدة، البريج، المغازي)، خانيونس، ورفح والمواصي',
  });

  useEffect(() => {
    if (initialSettings) {
      setSettingsForm({
        bankName: initialSettings.bankName || '',
        accountNumber: initialSettings.accountNumber || '',
        accountHolder: initialSettings.accountHolder || '',
        walletName: initialSettings.walletName || '',
        walletNumber: initialSettings.walletNumber || '',
        instagramUrl: initialSettings.instagramUrl || '',
        facebookUrl: initialSettings.facebookUrl || '',
        whatsappNumber: initialSettings.whatsappNumber || '',
        shippingFee: initialSettings.shippingFee ?? 0,
        storeName: initialSettings.storeName || '',
        storeBio: initialSettings.storeBio || '',
        phoneContact: initialSettings.phoneContact || '',
        location: initialSettings.location || 'داخل قطاع غزة والجنوب فقط حالياً',
        orderHours: initialSettings.orderHours || 'في أي وقت طوال اليوم (24/7 على مدار الساعة)',
        deliveryAreas: initialSettings.deliveryAreas || 'مدينة غزة، المنطقة الوسطى (دير البلح، النصيرات، الزوايدة، البريج، المغازي)، خانيونس، ورفح والمواصي',
      });
    }
  }, [initialSettings]);

  // Security Form
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newUsername: adminUsername,
    newPassword: '',
    confirmNewPassword: '',
  });

  // Password Visibility & Strength
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Live password strength calculation
  const passwordStrength = useMemo(() => {
    const pass = securityForm.newPassword;
    if (!pass) return { score: 0, label: '', color: '', checks: { length: false, letter: false, number: false, symbol: false } };
    const checks = {
      length: pass.length >= 8,
      letter: /[a-zA-Z\u0600-\u06FF]/.test(pass),
      number: /[0-9]/.test(pass),
      symbol: /[^a-zA-Z0-9\u0600-\u06FF]/.test(pass),
    };
    const passedCount = Object.values(checks).filter(Boolean).length;
    if (passedCount <= 1 || pass.length < 6) {
      return { score: 1, label: 'ضعيفة جداً (أقل من 6 خانات)', color: 'bg-rose-500 text-rose-400', checks };
    }
    if (passedCount === 2 || pass.length < 8) {
      return { score: 2, label: 'متوسطة (أضف أرقاماً ورموزاً)', color: 'bg-amber-500 text-amber-400', checks };
    }
    if (passedCount === 3) {
      return { score: 3, label: 'قوية وموثوقة', color: 'bg-emerald-500 text-emerald-400', checks };
    }
    return { score: 4, label: 'فائقة القوة وحصينة جداً', color: 'bg-emerald-400 text-emerald-300', checks };
  }, [securityForm.newPassword]);

  // Status banners
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Load Data
  const loadOrders = async () => {
    try {
      const data = await fetchAdminOrders(token);
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await fetchAdminProducts(token);
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, [token]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // --- ORDER HANDLERS ---
  const handleOpenApprove = (order: Order) => {
    setActionOrder(order);
    setActionType('approve');
    setActionNote('تم اعتماد وتأكيد التحويل البنكي. جاري تجهيز الطلب وإرساله للتوصيل.');
  };

  const handleOpenReject = (order: Order) => {
    setActionOrder(order);
    setActionType('reject');
    setActionNote('تعذر التحقق من وصول الحوالة البنكية أو صورة الإيصال المرفقة غير واضحة.');
  };

  const handleConfirmOrderAction = async () => {
    if (!actionOrder || !actionType) return;
    setLoading(true);

    const newStatus: OrderStatus = actionType === 'approve' ? 'approved' : 'rejected';
    const payload = actionType === 'approve'
      ? { status: newStatus, adminNote: actionNote }
      : { status: newStatus, rejectionReason: actionNote };

    const success = await updateOrderStatus(token, actionOrder.id, payload);
    setLoading(false);

    if (success) {
      showNotification(
        actionType === 'approve'
          ? `تم اعتماد وتأكيد الطلب #${actionOrder.id}`
          : `تم رفض الطلب #${actionOrder.id}`
      );
      setActionOrder(null);
      setActionType(null);
      loadOrders();
    } else {
      showNotification('حدث خطأ أثناء تعديل حالة الطلب', 'error');
    }
  };

  const handleMarkCompleted = async (orderId: string) => {
    setLoading(true);
    const success = await updateOrderStatus(token, orderId, { status: 'completed' });
    setLoading(false);
    if (success) {
      showNotification(`تم تحديد الطلب #${orderId} كـ "مكتمل وتم التسليم" بنجاح`);
      loadOrders();
    } else {
      showNotification('فشل تحديث حالة الطلب', 'error');
    }
  };

  // --- DELETE CONFIRMATION HANDLERS (Custom In-App Modal) ---
  const triggerDeleteOrder = (order: Order) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'order',
      id: order.id,
      title: `طلب #${order.id} للزبون: ${order.customerName}`,
      extraInfo: `المبلغ: ${order.totalAmount} ₪ | الحالة: ${
        order.status === 'rejected' ? 'مرفوض' : order.status === 'completed' ? 'مكتمل' : 'معلق'
      }`,
    });
  };

  const triggerDeleteProduct = (prod: Product) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'product',
      id: prod.id,
      title: prod.name,
      extraInfo: `السعر: ${prod.price} ₪ | التصنيف: ${prod.category} | المخزون: ${prod.stock}`,
    });
  };

  const executeDeletion = async () => {
    if (!deleteConfirm) return;
    setLoading(true);

    try {
      if (deleteConfirm.type === 'order') {
        const success = await deleteOrder(token, deleteConfirm.id);
        if (success) {
          showNotification(`تم حذف الطلب #${deleteConfirm.id} بنجاح من السجل`);
          await loadOrders();
        } else {
          showNotification('تعذر حذف الطلب من السجل', 'error');
        }
      } else if (deleteConfirm.type === 'product') {
        const success = await deleteProduct(token, deleteConfirm.id);
        if (success) {
          showNotification(`تم حذف المنتج "${deleteConfirm.title}" بنجاح`);
          await loadProducts();
          onProductsUpdated();
        } else {
          showNotification('تعذر حذف المنتج، يرجى المحاولة مرة أخرى', 'error');
        }
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء تنفيذ عملية الحذف', 'error');
    } finally {
      setLoading(false);
      setDeleteConfirm(null);
    }
  };

  // --- PRODUCT HANDLERS ---
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      image: 'https://images.unsplash.com/photo-1607006314594-ef8879685162?auto=format&fit=crop&w=800&q=80',
      stock: '20',
      volume: '150 مل',
      benefits: '',
      usage: '',
      ingredients: '',
      isBestSeller: false,
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description,
      price: prod.price.toString(),
      category: prod.category,
      image: prod.image,
      stock: prod.stock.toString(),
      volume: prod.volume || '',
      benefits: prod.benefits ? prod.benefits.join(' | ') : '',
      usage: prod.usage || '',
      ingredients: prod.ingredients || '',
      isBestSeller: Boolean(prod.isBestSeller),
    });
    setShowProductModal(true);
  };

  const handleToggleProductVisibility = async (prod: Product) => {
    const success = await updateProduct(token, prod.id, { hidden: !prod.hidden });
    if (success) {
      showNotification(
        prod.hidden
          ? `تم إظهار المنتج "${prod.name}" في المتجر للزبائن`
          : `تم إخفاء المنتج "${prod.name}" مؤقتاً عن الزبائن`
      );
      loadProducts();
      onProductsUpdated();
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.price) {
      showNotification('يرجى كتابة اسم المنتج وسعره بالشيكل', 'error');
      return;
    }
    if (!productForm.category.trim()) {
      showNotification('يرجى كتابة تصنيف المنتج (مثلاً: زيوت، صابون، كريمات...)', 'error');
      return;
    }

    setLoading(true);
    const benefitsArray = productForm.benefits
      ? productForm.benefits.split('|').map((b) => b.trim()).filter(Boolean)
      : [];

    const payload: Partial<Product> = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      category: productForm.category.trim(),
      image: productForm.image.trim() || 'https://images.unsplash.com/photo-1608248597359-46700c25a58a?auto=format&fit=crop&w=800&q=80',
      stock: Number(productForm.stock) || 0,
      volume: productForm.volume.trim(),
      benefits: benefitsArray,
      usage: productForm.usage.trim(),
      ingredients: productForm.ingredients.trim(),
      isBestSeller: productForm.isBestSeller,
    };

    try {
      if (editingProduct) {
        const updated = await updateProduct(token, editingProduct.id, payload);
        if (updated) {
          showNotification(`تم تعديل بيانات المنتج "${updated.name}" بنجاح`);
          setShowProductModal(false);
          loadProducts();
          onProductsUpdated();
        } else {
          showNotification('فشل تعديل المنتج', 'error');
        }
      } else {
        const created = await createProduct(token, payload);
        if (created) {
          showNotification(`تمت إضافة المنتج الجديد "${created.name}" بنجاح مع شارة جديد`);
          setShowProductModal(false);
          loadProducts();
          onProductsUpdated();
        } else {
          showNotification('فشل إضافة المنتج', 'error');
        }
      }
    } catch (err) {
      showNotification('حدث خطأ أثناء حفظ المنتج', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- SETTINGS HANDLERS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const updated = await updateStoreSettings(token, settingsForm);
    setLoading(false);
    if (updated) {
      showNotification('تم حفظ وتحديث بيانات المتجر والحسابات البنكية بنجاح');
      onSettingsUpdated(updated);
    } else {
      showNotification('فشل حفظ الإعدادات', 'error');
    }
  };

  // --- SECURITY HANDLERS ---
  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityForm.currentPassword) {
      showNotification('يرجى إدخال كلمة المرور الحالية للتأكيد الأمني', 'error');
      return;
    }

    if (securityForm.newPassword) {
      if (securityForm.newPassword.length < 4) {
        showNotification('كلمة المرور الجديدة يجب أن تكون 4 خانات على الأقل', 'error');
        return;
      }
      if (securityForm.newPassword !== securityForm.confirmNewPassword) {
        showNotification('كلمة المرور الجديدة وتأكيدها غير متطابقين', 'error');
        return;
      }
    }

    if (securityForm.newUsername && securityForm.newUsername.trim().length < 3) {
      showNotification('اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل', 'error');
      return;
    }

    setLoading(true);
    const result = await changeAdminCredentials(token, {
      currentPassword: securityForm.currentPassword,
      newUsername: securityForm.newUsername ? securityForm.newUsername.trim() : undefined,
      newPassword: securityForm.newPassword ? securityForm.newPassword.trim() : undefined,
    });
    setLoading(false);

    if (result.success) {
      const updatedUser = result.username || securityForm.newUsername;
      showNotification(result.message || 'تم حفظ بيانات الأمان وتحديث كلمة المرور بنجاح في قاعدة البيانات');
      if (updatedUser) {
        try {
          localStorage.setItem('sb_admin_user', updatedUser);
        } catch {}
        onCredentialsUpdated?.(updatedUser);
      }
      setSecurityForm({
        currentPassword: '',
        newUsername: updatedUser,
        newPassword: '',
        confirmNewPassword: '',
      });
    } else {
      showNotification(result.error || 'فشل تحديث بيانات الأمان، يرجى التحقق من كلمة السر الحالية', 'error');
    }
  };

  // Computed Orders Statistics
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const approvedCount = orders.filter((o) => o.status === 'approved').length;
  const rejectedCount = orders.filter((o) => o.status === 'rejected').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  
  const totalSalesRevenue = orders
    .filter((o) => o.status === 'approved' || o.status === 'completed')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Filter Orders
  const filteredOrders = orders.filter((order) => {
    if (orderFilter === 'all') return true;
    return order.status === orderFilter;
  });

  // Filter Products
  const categoriesList = ['all', ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter((p) => {
    if (productCategoryFilter === 'all') return true;
    return p.category === productCategoryFilter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#0E0E10] text-[#FAF7F2] overflow-y-auto flex flex-col font-sans" dir="rtl">
      
      {/* Top Navigation Bar */}
      <header className="bg-[#141417]/95 border-b border-[#29292E] sticky top-0 z-30 px-4 py-3 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Store Return */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#202024] hover:bg-[#D4AF37] hover:text-[#0E0E10] text-[#FAF7F2] border border-[#2F2F35] transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
              title="العودة لمعاينة المتجر"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>معاينة المتجر</span>
            </button>

            <div className="flex items-center gap-2.5 pr-2 border-r border-[#2C2C32]">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#D4AF37] bg-[#FAF7F2] shrink-0 shadow-sm">
                <img
                  src="/dr_sabreen_logo.jpg"
                  alt="شعار"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="font-bold text-sm sm:text-base text-[#FAF7F2] font-serif-luxury">
                  لوحة تحكم د. صابرين بشير
                </h1>
                <span className="text-[10px] text-[#D4AF37] font-medium">
                  المدير المسجل: {adminUsername}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#1B1B1F] p-1.5 rounded-2xl border border-[#2A2A30]">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38938] text-[#0E0E10] shadow-md'
                  : 'text-[#FAF7F2]/75 hover:text-[#FAF7F2] hover:bg-[#25252A]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>الطلبات والتحويلات</span>
              {pendingCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38938] text-[#0E0E10] shadow-md'
                  : 'text-[#FAF7F2]/75 hover:text-[#FAF7F2] hover:bg-[#25252A]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>إدارة المنتجات ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38938] text-[#0E0E10] shadow-md'
                  : 'text-[#FAF7F2]/75 hover:text-[#FAF7F2] hover:bg-[#25252A]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>بيانات البنك والمتجر</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'security'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38938] text-[#0E0E10] shadow-md'
                  : 'text-[#FAF7F2]/75 hover:text-[#FAF7F2] hover:bg-[#25252A]'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>أمان كلمة المرور</span>
            </button>
          </div>

          {/* Action Tools: Refresh + Logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadOrders();
                loadProducts();
                showNotification('تم تحديث البيانات من الخادم');
              }}
              className="p-2 text-[#FAF7F2]/70 hover:text-[#D4AF37] rounded-xl hover:bg-[#202024] transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-2 text-rose-400 hover:text-rose-200 rounded-xl bg-[#202024] hover:bg-rose-950/60 border border-[#2E2E34] hover:border-rose-800 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="lg:hidden bg-[#141417] border-b border-[#26262B] p-2 flex justify-around text-xs">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 ${
            activeTab === 'orders' ? 'bg-[#D4AF37] text-[#0E0E10]' : 'text-[#FAF7F2]/70'
          }`}
        >
          <span>الطلبات</span>
          {pendingCount > 0 && (
            <span className="bg-rose-600 text-white text-[10px] px-1 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-3 py-1.5 rounded-xl font-bold ${
            activeTab === 'products' ? 'bg-[#D4AF37] text-[#0E0E10]' : 'text-[#FAF7F2]/70'
          }`}
        >
          المنتجات ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 rounded-xl font-bold ${
            activeTab === 'settings' ? 'bg-[#D4AF37] text-[#0E0E10]' : 'text-[#FAF7F2]/70'
          }`}
        >
          البنك والمتجر
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-1.5 rounded-xl font-bold ${
            activeTab === 'security' ? 'bg-[#D4AF37] text-[#0E0E10]' : 'text-[#FAF7F2]/70'
          }`}
        >
          الأمان
        </button>
      </div>

      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 backdrop-blur-md animate-bounce ${
            feedbackMessage.type === 'success'
              ? 'bg-[#18181B] text-[#D4AF37] border border-[#D4AF37]/80 shadow-[0_0_20px_rgba(212,175,55,0.25)]'
              : 'bg-[#2B1414] text-rose-300 border border-rose-600/80 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="container mx-auto p-4 sm:p-6 flex-1 max-w-7xl">
        
        {/* ===================== TAB 1: ORDERS ===================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-[#17171A] border border-[#27272D] text-right space-y-1 shadow-sm">
                <span className="text-[11px] text-[#A8A295] block font-medium">إجمالي الطلبات</span>
                <span className="text-xl sm:text-2xl font-black text-[#FAF7F2]">{orders.length}</span>
                <span className="text-[10px] text-[#D4AF37] block">طلب مسجل بالمتجر</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#17171A] border border-[#27272D] text-right space-y-1 shadow-sm">
                <span className="text-[11px] text-amber-400 block font-medium">بانتظار التحقق (معلقة)</span>
                <span className="text-xl sm:text-2xl font-black text-amber-300">{pendingCount}</span>
                <span className="text-[10px] text-[#A8A295] block">تحتاج مراجعة الإيصال</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#17171A] border border-[#27272D] text-right space-y-1 shadow-sm">
                <span className="text-[11px] text-emerald-400 block font-medium">معتمدة ومكتملة</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-300">{approvedCount + completedCount}</span>
                <span className="text-[10px] text-[#A8A295] block">تم تأكيد الحوالات</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#17171A] border border-[#27272D] text-right space-y-1 shadow-sm">
                <span className="text-[11px] text-[#D4AF37] block font-medium">المبيعات المؤكدة (شيكل)</span>
                <span className="text-xl sm:text-2xl font-black text-[#D4AF37]">{totalSalesRevenue} ₪</span>
                <span className="text-[10px] text-[#A8A295] block">الدفع بالشيكل الإسرائيلي</span>
              </div>
            </div>

            {/* Orders Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#17171A] p-4 sm:p-5 rounded-2xl border border-[#27272D]">
              <div>
                <h2 className="text-lg font-bold text-[#FAF7F2] font-serif-luxury">
                  سجل طلبات الزبائن وإثباتات الدفع
                </h2>
                <p className="text-xs text-[#A8A295] mt-0.5">
                  يمكنك مراجعة صورة الإيصال، اعتماد الطلب أو رفضه مع إبداء السبب، أو حذف الطلبات المرفوضة نهائياً.
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: `الكل (${orders.length})` },
                  { id: 'pending', label: `قيد الانتظار (${pendingCount})` },
                  { id: 'approved', label: `معتمد (${approvedCount})` },
                  { id: 'rejected', label: `مرفوض (${rejectedCount})` },
                  { id: 'completed', label: `مكتمل (${completedCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      orderFilter === f.id
                        ? 'bg-[#D4AF37] text-[#0E0E10] shadow-sm'
                        : 'bg-[#222227] text-[#FAF7F2]/75 hover:text-white hover:bg-[#2A2A30]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-[#17171A] rounded-2xl p-12 text-center border border-[#27272D] text-[#FAF7F2]/50">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-[#D4AF37]/40" />
                <p className="text-sm font-semibold text-[#FAF7F2]/80">لا توجد طلبات في هذا القسم حالياً</p>
                <p className="text-xs text-[#A8A295] mt-1">أي طلب يقدمه الزبائن سيظهر هنا تلقائياً مع صورة الإيصال</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusColors = {
                    pending: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
                    approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
                    rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
                    completed: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
                  };

                  const statusLabels = {
                    pending: 'قيد الانتظار والمطابقة',
                    approved: 'تم الاعتماد والتجهيز',
                    rejected: 'تم رفض الطلب',
                    completed: 'مكتمل وتم التسليم',
                  };

                  return (
                    <div
                      key={order.id}
                      className={`bg-[#17171A] rounded-2xl border ${
                        order.status === 'rejected'
                          ? 'border-rose-900/40'
                          : order.status === 'pending'
                          ? 'border-amber-600/30'
                          : 'border-[#27272D]'
                      } p-4 sm:p-5 space-y-4 shadow-lg`}
                    >
                      {/* Order Head */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#25252A]">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-[#D4AF37]">
                            طلب #{order.id}
                          </span>
                          <span className="text-xs text-[#A8A295]">
                            {new Date(order.createdAt).toLocaleString('ar-EG')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColors[order.status]}`}
                          >
                            {statusLabels[order.status]}
                          </span>
                          <span className="text-sm font-extrabold text-[#D4AF37] px-3 py-1 rounded-xl bg-[#222227] border border-[#2F2F36]">
                            المجموع: {order.totalAmount} ₪
                          </span>
                        </div>
                      </div>

                      {/* Customer Details & Receipt Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        
                        {/* Customer Information */}
                        <div className="lg:col-span-5 space-y-2 text-xs bg-[#1F1F24] p-3.5 rounded-xl border border-[#2B2B32]">
                          <span className="font-bold text-[#D4AF37] block text-xs">بيانات الزبون والتوصيل:</span>
                          <div className="flex justify-between text-[#FAF7F2]">
                            <span className="text-[#A8A295]">الاسم:</span>
                            <span className="font-semibold">{order.customerName}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#FAF7F2]">
                            <span className="text-[#A8A295]">الهاتف:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">{order.phone}</span>
                              <a
                                href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 p-1 rounded bg-emerald-950/40"
                                title="محادثة واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                          <div className="flex justify-between text-[#FAF7F2]">
                            <span className="text-[#A8A295]">منطقة التوصيل:</span>
                            <span className="font-bold text-[#D4AF37]">{order.deliveryZone || order.city || 'قطاع غزة والجنوب'}</span>
                          </div>
                          <div className="flex justify-between text-[#FAF7F2]">
                            <span className="text-[#A8A295]">العنوان بالتفصيل:</span>
                            <span className="font-semibold">{order.address}</span>
                          </div>
                          {order.notes && (
                            <div className="pt-1 border-t border-[#2B2B32] text-[#A8A295]">
                              <span className="block text-[10px] text-[#D4AF37]">ملاحظات الزبون:</span>
                              <p className="italic">{order.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Payment & Receipt Image */}
                        <div className="lg:col-span-4 space-y-2 text-xs bg-[#1F1F24] p-3.5 rounded-xl border border-[#2B2B32]">
                          <span className="font-bold text-[#D4AF37] block text-xs">إثبات الحوالة المالية:</span>
                          <div className="text-[#FAF7F2]">
                            <span className="text-[#A8A295] block text-[11px]">طريقة / معلومات التحويل:</span>
                            <span className="font-semibold text-xs block">{order.transferInfo}</span>
                          </div>

                          {order.receiptImage ? (
                            <div className="pt-2 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedReceipt(order.receiptImage)}
                                className="relative group rounded-xl overflow-hidden border border-[#D4AF37]/60 w-24 h-20 bg-black shrink-0 shadow"
                                title="اضغط لتكبير صورة إيصال التحويل"
                              >
                                <img
                                  src={order.receiptImage}
                                  alt="إيصال التحويل"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </button>
                              <div className="text-[11px] text-[#A8A295]">
                                <span className="text-emerald-400 font-bold block">✓ صورة الإيصال مرفقة</span>
                                <span>اضغط على الصورة لتكبيرها وفحص تفاصيل الحوالة بدقة</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 rounded bg-amber-950/30 text-amber-300 text-[11px]">
                              لم يتم إرفاق صورة إيصال
                            </div>
                          )}
                        </div>

                        {/* Products Ordered */}
                        <div className="lg:col-span-3 space-y-2 text-xs bg-[#1F1F24] p-3.5 rounded-xl border border-[#2B2B32]">
                          <span className="font-bold text-[#D4AF37] block text-xs">
                            المنتجات المطلوبة ({order.items.length}):
                          </span>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-[11px] py-1 border-b border-[#2C2C34] last:border-none"
                              >
                                <span className="font-medium truncate max-w-[130px]">{item.productName}</span>
                                <span className="font-bold text-[#D4AF37]">
                                  {item.quantity} × {item.price} ₪
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Admin Note / Rejection Reason View */}
                      {order.adminNote && (
                        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
                          <span className="font-bold block mb-0.5">ملاحظة المدير للطلب:</span>
                          <p>{order.adminNote}</p>
                        </div>
                      )}

                      {order.rejectionReason && (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-700/50 text-xs text-rose-200 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-0.5">سبب رفض الطلب:</span>
                            <p>{order.rejectionReason}</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#25252A]">
                        
                        {/* Status Change Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleOpenApprove(order)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all"
                              >
                                <Check className="w-4 h-4" />
                                <span>اعتماد وتأكيد الطلب</span>
                              </button>

                              <button
                                onClick={() => handleOpenReject(order)}
                                className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-700/50 transition-all"
                              >
                                <X className="w-4 h-4" />
                                <span>رفض الطلب</span>
                              </button>
                            </>
                          )}

                          {order.status === 'approved' && (
                            <button
                              onClick={() => handleMarkCompleted(order.id)}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>تحديد كـ "مكتمل وتم التسليم"</span>
                            </button>
                          )}
                        </div>

                        {/* Order Deletion Actions (Custom Modal) */}
                        <div className="flex items-center gap-2">
                          {order.status === 'rejected' && (
                            <button
                              id={`btn-delete-rejected-order-${order.id}`}
                              onClick={() => triggerDeleteOrder(order)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                              title="حذف هذا الطلب المرفوض نهائياً من السجل"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>حذف الطلب المرفوض نهائياً</span>
                            </button>
                          )}

                          {order.status === 'completed' && (
                            <button
                              onClick={() => triggerDeleteOrder(order)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#222227] hover:bg-rose-950/60 border border-[#33333A] hover:border-rose-700 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
                              title="حذف من السجل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف من السجل</span>
                            </button>
                          )}

                          {order.status !== 'rejected' && order.status !== 'completed' && (
                            <button
                              onClick={() => triggerDeleteOrder(order)}
                              className="p-2 rounded-xl text-[#A8A295] hover:text-rose-400 hover:bg-rose-950/30 transition-colors text-xs flex items-center gap-1"
                              title="حذف الطلب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ===================== TAB 2: PRODUCTS ===================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* Products Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#17171A] p-4 sm:p-5 rounded-2xl border border-[#27272D]">
              <div>
                <h2 className="text-lg font-bold text-[#FAF7F2] font-serif-luxury">
                  إدارة المنتجات والمخزون
                </h2>
                <p className="text-xs text-[#A8A295] mt-0.5">
                  إضافة منتجات جديدة، تعديل الأسعار والمخزون، إخفاء المنتجات مؤقتاً أو حذفها نهائياً.
                </p>
              </div>

              <button
                id="btn-admin-add-product"
                onClick={handleOpenAddProduct}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B38938] hover:from-[#E2BE45] hover:to-[#C59B42] text-[#0E0E10] px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    productCategoryFilter === cat
                      ? 'bg-[#D4AF37] text-[#0E0E10] shadow-sm'
                      : 'bg-[#1E1E22] text-[#FAF7F2]/75 hover:bg-[#28282E] hover:text-white'
                  }`}
                >
                  {cat === 'all' ? `جميع المنتجات (${products.length})` : cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map((prod) => {
                const isNew = Date.now() - prod.createdAt < 7 * 24 * 60 * 60 * 1000;

                return (
                  <div
                    key={prod.id}
                    className={`bg-[#17171A] rounded-2xl border ${
                      prod.hidden ? 'border-dashed border-[#444] opacity-80' : 'border-[#27272D]'
                    } p-4 flex flex-col justify-between space-y-3 relative shadow-md hover:border-[#D4AF37]/40 transition-all`}
                  >
                    {/* Top image & status */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#2B2B32]">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        {isNew && (
                          <span className="bg-[#0E0E10] text-[#D4AF37] border border-[#D4AF37]/60 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                            جديد (أسبوع)
                          </span>
                        )}
                        {prod.isBestSeller && (
                          <span className="bg-gradient-to-r from-[#D4AF37] to-[#B38938] text-[#0E0E10] text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                            الأكثر طلباً
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2 left-2">
                        <span className="bg-[#0E0E10]/90 backdrop-blur-sm text-[#D4AF37] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#D4AF37]/30">
                          {prod.category}
                        </span>
                      </div>

                      {prod.hidden && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-xs font-bold text-amber-300 bg-black/90 px-3 py-1 rounded-full border border-amber-400/60 shadow">
                            مخفي عن الزبائن (نفاد الكمية)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div>
                      <h3 className="font-bold text-sm text-[#FAF7F2] line-clamp-1 font-serif-luxury">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-[#A8A295] line-clamp-2 mt-1 leading-relaxed font-light">
                        {prod.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#25252A] text-xs">
                        <span className="font-extrabold text-[#D4AF37] text-base">
                          {prod.price} <span className="text-xs font-bold">₪</span>
                        </span>
                        <span className="text-[#A8A295] font-medium">المخزون: {prod.stock} قطعة</span>
                      </div>
                    </div>

                    {/* Action Buttons: Toggle Visibility / Edit / Delete */}
                    <div className="pt-3 border-t border-[#25252A] grid grid-cols-3 gap-2 text-xs">
                      
                      <button
                        id={`btn-toggle-vis-${prod.id}`}
                        onClick={() => handleToggleProductVisibility(prod)}
                        className={`py-2 px-2 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all border ${
                          prod.hidden
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
                            : 'bg-[#202024] text-[#FAF7F2]/80 border-[#2E2E34] hover:border-[#D4AF37]/50 hover:text-white'
                        }`}
                        title={prod.hidden ? 'إظهار المنتج في المتجر' : 'إخفاء مؤقت عن الزبائن'}
                      >
                        {prod.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{prod.hidden ? 'إظهار' : 'إخفاء'}</span>
                      </button>

                      <button
                        id={`btn-edit-prod-${prod.id}`}
                        onClick={() => handleOpenEditProduct(prod)}
                        className="py-2 px-2 rounded-xl bg-[#202024] hover:bg-[#D4AF37] hover:text-[#0E0E10] text-[#FAF7F2]/90 border border-[#2E2E34] hover:border-[#D4AF37] font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        title="تعديل تفاصيل وأسعار المنتج"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>

                      <button
                        id={`btn-delete-prod-${prod.id}`}
                        onClick={() => triggerDeleteProduct(prod)}
                        className="py-2 px-2 rounded-xl bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        title="حذف المنتج نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ===================== TAB 3: SETTINGS ===================== */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#17171A] p-6 rounded-3xl border border-[#27272D] shadow-xl">
              <h2 className="text-xl font-bold text-[#FAF7F2] font-serif-luxury mb-1">
                إعدادات الحساب البنكي والمحفظة ومعلومات المتجر
              </h2>
              <p className="text-xs text-[#A8A295] mb-6">
                هذه المعلومات تظهر للزبائن عند إتمام الشراء لتحويل المبلغ، وتظهر في ترويسة وتذييل المتجر.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-6 text-right">
                
                {/* Bank Accounts */}
                <div className="space-y-4 p-4 rounded-2xl bg-[#1F1F24] border border-[#2A2A30]">
                  <h3 className="text-sm font-bold text-[#D4AF37]">1. معلومات الحساب البنكي والمحافظ:</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold">اسم البنك / جهة التحويل</label>
                      <input
                        type="text"
                        value={settingsForm.bankName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold">رقم الحساب / الآيبان (IBAN)</label>
                      <input
                        type="text"
                        value={settingsForm.accountNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold">اسم صاحب الحساب (كما يظهر بالتحويل)</label>
                      <input
                        type="text"
                        value={settingsForm.accountHolder}
                        onChange={(e) => setSettingsForm({ ...settingsForm, accountHolder: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold">رسوم التوصيل الافتراضية (شيكل)</label>
                      <input
                        type="number"
                        value={settingsForm.shippingFee}
                        onChange={(e) => setSettingsForm({ ...settingsForm, shippingFee: Number(e.target.value) })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold">اسم المحفظة الإلكترونية (جوال باي / ريفلكت)</label>
                      <input
                        type="text"
                        value={settingsForm.walletName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, walletName: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold">رقم المحفظة الإلكترونية</label>
                      <input
                        type="text"
                        value={settingsForm.walletNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, walletNumber: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Social & Contact */}
                <div className="space-y-4 p-4 rounded-2xl bg-[#1F1F24] border border-[#2A2A30]">
                  <h3 className="text-sm font-bold text-[#D4AF37]">2. قنوات التواصل وروابط التواصل الاجتماعي:</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>رقم الواتساب (مع المقدمة)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="+972 59-..."
                        value={settingsForm.whatsappNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                        <span>رابط حساب انستقرام</span>
                      </label>
                      <input
                        type="text"
                        placeholder="https://instagram.com/..."
                        value={settingsForm.instagramUrl}
                        onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold flex items-center gap-1.5">
                        <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                        <span>رابط صفحة فيسبوك</span>
                      </label>
                      <input
                        type="text"
                        placeholder="https://facebook.com/..."
                        value={settingsForm.facebookUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold">اسم المتجر المعروض</label>
                      <input
                        type="text"
                        value={settingsForm.storeName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold">الموقع ونطاق التوصيل الرئيسي</label>
                      <input
                        type="text"
                        placeholder="داخل قطاع غزة والجنوب فقط حالياً"
                        value={settingsForm.location}
                        onChange={(e) => setSettingsForm({ ...settingsForm, location: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold">ساعات استقبال الطلبات</label>
                      <input
                        type="text"
                        placeholder="في أي وقت طوال اليوم (24/7 على مدار الساعة)"
                        value={settingsForm.orderHours || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, orderHours: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[#FAF7F2] block mb-1 font-semibold">تفصيل مناطق التوصيل المشمولة</label>
                      <input
                        type="text"
                        placeholder="مدينة غزة، دير البلح، النصيرات، الزوايدة، البريج، المغازي، خانيونس، ورفح والمواصي"
                        value={settingsForm.deliveryAreas || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, deliveryAreas: e.target.value })}
                        className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38938] hover:from-[#E2BE45] hover:to-[#C59B42] text-[#0E0E10] font-bold text-xs sm:text-sm shadow-lg transition-all"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: SECURITY ===================== */}
        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto space-y-6 text-right" dir="rtl">
            
            {/* Security Features Overview Card */}
            <div className="bg-[#17171A] p-6 rounded-3xl border border-[#D4AF37]/30 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#FAF7F2] font-serif-luxury">
                    مركز الحماية وأمان صاحب الموقع
                  </h2>
                  <p className="text-xs text-[#D4AF37]">
                    أعلى معايير التشفير والحماية الصارمة لحساب الإدارة
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#141417] border border-[#27272D] text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>تشفير عالي القوة PBKDF2</span>
                  </div>
                  <p className="text-[11px] text-[#A8A295] leading-relaxed">
                    100,000 دورة تجزئة مع ملح رقمي عشوائي (Salt) فريد لكل كلمة مرور ضد هجمات القواميس والتخمين.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#141417] border border-[#27272D] text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>عدم حفظ الجلسة عند الخروج</span>
                  </div>
                  <p className="text-[11px] text-[#A8A295] leading-relaxed">
                    إلغاء فوري للجلسة عند إغلاق المتصفح أو المغادرة، ويتعين تسجيل الدخول بكلمة المرور في كل زيارة.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#141417] border border-[#27272D] text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>إنهاء آلي عند الخمول</span>
                  </div>
                  <p className="text-[11px] text-[#A8A295] leading-relaxed">
                    قفل تلقائي فوري بعد 15 دقيقة من عدم النشاط لحماية لوحة التحكم في حال ترك الجهاز مفتوحاً.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#141417] border border-[#27272D] text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-rose-400">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>حظر هجمات التخمين</span>
                  </div>
                  <p className="text-[11px] text-[#A8A295] leading-relaxed">
                    قفل أوتوماتيكي لمدة 15 دقيقة بعد 5 محاولات دخول خاطئة متتالية لمنع محاولات الاختراق.
                  </p>
                </div>
              </div>
            </div>

            {/* Change Credentials Form Card */}
            <div className="bg-[#17171A] p-6 sm:p-7 rounded-3xl border border-[#27272D] shadow-xl space-y-5">
              <div>
                <h3 className="text-base font-bold text-[#FAF7F2] font-serif-luxury mb-1">
                  تغيير بيانات الدخول وكلمة المرور
                </h3>
                <p className="text-xs text-[#A8A295]">
                  قم بتعيين اسم مستخدم مخصص وكلمة مرور قوية لحماية متجرك وحساباتك.
                </p>
              </div>

              <form onSubmit={handleUpdateSecurity} className="space-y-4 text-xs">
                {/* Current Password */}
                <div>
                  <label className="text-[#FAF7F2] block mb-1 font-semibold">
                    كلمة المرور الحالية <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={securityForm.currentPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      placeholder="أدخل كلمة المرور الحالية للتأكيد..."
                      className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#FAF7F2] p-1 transition-colors"
                      title={showCurrentPass ? 'إخفاء' : 'إظهار'}
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Username */}
                <div>
                  <label className="text-[#FAF7F2] block mb-1 font-semibold">
                    اسم المستخدم الجديد (اتركه دون تعديل لإبقاء الحالي)
                  </label>
                  <input
                    type="text"
                    value={securityForm.newUsername}
                    onChange={(e) => setSecurityForm({ ...securityForm, newUsername: e.target.value })}
                    placeholder="مثال: sabreen_admin"
                    className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                  />
                  <p className="text-[10.5px] text-[#8C827A] mt-1">
                    4 أحرف إنجليزية وأرقام على الأقل بدون مسافات.
                  </p>
                </div>

                {/* New Password with strength meter */}
                <div>
                  <label className="text-[#FAF7F2] block mb-1 font-semibold">
                    كلمة المرور الجديدة المشفرة (اتركها فارغة إذا أردت إبقاء الحالية)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#FAF7F2] p-1 transition-colors"
                      title={showNewPass ? 'إخفاء' : 'إظهار'}
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {securityForm.newPassword && (
                    <div className="mt-2.5 p-3 rounded-xl bg-[#141417] border border-[#2C2C32] space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#A8A295]">مستوى قوة كلمة المرور:</span>
                        <span className={`font-bold ${passwordStrength.color.split(' ')[1] || 'text-white'}`}>
                          {passwordStrength.label}
                        </span>
                      </div>

                      {/* Visual 4-Segment Progress Bar */}
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        <div className={`rounded-full transition-all ${passwordStrength.score >= 1 ? (passwordStrength.score === 1 ? 'bg-rose-500' : passwordStrength.score === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-[#2C2C32]'}`} />
                        <div className={`rounded-full transition-all ${passwordStrength.score >= 2 ? (passwordStrength.score === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-[#2C2C32]'}`} />
                        <div className={`rounded-full transition-all ${passwordStrength.score >= 3 ? 'bg-emerald-500' : 'bg-[#2C2C32]'}`} />
                        <div className={`rounded-full transition-all ${passwordStrength.score >= 4 ? 'bg-emerald-400' : 'bg-[#2C2C32]'}`} />
                      </div>

                      {/* Checklist */}
                      <div className="grid grid-cols-2 gap-1 text-[10.5px] pt-1 text-[#8C827A]">
                        <span className={passwordStrength.checks.length ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
                          {passwordStrength.checks.length ? '✓' : '•'} 8 خانات أو أكثر
                        </span>
                        <span className={passwordStrength.checks.letter ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
                          {passwordStrength.checks.letter ? '✓' : '•'} أحرف هجائية
                        </span>
                        <span className={passwordStrength.checks.number ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
                          {passwordStrength.checks.number ? '✓' : '•'} أرقام (0-9)
                        </span>
                        <span className={passwordStrength.checks.symbol ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
                          {passwordStrength.checks.symbol ? '✓' : '•'} رموز خاصة (!@#...)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="text-[#FAF7F2] block mb-1 font-semibold">تأكيد كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={securityForm.confirmNewPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirmNewPassword: e.target.value })}
                      placeholder="أعد كتابة كلمة المرور الجديدة..."
                      className="w-full bg-[#141417] border border-[#2C2C32] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#FAF7F2] p-1 transition-colors"
                      title={showConfirmPass ? 'إخفاء' : 'إظهار'}
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {securityForm.newPassword && securityForm.confirmNewPassword && securityForm.newPassword !== securityForm.confirmNewPassword && (
                    <p className="text-[10.5px] text-rose-400 mt-1">كلمتا المرور غير متطابقتين حالياً.</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#27272D]">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج وإنهاء الجلسة فوراً</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38938] hover:from-[#E2BE45] hover:to-[#C59B42] text-[#0E0E10] font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{loading ? 'جاري التشفير والحفظ...' : 'حفظ وتحديث بيانات الأمان'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

      </div>

      {/* ===================== MODAL: IN-APP DELETE CONFIRMATION ===================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="relative w-full max-w-md bg-[#161619] border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-right">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#FAF7F2] font-serif-luxury">
                  {deleteConfirm.type === 'order' ? 'تأكيد حذف الطلب نهائياً' : 'تأكيد حذف المنتج نهائياً'}
                </h3>
                <p className="text-xs text-[#A8A295] mt-0.5">
                  {deleteConfirm.type === 'order'
                    ? 'سيتم مسح هذا الطلب وصورة إيصاله نهائياً من السجل.'
                    : 'سيتم مسح هذا المنتج بالكامل من المتجر وقائمة المنتجات.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1C1C20] border border-[#2A2A2E] text-xs space-y-1 text-[#E5D7B3]">
              <span className="font-bold block text-[#FAF7F2]">{deleteConfirm.title}</span>
              {deleteConfirm.extraInfo && (
                <span className="text-[#C5A859] block text-[11px]">{deleteConfirm.extraInfo}</span>
              )}
            </div>

            <p className="text-[11px] text-rose-300 font-medium">
              تنبيه: لا يمكن استرجاع هذا العنصر بعد حذفه.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#232328] hover:bg-[#2C2C33] text-[#FAF7F2] text-xs font-semibold transition-colors"
              >
                إلغاء وتراجع
              </button>

              <button
                id="btn-confirm-delete-action"
                type="button"
                onClick={executeDeletion}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/40 flex items-center gap-1.5"
              >
                {loading ? (
                  <span>جاري الحذف...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>نعم، حذف نهائياً</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================== MODAL: ORDER ACTION (Approve / Reject) ===================== */}
      {actionOrder && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="relative w-full max-w-lg bg-[#18181C] border border-[#2F2F36] rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B32]">
              <h3 className="text-base font-bold text-[#FAF7F2] font-serif-luxury">
                {actionType === 'approve' ? 'اعتماد وتأكيد الطلب' : 'رفض الطلب'}
              </h3>
              <button
                onClick={() => {
                  setActionOrder(null);
                  setActionType(null);
                }}
                className="p-1.5 rounded-lg hover:bg-[#25252A] text-[#A8A295]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 text-[#A8A295]">
              <p>طلب رقم: <span className="text-[#D4AF37] font-bold">#{actionOrder.id}</span></p>
              <p>الزبون: <span className="text-[#FAF7F2] font-semibold">{actionOrder.customerName}</span> ({actionOrder.totalAmount} ₪)</p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[#FAF7F2] font-semibold block">
                {actionType === 'approve' ? 'ملاحظة للطلب (تظهر في السجل):' : 'سبب الرفض (سبب عدم قبول الإيصال أو الطلب):'}
              </label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full bg-[#121214] border border-[#2E2E35] rounded-xl p-3 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setActionOrder(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#232328] hover:bg-[#2B2B32] text-[#FAF7F2] text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmOrderAction}
                disabled={loading}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                }`}
              >
                {loading ? 'جاري المعالجة...' : actionType === 'approve' ? 'تأكيد الاعتماد' : 'تأكيد الرفض'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: FULLSCREEN RECEIPT ===================== */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" dir="rtl">
          <div className="relative max-w-2xl w-full bg-[#17171A] rounded-3xl border border-[#D4AF37]/50 overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#1F1F24] border-b border-[#2C2C32] flex items-center justify-between">
              <span className="text-xs font-bold text-[#D4AF37]">صورة إثبات التحويل البنكي أو المحفظة</span>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={selectedReceipt}
                alt="إيصال كامل"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD / EDIT PRODUCT ===================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto" dir="rtl">
          <div className="relative w-full max-w-2xl bg-[#17171A] border border-[#2F2F36] rounded-3xl p-6 shadow-2xl space-y-5 my-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#29292F]">
              <h3 className="text-lg font-bold text-[#FAF7F2] font-serif-luxury">
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج طبيعي جديد للمتجر'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 rounded-full hover:bg-[#25252A] text-[#A8A295] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs text-right">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#FAF7F2] block mb-1 font-semibold">
                    اسم المنتج <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: زيت الأرغان المغربي النقي"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-[#121214] border border-[#2D2D34] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#FAF7F2] block mb-1 font-semibold">
                    السعر بالشيكل (₪) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="مثال: 65"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-[#121214] border border-[#2D2D34] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#FAF7F2] font-semibold">
                      تصنيف المنتج (كتابة يدوية حرة) <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-[#D4AF37] font-medium">اكتب أي تصنيف تريده</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="اكتب تصنيف المنتج مثلاً: زيوت شعر، صابون، كريمات، خلطات..."
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-[#121214] border border-[#2D2D34] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none placeholder:text-[#555]"
                  />
                  {/* Quick Category Suggestion Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] text-[#8C8270]">اقتراحات سريعة:</span>
                    {Array.from(new Set([
                      ...products.map((p) => p.category).filter(Boolean),
                      'زيوت شعر',
                      'صابون',
                      'كريمات',
                      'سيروم',
                      'عناية شخصية',
                      'خلطات طبيعية',
                      'ماسكات'
                    ])).slice(0, 6).map((suggestedCat) => (
                      <button
                        key={suggestedCat}
                        type="button"
                        onClick={() => setProductForm({ ...productForm, category: suggestedCat })}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                          productForm.category === suggestedCat
                            ? 'bg-[#D4AF37]/25 border-[#D4AF37] text-[#D4AF37] font-bold'
                            : 'bg-[#141417] border-[#2A2A30] text-[#A8A295] hover:border-[#D4AF37]/50 hover:text-white'
                        }`}
                      >
                        {suggestedCat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#FAF7F2] block mb-1 font-semibold">الكمية في المخزون</label>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      className="w-full bg-[#121214] border border-[#2D2D34] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#FAF7F2] block mb-1 font-semibold">الحجم / السعة</label>
                    <input
                      type="text"
                      placeholder="مثال: 50 مل أو 150 غرام"
                      value={productForm.volume}
                      onChange={(e) => setProductForm({ ...productForm, volume: e.target.value })}
                      className="w-full bg-[#121214] border border-[#2D2D34] rounded-xl px-3 py-2.5 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[#FAF7F2] block mb-1 font-semibold">وصف المنتج</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-[#121214] border border-[#2D2D34] rounded-xl px-3 py-2 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {/* Image Input and Preview */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#1E1E23] border border-[#2B2B32]">
                <label className="text-[#FAF7F2] block font-semibold">صورة المنتج (رابط أو رفع من جهازك):</label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    placeholder="رابط الصورة (URL)"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="flex-1 w-full bg-[#141417] border border-[#2D2D34] rounded-xl px-3 py-2 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none text-xs"
                  />
                  
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#2A2A30] hover:bg-[#D4AF37] hover:text-[#0E0E10] text-[#FAF7F2] font-semibold transition-all shrink-0">
                    رفع صورة
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>

                  {productForm.image && (
                    <img
                      src={productForm.image}
                      alt="معاينة"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]/50 shrink-0"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#FAF7F2] block mb-1 font-semibold">المكونات الطبيعية</label>
                  <input
                    type="text"
                    placeholder="مثال: زيت زيتون بكر، خلاصة الصبار، فيتامين E"
                    value={productForm.ingredients}
                    onChange={(e) => setProductForm({ ...productForm, ingredients: e.target.value })}
                    className="w-full bg-[#121214] border border-[#2D2D34] rounded-xl px-3 py-2 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#FAF7F2] block mb-1 font-semibold">طريقة الاستخدام</label>
                  <input
                    type="text"
                    placeholder="مثال: يوضع على بشرة نظيفة مساءً"
                    value={productForm.usage}
                    onChange={(e) => setProductForm({ ...productForm, usage: e.target.value })}
                    className="w-full bg-[#121214] border border-[#2D2D34] rounded-xl px-3 py-2 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#FAF7F2] block mb-1 font-semibold">الفوائد (افصل بينها بعلامة | )</label>
                <input
                  type="text"
                  placeholder="ترطيب عميق | توحيد لون البشرة | مضاد للأكسدة"
                  value={productForm.benefits}
                  onChange={(e) => setProductForm({ ...productForm, benefits: e.target.value })}
                  className="w-full bg-[#121214] border border-[#2D2D34] rounded-xl px-3 py-2 text-[#FAF7F2] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-bestseller"
                  checked={productForm.isBestSeller}
                  onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                  className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <label htmlFor="chk-bestseller" className="text-xs text-[#FAF7F2] cursor-pointer font-medium">
                  تمييز المنتج بشارة "الأكثر طلباً" في المتجر
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#29292F]">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#222227] hover:bg-[#2A2A30] text-[#FAF7F2] text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  id="btn-submit-product-form"
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38938] hover:from-[#E2BE45] hover:to-[#C59B42] text-[#0E0E10] font-bold text-xs shadow-md transition-all"
                >
                  {loading ? 'جاري الحفظ...' : editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
