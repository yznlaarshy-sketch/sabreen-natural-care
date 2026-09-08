import React from 'react';
import { ShoppingBag, Sparkles, Star, Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
}) => {
  // Check if product is new (within 7 days of creation)
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const isNew = Date.now() - product.createdAt < SEVEN_DAYS_MS;
  const isOutOfStock = product.stock <= 0;

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative bg-[#FFFFFF] rounded-2xl border border-[#E7E2D8] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(212,175,55,0.12)] transition-all duration-300 flex flex-col overflow-hidden hover:border-[#D4AF37]/60"
    >
      {/* Image Container with Badges */}
      <div className="relative w-full aspect-square bg-[#F5F2EB] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Quick View Button on hover */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onViewDetails(product)}
            className="p-3 rounded-full bg-[#FAF7F2] text-[#1A1A1A] hover:bg-[#D4AF37] hover:text-[#0E0E10] shadow-lg transition-transform hover:scale-110 flex items-center gap-1.5 text-xs font-bold"
            title="عرض التفاصيل والمكونات"
          >
            <Eye className="w-4 h-4" />
            <span>عرض التفاصيل</span>
          </button>
        </div>

        {/* Badges container */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end z-10">
          {/* New Arrival Badge (Automatic for 7 days) */}
          {isNew && (
            <span
              id={`badge-new-${product.id}`}
              className="inline-flex items-center gap-1 bg-[#0E0E10] text-[#D4AF37] border border-[#D4AF37]/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md"
            >
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>جديد</span>
            </span>
          )}

          {/* Best Seller Badge */}
          {product.isBestSeller && (
            <span
              id={`badge-bestseller-${product.id}`}
              className="inline-flex items-center gap-1 bg-gradient-to-r from-[#D4AF37] to-[#B38938] text-[#0E0E10] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md"
            >
              <Star className="w-3 h-3 fill-current" />
              <span>الأكثر طلباً</span>
            </span>
          )}
        </div>

        {/* Category Pill on image left */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-[#FAF7F2]/95 backdrop-blur-sm text-[#3D5A4C] text-[10px] font-semibold px-2.5 py-0.5 rounded-md border border-[#E7E2D8] shadow-xs">
            {product.category}
          </span>
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-[#1A1A1A] text-[#FAF7F2] text-xs font-bold px-3 py-1.5 rounded-full border border-red-500/40 shadow-lg">
              نفد من المخزون
            </span>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="p-4 flex-1 flex flex-col justify-between text-right">
        <div>
          {product.volume && (
            <span className="text-[10px] text-[#8C8270] font-medium block mb-1">
              الحجم / الوزن: {product.volume}
            </span>
          )}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-[#19191C] text-sm sm:text-base leading-snug line-clamp-1 hover:text-[#B38938] cursor-pointer transition-colors"
          >
            {product.name}
          </h3>
          <p className="text-xs text-[#5F594D] line-clamp-2 mt-1.5 leading-relaxed font-light">
            {product.description}
          </p>
        </div>

        {/* Price & Action button */}
        <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#8C8270]">السعر</span>
            <span className="text-base sm:text-lg font-extrabold text-[#19191C]">
              {product.price} <span className="text-xs font-bold text-[#B38938]">₪ شيكل</span>
            </span>
          </div>

          <button
            id={`btn-add-cart-${product.id}`}
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#141416] text-[#FAF7F2] hover:bg-[#D4AF37] hover:text-[#0E0E10] active:scale-95 shadow-sm'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'نفد' : 'أضف للسلة'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
