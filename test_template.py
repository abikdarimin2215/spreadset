#!/usr/bin/env python3
"""
Test script untuk debugging template generation dan deployment
"""

import os
import json

# Test 1: Buat template sederhana
def create_test_template():
    """Buat template test sederhana"""
    template_html = """<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{blog_title}}</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f0f8ff; }
        .header { background: #4169e1; color: white; padding: 2rem; text-align: center; }
        .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
        .post { background: white; margin: 1rem 0; padding: 1rem; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{blog_title}}</h1>
        <p>{{blog_description}}</p>
    </div>
    <div class="container">
        <div id="posts">Loading posts...</div>
    </div>
    
    <script>
        async function loadPosts() {
            try {
                const response = await fetch('/api/posts');
                const data = await response.json();
                
                if (data.success && data.posts) {
                    const postsContainer = document.getElementById('posts');
                    const posts = data.posts;
                    
                    postsContainer.innerHTML = posts.map(post => `
                        <div class="post">
                            <h3>${post.title}</h3>
                            <p>${(post.content || '').substring(0, 200)}...</p>
                            <small>Category: ${post.category || 'Uncategorized'} | Date: ${post.date}</small>
                        </div>
                    `).join('');
                }
            } catch (error) {
                document.getElementById('posts').innerHTML = 'Failed to load posts: ' + error.message;
            }
        }
        
        loadPosts();
    </script>
</body>
</html>"""
    
    config = {
        "type": "Blog Homepage",
        "blog_title": "Test Blog",
        "blog_description": "Test blog untuk testing deployment",
        "blog_keywords": "test, blog, deployment",
        "color_scheme": "Blue",
        "layout_style": "Modern",
        "posts_per_page": 6
    }
    
    # Save template dan config
    with open('generated_template.html', 'w', encoding='utf-8') as f:
        f.write(template_html)
    
    with open('generated_template_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✅ Test template created!")
    print(f"Template size: {len(template_html)} characters")
    print(f"Config saved: {config}")

# Test 2: Test JSON escaping
def test_json_escaping():
    """Test JSON escaping untuk JavaScript"""
    with open('generated_template.html', 'r', encoding='utf-8') as f:
        template = f.read()
    
    # Test escaping
    escaped = json.dumps(template)
    print("\n✅ JSON escaping test:")
    print(f"Original length: {len(template)}")
    print(f"Escaped length: {len(escaped)}")
    print(f"First 100 chars: {escaped[:100]}")

# Test 3: Check files
def check_files():
    """Check if files exist"""
    files = ['generated_template.html', 'generated_template_config.json']
    print("\n✅ File check:")
    for file in files:
        if os.path.exists(file):
            size = os.path.getsize(file)
            print(f"  {file}: EXISTS ({size} bytes)")
        else:
            print(f"  {file}: NOT FOUND")

if __name__ == "__main__":
    print("🔍 Testing template generation and deployment...")
    
    create_test_template()
    test_json_escaping()
    check_files()
    
    print("\n🚀 Run this test, then try deployment in Streamlit!")