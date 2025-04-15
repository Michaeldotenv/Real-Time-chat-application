import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { authUser, isCheckingAuth, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isCheckingAuth) {
      if (!authUser) {
        // Only redirect if there's no error (to prevent infinite loop on auth errors)
        if (!error) {
          navigate('/signin', { 
            replace: true,
            state: { from: location } 
          });
        }
      }
    }
  }, [authUser, isCheckingAuth, error, navigate, location]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !authUser) {
    // Optional: You could show an error message here
    return null; // The useEffect will handle the redirect
  }

  return authUser ? children : null;
};

export default ProtectedRoute;