import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NavTabs } from './components/NavTabs';
import { ManualRegistrationModal } from './components/ManualRegistrationModal';
import { DashboardView } from './components/DashboardView';
import { ResumoView } from './components/ResumoView';
import { InvestimentosView } from './components/InvestimentosView';
import { CartoesAssinaturasView } from './components/CartoesAssinaturasView';
import { DividasView } from './components/DividasView';
import { MetasView } from './components/MetasView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { ExtratoView } from './components/ExtratoView';

import {
  MOCK_TRANSACTIONS,
  MOCK_MONTHS_SUMMARY,
  MOCK_CREDIT_CARDS,
  MOCK_INVESTMENTS,
  MOCK_DEBTS,
  MOCK_SUBSCRIPTIONS,
  MOCK_SPREADSHEETS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_DEBTORS,
  INITIAL_FINANCIAL_GOALS,
} from './data/mockData';
import { Transaction, SpreadsheetConnection, FinancialGoal, Debtor, MonthSummaryData } from './types';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/firebase';
import { User } from 'firebase/auth';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('Agosto 2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // App domain state
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [monthsData, setMonthsData] = useState(MOCK_MONTHS_SUMMARY);
  const [creditCards, setCreditCards] = useState(MOCK_CREDIT_CARDS);
  const [investments, setInvestments] = useState(MOCK_INVESTMENTS);
  const [debts] = useState(MOCK_DEBTS);
  const [debtors, setDebtors] = useState<Debtor[]>(INITIAL_DEBTORS);
  const [goals, setGoals] = useState<FinancialGoal[]>(INITIAL_FINANCIAL_GOALS);
  const [bankAccounts] = useState(INITIAL_BANK_ACCOUNTS);
  const [subscriptions, setSubscriptions] = useState(MOCK_SUBSCRIPTIONS);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetConnection[]>(MOCK_SPREADSHEETS);

  // Auth state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [userAccessToken, setUserAccessToken] = useState<string | null>(null);

  const fetchLiveSheets = useCallback(async (tokenToUse?: string | null) => {
    try {
      const headers: Record<string, string> = {};
      const activeToken = tokenToUse || userAccessToken || getAccessToken();
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch('/api/fetch-sheets', { headers });
      const data = await res.json();
      if (data.success) {
        if (data.sheets && Array.isArray(data.sheets)) {
          setSpreadsheets((prev) =>
            prev.map((sheet) => {
              const found = data.sheets.find((s: any) => s.id === sheet.id);
              if (found) {
                return {
                  ...sheet,
                  status: found.status,
                  description: found.message || sheet.description,
                  recordsCount: found.linesCount !== undefined ? found.linesCount : sheet.recordsCount,
                  lastSync: found.status === 'conectado' ? 'Sincronizado via Google API' : 'Privado (Faça login para conectar)',
                };
              }
              return sheet;
            })
          );
        }

        if (data.investments && Array.isArray(data.investments) && data.investments.length > 0) {
          setInvestments(data.investments);
        } else if (data.investmentsUSD && Array.isArray(data.investmentsUSD) && data.investmentsUSD.length > 0) {
          setInvestments((prev) => {
            const nonUs = prev.filter((i) => i.category !== 'Internacional');
            return [...nonUs, ...data.investmentsUSD];
          });
        }

        if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
          setTransactions(data.transactions);
        }

        if (data.cards && Array.isArray(data.cards) && data.cards.length > 0) {
          setCreditCards(data.cards);
        }

        if (data.subscriptions && Array.isArray(data.subscriptions) && data.subscriptions.length > 0) {
          setSubscriptions(data.subscriptions);
        }

        if (data.debtors && Array.isArray(data.debtors) && data.debtors.length > 0) {
          setDebtors(data.debtors);
        }

        if (data.totaisMatrix && data.totaisMatrix.months && data.totaisMatrix.accounts) {
          const { months, accounts } = data.totaisMatrix;
          setMonthsData((prev) => {
            const next = { ...prev };
            months.forEach((mName: string) => {
              let sumForMonth = 0;
              accounts.forEach((acc: any) => {
                sumForMonth += acc.balances[mName] || 0;
              });
              if (next[mName]) {
                next[mName] = {
                  ...next[mName],
                  totalMoney: sumForMonth > 0 ? sumForMonth : next[mName].totalMoney,
                };
              }
            });
            return next;
          });
        }

        if (data.liveSummary) {
          setMonthsData((prev) => ({
            ...prev,
            'Agosto 2026': {
              ...prev['Agosto 2026'],
              totalIncome: data.liveSummary.totalIncome,
              totalExpenses: data.liveSummary.totalExpenses,
              leftover: data.liveSummary.leftover,
            },
          }));
        }
      }
    } catch (err) {
      console.error('Failed to sync live sheets:', err);
    }
  }, [userAccessToken]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setUserAccessToken(token);
        fetchLiveSheets(token);
      },
      () => {
        setGoogleUser(null);
        setUserAccessToken(null);
        fetchLiveSheets(null);
      }
    );
    return () => unsubscribe();
  }, [fetchLiveSheets]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setUserAccessToken(res.accessToken);
        await fetchLiveSheets(res.accessToken);
      }
    } catch (e: any) {
      console.error('Google Sign in failed:', e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setGoogleUser(null);
    setUserAccessToken(null);
    fetchLiveSheets(null);
  };

  const handleAddGoal = (newGoal: Omit<FinancialGoal, 'id'>) => {
    const created: FinancialGoal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
    };
    setGoals((prev) => [...prev, created]);
  };

  const handleUpdateGoalProgress = (id: string, additionalAmount: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, currentAmount: g.currentAmount + additionalAmount } : g))
    );
  };

  const monthsList = Object.keys(monthsData);
  const currentMonthSummary = monthsData[selectedMonth] || monthsData['Agosto 2026'];

  // Add new manual transaction and dynamically update monthly totals!
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const createdTx: Transaction = {
      ...newTx,
      id: `tx-manual-${Date.now()}`,
    };

    setTransactions((prev) => [createdTx, ...prev]);

    // Recalculate summary totals for the active month
    setMonthsData((prev) => {
      const currentMonth = prev[selectedMonth] || prev['Agosto 2026'];
      let newIncome = currentMonth.totalIncome;
      let newExpenses = currentMonth.totalExpenses;
      let newInvestments = currentMonth.totalInvestments;

      if (newTx.type === 'income') {
        newIncome += newTx.amount;
      } else if (newTx.type === 'expense') {
        newExpenses += newTx.amount;
      } else if (newTx.type === 'investment') {
        newInvestments += newTx.amount;
      }

      const newLeftover = newIncome - newExpenses;

      return {
        ...prev,
        [selectedMonth]: {
          ...currentMonth,
          totalIncome: newIncome,
          totalExpenses: newExpenses,
          totalInvestments: newInvestments,
          leftover: newLeftover,
          totalMoney: currentMonth.totalMoney + (newTx.type === 'income' ? newTx.amount : newTx.type === 'expense' ? -newTx.amount : 0),
        },
      };
    });
  };

  const handleUpdateMonthSummary = (monthKey: string, updated: Partial<MonthSummaryData>) => {
    setMonthsData((prev) => {
      const current = prev[monthKey] || prev['Agosto 2026'];
      const totalIncome = updated.totalIncome !== undefined ? updated.totalIncome : current.totalIncome;
      const totalExpenses = updated.totalExpenses !== undefined ? updated.totalExpenses : current.totalExpenses;
      const totalInvestments = updated.totalInvestments !== undefined ? updated.totalInvestments : current.totalInvestments;
      const leftover = totalIncome - totalExpenses;

      return {
        ...prev,
        [monthKey]: {
          ...current,
          ...updated,
          totalIncome,
          totalExpenses,
          totalInvestments,
          leftover,
        },
      };
    });
  };

  const handleAddSpreadsheet = (sheet: SpreadsheetConnection) => {
    setSpreadsheets((prev) => [sheet, ...prev]);
  };

  const handleImportCsvTransactions = (newTxs: Transaction[]) => {
    setTransactions((prev) => [...newTxs, ...prev]);
  };

  // Find total money sheet
  const totalMoneySheet = spreadsheets.find((s) => s.type === 'total_mes') || spreadsheets[0];

  return (
    <div className="min-h-screen bg-[#F8F9F3] text-[#11310C] font-sans selection:bg-[#C4C240] selection:text-[#11310C]">
      {/* Header Bar */}
      <Header
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        monthsList={monthsList}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        onNavigateToTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        transactions={transactions}
        investments={investments}
        creditCards={creditCards}
        debtors={debtors}
      />

      {/* Main Navigation Tabs */}
      <NavTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="transition-all duration-300">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentMonthData={currentMonthSummary}
            allMonthsData={monthsData}
            recentTransactions={transactions}
            creditCards={creditCards}
            selectedMonth={selectedMonth}
            onNavigateToTab={setActiveTab}
            onOpenManualModal={() => setIsManualModalOpen(true)}
            onUpdateMonthData={handleUpdateMonthSummary}
          />
        )}

        {activeTab === 'resumo' && (
          <ResumoView
            currentMonthData={currentMonthSummary}
            allMonthsData={monthsData}
            totalMoneySheet={totalMoneySheet}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            monthsList={monthsList}
            investments={investments}
          />
        )}

        {activeTab === 'investimentos' && (
          <InvestimentosView
            investments={investments}
            onOpenManualModal={() => setIsManualModalOpen(true)}
          />
        )}

        {activeTab === 'cartoes' && (
          <CartoesAssinaturasView
            creditCards={creditCards}
            subscriptions={subscriptions}
            onOpenManualModal={() => setIsManualModalOpen(true)}
          />
        )}

        {activeTab === 'dividas' && (
          <DividasView
            debts={debts}
            debtors={debtors}
            onOpenManualModal={() => setIsManualModalOpen(true)}
          />
        )}

        {activeTab === 'metas' && (
          <MetasView
            goals={goals}
            onAddGoal={handleAddGoal}
            onUpdateGoalProgress={handleUpdateGoalProgress}
          />
        )}

        {activeTab === 'extrato' && (
          <ExtratoView
            transactions={transactions}
            onOpenManualModal={() => setIsManualModalOpen(true)}
            selectedMonth={selectedMonth}
          />
        )}

        {activeTab === 'configuracoes' && (
          <ConfiguracoesView
            googleUser={googleUser}
            isLoggingIn={isLoggingIn}
            onGoogleLogin={handleGoogleLogin}
            onGoogleLogout={handleGoogleLogout}
            spreadsheets={spreadsheets}
            onAddSpreadsheet={handleAddSpreadsheet}
            onImportCsvTransactions={handleImportCsvTransactions}
            onRefreshSheets={() => fetchLiveSheets()}
          />
        )}
      </main>

      {/* Manual Entry Registration Modal */}
      <ManualRegistrationModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}

export default App;

