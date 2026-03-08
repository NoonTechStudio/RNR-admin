import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Edit, Calendar, User, Phone, MapPin, 
  IndianRupee, Users, Utensils, CheckCircle, XCircle, Clock,
  MoreVertical, CreditCard, Trash2, RefreshCw, Plus,
  Wallet, AlertCircle, Mail, ChevronLeft, ChevronRight
} from 'lucide-react';
import { paymentAPI } from '../../services/paymentApi';
import AdminPaymentModal from './AdminPaymentModal';
import LoadingSpinner from '../ui/LoadingSpinner';
import Toast from '../ui/Toast';

// ==================== Helper Functions ====================
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const localDate = new Date(year, month, day);
  return localDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
    partially_paid: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
  };
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
    </span>
  );
};

const getPaymentTypeBadge = (paymentType) => {
  const typeConfig = {
    full: { color: 'bg-blue-100 text-blue-800', label: 'Full Payment' },
    token: { color: 'bg-purple-100 text-purple-800', label: 'Token Payment' }
  };
  const config = typeConfig[paymentType] || typeConfig.full;
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Wallet className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
};

const getDaysUntilCheckIn = (checkInDate) => {
  const today = new Date();
  const checkIn = new Date(checkInDate);
  const diffTime = checkIn - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1) return `In ${diffDays} days`;
  if (diffDays === -1) return 'Yesterday';
  return `${Math.abs(diffDays)} days ago`;
};

// ==================== Memoized Sub‑Components ====================
const PaymentBreakdown = React.memo(({ booking }) => {
  const amountPaid = booking.amountPaid || 0;
  const remainingAmount = booking.remainingAmount || 0;
  const finalAmount = amountPaid + remainingAmount;
  const isTokenPayment = booking.paymentType === 'token';

  return (
    <div className="text-xs space-y-1">
      <div className="flex justify-between">
        <span className="text-gray-600">Total:</span>
        <span className="font-medium">{formatCurrency(finalAmount)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Paid:</span>
        <span className="font-medium text-green-600">{formatCurrency(amountPaid)}</span>
      </div>
      {remainingAmount > 0 && (
        <div className="flex justify-between">
          <span className="text-gray-600">Remaining:</span>
          <span className="font-medium text-orange-600">{formatCurrency(remainingAmount)}</span>
        </div>
      )}
      {isTokenPayment && (
        <div className="mt-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-purple-700">
          Token Payment
        </div>
      )}
    </div>
  );
});

const FoodPackageDetails = React.memo(({ booking }) => {
  if (!booking.withFood) {
    return <span className="text-xs text-gray-500">No Food</span>;
  }

  if (booking.dailyFoodPackages && booking.dailyFoodPackages.length > 0) {
    const packageNames = [...new Set(booking.dailyFoodPackages.map(p => p.name))];
    return (
      <div className="text-xs">
        <span className="font-medium text-green-600">Daily Food</span>
        <span className="text-gray-600 ml-1">({booking.dailyFoodPackages.length} days)</span>
        {packageNames.length === 1 ? (
          <div className="text-gray-500 truncate max-w-[150px]" title={packageNames[0]}>
            {packageNames[0]}
          </div>
        ) : (
          <div className="text-gray-500" title={packageNames.join(', ')}>
            {packageNames.length} packages
          </div>
        )}
      </div>
    );
  }

  if (booking.foodPackage) {
    return (
      <div className="text-xs">
        <span className="font-medium text-green-600">With Food</span>
        <div className="text-gray-500 truncate max-w-[150px]" title={booking.foodPackage.name}>
          {booking.foodPackage.name}
        </div>
      </div>
    );
  }

  return <span className="text-xs text-gray-500">Food selected</span>;
});

// ==================== Main Component ====================
const GetBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showPaymentAnalytics, setShowPaymentAnalytics] = useState(false);
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ message: '', onConfirm: null, booking: null });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const limit = 10; // items per page

  const API_BASE_URL = useRef(import.meta.env.VITE_API_CONNECTION_HOST).current;
  const abortControllerRef = useRef(null);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsAuthenticated(!!token);
  }, []);

  // Load Razorpay script
  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // Fetch bookings with pagination and filters
  const fetchBookings = useCallback(async (page = currentPage) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentTypeFilter !== 'all' && { paymentType: paymentTypeFilter }),
        ...(searchTerm && { search: searchTerm }),
        // date filter could be added as startDate/endDate if needed
      });
      const response = await fetch(`${API_BASE_URL}/bookings?${params}`, {
        signal: abortControllerRef.current.signal
      });
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings);
        setTotalPages(data.totalPages || 1);
        setTotalBookings(data.total || 0);
        setCurrentPage(data.page || 1);
      } else {
        throw new Error(data.error || 'Failed to fetch bookings');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching bookings:', error);
        showToast('Failed to load bookings', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, currentPage, limit, statusFilter, paymentTypeFilter, searchTerm]);

  // Initial fetch and when filters change (reset to page 1)
  useEffect(() => {
    setCurrentPage(1);
    fetchBookings(1);
  }, [statusFilter, paymentTypeFilter, searchTerm, dateFilter]);

  // Payment analytics
  const fetchPaymentAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/analytics/payments`);
      const data = await response.json();
      if (data.success) setPaymentAnalytics(data);
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
    }
  }, [API_BASE_URL]);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  }, []);

  // Confirmation modal
  const showConfirmation = useCallback((message, onConfirm, booking = null) => {
    setConfirmConfig({ message, onConfirm, booking });
    setShowConfirmModal(true);
  }, []);

  // Razorpay payment
  const initiateRazorpayPayment = useCallback(async (booking) => {
    if (!window.Razorpay) {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        showToast('Payment gateway failed to load', 'error');
        return;
      }
    }
    if (!isAuthenticated) {
      showToast('Please login to process payments', 'error');
      return;
    }
    setRazorpayLoading(true);
    try {
      let paymentAmount = 0;
      if (booking.paymentType === 'full') {
        paymentAmount = booking.pricing?.totalPrice || 0;
      } else if (booking.paymentType === 'token') {
        paymentAmount = booking.remainingAmount > 0 ? booking.remainingAmount : (booking.pricing?.totalPrice || 0);
      }
      if (paymentAmount <= 0) {
        showToast('No payment required for this booking', 'info');
        return;
      }
      const orderResponse = await paymentAPI.createOrder({
        bookingId: booking._id,
        amount: paymentAmount,
        currency: 'INR',
        userEmail: booking.email || '',
        userPhone: booking.phone
      });
      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.error || 'Failed to create payment order');
      }
      const { order, key } = orderResponse.data;
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: 'Resort Booking System',
        description: `Payment for booking ${booking._id}`,
        image: '/logo.png',
        order_id: order.id,
        handler: async function (response) {
          await verifyRazorpayPayment(response, booking._id);
        },
        prefill: {
          name: booking.name,
          contact: booking.phone,
          email: booking.email || '',
        },
        notes: { bookingId: booking._id, guestName: booking.name },
        theme: { color: '#4F46E5' },
        modal: {
          ondismiss: function() {
            setRazorpayLoading(false);
            showToast('Payment cancelled', 'info');
          }
        }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('❌ Razorpay payment error:', error);
      showToast(error.response?.data?.error || error.message || 'Payment initialization failed', 'error');
      setRazorpayLoading(false);
    }
  }, [isAuthenticated, showToast, loadRazorpayScript]);

  // Verify payment
  const verifyRazorpayPayment = useCallback(async (paymentResponse, bookingId) => {
    try {
      const verifyResponse = await paymentAPI.verifyPayment({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        bookingId: bookingId
      });
      if (verifyResponse.data.success) {
        showToast('Payment completed successfully!', 'success');
        fetchBookings(currentPage);
      } else {
        throw new Error(verifyResponse.data.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      showToast(error.response?.data?.error || error.message || 'Payment verification failed', 'error');
    } finally {
      setRazorpayLoading(false);
    }
  }, [showToast, fetchBookings, currentPage]);

  // Mark as paid
  const handleMarkAsPaid = useCallback((booking) => {
    showConfirmation(
      'Mark this booking as fully paid without actual payment?',
      async () => {
        try {
          const response = await paymentAPI.markAsPaid({
            bookingId: booking._id,
            notes: 'Marked as paid by admin without payment'
          });
          if (response.data.success) {
            showToast('Booking marked as paid successfully!', 'success');
            fetchBookings(currentPage);
          } else {
            throw new Error(response.data.error || 'Failed to mark as paid');
          }
        } catch (error) {
          console.error('❌ Error marking as paid:', error);
          if (error.response?.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            localStorage.removeItem('adminToken');
            setIsAuthenticated(false);
          } else {
            showToast(error.response?.data?.error || error.message || 'Failed to mark as paid', 'error');
          }
        }
      },
      booking
    );
  }, [showConfirmation, showToast, fetchBookings, currentPage]);

  // Delete booking
  const handleDeleteBooking = useCallback((bookingId) => {
    showConfirmation(
      "Are you sure you want to delete this booking?",
      async () => {
        setActionLoading("deleting");
        try {
          const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, { method: "DELETE" });
          const data = await response.json();
          if (response.ok) {
            showToast("Booking deleted successfully!", "success");
            fetchBookings(currentPage);
          } else {
            showToast(data.error || "Failed to delete booking", "error");
          }
        } catch (error) {
          console.error("Error deleting booking:", error);
          showToast("Server error while deleting booking", "error");
        } finally {
          setActionLoading(null);
        }
      },
      { _id: bookingId }
    );
  }, [showConfirmation, showToast, fetchBookings, API_BASE_URL, currentPage]);

  // Update payment status (partial)
  const handleUpdatePaymentStatus = useCallback(async (bookingId, status, amountPaid = null, remainingAmount = null) => {
    try {
      const updateData = {
        paymentStatus: status,
        ...(amountPaid !== null && { amountPaid }),
        ...(remainingAmount !== null && { remainingAmount })
      };
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Payment status updated successfully!', 'success');
        fetchBookings(currentPage);
      } else {
        showToast(data.error || 'Failed to update payment status', 'error');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      showToast('Error updating payment status', 'error');
    }
  }, [showToast, fetchBookings, API_BASE_URL, currentPage]);

  // Payment click handler
  const handlePaymentClick = useCallback((booking) => {
    if (booking.paymentStatus === 'paid') {
      showToast('This booking is already paid', 'info');
      return;
    }
    if (booking.paymentStatus === 'pending') {
      initiateRazorpayPayment(booking);
    } else {
      setSelectedBooking(booking);
      setShowPaymentModal(true);
    }
  }, [initiateRazorpayPayment, showToast]);

  // Refresh (stay on current page)
  const handleRefresh = useCallback(() => {
    fetchBookings(currentPage);
    showToast('Bookings refreshed successfully', 'success');
  }, [fetchBookings, currentPage, showToast]);

  // Analytics modal
  const handleShowAnalytics = useCallback(async () => {
    setShowPaymentAnalytics(true);
    await fetchPaymentAnalytics();
  }, [fetchPaymentAnalytics]);

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchBookings(page);
    }
  };

  // Statistics based on current page (for display – optional)
  const stats = useMemo(() => {
    const total = bookings.length;
    const paid = bookings.filter(b => b.paymentStatus === 'paid').length;
    const pending = bookings.filter(b => b.paymentStatus === 'pending').length;
    const failed = bookings.filter(b => b.paymentStatus === 'failed').length;
    const partiallyPaid = bookings.filter(b => b.paymentStatus === 'partially_paid').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
    const pendingRevenue = bookings.reduce((sum, b) => {
      if (b.paymentStatus === 'pending' || b.paymentStatus === 'partially_paid') {
        return sum + (b.remainingAmount || 0);
      }
      return sum;
    }, 0);
    return { total, paid, pending, failed, partiallyPaid, totalRevenue, pendingRevenue };
  }, [bookings]);

  // --- Render ---
  if (loading && bookings.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirmation</h3>
              </div>
              <p className="text-gray-600 mb-6">{confirmConfig.message}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmConfig.onConfirm(confirmConfig.booking);
                    setShowConfirmModal(false);
                  }}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Status Banner */}
      {!isAuthenticated && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h4 className="text-red-800 font-semibold">Authentication Required</h4>
              <p className="text-red-700 text-sm">
                Please login to access payment features. Payment actions will be disabled until you login.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <AdminPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        booking={selectedBooking}
        amount={selectedBooking?.pricing?.totalPrice}
        onPaymentSuccess={(data) => {
          showToast('Payment completed successfully!', 'success');
          setShowPaymentModal(false);
          fetchBookings(currentPage);
        }}
        onPaymentFailure={(error) => {
          showToast(`Payment failed: ${error}`, 'error');
          setShowPaymentModal(false);
          fetchBookings(currentPage);
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all resort bookings and reservations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Showing {bookings.length} of {totalBookings} bookings
          </span>
          <Link
            to="/bookings/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings (page)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paid (page)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending (page)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Partial Paid (page)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.partiallyPaid}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed (page)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue (page)</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500">Pending: {formatCurrency(stats.pendingRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, location, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-40">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partial Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Payment Type Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="all">All Payment Types</option>
                <option value="full">Full Payment</option>
                <option value="token">Token Payment</option>
              </select>
            </div>
          </div>

          {/* Date Filter */}
          <div className="sm:w-40">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="thisWeek">This Week</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShowAnalytics}
              className="p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Payment Analytics"
            >
              <IndianRupee className="w-5 h-5" />
            </button>
            <button
              onClick={handleRefresh}
              className="p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates & Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Food Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No bookings found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                      <Link
                        to="/bookings/new"
                        className="inline-flex items-center mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Booking
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="w-3 h-3 mr-1" />
                            {booking.phone}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {booking.email || 'No email'}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {booking.location?.name}
                          </div>
                          {booking.razorpayOrderId && (
                            <div className="text-xs text-gray-400 mt-1">
                              Order: {booking.razorpayOrderId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(booking.checkInDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {formatDate(booking.checkOutDate)}
                      </div>
                     <div className="text-xs text-gray-400 mt-1">
  {booking.pricing?.nights || 0} nights
</div>
                      <div className={`text-xs mt-1 ${
                        new Date(booking.checkInDate) > new Date() ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {getDaysUntilCheckIn(booking.checkInDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        {booking.adults} Adults
                      </div>
                      {booking.kids > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          + {booking.kids} Kids
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <FoodPackageDetails booking={booking} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentBreakdown booking={booking} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {getStatusBadge(booking.paymentStatus)}<br/>
                        {getPaymentTypeBadge(booking.paymentType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/bookings/edit/${booking._id}`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Link>
                        
                        {booking.paymentStatus === 'pending' && booking.pricing?.totalPrice > 0 && (
                          <button
                            onClick={() => handlePaymentClick(booking)}
                            disabled={razorpayLoading || !isAuthenticated}
                            className="inline-flex items-center px-3 py-1 border border-green-300 text-xs font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {razorpayLoading ? (
                              <LoadingSpinner size="sm" className="mr-1" />
                            ) : (
                              <CreditCard className="w-3 h-3 mr-1" />
                            )}
                            Pay
                          </button>
                        )}

                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionLoading(actionLoading === booking._id ? null : booking._id)
                            }
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {actionLoading === booking._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              {booking.paymentStatus !== 'paid' && (
                                <button
                                  onClick={() => handleMarkAsPaid(booking)}
                                  disabled={!isAuthenticated}
                                  className="flex items-center px-4 py-2 text-sm text-green-600 hover:bg-gray-100 w-full text-left disabled:opacity-50"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {isAuthenticated ? 'Mark as Paid' : 'Login Required'}
                                </button>
                              )}
                              
                              {booking.paymentStatus === 'pending' && (
                                <button
                                  onClick={() => {
                                    const amountPaid = booking.pricing?.totalPrice * 0.5;
                                    const remainingAmount = booking.pricing?.totalPrice - amountPaid;
                                    handleUpdatePaymentStatus(booking._id, 'partially_paid', amountPaid, remainingAmount);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-gray-100 w-full text-left"
                                >
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Mark as Partial Paid
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteBooking(booking._id)}
                                disabled={actionLoading === 'deleting'}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left disabled:opacity-50"
                              >
                                {actionLoading === 'deleting' ? (
                                  <LoadingSpinner size="sm" className="mr-2" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Delete Booking
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Analytics Modal */}
      {showPaymentAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Payment Analytics</h3>
                <button
                  onClick={() => setShowPaymentAnalytics(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              {paymentAnalytics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Total Revenue</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(paymentAnalytics.overall.totalRevenue)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Collection Rate</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {((paymentAnalytics.overall.collectionRate || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Pending Collection</h4>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(paymentAnalytics.overall.totalRemainingAmount)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Payment Type Breakdown</h4>
                    <div className="space-y-4">
                      {paymentAnalytics.analytics.map((type, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">
                              {type._id === 'full' ? 'Full Payments' : 'Token Payments'}
                            </span>
                            <span className="text-sm text-gray-500">{type.totalBookings} bookings</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Total Revenue:</span>
                              <p className="font-semibold text-green-600">{formatCurrency(type.totalAmountPaid)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Pending:</span>
                              <p className="font-semibold text-orange-600">{formatCurrency(type.totalRemainingAmount)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Paid Bookings:</span>
                              <p className="font-semibold">{type.paidBookings}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Avg Payment:</span>
                              <p className="font-semibold">{formatCurrency(type.averagePayment)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <LoadingSpinner />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GetBookings;