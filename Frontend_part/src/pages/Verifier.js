import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, PERMISSIONS } from '../contexts/AuthContext';
import { useContractors } from '../contexts/ContractorContext';

const Verifier = () => {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, hasPermission } = useAuth();
  const { contractors: allContractors, updateContractorStatus, getStats, loadContractors } = useContractors();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading verification data for verifier...');
      
      if (hasPermission(PERMISSIONS.VERIFY_CREDENTIALS)) {
        // Load verification requests for verifiers
        try {
          const response = await fetch('http://localhost:5002/api/verification/requests', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Verification requests:', data);
          setVerificationRequests(Array.isArray(data) ? data : []);
        } catch (verifyErr) {
          console.warn('Could not load verification requests:', verifyErr);
          setVerificationRequests([]);
        }

        // Load contractors using the context
        try {
          await loadContractors();
        } catch (contractorErr) {
          console.warn('Could not load contractors:', contractorErr);
        }
      }
    } catch (err) {
      setError('Failed to load verification data. Please ensure the backend server is running.');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeContractorStatus = async (contractorId, newStatus) => {
    try {
      console.log(`Changing contractor ${contractorId} status to ${newStatus}`);
      
      const result = await updateContractorStatus(contractorId, newStatus === 'verified');
      
      if (result.success) {
        console.log('Status change successful');
        alert(`Contractor status changed to ${newStatus} successfully!`);
      } else {
        console.error('Status change failed:', result.error);
        alert(result.error || 'Failed to change contractor status');
      }
    } catch (err) {
      console.error('Status change error:', err);
      alert('Failed to change contractor status');
    }
  };

  // Check if user has verifier permissions
  if (!hasPermission(PERMISSIONS.VERIFY_CREDENTIALS)) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading contractor verification data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Certified Verifier Dashboard</h1>
        <p className="text-gray-600">
          Review quality assessments and make final verification decisions - approve or revoke contractor verification
        </p>
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">
          ✅ You are on the Certified Verifier page (with verify/revoke powers)
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4 inline mr-1" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Verifier Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{getStats().total}</p>
              <p className="text-sm text-gray-600">Total Contractors</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{getStats().verified}</p>
              <p className="text-sm text-gray-600">Verified</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{getStats().unverified}</p>
              <p className="text-sm text-gray-600">Unverified</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {verificationRequests.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Escalated Cases from Quality Assurance */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-orange-900 mb-2">Escalated Cases from Quality Assurance</h2>
        <p className="text-sm text-orange-700 mb-3">
          Cases requiring verification decisions based on quality assessments
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded border border-orange-200">
            <p className="font-medium text-gray-900">Quality Issues Reported</p>
            <p className="text-sm text-gray-600">2 contractors with quality concerns</p>
            <button className="mt-2 text-sm text-orange-600 hover:text-orange-700">Review Cases →</button>
          </div>
          <div className="bg-white p-3 rounded border border-orange-200">
            <p className="font-medium text-gray-900">Low Ratings Flagged</p>
            <p className="text-sm text-gray-600">1 contractor with rating below 3/5</p>
            <button className="mt-2 text-sm text-orange-600 hover:text-orange-700">Review Cases →</button>
          </div>
        </div>
      </div>

      {/* All Contractors Management */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">All Contractors Management</h2>
              <p className="text-sm text-gray-600">View all contractors and manage their verification status at any time</p>
            </div>
            <button
              onClick={() => {
                console.log('Manual refresh triggered');
                loadContractors();
              }}
              className="flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-md hover:bg-primary-50"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
        
        {allContractors.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contractors found</h3>
            <p className="text-gray-600">No contractors have registered yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {allContractors.map((contractor) => (
              <div key={contractor._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {contractor.profilePhoto ? (
                        <img src={contractor.profilePhoto} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{contractor.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          contractor.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {contractor.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{contractor.organization}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-400">
                          Email: {contractor.email}
                        </span>
                        <span className="text-xs text-gray-400">
                          Joined: {new Date(contractor.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {contractor.isVerified ? (
                      <button
                        onClick={() => {
                          console.log('Revoking verification for:', contractor.name, contractor._id);
                          changeContractorStatus(contractor._id, 'unverified');
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="h-4 w-4 inline mr-1" />
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          console.log('Verifying contractor:', contractor.name, contractor._id);
                          changeContractorStatus(contractor._id, 'verified');
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Verify
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Verifier;