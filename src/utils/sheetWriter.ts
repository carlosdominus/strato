export interface NewRecurringCharge {
  serviceName: string;
  monthlyPrice: number;
  paymentMethod: string;
  renewalDay: number;
}

const SPREADSHEET_ID = '1X2z-2WEBUwn7mXRYa7oiJhh7rgdCZ6aiYXk8HArhG-M';
const SUBSCRIPTIONS_SHEET_ID = 1972460113;

export async function appendRecurringCharge(accessToken: string, charge: NewRecurringCharge): Promise<string> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const metadataResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties(sheetId,title)`,
    { headers }
  );

  if (!metadataResponse.ok) {
    const details = await metadataResponse.text();
    throw new Error(`Não foi possível acessar a planilha (${metadataResponse.status}): ${details}`);
  }

  const metadata = await metadataResponse.json();
  const sheet = metadata.sheets?.find((item: any) => item.properties?.sheetId === SUBSCRIPTIONS_SHEET_ID);
  if (!sheet?.properties?.title) {
    throw new Error('A aba de assinaturas não foi encontrada na planilha conectada.');
  }

  const range = encodeURIComponent(`${sheet.properties.title}!A:E`);
  const appendResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: [['Ativa', charge.monthlyPrice, charge.serviceName, charge.paymentMethod, charge.renewalDay]],
      }),
    }
  );

  if (!appendResponse.ok) {
    const details = await appendResponse.text();
    throw new Error(`Não foi possível gravar na planilha (${appendResponse.status}): ${details}`);
  }

  const result = await appendResponse.json();
  return result.updates?.updatedRange || '';
}
