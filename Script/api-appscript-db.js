// API and Database handling for Google Apps Script
// This file handles API calls and database operations

function doPost(request) {
  // Handle POST requests to the web app
  try {
    const parameter = request.parameter;
    const action = parameter.action;
    
    // Route to appropriate handler based on action
    switch (action) {
      case 'insert':
        return handleInsert(parameter);
      case 'update':
        return handleUpdate(parameter);
      case 'delete':
        return handleDelete(parameter);
      case 'select':
        return handleSelect(parameter);
      default:
        return createResponse('error', 'Unknown action: ' + action);
    }
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse('error', error.message);
  }
}

function handleInsert(params) {
  // Handle data insertion
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(params.sheetName || 'Sheet1');
    
    if (!sheet) {
      throw new Error('Sheet not found: ' + params.sheetName);
    }
    
    // Get data to insert
    const data = [
      params.data1 || '',
      params.data2 || '',
      params.data3 || '',
      params.data4 || '',
      params.data5 || '',
      params.data6 || '',
      params.data7 || '',
      params.data8 || '',
      new Date().toISOString()
    ];
    
    // Insert data
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    
    sheet.getRange(newRow, 1, 1, data.length).setValues([data]);
    
    return createResponse('success', 'Data inserted successfully');
    
  } catch (error) {
    console.error('Error in handleInsert:', error);
    return createResponse('error', error.message);
  }
}

function handleUpdate(params) {
  // Handle data update
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(params.sheetName || 'Sheet1');
    
    if (!sheet) {
      throw new Error('Sheet not found: ' + params.sheetName);
    }
    
    const rowIndex = parseInt(params.rowIndex);
    if (isNaN(rowIndex) || rowIndex < 1) {
      throw new Error('Invalid row index: ' + params.rowIndex);
    }
    
    // Update specific cells
    if (params.data1) sheet.getRange(rowIndex, 1).setValue(params.data1);
    if (params.data2) sheet.getRange(rowIndex, 2).setValue(params.data2);
    if (params.data3) sheet.getRange(rowIndex, 3).setValue(params.data3);
    if (params.data4) sheet.getRange(rowIndex, 4).setValue(params.data4);
    if (params.data5) sheet.getRange(rowIndex, 5).setValue(params.data5);
    if (params.data6) sheet.getRange(rowIndex, 6).setValue(params.data6);
    if (params.data7) sheet.getRange(rowIndex, 7).setValue(params.data7);
    if (params.data8) sheet.getRange(rowIndex, 8).setValue(params.data8);
    
    // Update timestamp
    sheet.getRange(rowIndex, 9).setValue(new Date().toISOString());
    
    return createResponse('success', 'Data updated successfully');
    
  } catch (error) {
    console.error('Error in handleUpdate:', error);
    return createResponse('error', error.message);
  }
}

function handleSelect(params) {
  // Handle data selection/retrieval
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(params.sheetName || 'Sheet1');
    
    if (!sheet) {
      throw new Error('Sheet not found: ' + params.sheetName);
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // Filter data if needed
    let filteredData = values;
    
    if (params.filter) {
      filteredData = values.filter(row => {
        return row.some(cell => 
          cell && cell.toString().toLowerCase().includes(params.filter.toLowerCase())
        );
      });
    }
    
    return createResponse('success', 'Data retrieved successfully', filteredData);
    
  } catch (error) {
    console.error('Error in handleSelect:', error);
    return createResponse('error', error.message);
  }
}

function handleDelete(params) {
  // Handle data deletion
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(params.sheetName || 'Sheet1');
    
    if (!sheet) {
      throw new Error('Sheet not found: ' + params.sheetName);
    }
    
    const rowIndex = parseInt(params.rowIndex);
    if (isNaN(rowIndex) || rowIndex < 1) {
      throw new Error('Invalid row index: ' + params.rowIndex);
    }
    
    // Delete the row
    sheet.deleteRow(rowIndex);
    
    return createResponse('success', 'Data deleted successfully');
    
  } catch (error) {
    console.error('Error in handleDelete:', error);
    return createResponse('error', error.message);
  }
}

function createResponse(status, message, data = null) {
  // Create standardized response object
  const response = {
    status: status,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function testApi() {
  // Test function for API endpoints
  console.log('Testing API endpoints...');
  
  try {
    // Test insert
    const insertParams = {
      action: 'insert',
      sheetName: 'Sheet1',
      data1: 'Test Data 1',
      data2: 'Test Data 2',
      data3: 'Test Data 3'
    };
    
    const insertResult = handleInsert(insertParams);
    console.log('Insert test result:', insertResult);
    
    // Test select
    const selectParams = {
      action: 'select',
      sheetName: 'Sheet1'
    };
    
    const selectResult = handleSelect(selectParams);
    console.log('Select test result:', selectResult);
    
  } catch (error) {
    console.error('Error in testApi:', error);
  }
}

function validateInput(params, requiredFields) {
  // Validate input parameters
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!params[field] || params[field].toString().trim() === '') {
      errors.push(`Required field missing: ${field}`);
    }
  });
  
  return errors;
}

function sanitizeInput(input) {
  // Sanitize input to prevent injection attacks
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
}