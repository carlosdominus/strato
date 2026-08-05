import React from 'react';
import {
  Target,
  AlertCircle,
  TrendingDown,
  ShieldCheck,
  Plus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Debt } from '../types';
import { formatCurrency } from '../utils/formatters';

interface DividasViewProps {
  debts: Debt[];
  onOpenManualModal: () => void;
}

export const DividasView: React.FC<DividasViewProps> = ({ debts, onOpenManualModal }) => {
  const totalDebtsRemaining = debts.reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalMonthlyDebtPayments = debts.reduce((acc, d) => acc + d.monthlyPayment, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 space-y-10 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 glass-card rounded-3xl p-8 border border-[#11310C]/06">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#11310C]/50">
              Amortização & Quitação
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E13513]" />
            <span className="text-xs font-bold text-[#11310C]">Plano Estratégico</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            Controle de <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#E13513]">Dívidas</span> & Metas de Quitação
          </h1>
        </div>

        <button
          onClick={onOpenManualModal}
          className="liquid-button flex items-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs font-bold text-[#11310C] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Dívida/Amortização</span>
        </button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-7 border border-[#11310C]/06">
          <span className="text-[11px] font-bold text-[#11310C]/60 uppercase tracking-wider block mb-2">
            Saldo Devedor Total Restante
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#E13513]">
            {formatCurrency(totalDebtsRemaining)}
          </div>
          <p className="text-[11px] text-[#11310C]/60 mt-2 font-medium">
            Em liquidação acelerada
          </p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/60 uppercase tracking-wider block mb-2">
            Comprometimento Mensal
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(totalMonthlyDebtPayments)}
          </div>
          <p className="text-[11px] text-[#11310C]/60 mt-2 font-medium">
            Parcelas mensais vigentes
          </p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/60 uppercase tracking-wider block mb-2">
            Estratégia Recomendada
          </span>
          <div className="text-base font-extrabold text-[#11310C]">
            Método Bola de Neve (Maior Taxa Primeiro)
          </div>
          <p className="text-[11px] text-emerald-800 font-bold mt-2">
            Projeção de quitação total em 14 meses
          </p>
        </div>
      </div>

      {/* Debts Table & Progress Cards */}
      <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#11310C]/10">
          <div>
            <h3 className="text-lg font-extrabold text-[#11310C]">
              Contratos & <span className="font-serif italic font-bold text-xl text-[#C4C240]">Financiamentos</span> Ativos
            </h3>
            <p className="text-xs text-[#11310C]/60">Sincronizado com Planilha_Dividas.xlsx</p>
          </div>
          <span className="text-xs font-extrabold text-[#11310C]">
            {debts.length} contratos mapeados
          </span>
        </div>

        <div className="space-y-4">
          {debts.map((debt) => {
            const paidAmount = debt.totalAmount - debt.remainingAmount;
            const progressPercent = Math.round((paidAmount / debt.totalAmount) * 100);

            return (
              <div
                key={debt.id}
                className="p-5 rounded-3xl bg-white/90 border border-[#11310C]/10 space-y-3 shadow-xs hover:border-[#E13513]/40 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#11310C]">{debt.creditor}</h4>
                    <p className="text-xs text-[#11310C]/60 font-semibold">
                      {debt.type} • Taxa de Juros: {debt.interestRate}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold text-[#11310C]/60 uppercase block">
                      Saldo Restante
                    </span>
                    <span className="text-base font-extrabold text-[#E13513]">
                      {formatCurrency(debt.remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#11310C]/70">
                    <span>Progresso de Quitação ({progressPercent}% pago)</span>
                    <span>Total Original: {formatCurrency(debt.totalAmount)}</span>
                  </div>
                  <div className="w-full bg-[#11310C]/10 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-[#11310C] h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-[#11310C]/10">
                  <span className="text-[#11310C]">
                    Parcela Mensal: <span className="font-extrabold">{formatCurrency(debt.monthlyPayment)}</span>
                  </span>
                  <span className="text-[#11310C]/70">{debt.dueDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
