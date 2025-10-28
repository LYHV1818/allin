# 善靈師姐（姻緣命理館）Vercel 部署包

包含：index.html、api/submit.js、package.json、vercel.json、hero.webp。

## 部署
1) 把整個文件夾上傳到 GitHub 倉庫（根目錄包含 index.html 與 /api）
2) 在 Vercel Import 該倉庫：Framework Preset 選 Other，Build/Output 留空，Deploy

## Google Sheets 連接
- Google Cloud 建服務帳號並啟用 Sheets API；把服務帳號 Email 加為 Google Sheet 的可編輯者
- Vercel → Settings → Environment Variables：
  - GOOGLE_SERVICE_ACCOUNT_EMAIL
  - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY  （注意把換行寫成 \n）
  - GOOGLE_SHEETS_ID
  - GOOGLE_SHEETS_TAB（可選，預設 Sheet1）
- 然後在 Vercel 重新部署（Redeploy）

## 測試
- 開頁填表 → 應在 Google Sheet 新增一行資料
- 點 “私訊 Messenger 立即測算” → 優先拉起 App，否則 1s 後回退到 m.me

部署時間：2025-10-27T15:25:36.251118Z
