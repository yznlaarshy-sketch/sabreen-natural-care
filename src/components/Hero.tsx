import React from 'react';
import { Sparkles, ArrowLeft, ShieldCheck, Heart, Leaf, Star } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onNewArrivalsClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onNewArrivalsClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0F0F11] via-[#151518] to-[#0F0F11] text-[#FAF7F2] py-16 sm:py-24 border-b border-[#242428]">
      
      {/* Ambient glowing orbs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#3D5A4C]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6 text-right">
            
            {/* Elegant Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3D5A4C]/20 border border-[#3D5A4C]/40 text-[#E2D5B8] text-xs font-semibold backdrop-blur-sm">
              <Leaf className="w-3.5 h-3.5 text-[#5A876F]" />
              <span>مستحضرات د. صابرين بشير الطبيعية 100%</span>
            </div>

            {/* Main Headline with Serif & Gold Contrast */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#FAF7F2] leading-[1.25] font-serif-luxury">
              عناية لطيفة وفعّالة
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#F5D884] via-[#D4AF37] to-[#B38938]">
                مستوحاة من خيرات الطبيعة
              </span>
            </h1>

            <p className="text-[#C4C0B6] text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-light">
              نجمع في مستحضرات <strong>د. صابرين بشير</strong> بين نقاء المكونات النباتية المنتقاة بعناية وأعلى معايير الجودة والاهتمام بالتفاصيل، لتمنحك روتيناً يومياً بسيطاً يعيد لبشرتك وشعرك التألق والحيوية.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                id="hero-btn-explore"
                onClick={onExploreClick}
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B38938] hover:from-[#E2BE45] hover:to-[#C59B42] text-[#0E0E10] font-bold px-7 py-3.5 rounded-full shadow-lg shadow-[#D4AF37]/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-xs sm:text-sm"
              >
                <span>استكشفي المنتجات المتوفرة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                id="hero-btn-new-arrivals"
                onClick={onNewArrivalsClick}
                className="inline-flex items-center gap-2 bg-[#19191D] hover:bg-[#232328] text-[#FAF7F2] border border-[#D4AF37]/40 px-6 py-3.5 rounded-full font-semibold transition-all hover:border-[#D4AF37] text-xs sm:text-sm"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>وصل حديثاً</span>
              </button>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#232328] text-center">
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#141417]/80 border border-[#26262B]">
                <Leaf className="w-5 h-5 text-[#5A876F]" />
                <span className="text-xs font-semibold text-[#FAF7F2]">طبيعي 100%</span>
                <span className="text-[10px] text-[#A8A295]">مكونات نقية مختارة</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#141417]/80 border border-[#26262B]">
                <Heart className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-xs font-semibold text-[#FAF7F2]">صُنعت بعناية</span>
                <span className="text-[10px] text-[#A8A295]">اهتمام بأدق التفاصيل</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#141417]/80 border border-[#26262B]">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-xs font-semibold text-[#FAF8F5]">فعالية وأمان</span>
                <span className="text-[10px] text-[#A8A295]">تناسب مختلف البشرات</span>
              </div>
            </div>

          </div>

          {/* Luxury Visual Showcase Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              
              {/* Subtle gold aura */}
              <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-b from-[#D4AF37]/40 via-[#3D5A4C]/20 to-[#D4AF37]/30 blur-md" />
              
              <div className="relative rounded-3xl overflow-hidden bg-[#161619] border border-[#D4AF37]/35 shadow-2xl">
                <img
                  src="/dr_sabreen_about.jpg"
                  alt="تشكيلة د. صابرين بشير للعناية الطبيعية"
                  referrerPolicy="no-referrer"
                  className="w-full h-84 sm:h-[420px] object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10] via-black/20 to-transparent" />
                
                {/* Overlay Card */}
                <div className="absolute bottom-4 right-4 left-4 p-4 rounded-2xl bg-[#121214]/90 backdrop-blur-md border border-[#D4AF37]/30 text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D4AF37] px-3 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                      د. صابرين بشير
                    </span>
                    <span className="text-xs text-[#FAF7F2]/75 font-semibold">الدفع بالشيكل ₪</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[#FAF7F2] mt-2 leading-relaxed">
                    صابون علاجي، زيوت مقوية للشعر، وسيرومات ترطيب فائقة النقاء
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
