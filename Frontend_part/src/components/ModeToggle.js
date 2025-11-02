import React from 'react';
import { 
  Server, 
  Link
} from 'lucide-react';

const ModeToggle = () => {
  return (
    <div className="flex items-center px-3 py-2 bg-primary-50 border border-primary-200 rounded-md">
      <Server className="h-4 w-4 mr-2 text-primary-600" />
      <span className="text-sm text-primary-700 font-medium">Backend Managed</span>
      <Link className="h-3 w-3 ml-2 text-primary-500" />
    </div>
  );
};

export default ModeToggle;