#!/usr/bin/env node
/**
 * Docker Health Check Script for Google Meet MCP Server v3.0
 * Validates server health, API connectivity, and authentication status
 */

import GoogleMeetAPI from '../src/GoogleMeetAPI.js';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const HEALTH_CHECK_CONFIG = {
  timeout: 8000,  // 8 seconds timeout
  maxRetries: 2,
  checkAuth: true,
  checkAPIs: true,
  verboseLogging: process.env.NODE_ENV === 'development'
};

// Health check results
class HealthCheckResult {
  constructor() {
    this.status = 'healthy';
    this.timestamp = new Date().toISOString();
    this.checks = {};
    this.errors = [];
  }

  addCheck(name, status, details = {}) {
    this.checks[name] = { status, ...details };
    if (status === 'unhealthy') {
      this.status = 'unhealthy';
    } else if (status === 'degraded' && this.status === 'healthy') {
      this.status = 'degraded';
    }
  }

  addError(error) {
    this.errors.push(error);
    this.status = 'unhealthy';
  }

  toJSON() {
    return {
      status: this.status,
      timestamp: this.timestamp,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || 'unknown',
      checks: this.checks,
      errors: this.errors
    };
  }
}

// Utility functions
function log(message, level = 'info') {
  if (HEALTH_CHECK_CONFIG.verboseLogging || level === 'error') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [HEALTH] [${level.toUpperCase()}] ${message}`);
  }
}

async function checkFileExists(filePath, description) {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    log(`✓ ${description} exists: ${filePath}`);
    return true;
  } catch (error) {
    log(`✗ ${description} not found: ${filePath}`, 'error');
    return false;
  }
}

// Health check functions
async function checkSystemHealth() {
  const result = new HealthCheckResult();
  
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    result.addCheck('node_version', 'healthy', { version: nodeVersion });
    log(`Node.js version: ${nodeVersion}`);

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memThreshold = 512 * 1024 * 1024; // 512MB
    const memStatus = memUsage.heapUsed > memThreshold ? 'degraded' : 'healthy';
    
    result.addCheck('memory', memStatus, {
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      external_mb: Math.round(memUsage.external / 1024 / 1024)
    });

    // Check uptime
    const uptime = process.uptime();
    result.addCheck('uptime', 'healthy', { uptime_seconds: uptime });
    log(`System uptime: ${uptime} seconds`);

  } catch (error) {
    result.addError(`System health check failed: ${error.message}`);
    log(`System health check error: ${error.message}`, 'error');
  }

  return result;
}

async function checkFileSystem() {
  const result = new HealthCheckResult();
  
  try {
    // Check for credentials
    const credentialsPath = process.env.G_OAUTH_CREDENTIALS || 
                           process.env.GOOGLE_MEET_CREDENTIALS_PATH || 
                           '/app/credentials.json';
    
    const hasCredentials = await checkFileExists(credentialsPath, 'Credentials file');
    result.addCheck('credentials_file', hasCredentials ? 'healthy' : 'unhealthy', {
      path: credentialsPath,
      exists: hasCredentials
    });

    // Check for token file (optional)
    const tokenPath = process.env.GOOGLE_MEET_TOKEN_PATH || '/app/token.json';
    const hasToken = await checkFileExists(tokenPath, 'Token file');
    result.addCheck('token_file', 'healthy', {
      path: tokenPath,
      exists: hasToken,
      note: hasToken ? 'Token file found' : 'Token file will be created on first auth'
    });

    // Check log directory
    const logDir = '/app/logs';
    try {
      await fs.access(logDir, fs.constants.F_OK);
      result.addCheck('log_directory', 'healthy', { path: logDir });
      log(`✓ Log directory accessible: ${logDir}`);
    } catch (error) {
      result.addCheck('log_directory', 'degraded', { 
        path: logDir, 
        error: 'Directory not accessible but not critical' 
      });
      log(`⚠ Log directory not accessible: ${logDir}`);
    }

  } catch (error) {
    result.addError(`File system check failed: ${error.message}`);
    log(`File system check error: ${error.message}`, 'error');
  }

  return result;
}

async function checkAuthentication() {
  const result = new HealthCheckResult();
  
  if (!HEALTH_CHECK_CONFIG.checkAuth) {
    result.addCheck('authentication', 'skipped', { reason: 'Disabled in config' });
    return result;
  }

  try {
    const credentialsPath = process.env.G_OAUTH_CREDENTIALS || 
                           process.env.GOOGLE_MEET_CREDENTIALS_PATH || 
                           '/app/credentials.json';
    const tokenPath = process.env.GOOGLE_MEET_TOKEN_PATH || '/app/token.json';

    // Initialize GoogleMeetAPI
    const api = new GoogleMeetAPI(credentialsPath, tokenPath);
    
    // Try to initialize (this will check credentials)
    await Promise.race([
      api.initialize(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Authentication timeout')), 5000)
      )
    ]);

    result.addCheck('authentication', 'healthy', {
      credentials_loaded: true,
      auth_initialized: true
    });
    log('✓ Authentication successful');

  } catch (error) {
    const isTokenMissing = error.message.includes('ENOENT') && error.message.includes('token');
    const status = isTokenMissing ? 'degraded' : 'unhealthy';
    
    result.addCheck('authentication', status, {
      error: error.message,
      note: isTokenMissing ? 'Token file missing - will be created on first use' : 'Authentication failed'
    });
    
    if (status === 'unhealthy') {
      log(`✗ Authentication failed: ${error.message}`, 'error');
    } else {
      log(`⚠ Authentication degraded: ${error.message}`);
    }
  }

  return result;
}

async function checkGoogleAPIs() {
  const result = new HealthCheckResult();
  
  if (!HEALTH_CHECK_CONFIG.checkAPIs) {
    result.addCheck('google_apis', 'skipped', { reason: 'Disabled in config' });
    return result;
  }

  try {
    const credentialsPath = process.env.G_OAUTH_CREDENTIALS || 
                           process.env.GOOGLE_MEET_CREDENTIALS_PATH || 
                           '/app/credentials.json';
    const tokenPath = process.env.GOOGLE_MEET_TOKEN_PATH || '/app/token.json';

    const api = new GoogleMeetAPI(credentialsPath, tokenPath);
    
    // Initialize API
    await api.initialize();

    // Test Calendar API (lightweight call)
    try {
      await Promise.race([
        api.listCalendars(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Calendar API timeout')), 3000)
        )
      ]);
      
      result.addCheck('calendar_api', 'healthy', { 
        endpoint: 'calendars/list',
        response_time_ms: '<3000'
      });
      log('✓ Calendar API accessible');
    } catch (error) {
      result.addCheck('calendar_api', 'unhealthy', { 
        error: error.message,
        endpoint: 'calendars/list'
      });
      log(`✗ Calendar API failed: ${error.message}`, 'error');
    }

    // Test Meet API (simple space creation test - commented out to avoid side effects)
    result.addCheck('meet_api', 'healthy', { 
      status: 'API client initialized',
      note: 'Full test skipped to avoid creating test spaces'
    });
    log('✓ Meet API client initialized');

  } catch (error) {
    result.addCheck('google_apis', 'unhealthy', { 
      error: error.message,
      note: 'Could not initialize API client'
    });
    log(`✗ Google APIs check failed: ${error.message}`, 'error');
  }

  return result;
}

// Main health check function
async function performHealthCheck() {
  log('Starting Docker health check...');
  const startTime = Date.now();
  
  try {
    // Run all health checks concurrently
    const [systemHealth, fileSystemHealth, authHealth, apiHealth] = await Promise.all([
      checkSystemHealth(),
      checkFileSystem(),
      checkAuthentication(),
      checkGoogleAPIs()
    ]);

    // Combine results
    const combinedResult = new HealthCheckResult();
    
    // Merge all checks
    Object.assign(combinedResult.checks, 
      systemHealth.checks, 
      fileSystemHealth.checks, 
      authHealth.checks, 
      apiHealth.checks
    );
    
    // Merge errors
    combinedResult.errors = [
      ...systemHealth.errors,
      ...fileSystemHealth.errors,
      ...authHealth.errors,
      ...apiHealth.errors
    ];

    // Determine overall status
    const allStatuses = [systemHealth.status, fileSystemHealth.status, authHealth.status, apiHealth.status];
    if (allStatuses.includes('unhealthy')) {
      combinedResult.status = 'unhealthy';
    } else if (allStatuses.includes('degraded')) {
      combinedResult.status = 'degraded';
    } else {
      combinedResult.status = 'healthy';
    }

    // Add execution time
    combinedResult.checks.health_check_duration = {
      status: 'healthy',
      duration_ms: Date.now() - startTime
    };

    // Output results
    if (HEALTH_CHECK_CONFIG.verboseLogging) {
      console.log('\n' + JSON.stringify(combinedResult.toJSON(), null, 2));
    }

    // Log final status
    const statusEmoji = {
      healthy: '✅',
      degraded: '⚠️',
      unhealthy: '❌'
    };
    
    log(`${statusEmoji[combinedResult.status]} Health check completed: ${combinedResult.status.toUpperCase()}`);
    
    // Exit with appropriate code
    if (combinedResult.status === 'unhealthy') {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (error) {
    log(`Health check failed with unexpected error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Handle timeout
setTimeout(() => {
  log('Health check timed out', 'error');
  process.exit(1);
}, HEALTH_CHECK_CONFIG.timeout);

// Handle process signals
process.on('SIGTERM', () => {
  log('Health check terminated by SIGTERM');
  process.exit(1);
});

process.on('SIGINT', () => {
  log('Health check interrupted by SIGINT');
  process.exit(1);
});

// Run health check
if (import.meta.url === `file://${process.argv[1]}`) {
  performHealthCheck().catch(error => {
    log(`Unhandled error in health check: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  });
}