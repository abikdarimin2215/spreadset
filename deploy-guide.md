# 🚀 Deploy Guide - Blog Template dengan Google Sheets

## Overview
Panduan lengkap untuk deploy blog template yang terhubung dengan Google Sheets ke berbagai platform hosting.

## 📋 Prerequisites
- Google Sheets API Key
- Spreadsheet ID dari Google Sheets
- Akses ke platform hosting (Cloudflare Workers, Vercel, Netlify, dll)

## 🔧 Manual Deploy

### 1. Persiapan File
```bash
# Clone atau download project
git clone [repository-url]
cd blog-template

# Install dependencies
npm install
```

### 2. Konfigurasi Environment Variables
Buat file `.env` di root directory:
```env
GOOGLE_SHEETS_API_KEY=your_actual_api_key_here
SPREADSHEET_ID=1igvz_FisR1DXWbllea7_oFhh6sLE6lIgtxXPMdmAE3A
SHEET_NAME=WEBSITE
```

### 3. Test Lokal
```bash
# Jalankan server blog
npm run blog

# Atau jalankan development server
npm run dev
```

### 4. Deploy ke Web Server
Upload file berikut ke web server Anda:
- `blog-template.html`
- `blog-server.js`
- `package.json`
- `node_modules/` (atau jalankan `npm install` di server)

## ☁️ Deploy ke Cloudflare Workers

### 1. Setup Cloudflare Workers
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login ke Cloudflare
wrangler login
```

### 2. Deploy Worker
```bash
# Deploy menggunakan file yang sudah ada
wrangler publish cloudflare-worker.js --name blog-template
```

### 3. Set Environment Variables
Di dashboard Cloudflare Workers:
- `GOOGLE_API_KEY`: API key Google Sheets Anda
- `SHEETS_ID`: ID spreadsheet Anda

### 4. Custom Domain (Optional)
Tambahkan custom domain di dashboard Cloudflare Workers.

## 🌐 Deploy ke Vercel

### 1. Setup Project
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### 2. Konfigurasi vercel.json
```json
{
  "functions": {
    "api/blog.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/blog.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### 3. Set Environment Variables
Di dashboard Vercel:
- `GOOGLE_SHEETS_API_KEY`
- `SPREADSHEET_ID`
- `SHEET_NAME`

## 📱 Deploy ke Netlify

### 1. Setup
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### 2. Konfigurasi netlify.toml
```toml
[build]
  functions = "functions"

[functions]
  directory = "functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## 🐧 Deploy ke VPS/Server Linux

### 1. Setup Server
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 untuk process management
npm install -g pm2
```

### 2. Upload dan Configure
```bash
# Upload file ke server
scp -r blog-template/ user@server:/var/www/

# Install dependencies
cd /var/www/blog-template
npm install

# Set environment variables
export GOOGLE_SHEETS_API_KEY="your-api-key"
export SPREADSHEET_ID="your-spreadsheet-id"
export SHEET_NAME="WEBSITE"
```

### 3. Start dengan PM2
```bash
# Start aplikasi
pm2 start blog-server.js --name blog-app

# Save PM2 config
pm2 save
pm2 startup
```

### 4. Setup Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Streamlit App Deployment

### 1. Deploy ke Streamlit Cloud
```bash
# Push ke GitHub repository
git add .
git commit -m "Add streamlit app"
git push origin main

# Deploy via Streamlit Cloud dashboard
# https://streamlit.io/cloud
```

### 2. Deploy ke Heroku
```bash
# Install Heroku CLI
# Create Procfile
echo "web: streamlit run streamlit_app.py --server.port=\$PORT --server.address=0.0.0.0" > Procfile

# Deploy
heroku create your-app-name
git push heroku main
```

## 🔒 Security & Best Practices

### 1. Environment Variables
- Jangan commit API key ke repository
- Gunakan environment variables untuk data sensitif
- Rotate API key secara berkala

### 2. Rate Limiting
```javascript
// Tambahkan rate limiting
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};
```

### 3. HTTPS
- Selalu gunakan HTTPS di production
- Setup SSL certificate
- Redirect HTTP ke HTTPS

### 4. Monitoring
```javascript
// Tambahkan logging
console.log('Request:', req.method, req.url);
console.log('Response:', res.statusCode);
```

## 🧪 Testing

### 1. Test API Endpoints
```bash
# Test posts endpoint
curl https://yourdomain.com/api/posts

# Test specific post
curl https://yourdomain.com/api/post/sample-post
```

### 2. Test Google Sheets Connection
```javascript
// Test connection di browser console
fetch('/api/posts')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 📝 Troubleshooting

### Common Issues:

1. **API Key Error**
   - Periksa API key sudah benar
   - Pastikan Google Sheets API enabled
   - Cek quota API belum terlampaui

2. **CORS Error**
   - Pastikan CORS headers sudah diset
   - Cek domain origin sudah benar

3. **Spreadsheet Not Found**
   - Pastikan spreadsheet ID benar
   - Cek sharing permission spreadsheet
   - Pastikan sheet name sesuai

4. **Server Error**
   - Cek log server untuk error details
   - Pastikan environment variables sudah diset
   - Cek network connection

## 📞 Support

Jika mengalami masalah:
1. Cek log error di console
2. Verifikasi konfigurasi environment variables
3. Test koneksi ke Google Sheets API
4. Pastikan semua dependencies terinstall

## 🔄 Update Guide

### Update Content
1. Edit data di Google Sheets
2. Data akan otomatis update di website (refresh setiap 30 detik)

### Update Template
1. Edit file HTML template
2. Redeploy aplikasi
3. Clear cache browser jika diperlukan

## 📈 Performance Optimization

### 1. Caching
```javascript
// Tambahkan caching untuk Google Sheets data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedData(key, fetcher) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 2. Compression
```javascript
// Tambahkan compression middleware
const compression = require('compression');
app.use(compression());
```

### 3. Image Optimization
- Gunakan format WebP untuk gambar
- Implementasi lazy loading
- Resize gambar sesuai kebutuhan

## 🎯 Next Steps

1. **SEO Optimization**
   - Tambahkan meta tags
   - Implementasi structured data
   - Sitemap generation

2. **Analytics**
   - Google Analytics integration
   - Custom event tracking
   - Performance monitoring

3. **Advanced Features**
   - Comment system
   - Search functionality
   - Social sharing

---

*Guide ini akan terus diupdate sesuai dengan perkembangan teknologi dan best practices terbaru.*