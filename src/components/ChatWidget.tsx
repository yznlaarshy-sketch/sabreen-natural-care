import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
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

export const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<SavedChat | null>(() => loadSaved());
  const [chat, setChat] = useState<Chat | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const forgetChat = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setSaved(null);
    setChat(null);
  };

  // Poll the conversation: every 4s while open, every 12s while closed (to show the unread badge).
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
        // Network hiccup: keep the last known state and try again on the next tick.
      }
    };

    poll();
    const timer = window.setInterval(poll, open ? 4000 : 12000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [saved, open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: 'end' });
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
        setError(res.error || 'تعذر بدء المحادثة، حاول مجدداً.');
      }
    } catch {
      setError('تعذر الاتصال بالخادم، حاول لاحقاً.');
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
      setError('تعذر الاتصال بالخادم، حاول لاحقاً.');
    } finally {
      setSending(false);
    }
  };

  const unread = chat?.unreadByCustomer || 0;
  const inputClass =
    'w-full bg-[#1A1A1C] border border-[#2F2F34] rounded-xl px-3 py-2 text-xs text-[#FAF8F5] placeholder:text-[#8C827A] focus:border-[#D4AF37] focus:outline-none';

  return (
    <div dir="rtl" className="font-sans">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="تحدث مع الإدارة"
          className="fixed bottom-[4.75rem] left-5 z-40 flex items-center gap-2 bg-[#D4AF37] text-[#0F0F10] px-4 py-3 rounded-full shadow-2xl hover:bg-[#E2C55A] transition-colors text-xs font-bold"
        >
          <MessageSquare className="w-4 h-4" />
          <span>تحدث مع الإدارة</span>
          {unread > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:w-[360px] z-50 bg-[#0F0F10] text-[#FAF8F5] border border-[#D4AF37]/40 rounded-3xl shadow-2xl flex flex-col h-[70vh] max-h-[520px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#D4AF37]">
              <MessageSquare className="w-4 h-4" />
              <span>الدردشة مع الإدارة</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="p-1 rounded-full hover:bg-[#2A2A2E]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!saved ? (
            <form onSubmit={handleStart} className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-xs text-[#C9C2B6] leading-relaxed">
                اكتب اسمك ورقمك ورسالتك وسنرد عليك هنا في أقرب وقت. احتفظ بهذه النافذة أو ارجع لها لاحقاً لرؤية الرد.
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
                rows={4}
                placeholder="اكتب رسالتك..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                maxLength={600}
              />
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-[#0F0F10] font-bold text-xs disabled:opacity-50"
              >
                {sending ? 'جاري الإرسال...' : 'بدء المحادثة'}
              </button>
            </form>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {!chat && <p className="text-xs text-[#8C827A] text-center py-6">جاري تحميل المحادثة...</p>}
                {chat?.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'customer' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                        m.from === 'customer' ? 'bg-[#D4AF37] text-[#0F0F10]' : 'bg-[#1F1F23] text-[#FAF8F5] border border-[#2F2F34]'
                      }`}
                    >
                      {m.text}
                      <div className={`text-[9px] mt-1 ${m.from === 'customer' ? 'text-[#0F0F10]/60' : 'text-[#8C827A]'}`}>
                        {m.from === 'admin' ? 'الإدارة · ' : ''}
                        {formatTime(m.at)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="p-3 border-t border-[#2A2A2A] space-y-2">
                {error && <p className="text-[11px] text-rose-400">{error}</p>}
                <div className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    placeholder="اكتب رسالة..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={600}
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    aria-label="إرسال"
                    className="shrink-0 p-2.5 rounded-xl bg-[#D4AF37] text-[#0F0F10] disabled:opacity-50"
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
