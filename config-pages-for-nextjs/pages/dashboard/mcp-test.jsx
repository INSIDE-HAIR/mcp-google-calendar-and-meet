// MCP Testing Interface
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function MCPTest() {
  const { data: session } = useSession();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const runTest = async (testName, testFn) => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: testName,
        status: 'success',
        result: result,
        duration: duration,
        timestamp: new Date()
      }]);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        test: testName,
        status: 'error',
        error: error.message,
        duration: duration,
        timestamp: new Date()
      }]);
    }
    
    setLoading(false);
  };

  const testHealthCheck = async () => {
    const response = await fetch('/api/mcp/health');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Health check failed');
    }
    
    return data;
  };

  const testMCPConnection = async () => {
    if (!apiKey) {
      throw new Error('API key is required for MCP connection test');
    }

    const mcpRequest = {
      method: 'tools/list',
      params: {}
    };

    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(mcpRequest)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'MCP connection failed');
    }
    
    return data;
  };

  const testCreateEvent = async () => {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    const mcpRequest = {
      method: 'tools/call',
      params: {
        name: 'calendar_v3_create_event',
        arguments: {
          summary: 'MCP Test Event',
          description: 'Test event created via MCP integration',
          start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          create_meet_conference: true
        }
      }
    };

    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(mcpRequest)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Create event test failed');
    }
    
    return data;
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Google Meet MCP Testing
        </h1>
        <p className="text-gray-600 mb-8">
          Test your MCP integration and debug issues
        </p>

        {/* API Key Input */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key (for MCP connection tests)
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="mcp_abc123def456..."
            className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your API key from <a href="/dashboard/google-meet-setup" className="text-blue-600">setup page</a>
          </p>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => runTest('Health Check', testHealthCheck)}
            disabled={loading}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Test Health Check
          </button>
          
          <button
            onClick={() => runTest('MCP Connection', testMCPConnection)}
            disabled={loading || !apiKey}
            className="bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Test MCP Connection
          </button>
          
          <button
            onClick={() => runTest('Create Test Event', testCreateEvent)}
            disabled={loading || !apiKey}
            className="bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            Test Create Event
          </button>
        </div>

        {/* Clear Results */}
        {testResults.length > 0 && (
          <div className="mb-6">
            <button
              onClick={clearResults}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Clear Results
            </button>
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-semibold ${
                  result.status === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.status === 'success' ? '✅' : '❌'} {result.test}
                </h3>
                <div className="text-sm text-gray-500">
                  {result.duration}ms - {result.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              {result.status === 'success' ? (
                <div className="bg-white p-3 rounded border">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-red-700 text-sm">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Debug Information */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Debug Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Session:</strong> {session ? '✅ Authenticated' : '❌ Not authenticated'}</div>
            <div><strong>User:</strong> {session?.user?.email || 'N/A'}</div>
            <div><strong>API Key:</strong> {apiKey ? '✅ Provided' : '❌ Missing'}</div>
            <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Testing Instructions</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>First, run <strong>Health Check</strong> to verify system status</li>
            <li>Enter your API key and run <strong>MCP Connection</strong> to test authentication</li>
            <li>Run <strong>Create Test Event</strong> to test full functionality</li>
            <li>Check results for any errors or unexpected responses</li>
            <li>If tests fail, check your Google credentials and API key configuration</li>
          </ol>
        </div>
      </div>
    </div>
  );
}