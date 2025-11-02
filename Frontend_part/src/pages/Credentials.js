import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusCard from '../components/StatusCard';
import { credentialsAPI } from '../services/api';

const Credentials = () => {
  const [credentials, setCredentials] = useState([]);
  const [verifiers, setVerifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);

  const [newCredential, setNewCredential] = useState({
    certificateType: 'contractor_license',
    certificateHash: '',
    issuer: 'Government Building Authority',
    expiryDays: 365
  });

  // Default address for demo
  const defaultAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  useEffect(() => {
    loadCredentialsData();
  }, []);

  const loadCredentialsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load verifiers
      const verifiersResponse = await credentialsAPI.getVerifiers();
      setVerifiers(Array.isArray(verifiersResponse.data) ? verifiersResponse.data : []);

      // Load default credential status
      await loadCredentialStatus(defaultAddress, 'contractor_license');

    } catch (err) {
      setError('Failed to load credentials data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCredentialStatus = async (address, type) => {
    try {
      const response = await credentialsAPI.getCredentialStatus(address, type);
      setCredentials([{
        address,
        type,
        ...response.data
      }]);
    } catch (err) {
      console.error('Failed to load credential status:', err);
    }
  };

  const addCredential = async (e) => {
    e.preventDefault();
    try {
      await credentialsAPI.addCredential(newCredential);
      setShowAddForm(false);
      setNewCredential({
        certificateType: 'contractor_license',
        certificateHash: '',
        issuer: 'Government Building Authority',
        expiryDays: 365
      });
      // Reload credential status
      await loadCredentialStatus(defaultAddress, newCredential.certificateType);
    } catch (err) {
      alert('Failed to add credential: ' + (err.response?.data?.error || err.message));
    }
  };

  const addVerifier = async () => {
    try {
      await credentialsAPI.addVerifier();
      const verifiersResponse = await credentialsAPI.getVerifiers();
      setVerifiers(Array.isArray(verifiersResponse.data) ? verifiersResponse.data : []);
    } catch (err) {
      alert('Failed to add verifier: ' + (err.response?.data?.error || err.message));
    }
  };

  const manualVerify = async (address, type) => {
    try {
      await credentialsAPI.manualVerify({ userAddress: address, certificateType: type });
      await loadCredentialStatus(address, type);
    } catch (err) {
      alert('Failed to verify credential: ' + (err.response?.data?.error || err.message));
    }
  };

  const loadVerificationDetails = async (address, type) => {
    try {
      const response = await credentialsAPI.getVerificationDetails(address, type);
      setVerificationDetails(response.data);
      setSelectedCredential({ address, type });
    } catch (err) {
      console.error('Failed to load verification details:', err);
      alert('Failed to load verification details');
    }
  };

  const getCredentialStatusColor = (isVerified) => {
    return isVerified ? 'success' : 'warning';
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading credentials..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
          <p className="text-gray-600">Manage contractor credentials and verification</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Active Verifiers"
          status={verifiers.length > 0 ? 'success' : 'warning'}
          description={`${verifiers.length} verifiers active`}
          icon={Users}
        />
        <StatusCard
          title="Credentials System"
          status="active"
          description="Multi-verifier credential system"
          icon={Shield}
        />
        <StatusCard
          title="Verification Process"
          status={verifiers.length >= 2 ? 'success' : 'warning'}
          description={verifiers.length >= 2 ? 'Ready for verification' : 'Need more verifiers'}
          icon={FileCheck}
        />
      </div>

      {/* Add Credential Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-medium mb-4">Add New Credential</h2>
            <form onSubmit={addCredential} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Type
                </label>
                <select
                  value={newCredential.certificateType}
                  onChange={(e) => setNewCredential({...newCredential, certificateType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="contractor_license">Contractor License</option>
                  <option value="safety_certificate">Safety Certificate</option>
                  <option value="quality_certification">Quality Certification</option>
                  <option value="environmental_permit">Environmental Permit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Hash/ID
                </label>
                <input
                  type="text"
                  value={newCredential.certificateHash}
                  onChange={(e) => setNewCredential({...newCredential, certificateHash: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., contractor_license_001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuer
                </label>
                <input
                  type="text"
                  value={newCredential.issuer}
                  onChange={(e) => setNewCredential({...newCredential, issuer: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Days
                </label>
                <input
                  type="number"
                  value={newCredential.expiryDays}
                  onChange={(e) => setNewCredential({...newCredential, expiryDays: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Add Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verifiers Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Active Verifiers</h2>
          <button
            onClick={addVerifier}
            className="px-3 py-1 text-sm bg-success-600 text-white rounded hover:bg-success-700"
          >
            Add Verifier
          </button>
        </div>
        
        {verifiers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No verifiers found</h3>
            <p className="text-gray-600">Add verifiers to enable credential verification</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verifiers.map((verifier, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                <CheckCircle className="h-5 w-5 text-success-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Verifier #{index + 1}
                  </p>
                  <p className="text-sm text-gray-600 font-mono">
                    {formatAddress(verifier)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credentials List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Contractor Credentials</h2>
        </div>
        
        {credentials.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No credentials found</h3>
            <p className="text-gray-600">Add credentials to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {credentials.map((credential, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {credential.isVerified ? (
                        <CheckCircle className="h-8 w-8 text-success-600" />
                      ) : credential.exists ? (
                        <Clock className="h-8 w-8 text-warning-600" />
                      ) : (
                        <XCircle className="h-8 w-8 text-danger-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {credential.type.replace('_', ' ').toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Address: {formatAddress(credential.address)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: {credential.isVerified ? 'Verified' : credential.exists ? 'Pending' : 'Not Found'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      credential.isVerified 
                        ? 'bg-success-100 text-success-800' 
                        : credential.exists
                        ? 'bg-warning-100 text-warning-800'
                        : 'bg-danger-100 text-danger-800'
                    }`}>
                      {credential.isVerified ? 'Verified' : credential.exists ? 'Pending' : 'Missing'}
                    </span>
                    
                    {credential.exists && !credential.isVerified && (
                      <button
                        onClick={() => manualVerify(credential.address, credential.type)}
                        className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        Verify
                      </button>
                    )}
                    
                    <button
                      onClick={() => loadVerificationDetails(credential.address, credential.type)}
                      className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Details Modal */}
      {selectedCredential && verificationDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-medium">Verification Details</h2>
              <button
                onClick={() => {
                  setSelectedCredential(null);
                  setVerificationDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Certificate Type</label>
                  <p className="text-sm text-gray-900">{verificationDetails.certificateType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center">
                    {verificationDetails.isVerified ? (
                      <CheckCircle className="h-4 w-4 text-success-600 mr-1" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-warning-600 mr-1" />
                    )}
                    <span className={verificationDetails.isVerified ? 'text-success-600' : 'text-warning-600'}>
                      {verificationDetails.isVerified ? 'Fully Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Issuer</label>
                <p className="text-sm text-gray-900">{verificationDetails.issuer}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Certificate Hash</label>
                <p className="text-sm text-gray-900 font-mono">{verificationDetails.certificateHash}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(verificationDetails.issueDate * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(verificationDetails.expiryDate * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Progress</label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Verifications</span>
                    <span>{verificationDetails.verificationCount} / {verificationDetails.requiredVerifications}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(verificationDetails.verificationCount / verificationDetails.requiredVerifications) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setSelectedCredential(null);
                  setVerificationDetails(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Credential Verification Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Multi-Step Verification</h3>
            <p className="text-sm text-gray-600">
              Credentials require verification from multiple independent verifiers to ensure 
              authenticity and prevent fraud in the contractor qualification process.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Blockchain Storage</h3>
            <p className="text-sm text-gray-600">
              All credentials and verifications are stored on the blockchain, providing 
              immutable proof of contractor qualifications and verification history.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Automated Expiry</h3>
            <p className="text-sm text-gray-600">
              Credentials have built-in expiry dates to ensure contractors maintain 
              current qualifications and certifications for ongoing projects.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Trust Network</h3>
            <p className="text-sm text-gray-600">
              The verifier network creates a distributed trust system where no single 
              entity can manipulate contractor qualifications or verification status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credentials;