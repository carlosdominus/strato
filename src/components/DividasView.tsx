import React from 'react';
import {
  AlertCircle,
  ShieldCheck,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { Debt, Debtor } from '../types';
import { formatCurrency } from '../utils/formatters';

interface DividasViewProps {
  debts: Debt[];
  debtors?: Debtor[];
  onOpenManualModal: () => void;
}

export const DividasView: React.FC<DividasViewProps> = ({
  debts,
  debtors = [],
  onOpenManualModal,
}) => {
  const totalDebtsRemaining = debts.reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalMonthlyDebtPayments = debts.reduce((acc, d) => acc + d.monthlyPayment, 0);

  const totalReceivableFromDebtors = debtors.reduce((acc, d) => acc + d.remainingAmount, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card rounded-3xl p-6 border border-white/90">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#11310C]/60">
              Gestão de Devedores & Créditos a Receber
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4C240]" />
            <span className="text-xs font-bold text-[#11310C]">Controle Ativo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            Meus <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#C4C240]">Devedores</span> & Empréstimos Concedidos
          </h1>
        </div>

        <button
          onClick={onOpenManualModal}
          className="liquid-button flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-[#11310C] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Dívida / Empréstimo</span>
        </button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Saldo Devedor Total */}
        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider block mb-2 flex items-center justify-between">
            <span>Saldo Devedor Total</span>
            <ArrowDownRight className="w-4 h-4 text-[#E13513]" />
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#E13513]">
            {formatCurrency(totalDebtsRemaining)}
          </div>
          <p className="text-[11px] text-[#11310C]/60 mt-2 font-medium">
            Parcela Mensal Total: {formatCurrency(totalMonthlyDebtPayments)}
          </p>
        </div>

        {/* Card 2: Valores a Receber de Devedores */}
        <div className="glass-card rounded-3xl p-5 border border-white/90 bg-gradient-to-br from-white via-white to-emerald-50/50">
          <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider block mb-2 flex items-center justify-between">
            <span>Empréstimos Concedidos (A Receber)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-700" />
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800">
            {formatCurrency(totalReceivableFromDebtors)}
          </div>
          <p className="text-[11px] text-[#11310C]/60 mt-2 font-medium">
            Sincronizado com devedores cadastrados
          </p>
        </div>

        {/* Card 3: Saldo Líquido de Dívidas */}
        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider block mb-2">
            Posição Líquida (Dívida - A Receber)
          </span>
          <div
            className={`text-2xl sm:text-3xl font-extrabold ${
              totalDebtsRemaining - totalReceivableFromDebtors > 0
                ? 'text-[#E13513]'
                : 'text-emerald-800'
            }`}
          >
            {formatCurrency(totalDebtsRemaining - totalReceivableFromDebtors)}
          </div>
          <p className="text-[11px] text-emerald-800 font-bold mt-2">
            Projeção de quitação total acelerada
          </p>
        </div>
      </div>

      {/* Main Grid: Dívidas Próprias vs Devedores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passivos: Dívidas Próprias */}
        <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#11310C]/10">
            <div>
              <h3 className="text-lg font-extrabold text-[#11310C]">
                Minhas <span className="font-serif italic font-bold text-xl text-[#E13513]">Dívidas</span> & Financiamentos
              </h3>
              <p className="text-xs text-[#11310C]/60">Contratos ativos para quitação</p>
            </div>
            <span className="text-xs font-extrabold text-[#11310C] bg-[#11310C]/5 px-2.5 py-1 rounded-full">
              {debts.length} contratos
            </span>
          </div>

          <div className="space-y-3">
            {debts.map((debt) => {
              const paidAmount = debt.totalAmount - debt.remainingAmount;
              const progressPercent = Math.round((paidAmount / debt.totalAmount) * 100);

              return (
                <div
                  key={debt.id}
                  className="p-4 rounded-2xl bg-white/90 border border-[#11310C]/10 space-y-2.5 shadow-xs hover:border-[#E13513]/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#11310C]">{debt.creditor}</h4>
                      <p className="text-xs text-[#11310C]/60 font-medium">
                        {debt.type} • Juros: {debt.interestRate}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#11310C]/50 uppercase block">
                        Saldo Restante
                      </span>
                      <span className="text-sm font-extrabold text-[#E13513]">
                        {formatCurrency(debt.remainingAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-[#11310C]/70">
                      <span>Progresso ({progressPercent}% pago)</span>
                      <span>Total: {formatCurrency(debt.totalAmount)}</span>
                    </div>
                    <div className="w-full bg-[#11310C]/10 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#11310C] h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-[#11310C]/10">
                    <span className="text-[#11310C]">
                      Parcela: <span className="font-extrabold">{formatCurrency(debt.monthlyPayment)}</span>
                    </span>
                    <span className="text-[#11310C]/70 text-[11px]">{debt.dueDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ativos: Empréstimos a Receber (Devedores) */}
        <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#11310C]/10">
            <div>
              <h3 className="text-lg font-extrabold text-[#11310C]">
                Empréstimos <span className="font-serif italic font-bold text-xl text-[#C4C240]">a Receber</span>
              </h3>
              <p className="text-xs text-[#11310C]/60">Pessoas e parceiros que lhe devem dinheiro</p>
            </div>
            <span className="text-xs font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-full">
              {debtors.length} devedores
            </span>
          </div>

          <div className="space-y-3">
            {debtors.map((debtor) => {
              const isOverdue = debtor.status === 'atrasado';
              const isPaid = debtor.status === 'pago';

              return (
                <div
                  key={debtor.id}
                  className="p-4 rounded-2xl bg-white/90 border border-[#11310C]/10 space-y-2 shadow-xs hover:border-[#C4C240] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#11310C]">{debtor.borrowerName}</h4>
                      <p className="text-xs text-[#11310C]/60 font-medium">{debtor.description}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#11310C]/50 uppercase block">
                        A Receber
                      </span>
                      <span className="text-sm font-extrabold text-emerald-800">
                        {formatCurrency(debtor.remainingAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-[#11310C]/10">
                    <span className="text-[#11310C]/70 text-[11px]">Vencimento: {debtor.dueDate}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : isOverdue
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isPaid ? 'Pago' : isOverdue ? 'Atrasado' : 'Em Dia'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

