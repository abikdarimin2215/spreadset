def generate_improved_worker_script(config, custom_html_template=None):
    """Generate improved Cloudflare Workers script following best practices"""
    spreadsheet_id = config.get('spreadsheetId', '14K69q8SMd3pCAROB1YQMDrmuw8y6QphxAslF_y-3NrM')
    sheet_name = config.get('sheetName', 'WEBSITE')
    blog_title = config.get('blogTitle', 'My Blog')
    blog_description = config.get('blogDescription', 'Blog powered by Google Sheets')
    blog_keywords = config.get('blogKeywords', 'blog, google sheets')
    
    # Escape custom template for JavaScript
    custom_template_js = "null"
    if custom_html_template:
        import json
        escaped_template = json.dumps(custom_html_template)
        custom_template_js = escaped_template
    
    return f"""// Improved Cloudflare Workers Script
// Following CF Workers best practices
// Generated on: {datetime.now().isoformat()}

// Configuration
const CONFIG = {{
    SPREADSHEET_ID: '{spreadsheet_id}',
    SHEET_NAME: '{sheet_name}',
    BLOG_TITLE: '{blog_title}',
    BLOG_DESCRIPTION: '{blog_description}',
    CORS_HEADERS: {{
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }}
}}

// Custom HTML Template
const CUSTOM_HTML_TEMPLATE = {custom_template_js}

// Main event listener
addEventListener('fetch', event => {{
    event.respondWith(handleRequest(event.request))
}})

// Route handler
async function handleRequest(request) {{
    const url = new URL(request.url)
    const path = url.pathname

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {{
        return handleCORS()
    }}

    // Route handling
    switch (path) {{
        case '/':
            return serveHomePage()
        case '/api/posts':
            return handleAPIResponse(await getPosts())
        case '/api/categories':
            return handleAPIResponse(await getCategories())
        case '/api/stats':
            return handleAPIResponse(await getStats())
        case '/health':
            return handleAPIResponse({{ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                config: {{
                    spreadsheet_id: CONFIG.SPREADSHEET_ID,
                    blog_title: CONFIG.BLOG_TITLE,
                    custom_template: CUSTOM_HTML_TEMPLATE !== null
                }}
            }})
        default:
            return new Response('Not Found', {{ status: 404 }})
    }}
}}

// CORS handler
function handleCORS() {{
    return new Response(null, {{
        status: 200,
        headers: CONFIG.CORS_HEADERS
    }})
}}

// API response wrapper
function handleAPIResponse(data) {{
    return new Response(JSON.stringify(data), {{
        headers: {{
            'Content-Type': 'application/json',
            ...CONFIG.CORS_HEADERS
        }}
    }})
}}

// Fetch Google Sheets data
async function fetchSheetsData() {{
    try {{
        const urls = [
            `https://docs.google.com/spreadsheets/d/${{CONFIG.SPREADSHEET_ID}}/export?format=csv&gid=0`,
            `https://docs.google.com/spreadsheets/d/${{CONFIG.SPREADSHEET_ID}}/export?format=csv`,
            `https://docs.google.com/spreadsheets/d/${{CONFIG.SPREADSHEET_ID}}/gviz/tq?tqx=out:csv&sheet=${{CONFIG.SHEET_NAME}}`
        ]

        for (const url of urls) {{
            try {{
                console.log(`Trying URL: ${{url}}`)
                const response = await fetch(url, {{
                    headers: {{
                        'User-Agent': 'Mozilla/5.0 (compatible; CF-Worker/1.0)'
                    }}
                }})

                if (response.ok && !response.url.includes('accounts.google.com')) {{
                    const csvText = await response.text()
                    if (csvText && !csvText.includes('<!DOCTYPE') && !csvText.includes('<html')) {{
                        return parseCSV(csvText)
                    }}
                }}
            }} catch (error) {{
                console.error(`Error with URL ${{url}}:`, error)
                continue
            }}
        }}

        return []
    }} catch (error) {{
        console.error('Error fetching sheets data:', error)
        return []
    }}
}}

// Parse CSV data
function parseCSV(csvText) {{
    const lines = csvText.trim().split('\\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
    const posts = []

    for (let i = 1; i < lines.length; i++) {{
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
        if (values.length < headers.length) continue

        const post = {{}}
        headers.forEach((header, index) => {{
            post[header] = values[index] || ''
        }})

        // Skip empty posts
        if (!post.title && !post.content) continue

        // Create slug from title
        post.slug = (post.title || '').toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        posts.push(post)
    }}

    return posts
}}

// API endpoints
async function getPosts() {{
    const posts = await fetchSheetsData()
    const publishedPosts = posts.filter(post => 
        post.status !== 'draft' && post.title && post.title.trim()
    )

    return {{
        success: true,
        posts: publishedPosts,
        total: publishedPosts.length
    }}
}}

async function getCategories() {{
    const posts = await fetchSheetsData()
    const categories = {{}}

    posts.forEach(post => {{
        const category = post.category || 'Uncategorized'
        categories[category] = (categories[category] || 0) + 1
    }})

    return {{
        success: true,
        categories: Object.keys(categories).map(name => ({{
            name,
            count: categories[name]
        }}))
    }}
}}

async function getStats() {{
    const posts = await fetchSheetsData()
    const categories = new Set()
    const tags = new Set()

    posts.forEach(post => {{
        if (post.category) categories.add(post.category)
        if (post.tags) {{
            post.tags.split(',').forEach(tag => tags.add(tag.trim()))
        }}
    }})

    return {{
        success: true,
        stats: {{
            totalPosts: posts.length,
            totalCategories: categories.size,
            totalTags: tags.size,
            lastUpdated: new Date().toISOString()
        }}
    }}
}}

// Serve homepage
async function serveHomePage() {{
    // Use custom template if available
    if (CUSTOM_HTML_TEMPLATE) {{
        console.log('Using custom HTML template')
        
        // Replace template variables in custom template
        let html = CUSTOM_HTML_TEMPLATE
        html = html.replace(/\\{\\{blog_title\\}\\}/g, CONFIG.BLOG_TITLE)
        html = html.replace(/\\{\\{blog_description\\}\\}/g, CONFIG.BLOG_DESCRIPTION)
        html = html.replace(/\\{\\{site_title\\}\\}/g, CONFIG.BLOG_TITLE)
        html = html.replace(/\\{\\{site_description\\}\\}/g, CONFIG.BLOG_DESCRIPTION)
        html = html.replace(/\\{\\{current_year\\}\\}/g, new Date().getFullYear())
        
        return new Response(html, {{
            headers: {{ 
                'Content-Type': 'text/html',
                ...CONFIG.CORS_HEADERS 
            }}
        }})
    }}

    // Default template if no custom template
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${{CONFIG.BLOG_TITLE}}</title>
    <meta name="description" content="${{CONFIG.BLOG_DESCRIPTION}}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {{
            --primary-color: #2563eb;
            --secondary-color: #1d4ed8;
            --accent-color: #3b82f6;
        }}
        
        .hero {{
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            color: white;
            padding: 4rem 0;
            margin-bottom: 2rem;
        }}
        
        .card {{
            transition: transform 0.2s, box-shadow 0.2s;
            border: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        .card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }}
        
        .loading {{
            text-align: center;
            padding: 3rem;
            color: #6c757d;
        }}
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-light sticky-top">
        <div class="container">
            <a class="navbar-brand" href="/">
                <i class="fas fa-blog me-2"></i>${{CONFIG.BLOG_TITLE}}
            </a>
        </div>
    </nav>

    <div class="hero text-center">
        <div class="container">
            <h1 class="display-4">${{CONFIG.BLOG_TITLE}}</h1>
            <p class="lead">${{CONFIG.BLOG_DESCRIPTION}}</p>
            <p><small><i class="fas fa-cloud me-1"></i>Powered by Cloudflare Workers</small></p>
        </div>
    </div>

    <div class="container">
        <div class="row">
            <div class="col-lg-8">
                <h2 class="mb-4"><i class="fas fa-newspaper me-2"></i>Latest Posts</h2>
                <div id="postsContainer" class="row">
                    <div class="col-12 loading">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p class="mt-2">Loading posts...</p>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-body">
                        <h5><i class="fas fa-chart-bar me-2"></i>Statistics</h5>
                        <div id="statsContainer">
                            <p><i class="fas fa-spinner fa-spin"></i> Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <footer class="bg-dark text-white mt-5 py-4">
        <div class="container text-center">
            <p>&copy; ${{new Date().getFullYear()}} ${{CONFIG.BLOG_TITLE}}</p>
            <p class="text-muted"><small>Powered by CF Workers</small></p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Load posts
        async function loadPosts() {{
            try {{
                const response = await fetch('/api/posts');
                const data = await response.json();
                
                const container = document.getElementById('postsContainer');
                
                if (data.success && data.posts && data.posts.length > 0) {{
                    container.innerHTML = data.posts.map(post => \`
                        <div class="col-md-6 mb-4">
                            <div class="card h-100">
                                <div class="card-body d-flex flex-column">
                                    <h5 class="card-title">\${{post.title || 'Untitled'}}</h5>
                                    <p class="card-text flex-grow-1">\${{(post.content || '').substring(0, 120)}}...</p>
                                    <div class="mt-auto">
                                        <small class="text-muted">
                                            <i class="fas fa-folder me-1"></i>\${{post.category || 'General'}}
                                            <span class="ms-2">\${{post.date || 'No date'}}</span>
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`).join('');
                }} else {{
                    container.innerHTML = \`
                        <div class="col-12 text-center py-5">
                            <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                            <h4>No Posts Found</h4>
                            <p class="text-muted">Add content to your Google Sheets.</p>
                        </div>
                    \`;
                }}
            }} catch (error) {{
                console.error('Error loading posts:', error);
                document.getElementById('postsContainer').innerHTML = \`
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <h4>Error Loading Posts</h4>
                    </div>
                \`;
            }}
        }}

        // Load stats
        async function loadStats() {{
            try {{
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                if (data.success) {{
                    const stats = data.stats;
                    document.getElementById('statsContainer').innerHTML = \`
                        <div class="row text-center">
                            <div class="col-4">
                                <h6>\${{stats.totalPosts}}</h6>
                                <small class="text-muted">Posts</small>
                            </div>
                            <div class="col-4">
                                <h6>\${{stats.totalCategories}}</h6>
                                <small class="text-muted">Categories</small>
                            </div>
                            <div class="col-4">
                                <h6>\${{stats.totalTags}}</h6>
                                <small class="text-muted">Tags</small>
                            </div>
                        </div>
                    \`;
                }}
            }} catch (error) {{
                console.error('Error loading stats:', error);
            }}
        }}

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {{
            loadPosts();
            loadStats();
        }});
    </script>
</body>
</html>`

    return new Response(html, {{
        headers: {{ 
            'Content-Type': 'text/html',
            ...CONFIG.CORS_HEADERS 
        }}
    }})
}}"""