// MCP User Profile and Settings
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function MCPProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userInfo, setUserInfo] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (session) {
      fetchUserInfo();
      fetchApiKeys();
      fetchAnalytics();
    }
  }, [session, status]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/mcp/user-info');
      const data = await response.json();
      
      if (response.ok) {
        setUserInfo(data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/mcp/my-api-keys');
      const data = await response.json();
      
      if (response.ok) {
        setApiKeys(data.apiKeys || []);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/mcp/my-analytics');
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    
    setLoading(false);
  };

  const revokeApiKey = async (apiKeyId) => {
    if (!confirm('Are you sure you want to revoke this API key? This will break Claude Desktop integration until you generate a new one.')) {
      return;
    }

    try {
      const response = await fetch('/api/mcp/revoke-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeyId })
      });

      if (response.ok) {
        alert('API key revoked successfully');
        fetchApiKeys(); // Refresh the list
      } else {
        const data = await response.json();
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error revoking API key: ' + error.message);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const generateClaudeConfig = (apiKey) => {
    return JSON.stringify({
      mcpServers: {
        "google-meet-company": {
          command: "curl",
          args: [
            "-X", "POST",
            "-H", "Content-Type: application/json",
            "-H", `X-API-Key: ${apiKey}`,
            "-s",
            `${window.location.origin}/api/mcp`,
            "--data-binary", "@-"
          ]
        }
      }
    }, null, 2);
  };

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          My Google Meet MCP Profile
        </h1>
        <p className="text-gray-600 mb-8">
          Manage your Google Meet MCP integration settings
        </p>

        {/* User Status */}
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-600">Google Credentials</span>
              <div className={`text-lg font-semibold ${userInfo?.hasCredentials ? 'text-green-600' : 'text-red-600'}`}>
                {userInfo?.hasCredentials ? '✅ Configured' : '❌ Missing'}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">MCP Access</span>
              <div className={`text-lg font-semibold ${userInfo?.mcpEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {userInfo?.mcpEnabled ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Active API Keys</span>
              <div className="text-lg font-semibold text-blue-600">
                {apiKeys.filter(key => key.isActive).length}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push('/dashboard/google-meet-setup')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {userInfo?.hasCredentials ? 'Reconfigure' : 'Setup'} Google Access
            </button>
            <button
              onClick={() => router.push('/dashboard/mcp-test')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Test MCP Integration
            </button>
          </div>
        </div>

        {/* API Keys Management */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">API Keys</h3>
          {apiKeys.length === 0 ? (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-yellow-800">No API keys found. Generate one from the setup page.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-mono text-sm">{key.apiKeyPreview}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          key.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {key.isActive ? 'Active' : 'Revoked'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Created: {new Date(key.createdAt).toLocaleDateString()}</div>
                        <div>Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</div>
                        <div>Usage count: {key.usageCount}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {key.isActive && (
                        <>
                          <button
                            onClick={() => copyToClipboard(key.fullApiKey, 'API Key')}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-300 rounded"
                          >
                            Copy Key
                          </button>
                          <button
                            onClick={() => copyToClipboard(generateClaudeConfig(key.fullApiKey), 'Claude Config')}
                            className="text-green-600 hover:text-green-800 text-sm px-2 py-1 border border-green-300 rounded"
                          >
                            Copy Config
                          </button>
                          <button
                            onClick={() => revokeApiKey(key.id)}
                            className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-300 rounded"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage Analytics */}
        {analytics && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Usage Analytics (Last 30 days)</h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalRequests}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Most Used Tool</span>
                  <div className="text-lg font-semibold text-green-600">
                    {analytics.toolsUsage[0]?._id || 'N/A'}
                  </div>
                </div>
              </div>
              
              {analytics.toolsUsage.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Tools Usage Breakdown</h4>
                  <div className="space-y-2">
                    {analytics.toolsUsage.slice(0, 5).map((tool, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{tool._id.replace(/_/g, ' ')}</span>
                        <span className="font-semibold">{tool.count} times</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Need Help?</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <div>📖 <a href="/dashboard/mcp-test" className="hover:underline">Test your MCP integration</a></div>
            <div>🔧 <a href="/dashboard/google-meet-setup" className="hover:underline">Reconfigure Google credentials</a></div>
            <div>📋 <strong>Claude Desktop config location:</strong></div>
            <div className="ml-4 font-mono text-xs">
              <div>macOS: ~/Library/Application Support/Claude/claude_desktop_config.json</div>
              <div>Windows: %APPDATA%\Claude\claude_desktop_config.json</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}