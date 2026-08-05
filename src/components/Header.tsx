import React from 'react';
import {
  Plus,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Search,
  LogOut,
  Lock,
} from 'lucide-react';
import { TomatoIcon } from './TomatoIcon';

interface HeaderProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  monthsList: string[];
  onOpenManualModal: () => void;
  onNavigateToTab: (tabId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  googleUser: User | null;
  isLoggingIn: boolean;
  onGoogleLogin: () => void;
  onGoogleLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  onMonthChange,
  monthsList,
  onOpenManualModal,
  onNavigateToTab,
  searchQuery,
  onSearchChange,
  googleUser,
  isLoggingIn,
  onGoogleLogin,
  onGoogleLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#F8F9F3]/85 border-b border-[#11310C]/10 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-3">
            {/* Logo pill */}
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md shadow-[#11310C]/10 border border-[#11310C]/15 glaze-shine">
              <TomatoIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-black text-2xl tracking-tight text-[#11310C]">
                  Strato
                </span>
              </div>
              {googleUser && (
                <p className="text-xs text-[#11310C]/70 flex items-center gap-1 font-medium mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Autenticado com Google ({googleUser.email})</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick spreadsheet indicator button */}
          <button
            onClick={() => onNavigateToTab('planilhas')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 hover:bg-white text-[#11310C] border border-[#11310C]/15 shadow-xs transition-all hover:border-[#C4C240]"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#C4C240]" />
            <span className="hidden lg:inline">Planilhas Conectadas</span>
            <span className={`w-2 h-2 rounded-full ${googleUser ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          </button>
        </div>

        {/* Search & Month Filter & Manual Entry CTA & Google Login */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#11310C]/40" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-2xl text-xs font-medium bg-white/90 border border-[#11310C]/15 focus:outline-none focus:ring-2 focus:ring-[#C4C240] focus:border-transparent transition-all placeholder-[#11310C]/40 text-[#11310C]"
            />
          </div>

          {/* Month Selector Pill */}
          <div className="relative inline-block">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl glass-pill border border-[#11310C]/15 text-[#11310C] text-xs font-bold cursor-pointer hover:bg-white transition-all shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-[#C4C240]" />
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-transparent appearance-none pr-4 font-semibold text-xs text-[#11310C] focus:outline-none cursor-pointer"
              >
                {monthsList.map((m) => (
                  <option key={m} value={m} className="bg-white text-[#11310C]">
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#11310C]/60 pointer-events-none absolute right-2.5" />
            </div>
          </div>

          {/* Google Sign-In or User Profile */}
          {googleUser ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-950 border border-emerald-300 px-3 py-1.5 rounded-2xl text-xs font-medium">
              {googleUser.photoURL ? (
                <img src={googleUser.photoURL} alt={googleUser.displayName || 'User'} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="hidden md:inline font-semibold text-[11px] truncate max-w-[110px]">{googleUser.displayName || googleUser.email}</span>
              <button
                onClick={onGoogleLogout}
                title="Sair da conta Google"
                className="hover:text-red-600 ml-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-3.5 py-1.5 rounded-2xl border border-gray-300 shadow-xs text-xs cursor-pointer transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'Conectando...' : 'Entrar com Google'}</span>
            </button>
          )}

          {/* Registro Manual Button */}
          <button
            onClick={onOpenManualModal}
            className="liquid-button flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-[#11310C] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Novo Lançamento</span>
          </button>
        </div>
      </div>
    </header>
  );
};

