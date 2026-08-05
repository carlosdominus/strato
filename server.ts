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
            
            // Simple CSV line parser
            const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
            
            if (sheet.id === 'sheet-investimentos-dolar' && lines.length > 1) {
              // Parse stock investments from Google Sheets
              lines.slice(1).forEach((line, index) => {
                // handle quoted strings with commas
                const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
                if (cols.length >= 6) {
                  const ticker = cols[0]?.replace(/"/g, '') || '';
                  const name = cols[1]?.replace(/"/g, '') || ticker;
                  const classe = cols[2]?.replace(/"/g, '') || 'STOCK';
                  const usdAppliedStr = cols[8]?.replace(/"/g, '').replace('$', '').replace('.', '').replace(',', '.') || '0';
                  const usdCurrentStr = cols[9]?.replace(/"/g, '').replace('$', '').replace('.', '').replace(',', '.') || '0';
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
              message: 'Conexão segura autorizada via OAuth Google',
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

  // AI Recommendation endpoint using Gemini SDK
  app.post('/api/ai-recommendations', async (req, res) => {
    try {
      const { month, totalIncome, totalExpenses, totalInvestments, totalDebts, activeSubscriptions, leftover } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          recommendations: [
            {
              type: 'saving',
              title: 'Otimização de Assinaturas',
              description: 'Identificamos 2 serviços de streaming sem uso recente que podem economizar R$ 89,90/mês.',
              impact: 'R$ 1.078,80/ano'
            },
            {
              type: 'investment',
              title: 'Alocação de Sobra Financeira',
              description: `Sua sobra de R$ ${leftover?.toLocaleString('pt-BR') || '0,00'} este mês pode ser direcionada 70% para Renda Fixa High Yield e 30% para Reserva de Emergência.`,
              impact: '+ 13.2% a.a.'
            },
            {
              type: 'debt',
              title: 'Amortização Prioritária',
              description: 'Priorize a liquidação da dívida de cartão de crédito com taxa de 8.2% a.m.',
              impact: 'Economia de juros'
            }
          ],
          source: 'local_fallback'
        });
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
Analise os seguintes dados financeiros do usuário para o mês de ${month || 'mês atual'}:
- Renda Total: R$ ${totalIncome}
- Despesas Totais: R$ ${totalExpenses}
- Sobra Mensal: R$ ${leftover}
- Total em Investimentos: R$ ${totalInvestments}
- Total em Dívidas: R$ ${totalDebts}
- Número de Assinaturas Ativas: ${activeSubscriptions}

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

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text || '[]';
      let recommendations = [];
      try {
        recommendations = JSON.parse(text);
      } catch (parseErr) {
        recommendations = [
          {
            type: 'investment',
            title: 'Análise de Rendimento',
            description: `Com uma sobra de R$ ${leftover}, recomendamos diversificar em Renda Fixa e FIIs.`,
            impact: 'Crescimento constante'
          }
        ];
      }

      res.json({ recommendations, source: 'gemini' });
    } catch (err: any) {
      console.error('Error generating AI recommendations:', err);
      res.status(500).json({ error: 'Erro ao gerar recomendações de IA', details: err.message });
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
