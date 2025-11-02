import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserVerificationStatus = () => {
  const { user, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  if (!user || user.role !== 'contractor') {
    return null;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshUser();
      setLastRefresh(new Date());
      
      if (result?.statusChanged) {
        alert(`Your verification status has been updated to: ${result.newStatus ? 'Verified' : 'Unverified'}`);
      }
    } catch (error) {
      console.error('Failed to refresh status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {user.isVerified ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
          <div>
            <p className="font-medium text-gray-900">
              Verification Status: {user.isVerified ? 'Verified' : 'Unverified'}
            </p>
            <p className="text-sm text-gray-600">
              {user.isVerified 
                ? 'You can bid on tenders' 
                : 'You need verification to bid on tenders'
              }
            </p>
            {lastRefresh && (
              <p className="text-xs text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>
      
      {!user.isVerified && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-700">
              If your verification status has changed, click "Refresh Status" to update it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserVerificationStatus;