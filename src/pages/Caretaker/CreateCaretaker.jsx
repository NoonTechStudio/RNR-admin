import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone, MapPin, Building, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Toast from '../../components/ui/Toast';

const CreateCaretaker = () => {
  const { id } = useParams(); // For edit mode
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    locations: [],
    isActive: true
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
  const token = localStorage.getItem('adminToken');

  // Initialize based on mode
  useEffect(() => {
    fetchAvailableLocations();
    
    if (isEditMode) {
      fetchCaretakerData();
    }
  }, [id]);

  const fetchCaretakerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/caretaker/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData({
            name: data.caretaker.name,
            email: data.caretaker.email,
            phone: data.caretaker.phone,
            password: '',
            confirmPassword: '',
            locations: data.caretaker.locations.map(loc => loc._id),
            isActive: data.caretaker.isActive
          });
        }
      } else {
        throw new Error('Failed to fetch caretaker data');
      }
    } catch (error) {
      console.error('Error fetching caretaker:', error);
      showToast('Failed to load caretaker data', 'error');
      navigate('/caretakers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableLocations = async () => {
    try {
      setLocationsLoading(true);
      const response = await fetch(`${API_BASE_URL}/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
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
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'locations') {
      const locationId = value;
      setFormData(prev => ({
        ...prev,
        locations: checked 
          ? [...prev.locations, locationId]
          : prev.locations.filter(id => id !== locationId)
      }));
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    // For create mode, password is required
    if (!isEditMode && !formData.password) {
      errors.password = 'Password is required';
    } else if (!isEditMode && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // For create mode, confirm password is required
    if (!isEditMode && !formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (!isEditMode && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // For edit mode, if password is provided, validate it
    if (isEditMode && formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

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

    const apiUrl = isEditMode 
      ? `${API_BASE_URL}/caretaker/${id}`
      : `${API_BASE_URL}/caretaker/register`;

    const method = isEditMode ? 'PUT' : 'POST';

    const requestData = {
      name: formData.name.trim(),
      email: formData.email.toLowerCase(),
      phone: formData.phone.replace(/\D/g, ''),
      locations: formData.locations,
      isActive: formData.isActive
    };

    // Only include password if provided (and valid for edit)
    if (formData.password && (!isEditMode || formData.password.length >= 6)) {
      requestData.password = formData.password;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add auth header for edit mode
      if (isEditMode) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl, {
        method,
        headers,
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        showToast(
          isEditMode ? 'Caretaker updated successfully!' : 'Caretaker created successfully!',
          'success'
        );
        
        setTimeout(() => {
          navigate('/caretakers');
        }, 2000);
      } else {
        throw new Error(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Operation error:', error);
      
      if (error.message.includes('already exists')) {
        showToast('A caretaker with this email already exists', 'error');
      } else {
        showToast(error.message || 'Operation failed. Please try again.', 'error');
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
      
      <div className="mt-0 sm:mx-auto sm:w-full">
        <div className="">
          <div className="mb-6">
            <Link
              to="/caretakers"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Caretakers
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Caretaker' : 'Create New Caretaker'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode 
                ? 'Update caretaker information and permissions' 
                : 'Register a new caretaker account with assigned locations'}
            </p>
          </div>

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
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        formErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter full name"
                    />
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
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        formErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
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
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        formErrors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="10-digit phone number"
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Status Field */}
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Active Caretaker
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - Security & Locations */}
              <div className="space-y-6">
                {/* Security Section - Only show password fields for create or when editing */}
                {(isEditMode || !isEditMode) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                      {isEditMode ? 'Change Password (Optional)' : 'Security'}
                    </h3>
                    
                    {/* Password Field */}
                    <div className="mb-4">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        {isEditMode ? 'New Password' : 'Password *'}
                      </label>
                      <div className="mt-1 relative">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleChange}
                          className={`appearance-none block w-full px-3 py-3 pr-10 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                            formErrors.password ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder={isEditMode ? 'Leave blank to keep current password' : 'Create a password'}
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

                    {/* Confirm Password Field - Only for create mode */}
                    {!isEditMode && (
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          Confirm Password *
                        </label>
                        <div className="mt-1 relative">
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
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
                    )}
                  </div>
                )}

                {/* Assigned Locations */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    Assigned Locations *
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Select the locations this caretaker will be managing.
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
                    <div className="space-y-3 max-h-64 overflow-y-auto p-3 border border-gray-200 rounded-lg">
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

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/caretakers')}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEditMode ? 'Update Caretaker' : 'Create Caretaker'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCaretaker;