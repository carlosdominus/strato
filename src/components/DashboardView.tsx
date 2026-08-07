import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Sparkles,
  CreditCard,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Edit3,
  X,
  Sliders,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { MonthSummaryData, Transaction, CreditCardSheet, AIRecommendation } from '../types';
import { formatCurrency, formatPercent, formatDateBR } from '../utils/formatters';
import { getTransactionAllocatedMonthLabel } from '../utils/sheetParser';

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#11310C] border border-[#C4C240] p-3 rounded-2xl shadow-xl text-[#FAFBF6] space-y-1 z-50">
        <p className="text-xs font-bold text-[#C4C240]">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs font-semibold text-white flex items-center justify-between gap-3">
            <span>{entry.name}:</span>
            <span className="font-extrabold text-[#C4C240]">{formatCurrency(Number(entry.value))}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface DashboardViewProps {
  currentMonthData: MonthSummaryData;
  allMonthsData: Record<string, MonthSummaryData>;
  recentTransactions: Transaction[];
  creditCards: CreditCardSheet[];
  selectedMonth: string;
  onNavigateToTab: (tabId: string) => void;
  onOpenManualModal: () => void;
  onUpdateMonthData?: (monthKey: string, updated: Partial<MonthSummaryData>) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentMonthData,
  allMonthsData,
  recentTransactions,
  creditCards,
  selectedMonth,
  onNavigateToTab,
  onOpenManualModal,
  onUpdateMonthData,
}) => {
  const [timeRange, setTimeRange] = useState<'este-mes' | 'semana' | '3-meses' | 'ano' | 'personalizado'>('este-mes');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({ start: '2026-08-01', end: '2026-08-31' });
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Quick edit form state
  const [editIncome, setEditIncome] = useState(currentMonthData.totalIncome);
  const [editExpenses, setEditExpenses] = useState(currentMonthData.totalExpenses);
  const [editInvestments, setEditInvestments] = useState(currentMonthData.totalInvestments);

  useEffect(() => {
    setEditIncome(currentMonthData.totalIncome);
    setEditExpenses(currentMonthData.totalExpenses);
    setEditInvestments(currentMonthData.totalInvestments);
  }, [currentMonthData]);

  const handleSaveAdjustments = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateMonthData) {
      onUpdateMonthData(selectedMonth, {
        totalIncome: Number(editIncome) || 0,
        totalExpenses: Number(editExpenses) || 0,
        totalInvestments: Number(editInvestments) || 0,
      });
    }
    setIsAdjustModalOpen(false);
  };

  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Fetch AI Recommendations from server route
  const fetchAiInsights = async () => {
    setIsLoadingAi(true);
    try {
      const response = await fetch('/api/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          totalIncome: currentMonthData.totalIncome,
          totalExpenses: currentMonthData.totalExpenses,
          totalInvestments: currentMonthData.totalInvestments,
          totalDebts: currentMonthData.totalDebts,
          activeSubscriptions: currentMonthData.activeSubscriptionsCount,
          leftover: currentMonthData.leftover,
        }),
      });
      const data = await response.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setAiRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Failed to load AI insights:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchAiInsights();
  }, [selectedMonth, currentMonthData.totalIncome, currentMonthData.totalExpenses]);

  // Filter out future projected months from the main dashboard
  const realMonthsKeys = Object.keys(allMonthsData).filter((m) => {
    const item = allMonthsData[m];
    if (item.isProjected) return false;
    // Extra guard: exclude future projected months if flag isn't set
    const lower = m.toLowerCase();
    if (lower.includes('2027') || lower.includes('setembro 2026') || lower.includes('outubro 2026') || lower.includes('novembro 2026') || lower.includes('dezembro 2026')) {
      return false;
    }
    return true;
  });

  // Transform monthly data for chart (Only real recorded months up to present)
  const chartData = realMonthsKeys.map((m) => {
    const item = allMonthsData[m];
    return {
      name: m.split(' ')[0], // "Maio", "Junho", "Julho", "Agosto"
      Patrimonio: item.totalMoney,
      Renda: item.totalIncome,
      Gastos: item.totalExpenses,
      Sobra: item.leftover,
    };
  });

  // Date parsing helper for DD/MM/YYYY or YYYY-MM-DD
  const parseDateMs = (dateStr: string): number => {
    if (!dateStr) return 0;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day).getTime();
      }
    }
    if (dateStr.includes('-')) {
      return new Date(dateStr).getTime();
    }
    return 0;
  };

  // Filter and sort transactions for the selected month according to Golden Rule month allocation
  const monthTransactions = recentTransactions.filter(
    (tx) => getTransactionAllocatedMonthLabel(tx) === selectedMonth
  );

  const sortedTransactions = [...monthTransactions].sort(
    (a, b) => parseDateMs(b.date) - parseDateMs(a.date)
  );

  // Group installment transactions so multi-installment purchases (e.g. Galaxy Tab 1/12 .. 12/12) appear as 1 grouped item with the first installment date
  const groupedTransactions = React.useMemo(() => {
    const map = new Map<string, Transaction & { minDateMs: number }>();
    const singles: Transaction[] = [];

    for (const tx of sortedTransactions) {
      const desc = (tx.description || '').trim();
      const match = desc.match(/^(.*?)\s*\(?(\d+)\/(\d+)\)?$/i);
      if (match) {
        const baseTitle = match[1].trim();
        const totalInst = parseInt(match[3], 10);
        const key = `${baseTitle.toLowerCase()}-${tx.type}-${tx.account || ''}`;
        const txMs = parseDateMs(tx.date);

        if (!map.has(key)) {
          map.set(key, {
            ...tx,
            id: `grouped-${key}`,
            description: `${baseTitle} (${totalInst}x de R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
            minDateMs: txMs,
          });
        } else {
          const existing = map.get(key)!;
          if (txMs < existing.minDateMs) {
            existing.minDateMs = txMs;
            existing.date = tx.date; // Use date of first installment!
          }
        }
      } else {
        singles.push(tx);
      }
    }

    const merged = [...singles, ...Array.from(map.values()).map(({ minDateMs, ...rest }) => rest)];
    return merged.sort((a, b) => parseDateMs(b.date) - parseDateMs(a.date));
  }, [sortedTransactions]);

  // Dynamic values calculated based on timeRange filter
  let displayIncome = currentMonthData.totalIncome;
  let displayExpenses = currentMonthData.totalExpenses;
  let displayLeftover = currentMonthData.leftover;
  let periodLabel = 'do Mês';

  if (timeRange === 'semana') {
    periodLabel = 'na Semana';
    const latestMs = sortedTransactions.length > 0 ? parseDateMs(sortedTransactions[0].date) : Date.now();
    const sevenDaysAgoMs = latestMs - (7 * 24 * 60 * 60 * 1000);
    const weekTxs = sortedTransactions.filter(tx => {
      const ms = parseDateMs(tx.date);
      return ms >= sevenDaysAgoMs && ms <= latestMs;
    });
    displayIncome = weekTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    displayExpenses = weekTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    displayLeftover = displayIncome - displayExpenses;
  } else if (timeRange === '3-meses') {
    periodLabel = 'nos 3 Mêses';
    const monthList = realMonthsKeys.slice(-3).map(k => allMonthsData[k]);
    displayIncome = monthList.reduce((sum: number, m) => sum + ((m as MonthSummaryData).totalIncome || 0), 0);
    displayExpenses = monthList.reduce((sum: number, m) => sum + ((m as MonthSummaryData).totalExpenses || 0), 0);
    displayLeftover = displayIncome - displayExpenses;
  } else if (timeRange === 'ano') {
    periodLabel = 'no Ano';
    const monthList = realMonthsKeys.map(k => allMonthsData[k]);
    displayIncome = monthList.reduce((sum: number, m) => sum + ((m as MonthSummaryData).totalIncome || 0), 0);
    displayExpenses = monthList.reduce((sum: number, m) => sum + ((m as MonthSummaryData).totalExpenses || 0), 0);
    displayLeftover = displayIncome - displayExpenses;
  } else if (timeRange === 'personalizado') {
    periodLabel = 'no Período';
    const startMs = new Date(customRange.start).getTime();
    const endMs = new Date(customRange.end).getTime() + 86400000;
    const customTxs = sortedTransactions.filter(tx => {
      const ms = parseDateMs(tx.date);
      return ms >= startMs && ms <= endMs;
    });
    displayIncome = customTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    displayExpenses = customTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    displayLeftover = displayIncome - displayExpenses;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 space-y-6 pb-12">
      {/* Abacaxi Pay Inspired Welcome & Range Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card rounded-3xl p-6 border border-white/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11310C] tracking-tight">
            Controle <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#C4C240]">Financeiro</span> de Alta Precisão
          </h1>
        </div>

        {/* Action Controls & Range Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Range Chips Pill Container */}
          <div className="inline-flex items-center gap-1 p-1 bg-[#11310C]/5 rounded-2xl border border-[#11310C]/10 max-w-full flex-wrap sm:flex-nowrap">
            {[
              { id: 'este-mes', label: 'Este Mês' },
              { id: 'semana', label: 'Essa Semana' },
              { id: '3-meses', label: 'Últimos 3 Mêses' },
              { id: 'ano', label: 'Anual' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setTimeRange(chip.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  timeRange === chip.id
                    ? 'bg-[#11310C] text-[#FAFBF6] shadow-xs'
                    : 'text-[#11310C]/80 hover:text-[#11310C]'
                }`}
              >
                {chip.label}
              </button>
            ))}

            {/* Calendar Icon Button Right Next to Anual */}
            <button
              onClick={() => {
                setTimeRange('personalizado');
                setIsCalendarModalOpen(true);
              }}
              title="Personalizar Período no Calendário"
              className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                timeRange === 'personalizado'
                  ? 'bg-[#11310C] text-[#C4C240] shadow-xs'
                  : 'text-[#11310C]/70 hover:text-[#11310C] hover:bg-white/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#11310C]" />
              <span className="hidden sm:inline">
                {timeRange === 'personalizado' ? 'Personalizado' : ''}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Ganho no Período */}
        <div className="glass-card rounded-3xl p-5 border border-white/90 relative overflow-hidden group hover:border-[#C4C240]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider">
              Ganhos {periodLabel}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(displayIncome)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C4C240]/25 text-[#11310C]">
              Entradas
            </span>
            <span className="text-[11px] font-medium text-[#11310C]/60">período selecionado</span>
          </div>
        </div>

        {/* Metric 2: Gasto no Período (Chili Red) */}
        <div className="glass-card rounded-3xl p-5 border border-white/90 relative overflow-hidden group hover:border-[#E13513]/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider">
              Gastos {periodLabel}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FDECE9] text-[#E13513] flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-[#E13513]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#E13513]">
            {formatCurrency(displayExpenses)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FDECE9] text-[#E13513]">
              Saídas
            </span>
            <span className="text-[11px] font-medium text-[#11310C]/60">período selecionado</span>
          </div>
        </div>

        {/* Metric 3: Sobrou no Período (Highlighted in Citron) */}
        <div className="glass-card rounded-3xl p-5 border border-[#C4C240]/50 relative overflow-hidden bg-gradient-to-br from-white via-white to-[#F7F9E3]/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#11310C] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C4C240]" />
              Sobrou {periodLabel}
            </span>
            <div className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#11310C] text-[#C4C240]">
              LÍQUIDO
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(displayLeftover)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-semibold text-[#11310C]/80">
              Disponível para aportes
            </span>
          </div>
        </div>

        {/* Metric 5: Total em Investimentos */}
        <div className="glass-card rounded-3xl p-5 border border-white/90 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider">
              Investimentos
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#11310C] text-[#C4C240] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#C4C240]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(currentMonthData.totalInvestments)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#11310C]/10 text-[#11310C]">
              +1.15% a.m.
            </span>
            <span className="text-[11px] font-medium text-[#11310C]/60">Rendimento médio</span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Chart + AI Insights Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Wealth Chart (2 Cols) */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#11310C]/10">
            <div>
              <h3 className="text-lg font-extrabold text-[#11310C]">
                Evolução do <span className="font-serif italic font-bold text-xl text-[#C4C240]">Dinheiro Total</span> e Sobras
              </h3>
              <p className="text-xs text-[#11310C]/60">
                Histórico sincronizado automaticamente das planilhas mensais
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[#11310C]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#11310C]" /> Renda
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#C4C240]" /> Sobra
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#E13513]" /> Gastos
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSobra" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C4C240" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#C4C240" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRenda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#11310C" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#11310C" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E13513" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#E13513" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#11310C" strokeOpacity={0.08} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#11310C', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#11310C' }} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area type="monotone" dataKey="Renda" stroke="#11310C" strokeWidth={3} fillOpacity={1} fill="url(#colorRenda)" />
                <Area type="monotone" dataKey="Gastos" stroke="#E13513" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
                <Area type="monotone" dataKey="Sobra" stroke="#C4C240" strokeWidth={3} fillOpacity={1} fill="url(#colorSobra)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations Card (1 Col) */}
        <div className="glass-dark-card rounded-3xl p-6 text-[#FAFBF6] flex flex-col justify-between space-y-4 relative glaze-shine">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#C4C240] flex items-center justify-center text-[#11310C]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#FAFBF6]">
                    Recomendações <span className="font-serif italic font-bold text-base text-[#C4C240]">Gemini IA</span>
                  </h3>
                  <p className="text-[10px] text-[#FAFBF6]/60">Análise automática dos seus dados</p>
                </div>
              </div>

              <button
                onClick={fetchAiInsights}
                disabled={isLoadingAi}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#C4C240] transition-all cursor-pointer"
                title="Atualizar análise da IA"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* List of Recommendations */}
            <div className="space-y-3 mt-4">
              {isLoadingAi ? (
                <div className="py-8 text-center text-xs text-[#FAFBF6]/60 animate-pulse">
                  Gerando recomendações personalizadas com Gemini AI...
                </div>
              ) : aiRecommendations.length > 0 ? (
                aiRecommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md space-y-1 hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#C4C240]">
                        {rec.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C4C240]/20 text-[#C4C240]">
                        {rec.impact}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#FAFBF6]/85 font-medium leading-snug">
                      {rec.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-2xl bg-white/10 text-xs font-medium text-[#FAFBF6]/70">
                  Sua saúde financeira está excelente! Mantenha a sobra de R$ {formatCurrency(currentMonthData.leftover)} investida.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('resumo')}
            className="w-full py-2.5 rounded-2xl bg-[#C4C240] text-[#11310C] font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#B5B333] transition-all cursor-pointer"
          >
            <span>Ver Balanço Geral Completo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Secondary Grid: Recent Transactions + Cards Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2 Cols) */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/90 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#11310C]/10">
            <div>
              <h3 className="text-lg font-extrabold text-[#11310C]">
                Últimas <span className="font-serif italic font-bold text-xl text-[#C4C240]">Movimentações</span>
              </h3>
              <p className="text-xs text-[#11310C]/60">Entradas e saídas sincronizadas</p>
            </div>
            <button
              onClick={() => onNavigateToTab('extrato')}
              className="text-xs font-bold text-[#11310C] hover:text-[#C4C240] flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Ver Extrato Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {groupedTransactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 hover:bg-white border border-[#11310C]/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      tx.type === 'income'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tx.type === 'expense'
                        ? 'bg-[#FDECE9] text-[#E13513]'
                        : 'bg-[#C4C240]/25 text-[#11310C]'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-700" />
                    ) : tx.type === 'expense' ? (
                      <ArrowDownRight className="w-4 h-4 text-[#E13513]" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-[#11310C]" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#11310C]">{tx.description}</h4>
                    <p className="text-[10px] font-medium text-[#11310C]/60">
                      {tx.category} • {formatDateBR(tx.date)} • {tx.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-extrabold text-xs ${
                      tx.type === 'income'
                        ? 'text-[#11310C]'
                        : tx.type === 'expense'
                        ? 'text-[#E13513]'
                        : 'text-[#11310C]'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </div>
                  <span className="text-[9px] font-semibold text-[#11310C]/50">
                    {tx.sourceSheet}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Cards Quick Invoice Widget (1 Col) */}
        <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#11310C]/10">
            <div>
              <h3 className="text-lg font-extrabold text-[#11310C]">
                Faturas dos <span className="font-serif italic font-bold text-xl text-[#C4C240]">Cartões</span>
              </h3>
              <p className="text-xs text-[#11310C]/60">Abertura e fechamento</p>
            </div>
            <button
              onClick={() => onNavigateToTab('cartoes')}
              className="p-1.5 rounded-xl bg-[#11310C]/5 hover:bg-[#11310C]/10 text-[#11310C] transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {creditCards.map((card) => (
              <div
                key={card.id}
                className="p-3.5 rounded-2xl bg-white/90 border border-[#11310C]/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#11310C]">{card.name}</span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      card.status === 'fechada'
                        ? 'bg-[#E13513]/15 text-[#E13513]'
                        : 'bg-[#C4C240]/30 text-[#11310C]'
                    }`}
                  >
                    {card.status === 'fechada' ? 'Fatura Fechada' : 'Fatura Aberta'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[10px] text-[#11310C]/60 font-semibold">Fatura Atual</p>
                    <p className="text-sm font-extrabold text-[#11310C]">
                      {formatCurrency(card.currentInvoice)}
                    </p>
                  </div>

                  <div className="text-right text-[10px] text-[#11310C]/70">
                    <p>Fechamento: Dia {card.closingDay}</p>
                    <p>Vencimento: Dia {card.dueDay}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Range Calendar Modal */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FAFBF6] border border-[#11310C]/20 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#11310C]/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#11310C] text-[#C4C240] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-extrabold text-[#11310C]">
                  Personalizar Período
                </h3>
              </div>
              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="p-1.5 text-[#11310C]/60 hover:text-[#11310C] rounded-xl hover:bg-[#11310C]/5 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#11310C]/70">
              Escolha o intervalo de datas inicial e final para filtrar os indicadores e gráficos do seu painel:
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#11310C]/80">Data Inicial</label>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#11310C]/15 rounded-xl text-xs font-bold text-[#11310C] focus:outline-none focus:border-[#C4C240]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#11310C]/80">Data Final</label>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#11310C]/15 rounded-xl text-xs font-bold text-[#11310C] focus:outline-none focus:border-[#C4C240]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#11310C]/70 hover:text-[#11310C] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setTimeRange('personalizado');
                  setIsCalendarModalOpen(false);
                }}
                className="px-5 py-2.5 bg-[#11310C] text-[#C4C240] rounded-xl text-xs font-extrabold shadow-md hover:bg-[#11310C]/90 transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Aplicar Filtro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
