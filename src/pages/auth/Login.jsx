import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Lock, Shield, CheckCircle, Users, AlertTriangle, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Toast from '../../components/ui/Toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loginAttempts, setLoginAttempts] = useState(0);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      showToast('Login successful!', 'success');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } else {
      setLoginAttempts(prev => prev + 1);
      showToast(result.error, 'error');
    }

    setLoading(false);
  };

  const isFormValid = formData.email && formData.password;

  const features = [
    {
      icon: <Shield className="w-5 h-5" />,
      text: "Full administrative access to all system features"
    },
    {
      icon: <Users className="w-5 h-5" />,
      text: "Manage user accounts and permissions"
    },
    {
      icon: <Key className="w-5 h-5" />,
      text: "Complete booking and payment management"
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      text: "System monitoring and reporting capabilities"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}
      
      <div className="flex min-h-screen">
        {/* Left Side - Information Panel */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between lg:p-12 xl:p-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-lg mx-auto w-full">
            {/* Logo and Header */}
            <div className="text-center lg:text-left mb-12">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">Rest And Relax</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">
                Admin <span className="text-blue-200">Portal</span>
              </h1>
              <p className="text-lg text-blue-100 opacity-90">
                Complete administrative access to manage the entire resort system
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-6 mb-12">
              <h2 className="text-2xl font-semibold text-blue-100 mb-6">
                Administrative Access:
              </h2>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-blue-100 text-lg leading-relaxed">
                      {feature.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-blue-200" />
                <h3 className="text-lg font-semibold text-white">Security Notice</h3>
              </div>
              <p className="text-blue-100 text-sm">
                This panel is restricted to authorized administrative personnel only. 
                Unauthorized access attempts will be logged and may result in legal action.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="mx-auto w-full max-w-md lg:max-w-lg">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">ResortCare</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Admin Login
              </h2>
              <p className="mt-2 text-gray-600">
                Sign in to your admin account
              </p>
            </div>

            {/* Login Form Card */}
            <div className="bg-white py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-200">
              {/* Desktop Form Header */}
              <div className="hidden lg:block text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Sign in to Admin Portal
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Enter your administrative credentials
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none block w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {loginAttempts >= 3 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        Having trouble logging in? Contact super admin for assistance.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-3" />
                  ) : (
                    <LogIn className="w-5 h-5 mr-3" />
                  )}
                  {loading ? 'Signing in...' : 'Sign In as Admin'}
                </button>
              </form>

              {/* Security Notice */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
                  <Shield className="w-4 h-4 mr-2" />
                  Administrative Access Only • Authorized Personnel
                </div>
                
                {/* Caretaker Login Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Caretaker Login: <strong>
                      <a href='/caretaker/login' className="text-blue-600 hover:text-blue-700 underline transition-colors">
                        Click Here!
                      </a>
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Security Notice */}
            <div className="lg:hidden mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                Security Notice
              </h3>
              <p className="text-sm text-gray-700">
                This panel is restricted to authorized administrative personnel only. 
                Unauthorized access attempts will be logged and may result in legal action.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;