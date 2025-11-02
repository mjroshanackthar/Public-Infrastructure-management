import React, { useState } from 'react';
import { Info, X, Users, Shield, Settings } from 'lucide-react';

const DemoNotice = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <Info className="h-5 w-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-primary-900 mb-2">
            Demo Authentication System
          </h3>
          <p className="text-sm text-primary-700 mb-3">
            This frontend includes a complete role-based authentication system. Try logging in with different roles to see how the interface adapts:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center mb-2">
                <Settings className="h-4 w-4 text-danger-600 mr-2" />
                <span className="font-medium text-danger-900">Admin</span>
              </div>
              <p className="text-gray-600 mb-2">admin@example.com</p>
              <p className="text-gray-600 mb-2">Password: admin123</p>
              <p className="text-xs text-gray-500">Can create tenders, assign winners</p>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center mb-2">
                <Shield className="h-4 w-4 text-warning-600 mr-2" />
                <span className="font-medium text-warning-900">Verifier</span>
              </div>
              <p className="text-gray-600 mb-2">verifier@example.com</p>
              <p className="text-gray-600 mb-2">Password: verifier123</p>
              <p className="text-xs text-gray-500">Can verify contractor credentials</p>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="flex items-center mb-2">
                <Users className="h-4 w-4 text-primary-600 mr-2" />
                <span className="font-medium text-primary-900">Contractor</span>
              </div>
              <p className="text-gray-600 mb-2">contractor@example.com</p>
              <p className="text-gray-600 mb-2">Password: contractor123</p>
              <p className="text-xs text-gray-500">Can submit bids, add credentials</p>
            </div>
          </div>
          
          <p className="text-xs text-primary-600 mt-3">
            💡 Notice how the navigation menu, buttons, and available actions change based on your role!
          </p>
        </div>
        
        <button
          onClick={() => setIsVisible(false)}
          className="ml-3 text-primary-400 hover:text-primary-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default DemoNotice;