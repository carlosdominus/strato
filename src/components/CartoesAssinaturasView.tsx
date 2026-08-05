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
  onToggleSubscriptionStatus?: (id: string) => void;
}

export const CartoesAssinaturasView: React.FC<CartoesAssinaturasViewProps> = ({
  creditCards,
  subscriptions,
  onOpenManualModal,
  onToggleSubscriptionStatus,
}) => {
  const activeSubs = subscriptions.filter((s) => s.status === 'ativa' || s.active);
  const pausedSubs = subscriptions.filter((s) => s.status === 'pausada' || !s.active);

  const totalInvoices = creditCards.reduce((acc, c) => acc + c.currentInvoice, 0);
  const totalSubscriptionsMonthly = activeSubs.reduce((acc, s) => acc + s.monthlyPrice, 0);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#11310C]/10">
          <div>
            <h3 className="text-lg font-extrabold text-[#11310C]">
              Planilha de <span className="font-serif italic font-bold text-xl text-[#C4C240]">Assinaturas</span> & Cobranças Automáticas
            </h3>
            <p className="text-xs text-[#11310C]/60">
              Assinaturas com status <span className="font-bold text-emerald-800">Ativa</span> são cobradas no extrato. Assinaturas <span className="font-bold text-amber-800">Pausadas</span> são suspensas.
            </p>
          </div>
          <span className="text-xs font-extrabold text-[#11310C]">
            Custo Fixo Ativo: {formatCurrency(totalSubscriptionsMonthly)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {subscriptions.map((sub) => {
            const isActive = sub.status === 'ativa' || sub.active;

            return (
              <div
                key={sub.id}
                className={`p-5 rounded-3xl bg-white/90 border space-y-3 transition-all ${
                  isActive
                    ? 'border-[#11310C]/15 shadow-xs hover:border-[#C4C240]'
                    : 'border-amber-300/60 bg-amber-50/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                      isActive ? 'bg-[#11310C] text-[#C4C240]' : 'bg-amber-200 text-amber-900'
                    }`}>
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#11310C]">{sub.serviceName}</h4>
                      <span className="text-[11px] font-semibold text-[#11310C]/60 block">
                        Cobrado no: <strong className="text-[#11310C]">{sub.paymentCard || 'Cartão Nubank'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-base text-[#11310C] block">
                      {formatCurrency(sub.monthlyPrice)}
                    </span>
                    <span className="text-[10px] text-[#11310C]/60 font-semibold">por mês</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1 border-t border-[#11310C]/10">
                  <div className="p-2.5 rounded-2xl bg-white border border-[#11310C]/10">
                    <span className="text-[10px] text-[#11310C]/60 uppercase block">Data Cobrança (Col E)</span>
                    <span className="text-[#11310C]">Dia {sub.renewalDay} do mês</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white border border-[#11310C]/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#11310C]/60 uppercase block">Status (Col A)</span>
                      <span className={isActive ? 'text-emerald-800 font-extrabold' : 'text-amber-800 font-extrabold'}>
                        {isActive ? 'Ativa' : 'Pausada'}
                      </span>
                    </div>

                    {onToggleSubscriptionStatus && (
                      <button
                        onClick={() => onToggleSubscriptionStatus(sub.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all ${
                          isActive
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                        }`}
                      >
                        {isActive ? 'Pausar' : 'Ativar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
