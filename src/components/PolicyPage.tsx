import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

export const PolicyPage: React.FC = () => {
  return (
    <div className="bg-[#FAF8F5] py-12 sm:py-16 text-right" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold px-3 py-1 bg-[#D4AF37]/15 text-[#8C6D23] rounded-full border border-[#D4AF37]/30 inline-block">
            معلومات التوصيل والضمان
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#141416] font-serif-luxury">
            سياسة الشحن، الدفع والاستبدال
          </h1>
          <p className="text-[#6B6355] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            نحرص في Sabreen Basheer Natural Care على تقديم تجربة تسوق سلسة وشفافة تضمن حقوقك وتضمن وصول منتجاتك بأعلى جودة.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          
          {/* 1. Shipping Policy */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E1D8] shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-[#B38938]">
              <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#141416] font-serif-luxury">
                أولاً: سياسة الشحن والتوصيل
              </h2>
            </div>
            
            <div className="space-y-3 text-xs sm:text-sm text-[#544E43] leading-relaxed">
              <p>
                • <strong>مدة وصول الطلب:</strong> يتم توصيل الطلب للزبون خلال <strong>يومين إلى خمسة أيام عمل (2 إلى 5 أيام)</strong> بحسب المنطقة السكنية، وقد تزيد هذه المدة أو تقل قليلاً وفقاً للظروف الميدانية وحركة الطرق وسلاسة التنقل.
              </p>
              <p>
                • <strong>رسوم التوصيل:</strong> <strong>يحددها مندوب التوصيل (الدليفري)</strong> الذي يقوم بإيصال الشحنة بناءً على منطقتك السكنية ونقطة الاستلام، وتُسدد له نقداً ومباشرة عند استلام الطلب. (المبلغ الذي يتم تحويله مسبقاً عبر المتجر هو لقيمة المنتجات فقط).
              </p>
              <p>
                • <strong>نطاق ومناطق التوصيل:</strong> التوصيل متاح ومتوفر حالياً <strong>داخل قطاع غزة والجنوب فقط</strong> (يشمل مدينة غزة ومحيطها، المحافظة الوسطى: دير البلح، مخيم النصيرات، الزوايدة، البريج، المغازي، وخانيونس والمواصي، ومحافظة رفح).
              </p>
              <p>
                • <strong>ساعات استقبال الطلبات:</strong> نسعد باستقبال كافة طلباتكم واستفساراتكم عبر المتجر الإلكتروني <strong>في أي وقت طوال اليوم (24/7 على مدار الساعة)</strong>.
              </p>
              <p>
                • <strong>التغليف الآمن والعناية بالمنتج:</strong> تُغلف منتجات العناية والزيوت الطبيعية في عبوات محمية بإحكام تمنع أي تسريب أو تلف أثناء النقل، لضمان وصولها بنقاوتها وفعاليتها الكاملة.
              </p>
            </div>
          </div>

          {/* 2. Payment & Transfer Verification */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E1D8] shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-[#B38938]">
              <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#141416] font-serif-luxury">
                ثانياً: طرق الدفع والتحويل المالي المعتمدة
              </h2>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[#544E43] leading-relaxed">
              <p>
                لتسهيل تجربة التسوق وتوفير أقصى درجات المرونة، نتيح لزبائننا الكرام الدفع عبر الوسائل التالية:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-1">
                  <span className="font-bold text-[#141416] block text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                    الحسابات والتحويلات البنكية:
                  </span>
                  <p className="text-[11px] text-[#6B6355] leading-relaxed">
                    متاح التحويل عبر <strong>بنك فلسطين (Bank of Palestine)</strong> أو <strong>كافة البنوك العاملة في فلسطين</strong> (تحويل فوري أو إيداع بنكي).
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-1">
                  <span className="font-bold text-[#141416] block text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
                    المحافظ الرقمية الإلكترونية:
                  </span>
                  <p className="text-[11px] text-[#6B6355] leading-relaxed">
                    متاح التحويل السريع عبر محفظة <strong>جوال باي (Jawwal Pay)</strong>، محفظة <strong>بال باي (PalPay)</strong>، و<strong>كافة المحافظ المالية المحلية المعتمدة</strong>.
                  </p>
                </div>
              </div>
              <p className="pt-2">
                • <strong>تأكيد الطلب:</strong> يشترط رفع صورة إشعار أو لقطة شاشة (سكرين شوت) توضح نجاح عملية التحويل ورقم الحوالة لربط الدفعة بطلبك فورياً.
              </p>
              <p>
                • <strong>المطابقة والاعتماد:</strong> يقوم فريق المتجر بمطابقة الإيصال وتأكيد الطلب لتجهيزه وإرساله مع مندوب التوصيل في أسرع وقت.
              </p>
            </div>
          </div>

          {/* 3. Return & Exchange */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E1D8] shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-[#B38938]">
              <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#141416] font-serif-luxury">
                ثالثاً: سياسة الاستبدال والاسترجاع
              </h2>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-[#544E43] leading-relaxed">
              <p>
                • <strong>طبيعة المنتجات:</strong> نظراً لأن منتجاتنا طبيعية 100% ومصنوعة للعناية الشخصية بالبشرة والشعر، فإنه حرصاً على الصحة والسلامة العامة لا يمكن استرجاع أو استبدال أي منتج تم فتحه أو استخدام غلافه الوقائي.
              </p>
              <p>
                • <strong>حالات استبدال مجاني:</strong> إذا وصلك منتج خاطئ أو تالف نتيجة الشحن، يحق لك طلب استبداله فوراً خلال <strong>24 ساعة</strong> من استلام الطلب مع إرفاق صورة للمنتج المتضرر عبر واتساب.
              </p>
              <p>
                • في حال الاستبدال لخطأ في التجهيز، يتحمل المتجر كافة تكاليف الشحن والتوصيل البديل.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
