import React from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { MonthSummaryData, SpreadsheetConnection } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface ResumoViewProps {
  currentMonthData: MonthSummaryData;
  allMonthsData: Record<string, MonthSummaryData>;
  totalMoneySheet?: SpreadsheetConnection;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  monthsList: string[];
}

export const ResumoView: React.FC<ResumoViewProps> = ({
  currentMonthData,
  allMonthsData,
  totalMoneySheet,
  selectedMonth,
  onSelectMonth,
  monthsList,
}) => {
  // Monthly total money chart data
  const monthlyTotalsChart = Object.keys(allMonthsData).map((mKey) => {
    const item = allMonthsData[mKey];
    return {
      month: mKey.split(' ')[0],
      totalMoney: item.totalMoney,
      growth: item.monthlyGrowthPercent,
      isPositive: item.monthlyGrowthPercent >= 0,
      income: item.totalIncome,
      expenses: item.totalExpenses,
      leftover: item.leftover,
    };
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card rounded-3xl p-6 border border-white/90">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#11310C]/60">
              Aba de Resumo Patrimonial
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4C240]" />
            <span className="text-xs font-bold text-[#11310C]">Planilha Principal Integrada</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            Total do <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#C4C240]">Dinheiro</span> do Mês
          </h1>
          <p className="text-xs text-[#11310C]/70 mt-1">
            Sua planilha de caixa central consolida o patrimônio total e variação líquida.
          </p>
        </div>

        {/* Month Dropdown */}
        <div className="flex items-center gap-2 bg-white/90 p-2 rounded-2xl border border-[#11310C]/15 shadow-xs">
          <Calendar className="w-4 h-4 text-[#C4C240]" />
          <span className="text-xs font-bold text-[#11310C]/70">Mês do Resumo:</span>
          <select
            value={selectedMonth}
            onChange={(e) => onSelectMonth(e.target.value)}
            className="bg-transparent font-extrabold text-xs text-[#11310C] focus:outline-none cursor-pointer"
          >
            {monthsList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Connected Spreadsheet Spotlight Card */}
      <div className="glass-card rounded-3xl p-6 border border-[#C4C240]/40 bg-gradient-to-r from-white via-white to-[#F7F9E3]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#11310C] flex items-center justify-center text-[#C4C240] shadow-md shadow-[#11310C]/15">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#11310C]">
                {totalMoneySheet?.fileName || 'Strato_Balanco_Patrimonial_2026.xlsx'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> Conectado
              </span>
            </div>
            <p className="text-xs text-[#11310C]/70 mt-0.5">
              Planilha vinculada responsável pelo cálculo do Total de Dinheiro de {selectedMonth}.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#11310C]/60 block">
            Última Sincronização
          </span>
          <span className="text-xs font-extrabold text-[#11310C]">
            {totalMoneySheet?.lastSync || 'Hoje, 07:40'}
          </span>
        </div>
      </div>

      {/* Main Metric Spotlight: Total Money This Month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Money Card (Prominent) */}
        <div className="glass-dark-card rounded-3xl p-6 text-[#FAFBF6] space-y-3 relative overflow-hidden glaze-shine">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#C4C240]">
              Dinheiro Total deste Mês
            </span>
            <Sparkles className="w-5 h-5 text-[#C4C240]" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {formatCurrency(currentMonthData.totalMoney)}
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                currentMonthData.monthlyGrowthPercent >= 0
                  ? 'bg-[#C4C240] text-[#11310C]'
                  : 'bg-[#E13513] text-white'
              }`}
            >
              {currentMonthData.monthlyGrowthPercent >= 0 ? '+' : ''}
              {currentMonthData.monthlyGrowthPercent}%
            </span>
            <span className="text-xs text-[#FAFBF6]/70">Variação acumulada no mês</span>
          </div>
        </div>

        {/* Breakdown Card: Total Income vs Total Expense */}
        <div className="glass-card rounded-3xl p-6 border border-white/90 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-[#11310C]/60 uppercase tracking-wider">
              Entradas vs Saídas de {selectedMonth}
            </span>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-[11px] font-semibold text-[#11310C]/60">Ganhos do Mês</p>
                <p className="text-lg font-extrabold text-[#11310C]">
                  {formatCurrency(currentMonthData.totalIncome)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-[#11310C]/60">Gastos do Mês</p>
                <p className="text-lg font-extrabold text-[#E13513]">
                  {formatCurrency(currentMonthData.totalExpenses)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#11310C]/5 border border-[#11310C]/10 flex items-center justify-between text-xs font-bold">
            <span className="text-[#11310C]">Sobra Líquida Gravada na Planilha:</span>
            <span className="text-[#11310C] font-extrabold">
              {formatCurrency(currentMonthData.leftover)}
            </span>
          </div>
        </div>

        {/* Invested Wealth Portion */}
        <div className="glass-card rounded-3xl p-6 border border-white/90 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-[#11310C]/60 uppercase tracking-wider">
              Reserva & Investimentos Acumulados
            </span>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-[#11310C]">
                {formatCurrency(currentMonthData.totalInvestments)}
              </p>
              <p className="text-xs text-[#11310C]/70 mt-1 font-medium">
                Corresponde a {((currentMonthData.totalInvestments / currentMonthData.totalMoney) * 100).toFixed(1)}% do seu dinheiro total.
              </p>
            </div>
          </div>

          <div className="w-full bg-[#11310C]/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#C4C240] h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  (currentMonthData.totalInvestments / currentMonthData.totalMoney) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Total Money Growth Chart (Up and Down) */}
      <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#11310C]/10">
          <div>
            <h3 className="text-lg font-extrabold text-[#11310C]">
              Gráfico Mensal do <span className="font-serif italic font-bold text-xl text-[#C4C240]">Dinheiro Total</span> (Subidas & Descidas)
            </h3>
            <p className="text-xs text-[#11310C]/60">
              Acompanhe a oscilação do seu patrimônio total e variação mensal gravada nas planilhas
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-[#11310C]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#11310C]" /> Mês com Alta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#E13513]" /> Mês com Queda / Gasto Extra
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTotalsChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#11310C" strokeOpacity={0.08} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#11310C', fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#11310C' }} tickFormatter={(v) => `R$${v/1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#11310C',
                  borderColor: '#C4C240',
                  borderRadius: '16px',
                  color: '#FAFBF6',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
                formatter={(val: any) => [formatCurrency(Number(val)), 'Dinheiro Total']}
              />
              <Bar dataKey="totalMoney" radius={[12, 12, 0, 0]}>
                {monthlyTotalsChart.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isPositive ? '#11310C' : '#E13513'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
