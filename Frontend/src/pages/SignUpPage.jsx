import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, MessageSquare } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { isSigningUp, signup } = useAuthStore(); // ✅ get signup from store
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Please enter your full name', { icon: '✏️' });
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email', { icon: '✉️' });
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error('Please enter a valid email address', { icon: '⚠️' });
      return false;
    }
    if (!formData.password) {
      toast.error('Please enter a password', { icon: '🔒' });
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters', { icon: '⚠️' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await signup(formData); // ✅ Call signup action from store
      navigate('/signin')
      toast.success("signin successful!")
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
        className: 'bg-gray-800 text-gray-200 border border-gray-700 shadow-lg',
        iconTheme: {
          primary: '#9ca3af',
          secondary: '#f9fafb',
        },
        style: {
          borderRadius: '8px',
          padding: '12px 16px',
        }
      }} />

      {/* Left Panel - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-gray-800">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Create Account</h1>
            <p className="text-gray-400">Unlock your free account with ChatSpace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-300 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" /> Full Name
                </span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="input input-bordered w-full bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:bg-gray-600 focus:border-gray-500"
                required
              />
            </div>

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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input input-bordered w-full bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:bg-gray-600 focus:border-gray-500 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className={`btn w-full bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 transition-colors duration-300 ${isSigningUp ? 'loading' : ''}`}
                disabled={isSigningUp}
              >
                {!isSigningUp && (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2 text-gray-400" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/signin" className="text-gray-300 hover:text-gray-100 font-medium transition-colors">
                Sign in
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
              <MessageSquare className="relative w-16 h-16 mx-auto text-gray-400 animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold text-gray-100 mb-4 animate-slide-in">Welcome to ChatSpace</h2>
            <p className="text-gray-400 mb-6 animate-slide-in delay-150">
              Join thousands of users who are already connecting and sharing their experiences
            </p>
            <div className="flex justify-center space-x-8 animate-slide-in delay-300">
              <div className="text-center">
                <div className="text-gray-400 text-2xl font-bold mb-1">10K+</div>
                <div className="text-gray-500 text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-2xl font-bold mb-1">24/7</div>
                <div className="text-gray-500 text-sm">Support</div>
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-sm italic animate-fade-in delay-500">
            "Your journey begins with a single signup"
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
};

export default SignupPage;
