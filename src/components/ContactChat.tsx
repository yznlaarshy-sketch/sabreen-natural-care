import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, ChevronDown, Sparkles } from 'lucide-react';
import { Chat } from '../types';
import { startChat, fetchCustomerChat, sendCustomerChatMessage } from '../services/api';

const STORAGE_KEY = 'sb_chat';

interface SavedChat {
  id: string;
  token: string;
}

const loadSaved = (): SavedChat | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id && parsed?.token ? parsed : null;
  } catch {
    return null;
  }
};

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });

// Live chat card for the contact page: a card in the same style as WhatsApp / Facebook that expands inline.
export const ContactChat: React.FC<{ alwaysOpen?: boolean }> = ({ alwaysOpen = false }) => {
  const [openState, setOpen] = useState(false);
  const open = alwaysOpen || openState;
  const [saved, setSaved] = useState<SavedChat | null>(() => loadSaved());
  const [chat, setChat] = useState<Chat | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const forgetChat = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setSaved(null);
    setChat(null);
  };

  // Poll the conversation: every 4s while open, every 15s while collapsed (to show the unread badge).
  useEffect(() => {
    if (!saved) return;
    let cancelled = false;

    const poll = async () => {
      if (document.hidden) return;
      try {
        const res = await fetchCustomerChat(saved.id, saved.token, openRef.current);
        if (cancelled) return;
        if (res.status === 404) {
          forgetChat();
        } else if (res.success && res.chat) {
          setChat(res.chat);
        }
      } catch {
        // Network hiccup: keep the last known state and retry on the next tick.
      }
    };

    poll();
    const timer = window.setInterval(poll, open ? 4000 : 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [saved, open]);

  // Scroll only the message list (never the whole page) when new messages arrive.
  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, chat?.messages.length]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await startChat({ name, phone, message: text });
      if (res.success && res.chat && res.token) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: res.chat.id, token: res.token }));
        } catch {}
        setSaved({ id: res.chat.id, token: res.token });
        setChat(res.chat);
        setText('');
      } else {
        setError(res.error || 'تعذر بدء المحادثة، حاولي مجدداً.');
      }
    } catch {
      setError('تعذر الاتصال بالخادم، حاولي لاحقاً.');
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saved || !text.trim()) return;
    setError('');
    setSending(true);
    try {
      const res = await sendCustomerChatMessage(saved.id, saved.token, text);
      if (res.success && res.chat) {
        setChat(res.chat);
        setText('');
      } else {
        setError(res.error || 'تعذر إرسال الرسالة.');
      }
    } catch {
      setError('تعذر الاتصال بالخادم، حاولي لاحقاً.');
    } finally {
      setSending(false);
    }
  };

  const unread = chat?.unreadByCustomer || 0;
  const inputClass =
    'w-full bg-white border border-[#E3DCCB] rounded-full px-4 py-2.5 text-xs text-[#141416] placeholder:text-[#9A9183] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30';
  const textareaClass =
    'w-full bg-white border border-[#E3DCCB] rounded-2xl px-4 py-2.5 text-xs text-[#141416] placeholder:text-[#9A9183] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 resize-none';

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#D4AF37]/60 shadow-[0_12px_32px_-12px_rgba(212,175,55,0.55)] bg-gradient-to-br from-[#0F0F10] via-[#1A1712] to-[#2A2214]">
      <button
        type="button"
        onClick={() => !alwaysOpen && setOpen(!openState)}
        aria-expanded={open}
        className={`w-full p-5 flex items-center gap-4 text-right group ${alwaysOpen ? 'cursor-default' : ''}`}
      >
        <div className="relative shrink-0">
          {!open && <span className="absolute inset-0 rounded-2xl bg-[#D4AF37]/40 animate-ping" />}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EDD27A] to-[#B38938] text-[#0F0F10] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <MessageSquare className="w-7 h-7" />
          </div>
          {unread > 0 && (
            <span className="absolute -top-1.5 -left-1.5 bg-rose-600 text-white text-[10px] font-extrabold min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full border-2 border-[#0F0F10]">
              {unread}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base text-[#FAF8F5] font-serif-luxury">تحدثي معنا مباشرة</h3>
            <span className="inline-flex items-center gap-1 text-[9px] bg-[#D4AF37] text-[#0F0F10] px-2 py-0.5 rounded-full font-extrabold">
              <Sparkles className="w-2.5 h-2.5" />
              جديد
            </span>
          </div>
          <p className="text-xs text-[#D9D2C3] mt-1 leading-relaxed">
            {saved ? 'لديك محادثة جارية، اضغطي لمتابعتها' : 'اسألي عن المنتجات والعناية ببشرتك، وسنرد عليك هنا داخل الموقع'}
          </p>
          {!open && (
            <span className="inline-block mt-2.5 text-[11px] font-bold text-[#0F0F10] bg-gradient-to-r from-[#EDD27A] to-[#D4AF37] px-3.5 py-1.5 rounded-full shadow">
              {saved ? 'متابعة المحادثة ←' : 'ابدئي المحادثة الآن ←'}
            </span>
          )}
        </div>

        {!alwaysOpen && (
          <ChevronDown className={`w-5 h-5 text-[#D4AF37] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div className="bg-[#FAF6EE] border-t border-[#D4AF37]/40">
          {/* Header strip */}
          <div className="px-5 py-3 flex items-center gap-3 border-b border-[#E9E1CE] bg-white/70">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#EDD27A] to-[#B38938] text-[#0F0F10] font-extrabold text-sm flex items-center justify-center shadow">
              د
            </div>
            <div className="leading-tight">
              <div className="text-xs font-bold text-[#141416]">إدارة د. صابرين بشير</div>
              <div className="text-[10px] text-[#8C6D23]">نرد عليك في أقرب وقت</div>
            </div>
          </div>

          {!saved ? (
            <form onSubmit={handleStart} className="p-5 space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white border border-[#E9E1CE] px-3.5 py-2.5 text-xs leading-relaxed text-[#141416] shadow-sm">
                  أهلاً بك 🌿 كيف نقدر نساعدك؟ اكتبي اسمك ورقمك ورسالتك وسنرد عليك هنا.
                </div>
              </div>
              <input className={inputClass} placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
              <input
                className={inputClass}
                placeholder="رقم الجوال / واتساب"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={30}
                inputMode="tel"
              />
              <textarea
                className={textareaClass}
                rows={3}
                placeholder="اكتبي رسالتك..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                maxLength={600}
              />
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#0F0F10] to-[#2A2214] hover:from-[#D4AF37] hover:to-[#B38938] text-[#FAF8F5] hover:text-[#0F0F10] font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 -scale-x-100" />
                {sending ? 'جاري الإرسال...' : 'بدء المحادثة'}
              </button>
            </form>
          ) : (
            <>
              <div ref={listRef} className="h-[380px] overflow-y-auto p-4 space-y-2.5">
                {!chat && <p className="text-xs text-[#8C827A] text-center py-6">جاري تحميل المحادثة...</p>}
                {chat?.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'customer' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[82%] px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                        m.from === 'customer'
                          ? 'rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#EDD27A] to-[#D4AF37] text-[#0F0F10]'
                          : 'rounded-2xl rounded-tl-sm bg-white text-[#141416] border border-[#E9E1CE]'
                      }`}
                    >
                      {m.text}
                      <div className={`text-[9px] mt-1 ${m.from === 'customer' ? 'text-[#0F0F10]/60' : 'text-[#9A9183]'}`}>
                        {m.from === 'admin' ? 'الإدارة · ' : ''}
                        {formatTime(m.at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSend} className="p-3 border-t border-[#E9E1CE] bg-white/70 space-y-2">
                {error && <p className="text-[11px] text-rose-600">{error}</p>}
                <div className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    placeholder="اكتبي رسالة..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={600}
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    aria-label="إرسال"
                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#EDD27A] to-[#B38938] text-[#0F0F10] shadow hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Send className="w-4 h-4 -scale-x-100" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};
