import React from 'react';
import { MessageCircle, Instagram, Facebook, Phone, MapPin, Mail, Clock, Truck, CreditCard } from 'lucide-react';
import { StoreSettings } from '../types';
import { ContactChat } from './ContactChat';

interface ContactPageProps {
  settings: StoreSettings | null;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
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
          <div className="md:col-span-5 space-y-4 order-2 md:order-1">
            
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

          {/* Live chat with the store admin (replaces the old inquiry/complaint form) */}
          <div className="md:col-span-7 order-1 md:order-2">
            <ContactChat alwaysOpen />
          </div>

        </div>

      </div>
    </div>
  );
};
