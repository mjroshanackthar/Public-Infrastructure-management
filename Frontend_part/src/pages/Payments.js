import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  FileText,
  ExternalLink,
  Calendar,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import { sendDirectPayment } from '../services/contractService';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false); // Toggle to show/hide completed
  const { user, getUserRole } = useAuth();
  const { signer, isConnected, account, updateBalance } = useWeb3();

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Wait for user to be loaded
      if (!user) {
        console.log('User not loaded yet, waiting...');
        setLoading(false);
        return;
      }

      // Get user ID - try different possible properties
      const userId = user.id || user._id || user.userId;
      
      if (!userId && getUserRole() !== 'admin') {
        throw new Error('User ID not found. Please try logging in again.');
      }
      
      const endpoint = getUserRole() === 'admin' 
        ? 'http://localhost:5002/api/tenders/payments/all'
        : `http://localhost:5002/api/tenders/payments/contractor/${userId}`;
      
      console.log('Loading payments from:', endpoint);
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to load payments');
      }

      const data = await response.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('Load payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const processPaymentWithMetaMask = async (payment) => {
    // Check if MetaMask is connected
    if (!isConnected) {
      alert('⚠️ Please connect your MetaMask wallet first!\n\nLook for the "Connect MetaMask" button at the top of the page.');
      return;
    }

    // Get contractor wallet address
    const contractorWallet = payment.contractorWallet || payment.contractor?.walletAddress;
    
    // Validate wallet address
    if (!contractorWallet) {
      alert('❌ Error: Contractor wallet address not found!\n\nThe contractor may not have set up their wallet address yet.');
      console.error('Payment data:', payment);
      return;
    }

    // Confirm payment
    if (!window.confirm(
      `🦊 Process Payment via MetaMask\n\n` +
      `Tender: ${payment.tenderTitle}\n` +
      `Contractor: ${payment.contractor?.name || 'Unknown'}\n` +
      `Amount: ${payment.amount} ETH\n` +
      `To: ${contractorWallet}\n\n` +
      `This will send real ETH from your connected wallet.\n` +
      `Continue?`
    )) {
      return;
    }

    try {
      setProcessingPayment(true);
      
      console.log('🔄 Processing payment via MetaMask...');
      console.log('From:', account);
      console.log('To:', contractorWallet);
      console.log('Amount:', payment.amount, 'ETH');

      // Send ETH via MetaMask
      const result = await sendDirectPayment(signer, contractorWallet, payment.amount);

      if (!result.success) {
        throw new Error(result.error || 'Transaction failed');
      }

      console.log('✅ Transaction successful:', result.hash);

      // Update backend with transaction hash
      const response = await fetch(`http://localhost:5002/api/tenders/${payment.tenderId}/process-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionHash: result.hash,
          blockNumber: result.blockNumber
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Backend update failed:', errorData.message);
        // Don't throw error - transaction was successful
      }

      // Update balance
      if (updateBalance) {
        await updateBalance();
      }

      alert(
        '✅ Payment Processed Successfully!\n\n' +
        `Transaction Hash: ${result.hash}\n` +
        `Block: ${result.blockNumber}\n\n` +
        `${payment.amount} ETH sent to ${payment.contractor?.name}`
      );

      // Reload payments
      loadPayments();
    } catch (err) {
      console.error('❌ Payment failed:', err);
      
      let errorMessage = err.message;
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user';
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient ETH balance in your wallet';
      }
      
      alert('❌ Payment Failed!\n\n' + errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  const deletePaymentHistory = async (tenderId, tenderTitle) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to permanently delete payment history for "${tenderTitle}"?\n\nThis will:\n- Remove all payment records\n- Clear transaction history\n- Cannot be undone\n\nType YES to confirm.`)) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm:');
    if (confirmation !== 'DELETE') {
      alert('Deletion cancelled');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5002/api/tenders/${tenderId}/payment`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete payment history');
      }

      alert('✅ Payment history deleted successfully!');
      loadPayments(); // Reload the list
    } catch (err) {
      alert('❌ Failed to delete payment history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayStatus = (payment) => {
    // For contractors, show "Approved" instead of "Pending" when tender is assigned
    if (getUserRole() === 'contractor' && payment.paymentStatus === 'Pending') {
      return 'Approved';
    }
    return payment.paymentStatus || 'Pending';
  };

  const getTotalEarnings = () => {
    return payments
      .filter(p => p.paymentStatus === 'Completed')
      .reduce((total, p) => total + parseFloat(p.amount || 0), 0)
      .toFixed(4);
  };

  const getPendingAmount = () => {
    return payments
      .filter(p => p.paymentStatus === 'Pending')
      .reduce((total, p) => total + parseFloat(p.amount || 0), 0)
      .toFixed(4);
  };

  // Filter payments based on toggle (admin only)
  const getFilteredPayments = () => {
    // Contractors always see all payments
    if (getUserRole() === 'contractor') {
      return payments;
    }
    
    // Admin can toggle
    if (showCompleted) {
      return payments; // Show all
    }
    return payments.filter(p => p.paymentStatus !== 'Completed'); // Hide completed
  };

  const autoRemoveCompleted = async () => {
    if (!window.confirm('🗑️ Auto-Remove Completed Payments?\n\nThis will permanently delete all completed payment records.\n\nContinue?')) {
      return;
    }

    try {
      setLoading(true);
      const completedPayments = payments.filter(p => p.paymentStatus === 'Completed');
      
      for (const payment of completedPayments) {
        await fetch(`http://localhost:5002/api/tenders/${payment.tenderId}/payment`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
      }

      alert(`✅ Removed ${completedPayments.length} completed payment(s)`);
      loadPayments();
    } catch (err) {
      alert('❌ Failed to remove completed payments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading payments..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getUserRole() === 'admin' ? 'Payment Management' : 'My Payments'}
        </h1>
        <p className="text-gray-600">
          {getUserRole() === 'admin' 
            ? 'View and manage all contractor payments'
            : 'Track your earnings from awarded tenders'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                {getUserRole() === 'admin' ? 'Debited' : 'Credited'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{getTotalEarnings()} ETH</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{getPendingAmount()} ETH</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Payment History</h2>
            
            {/* Admin-only controls */}
            {getUserRole() === 'admin' && (
              <div className="flex items-center space-x-4">
                {/* Toggle to show/hide completed */}
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-600">Show Completed</span>
                </label>

                {/* Auto-remove button for admin */}
                {payments.filter(p => p.paymentStatus === 'Completed').length > 0 && (
                  <button
                    onClick={autoRemoveCompleted}
                    className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove All Completed ({payments.filter(p => p.paymentStatus === 'Completed').length})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {getFilteredPayments().length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {payments.length === 0 ? 'No payments yet' : 'No pending payments'}
            </h3>
            <p className="text-gray-600">
              {payments.length === 0 ? (
                getUserRole() === 'admin' 
                  ? 'Payments will appear here once tenders are awarded'
                  : 'Win tenders to start earning'
              ) : (
                'All payments have been completed. Toggle "Show Completed" to view them.'
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {getFilteredPayments().map((payment, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{payment.tenderTitle}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getDisplayStatus(payment))}`}>
                        {getDisplayStatus(payment)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span>Amount: {payment.amount} ETH</span>
                      </div>
                      
                      {payment.awardedAt && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Awarded: {new Date(payment.awardedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {payment.paymentDate && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>Paid: {new Date(payment.paymentDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {getUserRole() === 'admin' && payment.contractor && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Contractor:</span> {payment.contractor.name} ({payment.contractor.organization})
                      </div>
                    )}

                    {payment.transactionHash && (
                      <div className="mt-2">
                        <a
                          href={`https://etherscan.io/tx/${payment.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Transaction
                        </a>
                      </div>
                    )}
                  </div>

                  {getUserRole() === 'admin' && payment.paymentStatus === 'Pending' && (
                    <button
                      onClick={() => processPaymentWithMetaMask(payment)}
                      disabled={processingPayment || !isConnected}
                      className={`ml-4 px-4 py-2 rounded-md flex items-center ${
                        processingPayment || !isConnected
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                      title={!isConnected ? 'Connect MetaMask first' : 'Process payment via MetaMask'}
                    >
                      {processingPayment ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4 mr-2" />
                          {isConnected ? 'Pay with MetaMask' : 'Connect Wallet'}
                        </>
                      )}
                    </button>
                  )}

                  {/* Delete button for both admin and contractor */}
                  {(getUserRole() === 'admin' || getUserRole() === 'contractor') && (
                    <button
                      onClick={() => deletePaymentHistory(payment.tenderId, payment.tenderTitle)}
                      className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                      title="Remove this payment from history"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {getUserRole() === 'admin' ? 'Delete History' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">About Payments</h3>
        <p className="text-sm text-blue-700">
          {getUserRole() === 'admin' 
            ? 'When you assign a winner to a tender, you can process the payment to transfer ETH directly to the contractor\'s wallet address via smart contract.'
            : 'When you win a tender, the admin will process the payment and ETH will be transferred directly to your wallet address via smart contract. Make sure your wallet address is correctly set in your profile.'
          }
        </p>
      </div>
    </div>
  );
};

export default Payments;