import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, ChevronDown } from 'lucide-react';
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
export const ContactChat: React.FC = () => {
  const [open, setOpen] = useState(false);
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
    'w-full bg-white border border-[#DCD5C9] rounded-xl px-3.5 py-2.5 text-xs text-[#141416] placeholder:text-[#9A9183] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30';

  return (
    <div className="rounded-2xl bg-white border border-[#E6E1D8] shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full p-5 flex items-center gap-4 text-right hover:bg-[#FAF6EE] transition-colors group"
      >
        <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 text-[#B38938] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-[#141416] flex items-center gap-2">
            دردشة مباشرة مع الإدارة
            {unread > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full">
                {unread}
              </span>
            )}
          </h3>
          <p className="text-xs text-[#736B5E] mt-0.5">
            {saved ? 'لديك محادثة جارية، اضغطي لمتابعتها' : 'اكتبي لنا هنا وسنرد عليك داخل الموقع'}
          </p>
        </div>
        <ChevronDown className={`w-5 h-5 text-[#B38938] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-[#E6E1D8] bg-[#FDFBF7]">
          {!saved ? (
            <form onSubmit={handleStart} className="p-5 space-y-3">
              <p className="text-xs text-[#6B6355] leading-relaxed">
                اكتبي اسمك ورقمك ورسالتك، وسنرد عليك هنا في أقرب وقت. ارجعي لهذه الصفحة لاحقاً لرؤية الرد.
              </p>
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
                className={`${inputClass} resize-none`}
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
                className="w-full py-3 rounded-xl bg-[#0F0F10] hover:bg-[#D4AF37] text-[#FAF8F5] hover:text-[#0F0F10] font-bold text-xs transition-all disabled:opacity-50"
              >
                {sending ? 'جاري الإرسال...' : 'بدء المحادثة'}
              </button>
            </form>
          ) : (
            <>
              <div ref={listRef} className="h-[340px] overflow-y-auto p-4 space-y-2">
                {!chat && <p className="text-xs text-[#8C827A] text-center py-6">جاري تحميل المحادثة...</p>}
                {chat?.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'customer' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                        m.from === 'customer'
                          ? 'bg-[#D4AF37] text-[#0F0F10]'
                          : 'bg-white text-[#141416] border border-[#E6E1D8]'
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
              <form onSubmit={handleSend} className="p-3 border-t border-[#E6E1D8] space-y-2">
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
                    className="shrink-0 p-3 rounded-xl bg-[#0F0F10] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0F0F10] transition-colors disabled:opacity-50"
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
