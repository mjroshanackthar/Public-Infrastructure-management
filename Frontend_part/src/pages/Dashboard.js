import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  FileText, 
  Users, 
  Shield, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';
import StatusCard from '../components/StatusCard';
import LoadingSpinner from '../components/LoadingSpinner';
import DemoNotice from '../components/DemoNotice';
import UserVerificationStatus from '../components/UserVerificationStatus';
import { useAuth, PERMISSIONS } from '../contexts/AuthContext';
import { systemAPI, tendersAPI, contractorsAPI, projectsAPI } from '../services/api';

const Dashboard = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [stats, setStats] = useState({
    totalTenders: 0,
    activeTenders: 0,
    totalContractors: 0,
    verifiedContractors: 0,
    totalProjects: 0,
    completedProjects: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, getUserRole, hasPermission } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load system status
      const [healthResponse, blockchainResponse] = await Promise.all([
        systemAPI.getHealth(),
        systemAPI.getBlockchainStatus()
      ]);

      setSystemStatus({
        server: healthResponse.data.status === 'OK' ? 'active' : 'error',
        blockchain: blockchainResponse.data.connected ? 'active' : 'error',
        network: blockchainResponse.data.network || 'Unknown'
      });

      // Load statistics based on user permissions
      const promises = [
        tendersAPI.getAllTenders().catch(() => ({ data: [] })),
        projectsAPI.getAssignments().catch(() => ({ data: [] }))
      ];

      // Only load contractor data if user has permission
      if (hasPermission(PERMISSIONS.VIEW_CONTRACTORS)) {
        promises.push(contractorsAPI.getAllContractors().catch(() => ({ data: [] })));
      }

      const responses = await Promise.all(promises);
      
      // Ensure all data is arrays
      const tenders = Array.isArray(responses[0].data) ? responses[0].data : [];
      const projects = Array.isArray(responses[1].data) ? responses[1].data : [];
      const contractors = hasPermission(PERMISSIONS.VIEW_CONTRACTORS) && responses[2] 
        ? (Array.isArray(responses[2].data) ? responses[2].data : [])
        : [];

      setStats({
        totalTenders: tenders.length,
        activeTenders: tenders.filter(t => t && t.status === 'Open').length,
        totalContractors: contractors.length,
        verifiedContractors: contractors.filter(c => c && c.isVerified).length,
        totalProjects: projects.length,
        completedProjects: projects.filter(p => p && p.status === 'Completed').length
      });

    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-danger-600 mb-4">
          <Activity className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Overview of your blockchain building platform • Role: <span className="capitalize font-medium">{getUserRole()}</span>
        </p>
      </div>

      {/* Demo Notice */}
      <DemoNotice />

      {/* User Verification Status */}
      <UserVerificationStatus />

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Server Status"
          status={systemStatus?.server}
          description="Backend API server"
          icon={Activity}
        />
        <StatusCard
          title="Blockchain Status"
          status={systemStatus?.blockchain}
          description={`Network: ${systemStatus?.network}`}
          icon={Shield}
        />
        <StatusCard
          title="System Health"
          status={systemStatus?.server === 'active' && systemStatus?.blockchain === 'active' ? 'success' : 'warning'}
          description="Overall system status"
          icon={CheckCircle}
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tenders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTenders}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {stats.activeTenders} active
            </span>
          </div>
        </div>

        {hasPermission(PERMISSIONS.VIEW_CONTRACTORS) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-success-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Contractors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContractors}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                {stats.verifiedContractors} verified
              </span>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-warning-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {stats.completedProjects} completed
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalTenders > 0 ? Math.round((stats.verifiedContractors / stats.totalTenders) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              Platform efficiency
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-6 w-6 text-primary-600 mb-2" />
            <h3 className="font-medium text-gray-900">Create Tender</h3>
            <p className="text-sm text-gray-600">Post a new building project</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Shield className="h-6 w-6 text-success-600 mb-2" />
            <h3 className="font-medium text-gray-900">Verify Contractor</h3>
            <p className="text-sm text-gray-600">Add contractor credentials</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="h-6 w-6 text-warning-600 mb-2" />
            <h3 className="font-medium text-gray-900">View Bids</h3>
            <p className="text-sm text-gray-600">Review submitted proposals</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Activity className="h-6 w-6 text-primary-600 mb-2" />
            <h3 className="font-medium text-gray-900">System Status</h3>
            <p className="text-sm text-gray-600">Check platform health</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Transparency</h3>
            <p className="text-sm text-gray-600">
              All tender processes and contractor verifications are recorded on the blockchain, 
              ensuring complete transparency and immutable audit trails.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Cost Savings</h3>
            <p className="text-sm text-gray-600">
              Competitive bidding process typically reduces project costs by 10-15% 
              while maintaining quality through verified contractor requirements.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Quality Assurance</h3>
            <p className="text-sm text-gray-600">
              Multi-verifier credential system ensures only qualified contractors 
              can participate in the bidding process.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Efficiency</h3>
            <p className="text-sm text-gray-600">
              Automated processes reduce administrative overhead and speed up 
              project assignment while maintaining security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;