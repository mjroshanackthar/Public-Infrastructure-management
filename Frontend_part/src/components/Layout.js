import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Users, 
  Shield, 
  Settings,
  Building2,
  DollarSign
} from 'lucide-react';
import { useAuth, PERMISSIONS } from '../contexts/AuthContext';
import ModeToggle from './ModeToggle';
import UserProfile from './UserProfile';
import ConnectWallet from './ConnectWallet';

const Layout = ({ children }) => {
  const location = useLocation();
  const { hasPermission, getUserRole, user } = useAuth();

  // Check if user is Quality Assurance (based on organization)
  const isQualityAssurance = () => {
    return getUserRole() === 'verifier' && 
           (user?.organization?.includes('Quality Assurance') || 
            user?.name?.includes('Quality Assurance'));
  };

  // Check if user is Certified Verifier (non-QA verifier)
  const isCertifiedVerifier = () => {
    return getUserRole() === 'verifier' && !isQualityAssurance();
  };

  // Role-based navigation with permission checks
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: Home,
      permission: PERMISSIONS.VIEW_DASHBOARD,
      hideForQA: true // Hide for Quality Assurance users
    },
    { 
      name: 'Tenders', 
      href: '/tenders', 
      icon: FileText,
      permission: PERMISSIONS.VIEW_TENDERS
    },
    { 
      name: 'Contractors', 
      href: '/contractors', 
      icon: Users,
      permission: PERMISSIONS.VIEW_CONTRACTORS,
      hideForQA: true // Hide for Quality Assurance users
    },
    { 
      name: 'Verification', 
      href: '/verification', 
      icon: Shield,
      permission: PERMISSIONS.MANAGE_PROFILE,
      roles: ['contractor'] // Only show to contractors
    },
    { 
      name: 'Verifier', 
      href: '/verifier', 
      icon: Shield,
      permission: PERMISSIONS.VERIFY_CREDENTIALS,
      roles: ['verifier'], // Only show to verifiers
      hideForQA: true // Hide for Quality Assurance users
    },
    { 
      name: 'Quality Assurance', 
      href: '/quality-assurance', 
      icon: Shield,
      permission: PERMISSIONS.VERIFY_CREDENTIALS,
      roles: ['verifier'], // Only show to verifiers
      hideForCertifiedVerifier: true // Hide for Certified Verifiers
    },
    { 
      name: 'Payments', 
      href: '/payments', 
      icon: DollarSign,
      permission: PERMISSIONS.VIEW_DASHBOARD,
      roles: ['admin', 'contractor'] // Only admins and contractors can see payments
    },
    { 
      name: 'Complaints', 
      href: '/complaints', 
      icon: Shield,
      permission: PERMISSIONS.VIEW_DASHBOARD, // Use a permission both admins and verifiers have
      roles: ['verifier', 'admin'] // Only verifiers and admins can see complaints
    },

    { 
      name: 'System Status', 
      href: '/system', 
      icon: Settings,
      permission: PERMISSIONS.VIEW_SYSTEM_STATUS,
      hideForQA: true, // Hide for Quality Assurance users
      hideForCertifiedVerifier: true // Hide for Certified Verifiers
    },
  ].filter(item => {
    // Check permission
    if (!hasPermission(item.permission)) return false;
    
    // Check role restriction if specified
    if (item.roles && !item.roles.includes(getUserRole())) return false;
    
    // Hide items for Quality Assurance users if specified
    if (item.hideForQA && isQualityAssurance()) return false;
    
    // Hide items for Certified Verifiers if specified
    if (item.hideForCertifiedVerifier && isCertifiedVerifier()) return false;
    
    return true;
  });

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary-600" />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Blockchain Building Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ModeToggle />
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* MetaMask Connection Widget */}
          <div className="mb-6">
            <ConnectWallet />
          </div>
          
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;