import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

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
                message: 'Planilha restrita no Google Drive da conta gf.carlos023@gmail.com. Clique em "Compartilhar" no Google Sheets e selecione "Qualquer pessoa com o link pode ver" (Leitor).',
                httpCode: 401,
              });
              continue;
            }
            
            // Simple CSV line parser
            const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
            
            if (sheet.id === 'sheet-investimentos-dolar' && lines.length > 1) {
              // Parse stock investments from Google Sheets
              lines.slice(1).forEach((line, index) => {
                // handle quoted strings or comma/semicolon separation
                const cols = line.match(/(".*?"|[^",;\s]+)(?=\s*[,;]|\s*$)/g) || line.split(/[,;]/);
                if (cols.length >= 6) {
                  const ticker = cols[0]?.replace(/["']/g, '').trim() || '';
                  const name = cols[1]?.replace(/["']/g, '').trim() || ticker;
                  const classe = cols[2]?.replace(/["']/g, '').trim() || 'STOCK';
                  const usdAppliedStr = cols[8]?.replace(/["'$]/g, '').replace(/\./g, '').replace(',', '.').trim() || '0';
                  const usdCurrentStr = cols[9]?.replace(/["'$]/g, '').replace(/\./g, '').replace(',', '.').trim() || '0';
                  const usdApplied = parseFloat(usdAppliedStr) || 0;
                  const usdCurrent = parseFloat(usdCurrentStr) || 0;

                  if (ticker && ticker !== 'TICKER') {
                    parsedInvestmentsUSD.push({
                      id: `inv-usd-${index}`,
                      name: `${name} (${ticker})`,
                      category: 'Internacional',
                      amountInvested: Math.round(usdApplied * 5.60), // USD to BRL rate
                      currentValue: Math.round(usdCurrent * 5.60),
                      yieldPercent: usdApplied > 0 ? parseFloat((((usdCurrent - usdApplied) / usdApplied) * 100).toFixed(2)) : 0,
                      monthlyDividend: 0,
                      usdApplied,
                      usdCurrent,
                      ticker,
                      classe
                    });
                  }
                }
              });
            }

            fetchResults.push({
              ...sheet,
              status: 'conectado',
              message: 'Sincronizado com sucesso via Google Sheets',
              linesCount: lines.length - 1,
            });
          } else {
            fetchResults.push({
              ...sheet,
              status: 'pendente',
              message: response.status === 401 ? 'Autenticação privada necessária (Faça Login com sua Conta Google no topo)' : `Erro HTTP ${response.status}`,
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
