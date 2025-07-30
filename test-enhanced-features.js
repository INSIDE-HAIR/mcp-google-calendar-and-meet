#!/usr/bin/env node

/**
 * Test script for enhanced Google Meet MCP Server features
 * Tests the new v2beta API integration and advanced meeting configuration
 */

import GoogleMeetAPI from './src/GoogleMeetAPI.js';
import process from 'process';

class EnhancedFeaturesTester {
  constructor() {
    // Use environment variables or defaults
    const credentialsPath = process.env.GOOGLE_OAUTH_CREDENTIALS || process.env.GOOGLE_MEET_CREDENTIALS_PATH;
    const tokenPath = process.env.GOOGLE_OAUTH_CREDENTIALS?.replace(/\.json$/, '.token.json') || process.env.GOOGLE_MEET_TOKEN_PATH;
    
    if (!credentialsPath || !tokenPath) {
      throw new Error('Missing credentials configuration. Set GOOGLE_OAUTH_CREDENTIALS or GOOGLE_MEET_CREDENTIALS_PATH/GOOGLE_MEET_TOKEN_PATH');
    }
    
    this.api = new GoogleMeetAPI(credentialsPath, tokenPath);
    this.testResults = [];
  }

  async runTests() {
    console.log('🧪 Starting Enhanced Google Meet API Tests...\n');
    
    try {
      await this.api.initialize();
      console.log('✅ API initialized successfully\n');
    } catch (error) {
      console.error('❌ Failed to initialize API:', error.message);
      return;
    }

    // Test cases
    await this.testBasicMeetingCreation();
    await this.testMeetingWithCoHosts();
    await this.testMeetingWithTranscription();
    await this.testMeetingWithAllFeatures();
    await this.testMeetingWithModeration();
    
    this.printSummary();
  }

  async testBasicMeetingCreation() {
    console.log('📝 Test 1: Basic meeting creation (backward compatibility)');
    
    try {
      const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
      
      const meeting = await this.api.createMeeting(
        'Test Meeting - Basic',
        startTime,
        endTime,
        'Basic test meeting for backward compatibility',
        ['test@example.com']
      );
      
      this.logResult('Basic Meeting Creation', true, `Created meeting: ${meeting.meet_link}`);
      
      // Clean up
      await this.api.deleteMeeting(meeting.id);
      console.log('🗑️  Meeting cleaned up\n');
      
    } catch (error) {
      this.logResult('Basic Meeting Creation', false, error.message);
    }
  }

  async testMeetingWithCoHosts() {
    console.log('📝 Test 2: Meeting with co-hosts');
    
    try {
      const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      
      const meeting = await this.api.createMeeting(
        'Test Meeting - Co-hosts',
        startTime,
        endTime,
        'Meeting with co-hosts test',
        ['attendee@example.com'],
        false, // recording
        {
          coHosts: ['cohost1@example.com', 'cohost2@example.com']
        }
      );
      
      this.logResult('Co-hosts Meeting', true, `Created meeting with co-hosts: ${meeting.meet_link}`);
      
      // Clean up
      await this.api.deleteMeeting(meeting.id);
      console.log('🗑️  Meeting cleaned up\n');
      
    } catch (error) {
      this.logResult('Co-hosts Meeting', false, error.message);
    }
  }

  async testMeetingWithTranscription() {
    console.log('📝 Test 3: Meeting with transcription and smart notes');
    
    try {
      const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      
      const meeting = await this.api.createMeeting(
        'Test Meeting - Transcription',
        startTime,
        endTime,
        'Meeting with transcription and smart notes',
        ['attendee@example.com'],
        true, // recording
        {
          enableTranscription: true,
          enableSmartNotes: true
        }
      );
      
      this.logResult('Transcription Meeting', true, `Created meeting with transcription: ${meeting.meet_link}`);
      
      // Clean up
      await this.api.deleteMeeting(meeting.id);
      console.log('🗑️  Meeting cleaned up\n');
      
    } catch (error) {
      this.logResult('Transcription Meeting', false, error.message);
    }
  }

  async testMeetingWithAllFeatures() {
    console.log('📝 Test 4: Meeting with all enhanced features');
    
    try {
      const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      
      const meeting = await this.api.createMeeting(
        'Test Meeting - All Features',
        startTime,
        endTime,
        'Meeting with all enhanced features enabled',
        ['attendee1@example.com', 'attendee2@example.com'],
        true, // recording
        {
          coHosts: ['cohost@example.com'],
          enableTranscription: true,
          enableSmartNotes: true,
          attendanceReport: true
        }
      );
      
      this.logResult('All Features Meeting', true, `Created comprehensive meeting: ${meeting.meet_link}`);
      
      // Clean up
      await this.api.deleteMeeting(meeting.id);
      console.log('🗑️  Meeting cleaned up\n');
      
    } catch (error) {
      this.logResult('All Features Meeting', false, error.message);
    }
  }

  async testMeetingWithModeration() {
    console.log('📝 Test 5: Meeting with moderation settings');
    
    try {
      const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      
      const meeting = await this.api.createMeeting(
        'Test Meeting - Moderation',
        startTime,
        endTime,
        'Meeting with moderation and restrictions',
        ['attendee@example.com'],
        false, // recording
        {
          spaceConfig: {
            moderation_mode: 'ON',
            chat_restriction: 'HOSTS_ONLY',
            present_restriction: 'HOSTS_ONLY',
            default_join_as_viewer: true
          }
        }
      );
      
      this.logResult('Moderation Meeting', true, `Created moderated meeting: ${meeting.meet_link}`);
      
      // Clean up
      await this.api.deleteMeeting(meeting.id);
      console.log('🗑️  Meeting cleaned up\n');
      
    } catch (error) {
      this.logResult('Moderation Meeting', false, error.message);
    }
  }

  logResult(testName, success, message) {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${message}`);
    this.testResults.push({ testName, success, message });
  }

  printSummary() {
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    this.testResults.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.testName}`);
      if (!result.success) {
        console.log(`   └─ ${result.message}`);
      }
    });
    
    console.log('='.repeat(50));
    console.log(`Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Enhanced features are working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the output above for details.');
      console.log('   Note: Some failures may be expected if you don\'t have Google Workspace Business+');
    }
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new EnhancedFeaturesTester();
  tester.runTests().catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
}

export default EnhancedFeaturesTester;