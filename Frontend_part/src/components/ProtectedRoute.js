import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Lock } from 'lucide-react';

const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requireAll = false,
  fallback = null 
}) => {
  const { isAuthenticated, hasPermission, hasAnyPermission, hasAllPermissions, user } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-64 p-8">
        <Lock className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
        <p className="text-gray-600 text-center">
          Please log in to access this feature.
        </p>
      </div>
    );
  }

  // Check permissions if specified
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return fallback || (
        <div className="flex flex-col items-center justify-center min-h-64 p-8">
          <AlertTriangle className="h-16 w-16 text-warning-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 text-center mb-4">
            You don't have permission to access this feature.
          </p>
          <div className="bg-gray-100 px-4 py-2 rounded-md">
            <p className="text-sm text-gray-600">
              Current role: <span className="font-medium capitalize">{user?.role}</span>
            </p>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;