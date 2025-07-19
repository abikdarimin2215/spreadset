// Data analysis functions for Google Apps Script
// This file contains functions for analyzing spreadsheet data

function checkForBlanksAndColor() {
  // Check for blank cells and color them for visibility
  const errors = [];
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('WEBSITE');
  const lastRow = sheet.getLastRow();
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Analyzing data...', 
    'Progress Total ' + lastRow, 
    3
  );
  
  for (let i = 1; i <= lastRow; i++) {
    const range = sheet.getRange(i, 1, 1, 10);
    const values = range.getValues();
    
    for (let j = 0; j < values[0].length; j++) {
      // Check for blank cells
      if (values[0][j] === '') {
        errors.push(j);
        sheet.getRange(i, j + 1).setBackgroundColor('#FF0000');
        
        SpreadsheetApp.getActiveSpreadsheet().toast(
          `Error No ${i} blank. Please fix (column ${j + 1} is empty)`,
          'Progress Total ' + lastRow,
          5
        );
      }
      
      // Check for date formatting in specific column
      if (j === 2) {
        const cellValue = values[0][j];
        let formattedDate;
        
        if (cellValue instanceof Date) {
          formattedDate = cellValue;
        } else if (typeof cellValue === 'string') {
          const parts = cellValue.split(',').map(part => part.trim());
          
          if (parts.length === 4) {
            const [day, month, year, time] = parts;
            const months = [
              'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];
            
            const monthIndex = months.indexOf(month);
            if (monthIndex !== -1) {
              formattedDate = new Date(year, monthIndex, day, ...time.split(':'));
            }
          }
        }
        
        if (formattedDate && !isNaN(formattedDate.getTime())) {
          const formatString = Utilities.formatDate(
            formattedDate, 
            Session.getScriptTimeZone(), 
            'yyyy-MM-dd HH:mm:ss'
          );
          
          if (sheet.getRange(i, j + 1).getDisplayValue() !== formatString) {
            sheet.getRange(i, j + 1).setNumberFormat('yyyy-MM-dd HH:mm:ss');
            sheet.getRange(i, j + 1).setValue(formattedDate);
            
            SpreadsheetApp.getActiveSpreadsheet().toast(
              `Updated date format for row ${i}`,
              'Progress Total ' + lastRow,
              3
            );
          }
        }
      }
    }
  }
  
  Logger.log(errors[0]);
  
  if (errors[0] == null) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Analysis complete. No errors found.',
      'Progress Total ' + lastRow,
      3
    );
    Logger.log(errors[0]);
  }
}

function analyzeDataQuality() {
  // Analyze overall data quality
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  const stats = {
    totalRows: values.length,
    totalCells: 0,
    emptyCells: 0,
    filledCells: 0,
    duplicateRows: 0,
    dataTypes: {}
  };
  
  // Analyze each cell
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values[i].length; j++) {
      stats.totalCells++;
      const cell = values[i][j];
      
      if (cell === '' || cell === null || cell === undefined) {
        stats.emptyCells++;
      } else {
        stats.filledCells++;
        
        // Track data types
        const type = typeof cell;
        stats.dataTypes[type] = (stats.dataTypes[type] || 0) + 1;
      }
    }
  }
  
  // Check for duplicate rows
  const rowHashes = new Set();
  for (let i = 0; i < values.length; i++) {
    const rowHash = JSON.stringify(values[i]);
    if (rowHashes.has(rowHash)) {
      stats.duplicateRows++;
    } else {
      rowHashes.add(rowHash);
    }
  }
  
  // Calculate percentages
  stats.emptyPercentage = (stats.emptyCells / stats.totalCells * 100).toFixed(2);
  stats.filledPercentage = (stats.filledCells / stats.totalCells * 100).toFixed(2);
  
  // Log results
  console.log('Data Quality Analysis Results:');
  console.log('Total Rows:', stats.totalRows);
  console.log('Total Cells:', stats.totalCells);
  console.log('Empty Cells:', stats.emptyCells, '(' + stats.emptyPercentage + '%)');
  console.log('Filled Cells:', stats.filledCells, '(' + stats.filledPercentage + '%)');
  console.log('Duplicate Rows:', stats.duplicateRows);
  console.log('Data Types:', stats.dataTypes);
  
  return stats;
}

function validateDataIntegrity() {
  // Validate data integrity across the spreadsheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  const issues = [];
  
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values[i].length; j++) {
      const cell = values[i][j];
      
      // Check for common data issues
      if (typeof cell === 'string') {
        // Check for extra whitespace
        if (cell !== cell.trim()) {
          issues.push({
            row: i + 1,
            col: j + 1,
            issue: 'Extra whitespace',
            value: cell
          });
        }
        
        // Check for suspicious characters
        if (cell.includes('  ') || cell.includes('\t') || cell.includes('\n')) {
          issues.push({
            row: i + 1,
            col: j + 1,
            issue: 'Suspicious characters',
            value: cell
          });
        }
      }
      
      // Check for potential encoding issues
      if (typeof cell === 'string' && cell.includes('�')) {
        issues.push({
          row: i + 1,
          col: j + 1,
          issue: 'Potential encoding issue',
          value: cell
        });
      }
    }
  }
  
  // Report issues
  if (issues.length > 0) {
    console.log('Data Integrity Issues Found:');
    issues.forEach(issue => {
      console.log(`Row ${issue.row}, Col ${issue.col}: ${issue.issue} - "${issue.value}"`);
    });
  } else {
    console.log('No data integrity issues found.');
  }
  
  return issues;
}

function cleanDataFormat() {
  // Clean and format data consistently
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  let changesCount = 0;
  
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values[i].length; j++) {
      const cell = values[i][j];
      
      if (typeof cell === 'string') {
        let cleanedCell = cell.trim();
        
        // Remove extra spaces
        cleanedCell = cleanedCell.replace(/\s+/g, ' ');
        
        // Clean up line breaks
        cleanedCell = cleanedCell.replace(/\r\n|\r|\n/g, ' ');
        
        if (cleanedCell !== cell) {
          values[i][j] = cleanedCell;
          changesCount++;
        }
      }
    }
  }
  
  // Update the sheet if changes were made
  if (changesCount > 0) {
    range.setValues(values);
    console.log(`Cleaned ${changesCount} cells.`);
    
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Data cleaning complete. ${changesCount} cells cleaned.`,
      'Data Cleaning',
      3
    );
  } else {
    console.log('No cleaning needed.');
  }
  
  return changesCount;
}

function generateDataReport() {
  // Generate comprehensive data report
  const qualityStats = analyzeDataQuality();
  const integrityIssues = validateDataIntegrity();
  const cleaningCount = cleanDataFormat();
  
  const report = {
    timestamp: new Date().toISOString(),
    quality: qualityStats,
    integrity: {
      issuesFound: integrityIssues.length,
      issues: integrityIssues
    },
    cleaning: {
      cellsCleaned: cleaningCount
    }
  };
  
  console.log('Data Analysis Report:', JSON.stringify(report, null, 2));
  
  return report;
}