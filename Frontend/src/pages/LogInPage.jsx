import { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, MessageSquare } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { AxiosInstance } from '../lib/Axios';
import { useNavigate, Link } from 'react-router-dom';

const LogInPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { isLoggingIn, signin, credentials } = useAuthStore();
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const success = await signin(formData);
      if (success) {
        navigate('/');
      } 
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || 'Signin failed. Please try again.';
      toast.error(errorMessage, {
        icon: '❌',
        duration: 4000
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col md:flex-row">
      <Toaster position="top-center" toastOptions={{ 
        className: 'bg-gray-800 text-gray-200 border border-gray-700',
        iconTheme: {
          primary: '#9ca3af',
          secondary: '#f9fafb',
        }
      }} />

      {/* Left Panel - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-gray-800">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" /> Email
                </span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input input-bordered w-full bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:bg-gray-600 focus:border-gray-500"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300 flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-gray-400" /> Password
                </span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input input-bordered w-full bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:bg-gray-600 focus:border-gray-500"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className={`btn w-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 transition-colors duration-300 ${isLoggingIn ? 'loading' : ''}`}
                disabled={isLoggingIn}
              >
                {!isLoggingIn && (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2 text-gray-400" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-gray-300 hover:text-gray-100 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className={`hidden md:flex md:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-gray-800 to-gray-900 transition-all duration-1000 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className={`text-center max-w-md transition-all duration-1000 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="p-8 rounded-2xl mb-8 animate-fade-in">
            <div className="relative inline-block mb-6">
              <MessageSquare className="relative w-16 h-16 mx-auto text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-100 mb-4 animate-slide-in">Great to See You Again</h2>
            <p className="text-gray-400 mb-6 animate-slide-in delay-150">
              Reconnect with your community and continue your journey
            </p>
            <div className="flex justify-center space-x-8 animate-slide-in delay-300">
              <div className="text-center">
                <div className="text-gray-400 text-2xl font-bold mb-1">24/7</div>
                <div className="text-gray-500 text-sm">Support</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-2xl font-bold mb-1">100%</div>
                <div className="text-gray-500 text-sm">Secure</div>
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-sm italic animate-fade-in delay-500">
            "Your conversations are waiting"
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default LogInPage;