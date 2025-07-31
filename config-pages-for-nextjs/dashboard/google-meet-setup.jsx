// Google Meet MCP Setup Page
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function GoogleMeetSetup() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [claudeConfig, setClaudeConfig] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleCredentialsSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Parse and validate JSON
      let parsedCredentials;
      try {
        parsedCredentials = JSON.parse(credentials);
      } catch (e) {
        throw new Error('Invalid JSON format. Please check your credentials.');
      }
      
      // Validate required fields
      if (!parsedCredentials.client_id || !parsedCredentials.client_secret) {
        throw new Error('Credentials must contain client_id and client_secret');
      }
      
      // Store credentials
      const response = await fetch('/api/google/setup-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: parsedCredentials })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to store credentials');
      }
      
      setSuccess('Google credentials configured successfully!');
      setStep(2);
      
    } catch (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  const handleGenerateApiKey = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/mcp/generate-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate API key');
      }
      
      setApiKey(result.apiKey);
      
      // Generate Claude Desktop configuration
      const config = {
        mcpServers: {
          "google-meet-company": {
            command: "curl",
            args: [
              "-X", "POST",
              "-H", "Content-Type: application/json",
              "-H", `X-API-Key: ${result.apiKey}`,
              "-s",
              `${window.location.origin}/api/mcp`,
              "--data-binary", "@-"
            ]
          }
        }
      };
      
      setClaudeConfig(JSON.stringify(config, null, 2));
      setStep(3);
      
    } catch (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Google Meet MCP Setup
        </h1>
        <p className="text-gray-600 mb-8">
          Configure Google Meet integration for Claude Desktop
        </p>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${step >= 1 ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'}`}>
              1
            </div>
            <span className="font-medium">Google Credentials</span>
          </div>
          <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${step >= 2 ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'}`}>
              2
            </div>
            <span className="font-medium">Generate API Key</span>
          </div>
          <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${step >= 3 ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'}`}>
              3
            </div>
            <span className="font-medium">Claude Desktop</span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Step 1: Google Credentials */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4">📋 How to get Google OAuth Credentials:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                <li>Create a new project or select existing project</li>
                <li>Enable these APIs:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Google Calendar API v3</li>
                    <li>Google Meet API v2</li>
                  </ul>
                </li>
                <li>Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"</li>
                <li>Choose "Desktop Application" as application type</li>
                <li>Download the JSON file</li>
                <li>Copy and paste the JSON content below</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google OAuth Credentials (JSON)
              </label>
              <textarea
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                placeholder='{"client_id":"your_client_id","client_secret":"your_client_secret",...}'
                className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleCredentialsSetup}
              disabled={loading || !credentials.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Configuring...' : 'Configure Google Access'}
            </button>
          </div>
        )}

        {/* Step 2: Generate API Key */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-2">✅ Google Credentials Configured!</h3>
              <p className="text-sm text-gray-600">
                Your Google OAuth credentials have been securely stored and encrypted.
                Now let&apos;s generate your personal API key for Claude Desktop.
              </p>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-2">🔑 API Key Generation</h3>
              <p className="text-sm text-gray-600 mb-4">
                This API key will allow Claude Desktop to securely access your Google Meet integration.
                Keep this key private and don&apos;t share it with others.
              </p>
            </div>

            <button
              onClick={handleGenerateApiKey}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate API Key'}
            </button>
          </div>
        )}

        {/* Step 3: Claude Desktop Configuration */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-2">🎉 Setup Complete!</h3>
              <p className="text-sm text-gray-600">
                Your Google Meet MCP integration is ready. Follow the instructions below to configure Claude Desktop.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4">🔑 Your API Key:</h3>
              <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                {apiKey}
              </div>
              <button
                onClick={() => copyToClipboard(apiKey)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                📋 Copy API Key
              </button>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">⚙️ Claude Desktop Configuration:</h3>
              <p className="text-sm text-gray-600 mb-4">
                Copy this configuration to your Claude Desktop settings file:
              </p>
              
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{claudeConfig}</pre>
              </div>
              
              <button
                onClick={() => copyToClipboard(claudeConfig)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                📋 Copy Configuration
              </button>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4">📁 Configuration File Locations:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>macOS:</strong> 
                  <code className="bg-white px-2 py-1 rounded ml-2">
                    ~/Library/Application Support/Claude/claude_desktop_config.json
                  </code>
                </div>
                <div>
                  <strong>Windows:</strong> 
                  <code className="bg-white px-2 py-1 rounded ml-2">
                    %APPDATA%\Claude\claude_desktop_config.json
                  </code>
                </div>
                <div>
                  <strong>Linux:</strong> 
                  <code className="bg-white px-2 py-1 rounded ml-2">
                    ~/.config/Claude/claude_desktop_config.json
                  </code>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg mb-4">🚀 Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Replace the entire content of your Claude Desktop configuration file with the configuration above</li>
                <li>Restart Claude Desktop completely</li>
                <li>Test by asking Claude: "What Google Meet tools do you have available?"</li>
                <li>You should see 17 tools available for Google Calendar and Meet management</li>
              </ol>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.open('/dashboard/mcp-test', '_blank')}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700"
              >
                Test MCP Integration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}