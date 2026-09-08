import React, { useState } from 'react';
import { X, ShoppingBag, Sparkles, Check, Heart, Shield, Plus, Minus } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const isNew = Date.now() - product.createdAt < 7 * 24 * 60 * 60 * 1000;
  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    onAddToCart(product, qty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-3xl border border-[#E6E1D8] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        dir="rtl"
      >
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 p-2 rounded-full bg-white/90 text-[#1A1A1A] hover:bg-[#D4AF37] hover:text-black transition-colors shadow-md"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            {/* Image */}
            <div className="sm:col-span-5 rounded-2xl overflow-hidden border border-[#E6E1D8] bg-[#F5F2EB] aspect-square relative shadow-inner">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {isNew && (
                <div className="absolute top-3 right-3 bg-[#0D0D0D] text-[#D4AF37] text-xs font-bold px-3 py-1 rounded-full border border-[#D4AF37]/30 flex items-center gap-1 shadow">
                  <Sparkles className="w-3 h-3" />
                  <span>وصل حديثاً</span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="sm:col-span-7 space-y-3 text-right">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#D4AF37]/15 text-[#8C6D23] border border-[#D4AF37]/30">
                  {product.category}
                </span>
                {product.volume && (
                  <span className="text-xs text-[#736B5E] font-medium">
                    العبوة: {product.volume}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#141416] font-serif-luxury leading-tight">
                {product.name}
              </h2>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl font-extrabold text-[#141416]">
                  {product.price} <span className="text-sm font-semibold text-[#B38938]">₪ شيكل</span>
                </span>
                <span className="text-xs text-[#736B5E]">شامل الضريبة</span>
              </div>

              <p className="text-sm text-[#544E43] leading-relaxed pt-2 border-t border-[#EAE5DC]">
                {product.description}
              </p>
            </div>
          </div>

          {/* Benefits */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#EAE5DC] space-y-2">
              <h4 className="text-sm font-bold text-[#141416] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>أبرز الفوائد والنتائج</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-[#544E43]">
                {product.benefits.map((b, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#B38938] shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* How to use */}
          {product.usage && (
            <div className="bg-[#F5F2EB] p-4 rounded-2xl border border-[#E6E1D8] space-y-1 text-right">
              <h4 className="text-xs font-bold text-[#141416]">طريقة الاستخدام المثلى:</h4>
              <p className="text-xs text-[#544E43] leading-relaxed">{product.usage}</p>
            </div>
          )}

          {/* Ingredients */}
          {product.ingredients && (
            <div className="space-y-1 text-right text-xs text-[#736B5E]">
              <span className="font-semibold text-[#3D382F]">المكونات الفعالة: </span>
              <span>{product.ingredients}</span>
            </div>
          )}

          {/* Natural Guarantee */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF6EE] border border-[#D4AF37]/30 text-xs text-[#665223]">
            <Shield className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>منتج طبيعي 100%، خالٍ من البارابين والسلفات والمواد الكيميائية الضارة.</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 bg-[#FFFFFF] border-t border-[#EAE5DC] flex items-center justify-between gap-4">
          {/* Quantity selector */}
          <div className="flex items-center border border-[#D4AF37]/40 rounded-xl bg-[#FAF8F5] p-1">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={isOutOfStock}
              className="p-1.5 rounded-lg hover:bg-[#EAE5DC] text-[#141416] transition-colors disabled:opacity-50"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-[#141416]">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              disabled={isOutOfStock}
              className="p-1.5 rounded-lg hover:bg-[#EAE5DC] text-[#141416] transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#171717] to-[#262626] hover:from-[#D4AF37] hover:to-[#B38938] text-[#FAF8F5] hover:text-[#0D0D0D]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isOutOfStock ? 'نفد من المخزون' : `إضافة للسلة (${product.price * qty} ₪)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
