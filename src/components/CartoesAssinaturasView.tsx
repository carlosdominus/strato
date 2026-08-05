import React from 'react';
import {
  CreditCard,
  Calendar,
  Sparkles,
  AlertTriangle,
  Tv,
  CheckCircle2,
  XCircle,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { CreditCardSheet, Subscription } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CartoesAssinaturasViewProps {
  creditCards: CreditCardSheet[];
  subscriptions: Subscription[];
  onOpenManualModal: () => void;
}

export const CartoesAssinaturasView: React.FC<CartoesAssinaturasViewProps> = ({
  creditCards,
  subscriptions,
  onOpenManualModal,
}) => {
  const totalInvoices = creditCards.reduce((acc, c) => acc + c.currentInvoice, 0);
  const totalSubscriptionsMonthly = subscriptions.reduce((acc, s) => acc + s.monthlyPrice, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 space-y-10 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 glass-card rounded-3xl p-8 border border-[#11310C]/06">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#11310C]/50">
              Controle de Faturas & Recorrências
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4C240]" />
            <span className="text-xs font-bold text-[#11310C]">Fechamento e Abertura</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            Faturas de <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#C4C240]">Cartões</span> & Assinaturas Fixas
          </h1>
        </div>

        <button
          onClick={onOpenManualModal}
          className="liquid-button flex items-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs font-bold text-[#11310C] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Fatura/Assinatura</span>
        </button>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-7 border border-[#11310C]/06">
          <span className="text-[11px] font-bold text-[#11310C]/60 uppercase tracking-wider block mb-2">
            Total em Faturas Abertas
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(totalInvoices)}
          </div>
          <p className="text-[11px] text-[#11310C]/60 mt-2 font-medium">Consolidado do mês</p>
        </div>

        <div className="glass-card rounded-3xl p-7 border border-[#11310C]/06">
          <span className="text-[11px] font-bold text-[#11310C]/60 uppercase tracking-wider block mb-2">
            Total Assinaturas / Mês
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(totalSubscriptionsMonthly)}
          </div>
          <p className="text-[11px] text-[#11310C]/60 mt-2 font-medium">
            {subscriptions.length} assinaturas ativas
          </p>
        </div>

        <div className="glass-card rounded-3xl p-7 border border-[#11310C]/06">
          <span className="text-[11px] font-bold text-[#11310C]/60 uppercase tracking-wider block mb-2">
            Economia Potencial Recom.
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#E13513]">
            R$ 59,90 /mês
          </div>
          <p className="text-[11px] text-[#11310C]/60 mt-2 font-medium">
            1 assinatura com baixa utilização
          </p>
        </div>
      </div>

      {/* Credit Cards Invoice Cycle Section */}
      <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#11310C]/10">
          <div>
            <h3 className="text-lg font-extrabold text-[#11310C]">
              Ciclos de <span className="font-serif italic font-bold text-xl text-[#C4C240]">Abertura & Fechamento</span> dos Cartões
            </h3>
            <p className="text-xs text-[#11310C]/60">
              Conforme sua planilha de cartões (sem exposição de números de cartão)
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#11310C]/10 text-[#11310C]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Dados Protegidos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {creditCards.map((card) => (
            <div
              key={card.id}
              className="p-5 rounded-3xl bg-white/90 border border-[#11310C]/15 space-y-3 shadow-xs hover:border-[#C4C240] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#11310C] text-[#C4C240] flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-[#11310C]">{card.name}</h4>
                    <span className="text-[10px] font-semibold text-[#11310C]/60">
                      {card.bank} • Final {card.lastDigits}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                    card.status === 'fechada'
                      ? 'bg-[#E13513]/15 text-[#E13513]'
                      : 'bg-[#C4C240]/30 text-[#11310C]'
                  }`}
                >
                  {card.status === 'fechada' ? 'Fatura Fechada' : 'Fatura Aberta'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#11310C]/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#11310C]">
                  <span>Fatura Atual:</span>
                  <span className="text-sm font-extrabold">{formatCurrency(card.currentInvoice)}</span>
                </div>
                <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#11310C] h-full rounded-full"
                    style={{ width: `${Math.min(100, (card.currentInvoice / card.limit) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#11310C]/60 font-semibold block text-right">
                  Limite Total: {formatCurrency(card.limit)}
                </span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold pt-1">
                <div className="p-2 rounded-xl bg-white border border-[#11310C]/10">
                  <span className="text-[10px] text-[#11310C]/60 uppercase block">Fechamento</span>
                  <span className="text-[#11310C]">Dia {card.closingDay} do mês</span>
                </div>

                <div className="p-2 rounded-xl bg-white border border-[#11310C]/10">
                  <span className="text-[10px] text-[#11310C]/60 uppercase block">Vencimento</span>
                  <span className="text-[#11310C]">Dia {card.dueDay} do mês</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions Section */}
      <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#11310C]/10">
          <div>
            <h3 className="text-lg font-extrabold text-[#11310C]">
              Planilha de <span className="font-serif italic font-bold text-xl text-[#C4C240]">Assinaturas</span> & Serviços Recorrentes
            </h3>
            <p className="text-xs text-[#11310C]/60">Sincronizado com Planilha_Assinaturas.csv</p>
          </div>
          <span className="text-xs font-extrabold text-[#11310C]">
            Custo Fixo Mensal: {formatCurrency(totalSubscriptionsMonthly)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className={`p-4 rounded-2xl bg-white/90 border space-y-2.5 transition-all ${
                sub.cancelRecommendation
                  ? 'border-[#E13513]/40 bg-[#FDECE9]/30'
                  : 'border-[#11310C]/10 hover:border-[#C4C240]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#11310C]/10 text-[#11310C] flex items-center justify-center font-bold">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#11310C]">{sub.serviceName}</h4>
                    <span className="text-[10px] text-[#11310C]/60">{sub.category}</span>
                  </div>
                </div>

                <span className="font-extrabold text-sm text-[#11310C]">
                  {formatCurrency(sub.monthlyPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-[#11310C]/70 pt-2 border-t border-[#11310C]/10">
                <span>Renova todo dia {sub.renewalDay}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativa
                </span>
              </div>

              {sub.cancelRecommendation && (
                <div className="p-2 rounded-xl bg-[#E13513]/10 border border-[#E13513]/20 flex items-center gap-2 text-[10px] font-bold text-[#E13513]">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Sugestão IA: Pouco uso detectado nos últimos 60 dias.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
