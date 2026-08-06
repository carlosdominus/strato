// Client and server shared Google Sheets parser utility
export function parseCsvToRows(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const cols = line.match(/(".*?"|[^",;\t]+)(?=\s*[,;\t]|\s*$)/g) || line.split(/[,;\t]/);
    return cols.map((c) => c.replace(/^["']|["']$/g, '').trim());
  });
}

export function parseCleanNumber(val: string): number {
  if (!val) return 0;
  let s = val.replace(/["'$R\s]/gi, '').trim();
  if (!s) return 0;

  if (s.includes('.') && s.includes(',')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }

  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

export const SHEETS_CONFIG = [
  {
    id: 'sheet-extrato',
    type: 'extrato',
    title: 'Extrato Bancário',
    url: 'https://docs.google.com/spreadsheets/d/1X2z-2WEBUwn7mXRYa7oiJhh7rgdCZ6aiYXk8HArhG-M/export?format=csv&gid=0',
  },
  {
    id: 'sheet-cartoes',
    type: 'cartoes',
    title: 'Cartões & Fechamentos',
    url: 'https://docs.google.com/spreadsheets/d/1X2z-2WEBUwn7mXRYa7oiJhh7rgdCZ6aiYXk8HArhG-M/export?format=csv&gid=66211996',
  },
  {
    id: 'sheet-assinaturas',
    type: 'assinaturas',
    title: 'Assinaturas Fixas',
    url: 'https://docs.google.com/spreadsheets/d/1X2z-2WEBUwn7mXRYa7oiJhh7rgdCZ6aiYXk8HArhG-M/export?format=csv&gid=1972460113',
  },
  {
    id: 'sheet-totais',
    type: 'total_mes',
    title: 'Total Mensal do Saldo das Contas',
    url: 'https://docs.google.com/spreadsheets/d/1Y2hEw_g4tPKK9dWP5LDgTqKzsExSAZcoQ5ZvZunP9x4/export?format=csv&gid=0',
  },
  {
    id: 'sheet-devedores',
    type: 'devedores',
    title: 'Registro de Devedores',
    url: 'https://docs.google.com/spreadsheets/d/1iSvoywDpT7uq8yJH4RGBPw9U8JtC9AkRST7JZMwDQXc/export?format=csv&gid=619733660',
  },
  {
    id: 'sheet-investimentos',
    type: 'investimentos',
    title: 'Investimentos',
    url: 'https://docs.google.com/spreadsheets/d/1fv-MsaKURTBGIB8a3UWfLNKa5Yx6AfHXWTTYPZ1iB3c/export?format=csv&gid=0',
  },
];

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function getMonthLabelFromIsoDate(isoDateStr: string): string {
  if (!isoDateStr) return 'Agosto 2026';
  const parts = isoDateStr.split('-');
  if (parts.length >= 2) {
    const y = parts[0];
    const m = parseInt(parts[1], 10) - 1;
    if (m >= 0 && m < 12) {
      return `${MONTH_NAMES_PT[m]} ${y}`;
    }
  }
  return 'Agosto 2026';
}

export function convertBrOrIsoToIsoDate(rawStr?: string): string | null {
  if (!rawStr) return null;
  const s = rawStr.trim();
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  if (s.includes('-')) {
    const parts = s.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  return null;
}

export function getTransactionAllocatedMonthLabel(tx: {
  effectiveMonthLabel?: string;
  effectiveExpenseDate?: string;
  invoiceDueDateStr?: string;
  date?: string;
}): string {
  if (tx.effectiveMonthLabel) {
    return tx.effectiveMonthLabel;
  }
  if (tx.effectiveExpenseDate) {
    return getMonthLabelFromIsoDate(tx.effectiveExpenseDate);
  }
  if (tx.invoiceDueDateStr) {
    const isoFromDue = convertBrOrIsoToIsoDate(tx.invoiceDueDateStr);
    if (isoFromDue) {
      return getMonthLabelFromIsoDate(isoFromDue);
    }
  }
  if (tx.date) {
    return getMonthLabelFromIsoDate(tx.date);
  }
  return 'Agosto 2026';
}

export function calculateEffectiveInvoiceDate(
  purchaseDateStr: string, // YYYY-MM-DD
  accountName: string,
  paymentMethod: string,
  cards: any[] = [],
  explicitDueDateStr?: string // Data de Vencimento
) {
  const accountLower = (accountName || '').toLowerCase();
  const methodLower = (paymentMethod || '').toLowerCase();

  // If an explicit due date (Data de Vencimento) is provided, use it directly! (Golden Rule #1)
  if (explicitDueDateStr && explicitDueDateStr.trim()) {
    let cleanIso = '';
    let cleanBR = '';
    const raw = explicitDueDateStr.trim();
    if (raw.includes('/')) {
      const p = raw.split('/');
      if (p.length === 3) {
        const d = p[0].padStart(2, '0');
        const m = p[1].padStart(2, '0');
        const y = p[2].length === 2 ? `20${p[2]}` : p[2];
        cleanIso = `${y}-${m}-${d}`;
        cleanBR = `${d}/${m}/${y}`;
      }
    } else if (raw.includes('-')) {
      cleanIso = raw;
      const p = raw.split('-');
      if (p.length === 3) {
        cleanBR = `${p[2].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[0]}`;
      }
    }

    if (cleanIso) {
      const matchedCard = cards.find((c) => {
        const cName = (c.name || '').toLowerCase();
        if (!cName) return false;
        return accountLower.includes(cName) || methodLower.includes(cName) || cName.includes(accountLower);
      });

      return {
        isCreditCard: true,
        cardName: matchedCard ? matchedCard.name : undefined,
        purchaseDate: purchaseDateStr,
        effectiveExpenseDate: cleanIso,
        effectiveMonthLabel: getMonthLabelFromIsoDate(cleanIso),
        invoiceDueDateStr: cleanBR || explicitDueDateStr,
      };
    }
  }

  const isCreditCard =
    methodLower.includes('cartão') ||
    methodLower.includes('cartao') ||
    methodLower.includes('crédito') ||
    methodLower.includes('credito') ||
    accountLower.includes('cartão') ||
    accountLower.includes('cartao');

  if (!isCreditCard) {
    return {
      isCreditCard: false,
      cardName: undefined,
      purchaseDate: purchaseDateStr,
      effectiveExpenseDate: purchaseDateStr,
      effectiveMonthLabel: getMonthLabelFromIsoDate(purchaseDateStr),
      invoiceDueDateStr: undefined,
    };
  }

  // Find matching card in cards list or default to closing: 2, due: 8 (Mercado Livre pattern)
  const matchedCard = cards.find((c) => {
    const cName = (c.name || '').toLowerCase();
    if (!cName) return false;
    return accountLower.includes(cName) || methodLower.includes(cName) || cName.includes(accountLower);
  }) || cards[0] || { name: 'Cartão de Crédito', closingDay: 2, dueDay: 8 };

  const closingDay = matchedCard.closingDay || 2;
  const dueDay = matchedCard.dueDay || 8;

  const parts = purchaseDateStr.split('-');
  let year = parseInt(parts[0], 10) || 2026;
  let monthIndex = (parseInt(parts[1], 10) || 8) - 1; // 0-indexed JS month
  const day = parseInt(parts[2], 10) || 1;

  // If purchase day is strictly after closing day of current month, it moves to next month's invoice!
  if (day > closingDay) {
    monthIndex += 1;
  }

  // If due day is earlier than closing day in calendar month (e.g., closes on 25th, due on 5th of next month)
  if (dueDay < closingDay) {
    monthIndex += 1;
  }

  const dueDateObj = new Date(year, monthIndex, dueDay);
  const dueY = dueDateObj.getFullYear();
  const dueM = String(dueDateObj.getMonth() + 1).padStart(2, '0');
  const dueD = String(dueDateObj.getDate()).padStart(2, '0');

  const effectiveExpenseDate = `${dueY}-${dueM}-${dueD}`;
  const effectiveMonthLabel = getMonthLabelFromIsoDate(effectiveExpenseDate);
  const invoiceDueDateStr = `${dueD}/${dueM}/${dueY}`;

  return {
    isCreditCard: true,
    cardName: matchedCard.name,
    closingDay,
    dueDay,
    purchaseDate: purchaseDateStr,
    effectiveExpenseDate,
    effectiveMonthLabel,
    invoiceDueDateStr,
  };
}

export async function parseAndFetchAllSheets(authHeader?: string) {
  const customHeaders: Record<string, string> = {};
  if (authHeader) {
    customHeaders['Authorization'] = authHeader;
  }

  const fetchResults: any[] = [];
  let parsedInvestments: any[] = [];
  let parsedExtratoTransactions: any[] = [];
  let parsedCards: any[] = [];
  let parsedSubscriptions: any[] = [];
  let parsedTotaisMatrix: any = null;
  let parsedDebtors: any[] = [];

  let liveTotalIncome = 0;
  let liveTotalExpenses = 0;

  // Fetch real-time USD rate from Google Sheets 'Cotações atuais'!K1 or fallback
  let usdRateCommercial = 5.14;
  try {
    const sheetQuoteUrls = [
      'https://docs.google.com/spreadsheets/d/1fv-MsaKURTBGIB8a3UWfLNKa5Yx6AfHXWTTYPZ1iB3c/gviz/tq?tqx=out:csv&sheet=Cota%C3%A7%C3%B5es%20atuais',
      'https://docs.google.com/spreadsheets/d/1fv-MsaKURTBGIB8a3UWfLNKa5Yx6AfHXWTTYPZ1iB3c/export?format=csv&sheet=Cota%C3%A7%C3%B5es%20atuais'
    ];

    for (const url of sheetQuoteUrls) {
      const rateResp = await fetch(url, { headers: customHeaders });
      if (rateResp.ok) {
        const csvText = await rateResp.text();
        const rows = parseCsvToRows(csvText);
        if (rows.length > 0 && rows[0] && rows[0].length >= 11) {
          const val = parseCleanNumber(rows[0][10]); // Cell K1 is index 10
          if (val > 3 && val < 10) {
            usdRateCommercial = val;
            break;
          }
        }
        for (const row of rows) {
          for (const cell of row) {
            const parsed = parseCleanNumber(cell);
            if (parsed >= 4.5 && parsed <= 7.0) {
              usdRateCommercial = parsed;
              break;
            }
          }
          if (usdRateCommercial !== 5.14) break;
        }
      }
    }
  } catch (sheetQuoteErr) {
    console.warn('Could not fetch quote from Cotações atuais sheet tab:', sheetQuoteErr);
  }

  if (usdRateCommercial === 5.14) {
    try {
      const rateResp = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
      if (rateResp.ok) {
        const rateData = await rateResp.json();
        if (rateData && rateData.USDBRL && rateData.USDBRL.bid) {
          const parsedRate = parseFloat(rateData.USDBRL.bid);
          if (parsedRate > 3 && parsedRate < 10) {
            usdRateCommercial = parsedRate;
          }
        }
      }
    } catch {
      // Keep default 5.14 rate if offline
    }
  }

  const repatriationFeePercent = 1.8;
  const netUsdRate = usdRateCommercial * (1 - repatriationFeePercent / 100);

  let debtorsSummary = { pagouTotal: 0, pegouTotal: 0, restanteTotal: 0 };

  for (const sheet of SHEETS_CONFIG) {
    try {
      let csvText = '';
      let fetchSuccess = false;

      // Primary fetch try
      try {
        const response = await fetch(sheet.url, { headers: customHeaders });
        if (response.status === 200) {
          csvText = await response.text();
          fetchSuccess = true;
        }
      } catch (err) {
        console.warn(`Direct fetch failed for ${sheet.id}, trying gviz/cors proxies`, err);
      }

      // Secondary fallback if primary direct fetch failed or CORS blocked
      if (!fetchSuccess) {
        const gvizUrl = sheet.url.replace('/export?format=csv', '/gviz/tq?tqx=out:csv');
        try {
          const resp = await fetch(gvizUrl, { headers: customHeaders });
          if (resp.ok) {
            csvText = await resp.text();
            fetchSuccess = true;
          }
        } catch {
          // Tertiary fallback via public CORS proxy
          try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(sheet.url)}`;
            const resp = await fetch(proxyUrl);
            if (resp.ok) {
              csvText = await resp.text();
              fetchSuccess = true;
            }
          } catch {
            // Unsuccessful
          }
        }
      }

      if (fetchSuccess && csvText) {
        const trimmed = csvText.trim();
        const isHtmlRedirect =
          trimmed.startsWith('<') ||
          trimmed.includes('<!DOCTYPE html>') ||
          trimmed.includes('accounts.google.com') ||
          trimmed.includes('Sign in');

        if (isHtmlRedirect) {
          fetchResults.push({
            ...sheet,
            status: 'pendente',
            message: 'Planilha privada. Faça login no Google.',
            httpCode: 401,
          });
          continue;
        }

        const rows = parseCsvToRows(csvText);
        if (rows.length < 2) continue;

        const dataRows = rows.slice(1);

        if (sheet.id === 'sheet-extrato') {
          dataRows.forEach((cols, index) => {
            if (cols.length < 2 || !cols[0]) return;

            const rawDate = cols[0] || '';
            let isoDate = '2026-08-01';
            if (rawDate.includes('/')) {
              const parts = rawDate.split('/');
              if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                isoDate = `${year}-${month}-${day}`;
              }
            } else if (rawDate.includes('-')) {
              isoDate = rawDate;
            }

            const rawValStr = cols[1] || '0';
            const rawAmount = parseCleanNumber(rawValStr);
            const description = cols[2] || 'Sem descrição';
            const account = cols[3] || 'Geral';
            const paymentMethod = cols[4] || 'PIX';
            const explicitDueDateStr = cols[5] ? cols[5].trim() : undefined;

            const isIncome = rawAmount > 0;
            const amount = Math.abs(rawAmount);

            if (isIncome) {
              liveTotalIncome += amount;
            } else if (amount > 0) {
              liveTotalExpenses += amount;
            }

            const descLower = description.toLowerCase();
            let category = 'Geral';
            if (descLower.includes('salario') || descLower.includes('salário') || descLower.includes('comissão') || descLower.includes('payt')) {
              category = 'Salário & Renda';
            } else if (descLower.includes('gasolina') || descLower.includes('uber') || descLower.includes('pedagio') || descLower.includes('pedágio')) {
              category = 'Transporte';
            } else if (descLower.includes('mercado') || descLower.includes('fort') || descLower.includes('padaria') || descLower.includes('burguer') || descLower.includes('pizz')) {
              category = 'Alimentação';
            } else if (descLower.includes('tim') || descLower.includes('inter') || descLower.includes('luz')) {
              category = 'Moradia & Contas';
            } else if (descLower.includes('psicó') || descLower.includes('remédio') || descLower.includes('siso')) {
              category = 'Saúde & Bem-Estar';
            } else if (descLower.includes('meli+') || descLower.includes('disney') || descLower.includes('spotify') || descLower.includes('tv')) {
              category = 'Assinaturas & Lazer';
            }

            parsedExtratoTransactions.push({
              id: `tx-sheet-${index}`,
              date: isoDate,
              description,
              category,
              amount,
              type: isIncome ? 'income' : 'expense',
              account,
              paymentMethod,
              invoiceDueDateStr: explicitDueDateStr,
              sourceSheet: 'Google Sheets (Extrato)',
              status: 'concluido',
            });
          });
        }

        if (sheet.id === 'sheet-cartoes') {
          dataRows.forEach((cols, index) => {
            if (!cols[0]) return;
            const name = cols[0];
            const closingDay = parseInt(cols[1] || '1', 10) || 1;
            const dueDay = parseInt(cols[2] || '10', 10) || 10;

            parsedCards.push({
              id: `card-sheet-${index}`,
              name,
              bank: name.includes('Nubank') ? 'Nubank' : name.includes('PicPay') ? 'PicPay' : 'Mercado Pago',
              closingDay,
              dueDay,
              currentInvoice: 0,
              limit: 25000,
              status: 'aberta',
            });
          });
        }

        if (sheet.id === 'sheet-assinaturas') {
          dataRows.forEach((cols, index) => {
            if (!cols[1] && !cols[2]) return;
            const statusStr = (cols[0] || 'Ativa').trim();
            const isActive = statusStr.toLowerCase().includes('ativa');
            const monthlyPrice = parseCleanNumber(cols[1]);
            const serviceName = cols[2] || 'Assinatura';
            const paymentCard = cols[3] || 'Cartão';
            const renewalDayStr = cols[4] || '1';
            const renewalDay = parseInt(renewalDayStr.replace(/\D/g, '') || '1', 10);

            parsedSubscriptions.push({
              id: `sub-sheet-${index}`,
              status: isActive ? 'ativa' : 'pausada',
              serviceName,
              category: 'Recorrentes & Fixos',
              monthlyPrice,
              paymentCard,
              renewalDay,
              active: isActive,
              cancelRecommendation: !isActive,
            });
          });
        }

        if (sheet.id === 'sheet-totais') {
          const headers = rows[0] || [];
          const rawMonths = headers.slice(1).filter((h) => h && !h.toLowerCase().includes('meta'));

          const accountRows: any[] = [];
          const totalsRowMap: Record<string, number> = {};

          dataRows.forEach((cols) => {
            const accountName = (cols[0] || '').trim();
            if (!accountName || accountName.toLowerCase() === 'data') return;

            if (accountName.toLowerCase().startsWith('total')) {
              rawMonths.forEach((mName, idx) => {
                const valStr = cols[idx + 1] || '0';
                const parsedVal = parseCleanNumber(valStr);
                if (parsedVal > 0) {
                  totalsRowMap[mName] = parsedVal;
                }
              });
              return;
            }

            const balances: Record<string, number> = {};
            rawMonths.forEach((mName, idx) => {
              const valStr = cols[idx + 1] || '0';
              balances[mName] = parseCleanNumber(valStr);
            });

            accountRows.push({
              accountName,
              balances,
            });
          });

          parsedTotaisMatrix = {
            months: rawMonths,
            accounts: accountRows,
            totalsRowMap,
          };
        }

        if (sheet.id === 'sheet-devedores') {
          let lastBorrowerName = '';
          let sumPegou = 0;
          let sumPagou = 0;

          dataRows.forEach((cols, index) => {
            let borrowerName = (cols[0] || '').trim();
            const description = (cols[1] || '').trim();
            const rawAmount = cols[2] || '';
            const transactionAmount = parseCleanNumber(rawAmount);
            const statusTag = (cols[3] || '').trim().toLowerCase();

            if (
              borrowerName.toLowerCase() === 'devedor' ||
              description.toLowerCase() === 'descrição' ||
              description.toLowerCase() === 'descricao'
            )
              return;

            if (!borrowerName && !description && transactionAmount === 0 && !statusTag) {
              return;
            }

            if (borrowerName) {
              lastBorrowerName = borrowerName;
            } else if (lastBorrowerName) {
              borrowerName = lastBorrowerName;
            } else {
              borrowerName = 'Outros';
            }

            const isPaid =
              statusTag.includes('pagou') ||
              statusTag === 'pago' ||
              statusTag.includes('devolveu') ||
              statusTag.includes('quitad');

            if (isPaid) {
              sumPagou += transactionAmount;
            } else {
              sumPegou += transactionAmount;
            }

            parsedDebtors.push({
              id: `debtor-sheet-${index}`,
              borrowerName,
              description,
              transactionAmount,
              movement: isPaid ? 'pagou' : 'pegou',
              totalPaid: isPaid ? transactionAmount : 0,
              totalBorrowed: isPaid ? 0 : transactionAmount,
              remainingAmount: isPaid ? 0 : transactionAmount,
              status: isPaid ? 'quitado' : 'pendente',
            });
          });

          debtorsSummary = {
            pagouTotal: sumPagou,
            pegouTotal: sumPegou,
            restanteTotal: Math.max(0, sumPegou - sumPagou),
          };
        }

        if (sheet.id === 'sheet-investimentos') {
          dataRows.forEach((cols, index) => {
            if (!cols[0] || cols[0].toUpperCase() === 'TIKET' || cols[0].toUpperCase() === 'TICKER') return;
            const ticker = cols[0].trim();
            const sharesCount = parseCleanNumber(cols[1]);
            const avgPriceApplied = parseCleanNumber(cols[2]);
            const currentPrice = parseCleanNumber(cols[3]);
            const yieldPercent = parseCleanNumber(cols[4]);
            const usdApplied = parseCleanNumber(cols[6]);
            const usdCurrent = parseCleanNumber(cols[7]);
            const usdVariation = parseCleanNumber(cols[8]);

            if (sharesCount <= 0 && usdApplied <= 0 && usdCurrent <= 0) return;

            const category = ticker.includes('VT') || ticker.includes('SCHD') || ticker.includes('VOO') || ticker.includes('QQQ') || ticker.includes('NVDA') ? 'Internacional' : 'Ações BR';

            parsedInvestments.push({
              id: `inv-sheet-${index}`,
              ticker,
              companyName: ticker,
              name: ticker,
              assetClass: 'ETF / Ação',
              sharesCount,
              averagePrice: avgPriceApplied,
              currentPrice,
              yieldPercent,
              usdChange: usdVariation,
              percentChange: yieldPercent,
              usdApplied,
              usdCurrent,
              category,
              amountInvested: Math.round(usdApplied * netUsdRate),
              currentValue: Math.round(usdCurrent * netUsdRate),
              yieldTotal: Math.round((usdCurrent - usdApplied) * netUsdRate),
              monthlyDividend: 0,
            });
          });
        }

        fetchResults.push({
          ...sheet,
          status: 'conectado',
          message: 'Sincronizado via Google Public CSV API',
          linesCount: dataRows.length,
          httpCode: 200,
        });
      } else {
        fetchResults.push({
          ...sheet,
          status: 'erro',
          message: 'Falha ao baixar dados da planilha. Verifique permissões.',
          httpCode: 400,
        });
      }
    } catch (sheetErr: any) {
      fetchResults.push({
        ...sheet,
        status: 'erro',
        message: sheetErr.message || 'Falha ao conectar com Google Sheets',
        httpCode: 500,
      });
    }
  }

  // Post-processing: Attach credit card invoice dates to transactions
  // and compute credit card current invoices for active month
  let effectiveTotalExpensesCurrentMonth = 0;

  parsedExtratoTransactions = parsedExtratoTransactions.map((tx) => {
    const timing = calculateEffectiveInvoiceDate(
      tx.date,
      tx.account || 'Geral',
      tx.paymentMethod || 'PIX',
      parsedCards,
      tx.invoiceDueDateStr
    );

    const updatedTx = {
      ...tx,
      purchaseDate: tx.date,
      effectiveExpenseDate: timing.effectiveExpenseDate,
      effectiveMonthLabel: timing.effectiveMonthLabel,
      isCreditCard: timing.isCreditCard,
      cardName: timing.cardName,
      invoiceDueDateStr: timing.invoiceDueDateStr,
    };

    if (tx.type === 'expense') {
      // If effective expense month is "Agosto 2026", add to current month expense!
      if (timing.effectiveMonthLabel === 'Agosto 2026') {
        effectiveTotalExpensesCurrentMonth += tx.amount;
      }
    }

    return updatedTx;
  });

  // Calculate current invoice sums for each credit card for August 2026
  parsedCards = parsedCards.map((card) => {
    const cardInvoicesSum = parsedExtratoTransactions
      .filter((tx) => tx.type === 'expense' && tx.isCreditCard && tx.cardName === card.name && tx.effectiveMonthLabel === 'Agosto 2026')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      ...card,
      currentInvoice: cardInvoicesSum,
    };
  });

  if (effectiveTotalExpensesCurrentMonth > 0) {
    liveTotalExpenses = effectiveTotalExpensesCurrentMonth;
  }

  return {
    success: true,
    sheets: fetchResults,
    transactions: parsedExtratoTransactions,
    cards: parsedCards,
    subscriptions: parsedSubscriptions,
    debtors: parsedDebtors,
    investments: parsedInvestments,
    totaisMatrix: parsedTotaisMatrix,
    currentMonthSummary: {
      totalIncome: liveTotalIncome,
      totalExpenses: liveTotalExpenses,
      leftover: liveTotalIncome - liveTotalExpenses,
    },
    usdRate: usdRateCommercial,
    repatriationFeePercent,
    netUsdRate,
    debtorsSummary,
  };
}
