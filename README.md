# Sistem Jimpitan Digital

Aplikasi web untuk manajemen sistem jimpitan digital dengan integrasi Google Sheets dan Telegram.

## Fitur Utama
- ✅ Input transaksi (Setor & Tarik)
- ✅ Manajemen data nasabah
- ✅ Dashboard statistik real-time
- ✅ Cek saldo per nasabah
- ✅ Notifikasi Telegram otomatis
- ✅ PWA (Progressive Web App)

## Teknologi
- HTML5, CSS3, JavaScript (Vanilla)
- Google Apps Script (Backend)
- Google Sheets (Database)
- Telegram Bot API (Notifikasi)

## Setup

### 1. Google Apps Script
1. Buka [script.google.com](https://script.google.com)
2. Buat script baru dan salin kode dari `gas-script.js`
3. Deploy sebagai Web App:
   - Execute as: Me
   - Who has access: Anyone

### 2. Update API URL
Di file `index.html`, ganti URL:
```javascript
const API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
