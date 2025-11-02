import React, { useState, useEffect } from 'react';
import { 
  Flag, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  User,
  Calendar,
  RefreshCw,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  const { getUserRole, user } = useAuth();

  // Check if user is Quality Assurance
  const isQualityAssurance = () => {
    return getUserRole() === 'verifier' && 
           (user?.organization?.includes('Quality Assurance') || 
            user?.name?.includes('Quality Assurance'));
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5002/api/complaints', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load complaints');
      }

      const data = await response.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('Load complaints error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId, status, resolutionNotes) => {
    try {
      const response = await fetch(`http://localhost:5002/api/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, resolutionNotes })
      });

      if (!response.ok) {
        throw new Error('Failed to update complaint status');
      }

      alert('✅ Complaint status updated successfully!');
      loadComplaints();
      setSelectedComplaint(null);
    } catch (err) {
      alert('❌ Failed to update complaint: ' + err.message);
    }
  };

  const deleteComplaint = async (complaintId, contractorName) => {
    if (!window.confirm(`Are you sure you want to permanently delete this complaint about ${contractorName}?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5002/api/complaints/${complaintId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete complaint');
      }

      alert('✅ Complaint deleted successfully!');
      loadComplaints();
    } catch (err) {
      alert('❌ Failed to delete complaint: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'quality': return 'bg-orange-100 text-orange-800';
      case 'safety': return 'bg-red-100 text-red-800';
      case 'compliance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStats = () => {
    return {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      underReview: complaints.filter(c => c.status === 'under_review').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      escalated: complaints.filter(c => c.status === 'escalated').length
    };
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading complaints..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaints Management</h1>
          <p className="text-gray-600">
            View and manage contractor complaints submitted by Quality Assurance team
          </p>
        </div>
        <button
          onClick={loadComplaints}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Flag className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{getStats().total}</p>
              <p className="text-sm text-gray-600">Total Complaints</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{getStats().pending}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{getStats().underReview}</p>
              <p className="text-sm text-gray-600">Under Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{getStats().resolved}</p>
              <p className="text-sm text-gray-600">Resolved</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Flag className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{getStats().escalated}</p>
              <p className="text-sm text-gray-600">Escalated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Complaints</h2>
        </div>

        {complaints.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints yet</h3>
            <p className="text-gray-600">Complaints submitted by Quality Assurance will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {complaints.map((complaint) => (
              <div key={complaint._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{complaint.subject}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(complaint.category)}`}>
                        {complaint.category.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{complaint.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>Contractor: {complaint.contractorId?.name}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>Submitted by: {complaint.submittedBy?.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Date: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {complaint.resolutionNotes && (
                      <div className="mt-3 p-3 bg-green-50 rounded">
                        <p className="text-sm font-medium text-green-900">Resolution Notes:</p>
                        <p className="text-sm text-green-700">{complaint.resolutionNotes}</p>
                        {complaint.resolvedBy && (
                          <p className="text-xs text-green-600 mt-1">
                            Resolved by: {complaint.resolvedBy.name} on {new Date(complaint.resolvedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons - Only for Quality Assurance */}
                  {isQualityAssurance() && (
                    <div className="ml-4 flex flex-col space-y-2">
                      {complaint.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              const notes = prompt('Enter resolution notes:');
                              if (notes) {
                                updateComplaintStatus(complaint._id, 'under_review', notes);
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Enter escalation reason:');
                              if (notes) {
                                updateComplaintStatus(complaint._id, 'escalated', notes);
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Escalate
                          </button>
                        </>
                      )}
                      {complaint.status === 'under_review' && (
                        <button
                          onClick={() => {
                            const notes = prompt('Enter resolution notes:');
                            if (notes) {
                              updateComplaintStatus(complaint._id, 'resolved', notes);
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  )}

                  {/* Delete button - Only for Admins */}
                  {getUserRole() === 'admin' && (
                    <div className="ml-4">
                      <button
                        onClick={() => deleteComplaint(complaint._id, complaint.contractorId?.name)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">About Complaints</h3>
        <p className="text-sm text-blue-700">
          This page shows all complaints submitted by the Quality Assurance team. 
          Complaints are visible to Quality Verifiers, Certificate Verifiers, and Admins only. 
          Contractors cannot see these complaints. You can review, escalate, or resolve complaints as needed.
        </p>
      </div>
    </div>
  );
};

export default Complaints;