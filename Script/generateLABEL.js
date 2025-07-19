// Label generation functions for Google Apps Script
// This file contains functions for generating labels, tags, and categories

function generateLABEL() {
  // Generate labels for content categorization
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  
  if (!sheet) {
    throw new Error('Sheet "WEBSITE" not found');
  }
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const totalRows = values.length;
  
  console.log('Starting label generation process...');
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Generating labels...', 
    'Label Generation', 
    3
  );
  
  for (let i = 1; i < totalRows; i++) {
    const row = values[i];
    const keyword = row[0];
    const title = row[1];
    const content = row[2];
    const existingLabels = row[3];
    
    // Skip if labels already exist
    if (existingLabels && existingLabels.trim() !== '') {
      console.log(`Skipping row ${i + 1} - labels already exist`);
      continue;
    }
    
    if (keyword && keyword.trim() !== '') {
      try {
        console.log(`Generating labels for: "${keyword}"`);
        
        // Generate labels based on content
        const labels = generateLabelsFromContent(keyword, title, content);
        
        if (labels && labels.length > 0) {
          // Convert labels to comma-separated string
          const labelString = labels.join(', ');
          
          // Update sheet with generated labels
          sheet.getRange(i + 1, 4).setValue(labelString);
          
          // Add metadata
          sheet.getRange(i + 1, 5).setValue('AUTO_GENERATED');
          sheet.getRange(i + 1, 6).setValue(new Date().toISOString());
          
          console.log(`Labels generated for row ${i + 1}: "${labelString}"`);
          
          // Show progress
          SpreadsheetApp.getActiveSpreadsheet().toast(
            `Generated labels: "${labelString}"`,
            `Progress ${i}/${totalRows - 1}`,
            2
          );
        }
        
      } catch (error) {
        console.error(`Error generating labels for row ${i + 1}:`, error);
        
        // Mark error
        sheet.getRange(i + 1, 4).setValue('ERROR: ' + error.message);
        sheet.getRange(i + 1, 6).setValue(new Date().toISOString());
      }
    }
  }
  
  console.log('Label generation process completed');
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Label generation completed!',
    'Process Complete',
    3
  );
}

function generateLabelsFromContent(keyword, title, content) {
  // Generate labels based on content analysis
  const labels = new Set();
  
  // Add primary keyword as label
  if (keyword) {
    labels.add(cleanLabel(keyword));
  }
  
  // Extract labels from title
  if (title) {
    const titleLabels = extractLabelsFromText(title);
    titleLabels.forEach(label => labels.add(label));
  }
  
  // Extract labels from content
  if (content) {
    const contentLabels = extractLabelsFromText(content);
    contentLabels.forEach(label => labels.add(label));
  }
  
  // Add category-based labels
  const categoryLabels = generateCategoryLabels(keyword, title, content);
  categoryLabels.forEach(label => labels.add(label));
  
  // Add intent-based labels
  const intentLabels = generateIntentLabels(keyword, title, content);
  intentLabels.forEach(label => labels.add(label));
  
  // Convert to array and limit to top 10 labels
  const labelArray = Array.from(labels).slice(0, 10);
  
  return labelArray;
}

function extractLabelsFromText(text) {
  // Extract potential labels from text
  const labels = [];
  
  if (!text || typeof text !== 'string') {
    return labels;
  }
  
  // Common keywords that make good labels
  const labelPatterns = [
    /\b(guide|tutorial|tips|tricks|how-to|howto)\b/gi,
    /\b(beginner|advanced|expert|professional)\b/gi,
    /\b(best|top|ultimate|complete|comprehensive)\b/gi,
    /\b(tool|software|app|platform|service)\b/gi,
    /\b(business|marketing|technology|finance|education)\b/gi,
    /\b(free|paid|premium|budget|cheap|expensive)\b/gi,
    /\b(online|offline|digital|mobile|web)\b/gi,
    /\b(review|comparison|analysis|research)\b/gi
  ];
  
  labelPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        labels.push(cleanLabel(match));
      });
    }
  });
  
  // Extract important nouns
  const nouns = extractNouns(text);
  nouns.forEach(noun => {
    if (noun.length > 3) {
      labels.push(cleanLabel(noun));
    }
  });
  
  return labels;
}

function extractNouns(text) {
  // Simple noun extraction (this could be improved with NLP)
  const words = text.toLowerCase().split(/\s+/);
  const nouns = [];
  
  // Common noun patterns
  const nounIndicators = [
    /ing$/,  // -ing words
    /tion$/, // -tion words
    /ment$/, // -ment words
    /ness$/, // -ness words
    /ity$/,  // -ity words
    /ism$/,  // -ism words
    /er$/,   // -er words
    /or$/,   // -or words
    /ly$/    // -ly words (adverbs, but often related to nouns)
  ];
  
  words.forEach(word => {
    // Skip short words and common words
    if (word.length < 4 || isStopWord(word)) {
      return;
    }
    
    // Check if word matches noun patterns
    const isNoun = nounIndicators.some(pattern => pattern.test(word));
    if (isNoun) {
      nouns.push(word);
    }
  });
  
  return nouns;
}

function generateCategoryLabels(keyword, title, content) {
  // Generate category-based labels
  const categories = [];
  
  // Technology categories
  const techKeywords = [
    'software', 'app', 'tool', 'platform', 'technology', 'digital',
    'online', 'web', 'mobile', 'cloud', 'ai', 'machine learning',
    'programming', 'code', 'development', 'website', 'internet'
  ];
  
  // Business categories
  const businessKeywords = [
    'business', 'marketing', 'sales', 'management', 'strategy',
    'finance', 'accounting', 'startup', 'entrepreneur', 'company',
    'corporate', 'professional', 'office', 'work', 'career'
  ];
  
  // Education categories
  const educationKeywords = [
    'education', 'learning', 'course', 'tutorial', 'guide',
    'training', 'skill', 'knowledge', 'study', 'academic',
    'school', 'university', 'student', 'teacher', 'lesson'
  ];
  
  // Health categories
  const healthKeywords = [
    'health', 'medical', 'fitness', 'wellness', 'nutrition',
    'diet', 'exercise', 'mental', 'physical', 'healthcare',
    'medicine', 'treatment', 'therapy', 'doctor', 'hospital'
  ];
  
  const allText = [keyword, title, content].join(' ').toLowerCase();
  
  // Check for category matches
  if (techKeywords.some(kw => allText.includes(kw))) {
    categories.push('Technology');
  }
  if (businessKeywords.some(kw => allText.includes(kw))) {
    categories.push('Business');
  }
  if (educationKeywords.some(kw => allText.includes(kw))) {
    categories.push('Education');
  }
  if (healthKeywords.some(kw => allText.includes(kw))) {
    categories.push('Health');
  }
  
  return categories;
}

function generateIntentLabels(keyword, title, content) {
  // Generate intent-based labels
  const intents = [];
  
  const allText = [keyword, title, content].join(' ').toLowerCase();
  
  // Informational intent
  const informationalKeywords = [
    'what', 'how', 'why', 'when', 'where', 'guide', 'tutorial',
    'learn', 'understand', 'explain', 'definition', 'meaning'
  ];
  
  // Commercial intent
  const commercialKeywords = [
    'best', 'top', 'review', 'comparison', 'vs', 'compare',
    'alternative', 'option', 'choice', 'recommend', 'suggestion'
  ];
  
  // Transactional intent
  const transactionalKeywords = [
    'buy', 'purchase', 'order', 'sale', 'deal', 'discount',
    'price', 'cost', 'cheap', 'free', 'trial', 'download'
  ];
  
  // Navigational intent
  const navigationalKeywords = [
    'login', 'sign up', 'register', 'account', 'dashboard',
    'official', 'website', 'homepage', 'contact', 'support'
  ];
  
  // Check for intent matches
  if (informationalKeywords.some(kw => allText.includes(kw))) {
    intents.push('Informational');
  }
  if (commercialKeywords.some(kw => allText.includes(kw))) {
    intents.push('Commercial');
  }
  if (transactionalKeywords.some(kw => allText.includes(kw))) {
    intents.push('Transactional');
  }
  if (navigationalKeywords.some(kw => allText.includes(kw))) {
    intents.push('Navigational');
  }
  
  return intents;
}

function cleanLabel(label) {
  // Clean and normalize label
  if (!label || typeof label !== 'string') {
    return '';
  }
  
  // Remove extra whitespace and convert to lowercase
  let cleaned = label.trim().toLowerCase();
  
  // Remove special characters
  cleaned = cleaned.replace(/[^a-z0-9\s-]/g, '');
  
  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Convert to title case
  cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
  
  return cleaned;
}

function isStopWord(word) {
  // Check if word is a stop word
  const stopWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
    'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her',
    'its', 'our', 'their', 'what', 'which', 'who', 'when', 'where', 'why',
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'just', 'now'
  ];
  
  return stopWords.includes(word.toLowerCase());
}

function validateLabels(labels) {
  // Validate generated labels
  const issues = [];
  
  if (!labels || labels.length === 0) {
    issues.push('No labels generated');
    return { valid: false, issues };
  }
  
  // Check for minimum number of labels
  if (labels.length < 3) {
    issues.push('Too few labels (minimum 3 recommended)');
  }
  
  // Check for maximum number of labels
  if (labels.length > 15) {
    issues.push('Too many labels (maximum 15 recommended)');
  }
  
  // Check for duplicate labels
  const uniqueLabels = new Set(labels.map(label => label.toLowerCase()));
  if (uniqueLabels.size !== labels.length) {
    issues.push('Duplicate labels found');
  }
  
  // Check for empty or invalid labels
  labels.forEach((label, index) => {
    if (!label || label.trim() === '') {
      issues.push(`Empty label at position ${index + 1}`);
    }
    if (label.length < 2) {
      issues.push(`Label too short at position ${index + 1}: "${label}"`);
    }
    if (label.length > 50) {
      issues.push(`Label too long at position ${index + 1}: "${label}"`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues: issues,
    labelCount: labels.length,
    uniqueCount: uniqueLabels.size
  };
}

function optimizeLabels(labels) {
  // Optimize label list for better performance
  if (!labels || labels.length === 0) {
    return [];
  }
  
  // Remove duplicates
  const uniqueLabels = [...new Set(labels.map(label => label.toLowerCase()))]
    .map(label => cleanLabel(label));
  
  // Sort by relevance (this is a simple implementation)
  const sortedLabels = uniqueLabels.sort((a, b) => {
    // Prioritize shorter labels
    if (a.length !== b.length) {
      return a.length - b.length;
    }
    // Then alphabetically
    return a.localeCompare(b);
  });
  
  // Return top labels
  return sortedLabels.slice(0, 10);
}

function generateHashtags(labels) {
  // Generate hashtags from labels
  if (!labels || labels.length === 0) {
    return [];
  }
  
  const hashtags = labels.map(label => {
    // Remove spaces and special characters
    const hashtag = label.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    return '#' + hashtag;
  });
  
  return hashtags;
}

function batchGenerateLabels(startRow = 1, endRow = null) {
  // Generate labels for a batch of rows
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  const actualEndRow = endRow || values.length;
  
  console.log(`Generating labels for rows ${startRow} to ${actualEndRow}`);
  
  for (let i = startRow; i < actualEndRow; i++) {
    const keyword = values[i][0];
    const title = values[i][1];
    const content = values[i][2];
    
    if (keyword && keyword.trim() !== '') {
      try {
        const labels = generateLabelsFromContent(keyword, title, content);
        
        if (labels && labels.length > 0) {
          const labelString = labels.join(', ');
          sheet.getRange(i + 1, 4).setValue(labelString);
          sheet.getRange(i + 1, 6).setValue(new Date().toISOString());
          
          console.log(`Generated labels for row ${i + 1}: "${labelString}"`);
        }
        
      } catch (error) {
        console.error(`Error generating labels for row ${i + 1}:`, error);
        sheet.getRange(i + 1, 4).setValue('ERROR: ' + error.message);
      }
    }
  }
  
  console.log('Batch label generation completed');
}