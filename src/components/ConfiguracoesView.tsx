import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  RefreshCw,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SpreadsheetConnection, Transaction } from '../types';
import { PlanilhasView } from './PlanilhasView';

interface ConfiguracoesViewProps {
  googleUser: User | null;
  isLoggingIn: boolean;
  onGoogleLogin: () => void;
  onGoogleLogout: () => void;
  spreadsheets: SpreadsheetConnection[];
  onAddSpreadsheet: (sheet: SpreadsheetConnection) => void;
  onImportCsvTransactions: (newTransactions: Transaction[]) => void;
  onRefreshSheets: () => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  googleUser,
  isLoggingIn,
  onGoogleLogin,
  onGoogleLogout,
  spreadsheets,
  onAddSpreadsheet,
  onImportCsvTransactions,
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
            <span className="text-xs font-bold text-[#11310C]">Autenticação, Planilhas & Conexões</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            Configurações & <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#C4C240]">Planilhas Conectadas</span>
          </h1>
        </div>
      </div>

      {/* Google Authentication Box */}
      <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-[#11310C]/10">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-[#11310C]/10 flex items-center justify-center">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
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
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
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

            <button
              onClick={onGoogleLogin}
              disabled={isLoggingIn}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-bold border border-gray-300 shadow-sm hover:shadow text-xs flex items-center justify-center gap-3 mx-auto transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isLoggingIn ? 'Autenticando...' : 'Iniciar Sessão com o Google'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Embedded Planilhas & Conexões Section */}
      <div className="pt-4 border-t border-[#11310C]/10">
        <PlanilhasView
          spreadsheets={spreadsheets}
          onAddSpreadsheet={onAddSpreadsheet}
          onImportCsvTransactions={onImportCsvTransactions}
          onRefreshSheets={onRefreshSheets}
        />
      </div>
    </div>
  );
};
