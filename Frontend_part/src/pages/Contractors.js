import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye,
  Award,
  Building,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusCard from '../components/StatusCard';
import { contractorsAPI, tokensAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Contractors = () => {
  const { getUserRole } = useAuth();
  const [contractors, setContractors] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [contractorDetails, setContractorDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  useEffect(() => {
    loadContractors();
    loadVerificationStatus();
  }, []);

  const loadContractors = async () => {
    try {
      setLoading(true);
      const response = await contractorsAPI.getAllContractors();
      setContractors(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied. Only verifiers and admins can view contractor information.');
      } else {
        setError('Failed to load contractors');
      }
      console.error(err);
      setContractors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVerificationStatus = async () => {
    try {
      const response = await contractorsAPI.getVerificationStatus();
      setVerificationStatus(response.data);
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('Access denied to verification status - user does not have permission');
      } else {
        console.error('Failed to load verification status:', err);
      }
    }
  };

  const loadContractorDetails = async (address) => {
    try {
      const [contractorResponse, balanceResponse] = await Promise.all([
        contractorsAPI.getContractor(address),
        tokensAPI.getBalance(address).catch(() => ({ data: { balance: '0' } }))
      ]);
      
      setContractorDetails({
        ...contractorResponse.data,
        balance: balanceResponse.data.balance
      });
      setSelectedContractor(address);
    } catch (err) {
      console.error('Failed to load contractor details:', err);
      alert('Failed to load contractor details');
    }
  };

  const deleteContractor = async (contractorId, contractorName) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to permanently delete contractor "${contractorName}"?\n\nThis will:\n- Remove the contractor from the system\n- Delete all their data\n- Cannot be undone\n\nType YES to confirm.`)) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm:');
    if (confirmation !== 'DELETE') {
      alert('Deletion cancelled');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5002/api/contractors/${contractorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete contractor');
      }

      alert('✅ Contractor deleted successfully!');
      loadContractors(); // Reload the list
    } catch (err) {
      alert('❌ Failed to delete contractor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusColor = (isVerified) => {
    return isVerified ? 'success' : 'warning';
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading contractors..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contractors</h1>
        <p className="text-gray-600">Manage contractor verification and profiles</p>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Verification Status Overview */}
      {verificationStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            title="Verification System"
            status={verificationStatus.canBid ? 'success' : 'warning'}
            description={`${verificationStatus.verifiedCount} verified contractors`}
            icon={Shield}
          />
          <StatusCard
            title="Active Verifiers"
            status="active"
            description={`${verificationStatus.totalVerifiers} verifiers active`}
            icon={Users}
          />
          <StatusCard
            title="System Status"
            status={verificationStatus.systemActive ? 'success' : 'error'}
            description="Contractor verification system"
            icon={CheckCircle}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              if (contractors.length > 0) {
                loadContractorDetails(contractors[0]._id);
              }
            }}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-6 w-6 text-primary-600 mb-2" />
            <h3 className="font-medium text-gray-900">View Default Contractor</h3>
            <p className="text-sm text-gray-600">Check main contractor profile</p>
          </button>
          
          <button
            onClick={loadVerificationStatus}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Shield className="h-6 w-6 text-success-600 mb-2" />
            <h3 className="font-medium text-gray-900">Refresh Status</h3>
            <p className="text-sm text-gray-600">Update verification status</p>
          </button>
          
          <button
            onClick={loadContractors}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-6 w-6 text-warning-600 mb-2" />
            <h3 className="font-medium text-gray-900">Reload Contractors</h3>
            <p className="text-sm text-gray-600">Refresh contractor list</p>
          </button>
        </div>
      </div>

      {/* Contractors List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Registered Contractors</h2>
        </div>
        
        {contractors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contractors found</h3>
            <p className="text-gray-600">Contractors will appear here once they register</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {contractors.map((contractor, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {(contractor.verified || contractor.isVerified) ? (
                        <CheckCircle className="h-8 w-8 text-success-600" />
                      ) : (
                        <XCircle className="h-8 w-8 text-warning-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {contractor.name || formatAddress(contractor.address || contractor.walletAddress)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {contractor.email || `Status: ${contractor.verified || contractor.isVerified ? 'Verified' : 'Pending Verification'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (contractor.verified || contractor.isVerified)
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-warning-100 text-warning-800'
                    }`}>
                      {(contractor.verified || contractor.isVerified) ? 'Verified' : 'Pending'}
                    </span>
                    <button
                      onClick={() => loadContractorDetails(contractor._id)}
                      className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                    >
                      View Details
                    </button>
                    {getUserRole() === 'admin' && (
                      <button
                        onClick={() => deleteContractor(contractor._id, contractor.name)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contractor Details Modal */}
      {selectedContractor && contractorDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-medium">Contractor Details</h2>
              <button
                onClick={() => {
                  setSelectedContractor(null);
                  setContractorDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedContractor}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Balance</label>
                  <p className="text-sm text-gray-900">{contractorDetails.balance} ETH</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
                <div className="flex items-center">
                  {contractorDetails.isVerified ? (
                    <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-warning-600 mr-2" />
                  )}
                  <span className={contractorDetails.isVerified ? 'text-success-600' : 'text-warning-600'}>
                    {contractorDetails.isVerified ? 'Fully Verified' : 'Pending Verification'}
                  </span>
                </div>
              </div>

              {contractorDetails.bids && contractorDetails.bids.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recent Bids</label>
                  <div className="space-y-2">
                    {contractorDetails.bids.map((bid, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">Tender #{bid.tenderId}</p>
                            <p className="text-sm text-gray-600">Amount: {bid.amount} ETH</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bid.status === 'Won' 
                              ? 'bg-success-100 text-success-800'
                              : bid.status === 'Lost'
                              ? 'bg-danger-100 text-danger-800'
                              : 'bg-warning-100 text-warning-800'
                          }`}>
                            {bid.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contractorDetails.projects && contractorDetails.projects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Projects</label>
                  <div className="space-y-2">
                    {contractorDetails.projects.map((project, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-primary-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium">{project.title}</p>
                            <p className="text-sm text-gray-600">Value: {project.value} ETH</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setSelectedContractor(null);
                  setContractorDetails(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Contractor Verification Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Multi-Verifier System</h3>
            <p className="text-sm text-gray-600">
              Contractors must be verified by multiple independent verifiers before they can 
              participate in the bidding process. This ensures quality and trust.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Qualification Requirements</h3>
            <p className="text-sm text-gray-600">
              Each tender specifies minimum qualification scores. Only contractors meeting 
              these requirements can submit bids, ensuring project quality.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Blockchain Verification</h3>
            <p className="text-sm text-gray-600">
              All contractor credentials and verifications are stored on the blockchain, 
              providing immutable proof of qualifications and history.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Performance Tracking</h3>
            <p className="text-sm text-gray-600">
              The system tracks contractor performance across projects, building a 
              reputation system that benefits reliable contractors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contractors;