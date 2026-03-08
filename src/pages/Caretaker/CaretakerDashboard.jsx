import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  LogOut,
  Menu,
  X,
  Home,
  Building,
  Shield
} from 'lucide-react';
import { useCaretakerAuth } from '../../context/CaretakerAuthContext';
import CaretakerBookings from './CaretakerBookings';
import CaretakerProfile from './CaretakerProfile';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CaretakerDashboard = ({ children }) => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, caretaker, isAuthenticated, loading } = useCaretakerAuth();
  const navigate = useNavigate();

  // Set initial tab based on current route or children
  useEffect(() => {
    if (children) {
      // If children are passed, determine active tab based on the child component
      if (React.isValidElement(children)) {
        if (children.type === CaretakerBookings) {
          setActiveTab('bookings');
        } else if (children.type === CaretakerProfile) {
          setActiveTab('profile');
        }
      }
    }
  }, [children]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/caretaker/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/caretaker/login');
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    // Navigate to the corresponding route
    switch (tabKey) {
      case 'bookings':
        navigate('/caretaker/bookings');
        break;
      case 'profile':
        navigate('/caretaker/profile');
        break;
      default:
        navigate('/caretaker/dashboard');
    }
  };

  const navigation = [
    { 
      name: 'Bookings', 
      key: 'bookings', 
      icon: Calendar,
      description: 'Manage location bookings'
    },
    { 
      name: 'Profile', 
      key: 'profile', 
      icon: User,
      description: 'Your account information'
    },
  ];

  const renderContent = () => {
    if (children) return children;
    
    switch (activeTab) {
      case 'bookings':
        return <CaretakerBookings />;
      case 'profile':
        return <CaretakerProfile />;
      default:
        return <CaretakerBookings />;
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show loading if caretaker data is not available yet
  if (!caretaker && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600">Loading caretaker information...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, this will be handled by the useEffect redirect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white shadow-sm">
          {/* Sidebar header */}
          <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center space-x-2">
              <Building className="w-6 h-6 text-white" />
              <h1 className="text-lg font-bold text-white">Caretaker Portal</h1>
            </div>
          </div>
          
          {/* User welcome section */}
          <div className="px-4 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {caretaker?.name || 'Caretaker'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {caretaker?.email || ''}
                </p>
                <div className="flex items-center mt-1">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    caretaker?.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-500">
                    {caretaker?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Assigned locations */}
          {caretaker?.locations && caretaker.locations.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-xs font-medium text-gray-700 mb-2">Assigned Locations:</p>
              <div className="space-y-1">
                {caretaker.locations.slice(0, 2).map((location) => (
                  <div key={location._id} className="flex items-center text-xs text-gray-600">
                    <Building className="w-3 h-3 mr-1 text-gray-400" />
                    <span className="truncate">{location.name}</span>
                  </div>
                ))}
                {caretaker.locations.length > 2 && (
                  <p className="text-xs text-gray-500">
                    +{caretaker.locations.length - 2} more locations
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex-1 flex flex-col pt-4 pb-4 overflow-y-auto">
            <nav className="flex-1 px-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleTabChange(item.key)}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`flex-shrink-0 h-5 w-5 mr-3 transition-colors ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className={`text-xs mt-1 ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Logout section */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg w-full transition-colors group"
            >
              <LogOut className="flex-shrink-0 h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-500" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1 w-0 flex-1">
        {/* Mobile header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 sm:px-6 shadow-sm">
            <div className="flex items-center">
              <button
                className="text-white hover:text-blue-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-white" />
                <h1 className="text-lg font-semibold text-white">Caretaker Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-blue-100">Welcome,</p>
                <p className="text-xs text-white font-medium truncate max-w-[120px]">
                  {caretaker?.name || 'Caretaker'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-white hover:text-blue-100 transition-colors p-1"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 flex z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                {/* Mobile header in sidebar */}
                <div className="flex-shrink-0 flex items-center px-4 bg-gradient-to-r from-blue-600 to-indigo-600 h-16">
                  <div className="flex items-center space-x-2">
                    <Building className="w-6 h-6 text-white" />
                    <h1 className="text-lg font-bold text-white">Caretaker Portal</h1>
                  </div>
                </div>
                
                {/* User info */}
                <div className="px-4 py-4 border-b border-gray-200 bg-blue-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {caretaker?.name || 'Caretaker'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {caretaker?.email || ''}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          caretaker?.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs text-gray-500">
                          {caretaker?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="mt-5 px-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          handleTabChange(item.key);
                          setSidebarOpen(false);
                        }}
                        className={`group flex items-center px-3 py-4 text-base font-medium rounded-lg w-full text-left transition-all ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon className={`flex-shrink-0 h-6 w-6 mr-4 ${
                          isActive ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className={`text-sm mt-1 ${
                            isActive ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
              
              {/* Logout section */}
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg w-full transition-colors"
                >
                  <LogOut className="flex-shrink-0 h-6 w-6 mr-4 text-gray-400" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Mobile breadcrumb */}
              <div className="lg:hidden mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Home className="w-4 h-4" />
                  <span>/</span>
                  <span className="font-medium text-gray-700 capitalize">
                    {activeTab}
                  </span>
                </div>
              </div>
              
              {/* Page content */}
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CaretakerDashboard;