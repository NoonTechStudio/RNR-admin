import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Star,
  Images,
  LogOut,
  User,
  Settings,
  Menu,
  X,
  Calendar,
  CreditCard,
  BarChart3,
  AlertTriangle,
  Hotel,
  Waves,
  NotepadText,
  FileText,
  Percent
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PLogo from "../../assets/Images/favicon.png";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1080);
      if (window.innerWidth >= 1080) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Location Booking", href: "/bookings", icon: Calendar },
    { name: "Pool-Party Bookings", href: "/pool-party-bookings", icon: NotepadText },
    { name: "Hero Images", href: "/hero-image-management", icon: Images },
    { name: "Locations", href: "/locations", icon: MapPin },
    { name: "Reviews", href: "/reviews", icon: Star },
    { name: "Memories", href: "/memories", icon: Images },
    { name: "Offers", href: "/admin/offers", icon: Percent },
    { name: "Caretakers", href: "/caretaker/all", icon: Hotel },
    { name: "Pool Parties", href: "/pool-parties", icon: Waves },
    { name: "Terms and Conditions", href: "/admin/terms", icon: FileText },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-60 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
          w-64 bg-white transition-all duration-300 ease-in-out
          ${isMobile 
            ? `transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'translate-x-0'
          }
          flex flex-col h-full
        `}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between px-5 h-16">
          <div className="flex items-center space-x-2">
            <img
              src={PLogo}
              alt="Rest And Relax"
              className="w-15 h-15 object-contain"
            />
            <span className="text-lg font-semibold text-gray-900">
              Rest And Relax
            </span>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* User info */}
        <div className="px-5 py-6 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation with custom scrollbar */}
        <nav className="flex-1 px-4 py-5 flex flex-col overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                      ${
                        active
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Settings & Logout */}
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-1">
            <Link
              to="/profile"
              onClick={() => isMobile && setSidebarOpen(false)}
              className="flex items-center px-3 py-2 text-sm rounded-md font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
            >
              <User className="w-5 h-5 mr-3" />
              My Profile
            </Link>
            <Link
              to="/change-password"
              onClick={() => isMobile && setSidebarOpen(false)}
              className="flex items-center px-3 py-2 text-sm rounded-md font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
            >
              <Settings className="w-5 h-5 mr-3" />
              Change Password
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 bg-white z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            {isMobile ? (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md hover:bg-gray-100 transition"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
            ) : (
              <div className="w-8"></div>
            )}
            <div className="hidden sm:block text-xs sm:text-sm text-gray-500">
              Last login:{" "}
              {user?.lastLogin
                ? new Date(user.lastLogin).toLocaleDateString()
                : "Never"}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
          <div className="max-w-full">{children}</div>
        </main>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #c1c1c1 #f1f1f1;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;