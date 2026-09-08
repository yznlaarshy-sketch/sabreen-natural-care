import React from 'react';
import { Sparkles, Heart, Leaf, ShieldCheck, CheckCircle2, Award, Quote } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-[#FAF7F2] py-12 sm:py-20 text-right" dir="rtl">
      <div className="container mx-auto px-4 max-w-5xl space-y-16">
        
        {/* Top Header Badge */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3D5A4C]/10 border border-[#3D5A4C]/20 text-[#2D4A3E] text-xs font-bold shadow-sm">
            <Leaf className="w-3.5 h-3.5 text-[#3D5A4C]" />
            <span>عناية طبيعية نقية 100%</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#19191C] font-serif-luxury tracking-tight">
            من نحن
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-[#D4AF37]" />
            <span className="text-xs font-serif font-semibold text-[#8C6D23]">د. صابرين بشير للعناية الطبيعية</span>
            <span className="h-px w-12 bg-[#D4AF37]" />
          </div>
        </div>

        {/* The Main Hero Section: The Exact Image + The Exact Text */}
        <div className="bg-white rounded-3xl border border-[#E7E2D8] shadow-[0_15px_45px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            
            {/* The Image (The exact aesthetic & uploaded photo) */}
            <div className="lg:col-span-6 relative p-4 sm:p-6">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#E7E2D8] bg-[#FAF7F2] aspect-[4/3] sm:aspect-auto sm:h-[480px]">
                <img
                  src="/dr_sabreen_about.jpg"
                  alt="د. صابرين بشير - منتجات طبيعية للبشرة والتجميل - من نحن"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                
                {/* Floating Emblem Tag on Image */}
                <div className="absolute bottom-4 right-4 left-4 p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#D4AF37]/30 shadow-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D4AF37] shrink-0 bg-[#FAF7F2]">
                    <img
                      src="/dr_sabreen_logo.jpg"
                      alt="شعار د. صابرين بشير"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#141416]">د. صابرين بشير</h3>
                    <p className="text-[11px] text-[#5A5449]">منتجات طبيعية للبشرة والتجميل</p>
                  </div>
                </div>
              </div>
            </div>

            {/* The Exact Text requested by the user */}
            <div className="lg:col-span-6 p-6 sm:p-10 space-y-6 text-[#38352F] leading-relaxed">
              
              <div className="flex items-center gap-2 text-[#3D5A4C]">
                <Quote className="w-6 h-6 text-[#D4AF37] rotate-180" />
                <span className="text-xs font-bold tracking-wide uppercase text-[#8C6D23]">
                  رؤيتنا ورسالتنا
                </span>
              </div>

              {/* Exact Paragraph 1 */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border-r-4 border-[#3D5A4C]">
                <p className="text-base sm:text-lg font-semibold text-[#19191C] leading-relaxed">
                  د. صابرين بشير متخصصة في منتجات العناية بالبشرة والتجميل، ونقدم مجموعة من المنتجات المصنوعة بعناية من مكونات طبيعية مختارة، بهدف توفير عناية لطيفة وفعّالة تناسب احتياجات البشرة المختلفة.
                </p>
              </div>

              {/* Exact Paragraph 2 */}
              <p className="text-sm sm:text-base text-[#4F4B42] leading-relaxed">
                نؤمن بأن العناية بالبشرة تبدأ من اختيار المكونات المناسبة، لذلك نحرص على تقديم منتجات تجمع بين الطبيعة والجودة والاهتمام بالتفاصيل، مع التركيز على تجربة مميزة لعملائنا.
              </p>

              {/* Exact Paragraph 3 */}
              <p className="text-sm sm:text-base text-[#4F4B42] leading-relaxed">
                نسعى باستمرار إلى تطوير منتجاتنا وتقديم خيارات طبيعية تجعل العناية بالبشرة جزءًا بسيطًا وجميلًا من روتينك اليومي.
              </p>

              {/* Quality Badges */}
              <div className="pt-4 border-t border-[#F0ECE1] grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3D5A4C] shrink-0" />
                  <span className="font-semibold text-[#19191C]">مكونات نباتية نقية 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3D5A4C] shrink-0" />
                  <span className="font-semibold text-[#19191C]">خالٍ من العطور الاصطناعية</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3D5A4C] shrink-0" />
                  <span className="font-semibold text-[#19191C]">صناعة يدوية متقنة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3D5A4C] shrink-0" />
                  <span className="font-semibold text-[#19191C]">نتائج لطيفة ومستدامة</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Brand Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-7 rounded-2xl bg-white border border-[#E7E2D8] shadow-sm text-center space-y-3 hover:border-[#D4AF37] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#3D5A4C]/10 text-[#3D5A4C] flex items-center justify-center mx-auto">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#19191C] font-serif-luxury">
              الطبيعة أولاً
            </h3>
            <p className="text-xs text-[#6B6355] leading-relaxed">
              انتقاء دقيق لأجود الزيوت العضوية البكر والزبدات الطبيعية غير المكررة لصحة بشرتك.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-[#E7E2D8] shadow-sm text-center space-y-3 hover:border-[#D4AF37] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 text-[#8C6D23] flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#19191C] font-serif-luxury">
              جودة واهتمام بالتفاصيل
            </h3>
            <p className="text-xs text-[#6B6355] leading-relaxed">
              نصنع منتجاتنا بحرفية مدروسة تضمن توازناً مثالياً بين الفعالية والنعومة المطلقة.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-[#E7E2D8] shadow-sm text-center space-y-3 hover:border-[#D4AF37] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#3D5A4C]/10 text-[#3D5A4C] flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#19191C] font-serif-luxury">
              روتين يومي بسيط
            </h3>
            <p className="text-xs text-[#6B6355] leading-relaxed">
              خيارات تجعل خطوات العناية ببشرتك وشعرك لحظة استرخاء وجمال ممتعة كل يوم.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
