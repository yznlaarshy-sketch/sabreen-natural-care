import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Sparkles, Check, Heart, Shield, Plus, Minus, Star, Send } from 'lucide-react';
import { Product, Review } from '../types';
import { fetchProductReviews, submitReview } from '../services/api';

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

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!product) {
      setReviews([]);
      setReviewSubmitted(false);
      setReviewForm({ customerName: '', rating: 5, comment: '' });
      setReviewError('');
      return;
    }
    setReviewsLoading(true);
    fetchProductReviews(product.id)
      .then(setReviews)
      .finally(() => setReviewsLoading(false));
  }, [product?.id]);

  if (!product) return null;

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');

    if (!reviewForm.customerName.trim() || reviewForm.customerName.trim().length < 2) {
      setReviewError('يرجى إدخال اسمك (حرفين على الأقل)');
      return;
    }
    if (!reviewForm.comment.trim() || reviewForm.comment.trim().length < 3) {
      setReviewError('يرجى كتابة تعليق قصير عن تجربتك مع المنتج');
      return;
    }

    setReviewSubmitting(true);
    const result = await submitReview({
      productId: product.id,
      customerName: reviewForm.customerName.trim(),
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
    });
    setReviewSubmitting(false);

    if (result.success) {
      setReviewSubmitted(true);
      setReviewForm({ customerName: '', rating: 5, comment: '' });
    } else {
      setReviewError(result.error || 'تعذر إرسال التقييم، يرجى المحاولة لاحقاً');
    }
  };


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

          {/* Reviews Section */}
          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#EAE5DC] space-y-4 text-right">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#141416] flex items-center gap-1.5">
                <Star className="w-4 h-4 text-[#D4AF37]" />
                <span>تقييمات الزبائن</span>
              </h4>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#141416]">{averageRating.toFixed(1)}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < Math.round(averageRating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#D9D3C6]'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#736B5E]">({reviews.length})</span>
                </div>
              )}
            </div>

            {reviewsLoading ? (
              <p className="text-xs text-[#736B5E]">جاري تحميل التقييمات...</p>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-[#736B5E]">لا توجد تقييمات بعد، كوني أول من يقيّم هذا المنتج!</p>
            ) : (
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-[#F5F2EB] rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#141416]">{r.customerName}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < r.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#D9D3C6]'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#544E43] leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Submit a review */}
            {reviewSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 text-center">
                شكراً لتقييمك! سيظهر تعليقك بعد مراجعته من إدارة المتجر.
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-2.5 pt-2 border-t border-[#EAE5DC]">
                <span className="text-xs font-bold text-[#141416] block">أضيفي تقييمك</span>

                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}
                    >
                      <Star
                        className={`w-5 h-5 ${i < reviewForm.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#D9D3C6]'}`}
                      />
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="اسمك"
                  value={reviewForm.customerName}
                  onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                  className="w-full text-xs bg-[#F5F2EB] border border-[#E6E1D8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                />
                <textarea
                  placeholder="شاركينا تجربتك مع المنتج..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={2}
                  className="w-full text-xs bg-[#F5F2EB] border border-[#E6E1D8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#D4AF37] resize-none"
                />

                {reviewError && (
                  <p className="text-[11px] text-rose-600">{reviewError}</p>
                )}

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full py-2 rounded-xl bg-[#141416] hover:bg-[#D4AF37] text-white hover:text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{reviewSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}</span>
                </button>
              </form>
            )}
          </div>

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
