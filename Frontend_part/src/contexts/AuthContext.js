import React, { createContext, useContext, useState, useEffect } from 'react';
import { systemAPI } from '../services/api';

const AuthContext = createContext();

// Define permissions for different roles
export const PERMISSIONS = {
  // Admin permissions
  MANAGE_VERIFIERS: 'manage_verifiers',
  VIEW_ALL_TENDERS: 'view_all_tenders',
  CREATE_TENDER: 'create_tender',
  ASSIGN_TENDER: 'assign_tender',
  VIEW_AUDIT_TRAIL: 'view_audit_trail',
  MANAGE_SYSTEM: 'manage_system',
  
  // Verifier permissions
  VERIFY_CREDENTIALS: 'verify_credentials',
  VIEW_PENDING_VERIFICATIONS: 'view_pending_verifications',
  
  // Contractor permissions
  SUBMIT_BID: 'submit_bid',
  MANAGE_PROFILE: 'manage_profile',
  UPLOAD_CREDENTIALS: 'upload_credentials',
  VIEW_MY_BIDS: 'view_my_bids',
  
  // Common permissions
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_TENDERS: 'view_tenders',
  VIEW_CONTRACTORS: 'view_contractors',
  VIEW_CREDENTIALS: 'view_credentials',
  VIEW_SYSTEM_STATUS: 'view_system_status'
};

// Role-based permission mapping
const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.MANAGE_VERIFIERS,
    PERMISSIONS.VIEW_ALL_TENDERS,
    PERMISSIONS.CREATE_TENDER,
    PERMISSIONS.ASSIGN_TENDER,
    PERMISSIONS.VIEW_AUDIT_TRAIL,
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TENDERS,
    PERMISSIONS.VIEW_CONTRACTORS,
    PERMISSIONS.VIEW_CREDENTIALS,
    PERMISSIONS.VIEW_SYSTEM_STATUS
  ],
  verifier: [
    PERMISSIONS.VERIFY_CREDENTIALS,
    PERMISSIONS.VIEW_PENDING_VERIFICATIONS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TENDERS,
    PERMISSIONS.VIEW_CONTRACTORS,
    PERMISSIONS.VIEW_CREDENTIALS,
    PERMISSIONS.VIEW_SYSTEM_STATUS
  ],
  contractor: [
    PERMISSIONS.SUBMIT_BID,
    PERMISSIONS.MANAGE_PROFILE,
    PERMISSIONS.UPLOAD_CREDENTIALS,
    PERMISSIONS.VIEW_MY_BIDS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TENDERS,
    PERMISSIONS.VIEW_CREDENTIALS
  ],
  public: [
    PERMISSIONS.VIEW_TENDERS
  ]
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    initializeAuth();
    checkSystemHealth();
  }, []);

  const initializeAuth = async () => {
    try {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        
        // Verify token is still valid
        try {
          const response = await fetch('http://localhost:5002/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Token invalid');
          }
          
          const userData = await response.json();
          setUser(userData.user);
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      const [healthResponse, blockchainResponse] = await Promise.all([
        systemAPI.getHealth(),
        systemAPI.getBlockchainStatus()
      ]);

      setSystemStatus({
        server: healthResponse.data.status === 'OK' ? 'active' : 'error',
        blockchain: blockchainResponse.data.connected ? 'active' : 'error',
        network: blockchainResponse.data.network || 'Unknown'
      });
    } catch (error) {
      console.error('System health check failed:', error);
      setSystemStatus({
        server: 'error',
        blockchain: 'error',
        network: 'Unknown'
      });
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.token);
      setUser(data.user);
      
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on port 5002.';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Network error. Please check if the backend server is running.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:5002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshUser = async () => {
    try {
      if (!token) return;
      
      const response = await fetch('http://localhost:5002/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const oldVerificationStatus = user?.isVerified;
        const newVerificationStatus = userData.user?.isVerified;
        
        setUser(userData.user);
        localStorage.setItem('auth_user', JSON.stringify(userData.user));
        
        // Return status change info
        return {
          user: userData.user,
          statusChanged: oldVerificationStatus !== newVerificationStatus,
          newStatus: newVerificationStatus
        };
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const getUserRole = () => {
    return user?.role || 'public';
  };

  const hasPermission = (permission) => {
    const userRole = getUserRole();
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  };

  const isAdmin = () => {
    return getUserRole() === 'admin';
  };

  const isVerifier = () => {
    return getUserRole() === 'verifier';
  };

  const isContractor = () => {
    return getUserRole() === 'contractor';
  };

  const isVerified = () => {
    return user?.isVerified || false;
  };

  const getPermissions = () => {
    const userRole = getUserRole();
    return ROLE_PERMISSIONS[userRole] || [];
  };

  const value = {
    // State
    user,
    token,
    isLoading,
    systemStatus,

    // Actions
    login,
    register,
    logout,
    refreshUser,
    checkSystemHealth,

    // Utilities
    isAuthenticated,
    getUserRole,
    hasPermission,
    isAdmin,
    isVerifier,
    isContractor,
    isVerified,
    getPermissions,

    // Constants
    PERMISSIONS,
    ROLE_PERMISSIONS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};