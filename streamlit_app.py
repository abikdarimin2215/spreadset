import streamlit as st
import requests
import json
import os
from datetime import datetime
import re
import subprocess
import time
import pandas as pd

# Page configuration with stability improvements
st.set_page_config(
    page_title="Blog Template Generator",
    page_icon="📝",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Disable auto-rerun to reduce WebSocket issues
if 'initialized' not in st.session_state:
    st.session_state.initialized = True

# Configuration file path
CONFIG_FILE = "app_config.json"

# Load saved configuration
def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

# Save configuration
def save_config(config):
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        st.error(f"Error saving configuration: {e}")

# Initialize session state
if 'config_loaded' not in st.session_state:
    st.session_state.config_loaded = True
    st.session_state.last_config = {}

# Load existing configuration
config = load_config()

# Demo data function
def get_demo_data():
    """Get demo data for preview"""
    return [
        {
            "id": 1,
            "title": "Cara Membuat Blog dengan Google Sheets",
            "content": "Panduan lengkap untuk membuat blog sederhana yang terhubung dengan Google Sheets sebagai database.",
            "category": "Tutorial",
            "tags": "blog, google sheets, tutorial",
            "author": "Admin",
            "date": "2025-01-18"
        },
        {
            "id": 2,
            "title": "Optimasi SEO untuk Blog",
            "content": "Tips dan trik untuk mengoptimalkan SEO blog Anda agar lebih mudah ditemukan di mesin pencari.",
            "category": "SEO",
            "tags": "seo, optimasi, blog",
            "author": "Admin",
            "date": "2025-01-17"
        },
        {
            "id": 3,
            "title": "Deploy ke Cloudflare Workers",
            "content": "Panduan step-by-step untuk deploy blog Anda ke Cloudflare Workers secara gratis.",
            "category": "Deployment",
            "tags": "cloudflare, workers, deploy",
            "author": "Admin",
            "date": "2025-01-16"
        }
    ]

# Function to start Node.js web app
def start_node_webapp():
    """Start the Node.js web application"""
    try:
        # Check if web-app.js exists
        if not os.path.exists('web-app.js'):
            return False, "web-app.js file not found"
        
        # Start the Node.js process
        process = subprocess.Popen(['node', 'web-app.js'], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE)
        
        # Give it a moment to start
        time.sleep(2)
        
        # Check if it's running
        poll = process.poll()
        if poll is None:
            return True, "Node.js web app started successfully"
        else:
            return False, "Failed to start Node.js web app"
            
    except Exception as e:
        return False, f"Error starting Node.js web app: {str(e)}"

# Function to get data from Google Sheets
def get_sheets_data(spreadsheet_id, sheet_name="WEBSITE"):
    """Get data from Google Sheets using CSV export"""
    try:
        # Multiple URL formats to try
        urls = [
            f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid=0",
            f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv",
            f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/gviz/tq?tqx=out:csv",
            f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/pub?output=csv"
        ]
        
        for url in urls:
            try:
                response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; BlogGenerator/1.0)'})
                if response.status_code == 200 and not response.text.startswith('<!DOCTYPE'):
                    # Parse CSV data
                    lines = response.text.strip().split('\n')
                    if len(lines) > 1:
                        # Convert to structured data
                        headers = [h.strip('"') for h in lines[0].split(',')]
                        data = []
                        for line in lines[1:]:
                            if line.strip():
                                values = [v.strip('"') for v in line.split(',')]
                                if len(values) >= len(headers):
                                    row = {}
                                    for i, header in enumerate(headers):
                                        row[header] = values[i] if i < len(values) else ""
                                    data.append(row)
                        return True, data, f"Successfully loaded {len(data)} rows"
            except Exception as e:
                continue
        
        return False, [], "Could not access spreadsheet data"
        
    except Exception as e:
        return False, [], f"Error: {str(e)}"

# Function to test Cloudflare Workers connection
def test_cloudflare_connection(api_token, account_id):
    """Test Cloudflare Workers API connection"""
    try:
        headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }
        
        # Test account access
        response = requests.get(f"https://api.cloudflare.com/client/v4/accounts/{account_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                return True, f"Connected to account: {data['result']['name']}"
            else:
                return False, f"API Error: {data.get('errors', [{}])[0].get('message', 'Unknown error')}"
        else:
            return False, f"HTTP Error {response.status_code}: {response.text}"
            
    except Exception as e:
        return False, f"Connection error: {str(e)}"

# Function to deploy website to Cloudflare Workers
def deploy_to_workers(api_token, account_id, worker_name, html_content, spreadsheet_id):
    """Deploy website to Cloudflare Workers"""
    try:
        headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/javascript'
        }
        
        # Create worker script
        worker_script = f"""
addEventListener('fetch', event => {{
  event.respondWith(handleRequest(event.request))
}})

async function handleRequest(request) {{
  const url = new URL(request.url);
  
  if (url.pathname === '/api/data') {{
    return await getSheetData();
  }}
  
  // Serve the main website
  return new Response(`{html_content}`, {{
    headers: {{ 'content-type': 'text/html;charset=UTF-8' }}
  }});
}}

async function getSheetData() {{
  try {{
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid=0';
    const response = await fetch(sheetUrl);
    const csvData = await response.text();
    
    return new Response(csvData, {{
      headers: {{ 'content-type': 'text/csv' }}
    }});
  }} catch (error) {{
    return new Response(JSON.stringify({{error: error.message}}), {{
      headers: {{ 'content-type': 'application/json' }}
    }});
  }}
}}
"""
        
        # Deploy to Cloudflare Workers
        deploy_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{worker_name}"
        
        response = requests.put(deploy_url, headers=headers, data=worker_script)
        
        if response.status_code in [200, 201]:
            # Get the worker URL
            worker_url = f"https://{worker_name}.{account_id}.workers.dev"
            return True, f"Successfully deployed to: {worker_url}"
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            return False, f"Deployment failed: {error_data}"
            
    except Exception as e:
        return False, f"Deployment error: {str(e)}"

# Function to generate simple website HTML
def generate_website_html(title, description, data, color_scheme="blue"):
    """Generate HTML for simple website based on spreadsheet data"""
    
    color_schemes = {
        "blue": {"primary": "#2563eb", "secondary": "#3b82f6", "background": "#eff6ff"},
        "green": {"primary": "#059669", "secondary": "#10b981", "background": "#ecfdf5"},
        "purple": {"primary": "#7c3aed", "secondary": "#8b5cf6", "background": "#f3e8ff"},
        "red": {"primary": "#dc2626", "secondary": "#ef4444", "background": "#fef2f2"}
    }
    
    colors = color_schemes.get(color_scheme, color_schemes["blue"])
    
    # Generate content based on data
    content_html = ""
    if data:
        for item in data[:10]:  # Limit to first 10 items
            item_title = item.get('title', item.get('name', item.get('item', 'No Title')))
            item_description = item.get('description', item.get('content', item.get('details', 'No description available')))
            item_category = item.get('category', item.get('type', 'General'))
            
            content_html += f"""
            <div class="content-item">
                <h3>{item_title}</h3>
                <span class="category">{item_category}</span>
                <p>{item_description}</p>
            </div>
            """
    else:
        content_html = "<div class='content-item'><h3>No data available</h3><p>Please check your spreadsheet connection.</p></div>"
    
    html_template = f"""
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: {colors['background']}; 
        }}
        .container {{ max-width: 1000px; margin: 0 auto; padding: 20px; }}
        .header {{ 
            text-align: center; 
            margin-bottom: 40px; 
            padding: 40px 20px; 
            background: {colors['primary']}; 
            color: white; 
            border-radius: 12px; 
        }}
        .header h1 {{ font-size: 2.5rem; margin-bottom: 10px; }}
        .header p {{ font-size: 1.2rem; opacity: 0.9; }}
        .content {{ display: grid; gap: 20px; }}
        .content-item {{ 
            background: white; 
            padding: 25px; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            border-left: 4px solid {colors['primary']}; 
        }}
        .content-item h3 {{ color: {colors['primary']}; margin-bottom: 10px; }}
        .category {{ 
            background: {colors['secondary']}; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 0.85rem; 
            margin-bottom: 15px; 
            display: inline-block; 
        }}
        .content-item p {{ color: #555; }}
        .footer {{ 
            text-align: center; 
            margin-top: 40px; 
            padding: 20px; 
            color: #666; 
        }}
        @media (max-width: 768px) {{
            .header h1 {{ font-size: 2rem; }}
            .container {{ padding: 15px; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{title}</h1>
            <p>{description}</p>
        </div>
        <div class="content">
            {content_html}
        </div>
        <div class="footer">
            <p>Powered by Google Sheets & Cloudflare Workers</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh data every 5 minutes
        setInterval(function() {{
            location.reload();
        }}, 300000);
    </script>
</body>
</html>
"""
    
    return html_template

def calculate_stats(data):
    """Calculate statistics from data"""
    categories = set(post['category'] for post in data)
    tags = set()
    for post in data:
        post_tags = post['tags'].split(',')
        tags.update(tag.strip() for tag in post_tags)
    
    return {
        'total_posts': len(data),
        'categories': len(categories),
        'tags': len(tags)
    }

# Custom CSS
st.markdown("""
<style>
    .main-header {
        text-align: center;
        color: #2563eb;
        margin-bottom: 2rem;
    }
    .info-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
    }
    .success-box {
        background: #f0f9ff;
        border: 1px solid #0284c7;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
    }
    .error-box {
        background: #fef2f2;
        border: 1px solid #dc2626;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
    }
    .stButton > button {
        width: 100%;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-weight: 500;
    }
    .stButton > button:hover {
        background: #1d4ed8;
    }
</style>
""", unsafe_allow_html=True)

# Main title
st.markdown("<h1 class='main-header'>🚀 Blog Template Generator</h1>", unsafe_allow_html=True)
st.markdown("<p style='text-align: center; color: #64748b;'>Generate HTML blog templates connected to Google Sheets</p>", unsafe_allow_html=True)

# Sidebar configuration
st.sidebar.header("⚙️ Configuration")

# Google Sheets Configuration (Direct Connection - No API Key Required)
with st.sidebar.expander("📊 Google Sheets Settings", expanded=True):
    st.info("🔥 Direct connection - No API key required!")
    spreadsheet_id = st.text_input("Spreadsheet ID", value=config.get("spreadsheet_id", "14K69q8SMd3pCAROB1YQMDrmuw8y6QphxAslF_y-3NrM"), help="The ID of your Google Sheets")
    sheet_name = st.text_input("Sheet Name", value=config.get("sheet_name", "WEBSITE"), help="Name of the sheet to read from")
    st.markdown("**Note:** Spreadsheet must be set to public/editor access")

# Cloudflare Workers AI Configuration
with st.sidebar.expander("☁️ Cloudflare Workers AI Settings"):
    cf_api_token = st.text_input("Cloudflare Workers AI API Token", type="password", value=config.get("cf_api_token", "xEPsMIeIGMaB46ryg2PmyQfyaUNErRL8vPmKXf6m"), help="Your Cloudflare Workers AI API token")
    cf_account_id = st.text_input("Cloudflare Account ID", value=config.get("cf_account_id", "a9f23a2cc52c24bcf5653631fcf6775b"), help="Your Cloudflare account ID")
    
    st.markdown("""
    **🔑 IMPORTANT - Create the RIGHT token:**
    
    ❌ **NOT "Workers AI"** - that's different!
    ✅ **Use "Cloudflare Workers"** instead
    
    **Step-by-step:**
    1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
    2. Click "Create Token" → "Custom token"
    3. Add these permissions:
       - **Account**: `Cloudflare Workers:Edit` (NOT Workers AI!)
       - **Account**: `Account:Read`
    4. Account Resources: Include `All accounts`
    5. Create token and copy it immediately
    
    **Your Account ID**: `a9f23a2cc52c24bcf5653631fcf6775b`
    """)
    
    st.info("💡 Uses Workers AI API - no Zone ID required")
    
    # Worker name options
    worker_name_prefix = st.text_input("Worker Name Prefix", value=config.get("worker_name_prefix", "blog"), help="Prefix for worker name")
    auto_generate_name = st.checkbox("Auto-generate available name", value=config.get("auto_generate_name", True), help="Automatically generate available worker name")
    
    # Show save status for Cloudflare settings
    if cf_api_token and cf_account_id:
        st.success("✅ Cloudflare settings saved")
    elif cf_api_token or cf_account_id:
        st.warning("⚠️ Cloudflare settings incomplete")

# Blog Configuration
with st.sidebar.expander("📝 Blog Settings", expanded=True):
    blog_title = st.text_input("Blog Title", value=config.get("blog_title", "Blog Sederhana"), help="Title of your blog")
    blog_description = st.text_area("Blog Description", value=config.get("blog_description", "Platform blog yang terhubung dengan Google Sheets"), help="Description of your blog")
    blog_keywords = st.text_input("Keywords", value=config.get("blog_keywords", "blog, artikel, google sheets"), help="SEO keywords")
    posts_per_page = st.number_input("Posts per Page", min_value=1, max_value=20, value=config.get("posts_per_page", 6))

# Auto-save indicator dengan detail
if os.path.exists(CONFIG_FILE):
    st.sidebar.success("🔄 Auto-save aktif - Semua pengaturan tersimpan otomatis")
    
    # Show detailed save status
    with st.sidebar.expander("💾 Status Penyimpanan", expanded=False):
        st.write("**Google Sheets:**")
        if spreadsheet_id and sheet_name:
            st.write("✅ Spreadsheet ID & Sheet Name")
        else:
            st.write("⚠️ Belum lengkap")
            
        st.write("**Cloudflare Workers:**")
        if cf_api_token and cf_account_id:
            st.write("✅ API Token & Account ID")
        else:
            st.write("⚠️ Belum lengkap")
            
        st.write("**Blog Settings:**")
        if blog_title and blog_description:
            st.write("✅ Judul & Deskripsi Blog")
        else:
            st.write("⚠️ Belum lengkap")
else:
    st.sidebar.info("📝 Pengaturan akan tersimpan otomatis")

# Auto-save configuration when values change (with debouncing)
current_config = {
    "spreadsheet_id": spreadsheet_id,
    "sheet_name": sheet_name,
    "cf_api_token": cf_api_token,
    "cf_account_id": cf_account_id,
    "worker_name_prefix": worker_name_prefix,
    "auto_generate_name": auto_generate_name,
    "blog_title": blog_title,
    "blog_description": blog_description,
    "blog_keywords": blog_keywords,
    "posts_per_page": posts_per_page
}

# Save configuration only if significantly different from last saved
if current_config != st.session_state.get('last_config', {}):
    save_config(current_config)
    st.session_state.last_config = current_config.copy()
    config = current_config

# Main content area
tab1, tab2, tab3, tab4 = st.tabs(["🏠 Dashboard", "📝 Template Generator", "🚀 Deploy", "📊 Preview"])

with tab1:
    st.header("📊 Dashboard")
    
    # Node.js Web App Integration
    st.markdown("### 🌐 Node.js Web Application")
    col_node1, col_node2 = st.columns(2)
    
    with col_node1:
        if st.button("🚀 Start Node.js Web App", key="start_node"):
            success, message = start_node_webapp()
            if success:
                st.success(f"✅ {message}")
                st.info("🌐 Node.js web app is running at: http://localhost:5000")
                st.markdown("[Open Web App](http://localhost:5000)", unsafe_allow_html=True)
            else:
                st.error(f"❌ {message}")
    
    with col_node2:
        st.info("💡 The Node.js web app provides additional features:\n- Advanced template generation\n- Real-time data preview\n- Direct Cloudflare deployment")
    
    st.divider()
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### 🔗 Google Sheets Connection")
        if st.button("Test Google Sheets Connection"):
            if not spreadsheet_id:
                st.error("Please provide Spreadsheet ID")
            else:
                try:
                    # Try direct connection (no API key needed)
                    st.info("Testing direct connection...")
                    
                    # Try multiple URL formats
                    urls = [
                        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid=0",
                        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv",
                        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/gviz/tq?tqx=out:csv"
                    ]
                    
                    success = False
                    for url in urls:
                        try:
                            csv_response = requests.get(url)
                            if csv_response.status_code == 200 and not csv_response.text.startswith('<!DOCTYPE'):
                                csv_data = csv_response.text
                                lines = csv_data.split('\n')
                                
                                st.success(f"✅ Direct connection successful! Found {len(lines)} rows")
                                
                                if lines:
                                    st.markdown("**First 5 rows:**")
                                    for i, line in enumerate(lines[:5]):
                                        st.write(f"Row {i+1}: {line}")
                                success = True
                                break
                        except Exception as e:
                            continue
                    
                    if not success:
                        st.error("❌ Direct connection failed - make sure spreadsheet is public/editor access")
                        
                        # Remove API key fallback - not needed anymore
                        st.info("Make sure your Google Sheets is set to public or editor access")
                            
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
    
    with col2:
        st.markdown("### ☁️ Cloudflare Workers AI Status")
        if st.button("Test Cloudflare Workers AI Connection"):
            if not cf_api_token or not cf_account_id:
                st.error("Please provide Cloudflare Workers AI API Token and Account ID")
            else:
                try:
                    # Test connection to Cloudflare token first
                    headers = {
                        'Authorization': f'Bearer {cf_api_token}',
                        'Content-Type': 'application/json'
                    }
                    
                    # First verify the token is valid
                    verify_url = "https://api.cloudflare.com/client/v4/user/tokens/verify"
                    verify_response = requests.get(verify_url, headers=headers)
                    
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        if verify_data.get('success'):
                            st.success("✅ API Token is valid and active")
                            
                            # Try to list workers (this requires Workers:Edit permission)
                            workers_url = f"https://api.cloudflare.com/client/v4/accounts/{cf_account_id}/workers/scripts"
                            workers_response = requests.get(workers_url, headers=headers)
                            
                            if workers_response.status_code == 200:
                                workers_data = workers_response.json()
                                workers = workers_data.get('result', [])
                                st.success(f"✅ Connected to Cloudflare Workers! Found {len(workers)} workers")
                                
                                if workers:
                                    st.markdown("**Existing Workers:**")
                                    for worker in workers[:5]:
                                        st.write(f"- {worker.get('id', 'Unknown')}")
                                else:
                                    st.info("No existing workers found - ready to deploy new ones!")
                            else:
                                st.warning(f"⚠️ Token valid but lacks Workers permission (Error {workers_response.status_code})")
                                
                                # Show detailed error and fix instructions
                                if workers_response.status_code == 403:
                                    st.error("**Permission Error:** Token needs Workers:Edit permission")
                                    st.markdown("""
                                    **✅ Create a new token with these EXACT settings:**
                                    
                                    **Permissions (Account level):**
                                    - `Cloudflare Workers:Edit` (NOT "Workers AI"!)
                                    - `Account:Read`
                                    
                                    **Account Resources:**
                                    - Include: `All accounts` 
                                    
                                    **🚨 Common mistake:** "Workers AI" ≠ "Cloudflare Workers"
                                    
                                    [Create Token Now →](https://dash.cloudflare.com/profile/api-tokens)
                                    """)
                                else:
                                    st.json(workers_response.json())
                        else:
                            st.error("❌ Invalid API token")
                    else:
                        st.error(f"❌ Token verification failed: {verify_response.status_code}")
                        st.json(verify_response.json())
                        
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
                    st.markdown("""
                    **Common Issues:**
                    - Check internet connection
                    - Verify API token format
                    - Ensure account ID is correct (32-character hex string)
                    """)

with tab2:
    st.header("🎨 Template Generator")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("### Generate HTML Template")
        
        # Template options
        template_type = st.selectbox(
            "Template Type",
            ["Blog Homepage", "Single Post", "Category Page", "Archive Page"],
            help="Choose the type of template to generate"
        )
        
        # Design options
        st.markdown("#### Design Options")
        color_scheme = st.selectbox("Color Scheme", ["Blue", "Green", "Purple", "Red", "Orange"])
        layout_style = st.selectbox("Layout Style", ["Modern", "Classic", "Minimal", "Magazine"])
        
        # Generate template button
        if st.button("🎨 Generate Template"):
            # Template generation logic
            template_config = {
                "type": template_type,
                "blog_title": blog_title,
                "blog_description": blog_description,
                "blog_keywords": blog_keywords,
                "color_scheme": color_scheme,
                "layout_style": layout_style,
                "posts_per_page": posts_per_page
            }
            
            # Generate HTML template
            generated_html = generate_html_template(template_config)
            
            # Save generated template to file (more reliable than session state)
            try:
                with open('generated_template.html', 'w', encoding='utf-8') as f:
                    f.write(generated_html)
                
                # Also save config
                import json
                with open('generated_template_config.json', 'w') as f:
                    json.dump(template_config, f)
                
                # Save to session state as backup
                st.session_state.generated_template = generated_html
                st.session_state.template_config = template_config
                
                st.success("✅ Template generated successfully! Template saved for deployment.")
            except Exception as e:
                st.error(f"Error saving template: {str(e)}")
                # Fallback to session state only
                st.session_state.generated_template = generated_html
                st.session_state.template_config = template_config
                st.success("✅ Template generated successfully! (Using session backup)")
            
            # Display generated template
            with st.expander("📄 Generated HTML Template", expanded=True):
                st.code(generated_html, language='html')
            
            # Download button
            st.download_button(
                label="📥 Download HTML Template",
                data=generated_html,
                file_name=f"{template_type.lower().replace(' ', '_')}_template.html",
                mime="text/html"
            )
            
            # Info untuk deployment
            st.info("✅ Template berhasil dibuat! Pindah ke tab 'Deploy' untuk deploy ke Cloudflare Workers.")
    
    with col2:
        st.markdown("### 📋 Template Preview")
        st.markdown("""
        <div class="info-box">
            <h4>Template Features:</h4>
            <ul>
                <li>✅ Responsive design</li>
                <li>✅ Bootstrap 5 framework</li>
                <li>✅ Font Awesome icons</li>
                <li>✅ Google Sheets integration</li>
                <li>✅ SEO optimized</li>
                <li>✅ Mobile-friendly</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)

with tab3:
    st.header("🚀 Website Deployment")
    
    # Website Generation Section
    st.markdown("### 🌐 Generate Website from Spreadsheet")
    
    col_gen1, col_gen2 = st.columns(2)
    
    with col_gen1:
        st.markdown("#### Website Configuration")
        website_title = st.text_input("Website Title", value=blog_title, help="Title for your website")
        website_description = st.text_area("Website Description", value=blog_description, help="Description for your website")
        website_color = st.selectbox("Color Scheme", ["blue", "green", "purple", "red"], help="Choose website color scheme")
        
        if st.button("🎨 Generate Website from Spreadsheet Data", type="primary"):
            if not spreadsheet_id:
                st.error("Please provide Spreadsheet ID in the sidebar")
            else:
                with st.spinner("Loading data from spreadsheet..."):
                    success, data, message = get_sheets_data(spreadsheet_id, sheet_name)
                    
                if success and data:
                    st.success(f"✅ {message}")
                    
                    # Generate website HTML with real data
                    website_html = generate_website_html(website_title, website_description, data, website_color)
                    
                    # Save generated website
                    try:
                        with open('generated_website.html', 'w', encoding='utf-8') as f:
                            f.write(website_html)
                        
                        # Save to session state
                        st.session_state.generated_website = website_html
                        st.session_state.website_data = data
                        
                        st.success("✅ Website generated successfully!")
                        
                        # Show preview
                        with st.expander("🖥️ Website Preview", expanded=True):
                            st.markdown("**Data loaded from spreadsheet:**")
                            df = pd.DataFrame(data[:5])  # Show first 5 rows
                            st.dataframe(df)
                            
                        # Download button
                        st.download_button(
                            label="📥 Download Website HTML",
                            data=website_html,
                            file_name="website.html",
                            mime="text/html"
                        )
                        
                    except Exception as e:
                        st.error(f"Error saving website: {str(e)}")
                        st.session_state.generated_website = website_html
                        st.session_state.website_data = data
                        st.success("✅ Website generated (using session backup)")
                else:
                    st.error(f"❌ {message}")
    
    with col_gen2:
        st.markdown("#### Cloudflare Workers Deployment")
        
        if 'generated_website' in st.session_state or os.path.exists('generated_website.html'):
            st.success("✅ Website ready for deployment!")
            
            worker_name = st.text_input("Worker Name", value=f"{website_title.lower().replace(' ', '-')}-{datetime.now().strftime('%m%d')}", help="Name for your Cloudflare Worker")
            
            if st.button("🚀 Deploy to Cloudflare Workers", type="primary"):
                if not cf_api_token or not cf_account_id:
                    st.error("Please provide Cloudflare credentials in the sidebar")
                else:
                    # Test connection first
                    with st.spinner("Testing Cloudflare connection..."):
                        cf_success, cf_message = test_cloudflare_connection(cf_api_token, cf_account_id)
                    
                    if cf_success:
                        st.success(f"✅ {cf_message}")
                        
                        # Get website HTML
                        website_html = st.session_state.get('generated_website')
                        if not website_html and os.path.exists('generated_website.html'):
                            with open('generated_website.html', 'r', encoding='utf-8') as f:
                                website_html = f.read()
                        
                        if website_html:
                            with st.spinner("Deploying to Cloudflare Workers..."):
                                deploy_success, deploy_message = deploy_to_workers(
                                    cf_api_token, cf_account_id, worker_name, 
                                    website_html, spreadsheet_id
                                )
                            
                            if deploy_success:
                                st.success(f"✅ {deploy_message}")
                                
                                # Save deployment info
                                deployment_info = {
                                    'url': deploy_message.split(': ')[1] if ': ' in deploy_message else deploy_message,
                                    'worker_name': worker_name,
                                    'deployed_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                                    'spreadsheet_id': spreadsheet_id
                                }
                                st.session_state.last_deployment = deployment_info
                                
                                # Show direct link
                                if 'http' in deploy_message:
                                    url = deploy_message.split(': ')[1]
                                    st.markdown(f"### 🔗 [Open Your Website]({url})")
                                    st.info(f"Your website is live at: {url}")
                            else:
                                st.error(f"❌ {deploy_message}")
                        else:
                            st.error("No website HTML found to deploy")
                    else:
                        st.error(f"❌ {cf_message}")
        else:
            st.warning("⚠️ Generate a website first before deploying")
    
    st.divider()
    
    with col1:
        st.markdown("### 📊 Data Preview from Spreadsheet")
        
        if st.button("📄 Load Spreadsheet Data"):
            if not spreadsheet_id:
                st.error("Please provide Spreadsheet ID in the sidebar")
            else:
                with st.spinner("Loading data from spreadsheet..."):
                    success, data, message = get_sheets_data(spreadsheet_id, sheet_name)
                
                if success and data:
                    st.success(f"✅ {message}")
                    
                    # Display data preview
                    df = pd.DataFrame(data)
                    st.dataframe(df, use_container_width=True)
                    
                    # Show column information
                    st.markdown("**Available Columns:**")
                    for col in df.columns:
                        st.write(f"- {col}")
                        
                    # Save data to session for later use
                    st.session_state.spreadsheet_data = data
                else:
                    st.error(f"❌ {message}")
        
        # Show saved data if available
        if 'spreadsheet_data' in st.session_state:
            st.markdown("### 📋 Loaded Data Summary")
            data = st.session_state.spreadsheet_data
            st.info(f"Total rows: {len(data)}")
            if data:
                st.info(f"Columns: {', '.join(data[0].keys())}")
    
    with col2:
        st.markdown("### ☁️ Cloudflare Workers Deploy")
        
        # Check if template is generated (file-based check)
        import os
        has_template = os.path.exists('generated_template.html')
        has_config = os.path.exists('generated_template_config.json')
        
        if has_template:
            st.success("✅ Template ready for deployment!")
            if has_config:
                try:
                    import json
                    with open('generated_template_config.json', 'r') as f:
                        template_config = json.load(f)
                    st.info(f"Template type: {template_config.get('type', 'Unknown')}")
                    st.info(f"Color scheme: {template_config.get('color_scheme', 'Unknown')}")
                except:
                    st.info("Template config available")
            
            # Separate Deploy Template section
            st.markdown("---")
            st.markdown("### 🚀 Deploy Generated Template")
            
            col_preview, col_deploy = st.columns(2)
            
            with col_preview:
                if st.button("👁️ Preview Template", key="preview_template"):
                    preview_generated_template()
            
            with col_deploy:
                if st.button("🚀 Deploy Template Only", key="deploy_template_only", type="primary"):
                    deploy_template_only()
                    
        else:
            st.warning("⚠️ Generate a template first before deploying")
        
        # Deployment History section
        st.markdown("---")
        st.markdown("### 📜 Deployment History")
        
        if 'last_deployment' in st.session_state:
            deployment = st.session_state['last_deployment']
            st.success("✅ Last Deployment:")
            st.info(f"**URL:** {deployment['url']}")
            st.info(f"**Worker:** {deployment['worker_name']}")
            st.info(f"**Template:** {deployment.get('template_config', {}).get('type', 'Unknown')}")
            st.info(f"**Deployed:** {deployment.get('deployed_at', 'Unknown')}")
            
            # Quick link to last deployment
            st.markdown(f"### 🔗 [Buka Deployment Terakhir]({deployment['url']})")
        else:
            st.info("Belum ada deployment yang berhasil")


with tab4:
    st.header("👁️ Preview")
    
    col1, col2 = st.columns([3, 1])
    
    with col1:
        st.markdown("### 🖥️ Blog Preview")
        
        # Load demo data for preview
        demo_data = get_demo_data()
        
        # Display preview
        st.markdown("#### Sample Blog Posts")
        for post in demo_data[:3]:
            with st.container():
                st.markdown(f"**{post['title']}**")
                st.markdown(f"*{post['category']} • {post['date']} • {post['author']}*")
                st.markdown(f"{post['content'][:200]}...")
                st.markdown(f"**Tags:** {post['tags']}")
                st.markdown("---")
    
    with col2:
        st.markdown("### 📊 Statistics")
        
        # Display statistics
        stats = calculate_stats(demo_data)
        st.metric("Total Posts", stats['total_posts'])
        st.metric("Categories", stats['categories'])
        st.metric("Tags", stats['tags'])
        
        st.markdown("### 🔄 Actions")
        if st.button("🔄 Refresh Preview"):
            st.rerun()
            
        st.markdown("### 📁 Configuration")
        st.json(current_config)
        
        if st.button("💾 Save Config"):
            save_config(current_config)
            st.success("Configuration saved!")
            
        if st.button("🗑️ Clear Config"):
            if os.path.exists(CONFIG_FILE):
                os.remove(CONFIG_FILE)
                st.success("Configuration cleared!")
            else:
                st.info("No config file found")

def generate_html_template(config):
    """Generate HTML template based on configuration"""
    color_schemes = {
        "Blue": {"primary": "#2563eb", "secondary": "#1d4ed8"},
        "Green": {"primary": "#059669", "secondary": "#047857"},
        "Purple": {"primary": "#7c3aed", "secondary": "#6d28d9"},
        "Red": {"primary": "#dc2626", "secondary": "#b91c1c"},
        "Orange": {"primary": "#ea580c", "secondary": "#c2410c"}
    }
    
    colors = color_schemes.get(config['color_scheme'], color_schemes['Blue'])
    
    # Read the base template
    try:
        with open('blog-template.html', 'r', encoding='utf-8') as f:
            template = f.read()
    except FileNotFoundError:
        # Fallback template if file doesn't exist
        template = """<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{blog_title}}</title>
    <meta name="description" content="{{blog_description}}">
    <meta name="keywords" content="{{blog_keywords}}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: #2563eb;
            --secondary-color: #1d4ed8;
        }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .navbar { background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%); }
        .hero { background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%); color: white; padding: 4rem 0; }
        .card { border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.3s; }
        .card:hover { transform: translateY(-5px); }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container">
            <a class="navbar-brand" href="/"><i class="fas fa-blog me-2"></i>{{blog_title}}</a>
        </div>
    </nav>
    
    <div class="hero text-center">
        <div class="container">
            <h1 class="display-4">{{blog_title}}</h1>
            <p class="lead">{{blog_description}}</p>
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
                        <h5><i class="fas fa-info-circle me-2"></i>About This Blog</h5>
                        <p>{{blog_description}}</p>
                        <p><small>Powered by Google Sheets & Cloudflare Workers</small></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <footer class="bg-dark text-white mt-5 py-4">
        <div class="container text-center">
            <p>&copy; {{current_year}} {{blog_title}}. Generated by Template System.</p>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Load posts from API
        async function loadPosts() {
            try {
                const response = await fetch('/api/posts');
                const data = await response.json();
                
                if (data.success && data.posts) {
                    const postsContainer = document.getElementById('posts');
                    const posts = data.posts;
                    
                    if (posts.length === 0) {
                        postsContainer.innerHTML = '<div class="col-12 text-center"><p>No posts found. Add content to your Google Sheets!</p></div>';
                        return;
                    }
                    
                    postsContainer.innerHTML = posts.map(post => `
                        <div class="col-md-6 mb-4">
                            <div class="card">
                                <div class="card-body">
                                    <h5 class="card-title">\${post.title}</h5>
                                    <p class="card-text">\${(post.content || '').substring(0, 150)}...</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small class="text-muted">\${post.category || 'Uncategorized'} • \${post.date}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('');
                } else {
                    document.getElementById('posts').innerHTML = '<div class="col-12 text-center"><p>Error loading posts</p></div>';
                }
            } catch (error) {
                console.error('Error loading posts:', error);
                document.getElementById('posts').innerHTML = '<div class="col-12 text-center"><p>Failed to load posts</p></div>';
            }
        }
        
        // Initialize
        loadPosts();
    </script>
</body>
</html>"""
    
    # Replace template variables
    template = template.replace('{{blog_title}}', config['blog_title'])
    template = template.replace('{{blog_description}}', config['blog_description'])
    template = template.replace('{{blog_keywords}}', config['blog_keywords'])
    template = template.replace('{{site_title}}', config['blog_title'])
    template = template.replace('{{site_description}}', config['blog_description'])
    template = template.replace('{{site_keywords}}', config['blog_keywords'])
    template = template.replace('{{current_year}}', str(datetime.now().year))
    
    # Replace color scheme
    template = template.replace('--primary-color: #2563eb', f'--primary-color: {colors["primary"]}')
    template = template.replace('--secondary-color: #1d4ed8', f'--secondary-color: {colors["secondary"]}')
    template = template.replace('#1d4ed8', colors["secondary"])
    
    return template

def generate_deployment_guide():
    """Generate deployment guide"""
    return """
    ## 🚀 Deployment Guide
    
    ### Prerequisites
    - Web server (Apache/Nginx)
    - Domain name
    - SSL certificate
    
    ### Steps
    1. **Upload Files**
       - Upload HTML template to your web server
       - Ensure proper file permissions
    
    2. **Configure Environment**
       - Set up environment variables
       - Configure Google Sheets API
       - Set up Cloudflare if using
    
    3. **Test Deployment**
       - Check all links work
       - Test Google Sheets connection
       - Verify responsive design
    
    4. **Go Live**
       - Point domain to your server
       - Enable SSL
       - Monitor for errors
    
    ### Environment Variables
    ```bash
    GOOGLE_SHEETS_API_KEY=your_api_key_here
    SPREADSHEET_ID=your_spreadsheet_id
    SHEET_NAME=WEBSITE
    ```
    
    ### Troubleshooting
    - Check API key permissions
    - Verify spreadsheet sharing settings
    - Test network connectivity
    """

def preview_generated_template():
    """Preview template yang sudah di-generate"""
    try:
        if not os.path.exists('generated_template.html'):
            st.error("❌ Template tidak ditemukan! Generate template terlebih dahulu")
            return
            
        with open('generated_template.html', 'r', encoding='utf-8') as f:
            template_html = f.read()
            
        # Show template info
        st.markdown("### 👁️ Template Preview")
        st.info(f"Template size: {len(template_html)} karakter")
        
        # Show template config if available
        if os.path.exists('generated_template_config.json'):
            with open('generated_template_config.json', 'r') as f:
                template_config = json.load(f)
            st.json(template_config)
        
        # Show HTML code preview (first 1000 chars)
        st.markdown("#### HTML Code Preview:")
        st.code(template_html[:1000] + ("..." if len(template_html) > 1000 else ""), language="html")
        
        # Show rendered HTML in expandable section
        with st.expander("🌐 Rendered HTML Preview", expanded=False):
            # Replace template variables for preview
            preview_html = template_html.replace('{{blog_title}}', 'Preview Blog')
            preview_html = preview_html.replace('{{blog_description}}', 'This is a preview of your generated template')
            st.components.v1.html(preview_html, height=600, scrolling=True)
            
    except Exception as e:
        st.error(f"❌ Error previewing template: {str(e)}")

def deploy_template_only():
    """Deploy hanya template yang sudah di-generate tanpa konfigurasi tambahan"""
    try:
        # Check API credentials
        cf_api_token = st.session_state.get('cf_api_token')
        cf_account_id = st.session_state.get('cf_account_id')
        
        if not cf_api_token or not cf_account_id:
            st.error("❌ Cloudflare API Token dan Account ID diperlukan!")
            st.info("💡 Isi konfigurasi Cloudflare di tab Configuration terlebih dahulu")
            return
        
        # Read template dan config
        if not os.path.exists('generated_template.html'):
            st.error("❌ Template tidak ditemukan! Generate template terlebih dahulu")
            return
            
        with open('generated_template.html', 'r', encoding='utf-8') as f:
            template_html = f.read()
            
        template_config = {}
        if os.path.exists('generated_template_config.json'):
            with open('generated_template_config.json', 'r') as f:
                template_config = json.load(f)
        
        st.info(f"📄 Template siap deploy: {len(template_html)} karakter")
        st.info(f"🎨 Template: {template_config.get('type', 'Unknown')} - {template_config.get('color_scheme', 'Default')}")
        
        # Generate worker name
        import random
        import string
        worker_name = f"blog-{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}"
        
        # Create worker config for template
        worker_config = {
            'blogTitle': template_config.get('blog_title', 'My Blog'),
            'blogDescription': template_config.get('blog_description', 'Blog powered by Google Sheets'),
            'blogKeywords': template_config.get('blog_keywords', 'blog, google sheets'),
            'sheetsUrl': 'https://docs.google.com/spreadsheets/d/14K69q8SMd3pCAROB1YQMDrmuw8y6QphxAslF_y-3NrM/export?format=csv&gid=0',
            'postsPerPage': template_config.get('posts_per_page', 6)
        }
        
        # Generate modern worker script
        worker_script = generate_modern_worker_script(worker_config, template_html)
        
        with st.spinner('🚀 Deploying template to Cloudflare Workers...'):
            # Deploy to Cloudflare
            deploy_url = f"https://api.cloudflare.com/client/v4/accounts/{cf_account_id}/workers/scripts/{worker_name}"
            headers = {
                'Authorization': f'Bearer {cf_api_token}',
                'Content-Type': 'application/javascript'
            }
            
            import requests
            response = requests.put(deploy_url, headers=headers, data=worker_script)
            
            if response.status_code in [200, 201]:
                st.success("✅ Template berhasil di-deploy!")
                st.balloons()
                
                # Show deployment info
                st.markdown("### 🎉 Deployment Berhasil!")
                st.info(f"**Worker Name:** {worker_name}")
                st.info(f"**URL:** https://{worker_name}.{cf_account_id}.workers.dev")
                st.info(f"**Template:** {template_config.get('type', 'Custom')} - {template_config.get('color_scheme', 'Default')}")
                
                # Create clickable link
                worker_url = f"https://{worker_name}.{cf_account_id}.workers.dev"
                st.markdown(f"### 🔗 [Buka Blog Anda]({worker_url})")
                
                # Save deployment info
                deployment_info = {
                    'worker_name': worker_name,
                    'url': worker_url,
                    'template_config': template_config,
                    'deployed_at': str(datetime.now()),
                    'deployment_type': 'template_only'
                }
                
                st.session_state['last_deployment'] = deployment_info
                
            else:
                st.error(f"❌ Deployment gagal: {response.status_code}")
                st.error(f"Response: {response.text}")
                
    except Exception as e:
        st.error(f"❌ Error during deployment: {str(e)}")

def generate_modern_worker_script(config, custom_html_template=None):
    """Generate modern CF Workers script using template"""
    # Read the modern template
    with open('modern_template.js', 'r') as f:
        worker_script = f.read()
    
    # Replace configuration placeholders
    replacements = {
        '{{SPREADSHEET_ID}}': config.get('spreadsheetId', '14K69q8SMd3pCAROB1YQMDrmuw8y6QphxAslF_y-3NrM'),
        '{{SHEET_NAME}}': config.get('sheetName', 'WEBSITE'),
        '{{BLOG_TITLE}}': config.get('blogTitle', 'My Blog'),
        '{{BLOG_DESCRIPTION}}': config.get('blogDescription', 'Blog powered by Google Sheets'),
        '{{PRIMARY_COLOR}}': config.get('primaryColor', '#2563eb'),
        '{{SECONDARY_COLOR}}': config.get('secondaryColor', '#1d4ed8')
    }
    
    for placeholder, value in replacements.items():
        worker_script = worker_script.replace(placeholder, value)
    
    return worker_script

def generate_cloudflare_worker_script(config, custom_html_template=None):
    """Generate Cloudflare Workers script with direct Google Sheets connection"""
    spreadsheet_id = config.get('spreadsheetId', '')
    sheet_name = config.get('sheetName', 'Sheet1')
    blog_title = config.get('blogTitle', 'Blog')
    blog_description = config.get('blogDescription', 'Blog powered by Google Sheets')
    blog_keywords = config.get('blogKeywords', 'blog, google sheets')
    
    # Prepare custom template for JavaScript (use JSON.stringify for safer escaping)
    custom_template_js = "null"
    if custom_html_template:
        import json
        # Use JSON.stringify equivalent in Python for safe escaping
        escaped_template = json.dumps(custom_html_template)
        custom_template_js = escaped_template
    
    return f"""// Improved Cloudflare Workers Script
// Following CF Workers best practices
// Generated on: {datetime.now().isoformat()}
// Spreadsheet ID: {spreadsheet_id}
// Custom Template: {'Yes' if custom_html_template else 'No'}

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
    
    // Route handling with improved structure
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
                config: CONFIG
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
        return new Response(JSON.stringify({{ 
            success: false, 
            error: error.message 
        }}), {{ 
            status: 500,
            headers: {{ 
                'Content-Type': 'application/json',
                ...corsHeaders 
            }}
        }})
    }}
}}

// Configuration
const SPREADSHEET_ID = '{spreadsheet_id}'
const SHEET_NAME = '{sheet_name}'
const BLOG_CONFIG = {{
    site_title: '{blog_title}',
    site_description: '{blog_description}',
    site_keywords: '{blog_keywords}',
    current_year: new Date().getFullYear()
}}

// Custom HTML Template (if provided)
const CUSTOM_HTML_TEMPLATE = {custom_template_js}

// Debug info
console.log('Worker initialized');
console.log('Custom template available:', CUSTOM_HTML_TEMPLATE !== null);
if (CUSTOM_HTML_TEMPLATE) {{
    console.log('Custom template length:', CUSTOM_HTML_TEMPLATE.length);
}}

// Direct Google Sheets data fetching (no API key required)
async function getGoogleSheetsData() {{
    try {{
        const csvUrl = `https://docs.google.com/spreadsheets/d/${{SPREADSHEET_ID}}/export?format=csv&gid=0`
        const response = await fetch(csvUrl)
        
        if (!response.ok) {{
            throw new Error(`HTTP error! status: ${{response.status}}`)
        }}
        
        const csvText = await response.text()
        return csvToJson(csvText)
    }} catch (error) {{
        console.error('Error fetching Google Sheets data:', error)
        return getDemoData()
    }}
}}

// Convert CSV to JSON
function csvToJson(csvText) {{
    const lines = csvText.split('\\n')
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''))
    const data = []

    for (let i = 1; i < lines.length; i++) {{
        const values = parseCSVLine(lines[i])
        if (values.length === headers.length) {{
            const obj = {{}}
            headers.forEach((header, index) => {{
                obj[header.toLowerCase()] = values[index] || ''
            }})
            
            // Ensure required fields
            if (!obj.id) obj.id = i
            if (!obj.slug && obj.title) {{
                obj.slug = obj.title.toLowerCase()
                    .replace(/[^a-z0-9\\s-]/g, '')
                    .replace(/\\s+/g, '-')
                    .trim()
            }}
            
            data.push(obj)
        }}
    }}

    return data
}}

// Parse CSV line with proper comma handling
function parseCSVLine(line) {{
    const values = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {{
        const char = line[i]
        
        if (char === '"') {{
            inQuotes = !inQuotes
        }} else if (char === ',' && !inQuotes) {{
            values.push(current.trim().replace(/"/g, ''))
            current = ''
        }} else {{
            current += char
        }}
    }}
    
    values.push(current.trim().replace(/"/g, ''))
    return values
}}

// Demo data fallback
function getDemoData() {{
    return [
        {{
            id: 1,
            title: 'Welcome to Your Blog',
            slug: 'welcome-to-your-blog',
            content: 'This is your first blog post powered by Google Sheets and Cloudflare Workers. Edit your Google Sheets to add more content!',
            category: 'Welcome',
            tags: 'blog, welcome, cloudflare, google sheets',
            author: 'Admin',
            date: new Date().toISOString().split('T')[0],
            status: 'published'
        }}
    ]
}}

// Serve blog home page
async function serveBlogHome() {{
    // Use custom HTML template if provided, otherwise use default
    let html;
    
    if (CUSTOM_HTML_TEMPLATE && CUSTOM_HTML_TEMPLATE !== null && CUSTOM_HTML_TEMPLATE !== 'null') {{
        // Use the custom generated template
        console.log('Using custom template, length:', CUSTOM_HTML_TEMPLATE.length);
        html = CUSTOM_HTML_TEMPLATE;
        
        // Replace dynamic placeholders in custom template
        html = html.replace(/\$\{{BLOG_CONFIG\.site_title\}}/g, BLOG_CONFIG.site_title);
        html = html.replace(/\$\{{BLOG_CONFIG\.site_description\}}/g, BLOG_CONFIG.site_description);
        html = html.replace(/\$\{{BLOG_CONFIG\.site_keywords\}}/g, BLOG_CONFIG.site_keywords);
        html = html.replace(/\$\{{BLOG_CONFIG\.current_year\}}/g, BLOG_CONFIG.current_year);
        html = html.replace(/\$\{{SPREADSHEET_ID\}}/g, SPREADSHEET_ID);
        
        // Add API integration script if not already present
        if (!html.includes('loadPosts()')) {{
            html = html.replace('</body>', `
                <script>
                // Load posts from API
                async function loadPosts() {{
                    try {{
                        const response = await fetch('/api/posts');
                        const data = await response.json();
                        
                        if (data.success && data.posts) {{
                            const postsContainer = document.getElementById('posts');
                            if (!postsContainer) return;
                            
                            const posts = data.posts;
                            
                            if (posts.length === 0) {{
                                postsContainer.innerHTML = '<div class="col-12 text-center"><p>No posts found. Add content to your Google Sheets!</p></div>';
                                return;
                            }}
                            
                            postsContainer.innerHTML = posts.map(post => \`
                                <div class="col-md-6 mb-4">
                                    <div class="card">
                                        <div class="card-body">
                                            <h5 class="card-title">\${{post.title}}</h5>
                                            <p class="card-text">\${{(post.content || '').substring(0, 150)}}...</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <small class="text-muted">\${{post.category || 'Uncategorized'}} • \${{post.date}}</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            \`).join('');
                        }}
                    }} catch (error) {{
                        console.error('Error loading posts:', error);
                        const postsContainer = document.getElementById('posts');
                        if (postsContainer) {{
                            postsContainer.innerHTML = '<div class="col-12 text-center"><p>Failed to load posts</p></div>';
                        }}
                    }}
                }}
                
                // Load stats
                async function loadStats() {{
                    try {{
                        const response = await fetch('/api/stats');
                        const data = await response.json();
                        
                        if (data.success) {{
                            const statsContainer = document.getElementById('stats');
                            if (statsContainer) {{
                                const stats = data.stats;
                                statsContainer.innerHTML = \`
                                    <p><i class="fas fa-file-alt me-2"></i>Posts: \${{stats.totalPosts || 0}}</p>
                                    <p><i class="fas fa-folder me-2"></i>Categories: \${{stats.totalCategories || 0}}</p>
                                    <p><i class="fas fa-tags me-2"></i>Tags: \${{stats.totalTags || 0}}</p>
                                \`;
                            }}
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
            </body>`);
        }}
    }} else {{
        // Use default template
        html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${{BLOG_CONFIG.site_title}}</title>
        <meta name="description" content="${{BLOG_CONFIG.site_description}}">
        <meta name="keywords" content="${{BLOG_CONFIG.site_keywords}}">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }}
            .navbar {{ background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }}
            .hero {{ background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 4rem 0; }}
            .card {{ border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.3s; }}
            .card:hover {{ transform: translateY(-5px); }}
            .btn-primary {{ background: #2563eb; border-color: #2563eb; }}
            .btn-primary:hover {{ background: #1d4ed8; border-color: #1d4ed8; }}
            .loading {{ text-align: center; padding: 2rem; }}
        </style>
    </head>
    <body>
        <nav class="navbar navbar-expand-lg navbar-dark">
            <div class="container">
                <a class="navbar-brand" href="/"><i class="fas fa-blog me-2"></i>${{BLOG_CONFIG.site_title}}</a>
                <div class="navbar-nav ms-auto">
                    <a class="nav-link" href="/">Home</a>
                    <a class="nav-link" href="/api/posts">API</a>
                    <a class="nav-link" href="/health">Health</a>
                </div>
            </div>
        </nav>
        
        <div class="hero text-center">
            <div class="container">
                <h1 class="display-4">${{BLOG_CONFIG.site_title}}</h1>
                <p class="lead">${{BLOG_CONFIG.site_description}}</p>
                <p><small>Powered by Google Sheets & Cloudflare Workers</small></p>
            </div>
        </div>
        
        <div class="container mt-5">
            <div class="row">
                <div class="col-lg-8">
                    <div id="posts" class="row">
                        <div class="col-12 loading">
                            <i class="fas fa-spinner fa-spin fa-2x"></i>
                            <p>Loading posts...</p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-body">
                            <h5><i class="fas fa-info-circle me-2"></i>About This Blog</h5>
                            <p>${{BLOG_CONFIG.site_description}}</p>
                            <p><small><strong>Data Source:</strong> Google Sheets</small></p>
                            <p><small><strong>Spreadsheet ID:</strong> ${{SPREADSHEET_ID}}</small></p>
                            <p><small><strong>Last Updated:</strong> <span id="lastUpdated">Loading...</span></small></p>
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-body">
                            <h5><i class="fas fa-chart-bar me-2"></i>Statistics</h5>
                            <div id="stats">
                                <p><i class="fas fa-spinner fa-spin"></i> Loading stats...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <footer class="bg-dark text-white mt-5 py-4">
            <div class="container text-center">
                <p>&copy; ${{BLOG_CONFIG.current_year}} ${{BLOG_CONFIG.site_title}}. Powered by Cloudflare Workers & Google Sheets.</p>
                <p><small>Generated by Blog Template System</small></p>
            </div>
        </footer>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
        <script>
            // Update last updated time
            document.getElementById('lastUpdated').textContent = new Date().toLocaleString('id-ID');
            
            // Load posts
            async function loadPosts() {{
                try {{
                    const response = await fetch('/api/posts')
                    const data = await response.json()
                    
                    if (data.success) {{
                        const posts = data.posts || []
                        const postsContainer = document.getElementById('posts')
                        
                        if (posts.length === 0) {{
                            postsContainer.innerHTML = '<div class="col-12 text-center"><p>No posts found. Add content to your Google Sheets!</p></div>'
                            return
                        }}
                        
                        postsContainer.innerHTML = posts.map(post => `
                            <div class="col-md-6 mb-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="card-title">${{post.title}}</h5>
                                        <p class="card-text">${{(post.content || '').substring(0, 150)}}...</p>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <small class="text-muted">${{post.category || 'Uncategorized'}} • ${{post.date}}</small>
                                            <a href="/post/${{post.slug}}" class="btn btn-primary btn-sm">Read More</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')
                    }} else {{
                        document.getElementById('posts').innerHTML = '<div class="col-12 text-center"><p>Error loading posts</p></div>'
                    }}
                }} catch (error) {{
                    console.error('Error loading posts:', error)
                    document.getElementById('posts').innerHTML = '<div class="col-12 text-center"><p>Failed to load posts</p></div>'
                }}
            }}
            
            // Load statistics
            async function loadStats() {{
                try {{
                    const response = await fetch('/api/stats')
                    const data = await response.json()
                    
                    if (data.success) {{
                        const stats = data.stats
                        document.getElementById('stats').innerHTML = `
                            <p><i class="fas fa-file-alt me-2"></i>Posts: ${{stats.totalPosts}}</p>
                            <p><i class="fas fa-folder me-2"></i>Categories: ${{stats.totalCategories}}</p>
                            <p><i class="fas fa-tags me-2"></i>Tags: ${{stats.totalTags}}</p>
                        `
                    }}
                }} catch (error) {{
                    console.error('Error loading stats:', error)
                    document.getElementById('stats').innerHTML = '<p>Error loading statistics</p>'
                }}
            }}
            
            // Initialize
            loadPosts()
            loadStats()
        </script>
    </body>
    </html>
    `
    
    return new Response(html, {{
        headers: {{ 'Content-Type': 'text/html' }}
    }})
}}

// API endpoints
async function getPosts() {{
    const posts = await getGoogleSheetsData()
    const publishedPosts = posts.filter(post => post.status === 'published' || !post.status)
    
    return new Response(JSON.stringify({{
        success: true,
        posts: publishedPosts,
        total: publishedPosts.length
    }}), {{
        headers: {{ 'Content-Type': 'application/json' }}
    }})
}}

async function getCategories() {{
    const posts = await getGoogleSheetsData()
    const categories = {{}}
    
    posts.forEach(post => {{
        const category = post.category || 'Uncategorized'
        categories[category] = (categories[category] || 0) + 1
    }})
    
    return new Response(JSON.stringify({{
        success: true,
        categories: categories
    }}), {{
        headers: {{ 'Content-Type': 'application/json' }}
    }})
}}

async function getTags() {{
    const posts = await getGoogleSheetsData()
    const tags = {{}}
    
    posts.forEach(post => {{
        const postTags = post.tags ? post.tags.split(',').map(tag => tag.trim()) : []
        postTags.forEach(tag => {{
            if (tag) tags[tag] = (tags[tag] || 0) + 1
        }})
    }})
    
    return new Response(JSON.stringify({{
        success: true,
        tags: tags
    }}), {{
        headers: {{ 'Content-Type': 'application/json' }}
    }})
}}

async function getStats() {{
    const posts = await getGoogleSheetsData()
    const categories = new Set(posts.map(post => post.category || 'Uncategorized'))
    const tags = new Set()
    
    posts.forEach(post => {{
        const postTags = post.tags ? post.tags.split(',').map(tag => tag.trim()) : []
        postTags.forEach(tag => {{
            if (tag) tags.add(tag)
        }})
    }})
    
    return new Response(JSON.stringify({{
        success: true,
        stats: {{
            totalPosts: posts.length,
            totalCategories: categories.size,
            totalTags: tags.size,
            publishedPosts: posts.filter(p => p.status === 'published' || !p.status).length
        }}
    }}), {{
        headers: {{ 'Content-Type': 'application/json' }}
    }})
}}

async function getPost(slug) {{
    const posts = await getGoogleSheetsData()
    const post = posts.find(p => p.slug === slug)
    
    if (!post) {{
        return new Response('Post not found', {{ status: 404 }})
    }}
    
    const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${{post.title}} - ${{BLOG_CONFIG.site_title}}</title>
        <meta name="description" content="${{(post.content || '').substring(0, 160)}}">
        <meta name="keywords" content="${{post.tags}}">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }}
            .navbar {{ background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }}
            .hero {{ background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 4rem 0; }}
            .post-content {{ line-height: 1.8; font-size: 1.1rem; }}
        </style>
    </head>
    <body>
        <nav class="navbar navbar-expand-lg navbar-dark">
            <div class="container">
                <a class="navbar-brand" href="/"><i class="fas fa-blog me-2"></i>${{BLOG_CONFIG.site_title}}</a>
                <div class="navbar-nav ms-auto">
                    <a class="nav-link" href="/">Home</a>
                </div>
            </div>
        </nav>
        
        <div class="hero text-center">
            <div class="container">
                <h1 class="display-4">${{post.title}}</h1>
                <p class="lead">${{post.category || 'Uncategorized'}} • ${{post.date}} • ${{post.author || 'Admin'}}</p>
            </div>
        </div>
        
        <div class="container mt-5">
            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <div class="post-content">
                        ${{(post.content || '').replace(/\\n/g, '<br>')}}
                    </div>
                    
                    <div class="mt-4">
                        <h6>Tags:</h6>
                        ${{(post.tags || '').split(',').map(tag => `<span class="badge bg-primary me-1">${{tag.trim()}}</span>`).join('')}}
                    </div>
                    
                    <div class="mt-4">
                        <a href="/" class="btn btn-outline-primary">
                            <i class="fas fa-arrow-left me-2"></i>Back to Blog
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <footer class="bg-dark text-white mt-5 py-4">
            <div class="container text-center">
                <p>&copy; ${{BLOG_CONFIG.current_year}} ${{BLOG_CONFIG.site_title}}. Powered by Cloudflare Workers.</p>
            </div>
        </footer>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    `
    
    return new Response(html, {{
        headers: {{ 'Content-Type': 'text/html' }}
    }})
}}

async function getPostAPI(slug) {{
    const posts = await getGoogleSheetsData()
    const post = posts.find(p => p.slug === slug)
    
    if (!post) {{
        return new Response(JSON.stringify({{
            success: false,
            message: 'Post not found'
        }}), {{
            status: 404,
            headers: {{ 'Content-Type': 'application/json' }}
        }})
    }}
    
    return new Response(JSON.stringify({{
        success: true,
        post: post
    }}), {{
        headers: {{ 'Content-Type': 'application/json' }}
    }})
}}"""

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #64748b; padding: 2rem 0;'>
    <p>🚀 Blog Template Generator - Powered by Streamlit</p>
    <p>Generate beautiful blog templates connected to Google Sheets</p>
</div>
""", unsafe_allow_html=True)