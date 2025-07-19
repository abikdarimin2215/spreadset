// Article generation functions for Google Apps Script
// This file contains functions for generating articles using AI APIs

function generateARTIKEL() {
  // Generate articles using OpenAI API
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const totalRows = values.length;
  
  // OpenAI API configuration
  const apiKey = getOpenAIApiKey();
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  
  console.log('Starting article generation...');
  
  for (let i = 1; i < totalRows; i++) {
    const row = values[i];
    const keyword = row[0];
    const title = row[1];
    const description = row[2];
    
    if (keyword && title) {
      try {
        console.log(`Generating article for row ${i + 1}: ${keyword}`);
        
        // Create prompt for article generation
        const prompt = createArticlePrompt(keyword, title, description);
        
        // Generate article using OpenAI API
        const article = generateArticleContent(apiUrl, apiKey, prompt);
        
        if (article) {
          // Update the sheet with generated content
          sheet.getRange(i + 1, 4).setValue(article);
          sheet.getRange(i + 1, 5).setValue(new Date().toISOString());
          
          console.log(`Article generated successfully for row ${i + 1}`);
          
          // Show progress
          SpreadsheetApp.getActiveSpreadsheet().toast(
            `Article generated for "${keyword}"`,
            `Progress ${i}/${totalRows - 1}`,
            3
          );
          
          // Add delay to respect API rate limits
          Utilities.sleep(1000);
        }
        
      } catch (error) {
        console.error(`Error generating article for row ${i + 1}:`, error);
        
        // Mark error in sheet
        sheet.getRange(i + 1, 4).setValue('ERROR: ' + error.message);
        sheet.getRange(i + 1, 5).setValue(new Date().toISOString());
        
        SpreadsheetApp.getActiveSpreadsheet().toast(
          `Error generating article for "${keyword}": ${error.message}`,
          'Error',
          5
        );
      }
    }
  }
  
  console.log('Article generation process completed');
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Article generation completed!',
    'Process Complete',
    3
  );
}

function createArticlePrompt(keyword, title, description) {
  // Create prompt for AI article generation
  let prompt = `Write a comprehensive article about "${keyword}"`;
  
  if (title) {
    prompt += ` with the title "${title}"`;
  }
  
  if (description) {
    prompt += `. Focus on: ${description}`;
  }
  
  prompt += `
  
  Please write a well-structured article with:
  - Introduction that hooks the reader
  - 3-5 main sections with subheadings
  - Practical examples and tips
  - Conclusion that summarizes key points
  - Use SEO-friendly language
  - Make it engaging and informative
  - Target word count: 800-1200 words
  
  Format the article with proper HTML tags for headings and paragraphs.`;
  
  return prompt;
}

function generateArticleContent(apiUrl, apiKey, prompt) {
  // Generate article content using OpenAI API
  const payload = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a professional content writer who creates high-quality, SEO-optimized articles.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 2000,
    temperature: 0.7
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseData = JSON.parse(response.getContentText());
    
    if (responseData.choices && responseData.choices.length > 0) {
      return responseData.choices[0].message.content.trim();
    } else {
      throw new Error('No content generated from API');
    }
    
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

function getOpenAIApiKey() {
  // Get OpenAI API key from script properties
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty('OPENAI_API_KEY');
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY in script properties.');
  }
  
  return apiKey;
}

function setOpenAIApiKey(apiKey) {
  // Set OpenAI API key in script properties
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('OPENAI_API_KEY', apiKey);
  
  console.log('OpenAI API key has been set successfully');
}

function generateSingleArticle(keyword, title, description) {
  // Generate a single article for testing
  try {
    const apiKey = getOpenAIApiKey();
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    const prompt = createArticlePrompt(keyword, title, description);
    const article = generateArticleContent(apiUrl, apiKey, prompt);
    
    console.log('Generated article:', article);
    return article;
    
  } catch (error) {
    console.error('Error generating single article:', error);
    throw error;
  }
}

function batchGenerateArticles(startRow = 1, endRow = null) {
  // Generate articles for a specific range of rows
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  const lastRow = endRow || values.length;
  const actualEndRow = Math.min(lastRow, values.length);
  
  console.log(`Generating articles for rows ${startRow} to ${actualEndRow}`);
  
  for (let i = startRow; i < actualEndRow; i++) {
    const row = values[i];
    const keyword = row[0];
    const title = row[1];
    const description = row[2];
    
    if (keyword && title) {
      try {
        const apiKey = getOpenAIApiKey();
        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        
        const prompt = createArticlePrompt(keyword, title, description);
        const article = generateArticleContent(apiUrl, apiKey, prompt);
        
        if (article) {
          sheet.getRange(i + 1, 4).setValue(article);
          sheet.getRange(i + 1, 5).setValue(new Date().toISOString());
          
          console.log(`Article generated for row ${i + 1}: ${keyword}`);
          
          // Progress notification
          SpreadsheetApp.getActiveSpreadsheet().toast(
            `Generated article ${i - startRow + 1} of ${actualEndRow - startRow}`,
            'Batch Generation',
            2
          );
          
          // Rate limiting
          Utilities.sleep(1500);
        }
        
      } catch (error) {
        console.error(`Error generating article for row ${i + 1}:`, error);
        
        sheet.getRange(i + 1, 4).setValue('ERROR: ' + error.message);
        sheet.getRange(i + 1, 5).setValue(new Date().toISOString());
      }
    }
  }
  
  console.log(`Batch generation completed for rows ${startRow} to ${actualEndRow}`);
}

function cleanupArticleContent(content) {
  // Clean up generated article content
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  let cleaned = content.trim();
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Remove line breaks within paragraphs
  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
  
  // Ensure proper HTML structure
  cleaned = cleaned.replace(/([.!?])\s*\n\s*([A-Z])/g, '$1\n\n$2');
  
  return cleaned;
}

function validateArticleQuality(content) {
  // Validate the quality of generated articles
  if (!content || typeof content !== 'string') {
    return { valid: false, reason: 'Empty or invalid content' };
  }
  
  const wordCount = content.split(/\s+/).length;
  
  // Check minimum word count
  if (wordCount < 300) {
    return { valid: false, reason: 'Article too short (less than 300 words)' };
  }
  
  // Check for basic structure
  const hasHeadings = content.includes('<h') || content.includes('#');
  const hasParagraphs = content.includes('<p>') || content.includes('\n\n');
  
  if (!hasHeadings && !hasParagraphs) {
    return { valid: false, reason: 'Poor structure (no headings or paragraphs)' };
  }
  
  // Check for duplicate phrases (simple check)
  const sentences = content.split(/[.!?]+/);
  const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
  
  if (uniqueSentences.size < sentences.length * 0.8) {
    return { valid: false, reason: 'Too much repetitive content' };
  }
  
  return { 
    valid: true, 
    wordCount: wordCount,
    hasHeadings: hasHeadings,
    hasParagraphs: hasParagraphs
  };
}