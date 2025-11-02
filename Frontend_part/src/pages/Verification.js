import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Star,
  AlertTriangle,
  FileText,
  User,
  Camera,
  MessageSquare,
  Flag,
  Upload,
  StarIcon
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, PERMISSIONS } from '../contexts/AuthContext';
import { useContractors } from '../contexts/ContractorContext';

const Verification = () => {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [myRequest, setMyRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const { user, hasPermission, refreshUser } = useAuth();
  const { contractors: allContractors, updateContractorStatus, getStats, loadContractors } = useContractors();

  const [newRequest, setNewRequest] = useState({
    credentials: [
      { type: 'license', title: '', issuer: '', issueDate: '', expiryDate: '' }
    ],
    verificationNotes: '',
    profilePhoto: null,
    documents: []
  });

  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [complaint, setComplaint] = useState({
    subject: '',
    description: '',
    category: 'general'
  });
  const [rating, setRating] = useState({
    projectId: '',
    rating: 5,
    feedback: ''
  });

  const [statusNotification, setStatusNotification] = useState(null);

  const [reviewData, setReviewData] = useState({
    status: 'approved',
    verificationNotes: '',
    rejectionReason: ''
  });

  useEffect(() => {
    loadData();
    
    // For contractors, periodically refresh user data to check verification status
    let refreshInterval;
    if (user?.role === 'contractor') {
      refreshInterval = setInterval(async () => {
        const result = await refreshUser();
        if (result?.statusChanged) {
          setStatusNotification({
            type: result.newStatus ? 'success' : 'warning',
            message: result.newStatus 
              ? 'Great news! You have been verified and can now bid on tenders.'
              : 'Your verification status has been updated. Please check your status below.'
          });
          setTimeout(() => setStatusNotification(null), 8000);
        }
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [user?.role, refreshUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading verification data...');
      
      if (hasPermission(PERMISSIONS.VERIFY_CREDENTIALS)) {
        console.log('Loading data for verifier...');
        
        // Load verification requests for verifiers
        const response = await fetch('http://localhost:5002/api/verification/requests', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const data = await response.json();
        console.log('Verification requests:', data);
        setVerificationRequests(Array.isArray(data) ? data : []);

        // Load contractors using the context
        await loadContractors();
      }

      if (user?.role === 'contractor') {
        console.log('Loading data for contractor...');
        
        // Load contractor's own request
        const response = await fetch('http://localhost:5002/api/verification/my-request', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Contractor request:', data);
          setMyRequest(data);
        }
      }
    } catch (err) {
      setError('Failed to load verification data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitVerificationRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5002/api/verification/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(newRequest)
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowSubmitForm(false);
        setMyRequest(data.request);
        alert('Verification request submitted successfully!');
      } else {
        alert(data.message || 'Failed to submit verification request');
      }
    } catch (err) {
      alert('Failed to submit verification request');
    }
  };

  const reviewRequest = async (requestId, status) => {
    try {
      const response = await fetch(`http://localhost:5002/api/verification/review/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          status,
          verificationNotes: reviewData.verificationNotes,
          rejectionReason: status === 'rejected' ? reviewData.rejectionReason : undefined
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        loadData();
        setSelectedRequest(null);
        alert(`Request ${status} successfully!`);
      } else {
        alert(data.message || 'Failed to review request');
      }
    } catch (err) {
      alert('Failed to review request');
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

  const addCredential = () => {
    setNewRequest({
      ...newRequest,
      credentials: [
        ...newRequest.credentials,
        { type: 'certification', title: '', issuer: '', issueDate: '', expiryDate: '' }
      ]
    });
  };

  const updateCredential = (index, field, value) => {
    const updatedCredentials = [...newRequest.credentials];
    updatedCredentials[index][field] = value;
    setNewRequest({ ...newRequest, credentials: updatedCredentials });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'under_review': return 'text-blue-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'under_review': return <Eye className="h-5 w-5 text-blue-600" />;
      default: return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading verification data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Contractor Profile & Verification
        </h1>
        <p className="text-gray-600">
          Manage your profile, verification status, and interact with the platform
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Status Change Notification */}
      {statusNotification && (
        <div className={`px-4 py-3 rounded-lg border ${
          statusNotification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-700'
        }`}>
          <div className="flex items-center">
            {statusNotification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-2" />
            )}
            <span>{statusNotification.message}</span>
          </div>
        </div>
      )}

      {/* Contractor View */}
      {user?.role === 'contractor' && (
        <div className="space-y-6">

          {/* Verification Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Verification Status</h2>
              <button
                onClick={async () => {
                  const result = await refreshUser();
                  if (result?.statusChanged) {
                    setStatusNotification({
                      type: result.newStatus ? 'success' : 'warning',
                      message: result.newStatus 
                        ? 'Congratulations! You have been verified and can now bid on tenders.'
                        : 'Your verification status has been revoked. Please contact support if you believe this is an error.'
                    });
                    setTimeout(() => setStatusNotification(null), 5000);
                  }
                }}
                className="flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-md hover:bg-primary-50"
              >
                <Clock className="h-4 w-4 mr-1" />
                Refresh Status
              </button>
            </div>
            
            {user.isVerified ? (
              <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-green-900">Verified Contractor</h3>
                  <p className="text-sm text-green-700">
                    You are verified and can bid on tenders
                  </p>
                </div>
              </div>
            ) : myRequest ? (
              <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                {getStatusIcon(myRequest.status)}
                <div className="ml-3">
                  <h3 className="font-medium text-yellow-900">
                    Request {myRequest.status.replace('_', ' ')}
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Submitted on {new Date(myRequest.submittedAt).toLocaleDateString()}
                  </p>
                  {myRequest.verificationNotes && (
                    <p className="text-sm text-yellow-700 mt-1">
                      Notes: {myRequest.verificationNotes}
                    </p>
                  )}
                  {myRequest.rejectionReason && (
                    <p className="text-sm text-red-700 mt-1">
                      Rejection reason: {myRequest.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900">Not Verified</h3>
                  <p className="text-sm text-red-700">
                    You need to submit verification request to bid on tenders
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmitForm(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Submit Request
                </button>
              </div>
            )}
          </div>

          {/* Complaint Form */}
          {showComplaintForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h2 className="text-lg font-medium mb-4">File a Complaint</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Handle complaint submission
                  alert('Complaint submitted successfully!');
                  setShowComplaintForm(false);
                  setComplaint({ subject: '', description: '', category: 'general' });
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={complaint.category}
                      onChange={(e) => setComplaint({...complaint, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="general">General Issue</option>
                      <option value="payment">Payment Issue</option>
                      <option value="project">Project Related</option>
                      <option value="platform">Platform Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={complaint.subject}
                      onChange={(e) => setComplaint({...complaint, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={complaint.description}
                      onChange={(e) => setComplaint({...complaint, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="4"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowComplaintForm(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Submit Complaint
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Rating Form */}
          {showRatingForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h2 className="text-lg font-medium mb-4">Rate Your Experience</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Handle rating submission
                  alert('Rating submitted successfully!');
                  setShowRatingForm(false);
                  setRating({ projectId: '', rating: 5, feedback: '' });
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project
                    </label>
                    <select
                      value={rating.projectId}
                      onChange={(e) => setRating({...rating, projectId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select a project</option>
                      <option value="project1">City Bridge Construction</option>
                      <option value="project2">Municipal Building Renovation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating({...rating, rating: star})}
                          className={`p-1 ${star <= rating.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          <Star className="h-6 w-6 fill-current" />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({rating.rating}/5)</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback
                    </label>
                    <textarea
                      value={rating.feedback}
                      onChange={(e) => setRating({...rating, feedback: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                      placeholder="Share your experience..."
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowRatingForm(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                    >
                      Submit Rating
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Submit Verification Form */}
          {showSubmitForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <h2 className="text-lg font-medium mb-4">Submit Verification Request</h2>
                <form onSubmit={submitVerificationRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credentials
                    </label>
                    {newRequest.credentials.map((credential, index) => (
                      <div key={index} className="border border-gray-200 rounded p-4 mb-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Type</label>
                            <select
                              value={credential.type}
                              onChange={(e) => updateCredential(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              required
                            >
                              <option value="license">License</option>
                              <option value="certification">Certification</option>
                              <option value="insurance">Insurance</option>
                              <option value="bond">Bond</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Title</label>
                            <input
                              type="text"
                              value={credential.title}
                              onChange={(e) => updateCredential(index, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Issuer</label>
                            <input
                              type="text"
                              value={credential.issuer}
                              onChange={(e) => updateCredential(index, 'issuer', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Issue Date</label>
                            <input
                              type="date"
                              value={credential.issueDate}
                              onChange={(e) => updateCredential(index, 'issueDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCredential}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      + Add Another Credential
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={newRequest.verificationNotes}
                      onChange={(e) => setNewRequest({...newRequest, verificationNotes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      rows="3"
                      placeholder="Any additional information about your credentials..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowSubmitForm(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Redirect verifiers to the dedicated Verifier page */}
      {user?.role === 'verifier' && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-primary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Verifier Access</h3>
          <p className="text-gray-600 mb-4">
            Contractor verification management has been moved to the dedicated Verifier page.
          </p>
          <a
            href="/verifier"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <Shield className="h-4 w-4 mr-2" />
            Go to Verifier Page
          </a>
        </div>
      )}
    </div>
  );
};

export default Verification;