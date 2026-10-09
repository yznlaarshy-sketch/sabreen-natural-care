import React, { useState } from 'react';
import { Lock, Shield, AlertCircle, Eye, EyeOff, User } from 'lucide-react';
import { adminLogin } from '../services/api';

interface AdminLoginPageProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem('sb_admin_user') || 'sabreen';
    } catch {
      return 'sabreen';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      } else {
        setErrorMessage(res.error || 'فشل تسجيل الدخول. يرجى التحقق من كلمة المرور أو اسم المستخدم.');
      }
    } catch {
      setErrorMessage('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0F0F10]" dir="rtl">
      <div className="w-full max-w-md bg-[#FAF8F5] rounded-3xl border border-[#E6E1D8] shadow-2xl overflow-hidden">
        <div className="p-6 bg-[#0F0F10] text-[#FAF8F5] border-b border-[#2A2A2A] flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-bold text-lg font-serif-luxury">تسجيل دخول صاحب المتجر</h1>
            <p className="text-[11px] text-[#D4AF37] mt-1">لوحة تحكم مشفرة ومحمية</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#141416] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#B38938]" />
              اسم مستخدم الإدارة
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
            <label className="text-xs font-bold text-[#141416] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#B38938]" />
              كلمة المرور
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
        </form>
      </div>
    </div>
  );
};
