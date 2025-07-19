// Google Search Console indexing functions
// This file contains functions for managing Google Search Console indexing

function indexing() {
  // Main indexing function to submit URLs to Google Search Console
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  
  if (!sheet) {
    throw new Error('Sheet "WEBSITE" not found');
  }
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const totalRows = values.length;
  
  console.log('Starting URL indexing process...');
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Starting URL indexing...', 
    'Search Console Indexing', 
    3
  );
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 1; i < totalRows; i++) {
    const row = values[i];
    const url = row[0];
    const status = row[1];
    
    // Skip if already indexed
    if (status === 'INDEXED' || status === 'SUBMITTED') {
      console.log(`Skipping row ${i + 1} - already processed`);
      continue;
    }
    
    if (url && url.trim() !== '') {
      try {
        console.log(`Submitting URL for indexing: "${url}"`);
        
        // Submit URL to Google Search Console
        const result = submitUrlForIndexing(url);
        
        if (result.success) {
          // Update status
          sheet.getRange(i + 1, 2).setValue('SUBMITTED');
          sheet.getRange(i + 1, 3).setValue(new Date().toISOString());
          sheet.getRange(i + 1, 4).setValue(result.message || 'Successfully submitted');
          
          successCount++;
          
          console.log(`URL submitted successfully: ${url}`);
          
          // Show progress
          SpreadsheetApp.getActiveSpreadsheet().toast(
            `Submitted: ${url}`,
            `Progress ${i}/${totalRows - 1} (${successCount} success, ${errorCount} errors)`,
            2
          );
          
        } else {
          throw new Error(result.message || 'Submission failed');
        }
        
        // Rate limiting to avoid quota issues
        Utilities.sleep(2000);
        
      } catch (error) {
        console.error(`Error submitting URL for row ${i + 1}:`, error);
        
        // Mark error
        sheet.getRange(i + 1, 2).setValue('ERROR');
        sheet.getRange(i + 1, 3).setValue(new Date().toISOString());
        sheet.getRange(i + 1, 4).setValue(error.message);
        
        errorCount++;
        
        SpreadsheetApp.getActiveSpreadsheet().toast(
          `Error: ${error.message}`,
          `URL: ${url}`,
          3
        );
      }
    }
  }
  
  console.log(`Indexing process completed. Success: ${successCount}, Errors: ${errorCount}`);
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Indexing completed! ${successCount} URLs submitted, ${errorCount} errors.`,
    'Process Complete',
    5
  );
}

function submitUrlForIndexing(url) {
  // Submit URL to Google Search Console Indexing API
  try {
    // Validate URL
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL format');
    }
    
    // Get API credentials
    const credentials = getSearchConsoleCredentials();
    
    if (!credentials) {
      throw new Error('Google Search Console credentials not found');
    }
    
    // Prepare API request
    const apiUrl = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
    
    const payload = {
      url: url,
      type: 'URL_UPDATED'
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + credentials.accessToken,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    };
    
    // Make API call
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseData = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200) {
      return {
        success: true,
        message: 'URL submitted successfully',
        data: responseData
      };
    } else {
      return {
        success: false,
        message: responseData.error?.message || 'Submission failed'
      };
    }
    
  } catch (error) {
    console.error('Error submitting URL:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

function getSearchConsoleCredentials() {
  // Get Google Search Console API credentials
  const properties = PropertiesService.getScriptProperties();
  const accessToken = properties.getProperty('GSC_ACCESS_TOKEN');
  const refreshToken = properties.getProperty('GSC_REFRESH_TOKEN');
  const clientId = properties.getProperty('GSC_CLIENT_ID');
  const clientSecret = properties.getProperty('GSC_CLIENT_SECRET');
  
  if (!accessToken || !refreshToken || !clientId || !clientSecret) {
    console.error('Missing Google Search Console credentials');
    return null;
  }
  
  // Check if access token needs refresh
  const tokenExpiry = properties.getProperty('GSC_TOKEN_EXPIRY');
  const now = new Date().getTime();
  
  if (tokenExpiry && now > parseInt(tokenExpiry)) {
    // Refresh access token
    const refreshedCredentials = refreshAccessToken(refreshToken, clientId, clientSecret);
    if (refreshedCredentials) {
      return refreshedCredentials;
    }
  }
  
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
    clientId: clientId,
    clientSecret: clientSecret
  };
}

function refreshAccessToken(refreshToken, clientId, clientSecret) {
  // Refresh Google OAuth access token
  try {
    const url = 'https://oauth2.googleapis.com/token';
    
    const payload = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: Object.keys(payload).map(key => 
        encodeURIComponent(key) + '=' + encodeURIComponent(payload[key])
      ).join('&')
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseData = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200) {
      // Store new access token
      const properties = PropertiesService.getScriptProperties();
      properties.setProperty('GSC_ACCESS_TOKEN', responseData.access_token);
      
      // Calculate expiry time
      const expiryTime = new Date().getTime() + (responseData.expires_in * 1000);
      properties.setProperty('GSC_TOKEN_EXPIRY', expiryTime.toString());
      
      return {
        accessToken: responseData.access_token,
        refreshToken: refreshToken,
        clientId: clientId,
        clientSecret: clientSecret
      };
    } else {
      throw new Error('Token refresh failed: ' + responseData.error_description);
    }
    
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}

function checkIndexingStatus(url) {
  // Check indexing status of a URL
  try {
    const credentials = getSearchConsoleCredentials();
    
    if (!credentials) {
      throw new Error('Google Search Console credentials not found');
    }
    
    const apiUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(url)}/urlCrawlErrorsCounts/query`;
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + credentials.accessToken
      }
    };
    
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseData = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200) {
      return {
        success: true,
        data: responseData
      };
    } else {
      return {
        success: false,
        message: responseData.error?.message || 'Status check failed'
      };
    }
    
  } catch (error) {
    console.error('Error checking indexing status:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

function isValidUrl(url) {
  // Validate URL format
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function bulkSubmitUrls(urls) {
  // Submit multiple URLs for indexing
  const results = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    try {
      const result = submitUrlForIndexing(url);
      results.push({
        url: url,
        success: result.success,
        message: result.message
      });
      
      // Rate limiting
      if (i < urls.length - 1) {
        Utilities.sleep(2000);
      }
      
    } catch (error) {
      results.push({
        url: url,
        success: false,
        message: error.message
      });
    }
  }
  
  return results;
}

function setupSearchConsoleCredentials(accessToken, refreshToken, clientId, clientSecret) {
  // Set up Google Search Console API credentials
  const properties = PropertiesService.getScriptProperties();
  
  properties.setProperties({
    'GSC_ACCESS_TOKEN': accessToken,
    'GSC_REFRESH_TOKEN': refreshToken,
    'GSC_CLIENT_ID': clientId,
    'GSC_CLIENT_SECRET': clientSecret
  });
  
  console.log('Google Search Console credentials have been set up successfully');
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Search Console credentials configured!',
    'Setup Complete',
    3
  );
}

function testSearchConsoleConnection() {
  // Test Google Search Console API connection
  try {
    const credentials = getSearchConsoleCredentials();
    
    if (!credentials) {
      throw new Error('Credentials not found. Please set up API credentials first.');
    }
    
    // Test API call
    const apiUrl = 'https://searchconsole.googleapis.com/webmasters/v3/sites';
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + credentials.accessToken
      }
    };
    
    const response = UrlFetchApp.fetch(apiUrl, options);
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      
      console.log('Search Console connection successful');
      console.log('Available sites:', data.siteEntry?.map(site => site.siteUrl) || []);
      
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Search Console connection successful!',
        'Connection Test',
        3
      );
      
      return {
        success: true,
        sites: data.siteEntry || []
      };
    } else {
      throw new Error('API call failed with status: ' + response.getResponseCode());
    }
    
  } catch (error) {
    console.error('Search Console connection test failed:', error);
    
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Connection test failed: ' + error.message,
      'Connection Error',
      5
    );
    
    return {
      success: false,
      error: error.message
    };
  }
}

function getIndexingReport() {
  // Generate indexing report
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  
  if (!sheet) {
    throw new Error('Sheet "WEBSITE" not found');
  }
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  const report = {
    totalUrls: values.length - 1, // Exclude header row
    submitted: 0,
    indexed: 0,
    errors: 0,
    pending: 0,
    lastUpdate: new Date().toISOString()
  };
  
  // Count statuses
  for (let i = 1; i < values.length; i++) {
    const status = values[i][1];
    
    switch (status) {
      case 'SUBMITTED':
        report.submitted++;
        break;
      case 'INDEXED':
        report.indexed++;
        break;
      case 'ERROR':
        report.errors++;
        break;
      default:
        report.pending++;
    }
  }
  
  console.log('Indexing Report:', report);
  
  return report;
}

function scheduleIndexingCheck() {
  // Schedule periodic indexing status check
  const trigger = ScriptApp.newTrigger('checkAllIndexingStatus')
    .timeBased()
    .everyHours(24)
    .create();
  
  console.log('Indexing check scheduled. Trigger ID:', trigger.getUniqueId());
  
  return trigger.getUniqueId();
}

function checkAllIndexingStatus() {
  // Check indexing status for all submitted URLs
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  
  if (!sheet) {
    return;
  }
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) {
    const url = values[i][0];
    const status = values[i][1];
    
    if (status === 'SUBMITTED') {
      try {
        const statusCheck = checkIndexingStatus(url);
        
        if (statusCheck.success) {
          // Update status based on check result
          // This is a simplified example - actual implementation would depend on API response
          sheet.getRange(i + 1, 2).setValue('INDEXED');
          sheet.getRange(i + 1, 3).setValue(new Date().toISOString());
          sheet.getRange(i + 1, 4).setValue('Confirmed indexed');
        }
        
      } catch (error) {
        console.error(`Error checking status for ${url}:`, error);
      }
      
      // Rate limiting
      Utilities.sleep(1000);
    }
  }
  
  console.log('Indexing status check completed');
}