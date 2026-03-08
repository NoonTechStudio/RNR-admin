// AdminCreatePoolPartyBookingPage.jsx – Full‑page admin pool party booking creation
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Calendar, User, Phone, Mail, Home, Clock, Utensils, CreditCard,
  CheckCircle, AlertCircle, Users, Loader2, ChevronDown, ArrowLeft, Shield, Download
} from 'lucide-react';

// ----------------------------------------------------------------------
// Helper: get YYYY‑MM‑DD in local time (prevents timezone shift)
const getLocalDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ----------------------------------------------------------------------
// Main component
const AdminCreatePoolPartyBookingPage = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;
  const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

  // ---------- State ----------
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [poolPartyData, setPoolPartyData] = useState(null);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingPoolParty, setLoadingPoolParty] = useState(false);
  const [sessionsAvailability, setSessionsAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    bookingDate: new Date().toISOString().split('T')[0],
    session: '',
    adults: 1,
    kids: 0,
    withFood: false,
    foodPackage: '', // ID of selected food package
  });

  // Offer
  const [activeOffer, setActiveOffer] = useState(null);
  const [offerLoading, setOfferLoading] = useState(false);

  // Payment
  const [paymentType, setPaymentType] = useState('token'); // 'full' or 'token'
  const [manualAmountPaid, setManualAmountPaid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [paymentStep, setPaymentStep] = useState('booking'); // 'booking' | 'payment' | 'confirmed'

  // Razorpay specific
  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // ---------- Derived values ----------
  const totalGuests = formData.adults + formData.kids;

  const selectedSession = useMemo(() => 
    sessionsAvailability.find(s => s.session === formData.session),
    [sessionsAvailability, formData.session]
  );

  const isSessionAvailable = useMemo(() => 
    selectedSession?.isAvailable && selectedSession.availableCapacity >= totalGuests,
    [selectedSession, totalGuests]
  );

  const allSessionsFullyBooked = useMemo(() => 
    sessionsAvailability.length > 0 && sessionsAvailability.every(s => !s.isAvailable),
    [sessionsAvailability]
  );

  // Offer and pricing helpers
  const getSessionPricing = useCallback((sessionName) => {
    if (activeOffer && activeOffer.poolPartyPricing?.sessions) {
      const offerSession = activeOffer.poolPartyPricing.sessions.find(
        s => s.session === sessionName && s.poolPartyId === poolPartyData?._id
      );
      if (offerSession) {
        return {
          perAdult: offerSession.perAdult,
          perKid: offerSession.perKid
        };
      }
    }
    const originalSession = sessionsAvailability.find(s => s.session === sessionName);
    return originalSession?.pricing || { perAdult: 0, perKid: 0 };
  }, [activeOffer, poolPartyData, sessionsAvailability]);

  const getFoodPackages = useCallback(() => {
    if (activeOffer && activeOffer.poolPartyPricing?.foodPackages) {
      return activeOffer.poolPartyPricing.foodPackages.filter(
        fp => fp.poolPartyId === poolPartyData?._id
      );
    }
    return poolPartyData?.selectedFoodPackages || [];
  }, [activeOffer, poolPartyData]);

  const foodPackages = getFoodPackages();

  // Price calculations
  const calculateTotalPrice = useCallback(() => {
    if (!poolPartyData || !formData.session) return 0;
    const pricing = getSessionPricing(formData.session);
    const adultPrice = pricing.perAdult * formData.adults;
    const kidPrice = pricing.perKid * formData.kids;
    let foodPrice = 0;
    if (formData.withFood && formData.foodPackage) {
      const selectedFoodPkg = foodPackages.find(
        pkg => pkg.foodPackageId === formData.foodPackage || pkg._id === formData.foodPackage
      );
      if (selectedFoodPkg) {
        foodPrice = selectedFoodPkg.pricePerAdult * formData.adults + selectedFoodPkg.pricePerKid * formData.kids;
      }
    }
    return adultPrice + kidPrice + foodPrice;
  }, [poolPartyData, formData, getSessionPricing, foodPackages]);

  const totalPrice = useMemo(() => calculateTotalPrice(), [calculateTotalPrice]);
  const tokenAmount = useMemo(() => totalPrice * 0.5, [totalPrice]);
  const remainingAmount = useMemo(() => totalPrice - (parseFloat(manualAmountPaid) || 0), [totalPrice, manualAmountPaid]);

  // Update manualAmountPaid when paymentType changes
  useEffect(() => {
    if (paymentType === 'full') {
      setManualAmountPaid(totalPrice.toString());
    } else {
      setManualAmountPaid(tokenAmount.toString());
    }
  }, [paymentType, totalPrice, tokenAmount]);

  // Load Razorpay script when entering payment step
  useEffect(() => {
    if (paymentStep !== 'payment') return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [paymentStep]);

  // --------------------------------------------------------------------
  // API calls
  const fetchLocations = useCallback(async () => {
    setLoadingLocations(true);
    try {
      const res = await fetch(`${API_BASE_URL}/locations`);
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      toast.error('Failed to load locations');
    } finally {
      setLoadingLocations(false);
    }
  }, [API_BASE_URL]);

  const fetchPoolPartyForLocation = useCallback(async (locationId) => {
    setLoadingPoolParty(true);
    setPoolPartyData(null);
    setSessionsAvailability([]);
    setActiveOffer(null);
    try {
      // First get location details to extract pool party config
      const locRes = await fetch(`${API_BASE_URL}/locations/${locationId}`);
      const locData = await locRes.json();
      setLocationDetails(locData);

      const config = locData.poolPartyConfig;
      if (!config?.hasPoolParty) {
        toast.error('This location does not have a pool party');
        setLoadingPoolParty(false);
        return;
      }

      let poolPartyId;
      if (config.poolPartyType === 'shared') {
        poolPartyId = config.sharedPoolPartyId;
      } else if (config.poolPartyType === 'private') {
        poolPartyId = config.privatePoolPartyId;
      }

      if (!poolPartyId) {
        toast.error('Pool party configuration incomplete');
        setLoadingPoolParty(false);
        return;
      }

      const ppRes = await fetch(`${API_BASE_URL}/pool-parties/${poolPartyId}`);
      const ppData = await ppRes.json();
      if (ppData.success) {
        setPoolPartyData(ppData.poolParty);
      } else {
        toast.error('Failed to load pool party details');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading pool party');
    } finally {
      setLoadingPoolParty(false);
    }
  }, [API_BASE_URL]);

  const fetchSessionsAvailability = useCallback(async (date) => {
    if (!selectedLocation || !date) return;
    setAvailabilityLoading(true);
    setAvailabilityError('');
    try {
      const res = await fetch(
        `${API_BASE_URL}/pool-parties/sessions-availability/${selectedLocation}?date=${date}`
      );
      const data = await res.json();
      if (data.success) {
        setSessionsAvailability(data.sessions);
      } else {
        setAvailabilityError(data.error || 'Failed to load availability');
        setSessionsAvailability([]);
      }
    } catch (err) {
      setAvailabilityError('Network error');
    } finally {
      setAvailabilityLoading(false);
    }
  }, [selectedLocation, API_BASE_URL]);

  const fetchActiveOffer = useCallback(async () => {
    if (!poolPartyData?._id || !formData.bookingDate) {
      setActiveOffer(null);
      return;
    }
    setOfferLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/offers/active/poolparty?poolPartyId=${poolPartyData._id}&bookingDate=${formData.bookingDate}`
      );
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setActiveOffer(data.data[0]);
      } else {
        setActiveOffer(null);
      }
    } catch (err) {
      console.error('Offer fetch error', err);
      setActiveOffer(null);
    } finally {
      setOfferLoading(false);
    }
  }, [poolPartyData, formData.bookingDate, API_BASE_URL]);

  // Initial load
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // When location changes, fetch its pool party
  useEffect(() => {
    if (selectedLocation) {
      fetchPoolPartyForLocation(selectedLocation);
    } else {
      setLocationDetails(null);
      setPoolPartyData(null);
      setSessionsAvailability([]);
    }
  }, [selectedLocation, fetchPoolPartyForLocation]);

  // When booking date changes, fetch availability and offer
  useEffect(() => {
    if (selectedLocation && formData.bookingDate) {
      fetchSessionsAvailability(formData.bookingDate);
    } else {
      setSessionsAvailability([]);
    }
  }, [selectedLocation, formData.bookingDate, fetchSessionsAvailability]);

  useEffect(() => {
    fetchActiveOffer();
  }, [fetchActiveOffer]);

  // --------------------------------------------------------------------
  // Form validation
  const isFormValid = useMemo(() => {
    if (!selectedLocation) return false;
    if (!formData.bookingDate) return false;
    if (!formData.session) return false;
    if (!isSessionAvailable) return false;
    if (!formData.name.trim()) return false;
    if (!/^\d{10}$/.test(formData.phone)) return false;
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) return false;
    if (!formData.address.trim()) return false;
    if (totalGuests > (poolPartyData?.totalCapacity || Infinity)) return false;
    return true;
  }, [selectedLocation, formData, isSessionAvailable, totalGuests, poolPartyData]);

  // --------------------------------------------------------------------
  // Handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'bookingDate') {
      setFormData(prev => ({ ...prev, session: '' }));
    }
  };

  const handleNumberChange = (field, operation) => {
    setFormData(prev => {
      const newValue = operation === 'increase'
        ? prev[field] + 1
        : Math.max(field === 'adults' ? 1 : 0, prev[field] - 1);
      return { ...prev, [field]: newValue };
    });
  };

  // --------------------------------------------------------------------
  // Booking submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setIsSubmitting(true);

    const selectedFoodPkg = foodPackages.find(
      pkg => pkg.foodPackageId === formData.foodPackage || pkg._id === formData.foodPackage
    );

    const payload = {
      poolPartyId: poolPartyData._id,
      locationId: selectedLocation,
      guestName: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      bookingDate: formData.bookingDate,
      session: formData.session,
      adults: formData.adults,
      kids: formData.kids,
      paymentType: 'token', // Always token for initial booking? Admin can override via paymentType
      amountPaid: parseFloat(manualAmountPaid) || 0,
      remainingAmount: Math.max(0, totalPrice - (parseFloat(manualAmountPaid) || 0)),
      withFood: formData.withFood,
      foodPackage: formData.withFood && selectedFoodPkg ? {
        foodPackageId: selectedFoodPkg.foodPackageId || selectedFoodPkg._id,
        name: selectedFoodPkg.name,
        pricePerAdult: selectedFoodPkg.pricePerAdult,
        pricePerKid: selectedFoodPkg.pricePerKid,
      } : null,
      pricing: {
        pricePerAdult: getSessionPricing(formData.session).perAdult,
        pricePerKid: getSessionPricing(formData.session).perKid,
        totalPrice: totalPrice,
      },
    };

    try {
      // 1. Create booking
      const res = await fetch(`${API_BASE_URL}/pool-parties/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Failed to create booking');
        setIsSubmitting(false);
        return;
      }

      const booking = data.booking;
      setBookingResult(booking);

      // 2. Create payment order (if amount > 0)
      if (parseFloat(manualAmountPaid) > 0) {
        const orderRes = await fetch(`${API_BASE_URL}/payments/create-poolparty-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking._id,
            amount: parseFloat(manualAmountPaid),
            currency: 'INR',
            userEmail: formData.email,
            userPhone: formData.phone,
            userName: formData.name,
          }),
        });
        const orderData = await orderRes.json();
        if (!orderData.success) {
          toast.error(orderData.error || 'Failed to create payment order');
          setIsSubmitting(false);
          return;
        }
        setRazorpayOrder(orderData);
        setPaymentStep('payment');
      } else {
        // No payment required (amountPaid = 0) – go directly to confirmation
        setPaymentStep('confirmed');
      }
    } catch (err) {
      toast.error('Network error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------
  // Razorpay payment
  const initiateRazorpayPayment = () => {
    if (!razorpayOrder || !window.Razorpay) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }
    setPaymentProcessing(true);
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: razorpayOrder.order.amount,
      currency: razorpayOrder.order.currency,
      name: 'Rest & Relax',
      description: `Pool Party Booking - ${locationDetails?.name} (${formData.session})`,
      image: '/images/Logo.png', // adjust if needed
      order_id: razorpayOrder.order.id,
      handler: async (response) => {
        await verifyPayment(response);
      },
      prefill: {
        name: formData.name,
        contact: formData.phone,
        email: formData.email,
      },
      notes: {
        bookingId: bookingResult._id,
        location: locationDetails?.name,
        session: formData.session,
      },
      theme: { color: '#4F46E5' },
      modal: {
        ondismiss: () => setPaymentProcessing(false),
      },
    };
    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      const verifyRes = await fetch(`${API_BASE_URL}/payments/verify-poolparty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          bookingId: bookingResult._id,
        }),
      });
      const result = await verifyRes.json();
      if (result.success) {
        setPaymentStep('confirmed');
        toast.success('Payment successful!');
      } else {
        toast.error('Payment verification failed: ' + result.error);
        setPaymentStep('booking');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed. Please contact support.');
      setPaymentStep('booking');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // --------------------------------------------------------------------
  // PDF download
  const downloadPDF = async (bookingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pool-parties/${bookingId}/download-pdf`);
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poolparty-booking-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF download failed:', error);
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  // --------------------------------------------------------------------
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      bookingDate: new Date().toISOString().split('T')[0],
      session: '',
      adults: 1,
      kids: 0,
      withFood: false,
      foodPackage: '',
    });
    setPaymentType('token');
    setManualAmountPaid('');
    setBookingResult(null);
    setPaymentStep('booking');
    setRazorpayOrder(null);
  };

  // --------------------------------------------------------------------
  // Render payment step
  if (paymentStep === 'payment' && bookingResult) {
    const amountToPay = parseFloat(manualAmountPaid) || 0;
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
                    <CreditCard className="h-12 w-12 text-blue-600 relative z-10" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pay {paymentType === 'token' ? 'Token' : 'Full'} Amount</h3>
                <p className="text-gray-500 text-sm mb-6">Secure payment via Razorpay</p>

                <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">#{bookingResult._id?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium truncate ml-2">{locationDetails?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session:</span>
                    <span className="font-medium">{formData.session}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium">₹{remainingAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Pay Now:</span>
                    <span className="font-bold text-blue-600 text-xl">₹{amountToPay.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={initiateRazorpayPayment}
                    disabled={paymentProcessing}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} /> Pay ₹{amountToPay.toLocaleString()}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setPaymentStep('booking')}
                    disabled={paymentProcessing}
                    className="w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200"
                  >
                    Back
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>SSL Encrypted • Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // Render confirmation step
  if (paymentStep === 'confirmed' && bookingResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                    <CheckCircle className="h-12 w-12 text-green-500 relative z-10" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {paymentType === 'token' ? 'Token payment successful.' : 'Payment completed.'}
                  {formData.email && <span className="block mt-1 text-green-600">Confirmation sent to {formData.email}</span>}
                </p>

                <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-mono text-sm bg-green-100 text-green-800 px-2 py-1 rounded">#{bookingResult._id?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{locationDetails?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(formData.bookingDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session:</span>
                    <span className="font-medium">{formData.session}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guests:</span>
                    <span className="font-medium">{formData.adults} adults, {formData.kids} kids</span>
                  </div>
                  {formData.withFood && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Food:</span>
                      <span className="font-medium text-green-600">
                        {foodPackages.find(p => p.foodPackageId === formData.foodPackage || p._id === formData.foodPackage)?.name}
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-blue-600">₹{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Paid</span>
                      <span className="font-medium text-green-600">₹{(parseFloat(manualAmountPaid) || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining</span>
                      <span className="font-medium text-orange-600">₹{remainingAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-3">
                  <button
                    onClick={() => downloadPDF(bookingResult._id)}
                    className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download PDF
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700"
                  >
                    Create Another
                  </button>
                  <button
                    onClick={() => navigate('/admin/pool-party-bookings')}
                    className="flex-1 bg-gray-600 text-white font-semibold py-3 rounded-xl hover:bg-gray-700"
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // Main booking form
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        {/* Header with back button */}
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Pool Party Booking (Admin)</h1>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Step indicator */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-sm">
            <div className="flex items-center text-blue-600 font-semibold">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-xs">1</span>
              Booking Details
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 rotate-270" />
            <div className="flex items-center text-gray-500">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center mr-2 text-xs">2</span>
              Payment
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 rotate-270" />
            <div className="flex items-center text-gray-500">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center mr-2 text-xs">3</span>
              Confirmation
            </div>
          </div>

          {/* Main content */}
          <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
            {/* Location selector */}
            <section className="border border-gray-200 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Location *</label>
              {loadingLocations ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading locations...
                </div>
              ) : (
                <select
                  value={selectedLocation || ''}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose a location with pool party --</option>
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>{loc.name} ({loc.address?.city})</option>
                  ))}
                </select>
              )}
            </section>

            {loadingPoolParty && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            )}

            {poolPartyData && !loadingPoolParty && (
              <>
                {/* Booking Date */}
                <section className="border border-gray-200 rounded-xl p-5">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> Select Date
                  </h3>
                  <div>
                    <input
                      type="date"
                      name="bookingDate"
                      value={formData.bookingDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  {availabilityLoading && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking availability...
                    </div>
                  )}
                </section>

                {/* Session Selection */}
                {sessionsAvailability.length > 0 && !allSessionsFullyBooked && (
                  <section className="border border-gray-200 rounded-xl p-5">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" /> Select Session *
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sessionsAvailability.map((session) => {
                        const sessionPricing = getSessionPricing(session.session);
                        const isAvailable = session.isAvailable && session.availableCapacity >= totalGuests;
                        return (
                          <div
                            key={session.session}
                            onClick={() => !isSubmitting && isAvailable && setFormData(prev => ({ ...prev, session: session.session }))}
                            className={`cursor-pointer border-2 rounded-xl p-5 transition-all ${
                              formData.session === session.session
                                ? isAvailable
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-red-500 bg-red-50'
                                : isAvailable
                                  ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900 text-base truncate">{session.session}</h4>
                              <div className={`w-5 h-5 rounded-full border-2 ${
                                formData.session === session.session
                                  ? isAvailable ? 'border-blue-500 bg-blue-500' : 'border-red-500 bg-red-500'
                                  : 'border-gray-300'
                              }`} />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{session.startTime} - {session.endTime}</p>
                            <div className="flex justify-between text-sm text-gray-500 mb-3">
                              <span>Adult: ₹{sessionPricing.perAdult}</span>
                              <span>Kid: ₹{sessionPricing.perKid}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200">
                              {isAvailable ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Available
                                  </span>
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {session.availableCapacity}/{session.totalCapacity}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-red-600 text-sm font-medium">
                                  {session.availableCapacity === 0 ? 'Fully booked' : `Only ${session.availableCapacity} spots left`}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {allSessionsFullyBooked && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-yellow-700">All sessions are fully booked for this date.</p>
                  </div>
                )}

                {/* Guest Count */}
                {formData.session && (
                  <section className="border border-gray-200 rounded-xl p-5">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" /> Guest Count
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Adults */}
                      <div className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">Adults</h4>
                            <p className="text-sm text-gray-600">Ages 13+</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleNumberChange('adults', 'decrease')}
                              disabled={formData.adults <= 1}
                              className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="font-bold w-6 text-center">{formData.adults}</span>
                            <button
                              type="button"
                              onClick={() => handleNumberChange('adults', 'increase')}
                              disabled={totalGuests >= (poolPartyData?.totalCapacity || 10)}
                              className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Kids */}
                      <div className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">Kids</h4>
                            <p className="text-sm text-gray-600">Ages 2-12</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleNumberChange('kids', 'decrease')}
                              disabled={formData.kids <= 0}
                              className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="font-bold w-6 text-center">{formData.kids}</span>
                            <button
                              type="button"
                              onClick={() => handleNumberChange('kids', 'increase')}
                              disabled={totalGuests >= (poolPartyData?.totalCapacity || 10)}
                              className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Food Packages */}
                {/* Food Packages */}
{formData.session && foodPackages.length > 0 && (
  <section className="border border-gray-200 rounded-xl p-5">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Utensils className="w-5 h-5 text-blue-600" /> Food Packages
      {activeOffer && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">Special offer</span>}
    </h3>
    <div className="space-y-3">
      <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
        <input
          type="radio"
          name="foodOption"
          checked={!formData.withFood}
          onChange={() => setFormData(prev => ({ ...prev, withFood: false, foodPackage: '' }))}
          className="mt-1 w-4 h-4 text-blue-600"
        />
        <span className="text-gray-700">No food package</span>
      </label>
      {foodPackages.map(pkg => {
        const pkgId = String(pkg.foodPackageId || pkg._id || `pkg-${Math.random()}`);
        return (
          <label key={pkgId} className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="foodOption"
              value={pkgId}
              checked={formData.foodPackage === pkgId}
              onChange={() => setFormData(prev => ({
                ...prev,
                withFood: true,
                foodPackage: pkgId
              }))}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div>
              <p className="font-medium text-gray-900">{pkg.name}</p>
              <p className="text-sm text-gray-600">
                ₹{pkg.pricePerAdult} per adult, ₹{pkg.pricePerKid} per kid
              </p>
              {activeOffer && pkg.foodPackageId && (
                <span className="text-xs text-green-600">Special offer</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  </section>
)}

                {/* Personal Information */}
                <section className="border border-gray-200 rounded-xl p-5">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        pattern="[0-9]{10}"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={2}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </section>

                {/* Payment section */}
                <section className="border border-gray-200 rounded-xl p-5">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" /> Payment
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentType"
                          value="token"
                          checked={paymentType === 'token'}
                          onChange={() => setPaymentType('token')}
                        />
                        <span>Token (50%)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentType"
                          value="full"
                          checked={paymentType === 'full'}
                          onChange={() => setPaymentType('full')}
                        />
                        <span>Full</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
                      <input
                        type="number"
                        value={manualAmountPaid}
                        onChange={(e) => setManualAmountPaid(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        min="0"
                        step="100"
                      />
                    </div>

                    {totalPrice > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Total price (based on current selections)</span>
                          <span className="font-bold text-blue-600">₹{totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Amount to pay now</span>
                          <span className="font-medium text-green-600">₹{(parseFloat(manualAmountPaid) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Remaining at property</span>
                          <span className="font-medium text-orange-600">₹{remainingAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Submit button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting || offerLoading || !selectedSession}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                      </>
                    ) : offerLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Checking offers...
                      </>
                    ) : !selectedSession ? (
                      'Select a session'
                    ) : totalPrice <= 0 ? (
                      'Invalid price'
                    ) : (
                      'Create Booking'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCreatePoolPartyBookingPage;