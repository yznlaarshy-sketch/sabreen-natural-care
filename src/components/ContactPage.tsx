import React, { useState } from 'react';
import { MessageCircle, Instagram, Facebook, Phone, MapPin, Mail, Clock, Send, Check, Truck, CreditCard } from 'lucide-react';
import { StoreSettings } from '../types';

interface ContactPageProps {
  settings: StoreSettings | null;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formMsg) return;
    setSent(true);
  };

  const whatsappClean = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '';

  return (
    <div className="bg-[#FAF8F5] py-12 sm:py-16 text-right" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold px-3 py-1 bg-[#D4AF37]/15 text-[#8C6D23] rounded-full border border-[#D4AF37]/30 inline-block">
            نحن هنا لمساعدتك
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141416] font-serif-luxury">
            تواصل مع صابرين بشير
          </h1>
          <p className="text-[#6B6355] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            يسعدنا الإجابة على استفساراتك حول المنتجات، تقديم استشارات مخصصة لنوع بشرتك، وتلقي طلباتك وملاحظاتك.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Contact Details Cards */}
          <div className="md:col-span-5 space-y-4">
            
            {/* WhatsApp Direct */}
            {settings?.whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappClean}`}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl bg-white border border-[#E6E1D8] shadow-sm hover:border-[#25D366] transition-all flex items-center gap-4 group block"
              >
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#141416]">محادثة واتساب مباشرة</h3>
                  <p className="text-xs text-[#736B5E] mt-0.5 font-mono">{settings.whatsappNumber}</p>
                  <span className="text-[11px] text-[#25D366] font-semibold mt-1 inline-block">
                    انقر لبدء المحادثة فوراً ←
                  </span>
                </div>
              </a>
            )}

            {/* Instagram */}
            {settings?.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl bg-white border border-[#E6E1D8] shadow-sm hover:border-[#E1306C] transition-all flex items-center gap-4 group block"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E1306C]/10 text-[#E1306C] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#141416]">صفحة انستقرام الرسمية</h3>
                  <p className="text-xs text-[#736B5E] mt-0.5">@sabreenbasheer.care</p>
                  <span className="text-[11px] text-[#E1306C] font-semibold mt-1 inline-block">
                    تابعي جديدنا وتجارب الزبائن ←
                  </span>
                </div>
              </a>
            )}

            {/* Facebook */}
            {settings?.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-2xl bg-white border border-[#E6E1D8] shadow-sm hover:border-[#1877F2] transition-all flex items-center gap-4 group block"
              >
                <div className="w-12 h-12 rounded-xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Facebook className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#141416]">صفحة فيسبوك الرسمية</h3>
                  <p className="text-xs text-[#736B5E] mt-0.5">تابعونا وتواصلوا معنا على فيسبوك</p>
                  <span className="text-[11px] text-[#1877F2] font-semibold mt-1 inline-block">
                    زيارة الصفحة والتواصل ←
                  </span>
                </div>
              </a>
            )}

            {/* Location & Hours */}
            <div className="p-5 rounded-2xl bg-white border border-[#E6E1D8] shadow-sm space-y-3.5 text-xs text-[#544E43]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#B38938] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#141416] block font-bold">مناطق ونطاق التوصيل:</strong>
                  <span className="text-[#8C6D23] font-bold block mt-0.5">
                    {settings?.location || 'داخل قطاع غزة والجنوب فقط حالياً'}
                  </span>
                  <span className="text-[11px] text-[#736B5E] block mt-1 leading-relaxed">
                    يشمل: مدينة غزة ومحيطها، المحافظة الوسطى (دير البلح، النصيرات، الزوايدة، البريج، المغازي)، خانيونس، ورفح والمواصي.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-[#F0EBE1]">
                <Clock className="w-5 h-5 text-[#B38938] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#141416] block font-bold">ساعات استقبال الطلبات:</strong>
                  <span className="text-emerald-700 font-bold block mt-0.5">
                    {settings?.orderHours || 'في أي وقت طوال اليوم (24/7 على مدار الساعة)'}
                  </span>
                  <span className="text-[11px] text-[#736B5E] block mt-0.5">
                    المتجر متاح لاستقبال الطلبات واعتمادها في أي وقت على مدار اليوم.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-[#F0EBE1]">
                <Truck className="w-5 h-5 text-[#B38938] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#141416] block font-bold">مدة ورسوم التوصيل:</strong>
                  <span className="text-[#141416] font-semibold block mt-0.5">
                    مدة التوصيل من 2 إلى 5 أيام بحسب منطقتك السكنية (قد تزيد أو تقل بحسب الظروف).
                  </span>
                  <span className="text-[11px] text-[#8C6D23] font-medium block mt-0.5">
                    رسوم التوصيل يحددها كابتن الدليفري عند الوصول وتُدفع له مباشرة عند استلام الطلب.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-[#F0EBE1]">
                <CreditCard className="w-5 h-5 text-[#B38938] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#141416] block font-bold">طرق الدفع المعتمدة:</strong>
                  <span className="text-[11px] text-[#6B6355] block mt-0.5 leading-relaxed">
                    بنك فلسطين، كافة البنوك، محافظ جوال باي (Jawwal Pay)، بال باي (PalPay)، وجميع المحافظ المالية الإلكترونية.
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Direct Message Form */}
          <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D8] shadow-md">
            <h2 className="text-xl font-bold text-[#141416] font-serif-luxury mb-4">
              أرسلي لنا رسالة أو استفسار
            </h2>

            {sent ? (
              <div className="p-6 rounded-2xl bg-[#FAF6EE] border border-[#D4AF37]/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 text-[#B38938] flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#141416]">شكراً لتواصلك معنا</h3>
                <p className="text-xs text-[#6B6355]">
                  تم استلام رسالتك بنجاح، وسنقوم بالرد عليك في أقرب وقت عبر الجوال أو الواتساب.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-xs text-[#B38938] font-bold underline mt-2"
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#141416] block">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="اسمك الكريم"
                    className="w-full bg-[#FAF8F5] border border-[#DCD5C9] rounded-xl px-3.5 py-2.5 text-xs text-[#141416] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#141416] block">رقم الجوال أو الواتساب *</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="059xxxxxxx"
                    className="w-full bg-[#FAF8F5] border border-[#DCD5C9] rounded-xl px-3.5 py-2.5 text-xs text-[#141416] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#141416] block">رسالتك أو استفسارك *</label>
                  <textarea
                    rows={4}
                    required
                    value={formMsg}
                    onChange={(e) => setFormMsg(e.target.value)}
                    placeholder="اكتبي استفسارك حول المنتجات أو العناية بالبشرة..."
                    className="w-full bg-[#FAF8F5] border border-[#DCD5C9] rounded-xl p-3 text-xs text-[#141416] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0F0F10] hover:bg-[#D4AF37] text-[#FAF8F5] hover:text-[#0F0F10] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال الرسالة</span>
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
