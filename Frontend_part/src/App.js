import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Web3Provider } from './contexts/Web3Context';
import { ContractorProvider } from './contexts/ContractorContext';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import SmartHome from './components/SmartHome';
import Tenders from './pages/Tenders';
import Contractors from './pages/Contractors';
import Credentials from './pages/Credentials';
import Verification from './pages/Verification';
import Verifier from './pages/Verifier';
import QualityAssurance from './pages/QualityAssurance';
import SystemStatus from './pages/SystemStatus';
import Payments from './pages/Payments';
import Complaints from './pages/Complaints';
import LoadingSpinner from './components/LoadingSpinner';

// Main app content that requires authentication context
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <LoginForm />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SmartHome />} />
        <Route path="/tenders" element={<Tenders />} />
        <Route path="/contractors" element={<Contractors />} />
        <Route path="/credentials" element={<Credentials />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/verifier" element={<Verifier />} />
        <Route path="/quality-assurance" element={<QualityAssurance />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/system" element={<SystemStatus />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <ContractorProvider>
        <Web3Provider>
          <Router>
            <AppContent />
          </Router>
        </Web3Provider>
      </ContractorProvider>
    </AuthProvider>
  );
}

export default App;