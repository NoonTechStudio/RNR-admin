import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  CheckCircle, 
  XCircle,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserPlus,
  Menu,
  X,
  MoreVertical,
  ArrowUpDown
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Toast from '../../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

const GetCaretakers = () => {
  const [caretakers, setCaretakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;
  const token = localStorage.getItem('adminToken');

  // Fetch caretakers
  useEffect(() => {
    fetchCaretakers();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchCaretakers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/caretaker/all?page=${currentPage}&status=${statusFilter}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCaretakers(data.caretakers || []);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error('Failed to fetch caretakers');
      }
    } catch (error) {
      console.error('Error fetching caretakers:', error);
      showToast('Failed to load caretakers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (caretaker) => {
    navigate(`/caretakers/edit/${caretaker._id}`);
  };

  // Handle delete button click
  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({ show: true, id, name });
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/caretaker/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        showToast('Caretaker deleted successfully', 'success');
        fetchCaretakers();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast(error.message || 'Failed to delete caretaker', 'error');
    } finally {
      setDeleteConfirm({ show: false, id: null, name: '' });
    }
  };

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  // Filter caretakers
  const filteredCaretakers = caretakers.filter(caretaker => {
    const matchesSearch = caretaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caretaker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caretaker.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && caretaker.isActive) ||
                         (statusFilter === 'inactive' && !caretaker.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Toggle row expansion on mobile
  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}

      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 max-w-sm w-full mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Are you sure you want to delete caretaker <span className="font-semibold">{deleteConfirm.name}</span>? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors w-full sm:w-auto order-1 sm:order-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="lg:hidden mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Caretakers</h1>
            <p className="text-xs text-gray-600 mt-1">Manage all caretaker accounts</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/caretakers/create')}
              className="p-2 bg-blue-600 text-white rounded-lg shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search caretakers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Caretakers Management</h1>
            <p className="text-gray-600 mt-1">Manage and monitor all caretaker accounts and permissions</p>
          </div>
          <button
            onClick={() => navigate('/caretakers/create')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Caretaker
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Mobile Filters Overlay */}
        {showMobileFilters && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40">
            <div className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-xl">
              <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setShowMobileFilters(false);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setShowMobileFilters(false);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition mb-2"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Filters */}
        <div className="hidden lg:flex items-center justify-between mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search caretakers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredCaretakers.length} caretaker{filteredCaretakers.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : filteredCaretakers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">No caretakers found</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredCaretakers.map((caretaker) => (
              <div 
                key={caretaker._id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div 
                  className="p-4"
                  onClick={() => toggleRowExpansion(caretaker._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{caretaker.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{caretaker.email}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(caretaker.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                        caretaker.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {caretaker.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpansion(caretaker._id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedRow === caretaker._id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-slideDown">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Phone</p>
                          <p className="text-sm font-medium text-gray-900">{caretaker.phone}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Assigned Locations</p>
                          <div className="flex flex-wrap gap-1">
                            {caretaker.locations.slice(0, 3).map((location) => (
                              <span
                                key={location._id}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {location.name}
                              </span>
                            ))}
                            {caretaker.locations.length > 3 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                                +{caretaker.locations.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={() => handleEdit(caretaker)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(caretaker._id, caretaker.name)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredCaretakers.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No caretakers found</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-blue-600 hover:text-blue-700"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Locations</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCaretakers.map((caretaker) => (
                        <tr key={caretaker._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{caretaker.name}</p>
                                <p className="text-xs text-gray-500">
                                  Created: {formatDate(caretaker.createdAt)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{caretaker.email}</td>
                          <td className="py-3 px-4 text-gray-700">{caretaker.phone}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {caretaker.locations.slice(0, 2).map((location) => (
                                <span
                                  key={location._id}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                >
                                  {location.name}
                                </span>
                              ))}
                              {caretaker.locations.length > 2 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                                  +{caretaker.locations.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              caretaker.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {caretaker.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(caretaker)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(caretaker._id, caretaker.name)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Pagination */}
            {filteredCaretakers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-gray-200 gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Pagination */}
        {filteredCaretakers.length > 0 && (
          <div className="lg:hidden mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700">
                {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default GetCaretakers;