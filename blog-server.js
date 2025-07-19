// Blog Server - Menghubungkan Google Sheets dengan Template Blog
const express = require('express');
const fs = require('fs');
const path = require('path');

// Initialize fetch module
let fetch;
const initializeFetch = async () => {
    const { default: fetchModule } = await import('node-fetch');
    fetch = fetchModule;
    return fetch;
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Environment variables
const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY || 'your-api-key-here';
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '14K69q8SMd3pCAROB1YQMDrmuw8y6QphxAslF_y-3NrM';
const SHEET_NAME = process.env.SHEET_NAME || 'WEBSITE';

// Import direct connector
const DirectSheetsConnector = require('./direct-sheets-connector');

// Blog configuration
const BLOG_CONFIG = {
    site_title: 'Blog Sederhana',
    site_description: 'Platform blog yang terhubung dengan Google Sheets untuk manajemen konten yang mudah',
    site_keywords: 'blog, artikel, google sheets, content management',
    current_year: new Date().getFullYear(),
    posts_per_page: 6
};

// Demo data untuk development
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
        title: 'Desain Responsif untuk Blog Modern',
        slug: 'desain-responsif-untuk-blog-modern',
        content: 'Pentingnya desain responsif dalam era mobile-first. Bagaimana membuat blog yang terlihat sempurna di semua perangkat, dari smartphone hingga desktop.',
        category: 'Design',
        tags: 'responsive, design, mobile, ui/ux',
        author: 'Admin',
        date: '2025-01-16',
        status: 'published'
    },
    {
        id: 4,
        title: 'Integrasi API dengan Google Sheets',
        slug: 'integrasi-api-dengan-google-sheets',
        content: 'Cara mengintegrasikan Google Sheets API dengan aplikasi web Anda. Mulai dari setup API key hingga implementasi CRUD operations.',
        category: 'Development',
        tags: 'api, google sheets, integration, development',
        author: 'Admin',
        date: '2025-01-15',
        status: 'published'
    },
    {
        id: 5,
        title: 'Deploy Blog ke Cloudflare Workers',
        slug: 'deploy-blog-ke-cloudflare-workers',
        content: 'Panduan step-by-step untuk deploy blog Anda ke Cloudflare Workers. Gratis, cepat, dan mudah digunakan untuk hosting blog sederhana.',
        category: 'Deployment',
        tags: 'cloudflare, workers, deploy, hosting',
        author: 'Admin',
        date: '2025-01-14',
        status: 'published'
    }
];

// Initialize fetch when server starts
initializeFetch().then(() => {
    console.log('Fetch module initialized');
});

// Function untuk mendapatkan data dari Google Sheets
async function getGoogleSheetsData() {
    if (!fetch) {
        await initializeFetch();
    }

    // Koneksi langsung ke Google Sheets (tanpa API Key)
    try {
        console.log('Mengambil data dari Google Sheets...');
        const directConnector = new DirectSheetsConnector(SPREADSHEET_ID, SHEET_NAME);
        const data = await directConnector.fetchData();
        
        if (data && data.length > 0) {
            console.log(`Data berhasil dimuat dari Google Sheets: ${data.length} rows`);
            return data;
        } else {
            console.log('Data kosong dari Google Sheets, menggunakan demo data');
            return DEMO_POSTS;
        }
    } catch (error) {
        console.log('Koneksi ke Google Sheets gagal:', error.message);
        console.log('Menggunakan demo data sebagai fallback');
        return DEMO_POSTS;
    }
}

// Route untuk halaman blog utama
app.get('/', async (req, res) => {
    try {
        const template = fs.readFileSync('./blog-template.html', 'utf8');
        
        // Replace template variables
        const html = template
            .replace(/\{\{site_title\}\}/g, BLOG_CONFIG.site_title)
            .replace(/\{\{site_description\}\}/g, BLOG_CONFIG.site_description)
            .replace(/\{\{site_keywords\}\}/g, BLOG_CONFIG.site_keywords)
            .replace(/\{\{current_year\}\}/g, BLOG_CONFIG.current_year);
        
        res.send(html);
    } catch (error) {
        console.error('Error serving blog template:', error);
        res.status(500).send('Error loading blog template');
    }
});

// API endpoint untuk mendapatkan posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await getGoogleSheetsData();
        
        // Filter hanya posts yang published
        const publishedPosts = posts.filter(post => 
            post.status === 'published' || !post.status
        );
        
        // Sort by date (newest first)
        publishedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json({
            success: true,
            posts: publishedPosts,
            total: publishedPosts.length
        });
    } catch (error) {
        console.error('Error getting posts:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving posts',
            error: error.message
        });
    }
});

// API endpoint untuk mendapatkan post berdasarkan slug
app.get('/api/post/:slug', async (req, res) => {
    try {
        const posts = await getGoogleSheetsData();
        const post = posts.find(p => p.slug === req.params.slug);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        res.json({
            success: true,
            post: post
        });
    } catch (error) {
        console.error('Error getting post:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving post',
            error: error.message
        });
    }
});

// API endpoint untuk kategori
app.get('/api/categories', async (req, res) => {
    try {
        const posts = await getGoogleSheetsData();
        const categories = {};
        
        posts.forEach(post => {
            const category = post.category || 'Uncategorized';
            categories[category] = (categories[category] || 0) + 1;
        });
        
        res.json({
            success: true,
            categories: categories
        });
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving categories',
            error: error.message
        });
    }
});

// API endpoint untuk tags
app.get('/api/tags', async (req, res) => {
    try {
        const posts = await getGoogleSheetsData();
        const tags = {};
        
        posts.forEach(post => {
            const postTags = post.tags ? post.tags.split(',').map(tag => tag.trim()) : [];
            postTags.forEach(tag => {
                if (tag) {
                    tags[tag] = (tags[tag] || 0) + 1;
                }
            });
        });
        
        res.json({
            success: true,
            tags: tags
        });
    } catch (error) {
        console.error('Error getting tags:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving tags',
            error: error.message
        });
    }
});

// API endpoint untuk statistik
app.get('/api/stats', async (req, res) => {
    try {
        const posts = await getGoogleSheetsData();
        const categories = new Set(posts.map(post => post.category || 'Uncategorized'));
        const tags = new Set();
        
        posts.forEach(post => {
            const postTags = post.tags ? post.tags.split(',').map(tag => tag.trim()) : [];
            postTags.forEach(tag => {
                if (tag) tags.add(tag);
            });
        });
        
        res.json({
            success: true,
            stats: {
                totalPosts: posts.length,
                totalCategories: categories.size,
                totalTags: tags.size,
                publishedPosts: posts.filter(p => p.status === 'published').length
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving statistics',
            error: error.message
        });
    }
});

// Route untuk halaman post individual
app.get('/post/:slug', async (req, res) => {
    try {
        const posts = await getGoogleSheetsData();
        const post = posts.find(p => p.slug === req.params.slug);
        
        if (!post) {
            return res.status(404).send('Post not found');
        }
        
        // Buat template post individual
        const postTemplate = `
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
                .post-header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 60px 0; }
                .post-meta { color: #6b7280; margin-bottom: 2rem; }
                .post-content { line-height: 1.8; font-size: 1.1rem; }
                .post-tags { margin-top: 2rem; }
                .post-tags .badge { margin-right: 0.5rem; }
            </style>
        </head>
        <body>
            <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                <div class="container">
                    <a class="navbar-brand" href="/">
                        <i class="fas fa-blog me-2"></i>
                        ${BLOG_CONFIG.site_title}
                    </a>
                    <div class="collapse navbar-collapse">
                        <ul class="navbar-nav ms-auto">
                            <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
                            <li class="nav-item"><a class="nav-link" href="/blog">Blog</a></li>
                        </ul>
                    </div>
                </div>
            </nav>
            
            <div class="post-header">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-8 mx-auto text-center">
                            <h1 class="display-4">${post.title}</h1>
                            <p class="lead">${post.category || 'Uncategorized'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="container mt-5">
                <div class="row">
                    <div class="col-lg-8 mx-auto">
                        <div class="post-meta">
                            <i class="fas fa-calendar me-1"></i>
                            ${new Date(post.date).toLocaleDateString('id-ID')}
                            <i class="fas fa-user ms-3 me-1"></i>
                            ${post.author || 'Admin'}
                        </div>
                        
                        <div class="post-content">
                            ${post.content.replace(/\n/g, '<br>')}
                        </div>
                        
                        <div class="post-tags">
                            <h6>Tags:</h6>
                            ${post.tags.split(',').map(tag => `<span class="badge bg-primary">${tag.trim()}</span>`).join('')}
                        </div>
                        
                        <div class="mt-5">
                            <a href="/" class="btn btn-outline-primary">
                                <i class="fas fa-arrow-left me-2"></i>
                                Kembali ke Blog
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>
        `;
        
        res.send(postTemplate);
    } catch (error) {
        console.error('Error serving post:', error);
        res.status(500).send('Error loading post');
    }
});

// Route untuk halaman kategori
app.get('/category/:category', async (req, res) => {
    try {
        const posts = await getGoogleSheetsData();
        const categoryPosts = posts.filter(post => 
            post.category === decodeURIComponent(req.params.category)
        );
        
        res.json({
            success: true,
            posts: categoryPosts,
            category: req.params.category
        });
    } catch (error) {
        console.error('Error getting category posts:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving category posts',
            error: error.message
        });
    }
});

// Route untuk halaman tag
app.get('/tag/:tag', async (req, res) => {
    try {
        const posts = await getGoogleSheetsData();
        const tagPosts = posts.filter(post => 
            post.tags && post.tags.includes(decodeURIComponent(req.params.tag))
        );
        
        res.json({
            success: true,
            posts: tagPosts,
            tag: req.params.tag
        });
    } catch (error) {
        console.error('Error getting tag posts:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving tag posts',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Blog Server berjalan di port ${PORT}`);
    console.log(`Buka browser dan akses: http://localhost:${PORT}`);
    console.log('\nKonfigurasi Google Sheets:');
    console.log(`- GOOGLE_SHEETS_API_KEY: ${GOOGLE_SHEETS_API_KEY}`);
    console.log(`- SPREADSHEET_ID: ${SPREADSHEET_ID}`);
    console.log(`- SHEET_NAME: ${SHEET_NAME}`);
    console.log('\nUntuk mengatur environment variables:');
    console.log('export GOOGLE_SHEETS_API_KEY="your-actual-api-key"');
    console.log('export SPREADSHEET_ID="your-actual-spreadsheet-id"');
    console.log('export SHEET_NAME="WEBSITE"');
});