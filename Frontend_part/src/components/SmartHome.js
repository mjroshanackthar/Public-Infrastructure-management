import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';

const SmartHome = () => {
  const navigate = useNavigate();
  const { user, getUserRole } = useAuth();

  useEffect(() => {
    // Check if user is Quality Assurance and redirect them
    const isQualityAssurance = () => {
      return getUserRole() === 'verifier' && 
             (user?.organization?.includes('Quality Assurance') || 
              user?.name?.includes('Quality Assurance'));
    };

    if (isQualityAssurance()) {
      // Redirect Quality Assurance users to their dedicated page
      navigate('/quality-assurance', { replace: true });
    }
  }, [user, getUserRole, navigate]);

  // Check if user is Quality Assurance - if so, don't render Dashboard
  const isQualityAssurance = () => {
    return getUserRole() === 'verifier' && 
           (user?.organization?.includes('Quality Assurance') || 
            user?.name?.includes('Quality Assurance'));
  };

  // If Quality Assurance user, return null (they'll be redirected)
  if (isQualityAssurance()) {
    return null;
  }

  // For all other users, show the Dashboard
  return <Dashboard />;
};

export default SmartHome;