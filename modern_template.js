// Modern Cloudflare Workers Template
// Auto-deployable with clean structure

// Configuration - will be replaced during deployment
const CONFIG = {
    SPREADSHEET_ID: '{{SPREADSHEET_ID}}',
    SHEET_NAME: '{{SHEET_NAME}}',
    BLOG_TITLE: '{{BLOG_TITLE}}',
    BLOG_DESCRIPTION: '{{BLOG_DESCRIPTION}}',
    PRIMARY_COLOR: '{{PRIMARY_COLOR}}',
    SECONDARY_COLOR: '{{SECONDARY_COLOR}}'
}

// Main event listener
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

// Request router
async function handleRequest(request) {
    const url = new URL(request.url)
    const path = url.pathname

    // CORS for all requests
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders })
    }

    try {
        let response

        switch (path) {
            case '/':
                response = await serveBlog()
                break
            case '/api/posts':
                response = await apiResponse(await fetchPosts())
                break
            case '/api/stats':
                response = await apiResponse(await fetchStats())
                break
            case '/health':
                response = await apiResponse({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    config: CONFIG.BLOG_TITLE
                })
                break
            default:
                response = new Response('Not Found', { status: 404 })
        }

        // Add CORS headers
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value)
        })

        return response

    } catch (error) {
        console.error('Request error:', error)
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
    }
}

// API response wrapper
async function apiResponse(data) {
    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
    })
}

// Fetch data from Google Sheets
async function fetchSheetsData() {
    const urls = [
        `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/export?format=csv&gid=0`,
        `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/export?format=csv`
    ]

    for (const url of urls) {
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'CF-Workers-Blog/1.0' }
            })

            if (response.ok && response.status === 200) {
                const csvText = await response.text()
                if (csvText && !csvText.includes('<!DOCTYPE') && csvText.includes(',')) {
                    return parseCSV(csvText)
                }
            }
        } catch (error) {
            console.error(`Failed to fetch from ${url}:`, error)
        }
    }

    return []
}

// Simple CSV parser
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
    const posts = []

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
        if (values.length < headers.length) continue

        const post = {}
        headers.forEach((header, index) => {
            post[header] = values[index] || ''
        })

        if (post.title && post.title.trim()) {
            posts.push(post)
        }
    }

    return posts
}

// Get posts data
async function fetchPosts() {
    const posts = await fetchSheetsData()
    return {
        success: true,
        posts: posts.filter(post => post.status !== 'draft'),
        total: posts.length
    }
}

// Get statistics
async function fetchStats() {
    const posts = await fetchSheetsData()
    const categories = new Set()
    const tags = new Set()

    posts.forEach(post => {
        if (post.category) categories.add(post.category)
        if (post.tags) {
            post.tags.split(',').forEach(tag => tags.add(tag.trim()))
        }
    })

    return {
        success: true,
        stats: {
            totalPosts: posts.length,
            totalCategories: categories.size,
            totalTags: tags.size
        }
    }
}

// Serve main blog page
async function serveBlog() {
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${CONFIG.BLOG_TITLE}</title>
    <meta name="description" content="${CONFIG.BLOG_DESCRIPTION}">
    
    <!-- Bootstrap 5.3 & Font Awesome -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
    
    <style>
        :root {
            --primary: ${CONFIG.PRIMARY_COLOR || '#2563eb'};
            --secondary: ${CONFIG.SECONDARY_COLOR || '#1d4ed8'};
            --gradient: linear-gradient(135deg, var(--primary), var(--secondary));
        }

        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        
        .navbar-brand { 
            font-weight: 700; 
            color: var(--primary) !important; 
        }
        
        .hero {
            background: var(--gradient);
            color: white;
            padding: 4rem 0;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" fill="white" opacity="0.1"><path d="M0,0v50c0,0,250,50,500,50s500-50,500-50V0H0z"/></svg>');
            background-size: cover;
            background-position: bottom;
        }
        
        .hero .container { position: relative; z-index: 2; }
        
        .card {
            border: none;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
            height: 100%;
        }
        
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
        
        .btn-primary {
            background: var(--primary);
            border-color: var(--primary);
            transition: all 0.2s;
        }
        
        .btn-primary:hover {
            background: var(--secondary);
            border-color: var(--secondary);
            transform: translateY(-1px);
        }
        
        .navbar { backdrop-filter: blur(10px); }
        
        .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            color: #6b7280;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .stats-card {
            background: var(--gradient);
            color: white;
        }
        
        .stats-number {
            font-size: 2rem;
            font-weight: 700;
        }
        
        footer {
            background: #111827;
            color: white;
        }

        @media (max-width: 768px) {
            .hero { padding: 2rem 0; }
            .hero h1 { font-size: 2rem; }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top border-bottom">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="/">
                <i class="fas fa-blog me-2"></i>
                ${CONFIG.BLOG_TITLE}
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <div class="navbar-nav ms-auto">
                    <a class="nav-link" href="#home">Home</a>
                    <a class="nav-link" href="#posts">Posts</a>
                    <a class="nav-link" href="#about">About</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section id="home" class="hero text-center">
        <div class="container">
            <h1 class="display-4 fw-bold mb-3">${CONFIG.BLOG_TITLE}</h1>
            <p class="lead mb-4">${CONFIG.BLOG_DESCRIPTION}</p>
            <div class="d-flex justify-content-center align-items-center gap-3">
                <i class="fas fa-cloud text-white-50"></i>
                <small class="opacity-75">Powered by Cloudflare Workers & Google Sheets</small>
            </div>
        </div>
    </section>

    <!-- Main Content -->
    <section id="posts" class="py-5">
        <div class="container">
            <div class="row">
                <!-- Posts Column -->
                <div class="col-lg-8 mb-4">
                    <div class="d-flex align-items-center mb-4">
                        <i class="fas fa-newspaper text-primary me-2 fs-4"></i>
                        <h2 class="mb-0">Latest Posts</h2>
                    </div>
                    <div id="postsContainer">
                        <div class="loading">
                            <div class="spinner mb-3"></div>
                            <p>Loading amazing content...</p>
                        </div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="col-lg-4">
                    <div class="sticky-top" style="top: 120px;">
                        <!-- Stats Card -->
                        <div class="card stats-card mb-4">
                            <div class="card-body text-center">
                                <h5 class="card-title">
                                    <i class="fas fa-chart-line me-2"></i>Blog Stats
                                </h5>
                                <div id="statsContainer" class="row mt-3">
                                    <div class="col text-center">
                                        <div class="spinner-border spinner-border-sm text-white" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- About Card -->
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-info-circle me-2 text-primary"></i>About
                                </h5>
                                <p class="card-text">${CONFIG.BLOG_DESCRIPTION}</p>
                                <div class="d-flex align-items-center text-muted">
                                    <i class="fas fa-database me-2"></i>
                                    <small>Real-time data from Google Sheets</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer id="about" class="py-5">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <h5 class="text-white">${CONFIG.BLOG_TITLE}</h5>
                    <p class="text-white-50 mb-0">${CONFIG.BLOG_DESCRIPTION}</p>
                </div>
                <div class="col-md-6 text-md-end mt-3 mt-md-0">
                    <p class="mb-1">&copy; ${new Date().getFullYear()} ${CONFIG.BLOG_TITLE}</p>
                    <small class="text-white-50">Modern CF Workers Template</small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        // Modern async data loading
        class BlogLoader {
            constructor() {
                this.postsContainer = document.getElementById('postsContainer')
                this.statsContainer = document.getElementById('statsContainer')
                this.init()
            }

            async init() {
                await Promise.all([
                    this.loadPosts(),
                    this.loadStats()
                ])
                
                // Auto-refresh every 5 minutes
                setInterval(() => {
                    this.loadPosts()
                    this.loadStats()
                }, 300000)
            }

            async loadPosts() {
                try {
                    const response = await fetch('/api/posts')
                    const data = await response.json()
                    
                    if (data.success && data.posts?.length > 0) {
                        this.renderPosts(data.posts)
                    } else {
                        this.renderEmptyState()
                    }
                } catch (error) {
                    console.error('Error loading posts:', error)
                    this.renderErrorState()
                }
            }

            async loadStats() {
                try {
                    const response = await fetch('/api/stats')
                    const data = await response.json()
                    
                    if (data.success) {
                        this.renderStats(data.stats)
                    }
                } catch (error) {
                    console.error('Error loading stats:', error)
                    this.statsContainer.innerHTML = '<div class="col"><small>Stats unavailable</small></div>'
                }
            }

            renderPosts(posts) {
                this.postsContainer.innerHTML = \`
                    <div class="row">
                        \${posts.map(post => \`
                            <div class="col-md-6 mb-4">
                                <div class="card">
                                    <div class="card-body d-flex flex-column">
                                        <h5 class="card-title">\${this.escapeHtml(post.title || 'Untitled')}</h5>
                                        <p class="card-text flex-grow-1 text-muted">
                                            \${this.escapeHtml((post.content || '').substring(0, 120))}...
                                        </p>
                                        <div class="d-flex justify-content-between align-items-center mt-3">
                                            <div class="d-flex flex-column">
                                                <small class="text-primary">
                                                    <i class="fas fa-folder me-1"></i>\${this.escapeHtml(post.category || 'General')}
                                                </small>
                                                <small class="text-muted">
                                                    <i class="fas fa-calendar me-1"></i>\${this.escapeHtml(post.date || 'No date')}
                                                </small>
                                            </div>
                                            \${post.tags ? \`<span class="badge bg-primary">\${this.escapeHtml(post.tags.split(',')[0])}</span>\` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                \`
            }

            renderStats(stats) {
                this.statsContainer.innerHTML = \`
                    <div class="col-4">
                        <div class="stats-number">\${stats.totalPosts || 0}</div>
                        <small>Posts</small>
                    </div>
                    <div class="col-4">
                        <div class="stats-number">\${stats.totalCategories || 0}</div>
                        <small>Categories</small>
                    </div>
                    <div class="col-4">
                        <div class="stats-number">\${stats.totalTags || 0}</div>
                        <small>Tags</small>
                    </div>
                \`
            }

            renderEmptyState() {
                this.postsContainer.innerHTML = \`
                    <div class="text-center py-5">
                        <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                        <h4>No Posts Yet</h4>
                        <p class="text-muted mb-4">Add content to your Google Sheets to see posts here.</p>
                        <a href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/edit" 
                           target="_blank" 
                           class="btn btn-primary">
                            <i class="fas fa-external-link-alt me-1"></i>Open Google Sheets
                        </a>
                    </div>
                \`
            }

            renderErrorState() {
                this.postsContainer.innerHTML = \`
                    <div class="text-center py-5">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <h4>Error Loading Posts</h4>
                        <p class="text-muted">Please check the Google Sheets connection.</p>
                        <button class="btn btn-outline-primary" onclick="blogLoader.loadPosts()">
                            <i class="fas fa-redo me-1"></i>Try Again
                        </button>
                    </div>
                \`
            }

            escapeHtml(text) {
                const div = document.createElement('div')
                div.textContent = text
                return div.innerHTML
            }
        }

        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            window.blogLoader = new BlogLoader()
        })

        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault()
                const target = document.querySelector(this.getAttribute('href'))
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            })
        })
    </script>
</body>
</html>`

    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    })
}