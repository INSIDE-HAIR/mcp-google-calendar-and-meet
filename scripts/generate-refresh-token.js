#!/usr/bin/env node

/**
 * Generate Refresh Token Script
 * 
 * This script helps users generate a refresh token for direct authentication.
 * Equivalent to the working Smithery calendar server approach.
 */

import { google } from 'googleapis';
import open from 'open';
import readline from 'readline';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/meetings.space.settings',
];

function question(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🔑 Google Meet MCP Server - Refresh Token Generator');
  console.log('==================================================\n');

  // Get credentials from environment or prompt
  let CLIENT_ID = process.env.CLIENT_ID;
  let CLIENT_SECRET = process.env.CLIENT_SECRET;

  if (!CLIENT_ID) {
    CLIENT_ID = await question('Enter your CLIENT_ID: ');
  }

  if (!CLIENT_SECRET) {
    CLIENT_SECRET = await question('Enter your CLIENT_SECRET: ');
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ CLIENT_ID and CLIENT_SECRET are required');
    process.exit(1);
  }

  console.log('\n✅ Using credentials:');
  console.log(`   CLIENT_ID: ${CLIENT_ID.substring(0, 20)}...`);
  console.log(`   CLIENT_SECRET: ${CLIENT_SECRET.substring(0, 10)}...\n`);

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'http://localhost:3000'  // Standard redirect URI for desktop apps
  );

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Forces refresh token generation
  });

  console.log('🌐 Opening browser for authorization...');
  console.log('   If browser doesn\'t open, visit this URL manually:');
  console.log(`   ${authUrl}\n`);

  await open(authUrl);

  console.log('📋 After authorizing:');
  console.log('   1. You\'ll be redirected to a page that may show an error');
  console.log('   2. Copy the authorization code from the URL');
  console.log('   3. The code appears after "code=" in the URL\n');

  const authCode = await question('Enter the authorization code: ');

  if (!authCode || authCode.trim() === '') {
    console.error('❌ Authorization code is required');
    process.exit(1);
  }

  try {
    console.log('\n🔄 Exchanging code for tokens...');

    const { tokens } = await oauth2Client.getToken(authCode.trim());

    if (!tokens.refresh_token) {
      console.error('❌ No refresh token received. Make sure to:');
      console.error('   - Use prompt=consent in auth URL');
      console.error('   - Revoke existing authorizations in Google account settings');
      process.exit(1);
    }

    console.log('\n✅ SUCCESS! Your credentials for Smithery:');
    console.log('==========================================');
    console.log(`CLIENT_ID: "${CLIENT_ID}"`);
    console.log(`CLIENT_SECRET: "${CLIENT_SECRET}"`);
    console.log(`REFRESH_TOKEN: "${tokens.refresh_token}"`);
    console.log('==========================================\n');

    console.log('📋 Copy these values to your Smithery configuration:');
    console.log(`
CLIENT_ID: "${CLIENT_ID}"
CLIENT_SECRET: "${CLIENT_SECRET}"
REFRESH_TOKEN: "${tokens.refresh_token}"
customLogLevel: "info"
enableDebugLogging: false
`);

    console.log('🔒 Security reminders:');
    console.log('   - Keep these tokens secure and private');
    console.log('   - Never commit them to version control');
    console.log('   - Store them only in your Smithery config');

  } catch (error) {
    console.error('\n❌ Error getting tokens:', error.message);
    if (error.response && error.response.data) {
      console.error('   Details:', error.response.data);
    }
    process.exit(1);
  }
}

main().catch(console.error);