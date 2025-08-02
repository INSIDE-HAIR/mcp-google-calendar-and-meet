#!/usr/bin/env node

import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create detailed log file with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = createWriteStream(join(__dirname, `mcp-debug-${timestamp}.log`), { flags: 'w' });

function log(type, message) {
  const logMessage = `[${new Date().toISOString()}] [${type}] ${message}\n`;
  process.stdout.write(logMessage);
  logFile.write(logMessage);
}

// Set up environment with credentials and debugging
const env = {
  ...process.env,
  G_OAUTH_CREDENTIALS: "/Users/luiseurdanetamartucci/Library/Application Support/Claude/client_secret_714590299658-vsd850n04068bqttqbqp8h7gqq4bq3eh.apps.googleusercontent.com.json",
  MCP_DEBUG: "true",
  NODE_ENV: "development"
};

log('INIT', 'Starting Google Meet MCP Server in debug mode...');
log('ENV', `Using credentials: ${env.G_OAUTH_CREDENTIALS}`);

// Start the server
const serverProcess = spawn('node', [join(__dirname, 'dist/index.js')], {
  env,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Log startup
serverProcess.stdout.on('data', (data) => {
  const messages = data.toString().split('\n').filter(line => line.trim());
  messages.forEach(msg => {
    if (msg.trim()) {
      try {
        // Try to parse as JSON (MCP messages)
        const parsed = JSON.parse(msg);
        log('MCP-OUT', `${parsed.method || parsed.result ? 'MSG' : 'UNK'}: ${JSON.stringify(parsed, null, 2)}`);
      } catch {
        // Not JSON, regular output
        log('STDOUT', msg);
      }
    }
  });
});

serverProcess.stderr.on('data', (data) => {
  const messages = data.toString().split('\n').filter(line => line.trim());
  messages.forEach(msg => {
    if (msg.trim()) {
      log('STDERR', msg);
    }
  });
});

serverProcess.stdin.on('data', (data) => {
  const messages = data.toString().split('\n').filter(line => line.trim());
  messages.forEach(msg => {
    if (msg.trim()) {
      try {
        const parsed = JSON.parse(msg);
        log('MCP-IN', `${parsed.method || 'RESP'}: ${JSON.stringify(parsed, null, 2)}`);
      } catch {
        log('STDIN', msg);
      }
    }
  });
});

serverProcess.on('error', (error) => {
  log('ERROR', `Process error: ${error.message}`);
});

serverProcess.on('exit', (code, signal) => {
  log('EXIT', `Process exited with code ${code} and signal ${signal}`);
  logFile.end();
});

// Handle MCP communication
process.stdin.on('data', (data) => {
  const input = data.toString();
  log('INPUT', `Received: ${input.trim()}`);
  serverProcess.stdin.write(data);
});

process.stdout.on('data', (data) => {
  process.stdout.write(data);
});

// Handle cleanup
process.on('SIGINT', () => {
  log('CLEANUP', 'Shutting down debug session...');
  serverProcess.kill();
  logFile.end();
  process.exit();
});

process.on('SIGTERM', () => {
  log('CLEANUP', 'Terminated');
  serverProcess.kill();
  logFile.end();
  process.exit();
});

log('READY', 'Debug session ready. Waiting for Claude Desktop connection...');