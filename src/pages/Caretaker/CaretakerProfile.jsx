import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Building, Calendar, Shield, Edit, RefreshCw  } from 'lucide-react';
import { useCaretakerAuth } from '../../context/CaretakerAuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Toast from '../../components/ui/Toast';

const CaretakerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [refreshing, setRefreshing] = useState(false);

  const { caretaker, isAuthenticated, loading: authLoading } = useCaretakerAuth();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  useEffect(() => {
    // If we have caretaker data from context, we don't need to load separately
    if (caretaker || !isAuthenticated) {
      setLoading(false);
    }
  }, [caretaker, isAuthenticated]);

  const refreshProfile = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('caretakerToken');
      const response = await fetch(`${API_BASE_URL}/caretaker/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update localStorage with fresh data
        localStorage.setItem('caretakerInfo', JSON.stringify(data.caretaker));
        showToast('Profile information refreshed', 'success');
        // Force page reload to get updated context
        window.location.reload();
      } else {
        throw new Error(data.error || 'Failed to refresh profile');
      }
    } catch (error) {
      console.error('Error refreshing caretaker profile:', error);
      showToast('Failed to refresh profile information', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never logged in';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    // Format phone number for better readability
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!caretaker || !isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Available</h3>
        <p className="text-gray-500 mb-4">Unable to load caretaker profile information.</p>
        <button
          onClick={refreshProfile}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">
            Your caretaker account information and assigned locations
          </p>
        </div>
        <button
          onClick={refreshProfile}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{caretaker.name}</h2>
                <p className="text-gray-600">Caretaker</p>
                <div className="flex items-center mt-1">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    caretaker.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className={`text-xs font-medium ${
                    caretaker.isActive ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {caretaker.isActive ? 'Active Account' : 'Account Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 text-sm text-gray-500">
              Member since {formatDate(caretaker.createdAt)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-500" />
                Personal Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Email Address</p>
                    <p className="text-gray-900 break-all">{caretaker.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Phone Number</p>
                    <p className="text-gray-900">{formatPhoneNumber(caretaker.phone)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Last Login</p>
                    <p className="text-gray-900">{formatDate(caretaker.lastLogin)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Locations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-green-500" />
                Assigned Locations
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {caretaker.locations?.length || 0}
                </span>
              </h3>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {caretaker.locations && caretaker.locations.length > 0 ? (
                  caretaker.locations.map((location, index) => (
                    <div 
                      key={location._id || index} 
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start">
                        <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{location.name}</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            {location.address?.line1 && (
                              <p className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {location.address.line1}
                                {location.address.city && `, ${location.address.city}`}
                              </p>
                            )}
                            {location.capacityOfPersons && (
                              <p>Capacity: {location.capacityOfPersons} persons</p>
                            )}
                            {location.description && (
                              <p className="text-xs text-gray-500 mt-1">{location.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
                    <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No locations assigned</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Contact administrator to get location assignments
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-purple-500" />
              Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Account ID</p>
                <p className="text-gray-900 font-mono text-sm">{caretaker._id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Role</p>
                <p className="text-gray-900">Caretaker</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <Edit className="w-5 h-5 mr-2 text-blue-600" />
          Profile Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="space-y-2">
            <p className="flex items-start">
              <span className="bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">•</span>
              Your profile information is managed by the system administrator
            </p>
            <p className="flex items-start">
              <span className="bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">•</span>
              Contact admin if you need to update your personal information
            </p>
          </div>
          <div className="space-y-2">
            <p className="flex items-start">
              <span className="bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">•</span>
              Location assignments can only be modified by administrators
            </p>
            <p className="flex items-start">
              <span className="bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">•</span>
              Your account status determines your system access permissions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaretakerProfile;