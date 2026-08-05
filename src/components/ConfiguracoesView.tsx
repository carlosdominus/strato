import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  RefreshCw,
  FileSpreadsheet,
  Lock,
  Globe,
  Database,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SpreadsheetConnection } from '../types';

interface ConfiguracoesViewProps {
  googleUser: User | null;
  isLoggingIn: boolean;
  onGoogleLogin: () => void;
  onGoogleLogout: () => void;
  spreadsheets: SpreadsheetConnection[];
  onRefreshSheets: () => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  googleUser,
  isLoggingIn,
  onGoogleLogin,
  onGoogleLogout,
  spreadsheets,
  onRefreshSheets,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 space-y-6 pb-12">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card rounded-3xl p-6 border border-white/90">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#11310C]/60">
              Painel de Controle
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4C240]" />
            <span className="text-xs font-bold text-[#11310C]">Autenticação & Preferências</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            Configurações & <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#C4C240]">Integrações</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Authentication Box */}
        <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#11310C]/10">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-[#11310C]/10 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#11310C]">Autenticação Google OAuth 2.0</h3>
              <p className="text-xs text-[#11310C]/60">Conexão segura para acesso às planilhas privadas</p>
            </div>
          </div>

          {googleUser ? (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google User'}
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-900 font-extrabold flex items-center justify-center">
                      {googleUser.email ? googleUser.email[0].toUpperCase() : 'G'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-950">
                      {googleUser.displayName || 'Usuário Autenticado'}
                    </h4>
                    <p className="text-xs font-semibold text-emerald-800">{googleUser.email}</p>
                  </div>
                </div>

                <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Conectado
                </span>
              </div>

              <p className="text-xs text-emerald-900/80 font-medium">
                Sua conta Google está autenticada com sucesso. As planilhas do Google Sheets privadas são sincronizadas em tempo real.
              </p>

              <button
                onClick={onGoogleLogout}
                className="w-full py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta Google</span>
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white border border-[#11310C]/10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#C4C240]/20 text-[#11310C] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-[#11310C]" />
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-[#11310C]">Conecte sua Conta Google</h4>
                <p className="text-xs text-[#11310C]/60 mt-1 max-w-sm mx-auto font-medium">
                  Inicie sessão para autorizar a leitura automática das suas planilhas de gastos, cartões e investimentos no Google Drive.
                </p>
              </div>

              {/* Polished Google Sign-in button */}
              <button
                onClick={onGoogleLogin}
                disabled={isLoggingIn}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-bold border border-gray-300 shadow-sm hover:shadow text-xs flex items-center justify-center gap-3 mx-auto transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'Autenticando...' : 'Iniciar Sessão com o Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Google Sheets Status & Synchronization */}
        <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#11310C]/10">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#C4C240]" />
              <h3 className="font-extrabold text-base text-[#11310C]">Planilhas Conectadas</h3>
            </div>

            <button
              onClick={onRefreshSheets}
              className="p-2 rounded-xl bg-[#11310C] text-[#FAFBF6] hover:bg-[#1a4413] transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Forçar Sincronização</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {spreadsheets.map((sheet) => (
              <div
                key={sheet.id}
                className="p-3 rounded-2xl bg-white/90 border border-[#11310C]/10 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-[#11310C]">{sheet.title}</h4>
                  <p className="text-[10px] text-[#11310C]/60 font-medium">{sheet.description}</p>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      sheet.status === 'conectado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sheet.status === 'conectado' ? 'Sincronizado' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
