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
import { MonthSummaryData, SpreadsheetConnection, Investment } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface ResumoViewProps {
  currentMonthData: MonthSummaryData;
  allMonthsData: Record<string, MonthSummaryData>;
  totalMoneySheet?: SpreadsheetConnection;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  monthsList: string[];
  investments?: Investment[];
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const val = payload[0].value;
    return (
      <div className="bg-[#11310C] border border-[#C4C240] px-4 py-3 rounded-2xl shadow-2xl text-[#FAFBF6] space-y-1 z-50">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-[#C4C240]">{label}</p>
          {data.isProjected && (
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              Previsão CDI
            </span>
          )}
        </div>
        <p className="text-xs font-extrabold text-white">
          Dinheiro Total : <span className="text-[#C4C240] font-black">{formatCurrency(Number(val))}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const ResumoView: React.FC<ResumoViewProps> = ({
  currentMonthData,
  allMonthsData,
  totalMoneySheet,
  selectedMonth,
  onSelectMonth,
  monthsList,
  investments = [],
}) => {
  // Live real-time investment total calculation
  const liveInvestmentsTotal =
    investments.length > 0
      ? investments.reduce((acc, item) => acc + item.currentValue, 0)
      : currentMonthData.totalInvestments;

  // Real-time consolidated total money
  const bankAccountsBalance = currentMonthData.totalMoney;
  const consolidatedTotalMoney = bankAccountsBalance + liveInvestmentsTotal;

  // Monthly total money chart data
  const monthlyTotalsChart = Object.keys(allMonthsData).map((mKey) => {
    const item = allMonthsData[mKey];
    const isProj = mKey.toLowerCase().includes('setembro') || mKey.toLowerCase().includes('outubro') || mKey.toLowerCase().includes('novembro') || mKey.toLowerCase().includes('dezembro') || mKey.includes('2027');

    return {
      monthKey: mKey,
      month: mKey.split(' ')[0],
      totalMoney: item.totalMoney,
      growth: item.monthlyGrowthPercent,
      isPositive: item.monthlyGrowthPercent >= 0,
      isProjected: isProj,
      income: item.totalIncome,
      expenses: item.totalExpenses,
      leftover: item.leftover,
    };
  });

  // Extract accounts matrix details if present or default list of columns
  const accountCols = currentMonthData.accountColumnsMeta && currentMonthData.accountColumnsMeta.length > 0
    ? currentMonthData.accountColumnsMeta
    : [
        { name: 'conta pj nubank (0%)', ratePct: 0 },
        { name: 'cofrinho pj nu (100%)', ratePct: 100 },
        { name: 'conta pf nu (0%)', ratePct: 0 },
        { name: 'investimento nu (variavel)', ratePct: 0 },
        { name: 'picpay pf (121%)', ratePct: 121 },
        { name: 'picpay pj (0%)', ratePct: 0 },
        { name: 'confrinho picpay pj (102%)', ratePct: 102 },
        { name: 'carro (0%)', ratePct: 0 },
        { name: 'mercado pago (105%)', ratePct: 105 },
        { name: 'cofrinho mercado pago (120%)', ratePct: 120 },
      ];

  const tableRows = currentMonthData.accountDetailsRows && currentMonthData.accountDetailsRows.length > 0
    ? currentMonthData.accountDetailsRows
    : Object.keys(allMonthsData).map((mKey) => {
        const item = allMonthsData[mKey];
        const isProj = mKey.toLowerCase().includes('setembro') || mKey.toLowerCase().includes('outubro') || mKey.toLowerCase().includes('novembro') || mKey.toLowerCase().includes('dezembro') || mKey.includes('2027');
        return {
          date: '01/01/2026',
          monthLabel: mKey,
          balances: item.accountBalances || {},
          total: item.totalMoney,
          isProjected: isProj,
        };
      });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card rounded-3xl p-6 border border-white/90">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            Total do <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#C4C240]">Dinheiro</span> do Mês
          </h1>
          <p className="text-xs text-[#11310C]/70 mt-1">
            Sua planilha de caixa central consolida o patrimônio total, saldos de contas e previsão de rendimentos.
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

      {/* Main Metric Spotlight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Saldo Total das Contas */}
        <div className="glass-card rounded-3xl p-6 border border-white/90 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-[#11310C]/60 uppercase tracking-wider block mb-1">
              Saldo das Contas Bancárias
            </span>
            <div className="text-3xl font-extrabold text-[#11310C]">
              {formatCurrency(bankAccountsBalance)}
            </div>
            <p className="text-xs text-[#11310C]/70 mt-1 font-medium">
              Soma total dos saldos nas contas bancárias ({selectedMonth})
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#11310C]/5 border border-[#11310C]/10 flex items-center justify-between text-xs font-bold">
            <span className="text-[#11310C]">Status de Caixa:</span>
            <span className="text-emerald-800 font-extrabold">Positivo</span>
          </div>
        </div>

        {/* Card 2: Valor Total de Investimentos */}
        <div className="glass-card rounded-3xl p-6 border border-white/90 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-[#11310C]/60 uppercase tracking-wider block mb-1">
              Soma dos Investimentos
            </span>
            <div className="text-3xl font-extrabold text-[#11310C]">
              {formatCurrency(liveInvestmentsTotal)}
            </div>
            <p className="text-xs text-[#11310C]/70 mt-1 font-medium">
              Calculado em tempo real somando cada ativo da carteira
            </p>
          </div>
          <div className="w-full bg-[#11310C]/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#C4C240] h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  consolidatedTotalMoney > 0 ? (liveInvestmentsTotal / consolidatedTotalMoney) * 100 : 50
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Card 3: Total do Dinheiro Consolidado */}
        <div className="glass-dark-card rounded-3xl p-6 text-[#FAFBF6] space-y-3 relative overflow-hidden glaze-shine flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#C4C240]">
                Dinheiro Total Consolidado
              </span>
              <Sparkles className="w-5 h-5 text-[#C4C240]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
              {formatCurrency(consolidatedTotalMoney)}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
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
            <span className="text-xs text-[#FAFBF6]/70">Contas + Investimentos ({selectedMonth})</span>
          </div>
        </div>
      </div>

      {/* Monthly Total Money Growth Chart */}
      <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#11310C]/10">
          <div>
            <h3 className="text-lg font-extrabold text-[#11310C]">
              Gráfico Mensal do <span className="font-serif italic font-bold text-xl text-[#C4C240]">Dinheiro Total</span> (Histórico & Previsão)
            </h3>
            <p className="text-xs text-[#11310C]/60">
              Acompanhe a evolução do seu dinheiro total com os valores reais da planilha e as projeções de rendimento CDI
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-[#11310C]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#11310C]" /> Lançamento Real
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#C4C240]" /> Previsão Rendimentos
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTotalsChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#11310C" strokeOpacity={0.08} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#11310C', fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#11310C' }} tickFormatter={(v) => `R$${v/1000}k`} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="totalMoney" radius={[12, 12, 0, 0]}>
                {monthlyTotalsChart.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isProjected ? '#C4C240' : entry.isPositive ? '#11310C' : '#E13513'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Accounts & Yield Prediction Table */}
      <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#11310C]/10">
          <div>
            <h3 className="text-lg font-extrabold text-[#11310C]">
              Tabela de <span className="font-serif italic font-bold text-xl text-[#C4C240]">Contas & Previsão</span> de Rendimentos
            </h3>
            <p className="text-xs text-[#11310C]/60">
              Detalhamento de cada conta bancária por mês e projeção de crescimento com base na rentabilidade CDI da conta.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#11310C]/10 text-[#11310C]">
            <FileSpreadsheet className="w-4 h-4 text-[#C4C240]" />
            Planilha Resumo Total
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#11310C]/10 bg-white/80">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#11310C] text-[#FAFBF6] font-bold">
                <th className="p-3 sticky left-0 bg-[#11310C] z-10 border-b border-white/10">Mês</th>
                <th className="p-3 border-b border-white/10 text-center">Tipo</th>
                {accountCols.map((col) => (
                  <th key={col.name} className="p-3 border-b border-white/10 text-right whitespace-nowrap">
                    <div>{col.name}</div>
                    {col.ratePct > 0 && (
                      <span className="text-[9px] font-normal text-[#C4C240] block">
                        +{col.ratePct}% CDI
                      </span>
                    )}
                  </th>
                ))}
                <th className="p-3 border-b border-white/10 text-right font-black text-[#C4C240] whitespace-nowrap">
                  Total Geral
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#11310C]/10 font-medium text-[#11310C]">
              {tableRows.map((row) => {
                const isSelected = row.monthLabel === selectedMonth;

                return (
                  <tr
                    key={row.monthLabel}
                    onClick={() => onSelectMonth(row.monthLabel)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#C4C240]/25 font-bold'
                        : row.isProjected
                        ? 'bg-amber-50/40 hover:bg-amber-100/40'
                        : 'hover:bg-[#11310C]/5'
                    }`}
                  >
                    <td className="p-3 font-extrabold sticky left-0 bg-white/95 shadow-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {row.monthLabel}
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#11310C]" />}
                      </div>
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      {row.isProjected ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          Previsão CDI
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Real / Planilha
                        </span>
                      )}
                    </td>

                    {accountCols.map((col) => {
                      const val = row.balances ? row.balances[col.name] || 0 : 0;
                      return (
                        <td key={col.name} className="p-3 text-right whitespace-nowrap">
                          {formatCurrency(val)}
                        </td>
                      );
                    })}

                    <td className="p-3 text-right font-black text-[#11310C] whitespace-nowrap bg-[#11310C]/5">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
