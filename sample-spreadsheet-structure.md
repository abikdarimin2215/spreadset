# 📊 Sample Spreadsheet Structure

## Google Sheets Structure untuk Blog Template

### URL Spreadsheet Sample:
https://docs.google.com/spreadsheets/d/1igvz_FisR1DXWbllea7_oFhh6sLE6lIgtxXPMdmAE3A

### Sheet Name: WEBSITE

### Column Structure:

| Column | Header | Description | Example |
|--------|--------|-------------|---------|
| A | id | Unique identifier | 1, 2, 3, ... |
| B | title | Post title | "Cara Membuat Blog dengan Google Sheets" |
| C | slug | URL-friendly version | "cara-membuat-blog-dengan-google-sheets" |
| D | content | Post content | "Panduan lengkap untuk membuat blog..." |
| E | category | Post category | "Tutorial" |
| F | tags | Comma-separated tags | "blog, google sheets, tutorial" |
| G | author | Author name | "Admin" |
| H | date | Publication date | "2025-01-18" |
| I | status | Publication status | "published" |
| J | meta_description | SEO description | "Panduan lengkap membuat blog..." |
| K | featured_image | Image URL | "https://example.com/image.jpg" |
| L | excerpt | Short excerpt | "Panduan singkat untuk..." |

### Sample Data:

```
Row 1 (Headers):
id | title | slug | content | category | tags | author | date | status | meta_description | featured_image | excerpt

Row 2 (Data):
1 | Cara Membuat Blog dengan Google Sheets | cara-membuat-blog-dengan-google-sheets | Panduan lengkap untuk membuat blog sederhana yang terhubung dengan Google Sheets sebagai database. Dengan menggunakan Google Sheets, Anda dapat mengelola konten blog dengan mudah tanpa perlu database kompleks. | Tutorial | blog, google sheets, tutorial, web development | Admin | 2025-01-18 | published | Panduan lengkap untuk membuat blog dengan Google Sheets | https://example.com/blog-image.jpg | Panduan singkat untuk membuat blog dengan Google Sheets

Row 3 (Data):
2 | Optimasi SEO untuk Blog Sederhana | optimasi-seo-untuk-blog-sederhana | Tips dan trik untuk mengoptimalkan SEO blog Anda. Mulai dari meta description yang tepat, penggunaan heading yang benar, hingga struktur URL yang SEO-friendly. | SEO | seo, optimasi, blog, search engine | Admin | 2025-01-17 | published | Tips optimasi SEO untuk blog sederhana | https://example.com/seo-image.jpg | Tips optimasi SEO untuk blog Anda
```

### Required Columns:
- **id**: Unique identifier (auto-generated or manual)
- **title**: Post title (required)
- **content**: Post content (required)

### Optional Columns:
- **slug**: URL-friendly version (auto-generated from title if empty)
- **category**: Post category (defaults to "Uncategorized")
- **tags**: Comma-separated tags
- **author**: Author name (defaults to "Admin")
- **date**: Publication date (defaults to current date)
- **status**: Publication status (defaults to "published")
- **meta_description**: SEO description
- **featured_image**: Image URL
- **excerpt**: Short excerpt

### Status Values:
- **published**: Post is live and visible
- **draft**: Post is saved but not visible
- **scheduled**: Post is scheduled for future publication
- **private**: Post is private and not visible to public

### Category Examples:
- Tutorial
- SEO
- Design
- Development
- Deployment
- Tips & Tricks
- News
- Reviews

### Tag Examples:
- blog
- google sheets
- tutorial
- web development
- seo
- optimasi
- design
- responsive
- mobile
- api
- integration
- cloudflare
- workers
- deploy
- hosting

### Date Format:
- YYYY-MM-DD (e.g., 2025-01-18)
- DD/MM/YYYY (e.g., 18/01/2025)
- MM/DD/YYYY (e.g., 01/18/2025)

### Content Format:
- Plain text
- HTML tags supported
- Line breaks preserved
- Markdown syntax (optional)

### Image URL Format:
- Full URL: https://example.com/image.jpg
- Google Drive: https://drive.google.com/file/d/FILE_ID/view
- Imgur: https://i.imgur.com/IMAGE_ID.jpg
- Cloudinary: https://res.cloudinary.com/CLOUD_NAME/image/upload/IMAGE_ID.jpg

### Setup Instructions:

1. **Create Google Sheets:**
   - Go to https://sheets.google.com
   - Create new spreadsheet
   - Name it "Blog Content" or similar
   - Create sheet named "WEBSITE"

2. **Add Headers:**
   - Copy headers from table above to Row 1
   - Format headers (bold, background color)

3. **Add Sample Data:**
   - Add at least 3-5 sample posts
   - Test different categories and tags
   - Ensure all required fields are filled

4. **Set Permissions:**
   - Share spreadsheet with "Anyone with link can view"
   - Or share with specific Google account used for API

5. **Get Spreadsheet ID:**
   - Copy ID from URL: /spreadsheets/d/SPREADSHEET_ID/edit
   - Use this ID in your application

### API Integration:

The application will read data from your Google Sheets and automatically:
- Convert rows to blog posts
- Generate slugs from titles if not provided
- Filter posts by status
- Sort posts by date
- Extract categories and tags
- Build navigation and sidebar

### Data Validation:

The application includes validation for:
- Required fields (id, title, content)
- Date format validation
- Slug generation from title
- Category and tag extraction
- Status filtering

### Best Practices:

1. **Consistent Naming:**
   - Use consistent category names
   - Standardize tag formats
   - Follow date format consistently

2. **Content Quality:**
   - Write meaningful titles
   - Include proper meta descriptions
   - Add relevant tags and categories

3. **SEO Optimization:**
   - Use descriptive slugs
   - Include keywords in titles
   - Write compelling meta descriptions

4. **Organization:**
   - Group related posts by category
   - Use descriptive tags
   - Maintain consistent author names

5. **Testing:**
   - Test with different data types
   - Verify all fields work correctly
   - Check special characters and formatting

---

*This structure ensures your blog template works seamlessly with Google Sheets data.*