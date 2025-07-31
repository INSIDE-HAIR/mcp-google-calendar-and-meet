// API Key Management Component
import { useState, useEffect } from 'react';

export function ApiKeyManager({ userId, showGenerateButton = true }) {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApiKeys();
  }, [userId]);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/mcp/my-api-keys');
      const data = await response.json();
      
      if (response.ok) {
        setApiKeys(data.apiKeys || []);
      } else {
        setError(data.error || 'Failed to fetch API keys');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    }
    setLoading(false);
  };

  const generateApiKey = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mcp/generate-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        await fetchApiKeys(); // Refresh the list
        alert('New API key generated successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error generating API key: ' + error.message);
    }
    setLoading(false);
  };

  const revokeApiKey = async (apiKeyId) => {
    if (!confirm('Are you sure you want to revoke this API key?')) {
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

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">API Keys</h3>
        {showGenerateButton && (
          <button
            onClick={generateApiKey}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Generate New Key
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {apiKeys.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-800">
            No API keys found. {showGenerateButton ? 'Generate one to get started.' : 'Contact your administrator.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <div key={key.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {key.apiKeyPreview}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      key.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {key.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Created: {new Date(key.createdAt).toLocaleDateString()}</div>
                    <div>Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</div>
                    <div>Usage count: {key.usageCount || 0}</div>
                  </div>
                </div>
                {key.isActive && (
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => copyToClipboard(key.fullApiKey, 'API Key')}
                      className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-300 rounded"
                    >
                      Copy Key
                    </button>
                    <button
                      onClick={() => copyToClipboard(generateClaudeConfig(key.fullApiKey), 'Claude Config')}
                      className="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-300 rounded"
                    >
                      Copy Config
                    </button>
                    <button
                      onClick={() => revokeApiKey(key.id)}
                      className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded"
                    >
                      Revoke
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}