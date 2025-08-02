#!/usr/bin/env node

import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create log file
const logFile = createWriteStream(join(__dirname, 'mcp-debug.log'), { flags: 'a' });

// Set up environment with credentials
const env = {
  ...process.env,
  G_OAUTH_CREDENTIALS: process.env.G_OAUTH_CREDENTIALS || "/Users/luiseurdanetamartucci/Library/Application Support/Claude/client_secret_714590299658-vsd850n04068bqttqbqp8h7gqq4bq3eh.apps.googleusercontent.com.json"
};

// Start the server
const serverProcess = spawn('node', [join(__dirname, 'dist/index.js')], {
  env,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Log all output
serverProcess.stdout.on('data', (data) => {
  const message = `[STDOUT] ${new Date().toISOString()}: ${data}`;
  console.log(message);
  logFile.write(message);
});

serverProcess.stderr.on('data', (data) => {
  const message = `[STDERR] ${new Date().toISOString()}: ${data}`;
  console.error(message);
  logFile.write(message);
});

serverProcess.on('error', (error) => {
  const message = `[ERROR] ${new Date().toISOString()}: ${error.message}\n`;
  console.error(message);
  logFile.write(message);
});

serverProcess.on('exit', (code, signal) => {
  const message = `[EXIT] ${new Date().toISOString()}: Process exited with code ${code} and signal ${signal}\n`;
  console.log(message);
  logFile.write(message);
  logFile.end();
});

// Pass stdin to server
process.stdin.pipe(serverProcess.stdin);
serverProcess.stdout.pipe(process.stdout);

// Handle cleanup
process.on('SIGINT', () => {
  serverProcess.kill();
  process.exit();
});