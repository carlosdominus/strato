import { parseAndFetchAllSheets } from '../src/utils/sheetParser';

export default async function handler(req: any, res: any) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const data = await parseAndFetchAllSheets(authHeader);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Error processing sheet data',
    });
  }
}
