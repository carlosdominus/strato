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
  const [localSearch, setLocalSearch] = useState<string>('');

  // Categories list
  const categories = Array.from(new Set(transactions.map((t) => t.category)));

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'todos' || tx.type === filterType;
    const matchesCategory = filterCategory === 'todas' || tx.category === filterCategory;
    const matchesSearch =
      tx.description.toLowerCase().includes(localSearch.toLowerCase()) ||
      tx.paymentMethod.toLowerCase().includes(localSearch.toLowerCase()) ||
      tx.sourceSheet.toLowerCase().includes(localSearch.toLowerCase());

    return matchesType && matchesCategory && matchesSearch;
  });

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
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#11310C]/50">
              Extrato Completo & Lançamentos
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4C240]" />
            <span className="text-xs font-bold text-[#11310C]">{selectedMonth}</span>
          </div>
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

          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-2xl bg-white/90 border border-[#11310C]/15 text-xs font-bold text-[#11310C] focus:outline-none cursor-pointer"
          >
            <option value="todas">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List Table */}
      <div className="glass-card rounded-3xl p-6 border border-white/90 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#11310C]">
            <thead>
              <tr className="border-b border-[#11310C]/10 text-[10px] font-bold uppercase tracking-wider text-[#11310C]/60">
                <th className="pb-3">Data</th>
                <th className="pb-3">Descrição</th>
                <th className="pb-3">Categoria</th>
                <th className="pb-3">Meio / Forma</th>
                <th className="pb-3">Planilha Origem</th>
                <th className="pb-3 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#11310C]/5 font-semibold">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/80 transition-all">
                    <td className="py-3.5 text-[#11310C]/70 font-mono text-[11px]">
                      {formatDateBR(tx.date)}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
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
                    <td className="py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#11310C]/10 text-[#11310C]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 text-[#11310C]/80">{tx.paymentMethod}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#11310C]/60 bg-white px-2 py-0.5 rounded-md border border-[#11310C]/10">
                        <FileSpreadsheet className="w-3 h-3 text-[#C4C240]" />
                        {tx.sourceSheet}
                      </span>
                    </td>
                    <td
                      className={`py-3.5 text-right font-extrabold text-sm ${
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
