import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { authUser, isCheckingAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isCheckingAuth && !authUser) {
      navigate('/signin');
    }
  }, [authUser, isCheckingAuth, navigate]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return authUser ? children : null;
};

export default ProtectedRoute;