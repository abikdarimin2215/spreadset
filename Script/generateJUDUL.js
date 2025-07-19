// Title generation functions for Google Apps Script
// This file contains functions for generating titles and headlines

function generateJUDUL() {
  // Generate titles for articles or content
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  
  if (!sheet) {
    throw new Error('Sheet "WEBSITE" not found');
  }
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const totalRows = values.length;
  
  console.log('Starting title generation process...');
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Generating titles...', 
    'Title Generation', 
    3
  );
  
  for (let i = 1; i < totalRows; i++) {
    const row = values[i];
    const keyword = row[0];
    const existingTitle = row[1];
    
    // Skip if title already exists
    if (existingTitle && existingTitle.trim() !== '') {
      console.log(`Skipping row ${i + 1} - title already exists`);
      continue;
    }
    
    if (keyword && keyword.trim() !== '') {
      try {
        console.log(`Generating title for keyword: "${keyword}"`);
        
        // Generate title variations
        const titleVariations = generateTitleVariations(keyword);
        
        // Select best title
        const bestTitle = selectBestTitle(titleVariations, keyword);
        
        if (bestTitle) {
          // Update sheet with generated title
          sheet.getRange(i + 1, 2).setValue(bestTitle);
          
          // Add metadata
          sheet.getRange(i + 1, 3).setValue('AUTO_GENERATED');
          sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
          
          console.log(`Title generated for row ${i + 1}: "${bestTitle}"`);
          
          // Show progress
          SpreadsheetApp.getActiveSpreadsheet().toast(
            `Generated title: "${bestTitle}"`,
            `Progress ${i}/${totalRows - 1}`,
            2
          );
        }
        
      } catch (error) {
        console.error(`Error generating title for row ${i + 1}:`, error);
        
        // Mark error
        sheet.getRange(i + 1, 2).setValue('ERROR: ' + error.message);
        sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      }
    }
  }
  
  console.log('Title generation process completed');
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Title generation completed!',
    'Process Complete',
    3
  );
}

function generateTitleVariations(keyword) {
  // Generate multiple title variations for a keyword
  const variations = [];
  
  // Basic title formats
  const formats = [
    `Complete Guide to ${keyword}`,
    `Ultimate ${keyword} Guide`,
    `How to Master ${keyword}`,
    `${keyword}: Everything You Need to Know`,
    `Best Practices for ${keyword}`,
    `${keyword} Tips and Tricks`,
    `Understanding ${keyword}`,
    `${keyword} Explained`,
    `Top ${keyword} Strategies`,
    `${keyword} for Beginners`
  ];
  
  // Generate variations
  formats.forEach(format => {
    variations.push(format);
  });
  
  // Add question-based titles
  const questionFormats = [
    `What is ${keyword}?`,
    `How Does ${keyword} Work?`,
    `Why is ${keyword} Important?`,
    `When to Use ${keyword}?`,
    `Where to Find ${keyword}?`
  ];
  
  questionFormats.forEach(format => {
    variations.push(format);
  });
  
  // Add list-based titles
  const listFormats = [
    `10 Things About ${keyword}`,
    `5 Ways to Use ${keyword}`,
    `Top 7 ${keyword} Benefits`,
    `3 Common ${keyword} Mistakes`,
    `Best ${keyword} Tools and Resources`
  ];
  
  listFormats.forEach(format => {
    variations.push(format);
  });
  
  return variations;
}

function selectBestTitle(variations, keyword) {
  // Select the best title from variations
  if (!variations || variations.length === 0) {
    return null;
  }
  
  // Score each variation
  const scoredVariations = variations.map(title => ({
    title: title,
    score: calculateTitleScore(title, keyword)
  }));
  
  // Sort by score (highest first)
  scoredVariations.sort((a, b) => b.score - a.score);
  
  // Return the best title
  return scoredVariations[0].title;
}

function calculateTitleScore(title, keyword) {
  // Calculate a score for the title based on SEO and readability factors
  let score = 0;
  
  // Length score (ideal length: 50-60 characters)
  const length = title.length;
  if (length >= 50 && length <= 60) {
    score += 10;
  } else if (length >= 40 && length <= 70) {
    score += 5;
  }
  
  // Keyword presence
  if (title.toLowerCase().includes(keyword.toLowerCase())) {
    score += 15;
  }
  
  // Power words
  const powerWords = [
    'ultimate', 'complete', 'best', 'top', 'guide', 'tips', 'tricks',
    'strategies', 'secrets', 'proven', 'expert', 'professional',
    'advanced', 'beginner', 'easy', 'simple', 'quick', 'fast'
  ];
  
  powerWords.forEach(word => {
    if (title.toLowerCase().includes(word)) {
      score += 2;
    }
  });
  
  // Numbers in title
  if (/\d+/.test(title)) {
    score += 5;
  }
  
  // Question titles
  if (title.includes('?')) {
    score += 3;
  }
  
  // Avoid excessive punctuation
  const punctuationCount = (title.match(/[!?.:;,]/g) || []).length;
  if (punctuationCount > 3) {
    score -= 5;
  }
  
  return score;
}

function generateSEOTitle(keyword, intent = 'informational') {
  // Generate SEO-optimized title based on search intent
  const templates = {
    informational: [
      `What is ${keyword}? Complete Guide`,
      `${keyword} Explained: Everything You Need to Know`,
      `Understanding ${keyword}: A Comprehensive Guide`,
      `${keyword} Guide: Definition, Benefits, and Uses`
    ],
    commercial: [
      `Best ${keyword} Tools and Software`,
      `Top ${keyword} Solutions for Your Business`,
      `${keyword} Comparison: Which is Right for You?`,
      `Best ${keyword} Options in 2024`
    ],
    transactional: [
      `Buy ${keyword}: Top Deals and Offers`,
      `${keyword} for Sale: Best Prices Online`,
      `Get ${keyword}: Quick and Easy Purchase`,
      `${keyword} Store: Premium Quality Products`
    ],
    navigational: [
      `${keyword} Official Website`,
      `${keyword} Login and Access`,
      `${keyword} Dashboard and Tools`,
      `${keyword} Platform Guide`
    ]
  };
  
  const intentTemplates = templates[intent] || templates.informational;
  const randomIndex = Math.floor(Math.random() * intentTemplates.length);
  
  return intentTemplates[randomIndex];
}

function optimizeTitleForSEO(title, keyword) {
  // Optimize title for SEO
  let optimized = title;
  
  // Ensure keyword is at the beginning if possible
  if (!optimized.toLowerCase().startsWith(keyword.toLowerCase())) {
    optimized = `${keyword}: ${optimized}`;
  }
  
  // Capitalize properly
  optimized = optimized.replace(/\b\w/g, l => l.toUpperCase());
  
  // Remove extra spaces
  optimized = optimized.replace(/\s+/g, ' ').trim();
  
  // Ensure proper length
  if (optimized.length > 60) {
    optimized = optimized.substring(0, 57) + '...';
  }
  
  return optimized;
}

function generateClickbaitTitle(keyword) {
  // Generate clickbait-style title (use carefully)
  const clickbaitFormats = [
    `You Won't Believe What ${keyword} Can Do`,
    `This ${keyword} Trick Will Change Your Life`,
    `${keyword} Experts Don't Want You to Know This`,
    `The Secret ${keyword} Method That Works`,
    `Amazing ${keyword} Results in Just 24 Hours`,
    `${keyword} Hack That Everyone Should Know`,
    `Why ${keyword} is Taking Over the Internet`,
    `The ${keyword} Mistake Everyone Makes`,
    `${keyword}: The Game-Changing Solution`,
    `Incredible ${keyword} Discovery Revealed`
  ];
  
  const randomIndex = Math.floor(Math.random() * clickbaitFormats.length);
  return clickbaitFormats[randomIndex];
}

function validateTitle(title) {
  // Validate title quality
  const issues = [];
  
  // Check length
  if (title.length < 30) {
    issues.push('Title too short (less than 30 characters)');
  }
  if (title.length > 70) {
    issues.push('Title too long (more than 70 characters)');
  }
  
  // Check for excessive punctuation
  const punctuationCount = (title.match(/[!?.:;,]/g) || []).length;
  if (punctuationCount > 3) {
    issues.push('Too much punctuation');
  }
  
  // Check for excessive capitalization
  const capsCount = (title.match(/[A-Z]/g) || []).length;
  if (capsCount > title.length * 0.5) {
    issues.push('Too much capitalization');
  }
  
  // Check for stop words at the beginning
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const firstWord = title.split(' ')[0].toLowerCase();
  if (stopWords.includes(firstWord)) {
    issues.push('Starts with stop word');
  }
  
  return {
    valid: issues.length === 0,
    issues: issues,
    score: calculateTitleScore(title, '')
  };
}

function batchGenerateTitles(startRow = 1, endRow = null) {
  // Generate titles for a batch of rows
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  const actualEndRow = endRow || values.length;
  
  console.log(`Generating titles for rows ${startRow} to ${actualEndRow}`);
  
  for (let i = startRow; i < actualEndRow; i++) {
    const keyword = values[i][0];
    
    if (keyword && keyword.trim() !== '') {
      try {
        const variations = generateTitleVariations(keyword);
        const bestTitle = selectBestTitle(variations, keyword);
        
        if (bestTitle) {
          sheet.getRange(i + 1, 2).setValue(bestTitle);
          sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
          
          console.log(`Generated title for row ${i + 1}: "${bestTitle}"`);
        }
        
      } catch (error) {
        console.error(`Error generating title for row ${i + 1}:`, error);
        sheet.getRange(i + 1, 2).setValue('ERROR: ' + error.message);
      }
    }
  }
  
  console.log('Batch title generation completed');
}