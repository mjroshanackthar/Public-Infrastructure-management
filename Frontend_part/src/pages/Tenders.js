import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  Users, 
  Eye,
  Award,
  Server,
  CheckCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, PERMISSIONS } from '../contexts/AuthContext';
import { tendersAPI } from '../services/api';

const Tenders = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);
  const [bids, setBids] = useState([]);
  const [showBidForm, setShowBidForm] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const { hasPermission, getUserRole } = useAuth();

  const [newTender, setNewTender] = useState({
    title: '',
    description: '',
    budget: '',
    daysUntilDeadline: '',
    minQualificationScore: 50,
    maxBids: 5
  });

  const [newBid, setNewBid] = useState({
    amount: '',
    estimatedDuration: '',
    proposal: ''
  });

  useEffect(() => {
    loadTenders();
  }, []);

  const loadTenders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await tendersAPI.getAllTenders();
      
      // Handle different response formats for different user roles
      if (Array.isArray(response.data)) {
        // Admin/Verifier response - direct array
        setTenders(response.data);
      } else if (response.data && Array.isArray(response.data.tenders)) {
        // Contractor response - object with tenders array and verification info
        setTenders(response.data.tenders);
        setVerificationStatus({
          canBid: response.data.canBid,
          message: response.data.verificationMessage
        });
      } else {
        setTenders([]);
      }
    } catch (err) {
      setError(`Failed to load tenders: ${err.message}`);
      console.error(err);
      setTenders([]);
    } finally {
      setLoading(false);
    }
  };

  const createTender = async (e) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      setTxHash(null);
      
      const response = await tendersAPI.createTender(newTender);
      if (response.data.txHash) {
        setTxHash(response.data.txHash);
      }
      
      setShowCreateForm(false);
      setNewTender({
        title: '',
        description: '',
        budget: '',
        daysUntilDeadline: '',
        minQualificationScore: 50,
        maxBids: 5
      });
      
      // Reload tenders
      setTimeout(() => loadTenders(), 2000);
    } catch (err) {
      alert(`Failed to create tender: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadTenderBids = async (tenderId) => {
    try {
      const response = await tendersAPI.getTenderBids(tenderId);
      setBids(Array.isArray(response.data) ? response.data : []);
      setSelectedTender(tenderId);
    } catch (err) {
      console.error('Failed to load bids:', err);
      setBids([]);
    }
  };

  const submitBid = async (e) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      setTxHash(null);
      
      const response = await tendersAPI.submitBid(selectedTender, newBid);
      if (response.data.txHash) {
        setTxHash(response.data.txHash);
      }
      
      setShowBidForm(false);
      setNewBid({ amount: '', estimatedDuration: '', proposal: '' });
      
      // Reload bids
      setTimeout(() => loadTenderBids(selectedTender), 2000);
    } catch (err) {
      alert(`Failed to submit bid: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const assignWinner = async (bidId) => {
    try {
      await tendersAPI.assignWinner(selectedTender, { bidId });
      loadTenders();
      loadTenderBids(selectedTender);
    } catch (err) {
      alert('Failed to assign winner: ' + (err.response?.data?.error || err.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-success-100 text-success-800';
      case 'Awarded': return 'bg-primary-100 text-primary-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading tenders..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getUserRole() === 'admin' ? 'Tender Management' : 'Available Tenders'}
          </h1>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600">
              {getUserRole() === 'admin' 
                ? 'Create and manage building project tenders, review bids, and assign winners'
                : 'View and bid on available building project tenders'
              }
            </p>
            <div className="flex items-center px-2 py-1 bg-primary-100 rounded text-xs">
              <Server className="h-3 w-3 mr-1 text-primary-600" />
              <span className="text-primary-600">Backend Managed</span>
            </div>
          </div>
        </div>
        {hasPermission(PERMISSIONS.CREATE_TENDER) && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Tender
          </button>
        )}
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Contractor Verification Status */}
      {getUserRole() === 'contractor' && verificationStatus && (
        <div className={`px-4 py-3 rounded ${
          verificationStatus.canBid 
            ? 'bg-success-50 border border-success-200 text-success-700'
            : 'bg-warning-50 border border-warning-200 text-warning-700'
        }`}>
          <div className="flex items-center">
            {verificationStatus.canBid ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <AlertTriangle className="h-4 w-4 mr-2" />
            )}
            <span className="text-sm font-medium">
              {verificationStatus.message}
            </span>
          </div>
        </div>
      )}

      {/* Transaction Hash Display */}
      {txHash && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">
              Transaction submitted: 
              <a 
                href={`https://etherscan.io/tx/${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 underline hover:no-underline font-mono"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </span>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            <span className="text-sm">
              Processing blockchain transaction...
            </span>
          </div>
        </div>
      )}

      {/* Admin Statistics */}
      {getUserRole() === 'admin' && Array.isArray(tenders) && tenders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{tenders.length}</p>
                <p className="text-sm text-gray-600">Total Tenders</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tenders.filter(t => t.status === 'Open').length}
                </p>
                <p className="text-sm text-gray-600">Open Tenders</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tenders.filter(t => t.status === 'Awarded').length}
                </p>
                <p className="text-sm text-gray-600">Awarded</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tenders.reduce((total, t) => total + (t.bids?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Bids</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded">
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">
            Backend managing blockchain interactions securely
          </span>
        </div>
      </div>

      {/* Create Tender Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-medium mb-4">Create New Tender</h2>
            <form onSubmit={createTender} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newTender.title}
                  onChange={(e) => setNewTender({...newTender, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTender.description}
                  onChange={(e) => setNewTender({...newTender, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTender.budget}
                    onChange={(e) => setNewTender({...newTender, budget: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Days Until Deadline
                  </label>
                  <input
                    type="number"
                    value={newTender.daysUntilDeadline}
                    onChange={(e) => setNewTender({...newTender, daysUntilDeadline: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Creating...' : 'Create Tender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenders List */}
      <div className="grid gap-6">
        {!Array.isArray(tenders) || tenders.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenders found</h3>
            <p className="text-gray-600">Create your first tender to get started</p>
          </div>
        ) : (
          tenders.map((tender) => (
            <div key={tender._id} className={`p-6 rounded-lg shadow-sm border ${
              tender.status === 'Awarded' && getUserRole() === 'contractor' 
                ? 'bg-gray-50 border-gray-300' 
                : 'bg-white'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-lg font-medium ${
                      tender.status === 'Awarded' && getUserRole() === 'contractor'
                        ? 'text-gray-500'
                        : 'text-gray-900'
                    }`}>
                      {tender.title}
                    </h3>
                    {tender.status === 'Awarded' && getUserRole() === 'contractor' && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center">
                        <Award className="h-3 w-3 mr-1" />
                        Assigned
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 ${
                    tender.status === 'Awarded' && getUserRole() === 'contractor'
                      ? 'text-gray-500'
                      : 'text-gray-600'
                  }`}>
                    {tender.description}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tender.status)}`}>
                  {tender.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Budget - Hidden from contractors */}
                {getUserRole() !== 'contractor' && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Budget: {tender.budget} ETH</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    Deadline: {new Date(tender.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Bids: {tender.bids?.length || 0}</span>
                </div>
              </div>

              {/* Admin-only additional details */}
              {getUserRole() === 'admin' && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">Admin Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-blue-600">Created:</span> {new Date(tender.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-blue-600">Creator:</span> {tender.creator?.name || 'System'}
                    </div>
                    <div>
                      <span className="text-blue-600">Max Bids:</span> {tender.maxBids}
                    </div>
                  </div>
                  {tender.winningBid && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <span className="text-blue-600 text-xs">Winner Assigned:</span>
                      <span className="text-xs ml-1">Bid ID {tender.winningBid}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => loadTenderBids(tender._id)}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </button>
                
                {/* Admin-specific actions */}
                {getUserRole() === 'admin' && (
                  <>
                    {tender.status === 'Open' && (
                      <button
                        onClick={() => loadTenderBids(tender._id)}
                        className="flex items-center px-3 py-1 text-sm bg-success-100 text-success-700 rounded hover:bg-success-200"
                      >
                        <Award className="h-4 w-4 mr-1" />
                        Manage Bids
                      </button>
                    )}
                    {tender.status === 'Awarded' && (
                      <>
                        <span className="flex items-center px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Winner Assigned
                        </span>
                        {tender.paymentStatus === 'Pending' && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Process payment of ${tender.paymentAmount || tender.budget} ETH to the winning contractor?`)) {
                                try {
                                  setIsProcessing(true);
                                  const response = await fetch(`http://localhost:5002/api/tenders/${tender._id}/process-payment`, {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                                      'Content-Type': 'application/json'
                                    }
                                  });
                                  
                                  if (!response.ok) {
                                    throw new Error('Payment processing failed');
                                  }
                                  
                                  const data = await response.json();
                                  alert('Payment processed successfully!');
                                  setTxHash(data.payment.transactionHash);
                                  loadTenders(); // Reload tenders to show updated status
                                } catch (err) {
                                  alert('Failed to process payment: ' + err.message);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }
                            }}
                            disabled={isProcessing}
                            className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Process Payment
                          </button>
                        )}
                        {tender.paymentStatus === 'Completed' && (
                          <span className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Payment Completed
                          </span>
                        )}
                      </>
                    )}
                  </>
                )}
                
                {/* Contractor-specific actions */}
                {getUserRole() === 'contractor' && (
                  <>
                    {/* Show "Assigned to Other" for awarded tenders */}
                    {tender.status === 'Awarded' && (
                      <span className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded">
                        <Award className="h-4 w-4 mr-1" />
                        Assigned to Other Contractor
                      </span>
                    )}
                    
                    {/* Show bid button only for Open tenders */}
                    {tender.status === 'Open' && hasPermission(PERMISSIONS.SUBMIT_BID) && (
                      verificationStatus?.canBid ? (
                        <button
                          onClick={() => {
                            setSelectedTender(tender._id);
                            setShowBidForm(true);
                          }}
                          className="flex items-center px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Submit Bid
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-500 rounded cursor-not-allowed"
                          title="Complete verification to submit bids"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Verification Required
                        </button>
                      )
                    )}
                    
                    {/* Show closed status for closed tenders */}
                    {tender.status === 'Closed' && (
                      <span className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-500 rounded">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Tender Closed
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Bids Section */}
              {selectedTender === tender._id && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">
                      {getUserRole() === 'admin' ? 'Bid Management' : 'Submitted Bids'}
                    </h4>
                    {getUserRole() === 'admin' && (
                      <div className="text-sm text-gray-600">
                        Total Bids: {bids.length} | Status: {tender.status}
                      </div>
                    )}
                  </div>
                  
                  {Array.isArray(bids) && bids.length > 0 ? (
                    <div className="space-y-4">
                      {bids.map((bid, bidIndex) => (
                        <div key={bid._id || bidIndex} className={`p-4 rounded-lg border ${bid.isWinner ? 'bg-success-50 border-success-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="font-medium text-lg">{bid.bidder?.name || `Contractor #${bidIndex + 1}`}</p>
                                {bid.isWinner && (
                                  <span className="px-2 py-1 bg-success-600 text-white text-xs rounded-full">
                                    Winner
                                  </span>
                                )}
                              </div>
                              
                              {getUserRole() === 'admin' && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Bid Amount</p>
                                    <p className="text-sm font-medium">{bid.amount} ETH</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                                    <p className="text-sm font-medium">{bid.estimatedDuration} days</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Organization</p>
                                    <p className="text-sm font-medium">{bid.bidder?.organization || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Rating</p>
                                    <p className="text-sm font-medium">{bid.bidder?.rating || 'N/A'} ⭐</p>
                                  </div>
                                </div>
                              )}
                              
                              {getUserRole() !== 'admin' && (
                                <div className="space-y-1 mb-3">
                                  <p className="text-sm text-gray-600">Amount: {bid.amount} ETH</p>
                                  <p className="text-sm text-gray-600">Duration: {bid.estimatedDuration} days</p>
                                  {bid.bidder?.organization && (
                                    <p className="text-sm text-gray-500">Organization: {bid.bidder.organization}</p>
                                  )}
                                </div>
                              )}
                              
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Proposal</p>
                                <p className="text-sm text-gray-700">{bid.proposal}</p>
                              </div>
                              
                              {getUserRole() === 'admin' && bid.bidder && (
                                <div className="text-xs text-gray-500">
                                  Submitted: {new Date(bid.submittedAt).toLocaleString()} | 
                                  Wallet: {bid.bidder.walletAddress?.slice(0, 10)}...
                                </div>
                              )}
                            </div>
                            
                            {getUserRole() === 'admin' && tender.status === 'Open' && !bid.isWinner && (
                              <button
                                onClick={() => assignWinner(bid._id)}
                                className="ml-4 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
                              >
                                <Award className="h-4 w-4 mr-1 inline" />
                                Approve & Assign
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No bids submitted yet</p>
                      {getUserRole() === 'admin' && (
                        <p className="text-sm">Contractors will be able to submit bids for this tender</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bid Form Modal */}
      {showBidForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-medium mb-4">Submit Bid</h2>
            <form onSubmit={submitBid} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bid Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  value={newBid.amount}
                  onChange={(e) => setNewBid({...newBid, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Minimum bid amount: 50 ETH</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (days)
                </label>
                <input
                  type="number"
                  value={newBid.estimatedDuration}
                  onChange={(e) => setNewBid({...newBid, estimatedDuration: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proposal
                </label>
                <textarea
                  value={newBid.proposal}
                  onChange={(e) => setNewBid({...newBid, proposal: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="4"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBidForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Submitting...' : 'Submit Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenders;