# Google Sheets Real-time Dashboard

Web aplikasi yang terhubung dengan Google Sheets secara real-time menggunakan Cloudflare Workers dan Express.js untuk development lokal.

## Fitur

- 📊 **Real-time Dashboard** - Menampilkan data dari Google Sheets secara real-time
- 🔄 **Auto Refresh** - Otomatis refresh data setiap 30 detik
- 🔍 **Search & Filter** - Pencarian dan filter data berdasarkan keyword dan status
- 📱 **Responsive Design** - Tampilan optimal di desktop dan mobile
- 🚀 **Cloudflare Workers** - Deployment cepat dan scalable
- 🔒 **Secure API** - Koneksi aman ke Google Sheets API

## Teknologi yang Digunakan

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Cloudflare Workers / Express.js
- **API**: Google Sheets API v4
- **Deployment**: Cloudflare Workers / Node.js

## Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd google-sheets-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Google Sheets API

#### Mendapatkan API Key:
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Aktifkan Google Sheets API
4. Buat kredensial (API Key)
5. Salin API Key yang dihasilkan

#### Mendapatkan Spreadsheet ID:
1. Buka Google Sheets yang ingin digunakan
2. Salin ID dari URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Pastikan sheet memiliki permissions untuk public viewing atau sharing

### 4. Set Environment Variables

#### Untuk Development Lokal:
```bash
export GOOGLE_SHEETS_API_KEY="your-google-sheets-api-key"
export SPREADSHEET_ID="your-spreadsheet-id"
```

#### Untuk Cloudflare Workers:
Edit file `wrangler.toml` dan update variabel:
```toml
[env.production.vars]
GOOGLE_SHEETS_API_KEY = "your-google-sheets-api-key"
SPREADSHEET_ID = "your-spreadsheet-id"
```

## Menjalankan Aplikasi

### Development Lokal (Express.js)
```bash
npm start
```
Aplikasi akan berjalan di `http://localhost:5000`

### Cloudflare Workers Development
```bash
npm run dev
```

### Deploy ke Cloudflare Workers
```bash
npm run deploy
```

## Struktur Google Sheets

Aplikasi ini mengharapkan struktur sheet sebagai berikut:

| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Keyword  | Title    | Content  | Status   | Created  | Updated  |

### Contoh Data:
```
| Keyword        | Title              | Content                    | Status  | Created             | Updated             |
|----------------|--------------------|----------------------------|---------|---------------------|---------------------|
| seo tutorial   | SEO Tutorial       | Complete guide to SEO      | success | 2024-01-01 10:00:00 | 2024-01-01 11:00:00 |
| web design     | Web Design Tips    | Best practices for design   | pending | 2024-01-02 09:00:00 |                     |
| marketing      | Digital Marketing  | Online marketing strategies | error   | 2024-01-03 08:00:00 | 2024-01-03 08:30:00 |
```

## API Endpoints

### GET /api/sheets/data
Mengambil semua data dari Google Sheets

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "keyword": "seo tutorial",
      "title": "SEO Tutorial",
      "content": "Complete guide to SEO",
      "status": "success",
      "created": "2024-01-01T10:00:00Z",
      "updated": "2024-01-01T11:00:00Z"
    }
  ],
  "total": 1,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### POST /api/sheets/update
Update data di Google Sheets

**Request Body:**
```json
{
  "id": 1,
  "keyword": "new keyword",
  "title": "New Title",
  "content": "New content",
  "status": "success"
}
```

### DELETE /api/sheets/delete?id=1
Hapus data dari Google Sheets

## Fitur Dashboard

### 1. Statistik Real-time
- **Total Rows**: Jumlah total data
- **Processed**: Jumlah data dengan status "success"
- **Errors**: Jumlah data dengan status "error"  
- **Last Update**: Waktu update terakhir

### 2. Search & Filter
- **Search Box**: Pencarian berdasarkan keyword, title, atau content
- **Status Filter**: Filter berdasarkan status (success, error, pending)

### 3. Data Table
- **Responsive Table**: Tabel yang responsive untuk semua device
- **Pagination**: Navigasi halaman untuk data yang banyak
- **Action Buttons**: Tombol view dan edit untuk setiap row

### 4. Auto Refresh
- **Interval**: Refresh otomatis setiap 30 detik
- **Manual Refresh**: Tombol refresh manual
- **Connection Status**: Indikator status koneksi

## Kustomisasi

### Mengubah Interval Refresh
Edit variabel `CONFIG.refreshInterval` di file JavaScript:
```javascript
const CONFIG = {
    refreshInterval: 30000, // 30 detik
    itemsPerPage: 10,
    maxRetries: 3
};
```

### Mengubah Nama Sheet
Edit variabel `SHEET_NAME` di file server.js atau index.js:
```javascript
const SHEET_NAME = 'WEBSITE'; // Nama sheet yang akan digunakan
```

### Kustomisasi Tampilan
Edit CSS di dalam tag `<style>` untuk menyesuaikan dengan brand/tema Anda:
```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #64748b;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
}
```

## Troubleshooting

### Error: "Google Sheets API Key tidak dikonfigurasi"
- Pastikan environment variable `GOOGLE_SHEETS_API_KEY` sudah diset
- Untuk Cloudflare Workers, pastikan variabel sudah diset di `wrangler.toml`

### Error: "Spreadsheet ID tidak dikonfigurasi"
- Pastikan environment variable `SPREADSHEET_ID` sudah diset
- Pastikan ID spreadsheet benar (dari URL Google Sheets)

### Error: "403 Forbidden"
- Pastikan API Key memiliki akses ke Google Sheets API
- Pastikan spreadsheet memiliki permissions yang benar

### Error: "404 Not Found"
- Pastikan spreadsheet ID benar
- Pastikan nama sheet benar (default: 'WEBSITE')

### Data tidak muncul
- Pastikan sheet memiliki data
- Pastikan format data sesuai dengan yang diharapkan
- Cek console browser untuk error JavaScript

## Pengembangan

### Menambah Fitur Baru
1. Update API endpoints di `server.js` atau `index.js`
2. Update frontend JavaScript untuk menggunakan endpoint baru
3. Test di development environment
4. Deploy ke production

### Integrasi dengan Google Apps Script
- Aplikasi ini dapat diintegrasikan dengan Google Apps Script yang sudah ada
- Gunakan fungsi-fungsi dari folder `Script/` untuk operasi yang lebih kompleks

## Keamanan

### API Key
- Jangan commit API key ke repository
- Gunakan environment variables
- Rotasi API key secara berkala

### CORS
- Aplikasi sudah dikonfigurasi dengan CORS headers
- Sesuaikan origin yang diizinkan untuk production

### Rate Limiting
- Google Sheets API memiliki rate limiting
- Implementasikan caching jika diperlukan

## Lisensi

MIT License - Bebas untuk digunakan dan dimodifikasi.

## Kontribusi

1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## Support

Jika mengalami masalah, silakan:
1. Cek bagian Troubleshooting di atas
2. Buka issue di repository
3. Hubungi developer

---

**Dibuat dengan ❤️ untuk kemudahan integrasi Google Sheets**