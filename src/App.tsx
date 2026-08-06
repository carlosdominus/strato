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
import { parseAndFetchAllSheets } from './utils/sheetParser';

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

const getTabFromHash = (): string => {
  if (typeof window === 'undefined') return 'dashboard';
  const rawHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  const validTabs = ['dashboard', 'resumo', 'investimentos', 'cartoes', 'dividas', 'metas', 'extrato', 'configuracoes'];
  return validTabs.includes(rawHash) ? rawHash : 'dashboard';
};

export function App() {
  const [activeTab, setActiveTab] = useState<string>(getTabFromHash);
  const [selectedMonth, setSelectedMonth] = useState<string>('Agosto 2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // Sync hash changes (URL back/forward and direct links)
  useEffect(() => {
    const handleHashChange = () => {
      const currentTab = getTabFromHash();
      if (currentTab !== activeTab) {
        setActiveTab(currentTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (window.location.hash !== `#/${tabId}`) {
      window.location.hash = `#/${tabId}`;
    }
  };

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
  const [usdRate, setUsdRate] = useState<number>(5.50);
  const [netUsdRate, setNetUsdRate] = useState<number>(5.401);

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

      let data: any = null;
      try {
        const res = await fetch('/api/fetch-sheets', { headers });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            data = await res.json();
          }
        }
      } catch (apiErr) {
        console.warn('API route unavailable, using direct browser sheet parser for Vercel/Static host:', apiErr);
      }

      // Fallback to client-side parser if API endpoint is not available or returned an error (e.g. Vercel static hosting)
      if (!data || !data.success) {
        data = await parseAndFetchAllSheets(activeToken || undefined);
      }

      if (data && data.success) {
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

        if (data.usdRate) {
          setUsdRate(data.usdRate);
        }
        if (data.netUsdRate) {
          setNetUsdRate(data.netUsdRate);
        }

        if (data.totaisMatrix && data.totaisMatrix.months && Array.isArray(data.totaisMatrix.months)) {
          const { months, accounts, totalsRowMap } = data.totaisMatrix;
          const activeTxs = (data.transactions && Array.isArray(data.transactions)) ? data.transactions : transactions;

          const monthNumMap: Record<string, string> = {
            'maio': '05',
            'junho': '06',
            'julho': '07',
            'agosto': '08',
            'setembro': '09',
            'outubro': '10',
            'novembro': '11',
            'dezembro': '12',
          };

          const newMonthsData: Record<string, MonthSummaryData> = {};

          months.forEach((mRaw: string) => {
            if (!mRaw) return;
            const lowerRaw = mRaw.trim().toLowerCase();
            const capRaw = lowerRaw.charAt(0).toUpperCase() + lowerRaw.slice(1);
            const mKey = capRaw.includes('202') ? capRaw : `${capRaw} 2026`;

            let totalMoney = totalsRowMap ? totalsRowMap[mRaw] || 0 : 0;
            if (!totalMoney && accounts) {
              accounts.forEach((acc: any) => {
                totalMoney += (acc.balances && acc.balances[mRaw]) ? acc.balances[mRaw] : 0;
              });
            }

            // Skip future months without total money recorded
            if (totalMoney <= 0) return;

            const monthNum = monthNumMap[lowerRaw];
            let monthIncome = 0;
            let monthExpenses = 0;

            if (monthNum && activeTxs) {
              activeTxs.forEach((tx: Transaction) => {
                if (tx.date && (tx.date.startsWith(`2026-${monthNum}`) || tx.date.startsWith(`05/${monthNum}`) || tx.date.includes(`/${monthNum}/2026`))) {
                  if (tx.type === 'income') monthIncome += tx.amount;
                  else if (tx.type === 'expense') monthExpenses += tx.amount;
                }
              });
            }

            newMonthsData[mKey] = {
              month: mKey,
              totalMoney: totalMoney || 0,
              totalIncome: monthIncome,
              totalExpenses: monthExpenses,
              leftover: monthIncome - monthExpenses,
              monthlyGrowthPercent: 0,
              totalInvestments: 0,
              totalDebts: 0,
              activeSubscriptionsCount: 4,
            };
          });

          // Calculate sequential growth percentage
          const mKeys = Object.keys(newMonthsData);
          mKeys.forEach((k, idx) => {
            if (idx > 0) {
              const prevVal = newMonthsData[mKeys[idx - 1]].totalMoney;
              const currVal = newMonthsData[k].totalMoney;
              if (prevVal > 0 && currVal > 0) {
                newMonthsData[k].monthlyGrowthPercent = parseFloat((((currVal - prevVal) / prevVal) * 100).toFixed(2));
              }
            }
          });

          if (mKeys.length > 0) {
            setMonthsData(newMonthsData);
          }
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
        onNavigateToTab={handleSelectTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        transactions={transactions}
        investments={investments}
        creditCards={creditCards}
        debtors={debtors}
      />

      {/* Main Navigation Tabs */}
      <NavTabs activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* Main Content Area */}
      <main className="transition-all duration-300">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentMonthData={currentMonthSummary}
            allMonthsData={monthsData}
            recentTransactions={transactions}
            creditCards={creditCards}
            selectedMonth={selectedMonth}
            onNavigateToTab={handleSelectTab}
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
            usdRate={usdRate}
            netUsdRate={netUsdRate}
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

