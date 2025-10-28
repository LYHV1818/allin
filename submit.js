// api/submit.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { name, birth, gender, topic, contact, utm = {}, url = '', ua = '' } = req.body || {};
    if (!name || !birth) return res.status(400).json({ ok:false, message:'缺少必填字段' });

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\n/g, '\n').replace('\\n','\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const sheetName = process.env.GOOGLE_SHEETS_TAB || 'Sheet1';

    const timestamp = new Date().toISOString();
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '';

    const values = [[
      timestamp, name, birth, gender || '', topic || '', contact || '',
      JSON.stringify(utm), url, ua, ip
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    return res.status(200).json({ ok:true });
  } catch (e) {
    console.error('Submit error:', e);
    return res.status(500).json({ ok:false, message: 'Server Error' });
  }
}
