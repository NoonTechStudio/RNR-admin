// components/admin/TermsAndConditions/TermsList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import {
  Plus, Edit, Trash2, Eye, Search,
  FileText, Building, Droplets
} from "lucide-react";

const TermsList = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    search: "",
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  useEffect(() => {
    fetchTerms();
  }, [filters]);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/terms-and-conditions?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setTerms(data.data);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Failed to load terms");
      }
    } catch (error) {
      toast.error("Error loading terms and conditions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete handler with toast confirmation (replaces window.confirm)
  const handleDelete = (id, title) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="shrink-0 pt-0.5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">Delete Terms</p>
              <p className="mt-1 text-sm text-gray-500">
                Are you sure you want to delete "{title}"? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToast = toast.loading('Deleting terms...');
              try {
                const response = await fetch(`${API_BASE_URL}/terms-and-conditions/${id}`, {
                  method: "DELETE"
                });
                const data = await response.json();
                if (data.success) {
                  toast.success("Terms deleted successfully", { id: loadingToast });
                  fetchTerms();
                } else {
                  toast.error(data.error || "Failed to delete terms", { id: loadingToast });
                }
              } catch (error) {
                toast.error("Error deleting terms", { id: loadingToast });
                console.error(error);
              }
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Yes
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              toast.error("Deletion cancelled");
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            No
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/terms-and-conditions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Terms ${newStatus === "active" ? "activated" : "deactivated"}`);
        fetchTerms();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      inactive: "bg-red-100 text-red-800"
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type) => {
    return type === "location" ? <Building size={16} /> : <Droplets size={16} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions</h1>
          <p className="text-gray-600">Manage terms for locations and pool parties</p>
        </div>
        <Link
          to="/admin/terms/create"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Create New Terms
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search terms..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="location">Location</option>
              <option value="poolParty">Pool Party</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Terms List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading terms...</p>
          </div>
        ) : terms.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No terms found</h3>
            <p className="text-gray-600">Create your first terms and conditions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {terms.map((term) => (
                  <tr key={term._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          {getTypeIcon(term.type)}
                          <span className="ml-2 font-medium text-gray-900">{term.title}</span>
                        </div>
                        {term.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{term.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        term.type === "location" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {term.type === "location" ? "Location" : "Pool Party"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {term.applyToAll ? (
                          <span className="text-green-600 font-medium">All {term.type}s</span>
                        ) : (
                          <>
                            {term.appliedToCount || 0} {term.type === "location" ? "locations" : "pool parties"}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(term.status)}`}>
                        {term.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(term.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/terms/${term._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          to={`/admin/terms/${term._id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <Edit size={18} />
                        </Link>
                        {term.status === "active" ? (
                          <button
                            onClick={() => handleStatusChange(term._id, "inactive")}
                            className="text-orange-600 hover:text-orange-900"
                            title="Deactivate"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(term._id, "active")}
                            className="text-green-600 hover:text-green-900"
                            title="Activate"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(term._id, term.title)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            
            {[...Array(pagination.pages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setFilters({ ...filters, page: i + 1 })}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  filters.page === i + 1
                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page === pagination.pages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default TermsList;