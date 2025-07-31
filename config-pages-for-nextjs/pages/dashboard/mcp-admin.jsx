// MCP Administration Dashboard
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function MCPAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    // Check admin access (adjust based on your admin logic)
    if (session && !session.user.role === 'admin' && !session.user.isAdmin) {
      router.push('/dashboard');
      return;
    }
    
    if (session) {
      fetchStats();
    }
  }, [session, status, timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/admin/mcp-stats?timeRange=${timeRange}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
      
      setStats(data);
    } catch (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Google Meet MCP Administration
          </h1>
          <div className="flex space-x-4">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={fetchStats}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {stats && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">Total Users</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.overview.totalUsers}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">Active API Keys</h3>
                <p className="text-3xl font-bold text-green-600">{stats.overview.activeApiKeys}</p>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800">Recently Active</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.overview.recentlyActive}</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800">Total Keys</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.overview.totalApiKeys}</p>
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Top Users ({timeRange})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">User</th>
                      <th className="text-left py-2">Total Usage</th>
                      <th className="text-left py-2">Last Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topUsers.map((user, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{user._id}</td>
                        <td className="py-2">{user.totalUsage}</td>
                        <td className="py-2">
                          {user.lastUsed ? new Date(user.lastUsed).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Users */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">All MCP Users</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">MCP Status</th>
                      <th className="text-left py-2">Credentials</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.users.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="py-2">{user.name}</td>
                        <td className="py-2">{user.email}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.mcpEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.mcpEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-2">
                          {user.credentialsConfigured ? (
                            <span className="text-green-600 text-sm">✅ Configured</span>
                          ) : (
                            <span className="text-red-600 text-sm">❌ Missing</span>
                          )}
                        </td>
                        <td className="py-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm mr-2">
                            View Details
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm">
                            Reset
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Last Updated:</strong> {new Date(stats.generatedAt).toLocaleString()}
                </div>
                <div>
                  <strong>Time Range:</strong> {stats.overview.timeRange}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}