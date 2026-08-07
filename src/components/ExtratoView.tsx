import React, { useState } from 'react';
import {
  ReceiptText,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Download,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { getTransactionAllocatedMonthLabel, getMonthLabelFromIsoDate } from '../utils/sheetParser';
import { CustomSelect } from './CustomSelect';

interface ExtratoViewProps {
  transactions: Transaction[];
  onOpenManualModal: () => void;
  selectedMonth: string;
}

export const ExtratoView: React.FC<ExtratoViewProps> = ({
  transactions,
  onOpenManualModal,
  selectedMonth,
}) => {
  const [filterType, setFilterType] = useState<'todos' | TransactionType>('todos');
  const [filterCategory, setFilterCategory] = useState<string>('todas');
  const [filterAccount, setFilterAccount] = useState<string>('todas');
  const [filterMethod, setFilterMethod] = useState<string>('todos');
  const [filterDay, setFilterDay] = useState<string>('todos');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Categories & Accounts lists
  const categories = Array.from(new Set(transactions.map((t) => t.category))).filter(Boolean);
  const accounts = Array.from(new Set(transactions.map((t) => t.account || 'Geral'))).filter(Boolean);
  const paymentMethods = Array.from(new Set(transactions.map((t) => t.paymentMethod || 'PIX'))).filter(Boolean);
  const daysInMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const [filterMode, setFilterMode] = useState<'fatura' | 'compra'>('fatura');
  const [filterMonthScope, setFilterMonthScope] = useState<'selecionado' | 'todos'>('selecionado');

  const filteredTransactions = transactions.filter((tx) => {
    // Golden Rule Month Filter
    let matchesMonth = true;
    if (filterMonthScope === 'selecionado') {
      const allocatedMonth = getTransactionAllocatedMonthLabel(tx);
      const purchaseMonth = getMonthLabelFromIsoDate(tx.date);
      matchesMonth = filterMode === 'fatura' ? allocatedMonth === selectedMonth : purchaseMonth === selectedMonth;
    }

    const matchesType = filterType === 'todos' || tx.type === filterType;
    const matchesCategory = filterCategory === 'todas' || tx.category === filterCategory;
    const matchesAccount = filterAccount === 'todas' || (tx.account || 'Geral') === filterAccount;
    const matchesMethod = filterMethod === 'todos' || (tx.paymentMethod || '') === filterMethod;
    
    let matchesDay = true;
    const effectiveOrPurchaseDate = filterMode === 'fatura' && tx.effectiveExpenseDate ? tx.effectiveExpenseDate : tx.date;
    if (filterDay !== 'todos' && effectiveOrPurchaseDate) {
      const dayPart = effectiveOrPurchaseDate.split('-')[2] || effectiveOrPurchaseDate.split('/')[0];
      matchesDay = parseInt(dayPart, 10) === parseInt(filterDay, 10);
    }

    const matchesSearch =
      tx.description.toLowerCase().includes(localSearch.toLowerCase()) ||
      (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(localSearch.toLowerCase())) ||
      (tx.account && tx.account.toLowerCase().includes(localSearch.toLowerCase()));

    return matchesMonth && matchesType && matchesCategory && matchesAccount && matchesMethod && matchesDay && matchesSearch;
  });

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

  const sortedFilteredTransactions = [...filteredTransactions].sort((a, b) => parseDateMs(b.date) - parseDateMs(a.date));

  const totalIncomeInView = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenseInView = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const handleExportCsv = () => {
    const csvRows = [
      ['Data', 'Descrição', 'Categoria', 'Valor', 'Tipo', 'Forma', 'Planilha Alvo'],
      ...filteredTransactions.map((t) => [
        t.date,
        `"${t.description}"`,
        t.category,
        t.amount.toString(),
        t.type,
        t.paymentMethod,
        t.sourceSheet,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Extrato_Strato_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 space-y-10 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 glass-card rounded-3xl p-8 border border-[#11310C]/06">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11310C]">
            Extrato de <span className="font-serif italic font-bold text-3xl sm:text-4xl text-[#C4C240]">Transações</span>
          </h1>
          <p className="text-xs text-[#11310C]/70 mt-1">
            Consolidado histórico de todas as movimentações registradas nas suas planilhas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/90 border border-[#11310C]/20 text-xs font-bold text-[#11310C] hover:bg-white cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-[#C4C240]" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenManualModal}
            className="liquid-button flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-[#11310C] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>

      {/* Summary Chips for Filtered View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/60 uppercase block mb-1">
            Entradas Filtradas
          </span>
          <span className="text-2xl font-extrabold text-[#11310C]">
            {formatCurrency(totalIncomeInView)}
          </span>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/60 uppercase block mb-1">
            Saídas Filtradas
          </span>
          <span className="text-2xl font-extrabold text-[#E13513]">
            {formatCurrency(totalExpenseInView)}
          </span>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/90">
          <span className="text-xs font-bold text-[#11310C]/60 uppercase block mb-1">
            Registros Listados
          </span>
          <span className="text-2xl font-extrabold text-[#11310C]">
            {filteredTransactions.length} lançamentos
          </span>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="glass-card rounded-3xl p-4 border border-white/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#11310C]/40" />
          <input
            type="text"
            placeholder="Filtrar no extrato..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/90 border border-[#11310C]/15 text-xs font-medium text-[#11310C] focus:outline-none focus:ring-2 focus:ring-[#C4C240]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Selector: Month Selected vs All Months */}
          <div className="flex items-center gap-1 p-1 bg-[#11310C]/5 rounded-2xl border border-[#11310C]/10">
            <button
              onClick={() => setFilterMonthScope('selecionado')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMonthScope === 'selecionado'
                  ? 'bg-[#11310C] text-[#FAFBF6]'
                  : 'text-[#11310C]/70 hover:text-[#11310C]'
              }`}
            >
              Mês: {selectedMonth}
            </button>
            <button
              onClick={() => setFilterMonthScope('todos')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMonthScope === 'todos'
                  ? 'bg-[#11310C] text-[#FAFBF6]'
                  : 'text-[#11310C]/70 hover:text-[#11310C]'
              }`}
            >
              Todos os Meses
            </button>
          </div>

          {/* Mode Selector: Fatura vs Compra */}
          <div className="flex items-center gap-1 p-1 bg-[#C4C240]/20 rounded-2xl border border-[#C4C240]/40">
            <button
              onClick={() => setFilterMode('fatura')}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                filterMode === 'fatura'
                  ? 'bg-[#11310C] text-[#FAFBF6] shadow-sm'
                  : 'text-[#11310C]/80 hover:text-[#11310C]'
              }`}
              title="Prioriza Vencimento/Fatura (Regra de Ouro do Fluxo de Caixa)"
            >
              Mês Vencimento/Fatura
            </button>
            <button
              onClick={() => setFilterMode('compra')}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                filterMode === 'compra'
                  ? 'bg-[#11310C] text-[#FAFBF6] shadow-sm'
                  : 'text-[#11310C]/80 hover:text-[#11310C]'
              }`}
              title="Exibe no mês em que a compra foi efetuada"
            >
              Mês da Compra
            </button>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-[#11310C]/5 rounded-2xl border border-[#11310C]/10">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'income', label: 'Entradas' },
              { id: 'expense', label: 'Saídas' },
              { id: 'investment', label: 'Aportes' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === t.id
                    ? 'bg-[#11310C] text-[#FAFBF6]'
                    : 'text-[#11310C]/70 hover:text-[#11310C]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Account Dropdown */}
          <CustomSelect
            value={filterAccount}
            onChange={setFilterAccount}
            options={[
              { value: 'todas', label: 'Todas as Contas' },
              ...accounts.map((acc) => ({ value: acc, label: acc })),
            ]}
          />

          {/* Payment Method Dropdown */}
          <CustomSelect
            value={filterMethod}
            onChange={setFilterMethod}
            options={[
              { value: 'todos', label: 'Todos os Tipos' },
              ...paymentMethods.map((pm) => ({ value: pm, label: pm })),
            ]}
          />

          {/* Day Dropdown */}
          <CustomSelect
            value={filterDay}
            onChange={setFilterDay}
            options={[
              { value: 'todos', label: 'Todos os Dias' },
              ...daysInMonth.map((d) => ({ value: String(d), label: `Dia ${d}` })),
            ]}
          />
        </div>
      </div>

      {/* Transactions List Table */}
      <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#11310C]">
            <thead>
              <tr className="border-b border-[#11310C]/10 text-[10px] font-bold uppercase tracking-wider text-[#11310C]/60">
                <th className="pb-3 px-2 whitespace-nowrap">Data</th>
                <th className="pb-3 px-2 whitespace-nowrap">Descrição</th>
                <th className="pb-3 px-2 whitespace-nowrap">Conta</th>
                <th className="pb-3 px-2 whitespace-nowrap">Tipo / Cartão</th>
                <th className="pb-3 px-2 whitespace-nowrap">Categoria</th>
                <th className="pb-3 px-2 whitespace-nowrap text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#11310C]/5 font-semibold">
              {sortedFilteredTransactions.length > 0 ? (
                sortedFilteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/80 transition-all">
                    <td className="py-3.5 px-2 text-[#11310C]/80 font-mono text-[11px] whitespace-nowrap">
                      <div>{formatDateBR(tx.date)}</div>
                      {tx.isCreditCard && tx.invoiceDueDateStr && (
                        <div className="mt-0.5">
                          <span className="inline-block whitespace-nowrap text-[9px] font-extrabold text-[#11310C] bg-[#C4C240]/30 px-1.5 py-0.5 rounded-md border border-[#C4C240]/60">
                            Fatura Venc.: {tx.invoiceDueDateStr} ({tx.effectiveMonthLabel})
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.type === 'expense'
                              ? 'bg-[#FDECE9] text-[#E13513]'
                              : 'bg-[#C4C240]/25 text-[#11310C]'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
                          ) : tx.type === 'expense' ? (
                            <ArrowDownRight className="w-3.5 h-3.5 text-[#E13513]" />
                          ) : (
                            <TrendingUp className="w-3.5 h-3.5 text-[#11310C]" />
                          )}
                        </div>
                        <span className="font-extrabold text-[#11310C]">{tx.description}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#11310C]/10 text-[#11310C] whitespace-nowrap inline-block">
                        {tx.account || 'Geral'}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-[#C4C240]/20 text-[#11310C] border border-[#C4C240]/40 whitespace-nowrap inline-block">
                        {tx.paymentMethod || 'PIX'}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#11310C]/60 bg-white px-2 py-0.5 rounded-md border border-[#11310C]/10 whitespace-nowrap">
                        {tx.category}
                      </span>
                    </td>
                    <td
                      className={`py-3.5 px-2 text-right font-extrabold text-sm whitespace-nowrap ${
                        tx.type === 'income'
                          ? 'text-[#11310C]'
                          : tx.type === 'expense'
                          ? 'text-[#E13513]'
                          : 'text-[#11310C]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#11310C]/60 font-bold">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
