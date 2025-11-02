import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye,
  Star,
  User,
  Camera,
  Flag,
  Upload
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, PERMISSIONS } from '../contexts/AuthContext';
import { contractorsAPI } from '../services/api';

const QualityAssurance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractors, setContractors] = useState([]);
  
  const { user, hasPermission } = useAuth();

  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [complaint, setComplaint] = useState({
    contractorId: '',
    subject: '',
    description: '',
    category: 'general'
  });
  const [rating, setRating] = useState({
    contractorId: '',
    projectId: '',
    rating: 5,
    feedback: ''
  });
  const [assignedProjects, setAssignedProjects] = useState([]);

  // Load contractors data for quality assurance
  useEffect(() => {
    loadContractors();
  }, []);

  const loadContractors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contractorsAPI.getAllContractors();
      setContractors(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied. Only verifiers and admins can view contractor information.');
      } else {
        setError('Failed to load contractors data');
      }
      console.error('Error loading contractors:', err);
      setContractors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedProjects = async (contractorId) => {
    try {
      // Fetch tenders where this contractor won
      const response = await fetch(`http://localhost:5002/api/tenders/payments/contractor/${contractorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignedProjects(Array.isArray(data) ? data : []);
      } else {
        setAssignedProjects([]);
      }
    } catch (err) {
      console.error('Error loading assigned projects:', err);
      setAssignedProjects([]);
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
    return <LoadingSpinner size="lg" text="Loading quality assurance data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quality Assurance Dashboard</h1>
        <p className="text-gray-600">
          Assess contractor quality, handle complaints, and escalate cases for verification decisions
        </p>

      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Profile Management Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quality Assurance Profile Information</h2>
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <button className="mt-2 text-sm text-primary-600 hover:text-primary-700">
              <Upload className="h-4 w-4 inline mr-1" />
              Upload Photo
            </button>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
            <p className="text-gray-600">{user.organization}</p>
            <div className="mt-2 flex items-center space-x-4">
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-blue-400 mr-1" />
                <span className="text-sm text-gray-600">Quality Assurance</span>
              </div>
              <div className="text-sm text-gray-600">
                Role: {user.role}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Assurance Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowComplaintForm(true)}
          className="flex items-center justify-center p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <Flag className="h-5 w-5 text-orange-600 mr-2" />
          <span className="text-orange-700 font-medium">Handle Complaints</span>
        </button>
        <button
          onClick={() => setShowRatingForm(true)}
          className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Star className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-blue-700 font-medium">Manage Project Ratings</span>
        </button>
      </div>



      {/* Contractor Quality Overview */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Contractor Quality Overview</h2>
          <p className="text-sm text-gray-600">Monitor contractor performance and quality metrics</p>
        </div>
        
        {contractors.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contractors found</h3>
            <p className="text-gray-600">No contractors have registered yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {contractors.map((contractor) => (
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
                          {contractor.isVerified ? 'Quality Approved' : 'Pending Review'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{contractor.organization}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-400">
                          Rating: {contractor.rating || 'N/A'} ⭐
                        </span>
                        <span className="text-xs text-gray-400">
                          Projects: {contractor.completedProjects || 0}
                        </span>
                        <span className="text-xs text-gray-400">
                          Quality Score: {contractor.qualityScore || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors">
                      <Eye className="h-4 w-4 inline mr-1" />
                      Review Quality
                    </button>
                    <button 
                      onClick={() => {
                        alert(`Quality assessment for ${contractor.name} escalated for verification review.`);
                      }}
                      className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded hover:bg-orange-200 transition-colors"
                    >
                      <Shield className="h-4 w-4 inline mr-1" />
                      Escalate for Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complaint Form */}
      {showComplaintForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-medium mb-4">Handle Complaint</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch('http://localhost:5002/api/complaints', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(complaint)
                });

                if (!response.ok) {
                  throw new Error('Failed to submit complaint');
                }

                const data = await response.json();
                const selectedContractor = contractors.find(c => c._id === complaint.contractorId);
                alert(`✅ Complaint submitted successfully!\n\nContractor: ${selectedContractor?.name}\nCategory: ${complaint.category}\n\nThis complaint is now visible to all verifiers and admins.`);
                setShowComplaintForm(false);
                setComplaint({ contractorId: '', subject: '', description: '', category: 'general' });
              } catch (error) {
                alert('❌ Failed to submit complaint: ' + error.message);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Contractor
                </label>
                <select
                  value={complaint.contractorId}
                  onChange={(e) => setComplaint({...complaint, contractorId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Choose a contractor</option>
                  {contractors.map((contractor) => (
                    <option key={contractor._id} value={contractor._id}>
                      {contractor.name} - {contractor.organization}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complaint Category
                </label>
                <select
                  value={complaint.category}
                  onChange={(e) => setComplaint({...complaint, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="general">General Issue</option>
                  <option value="quality">Quality Issue</option>
                  <option value="safety">Safety Concern</option>
                  <option value="compliance">Compliance Issue</option>
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
                  Resolution Notes
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
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Process & Escalate to Certified Verifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rating Management Form */}
      {showRatingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-medium mb-4">Manage Project Rating</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch('http://localhost:5002/api/verification/rate-contractor', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    contractorId: rating.contractorId,
                    rating: rating.rating,
                    feedback: rating.feedback
                  })
                });

                if (!response.ok) {
                  throw new Error('Failed to submit rating');
                }

                const data = await response.json();
                const selectedContractor = contractors.find(c => c._id === rating.contractorId);
                const selectedProject = assignedProjects.find(p => p.tenderId === rating.projectId);
                
                if (rating.rating <= 2) {
                  alert(`✅ Low quality rating (${rating.rating}/5) recorded for ${selectedContractor?.name}.\n\nProject: ${selectedProject?.tenderTitle}\nNew Rating: ${data.newRating}/5\n\nCase escalated to Certified Verifier for potential verification review.`);
                } else {
                  alert(`✅ Quality rating updated for ${selectedContractor?.name}!\n\nProject: ${selectedProject?.tenderTitle}\nRating: ${rating.rating}/5\nNew Average: ${data.newRating}/5`);
                }
                
                setShowRatingForm(false);
                setRating({ contractorId: '', projectId: '', rating: 5, feedback: '' });
                setAssignedProjects([]);
                loadContractors(); // Reload to show updated ratings
              } catch (error) {
                alert('❌ Failed to submit rating: ' + error.message);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Contractor
                </label>
                <select
                  value={rating.contractorId}
                  onChange={(e) => {
                    const contractorId = e.target.value;
                    setRating({...rating, contractorId, projectId: ''});
                    if (contractorId) {
                      loadAssignedProjects(contractorId);
                    } else {
                      setAssignedProjects([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Choose a contractor</option>
                  {contractors.map((contractor) => (
                    <option key={contractor._id} value={contractor._id}>
                      {contractor.name} - {contractor.organization}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Project
                </label>
                <select
                  value={rating.projectId}
                  onChange={(e) => setRating({...rating, projectId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  disabled={!rating.contractorId}
                >
                  <option value="">Select a project</option>
                  {assignedProjects.map((project) => (
                    <option key={project.tenderId} value={project.tenderId}>
                      {project.tenderTitle} - {project.amount} ETH
                    </option>
                  ))}
                </select>
                {rating.contractorId && assignedProjects.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">No assigned projects for this contractor</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Rating
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
                  Quality Assessment
                </label>
                <textarea
                  value={rating.feedback}
                  onChange={(e) => setRating({...rating, feedback: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Provide quality assessment and feedback..."
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Rating & Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityAssurance;
