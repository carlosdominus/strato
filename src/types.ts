export type TransactionType = 'income' | 'expense' | 'investment';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  paymentMethod: string;
  sourceSheet: string;
  status: 'concluido' | 'pendente';
  notes?: string;
}

export interface CreditCardSheet {
  id: string;
  name: string;
  bank: string;
  lastDigits: string;
  closingDay: number; // Day of month when invoice closes
  dueDay: number; // Day of month when invoice is due
  currentInvoice: number;
  limit: number;
  status: 'aberta' | 'fechada';
}

export interface Investment {
  id: string;
  name: string;
  category: 'Renda Fixa' | 'Ações' | 'FIIs' | 'Cripto' | 'Internacional';
  amountInvested: number;
  currentValue: number;
  yieldPercent: number; // e.g. 1.15% monthly or 14.2% annual
  monthlyDividend: number;
}

export interface Debt {
  id: string;
  creditor: string;
  type: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: string; // e.g. "0.8% a.m."
  monthlyPayment: number;
  dueDate: string;
}

export interface Subscription {
  id: string;
  serviceName: string;
  category: string;
  monthlyPrice: number;
  renewalDay: number;
  active: boolean;
  cancelRecommendation?: boolean;
}

export interface SpreadsheetConnection {
  id: string;
  type: 'cartoes' | 'extrato' | 'investimentos' | 'dividas' | 'assinaturas' | 'total_mes';
  title: string;
  description: string;
  lastSync: string;
  status: 'conectado' | 'pendente' | 'erro';
  recordsCount: number;
  sheetUrl?: string;
  fileName?: string;
}

export interface MonthSummaryData {
  month: string; // e.g. "Agosto 2026"
  totalMoney: number; // Total de dinheiro no mês
  totalIncome: number; // Renda / Ganhos
  totalExpenses: number; // Gastos / Saídas
  leftover: number; // Sobra (Income - Expenses)
  totalInvestments: number; // Investimentos acumulados
  totalDebts: number; // Dívidas pendentes
  activeSubscriptionsCount: number;
  monthlyGrowthPercent: number;
}

export interface AIRecommendation {
  type: 'saving' | 'investment' | 'debt' | 'alert';
  title: string;
  description: string;
  impact: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  balance: number;
  lastDigits?: string;
}

export interface Debtor {
  id: string;
  borrowerName: string;
  description: string;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  dueDate: string;
  status: 'pendente' | 'parcial' | 'quitado';
  sheetUrl?: string;
  notes?: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  category: 'Reserva' | 'Investimento' | 'Aquisição' | 'Viagem' | 'Aposentadoria' | 'Outros';
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM
  monthlyContribution: number;
  notes?: string;
}

