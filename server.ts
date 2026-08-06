import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Helper to parse CSV lines into rows of string cells
function parseCsvToRows(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines.map(line => {
    const cols = line.match(/(".*?"|[^",;\t]+)(?=\s*[,;\t]|\s*$)/g) || line.split(/[,;\t]/);
    return cols.map(c => c.replace(/^["']|["']$/g, '').trim());
  });
}

// Helper to convert currency/numeric strings cleanly
function parseCleanNumber(val: string): number {
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

// Intelligent column mapping detector
function detectColumnIndexes(headerRow: string[]) {
  const headers = headerRow.map(h => h.toLowerCase());
  
  let dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date') || h.includes('dia') || h.includes('fechamento'));
  let descIdx = headers.findIndex(h => h.includes('descri') || h.includes('hist') || h.includes('nome') || h.includes('item') || h.includes('detalhe') || h.includes('estabelecimento') || h.includes('ticker') || h.includes('ação') || h.includes('acao'));
  let categoryIdx = headers.findIndex(h => h.includes('categ') || h.includes('grupo') || h.includes('classe') || h.includes('tag'));
  let amountIdx = headers.findIndex(h => h.includes('valor') || h.includes('monto') || h.includes('amount') || h.includes('total') || h.includes('saldo') || h.includes('preço') || h.includes('preco') || h.includes('gasto') || h.includes('custo') || h.includes('saida') || h.includes('saída') || h.includes('receita'));
  let typeIdx = headers.findIndex(h => h.includes('tipo') || h.includes('operac') || h.includes('operação') || h.includes('natureza') || h.includes('movimento'));

  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = Math.min(1, headerRow.length - 1);
  if (categoryIdx === -1) categoryIdx = Math.min(2, headerRow.length - 1);
  if (amountIdx === -1) amountIdx = Math.min(3, headerRow.length - 1);
  if (typeIdx === -1) typeIdx = Math.min(4, headerRow.length - 1);

  return { dateIdx, descIdx, categoryIdx, amountIdx, typeIdx };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint to fetch and parse live Google Sheets
  app.get('/api/fetch-sheets', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const customHeaders: Record<string, string> = {};
      if (authHeader) {
        customHeaders['Authorization'] = authHeader;
      }

      const sheetsConfig = [
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
        }
      ];

      const fetchResults: any[] = [];
      let parsedInvestments: any[] = [];
      let parsedExtratoTransactions: any[] = [];
      let parsedCards: any[] = [];
      let parsedSubscriptions: any[] = [];
      let parsedTotaisMatrix: any = null;
      let parsedDebtors: any[] = [];

      let liveTotalIncome = 0;
      let liveTotalExpenses = 0;

      // Fetch real-time USD/BRL rate from AwesomeAPI
      let usdRateCommercial = 5.50;
      try {
        const rateResp = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { signal: AbortSignal.timeout(3000) });
        if (rateResp.ok) {
          const rateData = await rateResp.json();
          if (rateData && rateData.USDBRL && rateData.USDBRL.bid) {
            const parsedRate = parseFloat(rateData.USDBRL.bid);
            if (parsedRate > 3 && parsedRate < 10) {
              usdRateCommercial = parsedRate;
            }
          }
        }
      } catch (e) {
        console.warn('Could not fetch live USD rate, using default rate');
      }

      const repatriationFeePercent = 1.8;
      const netUsdRate = usdRateCommercial * (1 - repatriationFeePercent / 100);

      let debtorsSummary = { pagouTotal: 0, pegouTotal: 0, restanteTotal: 0 };

      for (const sheet of sheetsConfig) {
        try {
          const response = await fetch(sheet.url, { headers: customHeaders });
          if (response.status === 200) {
            const csvText = await response.text();
            const trimmed = csvText.trim();
            const isHtmlRedirect = trimmed.startsWith('<') || trimmed.includes('<!DOCTYPE html>') || trimmed.includes('accounts.google.com') || trimmed.includes('Sign in');

            if (isHtmlRedirect) {
              fetchResults.push({
                ...sheet,
                status: 'pendente',
                message: 'Autenticado com a conta proprietária. Faça login no Google para visualizar.',
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
                // Format DD/MM/YYYY to YYYY-MM-DD
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

                const isIncome = rawAmount > 0;
                const amount = Math.abs(rawAmount);

                if (isIncome) {
                  liveTotalIncome += amount;
                } else if (amount > 0) {
                  liveTotalExpenses += amount;
                }

                // Categorization helper
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
                  sourceSheet: 'Google Sheets (Extrato)',
                  status: 'concluido'
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
                  currentInvoice: 0, // Calculated dynamically from extrato
                  limit: 25000,
                  status: 'aberta'
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
                  cancelRecommendation: !isActive
                });
              });
            }

            if (sheet.id === 'sheet-totais') {
              // Parse Header row for Months (e.g. Contas | Maio | Junho | julho | agosto ...)
              const headers = rows[0] || [];
              const rawMonths = headers.slice(1).filter(h => h && !h.toLowerCase().includes('meta'));
              
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

                accountRows.push({ accountName, balances });
              });

              parsedTotaisMatrix = { months: rawMonths, accounts: accountRows, totalsRowMap };
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
                const statusTag = (cols[3] || '').trim().toLowerCase(); // 'pegou' or 'pagou'

                // Skip header if it says 'devedor' or 'descrição'
                if (borrowerName.toLowerCase() === 'devedor' || description.toLowerCase() === 'descrição' || description.toLowerCase() === 'descricao') return;

                // Skip completely empty rows
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

                // Determine movement: 'pagou' vs 'pegou'
                const isPaid = statusTag.includes('pagou') || statusTag === 'pago' || statusTag.includes('devolveu') || statusTag.includes('quitad');

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
                  status: isPaid ? 'quitado' : 'pendente'
                });
              });

              debtorsSummary = {
                pagouTotal: sumPagou,
                pegouTotal: sumPegou,
                restanteTotal: Math.max(0, sumPegou - sumPagou)
              };
            }

            if (sheet.id === 'sheet-investimentos') {
              dataRows.forEach((cols, index) => {
                if (!cols[0] || cols[0].toUpperCase() === 'TIKET' || cols[0].toUpperCase() === 'TICKER') return;
                const ticker = cols[0].trim();
                const companyName = cols[1] || ticker;
                const assetClass = cols[2] || 'Ações EUA';
                const sharesCount = parseCleanNumber(cols[3]);
                const averagePrice = parseCleanNumber(cols[4]);
                const currentPrice = parseCleanNumber(cols[5]);
                const usdChange = parseCleanNumber(cols[6]);
                const percentChange = parseCleanNumber(cols[7]);
                const usdApplied = parseCleanNumber(cols[8]);
                const usdCurrent = parseCleanNumber(cols[9]);

                // Filter out zero assets as requested
                if (sharesCount <= 0 || (usdCurrent <= 0 && currentPrice <= 0)) return;

                const amountInvestedBRL = Math.round((usdApplied || (sharesCount * averagePrice)) * netUsdRate);
                const currentValueBRL = Math.round((usdCurrent || (sharesCount * currentPrice)) * netUsdRate);

                parsedInvestments.push({
                  id: `inv-sheet-${index}`,
                  ticker,
                  companyName,
                  assetClass,
                  sharesCount,
                  averagePrice,
                  currentPrice,
                  usdChange,
                  percentChange,
                  usdApplied,
                  usdCurrent,
                  name: `${companyName} (${ticker})`,
                  category: 'Internacional',
                  amountInvested: amountInvestedBRL,
                  currentValue: currentValueBRL,
                  yieldPercent: percentChange || (usdApplied > 0 ? parseFloat((((usdCurrent - usdApplied) / usdApplied) * 100).toFixed(2)) : 0),
                  monthlyDividend: 0
                });
              });
            }

            fetchResults.push({
              ...sheet,
              status: 'conectado',
              message: 'Sincronizado automaticamente',
              linesCount: dataRows.length,
            });
          } else {
            fetchResults.push({
              ...sheet,
              status: 'pendente',
              message: response.status === 401 ? 'Acesso privado' : `Erro HTTP ${response.status}`,
              httpCode: response.status
            });
          }
        } catch (err: any) {
          fetchResults.push({
            ...sheet,
            status: 'erro',
            message: `Erro ao acessar planilha: ${err.message}`,
          });
        }
      }

      res.json({
        success: true,
        sheets: fetchResults,
        transactions: parsedExtratoTransactions.length > 0 ? parsedExtratoTransactions : undefined,
        cards: parsedCards.length > 0 ? parsedCards : undefined,
        subscriptions: parsedSubscriptions.length > 0 ? parsedSubscriptions : undefined,
        totaisMatrix: parsedTotaisMatrix,
        debtors: parsedDebtors.length > 0 ? parsedDebtors : undefined,
        investments: parsedInvestments.length > 0 ? parsedInvestments : undefined,
        liveSummary: liveTotalIncome > 0 || liveTotalExpenses > 0 ? {
          totalIncome: liveTotalIncome,
          totalExpenses: liveTotalExpenses,
          leftover: liveTotalIncome - liveTotalExpenses,
        } : undefined,
        usdRate: usdRateCommercial,
        repatriationFeePercent,
        netUsdRate,
        debtorsSummary,
      });
    } catch (err: any) {
      console.error('Error fetching sheets:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Smart fallback generator for when Gemini is rate-limited or unavailable
  function generateSmartFallback(payload: any) {
    const { month, leftover, totalDebts, activeSubscriptions } = payload || {};
    const formattedLeftover = typeof leftover === 'number' ? `R$ ${leftover.toLocaleString('pt-BR')}` : 'sua sobra atual';

    const recs = [];

    if (leftover && leftover > 0) {
      recs.push({
        type: 'investment',
        title: 'Aporte de Sobra Líquida',
        description: `Sua sobra de ${formattedLeftover} em ${month || 'agosto'} pode ser alocada 70% em Tesouro IPCA/CDB de liquidez e 30% em FIIs de dividendos.`,
        impact: '+12.8% a.a. estimado'
      });
    } else {
      recs.push({
        type: 'saving',
        title: 'Ajuste de Custos Variáveis',
        description: 'Suas despesas estão próximas da receita total. Revise saídas não essenciais para garantir uma margem de reserva de ao menos 15%.',
        impact: 'Meta: 15% de sobra'
      });
    }

    if (totalDebts && totalDebts > 0) {
      recs.push({
        type: 'debt',
        title: 'Amortização Estratégica de Dívidas',
        description: `Com o saldo de R$ ${totalDebts.toLocaleString('pt-BR')} em dívidas, utilize o método bola de neve priorizando os juros mais altos.`,
        impact: 'Redução drástica de juros'
      });
    } else {
      recs.push({
        type: 'saving',
        title: 'Otimização de Assinaturas',
        description: `Com ${activeSubscriptions || 3} assinaturas recorrentes ativas, revisar serviços com pouca utilização pode gerar economia imediata.`,
        impact: 'Economia est. R$ 120/mês'
      });
    }

    recs.push({
      type: 'alert',
      title: 'Monitoramento Semanal de Fluxo',
      description: 'Sua sincronização de planilhas está ativa. Mantenha os lançamentos semanais atualizados para manter previsibilidade de caixa.',
      impact: 'Controle total de caixa'
    });

    return recs;
  }

  // In-memory cache for AI recommendations to respect API rate limits
  const aiCache = new Map<string, { data: any; expiresAt: number }>();

  // AI Recommendation endpoint using Gemini SDK
  app.post('/api/ai-recommendations', async (req, res) => {
    const payload = req.body || {};
    const cacheKey = `${payload.month || 'default'}_${payload.totalIncome}_${payload.totalExpenses}_${payload.leftover}`;
    
    // Check cache (15-minute TTL)
    const cached = aiCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return res.json(cached.data);
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const fallbackRes = { recommendations: generateSmartFallback(payload), source: 'smart_fallback' };
        aiCache.set(cacheKey, { data: fallbackRes, expiresAt: Date.now() + 15 * 60 * 1000 });
        return res.json(fallbackRes);
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Você é um consultor financeiro pessoal altamente qualificado e empático.
Analise os seguintes dados financeiros do usuário para o mês de ${payload.month || 'mês atual'}:
- Renda Total: R$ ${payload.totalIncome}
- Despesas Totais: R$ ${payload.totalExpenses}
- Sobra Mensal: R$ ${payload.leftover}
- Total em Investimentos: R$ ${payload.totalInvestments}
- Total em Dívidas: R$ ${payload.totalDebts}
- Número de Assinaturas Ativas: ${payload.activeSubscriptions}

Forneça exatamente 3 recomendações acionáveis, diretas e motivadoras no formato JSON puro com a seguinte estrutura de schema:
[
  {
    "type": "saving" | "investment" | "debt" | "alert",
    "title": "Título sucinto",
    "description": "Explicação detalhada e prática do que fazer em português (2-3 frases)",
    "impact": "Estimativa de impacto financeiro curto (ex: 'Economia de R$ 340/mês' ou '+12.5% a.a.')"
  }
]
Forneça apenas o array JSON válido sem markdown extra.`;

      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });
        responseText = response.text || '';
      } catch (geminiError: any) {
        // Quietly fallback without printing raw API error JSON to server stdout/stderr
        console.log('[AI Recommendations] Quota or API limit reached, serving smart fallback recommendations.');
        const fallbackRes = { recommendations: generateSmartFallback(payload), source: 'smart_fallback' };
        aiCache.set(cacheKey, { data: fallbackRes, expiresAt: Date.now() + 15 * 60 * 1000 });
        return res.json(fallbackRes);
      }

      let recommendations = [];
      try {
        recommendations = JSON.parse(responseText);
      } catch (parseErr) {
        recommendations = generateSmartFallback(payload);
      }

      const successRes = { recommendations, source: 'gemini' };
      aiCache.set(cacheKey, { data: successRes, expiresAt: Date.now() + 15 * 60 * 1000 });
      res.json(successRes);
    } catch (err: any) {
      console.log('[AI Recommendations] Endpoint handled request with fallback.');
      const fallbackRes = { recommendations: generateSmartFallback(payload), source: 'smart_fallback' };
      res.json(fallbackRes);
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
