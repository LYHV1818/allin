// api/submit.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  // 允许同域/跨域提交
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { name, birth, gender, topic, contact, utm = {}, url = '', ua = '' } = req.body || {};
    if (!name || !birth) return res.status(400).json({ ok:false, message:'缺少必填字段' });

    // —— 私钥规范化：处理多种粘贴姿势 —— //
    let raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
    raw = raw.trim();
    // 去掉首尾误粘的引号
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1);
    }
    // 如果是单行带 \n 的形式，转为真实换行
    let key = raw.replace(/\\n/g, '\n');

    // 如果看起来像 base64（你改用 base64 存储也能用）
    if (!key.includes('BEGIN PRIVATE KEY') && /^[A-Za-z0-9+/=\n\r]+$/.test(key)) {
      try {
        const decoded = Buffer.from(key, 'base64').toString('utf8');
        if (decoded.includes('BEGIN PRIVATE KEY')) key = decoded;
      } catch { /* 忽略，继续用当前 key */ }
    }
    key = key.trim();

    // 基础校验，提前给出明确报错
    if (!key.includes('BEGIN PRIVATE KEY') || !key.includes('END PRIVATE KEY')) {
      throw new Error('Invalid private key format: missing PEM headers');
    }

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const sheetName     = process.env.GOOGLE_SHEETS_TAB || 'Sheet1';

    const timestamp = new Date().toISOString();
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';

    const values = [[
      timestamp, name, birth, gender || '', topic || '', contact || '',
      JSON.stringify(utm), url, ua, ip
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return res.status(200).json({ ok:true });
  } catch (e) {
    const msg = e?.response?.data || e?.errors || e?.message || String(e);
    console.error('Submit error:', msg);
    return res.status(500).json({ ok:false, message: msg });
  }
}
