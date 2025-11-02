import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

const StatusCard = ({ title, status, description, icon: Icon, onClick }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
      case 'verified':
      case 'active':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'error':
      case 'failed':
        return 'text-danger-600 bg-danger-50 border-danger-200';
      case 'warning':
      case 'pending':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
      case 'verified':
      case 'active':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
      case 'failed':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
      case 'pending':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg border-2 ${getStatusColor()} ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {Icon && <Icon className="h-6 w-6 mr-3" />}
          <div>
            <h3 className="font-medium">{title}</h3>
            {description && (
              <p className="text-sm opacity-75 mt-1">{description}</p>
            )}
          </div>
        </div>
        {getStatusIcon()}
      </div>
    </div>
  );
};

export default StatusCard;