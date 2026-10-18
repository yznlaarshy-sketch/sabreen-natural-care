import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import type { StoreSettings } from '../types';
import { FAQS, findAnswer } from '../faq';


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
