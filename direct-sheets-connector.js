// Direct Google Sheets Connector - No API Key Required
// Uses public CSV export feature from Google Sheets

class DirectSheetsConnector {
    constructor(spreadsheetId, sheetName = 'Sheet1') {
        this.spreadsheetId = spreadsheetId;
        this.sheetName = sheetName;
        // Try multiple URL formats for public sheets
        this.csvUrls = [
            `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`,
            `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`,
            `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`,
            `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`,
            `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=0`,
            `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pub?output=csv&gid=0`
        ];
    }

    // Convert CSV text to JSON objects
    csvToJson(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header.toLowerCase()] = values[index] || '';
                });
                data.push(obj);
            }
        }

        return data;
    }

    // Parse CSV line with proper comma handling
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/"/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim().replace(/"/g, ''));
        return values;
    }

    // Fetch data from Google Sheets with multiple URL attempts
    async fetchData() {
        let lastError = null;
        
        // Try each URL format until one works
        for (const url of this.csvUrls) {
            try {
                console.log(`Mencoba URL: ${url}`);
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    redirect: 'follow'
                });
                
                if (response.ok) {
                    const csvText = await response.text();
                    console.log(`Berhasil mengambil data dari: ${url}`);
                    console.log(`Data preview: ${csvText.substring(0, 200)}...`);
                    
                    // Check if it's actually CSV data, not HTML error page
                    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
                        console.log(`URL mengembalikan HTML error page: ${url}`);
                        lastError = new Error(`URL returned HTML error page: ${url}`);
                        continue;
                    }
                    
                    const data = this.csvToJson(csvText);
                    
                    if (data && data.length > 0) {
                        return this.processForBlog(data);
                    }
                } else {
                    console.log(`URL gagal (${response.status}): ${url}`);
                    lastError = new Error(`HTTP error! status: ${response.status} for ${url}`);
                }
            } catch (error) {
                console.log(`Error dengan URL ${url}:`, error.message);
                lastError = error;
            }
        }
        
        // If all URLs failed, throw the last error
        throw lastError || new Error('All URL attempts failed');
    }

    // Process raw data for blog format
    processForBlog(data) {
        return data.map((item, index) => {
            // Ensure required fields exist
            if (!item.id) item.id = index + 1;
            if (!item.title) item.title = 'Untitled Post';
            if (!item.content) item.content = 'No content available';
            if (!item.date) item.date = new Date().toISOString().split('T')[0];
            if (!item.author) item.author = 'Admin';
            if (!item.category) item.category = 'Uncategorized';
            if (!item.status) item.status = 'published';
            if (!item.tags) item.tags = '';

            // Generate slug if not provided
            if (!item.slug && item.title) {
                item.slug = item.title.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .trim();
            }

            return item;
        });
    }

    // Get specific sheet by GID
    setSheetGid(gid) {
        this.csvUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=${gid}`;
    }
}

// Export for use in other modules
module.exports = DirectSheetsConnector;