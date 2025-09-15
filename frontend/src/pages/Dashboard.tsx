import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // Imports are at the top

// --- Helper Icons (You can move these to a separate file) ---
const UsersIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);
const CampaignIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);
const RevenueIcon = () => (
   <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);
const SegmentIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
// --- End Helper Icons ---


const Dashboard: React.FC = () => {
  // Hooks are called at the top level of the component's body
  const { user } = useAuth();
  const [stats, setStats] = React.useState({
    totalCustomers: 0,
    activeCampaigns: 0,
    totalRevenue: 0,
    totalSegments: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch customer stats
      const customerResponse = await fetch('/api/customers/stats');
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        if (customerData.success) {
          setStats(prev => ({
            ...prev,
            totalCustomers: customerData.data.totalCustomers,
            totalRevenue: customerData.data.totalRevenue,
          }));
        }
      }
      
      // For now, set default values for campaigns and segments
      setStats(prev => ({
        ...prev,
        activeCampaigns: 0, // We'll implement this when campaigns API is ready
        totalSegments: 0,   // We'll implement this when segments API is ready
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const metrics = [
    {
      name: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      icon: <UsersIcon />,
      color: 'bg-indigo-500',
    },
    {
      name: 'Active Campaigns',
      value: stats.activeCampaigns,
      icon: <CampaignIcon />,
      color: 'bg-green-500',
    },
    {
      name: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: <RevenueIcon />,
      color: 'bg-yellow-500',
    },
    {
      name: 'Segments',
      value: stats.totalSegments,
      icon: <SegmentIcon />,
      color: 'bg-purple-500',
    },
  ];

  // A component has one single return statement
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      
      {/* Welcome Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:truncate">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back{user?.name ? `, ${user.name}` : ''}! Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center justify-center p-3 ${metric.color} rounded-md text-white`}>
                    {metric.icon}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {metric.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {metric.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 text-center transition-colors duration-200">
              <p className="text-sm font-medium text-gray-900">Add Customer</p>
            </button>
            <button className="bg-green-50 hover:bg-green-100 rounded-lg p-4 text-center transition-colors duration-200">
              <p className="text-sm font-medium text-gray-900">Create Campaign</p>
            </button>
            <button className="bg-purple-50 hover:bg-purple-100 rounded-lg p-4 text-center transition-colors duration-200">
              <p className="text-sm font-medium text-gray-900">Build Segment</p>
            </button>
            <button className="bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 text-center transition-colors duration-200">
              <p className="text-sm font-medium text-gray-900">View Analytics</p>
            </button>
          </div>
        </div>

        {/* Recent Campaigns Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Campaigns</h3>
          <div className="text-sm text-gray-500">
            <p>No recent campaigns found.</p>
            <a href="/campaigns" className="text-indigo-600 hover:text-indigo-900 font-medium">
              Create your first campaign →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;