import {
  Transaction,
  CreditCardSheet,
  Investment,
  Debt,
  Subscription,
  SpreadsheetConnection,
  MonthSummaryData,
  BankAccount,
  Debtor,
  FinancialGoal,
} from '../types';

export const INITIAL_MONTHS = [
  'Março 2026',
  'Abril 2026',
  'Maio 2026',
  'Junho 2026',
  'Julho 2026',
  'Agosto 2026',
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'acc-1',
    bankName: 'Itaú Personnalité',
    accountType: 'Conta Corrente + Reserva',
    balance: 18450.00,
    lastDigits: '4820',
  },
  {
    id: 'acc-2',
    bankName: 'Nubank',
    accountType: 'Conta Digital + Caixinhas',
    balance: 12380.00,
    lastDigits: '9120',
  },
  {
    id: 'acc-3',
    bankName: 'BTG Pactual',
    accountType: 'Conta Investimentos & Liquidez',
    balance: 8940.00,
    lastDigits: '3301',
  },
  {
    id: 'acc-4',
    bankName: 'Banco Inter',
    accountType: 'Conta Global & Corrente',
    balance: 5210.00,
    lastDigits: '7721',
  },
];

export const MONTHLY_HISTORICAL_DATA: Record<string, MonthSummaryData> = {
  'Maio 2026': {
    month: 'Maio 2026',
    totalMoney: 57825.84,
    totalIncome: 4212.94,
    totalExpenses: 2150.00,
    leftover: 2062.94,
    totalInvestments: 0,
    totalDebts: 0,
    activeSubscriptionsCount: 4,
    monthlyGrowthPercent: 0,
  },
  'Junho 2026': {
    month: 'Junho 2026',
    totalMoney: 57789.23,
    totalIncome: 0,
    totalExpenses: 0,
    leftover: 0,
    totalInvestments: 0,
    totalDebts: 0,
    activeSubscriptionsCount: 4,
    monthlyGrowthPercent: -0.06,
  },
  'Julho 2026': {
    month: 'Julho 2026',
    totalMoney: 60000.53,
    totalIncome: 0,
    totalExpenses: 0,
    leftover: 0,
    totalInvestments: 0,
    totalDebts: 0,
    activeSubscriptionsCount: 4,
    monthlyGrowthPercent: 3.83,
  },
  'Agosto 2026': {
    month: 'Agosto 2026',
    totalMoney: 62798.77,
    totalIncome: 0,
    totalExpenses: 0,
    leftover: 0,
    totalInvestments: 0,
    totalDebts: 0,
    activeSubscriptionsCount: 4,
    monthlyGrowthPercent: 4.66,
  },
};


export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_CARDS: CreditCardSheet[] = [
  {
    id: 'card-1',
    name: 'Cartão ML',
    bank: 'Mercado Pago',
    lastDigits: '4820',
    closingDay: 2,
    dueDay: 8,
    currentInvoice: 63.40,
    limit: 15000,
    status: 'aberta',
  },
  {
    id: 'card-2',
    name: 'Cartão Picpay PJ',
    bank: 'PicPay PJ',
    lastDigits: '9120',
    closingDay: 29,
    dueDay: 5,
    currentInvoice: 223.90,
    limit: 25000,
    status: 'aberta',
  },
  {
    id: 'card-3',
    name: 'Cartão Nubank',
    bank: 'Nubank',
    lastDigits: '3109',
    closingDay: 3,
    dueDay: 10,
    currentInvoice: 140.00,
    limit: 20000,
    status: 'aberta',
  },
];

export const INITIAL_INVESTMENTS: Investment[] = [
  {
    id: 'inv-init-1',
    ticker: 'VT',
    companyName: 'Vanguard Total World Stock ETF',
    name: 'Vanguard Total World Stock ETF (VT)',
    assetClass: 'ETF Internacional',
    sharesCount: 15,
    averagePrice: 102.50,
    currentPrice: 111.085,
    yieldPercent: 8.37,
    usdChange: 128.78,
    percentChange: 8.37,
    usdApplied: 1537.50,
    usdCurrent: 1666.28,
    category: 'Internacional',
    amountInvested: Math.round(1537.50 * 5.14),
    currentValue: Math.round(1666.28 * 5.14),
    monthlyDividend: 3.20,
  },
];

export const INITIAL_DEBTS: Debt[] = [];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-1',
    status: 'pausada',
    serviceName: 'Adobe',
    category: 'Software & Design',
    monthlyPrice: 95.00,
    paymentCard: 'Cartão Nubank',
    renewalDay: 5,
    active: false,
    cancelRecommendation: true,
  },
  {
    id: 'sub-2',
    status: 'ativa',
    serviceName: 'Shopify',
    category: 'Plataforma & E-commerce',
    monthlyPrice: 125.00,
    paymentCard: 'Cartão Picpay PJ',
    renewalDay: 26,
    active: true,
  },
  {
    id: 'sub-3',
    status: 'ativa',
    serviceName: 'Meli+',
    category: 'Benefícios & Mercado Livre',
    monthlyPrice: 98.90,
    paymentCard: 'Cartão Picpay PJ',
    renewalDay: 21,
    active: true,
  },
  {
    id: 'sub-4',
    status: 'pausada',
    serviceName: 'Claude',
    category: 'Inteligência Artificial',
    monthlyPrice: 110.00,
    paymentCard: 'Cartão Picpay PJ',
    renewalDay: 1,
    active: false,
    cancelRecommendation: true,
  },
];

export const INITIAL_SPREADSHEETS: SpreadsheetConnection[] = [
  {
    id: 'sheet-extrato',
    type: 'extrato',
    title: 'Extrato Bancário',
    description: 'Aba principal de lançamentos, receitas e despesas correntes.',
    lastSync: 'Sincronizado via Google API',
    status: 'conectado',
    recordsCount: 171,
    fileName: 'Extrato_Bancario_GoogleSheets',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1X2z-2WEBUwn7mXRYa7oiJhh7rgdCZ6aiYXk8HArhG-M/edit?gid=0#gid=0',
  },
  {
    id: 'sheet-cartoes',
    type: 'cartoes',
    title: 'Cartões & Fechamentos',
    description: 'Gestão de faturas de cartão de crédito e datas de fechamento.',
    lastSync: 'Sincronizado via Google API',
    status: 'conectado',
    recordsCount: 3,
    fileName: 'Cartoes_Fechamentos_GoogleSheets',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1X2z-2WEBUwn7mXRYa7oiJhh7rgdCZ6aiYXk8HArhG-M/edit?usp=sharing',
  },
  {
    id: 'sheet-assinaturas',
    type: 'assinaturas',
    title: 'Assinaturas Fixas',
    description: 'Aba de assinaturas recorrentes e custos mentais fixos.',
    lastSync: 'Sincronizado via Google API',
    status: 'conectado',
    recordsCount: 4,
    fileName: 'Assinaturas_Recorrentes_GoogleSheets',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1X2z-2WEBUwn7mXRYa7oiJhh7rgdCZ6aiYXk8HArhG-M/edit?gid=1972460113#gid=1972460113',
  },
  {
    id: 'sheet-totais',
    type: 'total_mes',
    title: 'Total Mensal do Saldo das Contas',
    description: 'Balanço consolidado de contas bancárias e liquidez.',
    lastSync: 'Sincronizado via Google API',
    status: 'conectado',
    recordsCount: 12,
    fileName: 'Total_Mensal_Saldo_GoogleSheets',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1Y2hEw_g4tPKK9dWP5LDgTqKzsExSAZcoQ5ZvZunP9x4/edit?gid=0#gid=0',
  },
  {
    id: 'sheet-investimentos-dolar',
    type: 'investimentos',
    title: 'Investimentos em Dólar',
    description: 'Carteira de investimentos internacionais e conversão cambial.',
    lastSync: 'Aguardando Login Google',
    status: 'pendente',
    recordsCount: 0,
    fileName: 'Investimento_Dolar_GoogleSheets',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1fv-MsaKURTBGIB8a3UWfLNKa5Yx6AfHXWTTYPZ1iB3c/edit?gid=0#gid=0',
  },
  {
    id: 'sheet-devedores',
    type: 'devedores',
    title: 'Devedores & Empréstimos',
    description: 'Aba de devedores e valores a receber.',
    lastSync: 'Aguardando Login Google',
    status: 'pendente',
    recordsCount: 0,
    fileName: 'Devedores_GoogleSheets',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1iSvoywDpT7uq8yJH4RGBPw9U8JtC9AkRST7JZMwDQXc/edit?gid=619733660#gid=619733660',
  },
];

export const INITIAL_DEBTORS: Debtor[] = [];

export const INITIAL_FINANCIAL_GOALS: FinancialGoal[] = [];

export const MOCK_TRANSACTIONS = INITIAL_TRANSACTIONS;
export const MOCK_MONTHS_SUMMARY = MONTHLY_HISTORICAL_DATA;
export const MOCK_CREDIT_CARDS = INITIAL_CARDS;
export const MOCK_INVESTMENTS = INITIAL_INVESTMENTS;
export const MOCK_DEBTS = INITIAL_DEBTS;
export const MOCK_SUBSCRIPTIONS = INITIAL_SUBSCRIPTIONS;
export const MOCK_SPREADSHEETS = INITIAL_SPREADSHEETS;
export const MOCK_BANK_ACCOUNTS = INITIAL_BANK_ACCOUNTS;
export const MOCK_DEBTORS = INITIAL_DEBTORS;
export const MOCK_FINANCIAL_GOALS = INITIAL_FINANCIAL_GOALS;



