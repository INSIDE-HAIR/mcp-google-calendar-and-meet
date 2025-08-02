#!/usr/bin/env node

import { exec } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🔍 Google Meet MCP Server Monitor');
console.log('================================');
console.log('');

// Function to get the latest log file
function getLatestLogFile() {
  try {
    const result = exec('ls -t mcp-debug-*.log 2>/dev/null | head -1', { cwd: __dirname }, (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log('⏳ Waiting for debug log file...');
        return;
      }
      
      const logFile = join(__dirname, stdout.trim());
      console.log(`📁 Monitoring: ${logFile}`);
      console.log('');
      
      // Start tailing the log file
      const tail = exec(`tail -f "${logFile}"`, (error) => {
        if (error) {
          console.error('❌ Error tailing log file:', error.message);
        }
      });
      
      tail.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
      
      tail.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  } catch (error) {
    console.error('❌ Error finding log files:', error.message);
  }
}

// Instructions
console.log('📋 Instructions:');
console.log('1. Make sure Claude Desktop is closed');
console.log('2. Start Claude Desktop');
console.log('3. Try using a Google Meet tool');
console.log('4. Watch the logs below for debugging info');
console.log('');
console.log('🚀 Starting monitor...');
console.log('');

// Start monitoring
setTimeout(getLatestLogFile, 1000);

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n👋 Monitor stopped');
  process.exit();
});