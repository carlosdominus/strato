import React, { useState } from 'react';
import {
  TrendingUp,
  PieChart as PieIcon,
  DollarSign,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Bitcoin,
  Globe,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { Investment } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface InvestimentosViewProps {
  investments: Investment[];
  onOpenManualModal: () => void;
}

const COLORS = ['#11310C', '#C4C240', '#4D7C0F', '#15803D', '#E13513'];

export const InvestimentosView: React.FC<InvestimentosViewProps> = ({
  investments,
  onOpenManualModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [pieMode, setPieMode] = useState<'ativo' | 'categoria'>('ativo');

  const totalInvested = investments.reduce((acc, item) => acc + item.amountInvested, 0);
  const totalCurrentValue = investments.reduce((acc, item) => acc + item.currentValue, 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const overallYield = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const totalMonthlyDividends = investments.reduce((acc, item) => acc + item.monthlyDividend, 0);

  // International assets total in USD (approx rate 5.60 BRL / USD)
  const usdExchangeRate = 5.60;
  const internationalAssets = investments.filter((i) => i.category === 'Internacional');
  const totalUsdValue = internationalAssets.reduce((acc, item) => acc + item.currentValue / usdExchangeRate, 0);

  // Allocation data by Asset OR Category
  const categoryTotals: Record<string, number> = {};
  investments.forEach((inv) => {
    categoryTotals[inv.category] = (categoryTotals[inv.category] || 0) + inv.currentValue;
  });

  const pieData =
    pieMode === 'ativo'
      ? investments.map((inv) => ({
          name: inv.name,
          value: inv.currentValue,
          category: inv.category,
        }))
      : Object.keys(categoryTotals).map((cat) => ({
          name: cat,
          value: categoryTotals[cat],
          category: cat,
        }));

  const filteredInvestments =
    selectedCategory === 'todos'
      ? investments
      : investments.filter((i) => i.category === selectedCategory);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card rounded-3xl p-6 border border-white/90">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#11310C]/60">
              Carteira de Ativos
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4C240]" />
            <span className="text-xs font-bold text-[#11310C]">Rentabilidade & Dividendos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            Meus <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#C4C240]">Investimentos</span> & Performance
          </h1>
        </div>

        <button
          onClick={onOpenManualModal}
          className="liquid-button flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-[#11310C] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Aporte</span>
        </button>
      </div>

      {/* Top Investment Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valor Atual */}
        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider block mb-2">
            Valor Total Atual
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(totalCurrentValue)}
          </div>
          <p className="text-[11px] font-medium text-[#11310C]/60 mt-2">
            Valor Aplicado: {formatCurrency(totalInvested)}
          </p>
        </div>

        {/* Card 2: Lucro / Lucratividade */}
        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider block mb-2">
            Lucro Bruto Acumulado
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(totalProfit)}
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C4C240]/25 text-[#11310C]">
              {formatPercent(overallYield)}
            </span>
          </div>
        </div>

        {/* Card 3: Projeção de Dividendos Mês */}
        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider block mb-2">
            Renda Passiva Mensal
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(totalMonthlyDividends)}
          </div>
          <p className="text-[11px] font-medium text-[#11310C]/60 mt-2">
            Dividendos de FIIs e Stocks EUA
          </p>
        </div>

        {/* Card 4: Posição Internacional em Dólar */}
        <div className="glass-card rounded-3xl p-5 border border-white/90 bg-gradient-to-br from-white via-white to-emerald-50/40">
          <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider block mb-2 flex items-center justify-between">
            <span>Posição em Dólares</span>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">USD $</span>
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
            $ {totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] font-medium text-[#11310C]/70 mt-2">
            ~ {formatCurrency(totalUsdValue * usdExchangeRate)} (Câmbio: R$ {usdExchangeRate.toFixed(2)})
          </p>
        </div>
      </div>

      {/* Main Allocation & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation Donut Chart (1 Col) */}
        <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-[#11310C]">
                Alocação de <span className="font-serif italic font-bold text-xl text-[#C4C240]">Ativos</span>
              </h3>
              <p className="text-xs text-[#11310C]/60">Passe o mouse para ver cada ativo específico</p>
            </div>

            {/* View Mode Toggle Switch */}
            <div className="flex items-center gap-1 p-0.5 bg-[#11310C]/10 rounded-xl">
              <button
                onClick={() => setPieMode('ativo')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                  pieMode === 'ativo'
                    ? 'bg-[#11310C] text-[#FAFBF6]'
                    : 'text-[#11310C]/70 hover:text-[#11310C]'
                }`}
              >
                Por Ativo
              </button>
              <button
                onClick={() => setPieMode('categoria')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                  pieMode === 'categoria'
                    ? 'bg-[#11310C] text-[#FAFBF6]'
                    : 'text-[#11310C]/70 hover:text-[#11310C]'
                }`}
              >
                Categoria
              </button>
            </div>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#11310C',
                    borderRadius: '16px',
                    color: '#FAFBF6',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${formatCurrency(Number(val))} (${((Number(val) / totalCurrentValue) * 100).toFixed(1)}%)`,
                    item?.payload?.name || name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="space-y-2 pt-2 border-t border-[#11310C]/10 max-h-48 overflow-y-auto">
            {pieData.slice(0, 7).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-[#11310C] truncate">{item.name}</span>
                </div>
                <span className="text-[#11310C] flex-shrink-0 ml-2">
                  {((item.value / totalCurrentValue) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Investment List Table (2 Cols) */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#11310C]/10">
            <div>
              <h3 className="text-lg font-extrabold text-[#11310C]">
                Ativos em <span className="font-serif italic font-bold text-xl text-[#C4C240]">Carteira</span>
              </h3>
              <p className="text-xs text-[#11310C]/60">Sincronizado em R$ (BRL) e $ (USD)</p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {['todos', 'Internacional', 'Renda Fixa', 'FIIs', 'Ações', 'Cripto'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#11310C] text-[#FAFBF6]'
                      : 'bg-[#11310C]/5 text-[#11310C]/70 hover:bg-[#11310C]/10'
                  }`}
                >
                  {cat === 'todos' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#11310C]">
              <thead>
                <tr className="border-b border-[#11310C]/10 text-[10px] font-bold uppercase tracking-wider text-[#11310C]/60">
                  <th className="pb-2">Ativo</th>
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2 text-right">Aplicado</th>
                  <th className="pb-2 text-right">Valor Atual</th>
                  <th className="pb-2 text-right">Rentabilidade</th>
                  <th className="pb-2 text-right">Proventos/mês</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#11310C]/5 font-semibold">
                {filteredInvestments.map((inv) => {
                  const isIntl = inv.category === 'Internacional';
                  const usdVal = inv.currentValue / usdExchangeRate;

                  return (
                    <tr key={inv.id} className="hover:bg-white/60 transition-all">
                      <td className="py-3">
                        <div className="font-extrabold text-[#11310C]">{inv.name}</div>
                        {isIntl && (
                          <span className="text-[10px] text-emerald-800 font-bold block">
                            ${usdVal.toFixed(2)} USD
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#11310C]/10 text-[#11310C]">
                          {inv.category}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[#11310C]/80">
                        {formatCurrency(inv.amountInvested)}
                      </td>
                      <td className="py-3 text-right font-extrabold text-[#11310C]">
                        {formatCurrency(inv.currentValue)}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C4C240]/25 text-[#11310C]">
                          {formatPercent(inv.yieldPercent)}
                        </span>
                      </td>
                      <td className="py-3 text-right text-emerald-800 font-extrabold">
                        {inv.monthlyDividend > 0 ? formatCurrency(inv.monthlyDividend) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

