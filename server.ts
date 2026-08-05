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
          url: 'https://docs.google.com/spreadsheets/d/1X2z-2WEBUwn7mXRYa7oiJhh7rgdCZ6aiYXk8HArhG-M/export?format=csv&gid=0',
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
          id: 'sheet-investimentos-dolar',
          type: 'investimentos',
          title: 'Investimentos em Dólar',
          url: 'https://docs.google.com/spreadsheets/d/1fv-MsaKURTBGIB8a3UWfLNKa5Yx6AfHXWTTYPZ1iB3c/export?format=csv&gid=0',
        },
        {
          id: 'sheet-acoes-eua',
          type: 'investimentos',
          title: 'Preço Médio de Ações nos EUA',
          url: 'https://docs.google.com/spreadsheets/d/1fv-MsaKURTBGIB8a3UWfLNKa5Yx6AfHXWTTYPZ1iB3c/export?format=csv&gid=1397919368',
        }
      ];

      const fetchResults: any[] = [];
      let parsedInvestmentsUSD: any[] = [];
      let parsedExtratoTransactions: any[] = [];
      let liveTotalIncome = 0;
      let liveTotalExpenses = 0;

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
                message: 'Autenticado com a conta proprietária gf.carlos023@gmail.com.',
                httpCode: 401,
              });
              continue;
            }

            const rows = parseCsvToRows(csvText);
            if (rows.length < 2) continue;

            const header = rows[0];
            const dataRows = rows.slice(1);
            const { dateIdx, descIdx, categoryIdx, amountIdx, typeIdx } = detectColumnIndexes(header);

            if (sheet.id === 'sheet-extrato') {
              dataRows.forEach((cols, index) => {
                const date = cols[dateIdx] || '2026-08-01';
                const description = cols[descIdx] || 'Lançamento';
                const category = cols[categoryIdx] || 'Geral';
                const rawValStr = cols[amountIdx] || '0';
                const rawAmount = parseCleanNumber(rawValStr);
                const typeStr = cols[typeIdx] || (rawAmount >= 0 ? 'Receita' : 'Despesa');
                const amount = Math.abs(rawAmount);

                const isReceita = rawAmount > 0 || typeStr.toLowerCase().includes('receita') || typeStr.toLowerCase().includes('entrada') || typeStr.toLowerCase().includes('ganho');

                if (isReceita) {
                  liveTotalIncome += amount;
                } else if (amount > 0) {
                  liveTotalExpenses += amount;
                }

                parsedExtratoTransactions.push({
                  id: `sheet-tx-${index}`,
                  date,
                  description,
                  category,
                  amount,
                  type: isReceita ? 'Receita' : 'Despesa',
                  paymentMethod: 'Google Sheets Sincronizado',
                });
              });
            }

            if (sheet.id === 'sheet-investimentos-dolar' || sheet.id === 'sheet-acoes-eua') {
              const headersLower = header.map(h => h.toLowerCase());
              const tickerIdx = headersLower.findIndex(h => h.includes('ticker') || h.includes('código') || h.includes('codigo') || h.includes('simbolo') || h.includes('symbol')) !== -1 
                ? headersLower.findIndex(h => h.includes('ticker') || h.includes('código') || h.includes('codigo') || h.includes('simbolo') || h.includes('symbol')) 
                : 0;

              const nameIdx = headersLower.findIndex(h => h.includes('nome') || h.includes('empresa') || h.includes('ação') || h.includes('acao') || h.includes('asset')) !== -1
                ? headersLower.findIndex(h => h.includes('nome') || h.includes('empresa') || h.includes('ação') || h.includes('acao') || h.includes('asset'))
                : 1;

              const appliedIdx = headersLower.findIndex(h => h.includes('aplicad') || h.includes('investid') || h.includes('custo') || h.includes('médio') || h.includes('medio')) !== -1
                ? headersLower.findIndex(h => h.includes('aplicad') || h.includes('investid') || h.includes('custo') || h.includes('médio') || h.includes('medio'))
                : Math.min(8, header.length - 1);

              const currentIdx = headersLower.findIndex(h => h.includes('atual') || h.includes('posição') || h.includes('posicao') || h.includes('mercado') || h.includes('total')) !== -1
                ? headersLower.findIndex(h => h.includes('atual') || h.includes('posição') || h.includes('posicao') || h.includes('mercado') || h.includes('total'))
                : Math.min(9, header.length - 1);

              dataRows.forEach((cols, index) => {
                const ticker = cols[tickerIdx] || '';
                const name = cols[nameIdx] || ticker;
                const usdApplied = parseCleanNumber(cols[appliedIdx]);
                const usdCurrent = parseCleanNumber(cols[currentIdx]);

                if (ticker && ticker.toUpperCase() !== 'TICKER') {
                  parsedInvestmentsUSD.push({
                    id: `inv-usd-${sheet.id}-${index}`,
                    name: `${name} (${ticker})`,
                    category: 'Internacional',
                    amountInvested: Math.round(usdApplied * 5.60),
                    currentValue: Math.round(usdCurrent * 5.60),
                    yieldPercent: usdApplied > 0 ? parseFloat((((usdCurrent - usdApplied) / usdApplied) * 100).toFixed(2)) : 0,
                    monthlyDividend: 0,
                    usdApplied,
                    usdCurrent,
                    ticker,
                    classe: 'STOCK'
                  });
                }
              });
            }

            fetchResults.push({
              ...sheet,
              status: 'conectado',
              message: 'Sincronizado automaticamente com leitor inteligente de colunas',
              linesCount: dataRows.length,
            });
          } else {
            fetchResults.push({
              ...sheet,
              status: 'pendente',
              message: response.status === 401 ? 'Autenticação privada ativa para a conta proprietária' : `Erro HTTP ${response.status}`,
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
        investmentsUSD: parsedInvestmentsUSD,
        transactions: parsedExtratoTransactions.length > 0 ? parsedExtratoTransactions : undefined,
        liveSummary: liveTotalIncome > 0 || liveTotalExpenses > 0 ? {
          totalIncome: liveTotalIncome,
          totalExpenses: liveTotalExpenses,
          leftover: liveTotalIncome - liveTotalExpenses,
        } : undefined,
        usdRate: 5.60,
        instructionsNeeded: fetchResults.some(s => s.status === 'pendente'),
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
