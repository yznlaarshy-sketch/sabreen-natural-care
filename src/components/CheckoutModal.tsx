import React, { useState } from 'react';
import { X, UploadCloud, Copy, Check, ShieldCheck, AlertCircle, ShoppingBag, MessageCircle, ArrowRight, MapPin, Clock, Truck } from 'lucide-react';
import { CartItem, StoreSettings, Order } from '../types';
import { submitOrder } from '../services/api';

const GAZA_REGIONS = [
  'مدينة غزة (الرمال، النصر، الصبرة، الشجاعية، تل الهوى، الميناء، الزيتون، الشيخ رضوان)',
  'دير البلح - المنطقة الوسطى (البلد، معسكر دير البلح، الحكر، شارع النخيل، البركة)',
  'مخيم النصيرات - المنطقة الوسطى (المخيم، السوق، شارع العشرين، مخيم 1، مخيم 2)',
  'الزوايدة - المنطقة الوسطى',
  'مخيم البريج - المنطقة الوسطى',
  'مخيم المغازي - المنطقة الوسطى',
  'خانيونس - المدينة والسطر وحي الأمل وجورة اللوت ومعن',
  'مواصي خانيونس (منطقة البحر ومخيمات الإيواء)',
  'رفح - المدينة وتل السلطان والحي السعودي',
  'مواصي رفح',
  'منطقة أو نقطة أخرى داخل غزة أو الجنوب'
];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  settings: StoreSettings | null;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onOrderSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryZone, setDeliveryZone] = useState(GAZA_REGIONS[0]);
  const [customZone, setCustomZone] = useState('');
  const [address, setAddress] = useState('');
  const [transferInfo, setTransferInfo] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = settings?.shippingFee || 0;
  const totalAmount = subtotal + shippingFee;

  const effectiveZone = deliveryZone === 'منطقة أو نقطة أخرى داخل غزة أو الجنوب' && customZone.trim()
    ? customZone.trim()
    : deliveryZone;

  // Validation: Button ONLY enabled when all fields and receipt screenshot are present
  const isFormValid =
    customerName.trim().length >= 2 &&
    phone.trim().length >= 8 &&
    effectiveZone.trim().length >= 2 &&
    address.trim().length >= 4 &&
    transferInfo.trim().length >= 2 &&
    receiptImage !== null;

  const handleCopyAccount = () => {
    const textToCopy = settings?.accountNumber || '';
    if (navigator.clipboard && textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('يرجى رفع ملف صورة صالح (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 10 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !receiptImage) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await submitOrder({
        customerName,
        phone,
        deliveryZone: effectiveZone,
        address,
        transferInfo,
        receiptImage,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });

      if (result.success && result.order) {
        setSubmittedOrder(result.order);
        onOrderSuccess(result.order);
      } else {
        setErrorMessage(result.error || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة ثانية');
      }
    } catch (err: any) {
      setErrorMessage('تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت والمحاولة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-3xl border border-[#E6E1D8] shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#FFFFFF] border-b border-[#EAE5DC] flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#141416] font-serif-luxury">
              {submittedOrder ? 'تم تأكيد استلام طلبك بنجاح' : 'إتمام الشراء والتحويل المالي'}
            </h2>
            {!submittedOrder && (
              <p className="text-xs text-[#736B5E] mt-0.5">
                يرجى تحويل المبلغ وتعبئة البيانات لتوثيق وتجهيز طلبك
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F5F2EB] text-[#736B5E] hover:text-[#141416] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submittedOrder ? (
          /* Order Confirmation View */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] text-[#B38938] mx-auto flex items-center justify-center shadow-lg">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#B38938] px-3 py-1 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/30">
                رقم الطلب: #{submittedOrder.id}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#141416] font-serif-luxury">
                شكراً لثقتك بـ Sabreen Basheer Natural Care
              </h3>
              <p className="text-xs sm:text-sm text-[#544E43] max-w-md mx-auto leading-relaxed">
                تم استلام طلبك وإثبات التحويل بنجاح. سيقوم فريق المتجر بمراجعة الإيصال وتجهيز طلبك وإرساله لعنوانك خلال أقرب وقت.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#EAE5DC] text-right space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#F0EBE1]">
                <span className="text-[#8C8270]">الاسم:</span>
                <span className="font-bold text-[#141416]">{submittedOrder.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE1]">
                <span className="text-[#8C8270]">رقم الجوال:</span>
                <span className="font-bold text-[#141416]">{submittedOrder.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE1]">
                <span className="text-[#8C8270]">منطقة التوصيل:</span>
                <span className="font-bold text-[#B38938]">{submittedOrder.deliveryZone || 'داخل قطاع غزة والجنوب'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE1]">
                <span className="text-[#8C8270]">العنوان التفصيلي:</span>
                <span className="font-bold text-[#141416]">{submittedOrder.address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE1]">
                <span className="text-[#8C8270]">قيمة المنتجات المحولة:</span>
                <span className="font-extrabold text-[#B38938] text-sm">{submittedOrder.totalAmount} ₪ شيكل</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE1] text-[11px] text-[#8C6D23] bg-[#FAF6EE] px-2 rounded-lg">
                <span className="font-bold">رسوم التوصيل:</span>
                <span className="font-bold">يحددها مندوب التوصيل (الدليفري) وتُدفع له عند الاستلام</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE1] text-[11px] text-[#544E43]">
                <span>مدة التوصيل المتوقعة:</span>
                <span className="font-bold text-[#141416]">خلال 2 إلى 5 أيام عمل (بحسب المنطقة السكنية)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8C8270]">عدد المنتجات:</span>
                <span className="font-bold text-[#141416]">{submittedOrder.items.length} منتج</span>
              </div>
            </div>

            {/* WhatsApp Contact Action */}
            {settings?.whatsappNumber && (
              <div className="pt-2">
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `مرحباً د. صابرين، قمت بإتمام الطلب رقم #${submittedOrder.id} بقيمة منتجات ${submittedOrder.totalAmount} ₪ باسم ${submittedOrder.customerName}. منطقة التوصيل: ${submittedOrder.deliveryZone || 'غزة والجنوب'} - ${submittedOrder.address}. (مدة التوصيل المتوقعة 2 إلى 5 أيام ورسوم الدليفري تُدفع عند الاستلام). أود تأكيد الطلب وتجهيزه.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all text-xs sm:text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>تأكيد الطلب مع د. صابرين بشير عبر واتساب</span>
                </a>
              </div>
            )}

            <div>
              <button
                onClick={onClose}
                className="text-xs text-[#736B5E] hover:text-[#141416] underline font-medium"
              >
                العودة للتسوق في المتجر
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            
            {/* Delivery Scope & Order Receiving Hours Banner */}
            <div className="bg-[#FAF6EE] border border-[#E6DEC8] rounded-2xl p-4 space-y-2.5 text-xs text-[#544E43]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/15 text-[#B38938] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#141416]">نطاق التوصيل:</span>{' '}
                    <span className="font-semibold text-[#8C6D23]">{settings?.location || 'داخل قطاع غزة والجنوب فقط حالياً'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#141416] text-[#D4AF37] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#141416]">ساعات استقبال الطلبات:</span>{' '}
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {settings?.orderHours || 'في أي وقت طوال اليوم (24/7)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Duration & Courier Fee Notices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#EAE3D3] text-[11px]">
                <div className="bg-white/80 p-2 rounded-xl border border-[#E5DEC9] flex items-start gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#B38938] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#141416] block">مدة التوصيل المتوقعة:</strong>
                    <span className="text-[#665D4F]">من يومين إلى 5 أيام بحسب منطقتك السكنية (قد تزيد أو تقل قليلاً حسب ظروف الطرق).</span>
                  </div>
                </div>

                <div className="bg-white/80 p-2 rounded-xl border border-[#E5DEC9] flex items-start gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#B38938] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#141416] block">رسوم التوصيل (الدليفري):</strong>
                    <span className="text-[#665D4F]">يحددها مندوب التوصيل عند التسليم بحسب منطقتك، وتُسدد له نقداً ومباشرة عند الاستلام.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Automatic Transfer Instructions Box (Managed from Admin Settings) */}
            <div className="bg-[#141416] text-[#FAF8F5] p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/40 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className="text-xs font-bold text-[#D4AF37]">
                    رسالة تحويل الدفعة للطلب
                  </span>
                </div>
                <span className="text-xs font-bold bg-[#D4AF37]/20 text-[#D4AF37] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                  قيمة المنتجات: {totalAmount} ₪
                </span>
              </div>

              <div className="text-xs text-[#C4C0B6] leading-relaxed space-y-2">
                <p>
                  يرجى تحويل قيمة المنتجات (<strong className="text-[#FAF8F5]">{totalAmount} شيكل</strong>) عبر بنك فلسطين، كافة البنوك، أو عبر محفظة <strong>جوال باي (Jawwal Pay)</strong>، <strong>بال باي (PalPay)</strong> أو أي محفظة معتمدة.
                </p>
                <div className="bg-[#1F1F22] p-3 rounded-xl border border-[#333] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8C8270]">طرق الدفع المدعومة:</span>
                    <span className="font-bold text-[#D4AF37]">بنك فلسطين • كافة البنوك • جوال باي • بال باي • جميع المحافظ</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-[#2A2A2A]">
                    <span className="text-[#8C8270]">اسم المستفيد:</span>
                    <span className="font-bold text-[#D4AF37]">{settings?.accountHolder || 'د. صابرين بشير'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-[#2A2A2A]">
                    <span className="text-[#8C8270]">رقم الحساب / المحفظة:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#FAF8F5] select-all">
                        {settings?.accountNumber || '0597096510'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="p-1 rounded bg-[#2A2A2E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] transition-colors"
                        title="نسخ رقم الحساب"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-[#A8A295] bg-[#222226] p-2 rounded-lg border border-[#333]">
                  💡 <strong>ملاحظة:</strong> المبلغ المحول هنا خاص بقيمة المنتجات فقط، أما رسوم التوصيل فيحددها مندوب الدليفري عند الوصول وتُدفع له مباشرة عند استلام الطلب.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Fields: 1. Full Name, 2. Phone, 3. Delivery Zone, 4. Detailed Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#141416] block">
                  1. الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سارة أحمد الخالدي"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DCD5C9] rounded-xl px-3.5 py-2.5 text-xs text-[#141416] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#141416] block">
                  2. رقم الجوال / واتساب <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="059xxxxxxx أو 056xxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DCD5C9] rounded-xl px-3.5 py-2.5 text-xs text-[#141416] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            {/* 3. Delivery Area Selector within Gaza & South */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#141416] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B38938]" />
                  <span>3. تحديد منطقة التوصيل (داخل قطاع غزة والجنوب)</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-[#B38938] font-bold bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                  غزة والجنوب فقط حالياً
                </span>
              </div>
              <select
                value={deliveryZone}
                onChange={(e) => setDeliveryZone(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#DCD5C9] rounded-xl px-3.5 py-2.5 text-xs text-[#141416] font-medium focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                {GAZA_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>

              {deliveryZone === 'منطقة أو نقطة أخرى داخل غزة أو الجنوب' && (
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسم المنطقة أو المخيم أو النقطة داخل غزة / الجنوب بالتحديد"
                    value={customZone}
                    onChange={(e) => setCustomZone(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#DCD5C9] rounded-xl px-3.5 py-2.5 text-xs text-[#141416] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              )}
            </div>

            {/* 4. Detailed Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#141416] block">
                4. العنوان التفصيلي وأقرب معلم دال <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="الحي، اسم الشارع، بجانب مدرسة / صيدلية / مسجد، رقم الخيمة أو البناية"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#DCD5C9] rounded-xl px-3.5 py-2.5 text-xs text-[#141416] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            {/* 5. Transfer details */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#141416] block">
                5. بيانات التحويل المالي <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثلاً: تحويل بنك فلسطين / محفظة جوال باي / بال باي - اسم المحوّل أو رقم الحوالة"
                value={transferInfo}
                onChange={(e) => setTransferInfo(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#DCD5C9] rounded-xl px-3.5 py-2.5 text-xs text-[#141416] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            {/* 6. Upload Transfer Screenshot */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#141416] block">
                6. رفع صورة إثبات التحويل (سكرين شوت أو إيصال) <span className="text-red-500">*</span>
              </label>

              {receiptImage ? (
                <div className="relative rounded-2xl border border-[#D4AF37]/50 bg-[#FFFFFF] p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={receiptImage}
                      alt="إثبات التحويل"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 object-cover rounded-xl border border-[#EAE5DC]"
                    />
                    <div className="text-right">
                      <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        تم إرفاق صورة التحويل
                      </span>
                      <span className="text-[10px] text-[#736B5E] block">جاهز للمطابقة والتحقق</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceiptImage(null)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50"
                  >
                    تغيير الصورة
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-[#DCD5C9] hover:border-[#D4AF37] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#FFFFFF] hover:bg-[#FAF6EE] transition-colors">
                  <UploadCloud className="w-8 h-8 text-[#B38938] mb-2" />
                  <span className="text-xs font-bold text-[#141416]">
                    اضغط هنا لرفع صورة الإيصال (سكرين شوت)
                  </span>
                  <span className="text-[10px] text-[#736B5E] mt-1">
                    يدعم صور JPG, PNG من المعرض أو الكاميرا
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Validation Indicator Notice */}
            {!isFormValid && (
              <div className="text-[11px] text-[#8C8270] bg-[#F5F2EB] p-2.5 rounded-xl border border-[#E6E1D8] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-[#B38938] shrink-0" />
                <span>
                  يُرجى تعبئة جميع الحقول وإرفاق صورة الإيصال لتفعيل زر &quot;إرسال الطلب&quot;.
                </span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="btn-submit-order"
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  !isFormValid || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#171717] via-[#2A2418] to-[#171717] hover:from-[#D4AF37] hover:to-[#B38938] text-[#FAF8F5] hover:text-[#0D0D0D] active:scale-[0.99]'
                }`}
              >
                {isSubmitting ? (
                  <span>جاري إرسال الطلب وتأكيد البيانات...</span>
                ) : (
                  <>
                    <span>إرسال الطلب واعتماد التحويل ({totalAmount} ₪)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
