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
  usdRate?: number;
  netUsdRate?: number;
  onOpenManualModal: () => void;
}

const COLORS = ['#11310C', '#C4C240', '#4D7C0F', '#15803D', '#22C55E', '#166534', '#CA8A04'];

const CustomPieTooltip = ({ active, payload, totalValue }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const pct = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : '0';
    return (
      <div className="bg-[#11310C] text-[#FAFBF6] border border-[#C4C240] px-3.5 py-2.5 rounded-2xl shadow-xl text-xs font-bold space-y-1 pointer-events-none z-50">
        <p className="text-[#C4C240] font-extrabold text-xs">{data.name}</p>
        <p className="text-white text-xs">
          {formatCurrency(Number(data.value))} ({pct}%)
        </p>
      </div>
    );
  }
  return null;
};

export const InvestimentosView: React.FC<InvestimentosViewProps> = ({
  investments,
  usdRate = 5.14,
  netUsdRate,
  onOpenManualModal,
}) => {
  const [overrideUsdRate, setOverrideUsdRate] = useState<number | null>(null);
  const [sheetCellRef, setSheetCellRef] = useState<string>('Investimentos!K2');
  const [isEditingRate, setIsEditingRate] = useState<boolean>(false);
  const [tempRateInput, setTempRateInput] = useState<string>('5.14');

  const usdExchangeRateCommercial = overrideUsdRate !== null ? overrideUsdRate : (usdRate || 5.14); // Dynamic USD commercial rate (default 5.14)
  const avenueRepatriationFeePercent = 1.8; // ~1.4% spread + 0.38% IOF
  const netUsdRateAvenue = netUsdRate && overrideUsdRate === null ? netUsdRate : (usdExchangeRateCommercial * (1 - avenueRepatriationFeePercent / 100)); // Dynamic Net BRL/USD rate

  // Safe property extraction helper and filter zero assets as requested by user
  const safeInvestments = (investments || [])
    .filter((inv) => {
      const shares = inv.sharesCount || 0;
      const usdCur = inv.usdCurrent ?? (inv as any).dollarsCurrent ?? 0;
      const currVal = inv.currentValue || 0;
      return shares > 0 && (usdCur > 0 || currVal > 0);
    })
    .map((inv) => {
      const sharesCount = inv.sharesCount || 0;
      const averagePrice = inv.averagePrice ?? (inv as any).avgPrice ?? 0;
      const currentPrice = inv.currentPrice ?? (inv.currentValue && sharesCount ? inv.currentValue / sharesCount / usdExchangeRateCommercial : 0);
      const usdApplied = inv.usdApplied ?? (inv as any).dollarsApplied ?? (inv.amountInvested ? inv.amountInvested / usdExchangeRateCommercial : sharesCount * averagePrice);
      const usdCurrent = inv.usdCurrent ?? (inv as any).dollarsCurrent ?? (inv.currentValue ? inv.currentValue / usdExchangeRateCommercial : sharesCount * currentPrice);
      const usdChange = inv.usdChange ?? (inv as any).variationDollar ?? (usdCurrent - usdApplied);
      const percentChange = inv.percentChange ?? (inv as any).variationPercent ?? (inv.yieldPercent || (usdApplied > 0 ? ((usdCurrent - usdApplied) / usdApplied) * 100 : 0));
      
      // Calculate BRL amounts using netUsdRateAvenue (discounting 1.8% IOF/spread)
      const amountInvested = Math.round(usdApplied * netUsdRateAvenue);
      const currentValue = Math.round(usdCurrent * netUsdRateAvenue);
      const monthlyDividend = inv.monthlyDividend || 0;

      return {
        ...inv,
        ticker: inv.ticker || 'S/T',
        name: inv.name || inv.companyName || inv.ticker || 'Ativo',
        companyName: inv.companyName || inv.name || 'Empresa',
        assetClass: inv.assetClass || 'Internacional',
        sharesCount,
        averagePrice,
        currentPrice,
        usdApplied,
        usdCurrent,
        usdChange,
        percentChange,
        amountInvested,
        currentValue,
        monthlyDividend,
      };
    });

  const totalInvested = safeInvestments.reduce((acc, item) => acc + item.amountInvested, 0);
  const totalCurrentValue = safeInvestments.reduce((acc, item) => acc + item.currentValue, 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const overallYield = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const totalMonthlyDividends = safeInvestments.reduce((acc, item) => acc + item.monthlyDividend, 0);
  const totalUsdValue = safeInvestments.reduce((acc, item) => acc + item.usdCurrent, 0);
  const totalBrlCommercial = totalUsdValue * usdExchangeRateCommercial;
  const totalBrlAvenueNet = totalUsdValue * netUsdRateAvenue;

  // Pie chart data by individual asset
  const pieData = safeInvestments.map((inv) => ({
    name: inv.name,
    value: inv.currentValue || 1,
  }));

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(tempRateInput.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      setOverrideUsdRate(parsed);
    }
    setIsEditingRate(false);
  };

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
            <span className="text-xs font-bold text-[#11310C]">
              Câmbio Dólar Comercial: R$ {usdExchangeRateCommercial.toFixed(2)} / USD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            Meus <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#C4C240]">Investimentos</span> & Câmbio
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTempRateInput(usdExchangeRateCommercial.toString());
              setIsEditingRate(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-[#11310C]/5 text-[#11310C] hover:bg-[#11310C]/10 border border-[#11310C]/10 cursor-pointer transition-all"
          >
            <Globe className="w-4 h-4 text-[#C4C240]" />
            <span>Ajustar Cotação (5.14)</span>
          </button>

          <button
            onClick={onOpenManualModal}
            className="liquid-button flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-[#11310C] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Aporte</span>
          </button>
        </div>
      </div>

      {/* Câmbio Custom Modal */}
      {isEditingRate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-[#11310C]/20 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-[#11310C]">
                Configurar Cotação do Dólar
              </h3>
              <button
                onClick={() => setIsEditingRate(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#11310C]/70">
              Defina o valor da taxa de câmbio do Dólar em reais (BRL). Hoje a cotação oficial é <strong>R$ 5,14</strong>.
            </p>

            <form onSubmit={handleSaveRate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#11310C]/80 mb-1">
                  Taxa do Dólar (R$ / USD):
                </label>
                <input
                  type="text"
                  value={tempRateInput}
                  onChange={(e) => setTempRateInput(e.target.value)}
                  placeholder="5.14"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#11310C]/20 text-sm font-extrabold text-[#11310C] focus:outline-none focus:ring-2 focus:ring-[#C4C240]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#11310C]/80 mb-1">
                  Célula de Origem na Planilha Google Sheets:
                </label>
                <input
                  type="text"
                  value={sheetCellRef}
                  onChange={(e) => setSheetCellRef(e.target.value)}
                  placeholder="Investimentos!K2"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#11310C]/20 text-xs font-medium text-[#11310C] focus:outline-none focus:ring-2 focus:ring-[#C4C240]"
                />
                <p className="text-[10px] text-[#11310C]/50 mt-1">
                  Se você tiver uma célula com a fórmula `=GOOGLEFINANCE("CURRENCY:USDBRL")`, informe a referência aqui.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOverrideUsdRate(5.14);
                    setIsEditingRate(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Restaurar 5,14
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#11310C] text-white hover:bg-[#11310C]/90"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Investment Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Posição Intacta em Dólares (USD $) */}
        <div className="glass-card rounded-3xl p-5 border border-white/90 bg-gradient-to-br from-white via-white to-emerald-50/50">
          <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Posição Bruta em USD ($)</span>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Dólar Puro</span>
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
            $ {totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] font-medium text-[#11310C]/70 mt-2">
            Valor intacto mantido em carteira internacional (USD)
          </p>
        </div>

        {/* Card 2: Valor Bruto Convertido em R$ sem IOF */}
        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider block mb-2">
            Valor Bruto em R$ (@ {usdExchangeRateCommercial.toFixed(2)})
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(totalBrlCommercial)}
          </div>
          <p className="text-[11px] font-medium text-[#11310C]/60 mt-2">
            Conversão direta sem descontos (100% Câmbio Comercial)
          </p>
        </div>

        {/* Card 3: Valor Líquido pós-IOF/Spread em R$ */}
        <div className="glass-card rounded-3xl p-5 border border-white/90 bg-gradient-to-br from-white via-white to-amber-50/40">
          <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider block mb-2">
            Líquido pós-IOF/Spread (R$)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(totalBrlAvenueNet)}
          </div>
          <p className="text-[11px] font-medium text-amber-900 mt-2">
            Descontando repatriação Avenue (1,8% IOF + Spread)
          </p>
        </div>

        {/* Card 4: Lucro & Rendimento */}
        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/70 uppercase tracking-wider block mb-2">
            Lucro Acumulado
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            {formatCurrency(totalProfit)}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C4C240]/25 text-[#11310C]">
              {formatPercent(overallYield)}
            </span>
            <span className="text-[10px] text-[#11310C]/60 font-medium">
              Renda Passiva: {formatCurrency(totalMonthlyDividends)}/mês
            </span>
          </div>
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
              <p className="text-xs text-[#11310C]/60">Proporção por ativo individual</p>
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
                <Tooltip content={<CustomPieTooltip totalValue={totalCurrentValue} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="space-y-2 pt-2 pr-3 border-t border-[#11310C]/10 max-h-48 overflow-y-auto">
            {pieData.slice(0, 10).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-[#11310C] truncate">{item.name}</span>
                </div>
                <span className="text-[#11310C] flex-shrink-0 ml-2">
                  {totalCurrentValue > 0 ? ((item.value / totalCurrentValue) * 100).toFixed(1) : 0}%
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
            <span className="text-xs font-extrabold text-[#11310C] bg-[#11310C]/5 px-3 py-1 rounded-full border border-[#11310C]/10">
              {safeInvestments.length} Ativos Ativos
            </span>
          </div>

          {safeInvestments.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-white/60 rounded-2xl border border-[#11310C]/10">
              <Building2 className="w-8 h-8 text-[#11310C]/40 mx-auto" />
              <h4 className="font-extrabold text-sm text-[#11310C]">Nenhum Ativo Carregado</h4>
              <p className="text-xs text-[#11310C]/60 max-w-md mx-auto font-medium">
                Sua planilha de investimentos no Google Sheets é privada ou ainda não respondeu à conexão. Na aba <strong>Configurações</strong>, faça login com a conta Google dona da planilha para liberar a sincronização em tempo real.
              </p>
            </div>
          ) : (
            /* Table with all 10 columns */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#11310C]">
                <thead>
                  <tr className="border-b border-[#11310C]/10 text-[10px] font-bold uppercase tracking-wider text-[#11310C]/60">
                    <th className="pb-2">Ticker (Col A)</th>
                    <th className="pb-2">Nome (Col B)</th>
                    <th className="pb-2">Classe (Col C)</th>
                    <th className="pb-2 text-right">Ações (Col D)</th>
                    <th className="pb-2 text-right">P. Médio (Col E)</th>
                    <th className="pb-2 text-right">P. Atual (Col F)</th>
                    <th className="pb-2 text-right">Var $ (Col G)</th>
                    <th className="pb-2 text-right">Var % (Col H)</th>
                    <th className="pb-2 text-right">USD Aplicado (Col I)</th>
                    <th className="pb-2 text-right">USD Atual (Col J)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#11310C]/5 font-semibold">
                  {safeInvestments.map((inv) => {
                    const isPositive = inv.usdChange >= 0;

                    return (
                      <tr key={inv.id} className="hover:bg-white/60 transition-all">
                        <td className="py-3 font-mono font-extrabold text-[#11310C]">
                          {inv.ticker}
                        </td>
                        <td className="py-3 font-bold text-[#11310C] max-w-[140px] truncate">
                          {inv.name}
                        </td>
                        <td className="py-3 text-[10px]">
                          <span className="px-2 py-0.5 rounded-full bg-[#11310C]/10 text-[#11310C] font-bold">
                            {inv.assetClass || 'Ação'}
                          </span>
                        </td>
                        <td className="py-3 text-right font-extrabold">
                          {inv.sharesCount}
                        </td>
                        <td className="py-3 text-right text-[#11310C]/80">
                          ${inv.averagePrice.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-extrabold text-[#11310C]">
                          ${inv.currentPrice.toFixed(2)}
                        </td>
                        <td className={`py-3 text-right font-extrabold ${isPositive ? 'text-emerald-800' : 'text-[#E13513]'}`}>
                          {isPositive ? '+' : ''}${inv.usdChange.toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isPositive ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                          }`}>
                            {isPositive ? '+' : ''}{inv.percentChange.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 text-right text-[#11310C]/70">
                          ${inv.usdApplied.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-extrabold text-emerald-900">
                          ${inv.usdCurrent.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

