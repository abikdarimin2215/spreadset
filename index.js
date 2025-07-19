// Cloudflare Workers untuk Google Sheets Real-time Connection
// Web application yang terhubung dengan Google Sheets secara real-time

// Konfigurasi Google Sheets API
const GOOGLE_SHEETS_API_KEY = 'YOUR_GOOGLE_SHEETS_API_KEY'; // Akan diambil dari environment variables
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // ID dari Google Sheets
const SHEET_NAME = 'WEBSITE'; // Nama sheet yang akan digunakan

// HTML Template untuk aplikasi web
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

        .pagination {
            justify-content: center;
            margin-top: 2rem;
        }

        .page-link {
            color: var(--primary-color);
            border: 1px solid #e2e8f0;
            padding: 0.5rem 0.75rem;
            margin: 0 0.125rem;
            border-radius: 6px;
        }

        .page-link:hover {
            background: var(--primary-color);
            color: white;
        }

        .page-item.active .page-link {
            background: var(--primary-color);
            border-color: var(--primary-color);
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

        <!-- Pagination -->
        <nav aria-label="Page navigation">
            <ul class="pagination" id="pagination">
                <!-- Pagination akan dimuat di sini -->
            </ul>
        </nav>
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
                    console.log('Data berhasil dimuat:', currentData.length, 'rows');
                } else {
                    throw new Error(data.message || 'Gagal memuat data');
                }
                
            } catch (error) {
                console.error('Error memuat data:', error);
                showError('Gagal memuat data dari Google Sheets');
                updateConnectionStatus(false);
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
                            <button class="btn btn-sm btn-primary" onclick="viewRow(\${startIndex + index})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="editRow(\${startIndex + index})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteRow(\${startIndex + index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            \`).join('');
            
            renderPagination();
        }

        // Render pagination
        function renderPagination() {
            const totalPages = Math.ceil(filteredData.length / CONFIG.itemsPerPage);
            const pagination = document.getElementById('pagination');
            
            if (totalPages <= 1) {
                pagination.innerHTML = '';
                return;
            }
            
            let paginationHTML = '';
            
            // Previous button
            paginationHTML += \`
                <li class="page-item \${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(\${currentPage - 1})">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                </li>
            \`;
            
            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                    paginationHTML += \`
                        <li class="page-item \${i === currentPage ? 'active' : ''}">
                            <a class="page-link" href="#" onclick="changePage(\${i})">\${i}</a>
                        </li>
                    \`;
                } else if (i === currentPage - 3 || i === currentPage + 3) {
                    paginationHTML += \`
                        <li class="page-item disabled">
                            <a class="page-link" href="#">...</a>
                        </li>
                    \`;
                }
            }
            
            // Next button
            paginationHTML += \`
                <li class="page-item \${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(\${currentPage + 1})">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </li>
            \`;
            
            pagination.innerHTML = paginationHTML;
        }

        // Change page
        function changePage(page) {
            const totalPages = Math.ceil(filteredData.length / CONFIG.itemsPerPage);
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                renderTable();
            }
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
            // Implementasi notifikasi error
            console.error(message);
            // Bisa ditambahkan toast notification
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
            // Implementasi view detail
            console.log('View row:', row);
        }

        function editRow(index) {
            const row = filteredData[index];
            // Implementasi edit
            console.log('Edit row:', row);
        }

        function deleteRow(index) {
            if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
                const row = filteredData[index];
                // Implementasi delete
                console.log('Delete row:', row);
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

// Main worker handler
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    try {
        // Route handling
        if (path === '/') {
            return new Response(HTML_TEMPLATE, {
                headers: {
                    'Content-Type': 'text/html',
                    ...corsHeaders
                }
            });
        }
        
        if (path === '/api/sheets/data') {
            return await handleGetData(request);
        }
        
        if (path === '/api/sheets/update' && request.method === 'POST') {
            return await handleUpdateData(request);
        }
        
        if (path === '/api/sheets/delete' && request.method === 'DELETE') {
            return await handleDeleteData(request);
        }
        
        // 404 for other paths
        return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders
        });
        
    } catch (error) {
        console.error('Error handling request:', error);
        return new Response(JSON.stringify({
            success: false,
            message: error.message || 'Internal Server Error'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}

async function handleGetData(request) {
    try {
        // Ambil API key dari environment variable
        const apiKey = GOOGLE_SHEETS_API_KEY || await getEnvironmentVariable('GOOGLE_SHEETS_API_KEY');
        const spreadsheetId = SPREADSHEET_ID || await getEnvironmentVariable('SPREADSHEET_ID');
        
        if (!apiKey || !spreadsheetId) {
            throw new Error('Google Sheets API key or Spreadsheet ID not configured');
        }
        
        // URL untuk Google Sheets API
        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}?key=${apiKey}`;
        
        // Fetch data dari Google Sheets
        const response = await fetch(sheetsUrl);
        
        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Parse data ke format yang dibutuhkan
        const rows = data.values || [];
        const headers = rows[0] || [];
        const dataRows = rows.slice(1);
        
        const parsedData = dataRows.map((row, index) => ({
            id: index + 1,
            keyword: row[0] || '',
            title: row[1] || '',
            content: row[2] || '',
            status: row[3] || 'pending',
            created: row[4] || '',
            updated: row[5] || ''
        }));
        
        return new Response(JSON.stringify({
            success: true,
            data: parsedData,
            total: parsedData.length,
            timestamp: new Date().toISOString()
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Error getting data:', error);
        return new Response(JSON.stringify({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

async function handleUpdateData(request) {
    try {
        const requestData = await request.json();
        
        // Validasi data
        if (!requestData || !requestData.id) {
            throw new Error('Missing required data');
        }
        
        // Implementasi update ke Google Sheets
        // Untuk contoh, kita return success response
        return new Response(JSON.stringify({
            success: true,
            message: 'Data updated successfully',
            timestamp: new Date().toISOString()
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Error updating data:', error);
        return new Response(JSON.stringify({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

async function handleDeleteData(request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        
        if (!id) {
            throw new Error('Missing ID parameter');
        }
        
        // Implementasi delete dari Google Sheets
        // Untuk contoh, kita return success response
        return new Response(JSON.stringify({
            success: true,
            message: 'Data deleted successfully',
            timestamp: new Date().toISOString()
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Error deleting data:', error);
        return new Response(JSON.stringify({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// Helper function untuk mengambil environment variable
async function getEnvironmentVariable(name) {
    // Dalam Cloudflare Workers, environment variables tersedia secara global
    // Untuk development, return default value
    const defaults = {
        'GOOGLE_SHEETS_API_KEY': 'your-api-key-here',
        'SPREADSHEET_ID': 'your-spreadsheet-id-here'
    };
    
    return defaults[name] || null;
}