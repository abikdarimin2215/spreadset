// Meta data generation functions for Google Apps Script
// This file contains functions for generating meta descriptions and metadata

function generateMETA() {
  // Generate meta descriptions for SEO
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  
  if (!sheet) {
    throw new Error('Sheet "WEBSITE" not found');
  }
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const totalRows = values.length;
  
  console.log('Starting meta description generation...');
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Generating meta descriptions...', 
    'Meta Generation', 
    3
  );
  
  for (let i = 1; i < totalRows; i++) {
    const row = values[i];
    const keyword = row[0];
    const title = row[1];
    const content = row[2];
    const existingMeta = row[3];
    
    // Skip if meta already exists
    if (existingMeta && existingMeta.trim() !== '') {
      console.log(`Skipping row ${i + 1} - meta already exists`);
      continue;
    }
    
    if (keyword && keyword.trim() !== '') {
      try {
        console.log(`Generating meta description for: "${keyword}"`);
        
        // Generate meta description
        const metaDescription = generateMetaDescription(keyword, title, content);
        
        if (metaDescription) {
          // Update sheet with generated meta
          sheet.getRange(i + 1, 4).setValue(metaDescription);
          
          // Add metadata
          sheet.getRange(i + 1, 5).setValue('AUTO_GENERATED');
          sheet.getRange(i + 1, 6).setValue(new Date().toISOString());
          
          console.log(`Meta generated for row ${i + 1}: "${metaDescription}"`);
          
          // Show progress
          SpreadsheetApp.getActiveSpreadsheet().toast(
            `Generated meta: "${metaDescription.substring(0, 50)}..."`,
            `Progress ${i}/${totalRows - 1}`,
            2
          );
        }
        
      } catch (error) {
        console.error(`Error generating meta for row ${i + 1}:`, error);
        
        // Mark error
        sheet.getRange(i + 1, 4).setValue('ERROR: ' + error.message);
        sheet.getRange(i + 1, 6).setValue(new Date().toISOString());
      }
    }
  }
  
  console.log('Meta description generation completed');
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Meta generation completed!',
    'Process Complete',
    3
  );
}

function generateMetaDescription(keyword, title, content) {
  // Generate SEO-optimized meta description
  const templates = [
    `Learn about ${keyword} with our comprehensive guide. Discover tips, strategies, and best practices for ${keyword}.`,
    `Everything you need to know about ${keyword}. Expert insights, practical tips, and detailed information about ${keyword}.`,
    `Master ${keyword} with our step-by-step guide. Get the latest information and best practices for ${keyword}.`,
    `Discover ${keyword} essentials. Complete guide with tips, tricks, and expert advice for ${keyword}.`,
    `Get the ultimate ${keyword} guide. Learn key strategies, benefits, and practical applications of ${keyword}.`
  ];
  
  // Select random template
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  // Customize based on content
  let metaDescription = customizeMetaDescription(randomTemplate, keyword, title, content);
  
  // Optimize for SEO
  metaDescription = optimizeMetaDescription(metaDescription, keyword);
  
  return metaDescription;
}

function customizeMetaDescription(template, keyword, title, content) {
  // Customize meta description based on available content
  let customized = template;
  
  // Extract key phrases from content
  if (content && content.length > 0) {
    const keyPhrases = extractKeyPhrases(content);
    if (keyPhrases.length > 0) {
      // Replace generic phrases with specific ones
      customized = customized.replace(
        'tips, strategies, and best practices',
        keyPhrases.slice(0, 3).join(', ')
      );
    }
  }
  
  // Use title information if available
  if (title && title.length > 0) {
    const titleKeywords = extractKeywords(title);
    if (titleKeywords.length > 0) {
      customized = customized.replace(
        'expert insights',
        titleKeywords[0] + ' insights'
      );
    }
  }
  
  return customized;
}

function extractKeyPhrases(text) {
  // Extract key phrases from text
  const phrases = [];
  
  if (!text || typeof text !== 'string') {
    return phrases;
  }
  
  // Common valuable phrases
  const phrasePatterns = [
    /\b(benefits of|advantages of|features of|uses of|applications of)\s+\w+/gi,
    /\b(how to|ways to|methods to|strategies for|tips for)\s+\w+/gi,
    /\b(best|top|leading|popular|effective|proven)\s+\w+/gi,
    /\b(free|premium|professional|advanced|basic)\s+\w+/gi,
    /\b(online|digital|mobile|web-based|cloud)\s+\w+/gi
  ];
  
  phrasePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        phrases.push(match.toLowerCase());
      });
    }
  });
  
  return phrases.slice(0, 5); // Return top 5 phrases
}

function extractKeywords(text) {
  // Extract keywords from text
  const keywords = [];
  
  if (!text || typeof text !== 'string') {
    return keywords;
  }
  
  // Split text into words
  const words = text.toLowerCase().split(/\s+/);
  
  // Filter out stop words and short words
  const filteredWords = words.filter(word => 
    word.length > 3 && !isStopWord(word)
  );
  
  // Count word frequency
  const wordCount = {};
  filteredWords.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Sort by frequency
  const sortedWords = Object.keys(wordCount).sort((a, b) => 
    wordCount[b] - wordCount[a]
  );
  
  return sortedWords.slice(0, 10);
}

function optimizeMetaDescription(metaDescription, keyword) {
  // Optimize meta description for SEO
  let optimized = metaDescription;
  
  // Ensure keyword is included
  if (!optimized.toLowerCase().includes(keyword.toLowerCase())) {
    optimized = `${keyword} - ${optimized}`;
  }
  
  // Ensure proper length (120-160 characters)
  if (optimized.length < 120) {
    optimized = expandMetaDescription(optimized, keyword);
  }
  
  if (optimized.length > 160) {
    optimized = optimized.substring(0, 157) + '...';
  }
  
  // Add call-to-action if space allows
  if (optimized.length < 140) {
    const ctas = [
      'Learn more here.',
      'Get started today.',
      'Discover more.',
      'Find out how.',
      'Read our guide.'
    ];
    
    const randomCTA = ctas[Math.floor(Math.random() * ctas.length)];
    optimized += ' ' + randomCTA;
  }
  
  // Final length check
  if (optimized.length > 160) {
    optimized = optimized.substring(0, 157) + '...';
  }
  
  return optimized;
}

function expandMetaDescription(metaDescription, keyword) {
  // Expand short meta descriptions
  const expansions = [
    ` Perfect for beginners and professionals alike.`,
    ` Comprehensive ${keyword} resources and tools.`,
    ` Stay updated with the latest ${keyword} trends.`,
    ` Expert-approved ${keyword} strategies and techniques.`,
    ` Everything you need for ${keyword} success.`
  ];
  
  // Add expansion if there's room
  const randomExpansion = expansions[Math.floor(Math.random() * expansions.length)];
  
  if (metaDescription.length + randomExpansion.length <= 160) {
    return metaDescription + randomExpansion;
  }
  
  return metaDescription;
}

function generateOpenGraphMeta(keyword, title, description, imageUrl = null) {
  // Generate Open Graph meta tags
  const ogMeta = {
    'og:title': title || `${keyword} - Complete Guide`,
    'og:description': description || generateMetaDescription(keyword, title, ''),
    'og:type': 'article',
    'og:url': '', // This would be filled with actual URL
    'og:site_name': 'Your Site Name',
    'og:image': imageUrl || generateDefaultImageUrl(keyword),
    'og:image:alt': `${keyword} guide and information`,
    'og:locale': 'en_US'
  };
  
  return ogMeta;
}

function generateTwitterMeta(keyword, title, description, imageUrl = null) {
  // Generate Twitter Card meta tags
  const twitterMeta = {
    'twitter:card': 'summary_large_image',
    'twitter:title': title || `${keyword} - Complete Guide`,
    'twitter:description': description || generateMetaDescription(keyword, title, ''),
    'twitter:image': imageUrl || generateDefaultImageUrl(keyword),
    'twitter:image:alt': `${keyword} guide and information`,
    'twitter:site': '@yoursite',
    'twitter:creator': '@yoursite'
  };
  
  return twitterMeta;
}

function generateStructuredData(keyword, title, description, author = 'Your Site') {
  // Generate JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title || `${keyword} - Complete Guide`,
    "description": description || generateMetaDescription(keyword, title, ''),
    "author": {
      "@type": "Person",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Your Site",
      "logo": {
        "@type": "ImageObject",
        "url": "https://yoursite.com/logo.png"
      }
    },
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://yoursite.com/article-url"
    },
    "image": {
      "@type": "ImageObject",
      "url": generateDefaultImageUrl(keyword),
      "width": 1200,
      "height": 630
    },
    "keywords": [keyword],
    "articleSection": "Guides",
    "wordCount": 1000
  };
  
  return structuredData;
}

function generateDefaultImageUrl(keyword) {
  // Generate default image URL (placeholder)
  const encodedKeyword = encodeURIComponent(keyword);
  return `https://via.placeholder.com/1200x630/0066cc/ffffff?text=${encodedKeyword}`;
}

function validateMetaDescription(metaDescription) {
  // Validate meta description quality
  const issues = [];
  
  if (!metaDescription || metaDescription.trim() === '') {
    issues.push('Meta description is empty');
    return { valid: false, issues };
  }
  
  // Check length
  if (metaDescription.length < 120) {
    issues.push('Meta description too short (less than 120 characters)');
  }
  if (metaDescription.length > 160) {
    issues.push('Meta description too long (more than 160 characters)');
  }
  
  // Check for duplicate words
  const words = metaDescription.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (uniqueWords.size < words.length * 0.8) {
    issues.push('Too many repeated words');
  }
  
  // Check for call-to-action
  const ctas = ['learn', 'discover', 'find', 'get', 'read', 'explore', 'see'];
  const hasCTA = ctas.some(cta => metaDescription.toLowerCase().includes(cta));
  if (!hasCTA) {
    issues.push('No call-to-action found');
  }
  
  return {
    valid: issues.length === 0,
    issues: issues,
    length: metaDescription.length,
    wordCount: words.length
  };
}

function batchGenerateMeta(startRow = 1, endRow = null) {
  // Generate meta descriptions for a batch of rows
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  const actualEndRow = endRow || values.length;
  
  console.log(`Generating meta descriptions for rows ${startRow} to ${actualEndRow}`);
  
  for (let i = startRow; i < actualEndRow; i++) {
    const keyword = values[i][0];
    const title = values[i][1];
    const content = values[i][2];
    
    if (keyword && keyword.trim() !== '') {
      try {
        const metaDescription = generateMetaDescription(keyword, title, content);
        
        if (metaDescription) {
          sheet.getRange(i + 1, 4).setValue(metaDescription);
          sheet.getRange(i + 1, 6).setValue(new Date().toISOString());
          
          console.log(`Generated meta for row ${i + 1}: "${metaDescription}"`);
        }
        
      } catch (error) {
        console.error(`Error generating meta for row ${i + 1}:`, error);
        sheet.getRange(i + 1, 4).setValue('ERROR: ' + error.message);
      }
    }
  }
  
  console.log('Batch meta generation completed');
}

function isStopWord(word) {
  // Check if word is a stop word
  const stopWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
    'this', 'that', 'these', 'those'
  ];
  
  return stopWords.includes(word.toLowerCase());
}