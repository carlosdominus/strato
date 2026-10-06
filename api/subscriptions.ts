import { appendRecurringCharge, NewRecurringCharge } from '../src/utils/sheetWriter';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const authorization = req.headers.authorization || req.headers.Authorization || '';
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!accessToken || accessToken === 'local-authorized-session') {
    return res.status(401).json({ error: 'Conecte sua conta Google para gravar a assinatura na planilha.' });
  }

  const body = req.body || {};
  const serviceName = typeof body.serviceName === 'string' ? body.serviceName.trim() : '';
  const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : '';
  const monthlyPrice = Number(body.monthlyPrice);
  const renewalDay = Number(body.renewalDay);
  if (!serviceName || !paymentMethod || !Number.isFinite(monthlyPrice) || monthlyPrice <= 0 || !Number.isInteger(renewalDay) || renewalDay < 1 || renewalDay > 31) {
    return res.status(400).json({ error: 'Informe nome, valor, forma de pagamento e dia de cobrança válidos.' });
  }

  try {
    const updatedRange = await appendRecurringCharge(accessToken, {
      serviceName,
      paymentMethod,
      monthlyPrice,
      renewalDay,
    } satisfies NewRecurringCharge);
    return res.status(201).json({ success: true, updatedRange });
  } catch (error: any) {
    return res.status(502).json({ error: error.message || 'Falha ao gravar a assinatura na planilha.' });
  }
}
