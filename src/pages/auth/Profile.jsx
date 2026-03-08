import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, User as UserIcon, Save, ArrowLeft, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Toast from '../../components/ui/Toast';

const Profile = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

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

  const validateForm = () => {
    if (formData.username.length < 3) {
      showToast('Username must be at least 3 characters long', 'error');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      showToast('Username can only contain letters, numbers and underscores', 'error');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);

    const result = await updateProfile(formData);

    if (result.success) {
      showToast('Profile updated successfully!', 'success');
    } else {
      showToast(result.error, 'error');
    }

    setSaving(false);
  };

  const isFormValid = formData.username && formData.email;
  const hasChanges = formData.username !== user?.username || formData.email !== user?.email;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-black" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                <p className="text-blue-100">Manage your account information</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Information */}
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <div className="mt-1 relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter username"
                        minLength="3"
                        maxLength="30"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      3-30 characters, letters, numbers and underscores only
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="mt-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid || !hasChanges || saving}
                      className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {saving ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Account Information */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                  
                  <div className="space-y-4">
                    {/* Role */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Role
                      </label>
                      <div className="mt-1 flex items-center">
                        <Shield className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {user?.role}
                        </span>
                      </div>
                    </div>

                    {/* Account Created */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Member Since
                      </label>
                      <div className="mt-1 flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Last Login */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Last Login
                      </label>
                      <div className="mt-1 flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Status
                      </label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user?.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate('/change-password')}
                        className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Change Password
                      </button>
                      {user?.role === 'superadmin' && (
                        <button
                          onClick={() => navigate('/admin/create')}
                          className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          Create New Admin
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <Shield className="w-5 h-5 text-blue-600 mr-2 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Security Best Practices</h4>
              <ul className="mt-1 text-xs text-blue-700 list-disc list-inside space-y-1">
                <li>Use a strong, unique password for your account</li>
                <li>Never share your login credentials with others</li>
                <li>Log out from shared computers after use</li>
                <li>Regularly update your password</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;