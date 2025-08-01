'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Key, Trash2, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  apiKeyPreview: string;
  fullApiKey: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface ApiKeyManagerProps {
  userId?: string;
  showGenerateButton?: boolean;
}

export function ApiKeyManager({ userId, showGenerateButton = true }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

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
      setError('Network error: ' + (error as Error).message);
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
        await fetchApiKeys();
        setSuccess('New API key generated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to generate API key');
      }
    } catch (error) {
      setError('Error generating API key: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const revokeApiKey = async (apiKeyId: string) => {
    try {
      const response = await fetch('/api/mcp/revoke-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeyId })
      });

      if (response.ok) {
        setSuccess('API key revoked successfully');
        setTimeout(() => setSuccess(''), 3000);
        fetchApiKeys();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to revoke API key');
      }
    } catch (error) {
      setError('Error revoking API key: ' + (error as Error).message);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess(`${label} copied to clipboard!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const generateClaudeConfig = (apiKey: string) => {
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

  if (loading && apiKeys.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage your API keys for Claude Desktop integration
            </CardDescription>
          </div>
          {showGenerateButton && (
            <Button
              onClick={generateApiKey}
              disabled={loading}
              className="shrink-0"
            >
              Generate New Key
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {apiKeys.length === 0 ? (
          <Alert variant="warning">
            <AlertDescription>
              No API keys found. {showGenerateButton ? 'Generate one to get started.' : 'Contact your administrator.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <Card key={key.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                          {visibleKeys.has(key.id) ? key.fullApiKey : key.apiKeyPreview}
                        </code>
                        <Badge variant={key.isActive ? "success" : "destructive"}>
                          {key.isActive ? 'Active' : 'Revoked'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div>Created: {new Date(key.createdAt).toLocaleDateString()}</div>
                        <div>Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</div>
                        <div>Usage: {key.usageCount || 0} requests</div>
                      </div>
                    </div>

                    {key.isActive && (
                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(key.fullApiKey, 'API Key')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generateClaudeConfig(key.fullApiKey), 'Claude Config')}
                        >
                          Config
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to revoke this API key?')) {
                              revokeApiKey(key.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}