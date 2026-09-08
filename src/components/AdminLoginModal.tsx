import React, { useState, useEffect } from 'react';
import { X, Lock, Shield, AlertCircle, Eye, EyeOff, User, CheckCircle2 } from 'lucide-react';
import { adminLogin, fetchCurrentAdminUser } from '../services/api';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, username: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('sb_admin_user') || 'sabreen';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedUser = localStorage.getItem('sb_admin_user');
      if (savedUser) setUsername(savedUser);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setPassword('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await adminLogin(username, password);
      if (res.success && res.token && res.username) {
        setPassword('');
        try {
          localStorage.setItem('sb_admin_user', res.username);
        } catch {}
        onLoginSuccess(res.token, res.username);
        onClose();
      } else {
        setErrorMessage(res.error || 'فشل تسجيل الدخول. يرجى التحقق من كلمة المرور أو اسم المستخدم.');
      }
    } catch (err: any) {
      setErrorMessage('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" dir="rtl">
      <div className="relative w-full max-w-md bg-[#FAF8F5] rounded-3xl border border-[#E6E1D8] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-[#0F0F10] text-[#FAF8F5] border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif-luxury">تسجيل دخول صاحب المتجر</h3>
              <p className="text-[11px] text-[#D4AF37]">لوحة تحكم مشفرة ومحمية</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-[#1F1F22] text-[#FAF8F5]/60 hover:text-[#FAF8F5] transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Advisory Badge */}
        <div className="bg-[#1B1B1E] text-[#FAF8F5] px-5 py-2.5 border-b border-[#2D2D35] flex items-center gap-2 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[#D8D4CA]">
            كلمة المرور واسم المستخدم المحفوظة تظل ثابتة ومخزنة بأمان دائم في قاعدة البيانات.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#141416] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#B38938]" />
                اسم مستخدم الإدارة
              </span>
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="اكتب اسم المستخدم..."
              className="w-full bg-[#FFFFFF] border border-[#DCD5C9] rounded-xl px-3.5 py-2.5 text-xs text-[#141416] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#141416] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#B38938]" />
                كلمة المرور المشفرة
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الخاصة بك..."
                className="w-full bg-[#FFFFFF] border border-[#DCD5C9] rounded-xl px-3.5 py-2.5 text-xs text-[#141416] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-all pl-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#141416] p-1 transition-colors cursor-pointer"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F5EFE6] border border-[#E0D5C3] text-[11px] text-[#5A4B29] space-y-1 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-[#3B3015]">
              <Shield className="w-3.5 h-3.5 text-[#B38938]" />
              <span>تنبيه أمني للأدمن:</span>
            </div>
            <p className="text-[10.5px] text-[#6B5A33]">
              عند تغييرك لاسم المستخدم أو كلمة المرور من داخل لوحة التحكم، يتم حفظها وتثبيتها بشكل دائم، ولن تعود كلمة المرور السابقة أبداً.
            </p>
          </div>

          <div className="pt-2">
            <button
              id="btn-admin-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#0F0F10] hover:bg-[#D4AF37] text-[#FAF8F5] hover:text-[#0F0F10] font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>جاري التحقق الأمني...</span>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>دخول لوحة التحكم</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
