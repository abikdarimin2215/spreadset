// Cloudflare Workers script for blog deployment
// This script serves as a blog backend connected to Google Sheets

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

// Environment variables (set these in Cloudflare Workers dashboard)
const GOOGLE_SHEETS_API_KEY = GOOGLE_API_KEY || 'your-api-key-here'
const SPREADSHEET_ID = SHEETS_ID || '1igvz_FisR1DXWbllea7_oFhh6sLE6lIgtxXPMdmAE3A'
const SHEET_NAME = 'WEBSITE'

// Blog configuration
const BLOG_CONFIG = {
    site_title: 'Blog Sederhana',
    site_description: 'Platform blog yang terhubung dengan Google Sheets untuk manajemen konten yang mudah',
    site_keywords: 'blog, artikel, google sheets, content management',
    current_year: new Date().getFullYear()
}

// Demo data for development
const DEMO_POSTS = [
    {
        id: 1,
        title: 'Cara Membuat Blog dengan Google Sheets',
        slug: 'cara-membuat-blog-dengan-google-sheets',
        content: 'Panduan lengkap untuk membuat blog sederhana yang terhubung dengan Google Sheets sebagai database. Dengan menggunakan Google Sheets, Anda dapat mengelola konten blog dengan mudah tanpa perlu database kompleks.',
        category: 'Tutorial',
        tags: 'blog, google sheets, tutorial, web development',
        author: 'Admin',
        date: '2025-01-18',
        status: 'published'
    },
    {
        id: 2,
        title: 'Optimasi SEO untuk Blog Sederhana',
        slug: 'optimasi-seo-untuk-blog-sederhana',
        content: 'Tips dan trik untuk mengoptimalkan SEO blog Anda. Mulai dari meta description yang tepat, penggunaan heading yang benar, hingga struktur URL yang SEO-friendly.',
        category: 'SEO',
        tags: 'seo, optimasi, blog, search engine',
        author: 'Admin',
        date: '2025-01-17',
        status: 'published'
    },
    {
        id: 3,
        title: 'Deploy Blog ke Cloudflare Workers',
        slug: 'deploy-blog-ke-cloudflare-workers',
        content: 'Panduan step-by-step untuk deploy blog Anda ke Cloudflare Workers. Gratis, cepat, dan mudah digunakan untuk hosting blog sederhana.',
        category: 'Deployment',
        tags: 'cloudflare, workers, deploy, hosting',
        author: 'Admin',
        date: '2025-01-14',
        status: 'published'
    }
]

async function getGoogleSheetsData() {
    // If API key is not configured, use demo data
    if (GOOGLE_SHEETS_API_KEY === 'your-api-key-here') {
        console.log('Using demo data - API Key not configured')
        return DEMO_POSTS
    }

    try {
        const range = `${SHEET_NAME}!A:Z`
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.error) {
            console.error('Google Sheets API Error:', data.error)
            return DEMO_POSTS
        }

        const rows = data.values || []
        
        if (rows.length === 0) {
            console.log('No data found in spreadsheet')
            return DEMO_POSTS
        }

        // Convert rows to objects
        const headers = rows[0]
        const posts = []

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            const post = {}
            
            headers.forEach((header, index) => {
                post[header.toLowerCase()] = row[index] || ''
            })
            
            // Ensure ID exists
            if (!post.id) {
                post.id = i
            }
            
            // Generate slug if not exists
            if (!post.slug && post.title) {
                post.slug = post.title.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .trim()
            }
            
            posts.push(post)
        }

        return posts
    } catch (error) {
        console.error('Error fetching Google Sheets data:', error)
        return DEMO_POSTS
    }
}

async function serveBlogHome() {
    const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${BLOG_CONFIG.site_title}</title>
        <meta name="description" content="${BLOG_CONFIG.site_description}">
        <meta name="keywords" content="${BLOG_CONFIG.site_keywords}">
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
                <a class="navbar-brand" href="/"><i class="fas fa-blog me-2"></i>${BLOG_CONFIG.site_title}</a>
                <div class="navbar-nav ms-auto">
                    <a class="nav-link" href="/">Home</a>
                    <a class="nav-link" href="/blog">Blog</a>
                </div>
            </div>
        </nav>
        
        <div class="hero text-center">
            <div class="container">
                <h1 class="display-4">${BLOG_CONFIG.site_title}</h1>
                <p class="lead">${BLOG_CONFIG.site_description}</p>
            </div>
        </div>
        
        <div class="container mt-5">
            <div class="row">
                <div class="col-lg-8">
                    <div id="posts" class="row">
                        <div class="col-12 text-center">
                            <i class="fas fa-spinner fa-spin fa-2x"></i>
                            <p>Memuat artikel...</p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-body">
                            <h5><i class="fas fa-info-circle me-2"></i>Tentang Blog</h5>
                            <p>${BLOG_CONFIG.site_description}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
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
                            postsContainer.innerHTML = '<div class="col-12 text-center"><p>Tidak ada artikel ditemukan</p></div>'
                            return
                        }
                        
                        postsContainer.innerHTML = posts.map(post => \`
                            <div class="col-md-6 mb-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="card-title">\${post.title}</h5>
                                        <p class="card-text">\${post.content.substring(0, 150)}...</p>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <small class="text-muted">\${post.category} • \${post.date}</small>
                                            <a href="/post/\${post.slug}" class="btn btn-primary btn-sm">Baca</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        \`).join('')
                    }
                } catch (error) {
                    console.error('Error loading posts:', error)
                    document.getElementById('posts').innerHTML = '<div class="col-12 text-center"><p>Gagal memuat artikel</p></div>'
                }
            }
            
            loadPosts()
        </script>
    </body>
    </html>
    `
    
    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    })
}

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

async function getPost(slug) {
    const posts = await getGoogleSheetsData()
    const post = posts.find(p => p.slug === slug)
    
    if (!post) {
        return new Response('Post not found', { status: 404 })
    }
    
    const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${post.title} - ${BLOG_CONFIG.site_title}</title>
        <meta name="description" content="${post.content.substring(0, 160)}">
        <meta name="keywords" content="${post.tags}">
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
                <a class="navbar-brand" href="/"><i class="fas fa-blog me-2"></i>${BLOG_CONFIG.site_title}</a>
                <div class="navbar-nav ms-auto">
                    <a class="nav-link" href="/">Home</a>
                    <a class="nav-link" href="/blog">Blog</a>
                </div>
            </div>
        </nav>
        
        <div class="hero text-center">
            <div class="container">
                <h1 class="display-4">${post.title}</h1>
                <p class="lead">${post.category} • ${post.date} • ${post.author}</p>
            </div>
        </div>
        
        <div class="container mt-5">
            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <div class="post-content">
                        ${post.content.replace(/\n/g, '<br>')}
                    </div>
                    
                    <div class="mt-4">
                        <h6>Tags:</h6>
                        ${post.tags.split(',').map(tag => `<span class="badge bg-primary me-1">${tag.trim()}</span>`).join('')}
                    </div>
                    
                    <div class="mt-4">
                        <a href="/" class="btn btn-outline-primary">
                            <i class="fas fa-arrow-left me-2"></i>Kembali ke Blog
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    `
    
    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
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
            if (tag) {
                tags[tag] = (tags[tag] || 0) + 1
            }
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