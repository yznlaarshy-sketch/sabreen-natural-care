import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import type { StoreSettings } from '../types';

interface Faq {
  q: string;
  a: string;
  k: string; // extra keywords used to match free-typed questions
}

// Ready-made (fixed) answers. Account numbers / phone numbers are intentionally NOT written here
// because they are managed from the admin dashboard; answers point to the page that shows them.
const FAQS: Faq[] = [
  {
    q: 'كيف أطلب؟',
    a: 'اختاري المنتج وأضيفيه للسلة، ثم اضغطي "متابعة إتمام الطلب والتحويل". حوّلي قيمة المنتجات، وعبّي بياناتك، وارفعي صورة الإيصال، ثم أرسلي الطلب.',
    k: 'طلب اطلب اشتري شراء اشتريت اطلب خطوات اتمام',
  },
  {
    q: 'كيف أضيف منتج للسلة؟',
    a: 'اضغطي على المنتج لتظهر تفاصيله، ثم اضغطي "أضف للسلة". تجدين السلة في أعلى الصفحة.',
    k: 'سلة اضافه اضيف اضف عربة',
  },
  {
    q: 'ما البيانات المطلوبة للطلب؟',
    a: 'الاسم، رقم الجوال، منطقة التوصيل، العنوان التفصيلي (الحي والشارع ونقطة دالّة قريبة)، واسم أو رقم الحوالة.',
    k: 'بيانات معلومات مطلوب اكتب عبي عنوان اسم جوال',
  },
  {
    q: 'كيف أعرف أن طلبي وصل؟',
    a: 'بعد إرسال الطلب تظهر رسالة "تم تأكيد استلام طلبك بنجاح". ويمكنك التأكد من المتجر عبر واتساب.',
    k: 'وصل تاكيد استلام رساله نجح طلبي',
  },
  {
    q: 'كيف أدفع؟',
    a: 'الدفع بالتحويل وليس عند الاستلام: عبر بنك فلسطين أو أي بنك، أو محفظة جوال باي أو بال باي. اسم المستفيد ورقم الحساب يظهران في صفحة إتمام الطلب، وفيها زر لنسخ الرقم.',
    k: 'دفع ادفع تحويل حواله بنك محفظه جوال باي بال باي حساب رقم',
  },
  {
    q: 'كم المبلغ الذي أحوّله؟',
    a: 'قيمة المنتجات فقط (بالشيكل). يظهر المبلغ في السلة تحت "المبلغ المطلوب تحويله".',
    k: 'مبلغ كم قيمه سعر احول شيكل',
  },
  {
    q: 'لماذا يجب أن أرفع صورة الإيصال؟',
    a: 'ليطابق المتجر الحوالة مع طلبك ويؤكده. ارفعي صورة الإشعار أو لقطة شاشة توضح نجاح التحويل ورقم الحوالة. الصيغ المقبولة JPG وPNG وWebP بحجم أقل من 10 ميجا.',
    k: 'صوره ايصال اشعار سكرين شوت ارفع رفع اثبات',
  },
  {
    q: 'أين يتم التوصيل؟',
    a: 'التوصيل متاح داخل قطاع غزة والجنوب فقط، بكل مناطقهم.',
    k: 'وين توصيل توصلون مناطق غزه جنوب شحن خارج',
  },
  {
    q: 'كم مدة التوصيل؟',
    a: 'من يومين إلى 5 أيام عمل حسب منطقتك، وقد تزيد أو تقل قليلاً حسب ظروف الطرق.',
    k: 'مده وقت يوم ايام متى يوصل توصيل سريع',
  },
  {
    q: 'كم رسوم التوصيل؟',
    a: 'يحددها مندوب التوصيل حسب منطقتك وتُدفع له نقداً عند الاستلام، ولا تُضاف إلى مبلغ الحوالة.',
    k: 'رسوم توصيل دليفري مندوب اجره تكلفه',
  },
  {
    q: 'متى يمكنني الطلب؟',
    a: 'في أي وقت، 24 ساعة طوال أيام الأسبوع.',
    k: 'ساعات دوام وقت متى مفتوح',
  },
  {
    q: 'هل يمكنني إرجاع منتج؟',
    a: 'منتجاتنا طبيعية 100% للعناية الشخصية، لذلك لا نقبل استرجاع أو استبدال أي منتج تم فتحه أو استخدام غلافه الوقائي، حفاظاً على السلامة.',
    k: 'ارجاع رجوع استرجاع استرداد ارجع رد',
  },
  {
    q: 'وصلني منتج خطأ أو تالف، ماذا أفعل؟',
    a: 'يمكنك طلب استبداله مجاناً خلال 24 ساعة من الاستلام، وأرسلي صورة المنتج عبر واتساب. ويتحمل المتجر تكاليف التوصيل البديل إذا كان الخطأ منه.',
    k: 'خطا تالف مكسور استبدال بدل تغيير متضرر غلط',
  },
  {
    q: 'كيف أعرف طريقة استخدام المنتج ومكوناته؟',
    a: 'افتحي صفحة المنتج وستجدين: أبرز الفوائد، طريقة الاستخدام المثلى، والمكونات الفعالة.',
    k: 'استخدام مكونات فوائد طريقه استعمال مواد',
  },
  {
    q: 'كيف أقيّم منتجاً؟',
    a: 'افتحي المنتج، ثم انزلي إلى "تقييمات الزبائن" واكتبي اسمك وتعليقك في "أضيفي تقييمك". يظهر التقييم بعد موافقة إدارة المتجر عليه.',
    k: 'تقييم قيم تعليق رايي رأي نجوم',
  },
  {
    q: 'كيف أتواصل مع المتجر؟',
    a: 'من تبويب "تواصل معنا": محادثة واتساب مباشرة، أو إنستغرام، أو فيسبوك، أو نموذج إرسال رسالة.',
    k: 'تواصل اتصال رقم واتساب استفسار مراسله كلم',
  },
  {
    q: 'أين طلبي؟ كيف أتابعه؟',
    a: 'لمعرفة حالة طلبك تواصلي مع المتجر عبر واتساب وسنفيدك بآخر المستجدات.',
    k: 'وين اين طلبي تتبع متابعه حاله تاخر متى يوصل طلبي',
  },
];

// Normalize Arabic text so typed questions match regardless of small spelling differences.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[؟?!.,،:؛"'()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP = new Set(['كيف', 'شو', 'ايش', 'هل', 'ما', 'ماذا', 'كم', 'في', 'من', 'على', 'الى', 'او', 'انا', 'بدي', 'اريد', 'ممكن', 'لو', 'عن', 'هذا', 'هاد', 'يا']);

function tokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .map((w) => w.replace(/^(ال|وال|بال|لل)/, ''))
    .filter((w) => w.length > 1 && !STOP.has(w));
}

const FAQ_TOKENS = FAQS.map((f) => new Set([...tokens(f.q), ...tokens(f.k)]));

function findAnswer(input: string): Faq | null {
  const words = tokens(input);
  if (words.length === 0) return null;
  let best = -1;
  let bestScore = 0;
  FAQ_TOKENS.forEach((set, i) => {
    let score = 0;
    for (const w of words) {
      if (set.has(w)) score += 2;
      else if (w.length > 3) {
        for (const t of set) {
          if (t.length > 3 && (t.startsWith(w) || w.startsWith(t))) {
            score += 1;
            break;
          }
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return bestScore >= 2 && best >= 0 ? FAQS[best] : null;
}

interface Message {
  from: 'bot' | 'user';
  text: string;
}

interface HelpAssistantProps {
  settings: StoreSettings | null;
}

export function HelpAssistant({ settings }: HelpAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: 'أهلاً بك 🌿 اختاري سؤالاً من القائمة بالأسفل أو اكتبي سؤالك، وسأشرح لك كيفية استخدام الموقع.' },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  const whatsappLink = useMemo(() => {
    const phone = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '';
    return phone ? `https://wa.me/${phone}` : '';
  }, [settings?.whatsappNumber]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  const ask = (question: string, answer?: string) => {
    const faq = answer ? null : findAnswer(question);
    const reply =
      answer ||
      faq?.a ||
      'لم أجد جواباً مناسباً لسؤالك. اختاري من الأسئلة الشائعة بالأسفل، أو تواصلي مع المتجر مباشرة عبر واتساب.';
    setMessages((m) => [...m, { from: 'user', text: question }, { from: 'bot', text: reply }]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim().slice(0, 200);
    if (!q) return;
    setInput('');
    ask(q);
  };

  return (
    <div dir="rtl" className="font-sans">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="مساعدة"
          className="fixed bottom-5 left-5 z-40 flex items-center gap-2 bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/60 px-4 py-3 rounded-full shadow-2xl hover:bg-[#1A1A1C] transition-colors text-xs font-bold"
        >
          <MessageCircle className="w-4 h-4" />
          <span>كيف أستخدم الموقع؟</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:w-[360px] z-40 bg-[#0F0F10] text-[#FAF8F5] border border-[#D4AF37]/40 rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#D4AF37]">
              <MessageCircle className="w-4 h-4" />
              <span>مساعد الموقع</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="p-1 rounded-full hover:bg-[#2A2A2E]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[140px]">
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'user' ? 'flex justify-start' : 'flex justify-end'}>
                <div
                  className={
                    m.from === 'user'
                      ? 'max-w-[85%] bg-[#D4AF37] text-black text-xs font-bold rounded-2xl rounded-tr-sm px-3 py-2'
                      : 'max-w-[90%] bg-[#1F1F22] border border-[#333] text-xs leading-relaxed rounded-2xl rounded-tl-sm px-3 py-2 whitespace-pre-line'
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {whatsappLink && messages[messages.length - 1]?.text.startsWith('لم أجد') && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-bold text-[#D4AF37] underline"
              >
                تواصلي معنا عبر واتساب
              </a>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-[#2A2A2A] px-3 py-2 max-h-28 overflow-y-auto flex flex-wrap gap-1.5">
            {FAQS.map((f) => (
              <button
                key={f.q}
                type="button"
                onClick={() => ask(f.q, f.a)}
                className="text-[11px] bg-[#1F1F22] border border-[#333] hover:border-[#D4AF37] text-[#C4C0B6] hover:text-[#D4AF37] rounded-full px-2.5 py-1 transition-colors"
              >
                {f.q}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 px-3 py-3 border-t border-[#2A2A2A]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={200}
              placeholder="اكتبي سؤالك هنا..."
              className="flex-1 bg-[#1F1F22] border border-[#333] focus:border-[#D4AF37] outline-none rounded-full px-3 py-2 text-xs text-[#FAF8F5] placeholder:text-[#736B5E]"
            />
            <button type="submit" aria-label="إرسال" className="p-2 rounded-full bg-[#D4AF37] text-black hover:bg-[#E5C04A]">
              <Send className="w-4 h-4 -scale-x-100" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
