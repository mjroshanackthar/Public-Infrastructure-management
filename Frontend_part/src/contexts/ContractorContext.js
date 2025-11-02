import React, { createContext, useContext, useState, useEffect } from 'react';
import { contractorsAPI } from '../services/api';
import { useAuth, PERMISSIONS } from './AuthContext';

const ContractorContext = createContext();

export const useContractors = () => {
  const context = useContext(ContractorContext);
  if (!context) {
    throw new Error('useContractors must be used within a ContractorProvider');
  }
  return context;
};

export const ContractorProvider = ({ children }) => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { user, refreshUser, hasPermission } = useAuth();

  // Load contractors data (only if user has permission)
  const loadContractors = async () => {
    if (!hasPermission(PERMISSIONS.VIEW_CONTRACTORS)) {
      console.log('User does not have permission to view contractors');
      setContractors([]);
      return;
    }

    try {
      setLoading(true);
      const response = await contractorsAPI.getAllContractors();
      setContractors(Array.isArray(response.data) ? response.data : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load contractors:', error);
      if (error.response?.status === 403) {
        console.log('Access denied to contractor information');
      }
      setContractors([]);
    } finally {
      setLoading(false);
    }
  };

  // Update a specific contractor's verification status
  const updateContractorStatus = async (contractorId, isVerified) => {
    try {
      // Update in backend
      const response = await fetch(`http://localhost:5002/api/contractors/${contractorId}/verification-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          isVerified,
          verificationNotes: `Status changed to ${isVerified ? 'verified' : 'unverified'} by verifier`
        })
      });

      if (response.ok) {
        // Update local state immediately
        setContractors(prev => 
          prev.map(contractor => 
            contractor._id === contractorId 
              ? { ...contractor, isVerified }
              : contractor
          )
        );

        // If the current user is the contractor being updated, refresh their data
        if (user?._id === contractorId) {
          await refreshUser();
        }

        // Reload all contractors to ensure consistency
        await loadContractors();

        return { success: true };
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating contractor status:', error);
      return { success: false, error: error.message };
    }
  };

  // Get contractor by ID
  const getContractor = (contractorId) => {
    return contractors.find(c => c._id === contractorId);
  };

  // Get verification statistics
  const getStats = () => {
    return {
      total: contractors.length,
      verified: contractors.filter(c => c.isVerified).length,
      unverified: contractors.filter(c => !c.isVerified).length
    };
  };

  // Auto-refresh every 30 seconds - only for users with contractor view permission
  useEffect(() => {
    let interval;
    if (user && hasPermission(PERMISSIONS.VIEW_CONTRACTORS)) {
      interval = setInterval(() => {
        loadContractors();
      }, 30000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, hasPermission]);

  // Initial load - only for users who have permission to view contractor data
  useEffect(() => {
    if (user && hasPermission(PERMISSIONS.VIEW_CONTRACTORS)) {
      loadContractors();
    }
  }, [user, hasPermission]);

  const value = {
    contractors,
    loading,
    lastUpdated,
    loadContractors,
    updateContractorStatus,
    getContractor,
    getStats
  };

  return (
    <ContractorContext.Provider value={value}>
      {children}
    </ContractorContext.Provider>
  );
};