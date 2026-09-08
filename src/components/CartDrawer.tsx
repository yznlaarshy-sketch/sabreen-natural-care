import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Sparkles, MapPin } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  shippingFee: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  shippingFee,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal > 0 ? subtotal + shippingFee : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] border-r border-[#E6E1D8] shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#FFFFFF] border-b border-[#EAE5DC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#B38938]" />
              <h2 className="font-bold text-lg text-[#141416] font-serif-luxury">
                سلة المشتريات ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              id="btn-close-cart"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#F5F2EB] text-[#736B5E] hover:text-[#141416] transition-colors"
              aria-label="إغلاق السلة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8C8270]">
                <div className="w-16 h-16 rounded-full bg-[#F5F2EB] flex items-center justify-center mb-4 text-[#B38938]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-base text-[#141416] mb-1">سلتك فارغة حالياً</h3>
                <p className="text-xs text-[#736B5E] max-w-xs mb-6">
                  استكشفي منتجاتنا الطبيعية وأضيفي ما يناسب جمالك وعنايتك اليومية
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-[#141416] text-[#FAF8F5] hover:bg-[#D4AF37] hover:text-[#0D0D0D] text-xs font-bold transition-all"
                >
                  تصفح المنتجات
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-[#FFFFFF] rounded-2xl p-3 border border-[#EAE5DC] shadow-sm flex items-center gap-3 relative"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover bg-[#F5F2EB] border border-[#E6E1D8] shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-right">
                    <h4 className="font-bold text-xs text-[#141416] truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-[11px] text-[#8C8270] block">
                      {item.product.price} ₪ للقطعة
                    </span>
                    <span className="text-xs font-extrabold text-[#141416] mt-1 block">
                      الإجمالي: {item.product.price * item.quantity} ₪
                    </span>
                  </div>

                  {/* Quantity controls & Delete */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-[#A39B8C] hover:text-red-500 transition-colors p-1"
                      title="حذف من السلة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center border border-[#D4AF37]/40 rounded-lg bg-[#FAF8F5] p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-[#EAE5DC] rounded text-[#141416]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-[#141416]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-[#EAE5DC] rounded text-[#141416]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout Button */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-[#FFFFFF] border-t border-[#EAE5DC] space-y-3">
              <div className="space-y-2 text-xs text-[#544E43]">
                <div className="flex justify-between">
                  <span>مجموع قيمة المنتجات:</span>
                  <span className="font-semibold text-[#141416]">{subtotal} ₪</span>
                </div>
                <div className="flex justify-between items-center text-[11px] bg-[#FAF6EE] px-2.5 py-1.5 rounded-xl border border-[#EAE3D3]">
                  <span className="text-[#8C6D23] font-bold">رسوم التوصيل:</span>
                  <span className="text-[#8C6D23] font-medium">يحددها مندوب الدليفري عند الاستلام</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#141416] pt-2 border-t border-[#EAE5DC]">
                  <span>المبلغ المطلوب تحويله:</span>
                  <span className="text-base text-[#B38938]">{subtotal} ₪</span>
                </div>
              </div>

              <div className="bg-[#FAF6EE] border border-[#EAE3D3] rounded-xl p-2.5 text-[11px] text-[#6B6152] space-y-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B38938] shrink-0" />
                  <span className="font-semibold text-[#141416]">التوصيل داخل غزة والجنوب خلال 2 إلى 5 أيام</span>
                </div>
                <p className="text-[10.5px] text-[#7E7465] leading-relaxed">
                  💳 الدفع متاح عبر بنك فلسطين، كافة البنوك، محافظ جوال باي (Jawwal Pay)، بال باي (PalPay)، وجميع المحافظ.
                </p>
              </div>

              <button
                id="btn-proceed-checkout"
                onClick={onProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#171717] to-[#262626] hover:from-[#D4AF37] hover:to-[#B38938] text-[#FAF8F5] hover:text-[#0D0D0D] font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <span>متابعة إتمام الطلب والتحويل</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-[#8C8270] flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-[#B38938]" />
                <span>الدفع يتم عبر التحويل البنكي أو المحفظة الإلكترونية</span>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
