const express = require('express');
const https = require('https');
const app = express();

// Improved fetch replacement with redirect handling
function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : require('http');
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 10000
        };

        const req = protocol.request(requestOptions, (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const redirectUrl = res.headers.location.startsWith('http') 
                    ? res.headers.location 
                    : `${urlObj.protocol}//${urlObj.host}${res.headers.location}`;
                
                return fetch(redirectUrl, options).then(resolve).catch(reject);
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        statusCode: res.statusCode,
                        headers: res.headers,
                        text: () => Promise.resolve(data),
                        json: () => Promise.resolve(JSON.parse(data))
                    });
                } catch (e) {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        statusCode: res.statusCode,
                        headers: res.headers,
                        text: () => Promise.resolve(data),
                        json: () => Promise.reject(e)
                    });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}
const port = 5000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration
const config = {
    spreadsheet_id: "14K69q8SMd3pCAROB1YQMDrmuw8y6QphxAslF_y-3NrM",
    sheet_name: "WEBSITE",
    cf_api_token: process.env.CLOUDFLARE_API_TOKEN || "xEPsMIeIGMaB46ryg2PmyQfyaUNErRL8vPmKXf6m",
    cf_account_id: "a9f23a2cc52c24bcf5653631fcf6775b"
};

// Main page
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog Template Generator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 40px 20px; border-radius: 12px; margin-bottom: 30px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .tabs { display: flex; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .tab { flex: 1; padding: 15px 20px; background: #f8f9fa; border: none; cursor: pointer; font-size: 1rem; transition: all 0.3s; }
        .tab.active { background: #667eea; color: white; }
        .tab:hover { background: #5a6fd8; color: white; }
        .tab-content { display: none; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .tab-content.active { display: block; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 25px; border-radius: 12px; border-left: 4px solid #667eea; }
        .card h3 { color: #667eea; margin-bottom: 15px; font-size: 1.3rem; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #555; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 1rem; transition: border-color 0.3s; }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus { outline: none; border-color: #667eea; }
        .btn { background: #667eea; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: all 0.3s; margin: 5px; }
        .btn:hover { background: #5a6fd8; transform: translateY(-2px); }
        .btn-success { background: #28a745; }
        .btn-success:hover { background: #218838; }
        .status { padding: 15px; border-radius: 8px; margin: 15px 0; }
        .status.success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .status.error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .status.warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        pre { background: #f8f9fa; padding: 20px; border-radius: 8px; overflow-x: auto; border: 1px solid #e9ecef; }
        .deployment-result { background: #e7f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 20px 0; }
        @media (max-width: 768px) { 
            .grid { grid-template-columns: 1fr; }
            .tabs { flex-direction: column; }
            .header h1 { font-size: 2rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Blog Template Generator</h1>
            <p>Generate HTML blog templates connected to Google Sheets and deploy to Cloudflare Workers</p>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('config')">⚙️ Configuration</button>
            <button class="tab" onclick="showTab('generate')">📝 Generate Template</button>
            <button class="tab" onclick="showTab('deploy')">🚀 Deploy</button>
        </div>
        
        <div id="config" class="tab-content active">
            <h2>Configuration</h2>
            <div class="grid">
                <div class="card">
                    <h3>📊 Google Sheets Connection</h3>
                    <div class="form-group">
                        <label>Spreadsheet ID</label>
                        <input type="text" id="spreadsheet_id" value="${config.spreadsheet_id}">
                    </div>
                    <div class="form-group">
                        <label>Sheet Name</label>
                        <input type="text" id="sheet_name" value="${config.sheet_name}">
                    </div>
                    <button class="btn" onclick="testGoogleSheets()">Test Connection</button>
                    <div id="sheets-status"></div>
                </div>
                
                <div class="card">
                    <h3>☁️ Cloudflare Workers</h3>
                    <div class="form-group">
                        <label>API Token</label>
                        <input type="password" id="cf_api_token" value="${config.cf_api_token}" placeholder="Masukkan Cloudflare API Token">
                    </div>
                    <div class="form-group">
                        <label>Account ID</label>
                        <input type="text" id="cf_account_id" value="${config.cf_account_id}">
                    </div>
                    <button class="btn" onclick="testCloudflare()">Test Connection</button>
                    <button class="btn" onclick="getAccounts()" style="background: #10b981;">Get Accounts</button>
                    <div id="cf-status"></div>
                    <div id="accounts-list"></div>
                </div>
            </div>
        </div>
        
        <div id="generate" class="tab-content">
            <h2>Generate Blog Template</h2>
            <div class="grid">
                <div class="card">
                    <h3>Blog Settings</h3>
                    <div class="form-group">
                        <label>Blog Title</label>
                        <input type="text" id="blog_title" value="My Blog" placeholder="Enter blog title">
                    </div>
                    <div class="form-group">
                        <label>Blog Description</label>
                        <textarea id="blog_description" rows="3" placeholder="Enter blog description">Blog powered by Google Sheets</textarea>
                    </div>
                </div>
                
                <div class="card">
                    <h3>Template Options</h3>
                    <div class="form-group">
                        <label>Template Style</label>
                        <select id="template_style">
                            <option value="modern">Modern</option>
                            <option value="classic">Classic</option>
                            <option value="minimal">Minimal</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Color Scheme</label>
                        <select id="color_scheme">
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="purple">Purple</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <button class="btn btn-success" onclick="generateTemplate()">Generate Template</button>
            <div id="template-result"></div>
        </div>
        
        <div id="deploy" class="tab-content">
            <h2>Deploy to Cloudflare Workers</h2>
            
            <div class="card">
                <h3>Deployment Settings</h3>
                <div class="form-group">
                    <label>Worker Name</label>
                    <input type="text" id="worker_name" value="my-blog-worker" placeholder="Enter worker name">
                </div>
                <button class="btn btn-success" onclick="deployToCloudflare()">Deploy to Cloudflare Workers</button>
                <div id="deploy-result"></div>
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }
        
        async function testGoogleSheets() {
            const spreadsheetId = document.getElementById('spreadsheet_id').value;
            const statusDiv = document.getElementById('sheets-status');
            
            statusDiv.innerHTML = '<div class="status warning">Testing connection...</div>';
            
            try {
                const response = await fetch('/test-sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spreadsheet_id: spreadsheetId })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    statusDiv.innerHTML = \`<div class="status success">✅ Connection successful! Found \${result.rows} rows</div>\`;
                    if (result.preview) {
                        statusDiv.innerHTML += \`<pre>\${result.preview}</pre>\`;
                    }
                } else {
                    statusDiv.innerHTML = \`<div class="status error">❌ Connection failed: \${result.error}</div>\`;
                }
            } catch (error) {
                statusDiv.innerHTML = \`<div class="status error">❌ Error: \${error.message}</div>\`;
            }
        }
        
        async function testCloudflare() {
            const apiToken = document.getElementById('cf_api_token').value;
            const accountId = document.getElementById('cf_account_id').value;
            const statusDiv = document.getElementById('cf-status');
            
            if (!apiToken || !accountId) {
                statusDiv.innerHTML = '<div class="status error">❌ API Token dan Account ID harus diisi!</div>';
                return;
            }
            
            statusDiv.innerHTML = '<div class="status warning">Testing connection...</div>';
            
            try {
                const response = await fetch('/test-cloudflare', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        api_token: apiToken,
                        account_id: accountId
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    statusDiv.innerHTML = \`
                        <div class="status success">
                            ✅ Cloudflare connection successful!<br>
                            <small>Account: \${result.account_name || 'Unknown'}</small>
                        </div>
                    \`;
                } else {
                    statusDiv.innerHTML = \`<div class="status error">❌ Connection failed: \${result.error}</div>\`;
                }
            } catch (error) {
                statusDiv.innerHTML = \`<div class="status error">❌ Error: \${error.message}</div>\`;
            }
        }
        
        async function getAccounts() {
            const apiToken = document.getElementById('cf_api_token').value;
            const listDiv = document.getElementById('accounts-list');
            
            if (!apiToken) {
                listDiv.innerHTML = '<div class="status error">❌ API Token harus diisi terlebih dahulu!</div>';
                return;
            }
            
            listDiv.innerHTML = '<div class="status warning">Loading accounts...</div>';
            
            try {
                const response = await fetch('/get-accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ api_token: apiToken })
                });
                
                const result = await response.json();
                
                if (result.success && result.accounts) {
                    let accountsHtml = '<div class="status success">✅ Available accounts:</div>';
                    accountsHtml += '<div style="margin: 10px 0;">';
                    
                    result.accounts.forEach(account => {
                        accountsHtml += \`
                            <div style="background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; cursor: pointer;" 
                                 onclick="selectAccount('\${account.id}', '\${account.name}')">
                                <strong>\${account.name}</strong><br>
                                <small>ID: \${account.id}</small>
                            </div>
                        \`;
                    });
                    
                    accountsHtml += '</div>';
                    listDiv.innerHTML = accountsHtml;
                } else {
                    listDiv.innerHTML = \`<div class="status error">❌ Failed to get accounts: \${result.error}</div>\`;
                }
            } catch (error) {
                listDiv.innerHTML = \`<div class="status error">❌ Error: \${error.message}</div>\`;
            }
        }
        
        function selectAccount(accountId, accountName) {
            document.getElementById('cf_account_id').value = accountId;
            document.getElementById('accounts-list').innerHTML = \`<div class="status success">✅ Selected: \${accountName}</div>\`;
        }
        
        async function generateTemplate() {
            const resultDiv = document.getElementById('template-result');
            const blogTitle = document.getElementById('blog_title').value;
            const blogDescription = document.getElementById('blog_description').value;
            
            resultDiv.innerHTML = '<div class="status warning">Generating template...</div>';
            
            try {
                const response = await fetch('/generate-template', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        blog_title: blogTitle,
                        blog_description: blogDescription,
                        template_style: document.getElementById('template_style').value,
                        color_scheme: document.getElementById('color_scheme').value
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div class="status success">✅ Template generated successfully!</div>
                        <h4>Generated HTML Template:</h4>
                        <pre>\${result.template}</pre>
                    \`;
                } else {
                    resultDiv.innerHTML = \`<div class="status error">❌ Generation failed: \${result.error}</div>\`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`<div class="status error">❌ Error: \${error.message}</div>\`;
            }
        }
        
        async function deployToCloudflare() {
            const resultDiv = document.getElementById('deploy-result');
            const workerName = document.getElementById('worker_name').value;
            
            resultDiv.innerHTML = '<div class="status warning">Deploying to Cloudflare...</div>';
            
            try {
                const response = await fetch('/deploy-worker', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        worker_name: workerName,
                        blog_title: document.getElementById('blog_title').value,
                        blog_description: document.getElementById('blog_description').value,
                        api_token: document.getElementById('cf_api_token').value,
                        account_id: document.getElementById('cf_account_id').value,
                        spreadsheet_id: document.getElementById('spreadsheet_id').value
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div class="deployment-result">
                            <div class="status success">✅ Deployment successful!</div>
                            <h4>🌐 Your blog is live at:</h4>
                            <p><strong><a href="\${result.url}" target="_blank">\${result.url}</a></strong></p>
                            <p><small>Worker Name: \${result.worker_name}</small></p>
                            <p><small>Clean Subdomain: \${result.clean_subdomain || 'N/A'}</small></p>
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`<div class="status error">❌ Deployment failed: \${result.error}</div>\`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`<div class="status error">❌ Error: \${error.message}</div>\`;
            }
        }
    </script>
</body>
</html>
    `);
});

// Test Google Sheets connection with multiple URL formats
app.post('/test-sheets', async (req, res) => {
    const { spreadsheet_id } = req.body;
    
    // Multiple URL formats to try
    const urlFormats = [
        `https://docs.google.com/spreadsheets/d/${spreadsheet_id}/export?format=csv&gid=0`,
        `https://docs.google.com/spreadsheets/d/${spreadsheet_id}/export?format=csv`,
        `https://docs.google.com/spreadsheets/d/${spreadsheet_id}/gviz/tq?tqx=out:csv`,
        `https://docs.google.com/spreadsheets/d/${spreadsheet_id}/pub?output=csv`
    ];
    
    for (const url of urlFormats) {
        try {
            console.log(`Trying URL: ${url}`);
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; BlogGenerator/1.0)'
                }
            });
            
            console.log(`Response status: ${response.status}`);
            
            if (response.ok) {
                const csvData = await response.text();
                
                // Validate CSV data
                if (csvData && csvData.length > 10 && !csvData.includes('<html>')) {
                    const lines = csvData.split('\n').filter(line => line.trim());
                    const preview = lines.slice(0, 5).join('\n');
                    
                    return res.json({
                        success: true,
                        rows: lines.length,
                        preview: preview,
                        url_used: url
                    });
                }
            }
        } catch (error) {
            console.log(`Error with ${url}: ${error.message}`);
            continue;
        }
    }
    
    res.json({
        success: false,
        error: 'Could not access spreadsheet. Make sure it is public and the ID is correct.'
    });
});

// Test Cloudflare connection with proper account validation
app.post('/test-cloudflare', async (req, res) => {
    const { api_token, account_id } = req.body;
    const testAccountId = account_id || config.cf_account_id;
    
    try {
        console.log('Testing Cloudflare API token...');
        
        // Test token by trying to access accounts first (more reliable)
        const accountsResponse = await fetch('https://api.cloudflare.com/client/v4/accounts', {
            headers: {
                'Authorization': `Bearer ${api_token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'BlogGenerator/1.0'
            }
        });
        
        console.log(`Token test via accounts API status: ${accountsResponse.status}`);
        
        if (!accountsResponse.ok) {
            let errorMsg = 'Token authentication failed';
            try {
                const errorData = await accountsResponse.json();
                errorMsg = errorData.errors?.[0]?.message || errorMsg;
            } catch (e) {
                errorMsg = `HTTP ${accountsResponse.status}: ${accountsResponse.statusText}`;
            }
            
            return res.json({
                success: false,
                error: `Token invalid: ${errorMsg}`
            });
        }
        
        const accountsResult = await accountsResponse.json();
        console.log('Accounts API result:', accountsResult);
        
        if (!accountsResult.success) {
            return res.json({
                success: false,
                error: `Token invalid: ${accountsResult.errors?.[0]?.message || 'Token validation failed'}`
            });
        }
        
        // Now test specific account access if account_id provided
        if (testAccountId) {
            // Check if the provided account ID exists in user's accounts
            const userAccount = accountsResult.result.find(acc => acc.id === testAccountId);
            
            if (userAccount) {
                res.json({
                    success: true,
                    message: 'API Token and Account ID are valid',
                    account_name: userAccount.name,
                    account_id: testAccountId,
                    account_type: userAccount.type,
                    total_accounts: accountsResult.result.length
                });
            } else {
                const availableIds = accountsResult.result.map(acc => acc.id);
                res.json({
                    success: false,
                    error: `Account ID not found. Available accounts: ${availableIds.join(', ')}`
                });
            }
        } else {
            // Return token validation with account info
            const firstAccount = accountsResult.result[0];
            res.json({
                success: true,
                message: 'API Token is valid',
                total_accounts: accountsResult.result.length,
                first_account: firstAccount ? {
                    id: firstAccount.id,
                    name: firstAccount.name,
                    type: firstAccount.type
                } : null
            });
        }
    } catch (error) {
        console.log('Cloudflare test error:', error);
        res.json({
            success: false,
            error: `Connection error: ${error.message}`
        });
    }
});

// Get Cloudflare accounts list
app.post('/get-accounts', async (req, res) => {
    const { api_token } = req.body;
    
    try {
        console.log('Fetching Cloudflare accounts...');
        
        const response = await fetch('https://api.cloudflare.com/client/v4/accounts', {
            headers: {
                'Authorization': `Bearer ${api_token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'BlogGenerator/1.0'
            }
        });
        
        console.log(`Accounts API status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.result) {
                const accounts = data.result.map(acc => ({
                    id: acc.id,
                    name: acc.name,
                    type: acc.type
                }));
                
                res.json({
                    success: true,
                    accounts: accounts
                });
            } else {
                res.json({
                    success: false,
                    error: data.errors?.[0]?.message || 'Failed to fetch accounts'
                });
            }
        } else {
            const errorData = await response.json();
            res.json({
                success: false,
                error: errorData.errors?.[0]?.message || 'Failed to access accounts'
            });
        }
    } catch (error) {
        console.log('Get accounts error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Generate template
app.post('/generate-template', async (req, res) => {
    const { blog_title, blog_description, template_style, color_scheme } = req.body;
    
    const colorSchemes = {
        blue: { primary: '#2563eb', secondary: '#3b82f6', background: '#eff6ff' },
        green: { primary: '#059669', secondary: '#10b981', background: '#ecfdf5' },
        purple: { primary: '#7c3aed', secondary: '#8b5cf6', background: '#f3e8ff' },
        dark: { primary: '#1f2937', secondary: '#374151', background: '#f9fafb' }
    };
    
    const colors = colorSchemes[color_scheme] || colorSchemes.blue;
    
    const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blog_title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: ${colors.background}; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; padding: 40px 0; background: ${colors.primary}; color: white; border-radius: 12px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .posts { display: grid; gap: 20px; }
        .post { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-left: 4px solid ${colors.primary}; }
        .post h2 { color: ${colors.primary}; margin-bottom: 15px; }
        .post-meta { color: #666; font-size: 0.9rem; margin-bottom: 15px; }
        .post-content { color: #555; }
        .loading { text-align: center; padding: 40px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${blog_title}</h1>
            <p>${blog_description}</p>
        </div>
        <div class="posts" id="posts">
            <div class="loading">Loading posts...</div>
        </div>
    </div>
    
    <script>
        async function loadPosts() {
            // Implementation to load from Google Sheets would go here
            const postsDiv = document.getElementById('posts');
            postsDiv.innerHTML = '<div class="post"><h2>Sample Post</h2><div class="post-meta">Published on ' + new Date().toLocaleDateString() + '</div><div class="post-content">This is a sample post content. Posts will be loaded from Google Sheets.</div></div>';
        }
        
        loadPosts();
    </script>
</body>
</html>`;
    
    res.json({
        success: true,
        template: template
    });
});

// Helper function to clean account name for subdomain
function cleanAccountName(accountName) {
    if (!accountName) return 'blog';
    
    // Remove @gmail.com's Account, @yahoo.com's Account, etc.
    let cleaned = accountName.replace(/@[^']*'s\s+Account/gi, '');
    
    // Convert to lowercase and replace invalid characters with hyphens
    cleaned = cleaned.toLowerCase()
                   .replace(/[^a-z0-9]/g, '-')
                   .replace(/-+/g, '-')
                   .replace(/^-|-$/g, '');
    
    // Ensure it's not empty and not too long
    if (!cleaned || cleaned.length < 1) cleaned = 'blog';
    if (cleaned.length > 20) cleaned = cleaned.substring(0, 20);
    
    return cleaned;
}

// Deploy worker
app.post('/deploy-worker', async (req, res) => {
    const { worker_name, blog_title, blog_description, api_token, account_id, spreadsheet_id } = req.body;
    
    try {
        // First get account info to generate clean URL
        const accountResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account_id}`, {
            headers: {
                'Authorization': `Bearer ${api_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        let cleanedName = 'blog';
        if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            if (accountData.success && accountData.result) {
                cleanedName = cleanAccountName(accountData.result.name);
            }
        }
        // First generate the complete template with the selected style
        const colorSchemes = {
            blue: { primary: '#2563eb', secondary: '#3b82f6', background: '#eff6ff' },
            green: { primary: '#059669', secondary: '#10b981', background: '#ecfdf5' },
            purple: { primary: '#7c3aed', secondary: '#8b5cf6', background: '#f3e8ff' },
            dark: { primary: '#1f2937', secondary: '#374151', background: '#f9fafb' }
        };
        
        const colors = colorSchemes['blue']; // Default to blue for worker
        
        const workerScript = `addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  
  if (url.pathname === '/api/posts') {
    return await getPosts();
  }
  
  // Get posts first to render them directly in HTML
  const postsData = await getPosts();
  const posts = await postsData.json();
  
  let postsHTML = '';
  if (posts.length === 0) {
    postsHTML = '<div class="post"><h2>No posts found</h2><div class="post-content">Please check your Google Sheets configuration.</div></div>';
  } else {
    posts.forEach(post => {
      if (post.status === 'published') {
        postsHTML += '<div class="post">' +
          '<h2>' + (post.title || 'Untitled') + '</h2>' +
          '<div class="post-meta">' +
            '<span>By ' + (post.author || 'Admin') + '</span> • ' +
            '<span>' + (post.date || new Date().toLocaleDateString()) + '</span> • ' +
            '<span class="category">' + (post.category || 'General') + '</span>' +
          '</div>' +
          '<div class="post-content">' + (post.excerpt || post.content || 'No content available') + '</div>' +
          (post.tags ? '<div class="tags">' + post.tags.split(',').map(tag => '<span class="tag">' + tag.trim() + '</span>').join('') + '</div>' : '') +
        '</div>';
      }
    });
  }
  
  const html = '<!DOCTYPE html>' +
'<html lang="en">' +
'<head>' +
'    <meta charset="UTF-8">' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'    <title>${blog_title}</title>' +
'    <meta name="description" content="${blog_description}">' +
'    <style>' +
'        * { margin: 0; padding: 0; box-sizing: border-box; }' +
'        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; background: ${colors.background}; }' +
'        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }' +
'        .header { text-align: center; margin-bottom: 40px; padding: 60px 0; background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); color: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }' +
'        .header h1 { font-size: 3rem; margin-bottom: 15px; font-weight: 700; }' +
'        .header p { font-size: 1.3rem; opacity: 0.95; max-width: 600px; margin: 0 auto; }' +
'        .posts { display: grid; gap: 30px; }' +
'        .post { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.08); border-left: 5px solid ${colors.primary}; }' +
'        .post h2 { color: ${colors.primary}; margin-bottom: 15px; font-size: 1.8rem; font-weight: 600; }' +
'        .post-meta { color: #666; font-size: 0.9rem; margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; }' +
'        .category { background: ${colors.primary}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; }' +
'        .post-content { color: #555; font-size: 1.1rem; line-height: 1.8; }' +
'        .tags { margin-top: 15px; display: flex; gap: 8px; flex-wrap: wrap; }' +
'        .tag { background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 15px; font-size: 0.8rem; border: 1px solid #e2e8f0; }' +
'        .footer { text-align: center; margin-top: 60px; padding: 30px; color: #666; border-top: 1px solid #e5e7eb; }' +
'        @media (max-width: 768px) { .container { padding: 15px; } .header { padding: 40px 20px; } .header h1 { font-size: 2.2rem; } .post { padding: 25px; } }' +
'    </style>' +
'</head>' +
'<body>' +
'    <div class="container">' +
'        <div class="header">' +
'            <h1>${blog_title}</h1>' +
'            <p>${blog_description}</p>' +
'        </div>' +
'        <div class="posts">' +
            postsHTML +
'        </div>' +
'        <div class="footer">' +
'            <p>Powered by Google Sheets & Cloudflare Workers</p>' +
'        </div>' +
'    </div>' +
'</body>' +
'</html>';
  
  return new Response(html, {
    headers: { 
      'content-type': 'text/html',
      'cache-control': 'public, max-age=300'
    }
  })
}

async function getPosts() {
  try {
    const response = await fetch('https://docs.google.com/spreadsheets/d/${spreadsheet_id}/export?format=csv');
    const csvData = await response.text();
    
    const lines = csvData.trim().split('\\n');
    if (lines.length < 2) {
      return new Response(JSON.stringify([]), {
        headers: { 'content-type': 'application/json' }
      });
    }
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').toLowerCase().trim());
    
    const posts = lines.slice(1).map(line => {
      // Better CSV parsing to handle commas in content
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const post = {};
      headers.forEach((header, index) => {
        post[header] = values[index] || '';
      });
      return post;
    }).filter(post => post.title && post.title.trim()); // Filter out empty posts
    
    return new Response(JSON.stringify(posts), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify([]), {
      headers: { 'content-type': 'application/json' }
    });
  }
}`;
        
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account_id}/workers/scripts/${worker_name}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${api_token}`,
                'Content-Type': 'application/javascript'
            },
            body: workerScript
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            const workerUrl = `https://${worker_name}.${cleanedName}.workers.dev`;
            res.json({
                success: true,
                url: workerUrl,
                worker_name: worker_name,
                clean_subdomain: cleanedName
            });
        } else {
            res.json({
                success: false,
                error: result.errors?.[0]?.message || 'Deployment failed'
            });
        }
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Blog Generator running at http://0.0.0.0:${port}`);
    console.log('Ready to generate and deploy blogs!');
});