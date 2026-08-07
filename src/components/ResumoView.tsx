import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Sparkles,
  Car,
  PlusCircle,
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { MonthSummaryData, SpreadsheetConnection, Investment, FinancialGoal } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ResumoViewProps {
  currentMonthData: MonthSummaryData;
  allMonthsData: Record<string, MonthSummaryData>;
  totalMoneySheet?: SpreadsheetConnection;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  monthsList: string[];
  investments?: Investment[];
  goals?: FinancialGoal[];
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
  goals = [],
}) => {
  const [includeAportes, setIncludeAportes] = useState<boolean>(false);

  // Live real-time investment total calculation
  const liveInvestmentsTotal =
    investments.length > 0
      ? investments.reduce((acc, item) => acc + item.currentValue, 0)
      : currentMonthData.totalInvestments;

  // Real-time consolidated total money
  const bankAccountsBalance = currentMonthData.totalMoney;
  const consolidatedTotalMoney = bankAccountsBalance + liveInvestmentsTotal;

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

  // Matching helper for goals and accounts
  const matchAccountName = (goalAccount?: string, colName?: string): boolean => {
    if (!goalAccount || !colName) return false;
    const g = goalAccount.trim().toLowerCase();
    const c = colName.trim().toLowerCase();
    if (g === c) return true;

    const gClean = g.replace(/\(\d+%\)/g, '').replace(/cofrinho/g, '').replace(/confrinho/g, '').trim();
    const cClean = c.replace(/\(\d+%\)/g, '').replace(/cofrinho/g, '').replace(/confrinho/g, '').trim();

    if (gClean && cClean && (gClean === cClean || cClean.includes(gClean) || gClean.includes(cClean))) {
      return true;
    }
    return false;
  };

  const PORTUGUESE_MONTH_MAP: Record<string, number> = {
    janeiro: 1, jan: 1,
    fevereiro: 2, fev: 2,
    marco: 3, março: 3, mar: 3,
    abril: 4, abr: 4,
    maio: 5, mai: 5,
    junho: 6, jun: 6,
    julho: 7, jul: 7,
    agosto: 8, ago: 8,
    setembro: 9, set: 9,
    outubro: 10, out: 10,
    novembro: 11, nov: 11,
    dezembro: 12, dez: 12,
  };

  const parseYearMonthFromLabel = (label?: string, fallbackDate?: string): { year: number; month: number } | null => {
    if (label) {
      const tokens = label.toLowerCase().split(/\s+/);
      let month = 0;
      let year = 0;
      for (const token of tokens) {
        if (PORTUGUESE_MONTH_MAP[token]) {
          month = PORTUGUESE_MONTH_MAP[token];
        } else if (/^\d{4}$/.test(token)) {
          year = parseInt(token, 10);
        }
      }
      if (month > 0 && year > 0) return { year, month };
    }

    if (fallbackDate && fallbackDate.includes('/')) {
      const parts = fallbackDate.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (!isNaN(month) && !isNaN(year)) return { year, month };
      }
    }

    return null;
  };

  const parseGoalDeadlineYearMonth = (goal: FinancialGoal): { year: number; month: number } | null => {
    const dateStr = goal.deadline || goal.targetDate;
    if (!dateStr) return null;

    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        if (!isNaN(year) && !isNaN(month)) return { year, month };
      }
    }

    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 2) {
        const month = parseInt(parts[0], 10);
        const year = parseInt(parts[1], 10);
        if (!isNaN(year) && !isNaN(month)) return { year, month };
      } else if (parts.length === 3) {
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month)) return { year, month };
      }
    }

    return null;
  };

  const isGoalActiveInMonth = (goal: FinancialGoal, rowYM: { year: number; month: number } | null): boolean => {
    if (!rowYM) return true;
    const goalYM = parseGoalDeadlineYearMonth(goal);
    if (!goalYM) return true;

    const rowVal = rowYM.year * 12 + rowYM.month;
    const goalVal = goalYM.year * 12 + goalYM.month;

    return rowVal <= goalVal;
  };

  // Total monthly contribution across all goals
  const activeTotalAporteMonthly = goals.reduce((acc, g) => acc + (g.monthlyContribution || 0), 0);

  // Compute effective table rows (applying compounding + monthly aportes when toggle is active)
  const effectiveTableRows = useMemo(() => {
    if (!includeAportes) return tableRows;

    const firstProjIndex = tableRows.findIndex((r) => r.isProjected);
    if (firstProjIndex <= 0) return tableRows;

    const newRows = tableRows.map((r) => ({ ...r, balances: { ...r.balances } }));
    let runningBalances = { ...newRows[firstProjIndex - 1].balances };

    for (let i = firstProjIndex; i < newRows.length; i++) {
      const row = newRows[i];
      const rowYM = parseYearMonthFromLabel(row.monthLabel, row.date);

      // Filter goals that are still active in this month
      const activeGoalsInMonth = goals.filter((g) => isGoalActiveInMonth(g, rowYM));

      // Find goals that don't specify a target account or don't match any column
      const unassignedAportes = activeGoalsInMonth
        .filter((g) => !g.targetAccount || !accountCols.some((col) => matchAccountName(g.targetAccount, col.name)))
        .reduce((sum, g) => sum + (g.monthlyContribution || 0), 0);

      const perColUnassigned = accountCols.length > 0 ? unassignedAportes / accountCols.length : 0;

      const newBalances: Record<string, number> = {};
      let newTotal = 0;

      for (const col of accountCols) {
        const prevVal = runningBalances[col.name] ?? 0;
        const ratePct = col.ratePct ?? 0;
        const cdiMonthly = ratePct > 0 ? 0.0085 * (ratePct / 100) : 0;
        const yielded = prevVal * (1 + cdiMonthly);

        const colAportes = activeGoalsInMonth
          .filter((g) => matchAccountName(g.targetAccount, col.name))
          .reduce((sum, g) => sum + (g.monthlyContribution || 0), 0);

        const finalVal = yielded + colAportes + perColUnassigned;

        newBalances[col.name] = finalVal;
        newTotal += finalVal;
      }

      runningBalances = newBalances;
      newRows[i] = {
        ...row,
        balances: newBalances,
        total: newTotal,
      };
    }

    return newRows;
  }, [tableRows, includeAportes, goals, accountCols]);

  // Monthly total money chart data synced with effectiveTableRows
  const monthlyTotalsChart = Object.keys(allMonthsData).map((mKey) => {
    const item = allMonthsData[mKey];
    const isProj = mKey.toLowerCase().includes('setembro') || mKey.toLowerCase().includes('outubro') || mKey.toLowerCase().includes('novembro') || mKey.toLowerCase().includes('dezembro') || mKey.includes('2027');

    const matchingTableRow = effectiveTableRows.find(
      (tr) => tr.monthLabel.toLowerCase() === mKey.toLowerCase()
    );

    const displayTotal = matchingTableRow ? matchingTableRow.total : item.totalMoney;

    return {
      monthKey: mKey,
      month: mKey.split(' ')[0],
      totalMoney: displayTotal,
      growth: item.monthlyGrowthPercent,
      isPositive: item.monthlyGrowthPercent >= 0,
      isProjected: isProj,
      income: item.totalIncome,
      expenses: item.totalExpenses,
      leftover: item.leftover,
    };
  });

  const finalProjectedTotal = effectiveTableRows[effectiveTableRows.length - 1]?.total || consolidatedTotalMoney;

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
        <CustomSelect
          value={selectedMonth}
          onChange={onSelectMonth}
          options={monthsList}
          icon={<Calendar className="w-4 h-4 text-[#C4C240]" />}
          labelPrefix="Mês do Resumo:"
          alignRight
        />
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
              Saldos reais das contas bancárias e simulação de crescimento em tempo real com acúmulo de juros compostos.
            </p>
          </div>
          
          {/* Toggle Switch: Rendimento vs Com Aporte */}
          <div className="flex items-center p-1 rounded-2xl bg-[#11310C] text-[#FAFBF6] border border-[#11310C]/20 shadow-xs">
            <button
              type="button"
              onClick={() => setIncludeAportes(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                !includeAportes
                  ? 'bg-[#C4C240] text-[#11310C] shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Apenas Rendimento
            </button>
            <button
              type="button"
              onClick={() => setIncludeAportes(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                includeAportes
                  ? 'bg-[#C4C240] text-[#11310C] shadow-xs'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Com Aporte (+ Metas)
            </button>
          </div>
        </div>

        {/* Banner Explaining Current Projection Mode */}
        {includeAportes ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#C4C240]/20 border border-[#C4C240]/50 text-xs text-[#11310C] animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#11310C] text-[#C4C240]">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <p className="font-extrabold text-xs">
                  Modo Com Aporte Ativo: Rendimento CDI + Depósitos de Metas
                </p>
                <p className="text-[11px] text-[#11310C]/80 font-medium">
                  Injetando <strong>+{formatCurrency(activeTotalAporteMonthly)}/mês</strong> em aportes recorrentes de {goals.length} metas diretamente nas projeções.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#11310C]/60 block">Patrimônio Projetado no Final</span>
              <span className="text-sm font-black text-[#11310C]">{formatCurrency(finalProjectedTotal)}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-[#11310C]/5 border border-[#11310C]/10 text-xs text-[#11310C]">
            <span className="inline-flex items-center gap-1 font-extrabold px-2.5 py-1 rounded-xl bg-[#11310C] text-[#C4C240] text-[11px] shadow-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              Juros Compostos Ativos
            </span>
            <span className="font-semibold text-[#11310C]/80 text-[11px]">
              As previsões aplicam acúmulo exponencial mês a mês: <strong>M(t) = M(t-1) × (1 + R)</strong> com base na rentabilidade individual (+102% CDI, +120% CDI, +121% CDI).
            </span>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-[#11310C]/10 bg-white/80">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#11310C] text-[#FAFBF6] font-bold">
                <th className="p-3 sticky left-0 bg-[#11310C] z-10 border-b border-white/10 text-center">Mês</th>
                <th className="p-3 border-b border-white/10 text-center">Tipo</th>
                {accountCols.map((col) => (
                  <th key={col.name} className="p-2 border-b border-white/10 text-center">
                    {/* Compact Brand Logo / Badge Column Header */}
                    <div className="flex flex-col items-center justify-center">
                      {(() => {
                        const lower = col.name.toLowerCase();
                        const ratePct = col.ratePct;
                        const isVariable = lower.includes('variavel') || lower.includes('vari)avel');
                        const subText = ratePct > 0 ? `+${ratePct}% CDI` : isVariable ? 'variável' : '0% CDI';

                        if (lower.includes('nu') || lower.includes('nubank')) {
                          let suffix = 'PF';
                          let isPiggy = lower.includes('cofrinho');
                          let isInv = lower.includes('investimento');
                          if (lower.includes('pj')) suffix = 'PJ';

                          return (
                            <div className="flex flex-col items-center justify-center p-0.5">
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#820AD1] text-white font-black text-xs shadow-xs tracking-tight">
                                <span className="font-serif italic text-sm font-extrabold">nu</span>
                                <span className="text-[10px] font-bold opacity-90">
                                  {isPiggy ? '🐷' : isInv ? '📈' : suffix}
                                </span>
                              </div>
                              <span className={`text-[10px] font-extrabold mt-1 whitespace-nowrap ${ratePct > 0 ? 'text-[#C4C240]' : isVariable ? 'text-sky-300' : 'text-white/60'}`}>
                                {subText}
                              </span>
                            </div>
                          );
                        }

                        if (lower.includes('picpay')) {
                          let suffix = 'PF';
                          let isPiggy = lower.includes('cofrinho') || lower.includes('confrinho');
                          if (lower.includes('pj')) suffix = 'PJ';

                          return (
                            <div className="flex flex-col items-center justify-center p-0.5">
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#11C76F] text-white font-black text-xs shadow-xs tracking-tight">
                                <span className="font-sans font-black text-xs">P</span>
                                <span className="text-[10px] font-bold opacity-90">
                                  {isPiggy ? '🐷 PJ' : suffix}
                                </span>
                              </div>
                              <span className={`text-[10px] font-extrabold mt-1 whitespace-nowrap ${ratePct > 0 ? 'text-[#C4C240]' : 'text-white/60'}`}>
                                {subText}
                              </span>
                            </div>
                          );
                        }

                        if (lower.includes('mercado') || lower.includes('mp')) {
                          let isPiggy = lower.includes('cofrinho');

                          return (
                            <div className="flex flex-col items-center justify-center p-0.5">
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#009EE3] text-white font-black text-xs shadow-xs tracking-tight">
                                <span className="font-sans font-black text-xs">MP</span>
                                <span className="text-[10px] font-bold opacity-90">
                                  {isPiggy ? '🐷' : ''}
                                </span>
                              </div>
                              <span className={`text-[10px] font-extrabold mt-1 whitespace-nowrap ${ratePct > 0 ? 'text-[#C4C240]' : 'text-white/60'}`}>
                                {subText}
                              </span>
                            </div>
                          );
                        }

                        if (lower.includes('carro')) {
                          return (
                            <div className="flex flex-col items-center justify-center p-0.5">
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800 text-amber-300 font-black text-xs shadow-xs tracking-tight">
                                <Car className="w-3.5 h-3.5 text-amber-300" />
                                <span className="text-[10px] font-extrabold">Carro</span>
                              </div>
                              <span className="text-[10px] font-extrabold text-white/60 mt-1 whitespace-nowrap">
                                {subText}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-col items-center justify-center p-0.5">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#11310C] text-[#C4C240] font-black text-xs shadow-xs">
                              {col.name.split(' ')[0]}
                            </div>
                            <span className={`text-[10px] font-extrabold mt-1 whitespace-nowrap ${ratePct > 0 ? 'text-[#C4C240]' : 'text-white/60'}`}>
                              {subText}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </th>
                ))}
                <th className="p-3 border-b border-white/10 text-right font-black text-[#C4C240] whitespace-nowrap">
                  Total Geral
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#11310C]/10 font-medium text-[#11310C]">
              {effectiveTableRows.map((row) => {
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
