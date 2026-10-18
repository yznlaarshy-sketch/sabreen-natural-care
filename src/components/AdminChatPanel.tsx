import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Phone, Send, Trash2, MessageSquare } from 'lucide-react';
import { Chat } from '../types';
import { fetchAdminChats, sendAdminChatMessage, markAdminChatRead, deleteAdminChat } from '../services/api';

// Polls the chat list every few seconds so the dashboard can show an unread counter on its tab.
export function useAdminChats(token: string) {
  const [chats, setChats] = useState<Chat[]>([]);

  const refresh = useCallback(async () => {
    try {
      setChats(await fetchAdminChats(token));
    } catch {
      // Keep the previous list on a network error.
    }
  }, [token]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { chats, refresh };
}

const formatDateTime = (ts: number) =>
  new Date(ts).toLocaleString('ar', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

interface AdminChatPanelProps {
  token: string;
  chats: Chat[];
  refresh: () => Promise<void>;
}

// Ready-made quick replies for the store owner (tap to fill the reply box).
const QUICK_REPLIES: { label: string; text: string }[] = [
  { label: 'أهلاً وسهلاً', text: 'أهلاً وسهلاً بكِ في متجر د. صابرين بشير للعناية الطبيعية، كيف أقدر أساعدك؟' },
  { label: 'شكراً لتواصلك', text: 'شكراً لتواصلك معنا، يسعدنا خدمتك دائماً.' },
  { label: 'المنتج متوفر', text: 'نعم، المنتج متوفر حالياً ويمكنك طلبه من الموقع مباشرة.' },
  { label: 'المنتج غير متوفر', text: 'نعتذر منكِ، المنتج غير متوفر حالياً وسنعلمك فور توفره بإذن الله.' },
  { label: 'طريقة الدفع', text: 'الدفع بالتحويل (بنك فلسطين أو أي بنك أو محفظة جوال باي / بال باي)، وتظهر بيانات الحساب في صفحة إتمام الطلب، ثم ترفعين صورة إشعار التحويل.' },
  { label: 'مدة التوصيل', text: 'مدة التوصيل من يومين إلى 5 أيام عمل حسب منطقتك داخل قطاع غزة والجنوب.' },
  { label: 'تم استلام طلبك', text: 'تم استلام طلبك وجاري تدقيق التحويل، وسنوافيك بالتأكيد قريباً. يمكنك متابعة حالة الطلب من صفحة "تتبع طلبك" في الموقع.' },
  { label: 'تم تأكيد طلبك', text: 'تم تأكيد طلبك وجاري تجهيزه للتوصيل، شكراً لثقتك بنا.' },
  { label: 'نرجو الانتظار', text: 'نرجو الانتظار قليلاً وسنرد عليك خلال وقت قصير.' },
];


export const AdminChatPanel: React.FC<AdminChatPanelProps> = ({ token, chats, refresh }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = chats.find((c) => c.id === selectedId) || null;

  // Opening a conversation (or receiving a message while it is open) marks it as read.
  useEffect(() => {
    if (selected && selected.unreadByAdmin > 0) {
      markAdminChatRead(token, selected.id).then(refresh).catch(() => {});
    }
  }, [selected?.id, selected?.unreadByAdmin, token, refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [selected?.id, selected?.messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    setError('');
    setSending(true);
    try {
      const res = await sendAdminChatMessage(token, selected.id, reply);
      if (res.success) {
        setReply('');
        await refresh();
      } else {
        setError(res.error || 'تعذر إرسال الرد.');
      }
    } catch {
      setError('تعذر الاتصال بالخادم.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (await deleteAdminChat(token, selected.id)) {
      setSelectedId(null);
      setConfirmDelete(false);
      await refresh();
    }
  };

  const selectChat = (id: string) => {
    setSelectedId(id);
    setConfirmDelete(false);
    setError('');
  };

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-4 min-h-[60vh]">
      {/* Conversation list (hidden on mobile while a conversation is open) */}
      <div className={`${selected ? 'hidden lg:block' : 'block'} bg-[#17171A] border border-[#27272D] rounded-2xl overflow-hidden`}>
        <div className="px-4 py-3 border-b border-[#27272D] text-xs font-bold text-[#FAF7F2]">المحادثات ({chats.length})</div>
        {chats.length === 0 ? (
          <p className="p-6 text-center text-xs text-[#A8A295]">لا توجد محادثات بعد.</p>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto divide-y divide-[#27272D]">
            {chats.map((c) => {
              const last = c.messages[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChat(c.id)}
                  className={`w-full text-right px-4 py-3 hover:bg-[#1F1F24] transition-colors ${
                    c.id === selectedId ? 'bg-[#1F1F24]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#FAF7F2] truncate">{c.name}</span>
                    {c.unreadByAdmin > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                        {c.unreadByAdmin}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#A8A295] truncate mt-1">
                    {last ? `${last.from === 'admin' ? 'أنت: ' : ''}${last.text}` : ''}
                  </p>
                  <span className="text-[10px] text-[#6F6A5F]">{formatDateTime(c.updatedAt)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Open conversation */}
      <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col bg-[#17171A] border border-[#27272D] rounded-2xl overflow-hidden`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[#A8A295] text-xs p-8">
            <MessageSquare className="w-8 h-8 text-[#D4AF37]/60" />
            اختر محادثة من القائمة
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-[#27272D] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <button type="button" onClick={() => setSelectedId(null)} className="lg:hidden p-1 text-[#D4AF37]" aria-label="رجوع">
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#FAF7F2] truncate">{selected.name}</div>
                  <a
                    href={`tel:${selected.phone}`}
                    dir="ltr"
                    className="text-[11px] text-[#D4AF37] flex items-center gap-1 justify-end"
                  >
                    <Phone className="w-3 h-3" />
                    {selected.phone}
                  </a>
                </div>
              </div>
              {confirmDelete ? (
                <div className="flex items-center gap-2 text-[11px]">
                  <button type="button" onClick={handleDelete} className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold">
                    تأكيد الحذف
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="px-2.5 py-1 rounded-lg bg-[#25252A] text-[#FAF7F2]">
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="حذف المحادثة"
                  className="p-2 rounded-lg text-rose-400 hover:bg-[#25252A]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[55vh]">
              {selected.messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === 'customer' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                      m.from === 'customer'
                        ? 'bg-[#25252A] text-[#FAF7F2]'
                        : 'bg-gradient-to-r from-[#D4AF37] to-[#B38938] text-[#0E0E10]'
                    }`}
                  >
                    {m.auto && <span className="block text-[9px] font-bold text-[#0E0E10]/70 mb-0.5">رد تلقائي</span>}
                    {m.text}
                    <div className={`text-[9px] mt-1 ${m.from === 'customer' ? 'text-[#8C827A]' : 'text-[#0E0E10]/60'}`}>
                      {formatDateTime(m.at)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-[#27272D] space-y-2">
              {/* Quick ready-made replies: tap to fill the box, edit if needed, then send */}
              <div className="flex gap-1.5 overflow-x-auto pb-1" aria-label="ردود جاهزة">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setReply(q.text)}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-[#1F1F24] border border-[#2F2F34] text-[#D4AF37] hover:border-[#D4AF37] transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
              {error && <p className="text-[11px] text-rose-400">{error}</p>}
              <div className="flex items-center gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  maxLength={600}
                  placeholder="اكتب ردك..."
                  className="w-full bg-[#1F1F24] border border-[#2F2F34] rounded-xl px-3 py-2.5 text-xs text-[#FAF7F2] placeholder:text-[#8C827A] focus:border-[#D4AF37] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  aria-label="إرسال"
                  className="shrink-0 p-2.5 rounded-xl bg-[#D4AF37] text-[#0E0E10] disabled:opacity-50"
                >
                  <Send className="w-4 h-4 -scale-x-100" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
