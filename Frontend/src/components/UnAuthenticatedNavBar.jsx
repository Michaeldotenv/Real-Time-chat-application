import { Link } from 'react-router-dom';
import { Settings, MessageSquare } from 'lucide-react';

const UnauthenticatedNavbar = () => {
  return (
    <nav className="bg-base-100 text-base-content border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <MessageSquare className="text-indigo-400 h-6 w-6" />
            <span className="text-base-content font-bold text-xl">ChatSpace</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/settings" 
              className="text-base-content hover:text-base-content p-2 rounded-full hover:bg-base-content"
            >
              <Settings className="h-5 w-5" />
            </Link>
            
            <div className="flex space-x-4">
              <Link
                to="/signin"
                className="text-base-content hover:text-base-content cursor-pointer  rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default UnauthenticatedNavbar;