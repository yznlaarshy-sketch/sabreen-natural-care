import React from 'react';
import { Instagram, MessageCircle, Facebook, Heart, Sparkles, MapPin, Phone, Leaf } from 'lucide-react';
import { StoreSettings } from '../types';

interface FooterProps {
  settings: StoreSettings | null;
  onNavigate: (view: string) => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate, onOpenAdmin, isAdminLoggedIn }) => {
  const cleanPhone = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '';

  return (
    <footer className="bg-[#0C0C0E] text-[#FAF7F2] border-t border-[#202024] text-right" dir="rtl">
      
      {/* Upper Footer: Brand & Social */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand Info with Crest */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D4AF37] bg-[#FAF7F2] shrink-0 shadow-sm">
                <img
                  src="/dr_sabreen_logo.jpg"
                  alt="شعار د. صابرين بشير"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold font-serif-luxury text-[#FAF7F2]">
                  د. صابرين بشير
                </span>
                <span className="text-[11px] text-[#C5A859] font-light -mt-0.5">
                  منتجات طبيعية للبشرة والتجميل
                </span>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-[#A8A295] leading-relaxed max-w-sm">
              مستحضرات عناية وتجميل طبيعية مصممة بعناية من أنقى الخلاصات النباتية والزيوت المعصورة على البارد، لتمنح بشرتك نضارة وصحة طبيعية كل يوم.
            </p>

            {/* Social Links (Instagram & WhatsApp) */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {settings?.whatsappNumber && (
                <a
                  id="footer-link-whatsapp"
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161618] hover:bg-[#25D366] text-[#FAF7F2] border border-[#2A2A2E] hover:border-[#25D366] transition-all text-xs font-semibold group"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366] group-hover:text-white" />
                  <span>محادثة واتساب</span>
                </a>
              )}

              {settings?.instagramUrl && (
                <a
                  id="footer-link-instagram"
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161618] hover:bg-gradient-to-r hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045] text-[#FAF7F2] border border-[#2A2A2E] transition-all text-xs font-semibold group"
                >
                  <Instagram className="w-4 h-4 text-[#E1306C] group-hover:text-white" />
                  <span>انستقرام المتجر</span>
                </a>
              )}

              {settings?.facebookUrl && (
                <a
                  id="footer-link-facebook"
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161618] hover:bg-[#1877F2] text-[#FAF7F2] border border-[#2A2A2E] hover:border-[#1877F2] transition-all text-xs font-semibold group"
                >
                  <Facebook className="w-4 h-4 text-[#1877F2] group-hover:text-white" />
                  <span>فيسبوك المتجر</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="md:col-span-3 space-y-3 text-xs">
            <h4 className="text-sm font-bold text-[#D4AF37] font-serif-luxury">
              أقسام المتجر
            </h4>
            <ul className="space-y-2 text-[#A8A295]">
              <li>
                <button
                  onClick={() => onNavigate('store')}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  جميع المنتجات والتصنيفات
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('new')}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  وصل حديثاً (المنتجات الجديدة)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('bestsellers')}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  الأكثر مبيعاً
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#D4AF37] transition-colors font-semibold text-[#D4AF37]"
                >
                  من نحن (د. صابرين بشير)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  تواصل معنا
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policy')}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  سياسة الشحن والاستبدال
                </button>
              </li>
            </ul>
          </div>

          {/* Payment & Banking */}
          <div className="md:col-span-4 space-y-3 text-xs text-[#A8A295]">
            <h4 className="text-sm font-bold text-[#D4AF37] font-serif-luxury">
              الدفع والشحن
            </h4>
            <p className="leading-relaxed text-[11px] text-[#C4BEB2]">
              الدفع متاح عبر <strong>بنك فلسطين</strong>، كافة البنوك، ومحافظ <strong>جوال باي (Jawwal Pay)</strong>، <strong>بال باي (PalPay)</strong>، وجميع المحافظ المعتمدة.
            </p>
            <div className="p-3 rounded-2xl bg-[#141416] border border-[#242428] space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-[#A8A295]">نطاق التوصيل:</span>
                <span className="text-[#D4AF37] font-bold">{settings?.location || 'داخل قطاع غزة والجنوب فقط'}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#202024]">
                <span className="text-[#A8A295]">مدة التوصيل:</span>
                <span className="text-white font-semibold">2 إلى 5 أيام (بحسب المنطقة)</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#202024]">
                <span className="text-[#A8A295]">رسوم التوصيل:</span>
                <span className="text-[#D4AF37] font-semibold">يحددها كابتن الدليفري عند الاستلام</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#202024]">
                <span className="text-[#A8A295]">استقبال الطلبات:</span>
                <span className="text-emerald-400 font-bold">{settings?.orderHours || 'في أي وقت (24/7)'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#18181A] py-5 px-4 text-center text-[11px] text-[#6E685E]">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="cursor-default select-none">
            جميع الحقوق محفوظة{' '}
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline text-inherit cursor-default focus:outline-none p-0 bg-transparent border-0 select-none hover:text-inherit active:text-inherit"
            >
              ©
            </button>{' '}
            {new Date().getFullYear()} د. صابرين بشير - منتجات طبيعية للبشرة والتجميل
          </span>
          <span className="flex items-center gap-1 select-none">
            <span>نقاء الطبيعة لبشرتك</span>
            <Heart className="w-3 h-3 text-[#D4AF37] inline opacity-80" />
          </span>
        </div>
      </div>

    </footer>
  );
};
