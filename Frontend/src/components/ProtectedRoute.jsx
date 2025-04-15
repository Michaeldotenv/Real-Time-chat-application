import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { authUser, isCheckingAuth, error } = useAuthStore();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!initialCheckDone && !isCheckingAuth && !authUser) {
      setInitialCheckDone(true);
      navigate('/signin', {
        replace: true,
        state: { from: location }
      });
    }
  }, [authUser, isCheckingAuth, initialCheckDone, navigate, location]);

  if (error) {
    toast.error("Session expired. Please login again.");
    navigate('/signin', { replace: true });
    return null;
  }

  if (!initialCheckDone || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return authUser ? children : null;
};

export default ProtectedRoute;