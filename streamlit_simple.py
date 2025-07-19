import streamlit as st
import requests
import json
import os

# Simple page config
st.set_page_config(
    page_title="Blog Generator",
    page_icon="📝",
    layout="wide"
)

# Load config
def load_config():
    if os.path.exists("app_config.json"):
        try:
            with open("app_config.json", 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

config = load_config()

# Header
st.title("🚀 Blog Template Generator")
st.markdown("Generate HTML blog templates connected to Google Sheets and deploy to Cloudflare Workers")

# Create tabs
tab1, tab2, tab3 = st.tabs(["⚙️ Configuration", "📝 Generate", "🚀 Deploy"])

with tab1:
    st.header("Configuration")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📊 Google Sheets")
        spreadsheet_id = st.text_input("Spreadsheet ID", value=config.get("spreadsheet_id", "14K69q8SMd3pCAROB1YQMDrmuw8y6QphxAslF_y-3NrM"))
        sheet_name = st.text_input("Sheet Name", value=config.get("sheet_name", "WEBSITE"))
        
        if st.button("Test Connection"):
            if spreadsheet_id:
                try:
                    url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv"
                    response = requests.get(url)
                    if response.status_code == 200:
                        st.success("✅ Connection successful!")
                        lines = response.text.split('\n')[:5]
                        for i, line in enumerate(lines):
                            st.text(f"Row {i+1}: {line}")
                    else:
                        st.error("❌ Connection failed")
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
    
    with col2:
        st.subheader("☁️ Cloudflare Workers")
        cf_api_token = st.text_input("API Token", type="password", value=config.get("cf_api_token", "xEPsMIeIGMaB46ryg2PmyQfyaUNErRL8vPmKXf6m"))
        cf_account_id = st.text_input("Account ID", value=config.get("cf_account_id", "a9f23a2cc52c24bcf5653631fcf6775b"))
        
        if st.button("Test Cloudflare"):
            if cf_api_token:
                try:
                    headers = {'Authorization': f'Bearer {cf_api_token}'}
                    url = "https://api.cloudflare.com/client/v4/user/tokens/verify"
                    response = requests.get(url, headers=headers)
                    if response.status_code == 200:
                        st.success("✅ Cloudflare token valid!")
                    else:
                        st.error("❌ Invalid token")
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")

with tab2:
    st.header("Generate Blog Template")
    
    col1, col2 = st.columns(2)
    
    with col1:
        blog_title = st.text_input("Blog Title", value="My Blog")
        blog_description = st.text_area("Description", value="Blog powered by Google Sheets")
    
    with col2:
        template_style = st.selectbox("Template Style", ["Modern", "Classic", "Minimal"])
        color_scheme = st.selectbox("Color Scheme", ["Blue", "Green", "Purple", "Dark"])
    
    if st.button("Generate Template"):
        with st.spinner("Generating template..."):
            # Generate HTML template
            html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{blog_title}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
        .header {{ text-align: center; margin-bottom: 40px; }}
        .posts {{ max-width: 800px; margin: 0 auto; }}
        .post {{ margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{blog_title}</h1>
        <p>{blog_description}</p>
    </div>
    <div class="posts" id="posts">
        <!-- Posts will be loaded here -->
    </div>
    <script>
        // Load posts from Google Sheets
        // Implementation here
    </script>
</body>
</html>"""
            
            st.success("✅ Template generated!")
            st.code(html_template, language="html")

with tab3:
    st.header("Deploy to Cloudflare Workers")
    
    if cf_api_token and cf_account_id:
        st.success("✅ Cloudflare credentials configured")
        
        worker_name = st.text_input("Worker Name", value="my-blog-worker")
        
        if st.button("Deploy to Cloudflare"):
            with st.spinner("Deploying..."):
                try:
                    # Worker script
                    worker_script = f"""
addEventListener('fetch', event => {{
  event.respondWith(handleRequest(event.request))
}})

async function handleRequest(request) {{
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>{blog_title}</title>
</head>
<body>
    <h1>{blog_title}</h1>
    <p>Blog deployed successfully!</p>
</body>
</html>`
  
  return new Response(html, {{
    headers: {{ 'content-type': 'text/html' }}
  }})
}}
"""
                    
                    # Deploy to Cloudflare
                    headers = {
                        'Authorization': f'Bearer {cf_api_token}',
                        'Content-Type': 'application/javascript'
                    }
                    
                    url = f"https://api.cloudflare.com/client/v4/accounts/{cf_account_id}/workers/scripts/{worker_name}"
                    response = requests.put(url, headers=headers, data=worker_script)
                    
                    if response.status_code in [200, 201]:
                        st.success(f"✅ Deployed successfully!")
                        st.success(f"🌐 URL: https://{worker_name}.{cf_account_id}.workers.dev")
                    else:
                        st.error(f"❌ Deploy failed: {response.text}")
                
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
    else:
        st.warning("⚠️ Please configure Cloudflare credentials first")