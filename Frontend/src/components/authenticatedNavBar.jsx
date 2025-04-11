import { Link } from 'react-router-dom';
import { Settings, LogOut, User, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const AuthenticatedNavbar = () => {
  const { authUser, signout } = useAuthStore();

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
              className=" text-base-content hover:text-base-100 p-2 rounded-full hover:bg-base-content"
            >
              <Settings className="h-5 w-5" />
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/profile"
                className="flex items-center text-base-content hover:text-base-content px-3 py-2 rounded-md text-sm font-medium"
              >
                <User className="h-5 w-5 mr-1" />
                {authUser?.fullName || 'Profile'}
              </Link>
              
              <button
                onClick={signout}
                className="flex items-center cursor-pointer text-base-content hover:text-base-content px-3 py-2 rounded-md text-sm font-medium"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AuthenticatedNavbar;