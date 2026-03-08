import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone, MapPin, Building, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Toast from '../../components/ui/Toast';

const CaretakerRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    locations: []
  });
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  // Fetch available locations on component mount
  useEffect(() => {
    fetchAvailableLocations();
  }, []);

  const fetchAvailableLocations = async () => {
    try {
      setLocationsLoading(true);
      const response = await fetch(`${API_BASE_URL}/locations`);
      
      if (response.ok) {
        const locations = await response.json();
        setAvailableLocations(locations);
      } else {
        throw new Error('Failed to fetch locations');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      showToast('Failed to load available locations', 'error');
    } finally {
      setLocationsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const isChecked = e.target.checked;
      const locationId = value;
      
      setFormData(prev => ({
        ...prev,
        locations: isChecked 
          ? [...prev.locations, locationId]
          : prev.locations.filter(id => id !== locationId)
      }));
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Locations validation
    if (formData.locations.length === 0) {
      errors.locations = 'Please select at least one location';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the form errors before submitting', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/caretaker/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase(),
          phone: formData.phone.replace(/\D/g, ''),
          password: formData.password,
          locations: formData.locations
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Registration successful! You can now login.', 'success');
        
        // Redirect to login page after successful registration
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.message.includes('already exists')) {
        showToast('A caretaker with this email already exists', 'error');
      } else if (error.message.includes('locations are invalid')) {
        showToast('One or more selected locations are invalid', 'error');
      } else {
        showToast(error.message || 'Registration failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    const strengthConfig = {
      0: { text: 'Very Weak', color: 'bg-red-500' },
      1: { text: 'Weak', color: 'bg-red-400' },
      2: { text: 'Fair', color: 'bg-yellow-500' },
      3: { text: 'Good', color: 'bg-blue-500' },
      4: { text: 'Strong', color: 'bg-green-500' }
    };

    return { strength, ...strengthConfig[strength] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="bg-gray-50 flex flex-col justify-center sm:px-6 lg:px-8">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}
      
      <div className="mt-0 sm:mx-auto sm:w-full sm:max-w-7xl">
        <div className="bg-white py-8 px-6 shadow-2xl sm:rounded-2xl border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Personal Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    Personal Information
                  </h3>
                  
                  {/* Name Field */}
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-3 pl-10 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          formErrors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-3 pl-10 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          formErrors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your email address"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-3 pl-10 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          formErrors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="10-digit phone number"
                      />
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {formErrors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Security Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    Security
                  </h3>
                  
                  {/* Password Field */}
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-3 pr-10 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          formErrors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Password strength:</span>
                          <span className={`text-xs font-medium ${
                            passwordStrength.strength >= 3 ? 'text-green-600' : 
                            passwordStrength.strength >= 2 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {passwordStrength.text}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {formErrors.password && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        {formErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`appearance-none block w-full px-3 py-3 pr-10 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        {formErrors.confirmPassword}
                      </p>
                    )}
                    
                    {/* Password match indicator */}
                    {formData.password && formData.confirmPassword && (
                      <p className={`mt-1 text-sm flex items-center ${
                        formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formData.password === formData.confirmPassword ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Assigned Locations */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    Assigned Locations *
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Select the locations you will be managing. You must select at least one location.
                  </p>

                  {formErrors.locations && (
                    <p className="mb-3 text-sm text-red-600 flex items-center">
                      <XCircle className="w-4 h-4 mr-1" />
                      {formErrors.locations}
                    </p>
                  )}

                  {locationsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : availableLocations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No locations available for assignment</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto p-3 border border-gray-200 rounded-lg">
                      {availableLocations.map(location => (
                        <div key={location._id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                          <input
                            id={`location-${location._id}`}
                            name="locations"
                            type="checkbox"
                            value={location._id}
                            checked={formData.locations.includes(location._id)}
                            onChange={handleChange}
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label 
                            htmlFor={`location-${location._id}`}
                            className="flex-1 text-sm text-gray-700 cursor-pointer"
                          >
                            <div className="font-medium">{location.name}</div>
                            <div className="text-gray-500 text-xs mt-1 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {location.address?.line1}, {location.address?.city}
                            </div>
                            {location.capacityOfPersons && (
                              <div className="text-gray-500 text-xs mt-1">
                                Capacity: {location.capacityOfPersons} persons
                              </div>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span>Selected locations:</span>
                      <span className="font-medium text-green-600">
                        {formData.locations.length} location(s)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button - Full Width */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <User className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Creating Account...' : 'Create Caretaker Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CaretakerRegister;