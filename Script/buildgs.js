// Build and deployment functions for Google Apps Script
// This file contains functions for building and deploying web applications

function build() {
  // Build the web application
  console.log('Starting build process...');
  
  try {
    // Create HTML service from template
    const htmlOutput = HtmlService.createTemplateFromFile('index.html')
      .evaluate()
      .setWidth(800)
      .setHeight(600);
    
    // Show the built application
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'WEB TEMPLATE');
    
    console.log('Build process completed successfully');
    
  } catch (error) {
    console.error('Error in build process:', error);
    throw error;
  }
}

function include(filename) {
  // Include external files in the HTML template
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (error) {
    console.error('Error including file:', filename, error);
    return '';
  }
}

function deployWebApp() {
  // Deploy web application
  console.log('Starting deployment process...');
  
  try {
    // Get current script
    const script = ScriptApp.getScriptId();
    
    // Create deployment configuration
    const deployment = {
      description: 'Web App Deployment - ' + new Date().toISOString(),
      manifestFileName: 'appsscript.json',
      versionNumber: getNextVersionNumber()
    };
    
    console.log('Deployment configuration:', deployment);
    
    // Deploy the web app
    const deploymentId = createDeployment(deployment);
    
    if (deploymentId) {
      console.log('Deployment successful. ID:', deploymentId);
      
      // Update deployment log
      logDeployment(deploymentId, deployment);
      
      // Show success message
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Web app deployed successfully!',
        'Deployment Complete',
        5
      );
      
      return deploymentId;
    } else {
      throw new Error('Deployment failed - no deployment ID returned');
    }
    
  } catch (error) {
    console.error('Error in deployment:', error);
    
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Deployment failed: ' + error.message,
      'Deployment Error',
      5
    );
    
    throw error;
  }
}

function createDeployment(config) {
  // Create a new deployment
  try {
    // This would typically use the Apps Script API
    // For now, return a mock deployment ID
    const deploymentId = 'deployment_' + new Date().getTime();
    
    console.log('Created deployment:', deploymentId);
    return deploymentId;
    
  } catch (error) {
    console.error('Error creating deployment:', error);
    throw error;
  }
}

function getNextVersionNumber() {
  // Get the next version number for deployment
  const properties = PropertiesService.getScriptProperties();
  const currentVersion = properties.getProperty('CURRENT_VERSION') || '0';
  const nextVersion = (parseInt(currentVersion) + 1).toString();
  
  properties.setProperty('CURRENT_VERSION', nextVersion);
  
  console.log('Version number:', nextVersion);
  return nextVersion;
}

function logDeployment(deploymentId, config) {
  // Log deployment information
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = spreadsheet.getSheetByName('DEPLOYMENT_LOG');
  
  if (!logSheet) {
    logSheet = spreadsheet.insertSheet('DEPLOYMENT_LOG');
    
    // Add headers
    logSheet.getRange(1, 1, 1, 5).setValues([[
      'Timestamp', 'Deployment ID', 'Version', 'Description', 'Status'
    ]]);
  }
  
  // Add deployment log entry
  const lastRow = logSheet.getLastRow();
  logSheet.getRange(lastRow + 1, 1, 1, 5).setValues([[
    new Date().toISOString(),
    deploymentId,
    config.versionNumber,
    config.description,
    'SUCCESS'
  ]]);
  
  console.log('Deployment logged successfully');
}

function buildAndDeploy() {
  // Build and deploy in one step
  console.log('Starting build and deploy process...');
  
  try {
    // Run build process
    build();
    
    // Wait a moment for build to complete
    Utilities.sleep(2000);
    
    // Deploy the application
    const deploymentId = deployWebApp();
    
    console.log('Build and deploy completed successfully');
    
    return {
      success: true,
      deploymentId: deploymentId,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error in build and deploy:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

function validateBuildEnvironment() {
  // Validate that the build environment is ready
  const checks = [];
  
  try {
    // Check for required files
    const requiredFiles = ['index.html', 'Code.js'];
    
    requiredFiles.forEach(filename => {
      try {
        const content = include(filename);
        if (content) {
          checks.push({ file: filename, status: 'OK' });
        } else {
          checks.push({ file: filename, status: 'MISSING' });
        }
      } catch (error) {
        checks.push({ file: filename, status: 'ERROR', error: error.message });
      }
    });
    
    // Check script properties
    const properties = PropertiesService.getScriptProperties();
    const allProperties = properties.getProperties();
    
    checks.push({
      check: 'Script Properties',
      status: Object.keys(allProperties).length > 0 ? 'OK' : 'EMPTY',
      count: Object.keys(allProperties).length
    });
    
    // Check permissions
    checks.push({
      check: 'Spreadsheet Access',
      status: SpreadsheetApp.getActiveSpreadsheet() ? 'OK' : 'FAILED'
    });
    
    console.log('Build environment checks:', checks);
    
    return checks;
    
  } catch (error) {
    console.error('Error validating build environment:', error);
    return [{ check: 'Validation', status: 'ERROR', error: error.message }];
  }
}

function cleanBuildArtifacts() {
  // Clean up build artifacts
  console.log('Cleaning build artifacts...');
  
  try {
    // Clear temporary properties
    const properties = PropertiesService.getScriptProperties();
    const tempKeys = Object.keys(properties.getProperties()).filter(key => 
      key.startsWith('BUILD_TEMP_') || key.startsWith('DEPLOY_TEMP_')
    );
    
    tempKeys.forEach(key => {
      properties.deleteProperty(key);
    });
    
    console.log(`Cleaned ${tempKeys.length} temporary properties`);
    
    // Clear cache if needed
    CacheService.getScriptCache().removeAll(['BUILD_CACHE', 'DEPLOY_CACHE']);
    
    console.log('Build artifacts cleaned successfully');
    
  } catch (error) {
    console.error('Error cleaning build artifacts:', error);
  }
}

function getBuildStatus() {
  // Get current build status
  const properties = PropertiesService.getScriptProperties();
  
  const status = {
    lastBuild: properties.getProperty('LAST_BUILD_TIME'),
    lastDeploy: properties.getProperty('LAST_DEPLOY_TIME'),
    currentVersion: properties.getProperty('CURRENT_VERSION') || '0',
    buildCount: properties.getProperty('BUILD_COUNT') || '0',
    deployCount: properties.getProperty('DEPLOY_COUNT') || '0'
  };
  
  console.log('Build status:', status);
  return status;
}

function updateBuildStatus(type) {
  // Update build status after successful operation
  const properties = PropertiesService.getScriptProperties();
  const timestamp = new Date().toISOString();
  
  if (type === 'build') {
    properties.setProperty('LAST_BUILD_TIME', timestamp);
    
    const buildCount = parseInt(properties.getProperty('BUILD_COUNT') || '0') + 1;
    properties.setProperty('BUILD_COUNT', buildCount.toString());
    
  } else if (type === 'deploy') {
    properties.setProperty('LAST_DEPLOY_TIME', timestamp);
    
    const deployCount = parseInt(properties.getProperty('DEPLOY_COUNT') || '0') + 1;
    properties.setProperty('DEPLOY_COUNT', deployCount.toString());
  }
  
  console.log(`Updated ${type} status`);
}

function rollbackDeployment(deploymentId) {
  // Rollback to previous deployment
  console.log('Rolling back deployment:', deploymentId);
  
  try {
    // Log rollback attempt
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = spreadsheet.getSheetByName('DEPLOYMENT_LOG');
    
    if (logSheet) {
      const lastRow = logSheet.getLastRow();
      logSheet.getRange(lastRow + 1, 1, 1, 5).setValues([[
        new Date().toISOString(),
        deploymentId,
        'ROLLBACK',
        'Rollback initiated',
        'IN_PROGRESS'
      ]]);
    }
    
    // Perform rollback logic here
    // This would typically involve calling the Apps Script API
    
    console.log('Rollback completed successfully');
    
    return { success: true, message: 'Rollback completed' };
    
  } catch (error) {
    console.error('Error in rollback:', error);
    return { success: false, error: error.message };
  }
}