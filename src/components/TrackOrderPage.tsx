import React, { useState } from 'react';
import { PackageSearch, Clock, CheckCircle2, XCircle, Truck, Search } from 'lucide-react';
import { trackOrder, TrackedOrder } from '../services/api';

interface Props {
  initialOrderId?: string;
}

const STATUS_INFO: Record<
  TrackedOrder['status'],
  { label: string; text: string; cls: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: 'قيد المراجعة',
    text: 'وصل طلبك وجاري تدقيق التحويل. سنؤكده قريباً بإذن الله.',
    cls: 'bg-amber-50 border-amber-200 text-amber-800',
    Icon: Clock
  },
  approved: {
    label: 'تم قبول طلبك',
    text: 'تم تأكيد طلبك وجاري تجهيزه للتوصيل.',
    cls: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    Icon: CheckCircle2
  },
  completed: {
    label: 'تم تسليم الطلب',
    text: 'تم توصيل طلبك. شكراً لثقتك بنا!',
    cls: 'bg-sky-50 border-sky-200 text-sky-800',
    Icon: Truck
  },
  rejected: {
    label: 'تعذّر قبول الطلب',
    text: 'نعتذر، لم نتمكن من قبول هذا الطلب.',
    cls: 'bg-rose-50 border-rose-200 text-rose-800',
    Icon: XCircle
  }
};

export const TrackOrderPage: React.FC<Props> = ({ initialOrderId = '' }) => {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const res = await trackOrder(orderId.trim().replace(/^#/, ''), phone.trim());
      if (res.success && res.order) setOrder(res.order);
      else setError(res.error || 'تعذر العثور على الطلب.');
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const info = order ? STATUS_INFO[order.status] : null;
  const inputCls =
    'w-full bg-white border border-[#DCD5C9] rounded-xl px-3.5 py-3 text-sm text-[#141416] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30';

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl text-right" dir="rtl">
      <div className="text-center mb-8 space-y-2">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#B38938]">
          <PackageSearch className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-[#141416] font-serif-luxury">تتبع طلبك</h2>
        <p className="text-xs text-[#736B5E] leading-relaxed">
          اكتبي رقم طلبك (مثل SB-1234) ورقم الجوال الذي استخدمتِه في الطلب لمعرفة حالته.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#E6E1D8] shadow-sm p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#141416]">رقم الطلب</label>
          <input
            className={inputCls}
            dir="ltr"
            required
            maxLength={30}
            placeholder="SB-1234"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#141416]">رقم الجوال</label>
          <input
            className={inputCls}
            dir="ltr"
            required
            inputMode="tel"
            maxLength={30}
            placeholder="059xxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-rose-600 leading-relaxed">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#0F0F10] hover:bg-[#D4AF37] text-[#FAF8F5] hover:text-[#0F0F10] font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'جاري البحث...' : 'عرض حالة الطلب'}</span>
        </button>
      </form>

      {order && info && (
        <div className="mt-6 space-y-4">
          <div className={`rounded-2xl border p-4 space-y-2 ${info.cls}`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              <info.Icon className="w-5 h-5" />
              <span>{info.label}</span>
            </div>
            <p className="text-xs leading-relaxed">{info.text}</p>
            {order.rejectionReason && (
              <p className="text-xs leading-relaxed">
                <span className="font-bold">السبب: </span>
                {order.rejectionReason}
              </p>
            )}
            {order.adminNote && (
              <p className="text-xs leading-relaxed">
                <span className="font-bold">ملاحظة من المتجر: </span>
                {order.adminNote}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[#736B5E]">رقم الطلب</span>
              <span className="font-bold text-[#141416]" dir="ltr">#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#736B5E]">تاريخ الطلب</span>
              <span className="font-bold text-[#141416]">{new Date(order.createdAt).toLocaleDateString('ar')}</span>
            </div>
            <div className="border-t border-[#EFEAE0] pt-2 space-y-1">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-[#141416]">{it.productName}</span>
                  <span className="text-[#736B5E]">× {it.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-[#EFEAE0] pt-2">
              <span className="text-[#736B5E]">الإجمالي</span>
              <span className="font-extrabold text-[#B38938]">{order.totalAmount} ₪</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
