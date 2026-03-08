import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Building, Shield, CheckCircle, Users, CreditCard, Phone } from 'lucide-react';
import { useCaretakerAuth } from '../../context/CaretakerAuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Toast from '../../components/ui/Toast';

const CaretakerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useCaretakerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/caretaker/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      showToast('Login successful!', 'success');
      // Navigation will be handled by the useEffect
    } else {
      showToast(result.error, 'error');
    }
    
    setLoading(false);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const features = [
    {
      icon: <Building className="w-5 h-5" />,
      text: "View and manage bookings for assigned locations"
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      text: "Update payment status from 'Half Paid' to 'Fully Paid'"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      text: "Secure access with administrator approval"
    },
    {
      icon: <Users className="w-5 h-5" />,
      text: "Contact resort administration for account issues"
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
                  <Building className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">ResortCare</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">
                Caretaker <span className="text-blue-200">Portal</span>
              </h1>
              <p className="text-lg text-blue-100 opacity-90">
                Secure access to manage your assigned location bookings and payments
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-6 mb-12">
              <h2 className="text-2xl font-semibold text-blue-100 mb-6">
                What you can do:
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

            {/* Support Info */}
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-3">
                <Phone className="w-5 h-5 text-blue-200" />
                <h3 className="text-lg font-semibold text-white">Need Help?</h3>
              </div>
              <p className="text-blue-100 text-sm">
                Contact the resort administration team for any account issues, 
                location assignments, or technical support.
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
                  <Building className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">ResortCare</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Caretaker Login
              </h2>
              <p className="mt-2 text-gray-600">
                Access your assigned location bookings
              </p>
            </div>

            {/* Login Form Card */}
            <div className="bg-white py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-200">
              {/* Desktop Form Header */}
              <div className="hidden lg:block text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Sign in to your account
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Enter your credentials to access the caretaker portal
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

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" className="mr-3" />
                    ) : (
                      <LogIn className="w-5 h-5 mr-3" />
                    )}
                    {loading ? 'Signing in...' : 'Sign in as Caretaker'}
                  </button>
                </div>
              </form>

              {/* Access Notice */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Shield className="w-4 h-4 mr-2" />
                  Caretaker Access Only • Authorized Personnel
                </div>
                
                {/* Admin Login Link */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Admin Login: <strong>
                      <a href='/login' className="text-blue-600 hover:text-blue-700 underline transition-colors">
                        Click Here!
                      </a>
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Information Card */}
            <div className="lg:hidden mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                About Caretaker Accounts
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Caretakers can only view and manage bookings for their assigned locations</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You can update payment status from "Half Paid" to "Fully Paid" only</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Your account will need to be approved by an administrator</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaretakerLogin;