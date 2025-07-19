# ☁️ Cloudflare Workers Deployment Guide

## Overview
Panduan lengkap untuk deploy blog template ke Cloudflare Workers dengan random name generation dan kontrol workflow.

## 🔧 Prerequisites
- Cloudflare account (gratis)
- API Token dengan permissions yang sesuai
- Account ID dan Zone ID (optional)
- Spreadsheet ID yang sudah dikonfigurasi

## 📋 Setup Cloudflare API

### 1. Mendapatkan API Token
1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use **Edit Cloudflare Workers** template
5. Set permissions:
   - Account: `Cloudflare Workers:Edit`
   - Zone: `Zone:Read` (optional, untuk custom domain)
6. Copy the generated token

### 2. Mendapatkan Account ID
1. Di Cloudflare Dashboard, pilih domain Anda
2. Scroll ke bawah di sidebar kanan
3. Copy **Account ID**

### 3. Mendapatkan Zone ID (Optional)
1. Di Cloudflare Dashboard, pilih domain Anda
2. Scroll ke bawah di sidebar kanan
3. Copy **Zone ID**

## 🚀 Deployment dengan Auto-Generated Names

### Random Name Generation
System akan generate nama worker secara otomatis dengan format:
- `{prefix}-{adjective}-{noun}-{number}`
- Contoh: `blog-amazing-portal-123`, `site-brilliant-hub-456`

### Adjectives Pool:
- amazing, brilliant, clever, dynamic, elegant, fantastic
- gorgeous, incredible, luminous, magnificent, outstanding
- perfect, radiant, spectacular, vibrant, wonderful

### Nouns Pool:
- blog, site, portal, hub, space, platform
- journal, diary, news, stories, content, pages

### Availability Check
System akan check ketersediaan nama secara otomatis:
1. Generate nama random
2. Check dengan Cloudflare API
3. Jika tidak tersedia, generate nama baru
4. Maksimal 10 attempts
5. Fallback ke timestamp jika semua gagal

## 📱 Deployment via Streamlit App

### 1. Configuration
1. Buka Streamlit App (port 8501)
2. Di sidebar, isi **Cloudflare Settings**:
   - API Token: `your-cloudflare-token`
   - Account ID: `your-account-id`
   - Zone ID: `your-zone-id` (optional)
3. Set **Worker Name Options**:
   - Prefix: `blog` (default)
   - Auto-generate: ✅ (recommended)

### 2. Deploy Process
1. Click **🚀 Deploy to Cloudflare Workers**
2. System akan:
   - Generate available worker name
   - Create worker script dengan Google Sheets integration
   - Deploy ke Cloudflare
   - Set environment variables
   - Return deployment URL

### 3. Deployment Result
Jika berhasil, Anda akan mendapat:
- **Worker Name**: `blog-amazing-portal-123`
- **Worker URL**: `https://blog-amazing-portal-123.your-account-id.workers.dev`
- **Deployment Details**: JSON response from Cloudflare

## 🔧 Manual Deployment

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login ke Cloudflare
```bash
wrangler login
```

### 3. Generate Worker Script
```bash
# Use the cloudflare-manager.js to generate script
node -e "
const CloudflareManager = require('./cloudflare-manager.js');
const manager = new CloudflareManager('your-token', 'your-account-id');
const script = manager.generateBlogWorkerScript({
  spreadsheetId: '14K69q8SMd3pCAROB1YQMDrmuw8y6QphxAslF_y-3NrM',
  sheetName: 'Sheet1',
  blogTitle: 'My Blog',
  blogDescription: 'Blog powered by Google Sheets'
});
console.log(script);
"
```

### 4. Deploy Manual
```bash
# Create wrangler.toml
cat > wrangler.toml << EOF
name = "blog-amazing-portal-123"
main = "worker.js"
compatibility_date = "2023-12-01"

[vars]
SPREADSHEET_ID = "14K69q8SMd3pCAROB1YQMDrmuw8y6QphxAslF_y-3NrM"
SHEET_NAME = "Sheet1"
EOF

# Deploy
wrangler publish
```

## 🔄 Workflow Management

### List Workers
```bash
# Via Streamlit App
Click "📋 List Existing Workers"

# Via API
curl -X GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts" \
  -H "Authorization: Bearer {api_token}"
```

### Update Worker
```bash
# Via API
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{worker_name}" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/javascript" \
  --data-binary @worker.js
```

### Delete Worker
```bash
# Via API
curl -X DELETE "https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{worker_name}" \
  -H "Authorization: Bearer {api_token}"
```

## 🌐 Custom Domain Setup

### 1. Add Route
```bash
# Via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/workers/routes" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{
    "pattern": "blog.yourdomain.com/*",
    "script": "blog-amazing-portal-123"
  }'
```

### 2. DNS Setup
1. Login ke Cloudflare Dashboard
2. Go to **DNS** tab
3. Add **CNAME** record:
   - Name: `blog`
   - Target: `your-account-id.workers.dev`
   - Proxy: ✅ (Orange cloud)

## 📊 Environment Variables

### Set via API
```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{worker_name}/settings" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{
    "bindings": [
      {
        "type": "plain_text",
        "name": "SPREADSHEET_ID",
        "text": "14K69q8SMd3pCAROB1YQMDrmuw8y6QphxAslF_y-3NrM"
      },
      {
        "type": "plain_text",
        "name": "SHEET_NAME",
        "text": "Sheet1"
      }
    ]
  }'
```

### Set via Streamlit
1. Deploy worker terlebih dahulu
2. Click **Set Environment Variables**
3. System akan set variables secara otomatis

## 📈 Monitoring & Analytics

### 1. Worker Metrics
```bash
# Via API
curl -X GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{worker_name}/metrics" \
  -H "Authorization: Bearer {api_token}"
```

### 2. Real-time Logs
```bash
# Via Wrangler
wrangler tail {worker_name}
```

### 3. Health Check
Test deployed worker:
```bash
curl https://{worker_name}.{account_id}.workers.dev/health
```

## 🛠️ Troubleshooting

### Common Issues:

1. **"Authentication failed"**
   - Check API token permissions
   - Verify Account ID is correct
   - Ensure token hasn't expired

2. **"Worker name already exists"**
   - Use auto-generation feature
   - Try different prefix
   - Check existing workers list

3. **"Deployment failed"**
   - Verify script syntax
   - Check worker size limits
   - Review error messages

4. **"Environment variables not set"**
   - Use separate API call for env vars
   - Check permissions
   - Verify variable names

### Debug Steps:
1. Test API token with simple request
2. Verify Account ID format
3. Check worker script syntax
4. Test with minimal script first
5. Review Cloudflare dashboard logs

## 💡 Best Practices

1. **Naming Convention**
   - Use descriptive prefixes
   - Enable auto-generation
   - Keep names short but meaningful

2. **Security**
   - Rotate API tokens regularly
   - Use minimal required permissions
   - Don't hardcode sensitive data

3. **Performance**
   - Minimize worker script size
   - Use efficient data processing
   - Implement proper caching

4. **Monitoring**
   - Set up alerts for errors
   - Monitor usage metrics
   - Check performance regularly

## 🔗 Useful Links

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
- [Workers Examples](https://developers.cloudflare.com/workers/examples/)

## 📞 Support

Jika mengalami masalah:
1. Check deployment logs
2. Verify API credentials
3. Test with sample data
4. Review error messages
5. Contact support jika diperlukan

---

*Guide ini memastikan deployment blog template ke Cloudflare Workers berjalan lancar dengan management workflow yang efisien.*