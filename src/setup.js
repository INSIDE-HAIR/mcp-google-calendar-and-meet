#!/usr/bin/env node

/**
 * Google Meet MCP Setup Script
 *
 * This script helps to obtain the initial OAuth2 token
 * to authenticate with Google Calendar API.
 */

import fs from "fs/promises";
import { google } from "googleapis";
import open from "open";
import path from "path";
import readline from "readline";

// Scopes required for Google Meet functionality via Calendar API and Meet API v2beta
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/meetings.space.readonly",
  "https://www.googleapis.com/auth/meetings.space.settings",
];

// Promisify readline question
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
  try {
    // Support both configuration methods
    let credentialsPath, tokenPath;

    if (process.env.G_OAUTH_CREDENTIALS) {
      // Simplified configuration (single variable)
      credentialsPath = process.env.G_OAUTH_CREDENTIALS;
      tokenPath = credentialsPath.replace(/\.json$/, ".token.json");
    } else if (
      process.env.GOOGLE_MEET_CREDENTIALS_PATH &&
      process.env.GOOGLE_MEET_TOKEN_PATH
    ) {
      // Local development configuration (two variables)
      credentialsPath = process.env.GOOGLE_MEET_CREDENTIALS_PATH;
      tokenPath = process.env.GOOGLE_MEET_TOKEN_PATH;
    } else {
      // Use defaults
      credentialsPath = path.join(process.cwd(), "credentials.json");
      tokenPath = path.join(process.cwd(), "token.json");
    }

    console.log(`Using credentials file: ${credentialsPath}`);
    console.log(`Token will be saved to: ${tokenPath}`);

    // Check if the credentials file exists
    try {
      await fs.access(credentialsPath);
    } catch (error) {
      console.error(`Error: Credentials file not found at ${credentialsPath}`);
      console.error(
        "Please download OAuth 2.0 Client ID credentials from Google Cloud Console"
      );
      console.error("and save them to this path.");
      process.exit(1);
    }

    // Load client secrets from the credentials file
    const content = await fs.readFile(credentialsPath, "utf8");
    const credentials = JSON.parse(content);

    // Create an OAuth2 client with the given credentials
    // Handle both 'web' and 'installed' credential types
    const credentialData = credentials.web || credentials.installed;
    if (!credentialData) {
      throw new Error(
        'Invalid credentials file format. Expected "web" or "installed" key.'
      );
    }
    const { client_id, client_secret, redirect_uris } = credentialData;

    // Use the first registered redirect URI from credentials
    const redirectUri = redirect_uris[0] || "http://localhost:3000";
    console.log(`Using redirect URI: ${redirectUri}`);

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirectUri
    );

    // Generate the auth URL
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent", // Force to get refresh token
      redirect_uri: redirectUri,
    });

    console.log("\n========== Google Calendar API Authentication ==========");
    console.log("1. You will be redirected to Google's authorization page.");
    console.log("2. Log in and grant the requested permissions.");
    console.log(
      "3. After authorizing, you'll be redirected to a page that may show an error."
    );
    console.log(
      "4. Copy the authorization code from the URL in your browser's address bar."
    );
    console.log('   (The code appears after "code=" in the URL)');
    console.log("5. Return to this terminal and paste the code when prompted.");
    console.log("=======================================================\n");

    console.log("Opening browser for authentication...");
    await open(authUrl);

    // Wait for user input
    const authCode = await question(
      "\nEnter the authorization code from the URL: "
    );

    if (!authCode || authCode.trim() === "") {
      console.error("Error: No authorization code provided.");
      rl.close();
      process.exit(1);
    }

    console.log("\nExchanging authorization code for tokens...");

    try {
      // Exchange authorization code for tokens
      const { tokens } = await oAuth2Client.getToken(authCode.trim());

      // Save the token to disk
      await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));
      console.log(`\nToken saved to ${tokenPath}`);
      console.log(
        "Setup complete! You can now use the Google Meet MCP server."
      );
    } catch (error) {
      console.error("\nError getting tokens:", error.message);
      if (error.response && error.response.data) {
        console.error("Error details:", error.response.data);
      }
      process.exit(1);
    }

    console.log("✅ Setup completed successfully!");
  } catch (error) {
    console.error("\nError during setup:", error);
    process.exit(1);
  }
}

// Run the main function
main();
