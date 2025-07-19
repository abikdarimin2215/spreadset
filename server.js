// Server Express.js untuk development lokal
// Simulasi Cloudflare Workers untuk testing

const express = require('express');
// Initialize fetch module
let fetch;
const initializeFetch = async () => {
    const { default: fetchModule } = await import('node-fetch');
    fetch = fetchModule;
    return fetch;
};
const path = require('path');

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
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || 'your-spreadsheet-id-here';
const SHEET_NAME = 'WEBSITE';

// HTML Template (sama seperti di Cloudflare Workers)
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Sheets Real-time Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: #2563eb;
            --secondary-color: #64748b;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --danger-color: #ef4444;
            --dark-color: #1e293b;
            --light-color: #f8fafc;
        }

        body {
            background: linear-gradient(135deg, var(--light-color) 0%, #e2e8f0 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
        }

        .navbar {
            background: linear-gradient(135deg, var(--primary-color) 0%, #1d4ed8 100%);
            box-shadow: 0 2px 10px rgba(37, 99, 235, 0.2);
        }

        .navbar-brand {
            font-weight: 700;
            font-size: 1.5rem;
        }

        .card {
            border: none;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.15);
        }

        .stats-card {
            background: linear-gradient(135deg, var(--primary-color) 0%, #3b82f6 100%);
            color: white;
        }

        .stats-card .card-body {
            padding: 1.5rem;
        }

        .stats-number {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .stats-label {
            font-size: 0.875rem;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .data-table {
            background: white;
            border-radius: 12px;
            overflow: hidden;
        }

        .table th {
            background: var(--primary-color);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.875rem;
            letter-spacing: 0.5px;
            border: none;
            padding: 1rem;
        }

        .table td {
            padding: 1rem;
            vertical-align: middle;
            border-color: #e2e8f0;
        }

        .table tbody tr:hover {
            background-color: #f8fafc;
        }

        .status-badge {
            padding: 0.375rem 0.75rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-success {
            background: var(--success-color);
            color: white;
        }

        .status-warning {
            background: var(--warning-color);
            color: white;
        }

        .status-danger {
            background: var(--danger-color);
            color: white;
        }

        .status-info {
            background: var(--primary-color);
            color: white;
        }

        .btn-refresh {
            background: linear-gradient(135deg, var(--success-color) 0%, #059669 100%);
            border: none;
            border-radius: 8px;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            color: white;
            transition: all 0.2s;
        }

        .btn-refresh:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .loading-spinner {
            display: none;
            margin: 2rem auto;
            text-align: center;
        }

        .spinner-border {
            width: 3rem;
            height: 3rem;
            border-width: 0.3em;
        }

        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
        }

        .connection-online {
            background: var(--success-color);
            color: white;
        }

        .connection-offline {
            background: var(--danger-color);
            color: white;
        }

        .search-box {
            border-radius: 8px;
            border: 2px solid #e2e8f0;
            padding: 0.75rem;
            transition: border-color 0.2s;
        }

        .search-box:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .action-buttons {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        .btn-sm {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
            border-radius: 6px;
        }

        .alert {
            border-radius: 8px;
            border: none;
            margin-bottom: 1rem;
        }

        .alert-warning {
            background: linear-gradient(135deg, var(--warning-color) 0%, #f59e0b 100%);
            color: white;
        }

        .alert-info {
            background: linear-gradient(135deg, var(--primary-color) 0%, #3b82f6 100%);
            color: white;
        }

        @media (max-width: 768px) {
            .table-responsive {
                font-size: 0.875rem;
            }
            
            .stats-number {
                font-size: 2rem;
            }
            
            .action-buttons {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container">
            <a class="navbar-brand" href="#">
                <i class="fas fa-table me-2"></i>
                Google Sheets Dashboard
            </a>
            <div class="navbar-nav ms-auto">
                <div class="nav-item">
                    <button class="btn btn-refresh" onclick="refreshData()">
                        <i class="fas fa-sync-alt me-2"></i>
                        Refresh Data
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Connection Status -->
    <div id="connectionStatus" class="connection-status connection-online">
        <i class="fas fa-wifi me-2"></i>
        Terhubung ke Google Sheets
    </div>

    <!-- Main Content -->
    <div class="container mt-4">
        <!-- Configuration Alert -->
        <div class="alert alert-warning" id="configAlert" style="display: none;">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Konfigurasi Diperlukan:</strong> Silakan atur Google Sheets API Key dan Spreadsheet ID.
        </div>

        <!-- Instructions -->
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Petunjuk:</strong> Aplikasi ini menampilkan data dari Google Sheets secara real-time. 
            Pastikan Anda telah mengonfigurasi API Key dan Spreadsheet ID yang benar.
        </div>

        <!-- Statistics Cards -->
        <div class="row mb-4">
            <div class="col-md-3 mb-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-number" id="totalRows">0</div>
                        <div class="stats-label">Total Rows</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-number" id="processedRows">0</div>
                        <div class="stats-label">Processed</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-number" id="errorRows">0</div>
                        <div class="stats-label">Errors</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-number" id="lastUpdate">-</div>
                        <div class="stats-label">Last Update</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Filter -->
        <div class="row mb-4">
            <div class="col-md-8">
                <input type="text" class="form-control search-box" id="searchInput" 
                       placeholder="Cari data..." onkeyup="filterData()">
            </div>
            <div class="col-md-4">
                <select class="form-select search-box" id="statusFilter" onchange="filterData()">
                    <option value="">Semua Status</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                    <option value="pending">Pending</option>
                </select>
            </div>
        </div>

        <!-- Data Table -->
        <div class="card data-table">
            <div class="card-header">
                <h5 class="card-title mb-0">
                    <i class="fas fa-database me-2"></i>
                    Data Google Sheets
                </h5>
            </div>
            <div class="card-body p-0">
                <div class="loading-spinner" id="loadingSpinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="mt-2">Memuat data...</div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover mb-0" id="dataTable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Keyword</th>
                                <th>Title</th>
                                <th>Content</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="dataTableBody">
                            <!-- Data akan dimuat di sini -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Konfigurasi aplikasi
        const CONFIG = {
            refreshInterval: 30000, // 30 detik
            itemsPerPage: 10,
            maxRetries: 3
        };

        // State management
        let currentData = [];
        let filteredData = [];
        let currentPage = 1;
        let refreshTimer;

        // Inisialisasi aplikasi
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
        });

        function initializeApp() {
            console.log('Inisialisasi aplikasi...');
            loadData();
            startAutoRefresh();
            updateConnectionStatus(true);
        }

        // Memuat data dari Google Sheets
        async function loadData() {
            try {
                showLoading(true);
                updateConnectionStatus(true);
                
                const response = await fetch('/api/sheets/data');
                
                if (!response.ok) {
                    throw new Error(\`HTTP error! status: \${response.status}\`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    currentData = data.data || [];
                    filteredData = [...currentData];
                    updateStatistics();
                    renderTable();
                    hideConfigAlert();
                    console.log('Data berhasil dimuat:', currentData.length, 'rows');
                } else {
                    throw new Error(data.message || 'Gagal memuat data');
                }
                
            } catch (error) {
                console.error('Error memuat data:', error);
                showError('Gagal memuat data dari Google Sheets');
                updateConnectionStatus(false);
                
                if (error.message.includes('API key') || error.message.includes('Spreadsheet ID')) {
                    showConfigAlert();
                }
            } finally {
                showLoading(false);
            }
        }

        // Refresh data
        function refreshData() {
            console.log('Refresh data...');
            loadData();
        }

        // Filter data
        function filterData() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const statusFilter = document.getElementById('statusFilter').value;
            
            filteredData = currentData.filter(row => {
                const matchesSearch = !searchTerm || 
                    row.keyword?.toLowerCase().includes(searchTerm) ||
                    row.title?.toLowerCase().includes(searchTerm) ||
                    row.content?.toLowerCase().includes(searchTerm);
                
                const matchesStatus = !statusFilter || row.status === statusFilter;
                
                return matchesSearch && matchesStatus;
            });
            
            currentPage = 1;
            renderTable();
        }

        // Render tabel
        function renderTable() {
            const tableBody = document.getElementById('dataTableBody');
            const startIndex = (currentPage - 1) * CONFIG.itemsPerPage;
            const endIndex = startIndex + CONFIG.itemsPerPage;
            const pageData = filteredData.slice(startIndex, endIndex);
            
            if (pageData.length === 0) {
                tableBody.innerHTML = \`
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                            <div>Tidak ada data yang ditemukan</div>
                        </td>
                    </tr>
                \`;
                return;
            }
            
            tableBody.innerHTML = pageData.map((row, index) => \`
                <tr>
                    <td><strong>\${startIndex + index + 1}</strong></td>
                    <td>
                        <div class="fw-bold">\${row.keyword || '-'}</div>
                    </td>
                    <td>
                        <div class="text-truncate" style="max-width: 200px;" title="\${row.title || '-'}">
                            \${row.title || '-'}
                        </div>
                    </td>
                    <td>
                        <div class="text-truncate" style="max-width: 150px;" title="\${row.content || '-'}">
                            \${row.content || '-'}
                        </div>
                    </td>
                    <td>
                        <span class="status-badge \${getStatusClass(row.status)}">
                            \${row.status || 'pending'}
                        </span>
                    </td>
                    <td>
                        <small class="text-muted">
                            \${formatDate(row.created) || '-'}
                        </small>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="viewRow(\${startIndex + index})" title="Lihat Detail">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="editRow(\${startIndex + index})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            \`).join('');
        }

        // Update statistik
        function updateStatistics() {
            const totalRows = currentData.length;
            const processedRows = currentData.filter(row => row.status === 'success').length;
            const errorRows = currentData.filter(row => row.status === 'error').length;
            const lastUpdate = new Date().toLocaleTimeString('id-ID');
            
            document.getElementById('totalRows').textContent = totalRows;
            document.getElementById('processedRows').textContent = processedRows;
            document.getElementById('errorRows').textContent = errorRows;
            document.getElementById('lastUpdate').textContent = lastUpdate;
        }

        // Utility functions
        function getStatusClass(status) {
            switch(status) {
                case 'success': return 'status-success';
                case 'error': return 'status-danger';
                case 'pending': return 'status-warning';
                default: return 'status-info';
            }
        }

        function formatDate(dateString) {
            if (!dateString) return null;
            const date = new Date(dateString);
            return date.toLocaleString('id-ID');
        }

        function showLoading(show) {
            const spinner = document.getElementById('loadingSpinner');
            const table = document.getElementById('dataTable');
            
            if (show) {
                spinner.style.display = 'block';
                table.style.display = 'none';
            } else {
                spinner.style.display = 'none';
                table.style.display = 'table';
            }
        }

        function showError(message) {
            console.error(message);
            // Implementasi toast notification bisa ditambahkan di sini
        }

        function showConfigAlert() {
            document.getElementById('configAlert').style.display = 'block';
        }

        function hideConfigAlert() {
            document.getElementById('configAlert').style.display = 'none';
        }

        function updateConnectionStatus(isOnline) {
            const statusEl = document.getElementById('connectionStatus');
            if (isOnline) {
                statusEl.className = 'connection-status connection-online';
                statusEl.innerHTML = '<i class="fas fa-wifi me-2"></i>Terhubung ke Google Sheets';
            } else {
                statusEl.className = 'connection-status connection-offline';
                statusEl.innerHTML = '<i class="fas fa-wifi me-2"></i>Koneksi Terputus';
            }
        }

        function startAutoRefresh() {
            refreshTimer = setInterval(() => {
                loadData();
            }, CONFIG.refreshInterval);
        }

        function stopAutoRefresh() {
            if (refreshTimer) {
                clearInterval(refreshTimer);
                refreshTimer = null;
            }
        }

        // Action handlers
        function viewRow(index) {
            const row = filteredData[index];
            alert('View Detail:\\n\\n' + JSON.stringify(row, null, 2));
        }

        function editRow(index) {
            const row = filteredData[index];
            const newKeyword = prompt('Edit Keyword:', row.keyword || '');
            if (newKeyword !== null && newKeyword !== row.keyword) {
                // Implementasi update ke server
                console.log('Update row:', { ...row, keyword: newKeyword });
            }
        }

        // Event listeners
        window.addEventListener('beforeunload', function() {
            stopAutoRefresh();
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                stopAutoRefresh();
            } else {
                startAutoRefresh();
                loadData();
            }
        });
    </script>
</body>
</html>
`;

// Routes
app.get('/', (req, res) => {
    res.send(HTML_TEMPLATE);
});

app.get('/api/sheets/data', async (req, res) => {
    try {
        // Ensure fetch is initialized
        if (!fetch) {
            await initializeFetch();
        }
        
        // Validasi konfigurasi
        if (!GOOGLE_SHEETS_API_KEY || GOOGLE_SHEETS_API_KEY === 'your-api-key-here') {
            // Return demo data for development
            console.log('Menggunakan demo data - API Key belum dikonfigurasi');
            
            const demoData = [
                {
                    id: 1,
                    keyword: 'tutorial seo',
                    title: 'Tutorial SEO Lengkap untuk Pemula',
                    content: 'Panduan lengkap belajar SEO dari dasar hingga mahir. Meliputi keyword research, on-page SEO, dan off-page SEO.',
                    status: 'success',
                    created: '2024-01-15T10:00:00Z',
                    updated: '2024-01-15T15:30:00Z'
                },
                {
                    id: 2,
                    keyword: 'web design',
                    title: 'Prinsip Dasar Web Design Modern',
                    content: 'Memahami prinsip-prinsip dasar web design yang modern dan user-friendly.',
                    status: 'pending',
                    created: '2024-01-16T09:00:00Z',
                    updated: ''
                },
                {
                    id: 3,
                    keyword: 'digital marketing',
                    title: 'Strategi Digital Marketing 2024',
                    content: 'Strategi pemasaran digital terbaru untuk meningkatkan brand awareness dan conversion.',
                    status: 'error',
                    created: '2024-01-17T08:00:00Z',
                    updated: '2024-01-17T08:30:00Z'
                },
                {
                    id: 4,
                    keyword: 'content writing',
                    title: 'Tips Content Writing yang Efektif',
                    content: 'Cara menulis konten yang menarik dan SEO-friendly untuk blog dan website.',
                    status: 'success',
                    created: '2024-01-18T07:00:00Z',
                    updated: '2024-01-18T07:45:00Z'
                },
                {
                    id: 5,
                    keyword: 'social media',
                    title: 'Mengelola Media Sosial untuk Bisnis',
                    content: 'Panduan lengkap mengelola media sosial untuk meningkatkan engagement dan penjualan.',
                    status: 'pending',
                    created: '2024-01-19T06:00:00Z',
                    updated: ''
                }
            ];
            
            return res.json({
                success: true,
                data: demoData,
                total: demoData.length,
                timestamp: new Date().toISOString(),
                demo: true
            });
        }
        
        if (!SPREADSHEET_ID || SPREADSHEET_ID === 'your-spreadsheet-id-here') {
            return res.status(400).json({
                success: false,
                message: 'Spreadsheet ID tidak dikonfigurasi'
            });
        }
        
        // URL untuk Google Sheets API
        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${GOOGLE_SHEETS_API_KEY}`;
        
        console.log('Mengambil data dari Google Sheets...');
        
        // Fetch data dari Google Sheets
        const response = await fetch(sheetsUrl);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google Sheets API Error:', response.status, errorText);
            
            throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        // Parse data ke format yang dibutuhkan
        const rows = data.values || [];
        const headers = rows[0] || [];
        const dataRows = rows.slice(1);
        
        console.log(`Data ditemukan: ${dataRows.length} rows`);
        
        // Simulasi data jika sheet kosong
        const parsedData = dataRows.length > 0 ? dataRows.map((row, index) => ({
            id: index + 1,
            keyword: row[0] || '',
            title: row[1] || '',
            content: row[2] || '',
            status: row[3] || 'pending',
            created: row[4] || new Date().toISOString(),
            updated: row[5] || ''
        })) : [
            {
                id: 1,
                keyword: 'contoh keyword',
                title: 'Contoh Title',
                content: 'Contoh content untuk demonstrasi',
                status: 'success',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            },
            {
                id: 2,
                keyword: 'keyword kedua',
                title: 'Title Kedua',
                content: 'Content kedua untuk testing',
                status: 'pending',
                created: new Date().toISOString(),
                updated: ''
            }
        ];
        
        res.json({
            success: true,
            data: parsedData,
            total: parsedData.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting data:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/api/sheets/update', async (req, res) => {
    try {
        const requestData = req.body;
        
        // Validasi data
        if (!requestData || !requestData.id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required data'
            });
        }
        
        console.log('Update request:', requestData);
        
        // Untuk demo, return success
        res.json({
            success: true,
            message: 'Data updated successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.delete('/api/sheets/delete', async (req, res) => {
    try {
        const id = req.query.id;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Missing ID parameter'
            });
        }
        
        console.log('Delete request for ID:', id);
        
        // Untuk demo, return success
        res.json({
            success: true,
            message: 'Data deleted successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error deleting data:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
    console.log(`Buka browser dan akses: http://localhost:${PORT}`);
    console.log('');
    console.log('Konfigurasi yang diperlukan:');
    console.log('- GOOGLE_SHEETS_API_KEY:', GOOGLE_SHEETS_API_KEY);
    console.log('- SPREADSHEET_ID:', SPREADSHEET_ID);
    console.log('- SHEET_NAME:', SHEET_NAME);
    console.log('');
    console.log('Untuk mengatur environment variables:');
    console.log('export GOOGLE_SHEETS_API_KEY="your-actual-api-key"');
    console.log('export SPREADSHEET_ID="your-actual-spreadsheet-id"');
});

module.exports = app;