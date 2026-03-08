import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, User, Phone, MapPin, DollarSign,
  Users, Utensils, CheckCircle, XCircle, Clock, RefreshCw,
  IndianRupee, Wallet, AlertCircle, Building, Droplets, Tag, Waves
} from 'lucide-react';
import { useCaretakerAuth } from '../../context/CaretakerAuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Toast from '../../components/ui/Toast';

const CaretakerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('all');

  const { caretaker, isAuthenticated } = useCaretakerAuth();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  useEffect(() => {
    if (isAuthenticated && caretaker) {
      fetchCaretakerBookings();
    }
  }, [isAuthenticated, caretaker]);

  const fetchCaretakerBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('caretakerToken');
      const response = await fetch(`${API_BASE_URL}/caretaker/bookings?bookingType=all`, {
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
        setBookings(data.bookings || []);
      } else {
        throw new Error(data.error || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching caretaker bookings:', error);
      showToast('Failed to load bookings', 'error');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (bookingId, bookingType = 'simple') => {
    try {
      setActionLoading(bookingId);
      const token = localStorage.getItem('caretakerToken');
      
      const response = await fetch(`${API_BASE_URL}/caretaker/bookings/${bookingId}/payment-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingType })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const message = bookingType === 'poolparty' 
          ? 'Pool party booking marked as paid successfully!' 
          : 'Payment status updated to fully-paid successfully!';
        
        showToast(message, 'success');
        
        // Update local state
        setBookings(prevBookings => 
          prevBookings.map(booking => {
            if (booking._id === bookingId || booking.id === bookingId) {
              const isPoolParty = bookingType === 'poolparty' || booking.bookingType === 'poolparty';
              return {
                ...booking,
                paymentStatus: isPoolParty ? 'paid' : 'fully-paid',
                remainingAmount: 0,
                amountPaid: isPoolParty 
                  ? booking.pricing?.totalPrice || booking.totalAmount || 0
                  : booking.pricing?.totalPrice || booking.totalAmount || 0,
                markedPaidBy: {
                  _id: caretaker?._id,
                  name: caretaker?.name,
                  email: caretaker?.email
                },
                markedPaidAt: new Date().toISOString()
              };
            }
            return booking;
          })
        );
      } else {
        throw new Error(data.error || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      showToast(error.message || 'Failed to update payment status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  // Filter bookings based on search, status, location, and booking type
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guestName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      booking.phone?.includes(searchTerm) ||
      booking.locationInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (booking.paymentStatus === statusFilter) ||
      (booking.paymentDetails?.status === statusFilter);

    const matchesLocation = selectedLocation === 'all' || 
      booking.location?._id === selectedLocation ||
      booking.locationInfo?._id === selectedLocation;

    const matchesBookingType = bookingTypeFilter === 'all' || 
      booking.bookingType === bookingTypeFilter;

    // Date filtering
    let matchesDate = true;
    const dateToCheck = booking.checkInDate || booking.bookingDate;
    
    if (dateFilter !== 'all' && dateToCheck) {
      const today = new Date();
      const checkDate = new Date(dateToCheck);
      // Convert both to UTC midnight for comparison
      const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
      const checkDateUTC = Date.UTC(checkDate.getUTCFullYear(), checkDate.getUTCMonth(), checkDate.getUTCDate());
      
      switch (dateFilter) {
        case 'today':
          matchesDate = checkDateUTC === todayUTC;
          break;
        case 'upcoming':
          matchesDate = checkDateUTC > todayUTC;
          break;
        case 'past':
          matchesDate = checkDateUTC < todayUTC;
          break;
        case 'thisWeek': {
          const startOfWeek = new Date(todayUTC);
          startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
          matchesDate = checkDateUTC >= startOfWeek.getTime() && checkDateUTC <= endOfWeek.getTime();
          break;
        }
        default:
          matchesDate = true;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate && matchesLocation && matchesBookingType;
  });

  const getStatusBadge = (status, bookingType = 'simple') => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'fully-paid': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'half-paid': { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      'full-paid': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'partially_paid': { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const effectiveStatus = bookingType === 'poolparty' 
      ? (status === 'paid' ? 'paid' : status === 'partially_paid' ? 'half-paid' : status)
      : status;
    
    const config = statusConfig[effectiveStatus] || statusConfig.pending;
    const Icon = config.icon;
    
    const statusText = effectiveStatus === 'fully-paid' || effectiveStatus === 'paid' ? 'Paid' :
                      effectiveStatus === 'half-paid' || effectiveStatus === 'partially_paid' ? 'Partially Paid' :
                      effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1);
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {statusText}
      </span>
    );
  };

  const getBookingTypeBadge = (bookingType) => {
    const typeConfig = {
      simple: { color: 'bg-blue-100 text-blue-800', icon: Building, label: 'Villa Booking' },
      poolparty: { color: 'bg-teal-100 text-teal-800', icon: Droplets, label: 'Pool Party' }
    };
    
    const config = typeConfig[bookingType] || typeConfig.simple;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
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

  // ✅ FIXED: Use UTC to avoid timezone shift
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'  // 👈 forces the date part to be interpreted as UTC
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // ✅ FIXED: Use UTC for day difference calculation
  const getDaysUntilCheckIn = (checkInDate) => {
    if (!checkInDate) return 'N/A';
    
    const today = new Date();
    const checkIn = new Date(checkInDate);

    // Set both to UTC midnight
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const checkInUTC = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());

    const diffTime = checkInUTC - todayUTC;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays === -1) return 'Yesterday';
    return `${Math.abs(diffDays)} days ago`;
  };

  const handleRefresh = () => {
    fetchCaretakerBookings();
    showToast('Bookings refreshed successfully', 'success');
  };

  const getBookingStats = () => {
    const total = filteredBookings.length;
    const simpleBookings = filteredBookings.filter(b => b.bookingType === 'simple').length;
    const poolPartyBookings = filteredBookings.filter(b => b.bookingType === 'poolparty').length;
    
    // Calculate revenue
    const totalRevenue = filteredBookings.reduce((sum, booking) => 
      sum + (booking.amountPaid || booking.paymentDetails?.amountPaid || 0), 0);
    
    const pendingRevenue = filteredBookings.reduce((sum, booking) => {
      const status = booking.paymentStatus || booking.paymentDetails?.status;
      if (status === 'pending' || status === 'half-paid' || status === 'partially_paid') {
        return sum + (booking.remainingAmount || booking.paymentDetails?.remainingAmount || 0);
      }
      return sum;
    }, 0);
    
    return { total, simpleBookings, poolPartyBookings, totalRevenue, pendingRevenue };
  };

  const stats = getBookingStats();

  const PaymentBreakdown = ({ booking }) => {
    const isPoolParty = booking.bookingType === 'poolparty';
    const totalAmount = booking.pricing?.totalPrice || booking.paymentDetails?.totalAmount || 0;
    const amountPaid = booking.amountPaid || booking.paymentDetails?.amountPaid || 0;
    const remainingAmount = booking.remainingAmount || booking.paymentDetails?.remainingAmount || 0;
    const paymentType = booking.paymentType;

    return (
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Total:</span>
          <span className="font-medium">{formatCurrency(totalAmount)}</span>
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
        {paymentType === 'token' && (
          <div className="mt-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-purple-700 text-xs">
            Token Payment
          </div>
        )}
      </div>
    );
  };

  // ✅ FIXED: Use UTC dates for duration calculation
  const getDuration = (checkInDate, checkOutDate, bookingType) => {
    if (bookingType === 'poolparty') return 'Single Session';
    
    if (!checkInDate || !checkOutDate) return 'N/A';
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    // Use UTC dates to avoid timezone influence on the difference
    const checkInUTC = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
    const checkOutUTC = Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate());
    const diffTime = checkOutUTC - checkInUTC;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + ' nights';
  };

  if (loading) {
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-600 mt-1">
            Manage villa and pool party bookings for your assigned locations
            {caretaker && (
              <span className="text-blue-600 font-medium ml-2">
                Welcome, {caretaker.name}!
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {filteredBookings.length} of {bookings.length} bookings
          </span>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Villa Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.simpleBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Droplets className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pool Party</p>
              <p className="text-2xl font-bold text-gray-900">{stats.poolPartyBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Collected Revenue</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by guest name, phone, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Booking Type Filter */}
          <div>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={bookingTypeFilter}
                onChange={(e) => setBookingTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="all">All Types</option>
                <option value="simple">Villa Bookings</option>
                <option value="poolparty">Pool Party</option>
              </select>
            </div>
          </div>

          {/* Location Filter */}
          {caretaker?.locations && caretaker.locations.length > 1 && (
            <div>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                >
                  <option value="all">All Locations</option>
                  {caretaker.locations.map(location => (
                    <option key={location._id} value={location._id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="half-paid">Partially Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="fully-paid">Fully Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
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
                  Booking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guests & Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No bookings found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const isPoolParty = booking.bookingType === 'poolparty';
                  const guestName = isPoolParty ? booking.guestName : booking.name;
                  const locationName = booking.locationInfo?.name || booking.location?.name || 'N/A';
                  const checkInDate = isPoolParty ? booking.bookingDate : booking.checkInDate;
                  const checkOutDate = isPoolParty ? booking.bookingDate : booking.checkOutDate;
                  
                  return (
                    <tr key={booking._id || booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            isPoolParty ? 'bg-teal-100' : 'bg-blue-100'
                          }`}>
                            {isPoolParty ? 
                              <Waves className="w-5 h-5 text-teal-600" /> : 
                              <User className="w-5 h-5 text-blue-600" />
                            }
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {guestName || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {booking.phone || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {locationName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(checkInDate)}
                        </div>
                        {!isPoolParty && (
                          <div className="text-sm text-gray-500">
                            to {formatDate(checkOutDate)}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {getDuration(checkInDate, checkOutDate, booking.bookingType)}
                        </div>
                        {checkInDate && (
                          <div className={`text-xs mt-1 ${
                            new Date(checkInDate) > new Date() ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {getDaysUntilCheckIn(checkInDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPoolParty ? (
                          <>
                            <div className="flex items-center text-sm text-gray-900">
                              <Users className="w-4 h-4 mr-2 text-gray-400" />
                              {booking.totalGuests || (booking.adults + booking.kids)} Guests
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Session: {booking.session}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center text-sm text-gray-900">
                              <Users className="w-4 h-4 mr-2 text-gray-400" />
                              {booking.adults || 0} Adults
                            </div>
                            {booking.kids > 0 && (
                              <div className="text-sm text-gray-500 mt-1">
                                + {booking.kids} Kids
                              </div>
                            )}
                            {booking.withFood && (
                              <div className="flex items-center text-xs text-green-600 mt-1">
                                <Utensils className="w-3 h-3 mr-1" />
                                With Food
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentBreakdown booking={booking} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          {getStatusBadge(booking.paymentStatus || booking.paymentDetails?.status, booking.bookingType)}<br/>
                          {getBookingTypeBadge(booking.bookingType || 'simple')}<br/>
                          {booking.paymentType && getPaymentTypeBadge(booking.paymentType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.markedPaidBy ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.markedPaidBy.name}
                            </div>
                            {booking.markedPaidAt && (
                              <div className="text-xs text-gray-500">
                                {new Date(booking.markedPaidAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {(booking.paymentStatus === 'half-paid' || 
                            booking.paymentStatus === 'partially_paid' ||
                            (booking.paymentStatus === 'pending' && booking.amountPaid > 0)) && (
                            <button
                              onClick={() => updatePaymentStatus(
                                booking._id || booking.id, 
                                booking.bookingType || 'simple'
                              )}
                              disabled={actionLoading === (booking._id || booking.id)}
                              className="inline-flex items-center px-3 py-1 border border-green-300 text-xs font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === (booking._id || booking.id) ? (
                                <LoadingSpinner size="sm" className="mr-1" />
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CaretakerBookings;