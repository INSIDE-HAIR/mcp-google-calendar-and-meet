'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  Copy, 
  ExternalLink, 
  Key, 
  Settings, 
  Loader2,
  Calendar,
  Video
} from 'lucide-react';

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
      let parsedCredentials;
      try {
        parsedCredentials = JSON.parse(credentials);
      } catch (e) {
        throw new Error('Invalid JSON format. Please check your credentials.');
      }
      
      if (!parsedCredentials.client_id || !parsedCredentials.client_secret) {
        throw new Error('Credentials must contain client_id and client_secret');
      }
      
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
      setError((error as Error).message);
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
      setError((error as Error).message);
    }
    
    setLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const StepIndicator = ({ stepNumber, title, isActive, isCompleted }: {
    stepNumber: number;
    title: string;
    isActive: boolean;
    isCompleted: boolean;
  }) => (
    <div className="flex items-center">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
        isCompleted 
          ? 'bg-primary text-primary-foreground border-primary' 
          : isActive 
            ? 'border-primary text-primary' 
            : 'border-muted-foreground text-muted-foreground'
      }`}>
        {isCompleted ? <CheckCircle className="h-4 w-4" /> : stepNumber}
      </div>
      <span className={`ml-2 font-medium ${
        isActive ? 'text-primary' : isCompleted ? 'text-primary' : 'text-muted-foreground'
      }`}>
        {title}
      </span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Video className="h-6 w-6" />
            Google Meet MCP Setup
          </CardTitle>
          <CardDescription>
            Configure Google Meet integration for Claude Desktop
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            <StepIndicator 
              stepNumber={1} 
              title="Google Credentials" 
              isActive={step === 1} 
              isCompleted={step > 1} 
            />
            <div className={`flex-1 h-0.5 mx-4 ${step > 1 ? 'bg-primary' : 'bg-border'}`} />
            <StepIndicator 
              stepNumber={2} 
              title="Generate API Key" 
              isActive={step === 2} 
              isCompleted={step > 2} 
            />
            <div className={`flex-1 h-0.5 mx-4 ${step > 2 ? 'bg-primary' : 'bg-border'}`} />
            <StepIndicator 
              stepNumber={3} 
              title="Claude Desktop" 
              isActive={step === 3} 
              isCompleted={false} 
            />
          </div>

          {/* Messages */}
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

          {/* Step 1: Google Credentials */}
          {step === 1 && (
            <div className="space-y-6">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertTitle>How to get Google OAuth Credentials:</AlertTitle>
                <AlertDescription asChild>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>
                      Go to{' '}
                      <a 
                        href="https://console.cloud.google.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Google Cloud Console <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li>Create a new project or select existing project</li>
                    <li>
                      Enable these APIs:
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
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Google OAuth Credentials (JSON)
                </label>
                <Textarea
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  placeholder='{"client_id":"your_client_id","client_secret":"your_client_secret",...}'
                  className="min-h-[160px] font-mono text-sm"
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleCredentialsSetup}
                disabled={loading || !credentials.trim()}
                className="w-full"
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Configuring...' : 'Configure Google Access'}
              </Button>
            </div>
          )}

          {/* Step 2: Generate API Key */}
          {step === 2 && (
            <div className="space-y-6">
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Google Credentials Configured!</AlertTitle>
                <AlertDescription>
                  Your Google OAuth credentials have been securely stored and encrypted.
                  Now let's generate your personal API key for Claude Desktop.
                </AlertDescription>
              </Alert>

              <Alert>
                <Key className="h-4 w-4" />
                <AlertTitle>API Key Generation</AlertTitle>
                <AlertDescription>
                  This API key will allow Claude Desktop to securely access your Google Meet integration.
                  Keep this key private and don't share it with others.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleGenerateApiKey}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Generating...' : 'Generate API Key'}
              </Button>
            </div>
          )}

          {/* Step 3: Claude Desktop Configuration */}
          {step === 3 && (
            <div className="space-y-6">
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Setup Complete!</AlertTitle>
                <AlertDescription>
                  Your Google Meet MCP integration is ready. Follow the instructions below to configure Claude Desktop.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Your API Key
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted p-3 rounded font-mono text-sm break-all">
                      {apiKey}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Claude Desktop Configuration
                  </CardTitle>
                  <CardDescription>
                    Copy this configuration to your Claude Desktop settings file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{claudeConfig}
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(claudeConfig)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <Alert>
                      <AlertTitle>Configuration File Locations:</AlertTitle>
                      <AlertDescription asChild>
                        <div className="space-y-2 mt-2">
                          <div>
                            <Badge variant="outline">macOS</Badge>
                            <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                              ~/Library/Application Support/Claude/claude_desktop_config.json
                            </code>
                          </div>
                          <div>
                            <Badge variant="outline">Windows</Badge>
                            <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                              %APPDATA%\Claude\claude_desktop_config.json
                            </code>
                          </div>
                          <div>
                            <Badge variant="outline">Linux</Badge>
                            <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                              ~/.config/Claude/claude_desktop_config.json
                            </code>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertTitle>Next Steps:</AlertTitle>
                <AlertDescription asChild>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Replace the entire content of your Claude Desktop configuration file with the configuration above</li>
                    <li>Restart Claude Desktop completely</li>
                    <li>Test by asking Claude: "What Google Meet tools do you have available?"</li>
                    <li>You should see 17 tools available for Google Calendar and Meet management</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('/dashboard/mcp-test', '_blank')}
                  className="flex-1"
                >
                  Test Integration
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}