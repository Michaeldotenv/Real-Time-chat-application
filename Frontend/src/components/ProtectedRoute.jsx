import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { authUser, isCheckingAuth, error, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Perform initial auth check if not already checking
    if (!isCheckingAuth && !authUser) {
      checkAuth().catch(console.error);
    }
  }, []);

  useEffect(() => {
    // Only act when auth check is complete
    if (!isCheckingAuth) {
      if (error) {
        toast.error("Session expired. Please login again.");
        navigate('/signin', { 
          replace: true,
          state: { from: location } 
        });
      } else if (!authUser) {
        navigate('/signin', { 
          replace: true,
          state: { from: location } 
        });
      }
    }
  }, [authUser, isCheckingAuth, error, navigate, location]);

  if (isCheckingAuth || (!authUser && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return authUser ? children : null;
};

export default ProtectedRoute;