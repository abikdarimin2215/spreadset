// Cloudflare API Manager
// Handles Cloudflare Workers deployment and management

class CloudflareManager {
    constructor(apiToken, accountId) {
        this.apiToken = apiToken;
        this.accountId = accountId;
        this.baseUrl = 'https://api.cloudflare.com/client/v4';
        this.headers = {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        };
    }

    // Generate random worker name
    generateWorkerName(prefix = 'blog') {
        const adjectives = [
            'amazing', 'brilliant', 'clever', 'dynamic', 'elegant', 'fantastic',
            'gorgeous', 'incredible', 'luminous', 'magnificent', 'outstanding',
            'perfect', 'radiant', 'spectacular', 'vibrant', 'wonderful'
        ];
        
        const nouns = [
            'blog', 'site', 'portal', 'hub', 'space', 'platform',
            'journal', 'diary', 'news', 'stories', 'content', 'pages'
        ];
        
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNum = Math.floor(Math.random() * 1000);
        
        return `${prefix}-${adjective}-${noun}-${randomNum}`;
    }

    // Check if worker name is available
    async checkWorkerNameAvailability(workerName) {
        try {
            const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/workers/scripts/${workerName}`, {
                method: 'GET',
                headers: this.headers
            });
            
            // If 404, name is available
            if (response.status === 404) {
                return true;
            }
            
            // If 200, name is taken
            if (response.status === 200) {
                return false;
            }
            
            // Other status codes
            const data = await response.json();
            console.log('Name check response:', data);
            return false;
        } catch (error) {
            console.error('Error checking worker name:', error);
            return false;
        }
    }

    // Generate available worker name
    async generateAvailableWorkerName(prefix = 'blog', maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            const workerName = this.generateWorkerName(prefix);
            const isAvailable = await this.checkWorkerNameAvailability(workerName);
            
            if (isAvailable) {
                return workerName;
            }
        }
        
        // Fallback with timestamp
        const timestamp = Date.now();
        return `${prefix}-${timestamp}`;
    }

    // Deploy worker script
    async deployWorker(workerName, workerScript, metadata = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/workers/scripts/${workerName}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/javascript'
                },
                body: workerScript
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log(`Worker '${workerName}' deployed successfully`);
                return {
                    success: true,
                    workerName: workerName,
                    data: data,
                    url: `https://${workerName}.${this.accountId}.workers.dev`
                };
            } else {
                console.error('Worker deployment failed:', data);
                return {
                    success: false,
                    error: data.errors || 'Unknown error'
                };
            }
        } catch (error) {
            console.error('Error deploying worker:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update worker environment variables
    async updateWorkerEnvVars(workerName, envVars) {
        try {
            const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/workers/scripts/${workerName}/settings`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify({
                    bindings: Object.entries(envVars).map(([key, value]) => ({
                        type: 'plain_text',
                        name: key,
                        text: value
                    }))
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log(`Environment variables updated for '${workerName}'`);
                return { success: true, data: data };
            } else {
                console.error('Environment variables update failed:', data);
                return { success: false, error: data.errors };
            }
        } catch (error) {
            console.error('Error updating environment variables:', error);
            return { success: false, error: error.message };
        }
    }

    // List workers
    async listWorkers() {
        try {
            const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/workers/scripts`, {
                method: 'GET',
                headers: this.headers
            });
            
            const data = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    workers: data.result || []
                };
            } else {
                return {
                    success: false,
                    error: data.errors || 'Failed to list workers'
                };
            }
        } catch (error) {
            console.error('Error listing workers:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Delete worker
    async deleteWorker(workerName) {
        try {
            const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/workers/scripts/${workerName}`, {
                method: 'DELETE',
                headers: this.headers
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log(`Worker '${workerName}' deleted successfully`);
                return { success: true, data: data };
            } else {
                return { success: false, error: data.errors };
            }
        } catch (error) {
            console.error('Error deleting worker:', error);
            return { success: false, error: error.message };
        }
    }

    // Create custom domain for worker
    async createCustomDomain(workerName, domain) {
        if (!this.zoneId) {
            return { success: false, error: 'Zone ID required for custom domain' };
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/zones/${this.zoneId}/workers/routes`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    pattern: `${domain}/*`,
                    script: workerName
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log(`Custom domain '${domain}' created for '${workerName}'`);
                return { success: true, data: data };
            } else {
                return { success: false, error: data.errors };
            }
        } catch (error) {
            console.error('Error creating custom domain:', error);
            return { success: false, error: error.message };
        }
    }

    // Get worker metrics
    async getWorkerMetrics(workerName) {
        try {
            const response = await fetch(`${this.baseUrl}/accounts/${this.accountId}/workers/scripts/${workerName}/metrics`, {
                method: 'GET',
                headers: this.headers
            });
            
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, metrics: data.result };
            } else {
                return { success: false, error: data.errors };
            }
        } catch (error) {
            console.error('Error getting worker metrics:', error);
            return { success: false, error: error.message };
        }
    }

    // Generate blog worker script with configuration
    generateBlogWorkerScript(config) {
        const {
            spreadsheetId,
            sheetName = 'Sheet1',
            blogTitle = 'Blog Sederhana',
            blogDescription = 'Blog powered by Google Sheets',
            blogKeywords = 'blog, google sheets, cloudflare workers'
        } = config;

        return `
// Blog Worker Script - Generated by Cloudflare Manager
// Spreadsheet ID: ${spreadsheetId}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const url = new URL(request.url)
    
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }
    
    try {
        let response
        
        // Route handling
        switch (url.pathname) {
            case '/':
                response = await serveBlogHome()
                break
            case '/api/posts':
                response = await getPosts()
                break
            case '/api/categories':
                response = await getCategories()
                break
            case '/api/tags':
                response = await getTags()
                break
            case '/api/stats':
                response = await getStats()
                break
            case '/health':
                response = new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
                    headers: { 'Content-Type': 'application/json' }
                })
                break
            default:
                if (url.pathname.startsWith('/post/')) {
                    response = await getPost(url.pathname.split('/')[2])
                } else if (url.pathname.startsWith('/api/post/')) {
                    response = await getPostAPI(url.pathname.split('/')[3])
                } else {
                    response = new Response('Not Found', { status: 404 })
                }
                break
        }
        
        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value)
        })
        
        return response
    } catch (error) {
        console.error('Error handling request:', error)
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), { 
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders 
            }
        })
    }
}

// Configuration
const SPREADSHEET_ID = '${spreadsheetId}'
const SHEET_NAME = '${sheetName}'
const BLOG_CONFIG = {
    site_title: '${blogTitle}',
    site_description: '${blogDescription}',
    site_keywords: '${blogKeywords}',
    current_year: new Date().getFullYear()
}

// Direct Google Sheets data fetching
async function getGoogleSheetsData() {
    try {
        const csvUrl = \`https://docs.google.com/spreadsheets/d/\${SPREADSHEET_ID}/export?format=csv&gid=0\`
        const response = await fetch(csvUrl)
        
        if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`)
        }
        
        const csvText = await response.text()
        return csvToJson(csvText)
    } catch (error) {
        console.error('Error fetching Google Sheets data:', error)
        return getDemoData()
    }
}

// Convert CSV to JSON
function csvToJson(csvText) {
    const lines = csvText.split('\\n')
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''))
    const data = []

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values.length === headers.length) {
            const obj = {}
            headers.forEach((header, index) => {
                obj[header.toLowerCase()] = values[index] || ''
            })
            
            // Ensure required fields
            if (!obj.id) obj.id = i
            if (!obj.slug && obj.title) {
                obj.slug = obj.title.toLowerCase()
                    .replace(/[^a-z0-9\\s-]/g, '')
                    .replace(/\\s+/g, '-')
                    .trim()
            }
            
            data.push(obj)
        }
    }

    return data
}

// Parse CSV line with proper comma handling
function parseCSVLine(line) {
    const values = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/"/g, ''))
            current = ''
        } else {
            current += char
        }
    }
    
    values.push(current.trim().replace(/"/g, ''))
    return values
}

// Demo data fallback
function getDemoData() {
    return [
        {
            id: 1,
            title: 'Welcome to Your Blog',
            slug: 'welcome-to-your-blog',
            content: 'This is your first blog post powered by Google Sheets and Cloudflare Workers.',
            category: 'Welcome',
            tags: 'blog, welcome, cloudflare',
            author: 'Admin',
            date: new Date().toISOString().split('T')[0],
            status: 'published'
        }
    ]
}

// Serve blog home page
async function serveBlogHome() {
    const html = \`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>\${BLOG_CONFIG.site_title}</title>
        <meta name="description" content="\${BLOG_CONFIG.site_description}">
        <meta name="keywords" content="\${BLOG_CONFIG.site_keywords}">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .navbar { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
            .hero { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 4rem 0; }
            .card { border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.3s; }
            .card:hover { transform: translateY(-5px); }
            .btn-primary { background: #2563eb; border-color: #2563eb; }
            .btn-primary:hover { background: #1d4ed8; border-color: #1d4ed8; }
        </style>
    </head>
    <body>
        <nav class="navbar navbar-expand-lg navbar-dark">
            <div class="container">
                <a class="navbar-brand" href="/"><i class="fas fa-blog me-2"></i>\${BLOG_CONFIG.site_title}</a>
                <div class="navbar-nav ms-auto">
                    <a class="nav-link" href="/">Home</a>
                    <a class="nav-link" href="/api/posts">API</a>
                </div>
            </div>
        </nav>
        
        <div class="hero text-center">
            <div class="container">
                <h1 class="display-4">\${BLOG_CONFIG.site_title}</h1>
                <p class="lead">\${BLOG_CONFIG.site_description}</p>
                <p><small>Powered by Google Sheets & Cloudflare Workers</small></p>
            </div>
        </div>
        
        <div class="container mt-5">
            <div class="row">
                <div class="col-lg-8">
                    <div id="posts" class="row">
                        <div class="col-12 text-center">
                            <i class="fas fa-spinner fa-spin fa-2x"></i>
                            <p>Loading posts...</p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-body">
                            <h5><i class="fas fa-info-circle me-2"></i>About</h5>
                            <p>\${BLOG_CONFIG.site_description}</p>
                            <p><small>Spreadsheet ID: \${SPREADSHEET_ID}</small></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <footer class="bg-dark text-white mt-5 py-4">
            <div class="container text-center">
                <p>&copy; \${BLOG_CONFIG.current_year} \${BLOG_CONFIG.site_title}. Powered by Cloudflare Workers.</p>
            </div>
        </footer>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
        <script>
            async function loadPosts() {
                try {
                    const response = await fetch('/api/posts')
                    const data = await response.json()
                    
                    if (data.success) {
                        const posts = data.posts || []
                        const postsContainer = document.getElementById('posts')
                        
                        if (posts.length === 0) {
                            postsContainer.innerHTML = '<div class="col-12 text-center"><p>No posts found</p></div>'
                            return
                        }
                        
                        postsContainer.innerHTML = posts.map(post => \`
                            <div class="col-md-6 mb-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="card-title">\\\${post.title}</h5>
                                        <p class="card-text">\\\${(post.content || '').substring(0, 150)}...</p>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <small class="text-muted">\\\${post.category} • \\\${post.date}</small>
                                            <a href="/post/\\\${post.slug}" class="btn btn-primary btn-sm">Read More</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        \`).join('')
                    }
                } catch (error) {
                    console.error('Error loading posts:', error)
                    document.getElementById('posts').innerHTML = '<div class="col-12 text-center"><p>Failed to load posts</p></div>'
                }
            }
            
            loadPosts()
        </script>
    </body>
    </html>
    \`
    
    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    })
}

// API endpoints
async function getPosts() {
    const posts = await getGoogleSheetsData()
    const publishedPosts = posts.filter(post => post.status === 'published' || !post.status)
    
    return new Response(JSON.stringify({
        success: true,
        posts: publishedPosts,
        total: publishedPosts.length
    }), {
        headers: { 'Content-Type': 'application/json' }
    })
}

async function getCategories() {
    const posts = await getGoogleSheetsData()
    const categories = {}
    
    posts.forEach(post => {
        const category = post.category || 'Uncategorized'
        categories[category] = (categories[category] || 0) + 1
    })
    
    return new Response(JSON.stringify({
        success: true,
        categories: categories
    }), {
        headers: { 'Content-Type': 'application/json' }
    })
}

async function getTags() {
    const posts = await getGoogleSheetsData()
    const tags = {}
    
    posts.forEach(post => {
        const postTags = post.tags ? post.tags.split(',').map(tag => tag.trim()) : []
        postTags.forEach(tag => {
            if (tag) tags[tag] = (tags[tag] || 0) + 1
        })
    })
    
    return new Response(JSON.stringify({
        success: true,
        tags: tags
    }), {
        headers: { 'Content-Type': 'application/json' }
    })
}

async function getStats() {
    const posts = await getGoogleSheetsData()
    const categories = new Set(posts.map(post => post.category || 'Uncategorized'))
    const tags = new Set()
    
    posts.forEach(post => {
        const postTags = post.tags ? post.tags.split(',').map(tag => tag.trim()) : []
        postTags.forEach(tag => {
            if (tag) tags.add(tag)
        })
    })
    
    return new Response(JSON.stringify({
        success: true,
        stats: {
            totalPosts: posts.length,
            totalCategories: categories.size,
            totalTags: tags.size,
            publishedPosts: posts.filter(p => p.status === 'published').length
        }
    }), {
        headers: { 'Content-Type': 'application/json' }
    })
}

async function getPost(slug) {
    const posts = await getGoogleSheetsData()
    const post = posts.find(p => p.slug === slug)
    
    if (!post) {
        return new Response('Post not found', { status: 404 })
    }
    
    const html = \`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>\${post.title} - \${BLOG_CONFIG.site_title}</title>
        <meta name="description" content="\${(post.content || '').substring(0, 160)}">
        <meta name="keywords" content="\${post.tags}">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .navbar { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
            .hero { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 4rem 0; }
            .post-content { line-height: 1.8; font-size: 1.1rem; }
        </style>
    </head>
    <body>
        <nav class="navbar navbar-expand-lg navbar-dark">
            <div class="container">
                <a class="navbar-brand" href="/"><i class="fas fa-blog me-2"></i>\${BLOG_CONFIG.site_title}</a>
                <div class="navbar-nav ms-auto">
                    <a class="nav-link" href="/">Home</a>
                </div>
            </div>
        </nav>
        
        <div class="hero text-center">
            <div class="container">
                <h1 class="display-4">\${post.title}</h1>
                <p class="lead">\${post.category} • \${post.date} • \${post.author}</p>
            </div>
        </div>
        
        <div class="container mt-5">
            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <div class="post-content">
                        \${(post.content || '').replace(/\\n/g, '<br>')}
                    </div>
                    
                    <div class="mt-4">
                        <h6>Tags:</h6>
                        \${(post.tags || '').split(',').map(tag => \`<span class="badge bg-primary me-1">\${tag.trim()}</span>\`).join('')}
                    </div>
                    
                    <div class="mt-4">
                        <a href="/" class="btn btn-outline-primary">
                            <i class="fas fa-arrow-left me-2"></i>Back to Blog
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    \`
    
    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    })
}

async function getPostAPI(slug) {
    const posts = await getGoogleSheetsData()
    const post = posts.find(p => p.slug === slug)
    
    if (!post) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Post not found'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        })
    }
    
    return new Response(JSON.stringify({
        success: true,
        post: post
    }), {
        headers: { 'Content-Type': 'application/json' }
    })
}
        `.trim();
    }
}

module.exports = CloudflareManager;