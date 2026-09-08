import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, X, Instagram, Facebook, MessageCircle, Sparkles } from 'lucide-react';
import { StoreSettings } from '../types';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentView: string;
  onNavigate: (view: string) => void;
  settings: StoreSettings | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenAdmin,
  isAdminLoggedIn,
  searchQuery,
  onSearchChange,
  currentView,
  onNavigate,
  settings
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchInput = (val: string) => {
    onSearchChange(val);
  };

  const navItems = [
    { id: 'store', label: 'المتجر والمنتجات' },
    { id: 'new', label: 'وصل حديثاً' },
    { id: 'bestsellers', label: 'الأكثر مبيعاً' },
    { id: 'about', label: 'من نحن' },
    { id: 'contact', label: 'تواصل معنا' },
    { id: 'policy', label: 'الشحن والاستبدال' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0E0E10] text-[#FAF7F2] border-b border-[#232326] shadow-lg backdrop-blur-md">
      
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-[#141416] via-[#241F16] to-[#141416] border-b border-[#D4AF37]/20 py-1.5 px-4 text-[11px] sm:text-xs font-medium text-[#E5D7B3] flex items-center justify-between">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span className="hidden lg:inline text-[#E5D7B3]">د. صابرين بشير |</span>
            <span className="text-[#FAF7F2] font-semibold text-[10px] sm:text-xs">
              📍 التوصيل متاح داخل قطاع غزة والجنوب فقط حالياً • نستقبل طلباتكم في أي وقت طوال اليوم (24/7)
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs text-[#FAF7F2]/80">
            {settings?.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>واتساب المتجر</span>
              </a>
            )}
            {settings?.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"
              >
                <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                <span>انستقرام</span>
              </a>
            )}
            {settings?.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"
              >
                <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                <span>فيسبوك</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        
        {/* Mobile menu toggle */}
        <button
          id="btn-mobile-menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#E5D7B3] hover:text-[#D4AF37]"
          aria-label="القائمة"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Identity with Circular Logo Crest */}
        <div
          onClick={() => onNavigate('store')}
          className="cursor-pointer flex items-center gap-3 select-none group"
          title="د. صابرين بشير"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.25)] bg-[#FAF7F2] shrink-0 group-hover:scale-105 transition-transform">
            <img
              src="/dr_sabreen_logo.jpg"
              alt="شعار د. صابرين بشير"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-lg md:text-xl font-bold tracking-wide text-[#FAF7F2] font-serif-luxury group-hover:text-[#D4AF37] transition-colors">
              د. صابرين بشير
            </span>
            <span className="text-[10px] text-[#C5A859] tracking-wider font-light -mt-0.5">
              منتجات طبيعية للبشرة والتجميل
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`transition-colors py-1 relative ${
                currentView === item.id
                  ? 'text-[#D4AF37]'
                  : 'text-[#FAF7F2]/75 hover:text-[#D4AF37]'
              }`}
            >
              {item.label}
              {currentView === item.id && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full shadow-[0_0_6px_#D4AF37]" />
              )}
            </button>
          ))}
        </nav>

        {/* Action icons: Search, Cart, Admin */}
        <div className="flex items-center gap-2.5">
          
          {/* Search Toggle / Input */}
          <div className="relative">
            {searchOpen ? (
              <div className="flex items-center bg-[#171719] border border-[#D4AF37]/50 rounded-full px-3 py-1.5 shadow-inner">
                <input
                  type="text"
                  placeholder="ابحث عن صابون، زيت، سيروم..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  autoFocus
                  className="bg-transparent text-xs text-[#FAF7F2] focus:outline-none w-36 sm:w-52 placeholder-[#FAF7F2]/40"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-[#FAF7F2]/60 hover:text-[#FAF7F2] ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-search-toggle"
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full hover:bg-[#1A1A1D] text-[#FAF7F2]/80 hover:text-[#D4AF37] transition-colors"
                title="بحث عن منتج"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cart Button */}
          <button
            id="btn-open-cart"
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-[#171719] hover:bg-[#202024] text-[#FAF7F2] border border-[#D4AF37]/35 px-3.5 py-1.5 rounded-full transition-all hover:border-[#D4AF37]"
            title="سلة المشتريات"
          >
            <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline text-xs font-semibold">السلة</span>
            {cartCount > 0 && (
              <span className="bg-[#D4AF37] text-[#0E0E10] text-[11px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#131315] border-t border-[#232326] px-4 py-4 space-y-3">
          <div className="pb-2 border-b border-[#232326]">
            <input
              type="text"
              placeholder="ابحث عن منتج بالاسم أو الفئة..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full bg-[#1A1A1E] border border-[#2D2D32] rounded-xl px-3 py-2 text-xs text-[#FAF7F2] placeholder-[#FAF7F2]/40 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-right py-2.5 px-3 rounded-xl text-xs font-medium ${
                  currentView === item.id
                    ? 'bg-[#D4AF37]/15 text-[#D4AF37] font-bold'
                    : 'text-[#FAF7F2]/80 hover:bg-[#1A1A1E]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#232326] flex justify-around text-xs text-[#FAF7F2]/70">
            {settings?.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-[#D4AF37]"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>واتساب</span>
              </a>
            )}
            {settings?.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-[#D4AF37]"
              >
                <Instagram className="w-4 h-4 text-[#E1306C]" />
                <span>انستقرام</span>
              </a>
            )}
            {settings?.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-[#D4AF37]"
              >
                <Facebook className="w-4 h-4 text-[#1877F2]" />
                <span>فيسبوك</span>
              </a>
            )}
          </div>
        </div>
      )}

    </header>
  );
};
