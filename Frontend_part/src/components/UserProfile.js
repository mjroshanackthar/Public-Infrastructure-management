import React, { useState } from 'react';
import { User, LogOut, Settings, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, getUserRole, isVerified, systemStatus } = useAuth();

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'verifier': return 'bg-blue-100 text-blue-800';
      case 'contractor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationStatus = () => {
    if (getUserRole() === 'contractor') {
      return isVerified() ? (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          <span className="text-xs">Verified</span>
        </div>
      ) : (
        <div className="flex items-center text-yellow-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span className="text-xs">Pending</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">{user?.name}</div>
          <div className="text-xs text-gray-500 capitalize">{getUserRole()}</div>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-20">
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{user?.name}</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(getUserRole())}`}>
                      {getUserRole()}
                    </span>
                    {getVerificationStatus()}
                  </div>
                </div>
              </div>
              
              {user?.organization && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Organization:</strong> {user.organization}
                </div>
              )}
            </div>

            {/* System Status */}
            <div className="p-4 border-b">
              <div className="text-sm font-medium text-gray-900 mb-2">System Status</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Server</span>
                  <div className={`flex items-center ${
                    systemStatus?.server === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div className={`h-2 w-2 rounded-full mr-1 ${
                      systemStatus?.server === 'active' ? 'bg-green-600' : 'bg-red-600'
                    }`} />
                    {systemStatus?.server === 'active' ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Blockchain</span>
                  <div className={`flex items-center ${
                    systemStatus?.blockchain === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div className={`h-2 w-2 rounded-full mr-1 ${
                      systemStatus?.blockchain === 'active' ? 'bg-green-600' : 'bg-red-600'
                    }`} />
                    {systemStatus?.blockchain === 'active' ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
                {systemStatus?.network && (
                  <div className="flex items-center justify-between text-xs">
                    <span>Network</span>
                    <span className="text-gray-600">{systemStatus.network}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Add profile settings functionality
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Settings className="h-4 w-4 mr-3" />
                Profile Settings
              </button>
              
              {getUserRole() === 'contractor' && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Add verification status functionality
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <Shield className="h-4 w-4 mr-3" />
                  Verification Status
                </button>
              )}
              
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;