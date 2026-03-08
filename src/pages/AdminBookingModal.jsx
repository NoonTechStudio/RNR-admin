// AdminCreateBookingPage.jsx – Full admin booking creation with Razorpay
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Calendar, User, Phone, Mail, Home, Clock, Utensils, CreditCard,
  CheckCircle, AlertCircle, Users, Loader2, ChevronDown, ArrowLeft, Star, Shield, Download
} from 'lucide-react';

// ----------------------------------------------------------------------
// Helper: get YYYY-MM-DD in local time (prevents timezone shift)
const getLocalDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: format date for display
const formatDate = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ----------------------------------------------------------------------
// Main component
const AdminBookingModal = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;
  const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

  // ---------- State ----------
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingLocationDetails, setLoadingLocationDetails] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);

  // Date & guest states
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [sameDayCheckout, setSameDayCheckout] = useState(false);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [showGuestSelector, setShowGuestSelector] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    checkInTime: '10:00 AM',
  });

  // Food packages
  const [selectedFoodPackage, setSelectedFoodPackage] = useState(null);
  const [dailyFoodSelections, setDailyFoodSelections] = useState({});
  const [showDailySelection, setShowDailySelection] = useState(false);

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
  const [tokenAmount, setTokenAmount] = useState(0);

  // ---------- Derived values ----------
  const totalGuests = adults + kids;

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate || sameDayCheckout) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }, [checkInDate, checkOutDate, sameDayCheckout]);

  const days = useMemo(() => {
    if (!checkInDate) return 0;
    if (sameDayCheckout) return 1;
    if (!checkOutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }, [checkInDate, checkOutDate, sameDayCheckout]);

  // --------------------------------------------------------------------
  // Price calculation (mirroring frontend logic)
  const calculateDays = useCallback(() => days, [days]);
  const calculateNights = useCallback(() => nights, [nights]);

  const getBasePricing = useCallback(() => {
    if (activeOffer && activeOffer.locationPricing) return activeOffer.locationPricing;
    return locationDetails?.pricing || {};
  }, [activeOffer, locationDetails]);

  const getFoodPackages = useCallback(() => {
    if (activeOffer && activeOffer.locationPricing?.foodPackages) {
      return activeOffer.locationPricing.foodPackages.filter(
        pkg => pkg.locationId === locationDetails?._id
      );
    }
    return locationDetails?.pricing?.foodPackages || [];
  }, [activeOffer, locationDetails]);

  const calculateFoodPrice = useCallback(() => {
    if (!selectedFoodPackage) return 0;
    const packages = getFoodPackages();
    if (sameDayCheckout) {
      return selectedFoodPackage.pricePerAdult * adults + selectedFoodPackage.pricePerKid * kids;
    }
    if (Object.keys(dailyFoodSelections).length > 0) {
      let total = 0;
      Object.values(dailyFoodSelections).forEach(pkgId => {
        if (pkgId) {
          const pkg = packages.find(p => p.foodPackageId === pkgId || p._id === pkgId);
          if (pkg) total += pkg.pricePerAdult * adults + pkg.pricePerKid * kids;
        }
      });
      return total;
    }
    const daysVal = days;
    const foodDays = sameDayCheckout ? daysVal : daysVal + 1;
    return (selectedFoodPackage.pricePerAdult * adults + selectedFoodPackage.pricePerKid * kids) * foodDays;
  }, [selectedFoodPackage, getFoodPackages, sameDayCheckout, adults, kids, dailyFoodSelections, days]);

  const calculateTotalPrice = useCallback(() => {
    if (!checkInDate || !locationDetails?.pricing) return 0;
    const basePricing = getBasePricing();
    const capacity = locationDetails.capacityOfPersons || 0;
    const isNightStayAvailable = locationDetails.propertyDetails?.nightStay === true && !sameDayCheckout;
    const daysVal = days;
    const nightsVal = isNightStayAvailable ? nights : 0;

    const perNightRate = basePricing.pricePerPersonNight || 0;
    const nightPrice = perNightRate > 0 && nightsVal > 0 ? perNightRate * totalGuests * nightsVal : 0;

    const dayAdultRate = basePricing.pricePerAdultDay || 0;
    const dayKidRate = basePricing.pricePerKidDay || 0;
    const dayPrice = dayAdultRate * adults * daysVal + dayKidRate * kids * daysVal;

    let extraCharge = 0;
    if (capacity && totalGuests > capacity) {
      const extraGuests = totalGuests - capacity;
      const extraRate = basePricing.extraPersonCharge || 0;
      const extraMultiplier = isNightStayAvailable ? Math.max(nightsVal, daysVal) : daysVal;
      extraCharge = extraGuests * extraRate * extraMultiplier;
    }

    const foodPrice = calculateFoodPrice();
    return nightPrice + dayPrice + extraCharge + foodPrice;
  }, [checkInDate, locationDetails, getBasePricing, adults, kids, sameDayCheckout, totalGuests, days, nights, calculateFoodPrice]);

  const totalPrice = useMemo(() => calculateTotalPrice(), [calculateTotalPrice]);
  const tokenAmt = useMemo(() => Math.round((totalPrice * 0.5) / 100) * 100, [totalPrice]);
  const remainingAmount = useMemo(() => Math.max(0, totalPrice - (parseFloat(manualAmountPaid) || 0)), [totalPrice, manualAmountPaid]);

  // Update tokenAmount when totalPrice changes (for payment step)
  useEffect(() => {
    setTokenAmount(tokenAmt);
  }, [tokenAmt]);

  // Update manualAmountPaid when paymentType changes
  useEffect(() => {
    if (paymentType === 'full') {
      setManualAmountPaid(totalPrice.toString());
    } else {
      setManualAmountPaid(tokenAmt.toString());
    }
  }, [paymentType, totalPrice, tokenAmt]);

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

  const fetchLocationDetails = useCallback(async (id) => {
    setLoadingLocationDetails(true);
    try {
      const res = await fetch(`${API_BASE_URL}/locations/${id}`);
      const data = await res.json();
      setLocationDetails(data);
      // Fetch booked dates
      const bookedRes = await fetch(`${API_BASE_URL}/bookings/dates/${id}`);
      const bookedData = await bookedRes.json();
      if (bookedData.success) setBookedDates(bookedData.bookedDates);
    } catch (err) {
      toast.error('Failed to load location details');
    } finally {
      setLoadingLocationDetails(false);
    }
  }, [API_BASE_URL]);

  const fetchActiveOffer = useCallback(async () => {
    if (!selectedLocation || !checkInDate) {
      setActiveOffer(null);
      return;
    }
    setOfferLoading(true);
    try {
      const dateStr = getLocalDateKey(checkInDate);
      const res = await fetch(
        `${API_BASE_URL}/offers/active/location?locationId=${selectedLocation}&bookingDate=${dateStr}`
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
  }, [selectedLocation, checkInDate, API_BASE_URL]);

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

  // Initial load
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (selectedLocation) {
      fetchLocationDetails(selectedLocation);
    } else {
      setLocationDetails(null);
      setBookedDates([]);
    }
  }, [selectedLocation, fetchLocationDetails]);

  useEffect(() => {
    fetchActiveOffer();
  }, [fetchActiveOffer]);

  // Initialize daily food selections when dates/package change
  useEffect(() => {
    if (checkInDate && checkOutDate && selectedFoodPackage && !sameDayCheckout) {
      const daysVal = days;
      const foodDays = sameDayCheckout ? daysVal : daysVal + 1;
      const newSelections = {};
      for (let i = 0; i < foodDays; i++) {
        const currentDate = new Date(checkInDate);
        currentDate.setDate(currentDate.getDate() + i);
        newSelections[getLocalDateKey(currentDate)] = selectedFoodPackage.id;
      }
      setDailyFoodSelections(newSelections);
    }
  }, [checkInDate, checkOutDate, selectedFoodPackage, sameDayCheckout, days]);

  // --------------------------------------------------------------------
  // Date conflict check
  const hasDateConflict = useMemo(() => {
    if (!checkInDate || !checkOutDate || bookedDates.length === 0) return false;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = getLocalDateKey(d);
      if (bookedDates.includes(key)) return true;
    }
    return false;
  }, [checkInDate, checkOutDate, bookedDates]);

  // --------------------------------------------------------------------
  // Form validation
  const isFormValid = useMemo(() => {
    if (!selectedLocation) return false;
    if (!checkInDate) return false;
    if (!sameDayCheckout && !checkOutDate) return false;
    if (hasDateConflict) return false;
    if (!formData.name.trim()) return false;
    if (!/^\d{10}$/.test(formData.phone)) return false;
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) return false;
    if (!formData.address.trim()) return false;
    if (totalGuests > (locationDetails?.capacityOfPersons || Infinity)) return false;
    return true;
  }, [selectedLocation, checkInDate, checkOutDate, sameDayCheckout, hasDateConflict, formData, totalGuests, locationDetails]);

  // --------------------------------------------------------------------
  // Booking creation and payment order
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setIsSubmitting(true);

    const dailyPackages = Object.entries(dailyFoodSelections)
      .filter(([_, pkgId]) => pkgId)
      .map(([date, pkgId]) => ({ date, packageId: pkgId }));

    const amountToPay = parseFloat(manualAmountPaid) || 0;

    const payload = {
      locationId: selectedLocation,
      checkInDate: getLocalDateKey(checkInDate),
      checkOutDate: sameDayCheckout ? getLocalDateKey(checkInDate) : getLocalDateKey(checkOutDate),
      checkInTime: formData.checkInTime,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      adults,
      kids,
      withFood: !!selectedFoodPackage,
      foodPackageId: selectedFoodPackage?.id || null,
      dailyFoodSelections: dailyPackages,
      paymentType, // 'token' or 'full'
      amountPaid: amountToPay,
      remainingAmount: Math.max(0, totalPrice - amountToPay),
      sameDayCheckout,
    };

    try {
      // 1. Create booking
      const res = await fetch(`${API_BASE_URL}/bookings`, {
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
      if (amountToPay > 0) {
        const orderRes = await fetch(`${API_BASE_URL}/payments/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking._id,
            amount: amountToPay,
            currency: 'INR',
            userEmail: formData.email,
            userPhone: formData.phone,
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
  // Razorpay payment handlers
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
      name: locationDetails?.name || 'Booking',
      description: `Payment for ${locationDetails?.name}`,
      image: '/logo.png', // adjust if needed
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
        paymentType,
      },
      theme: { color: '#3B82F6' },
      modal: {
        ondismiss: () => setPaymentProcessing(false),
      },
    };
    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      const verifyRes = await fetch(`${API_BASE_URL}/payments/verify`, {
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
        setPaymentStep('booking'); // go back to booking form
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
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/download-pdf`);
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-confirmation-${bookingId}.pdf`;
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
  // Reset form to create another booking
  const resetForm = () => {
    setCheckInDate(null);
    setCheckOutDate(null);
    setSameDayCheckout(false);
    setAdults(1);
    setKids(0);
    setFormData({ name: '', phone: '', email: '', address: '', checkInTime: '10:00 AM' });
    setSelectedFoodPackage(null);
    setDailyFoodSelections({});
    setActiveOffer(null);
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
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium">{formatDate(checkInDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium">{formatDate(checkOutDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guests:</span>
                    <span className="font-medium">{adults} adults, {kids} kids</span>
                  </div>
                  {selectedFoodPackage && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Food Service:</span>
                      <span className="font-medium text-green-600">{selectedFoodPackage.name}</span>
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
                    onClick={() => navigate('/admin/bookings')}
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
  // Main booking form (step 1)
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Booking (Admin)</h1>
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

          {/* Conflict warning */}
          {hasDateConflict && (
            <div className="mx-6 mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
              <div className="shrink-0 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">!</div>
              <p className="text-sm text-yellow-800">Selected dates overlap with existing bookings.</p>
            </div>
          )}

          {/* Main content - two columns */}
          <div className="flex flex-col lg:flex-row gap-6 p-6">
            {/* Left column - Form */}
            <div className="flex-1 space-y-6">
              {/* Location selector */}
              <section className="bg-white border border-gray-200 rounded-xl p-5">
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
                    <option value="">-- Choose a location --</option>
                    {locations.map(loc => (
                      <option key={loc._id} value={loc._id}>{loc.name} ({loc.address?.city})</option>
                    ))}
                  </select>
                )}
              </section>

              {loadingLocationDetails && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}

              {locationDetails && !loadingLocationDetails && (
                <>
                  {/* Date selection */}
                  <section className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" /> Dates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check‑in *</label>
                        <input
                          type="date"
                          value={checkInDate ? getLocalDateKey(checkInDate) : ''}
                          onChange={(e) => setCheckInDate(new Date(e.target.value))}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check‑out *</label>
                        <input
                          type="date"
                          value={sameDayCheckout ? (checkInDate ? getLocalDateKey(checkInDate) : '') : (checkOutDate ? getLocalDateKey(checkOutDate) : '')}
                          onChange={(e) => setCheckOutDate(new Date(e.target.value))}
                          min={checkInDate ? getLocalDateKey(checkInDate) : new Date().toISOString().split('T')[0]}
                          disabled={sameDayCheckout}
                          required={!sameDayCheckout}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                    {locationDetails.propertyDetails?.nightStay && (
                      <label className="flex items-center gap-2 mt-3">
                        <input
                          type="checkbox"
                          checked={sameDayCheckout}
                          onChange={(e) => {
                            setSameDayCheckout(e.target.checked);
                            if (e.target.checked) setCheckOutDate(checkInDate);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">Same‑day checkout (day picnic)</span>
                      </label>
                    )}
                    {bookedDates.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-sm text-gray-600 cursor-pointer">Show booked dates</summary>
                        <div className="mt-2 text-xs text-gray-500 max-h-24 overflow-y-auto">
                          {bookedDates.sort().join(', ')}
                        </div>
                      </details>
                    )}
                  </section>

                  {/* Guest selector */}
                  <section className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" /> Guests
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowGuestSelector(!showGuestSelector)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {showGuestSelector ? 'Hide' : 'Change'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {adults} adult{adults !== 1 && 's'}, {kids} kid{kids !== 1 && 's'}
                    </p>
                    {showGuestSelector && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Adults (13+)</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 border rounded-full">-</button>
                            <span className="w-6 text-center">{adults}</span>
                            <button type="button" onClick={() => setAdults(Math.min(locationDetails.capacityOfPersons - kids, adults + 1))} className="w-8 h-8 border rounded-full">+</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Kids (2‑12)</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setKids(Math.max(0, kids - 1))} className="w-8 h-8 border rounded-full">-</button>
                            <span className="w-6 text-center">{kids}</span>
                            <button type="button" onClick={() => setKids(Math.min(locationDetails.capacityOfPersons - adults, kids + 1))} className="w-8 h-8 border rounded-full">+</button>
                          </div>
                        </div>
                        {totalGuests > locationDetails.capacityOfPersons && (
                          <p className="text-xs text-red-600">Max {locationDetails.capacityOfPersons} guests</p>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Personal Information */}
                  <section className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" /> Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            pattern="[0-9]{10}"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          rows={2}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Check-in Time */}
                  <section className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" /> Check-in Time
                    </h3>
                    <select
                      value={formData.checkInTime}
                      onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-600 mt-2">
                      {sameDayCheckout ? 'Checkout: 10:00 PM (same day)' : 'Checkout: Next day 10:00 AM'}
                    </p>
                  </section>

                  {/* Food Packages */}
                  {getFoodPackages().length > 0 && (
                    <section className="bg-white border border-gray-200 rounded-xl p-5">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-blue-600" /> Food Packages
                        {activeOffer && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">Special offer</span>}
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                          <input
                            type="radio"
                            name="foodOption"
                            checked={!selectedFoodPackage}
                            onChange={() => {
                              setSelectedFoodPackage(null);
                              setDailyFoodSelections({});
                              setShowDailySelection(false);
                            }}
                            className="mt-1 w-4 h-4 text-blue-600"
                          />
                          <div>
                            <p className="font-medium text-gray-900">No food required</p>
                          </div>
                        </label>
                        {getFoodPackages().map(pkg => {
                          const pkgId = pkg.foodPackageId || pkg._id;
                          return (
                            <label key={pkgId} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 cursor-pointer">
                              <input
                                type="radio"
                                name="foodOption"
                                checked={selectedFoodPackage?.id === pkgId}
                                onChange={() => setSelectedFoodPackage({
                                  id: pkgId,
                                  name: pkg.name,
                                  pricePerAdult: pkg.pricePerAdult,
                                  pricePerKid: pkg.pricePerKid,
                                  description: pkg.description,
                                })}
                                className="mt-1 w-4 h-4 text-blue-600"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-900">{pkg.name}</p>
                                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                                    {activeOffer && pkg.foodPackageId && (
                                      <span className="text-xs text-green-600 font-medium">Special offer price</span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">₹{pkg.pricePerAdult} <span className="text-sm font-normal">/adult</span></p>
                                    <p className="text-sm text-gray-600">₹{pkg.pricePerKid} /kid</p>
                                  </div>
                                </div>
                                {selectedFoodPackage?.id === pkgId && checkInDate && checkOutDate && !sameDayCheckout && (
                                  <div className="mt-4 pt-3 border-t border-gray-200">
                                    <button
                                      type="button"
                                      onClick={() => setShowDailySelection(!showDailySelection)}
                                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                    >
                                      {showDailySelection ? 'Hide' : 'Customize'} daily selections
                                      <ChevronDown size={16} className={`transition-transform ${showDailySelection ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showDailySelection && (
                                      <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                                        {(() => {
                                          const start = new Date(checkInDate);
                                          const foodDays = days + 1;
                                          const daysArray = [];
                                          for (let i = 0; i < foodDays; i++) {
                                            const d = new Date(start);
                                            d.setDate(d.getDate() + i);
                                            daysArray.push({
                                              date: d,
                                              dateKey: getLocalDateKey(d),
                                            });
                                          }
                                          return daysArray.map(day => (
                                            <div key={day.dateKey} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                              <span className="text-sm font-medium">
                                                {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                              </span>
                                              <select
                                                value={dailyFoodSelections[day.dateKey] || ''}
                                                onChange={e => setDailyFoodSelections(prev => ({ ...prev, [day.dateKey]: e.target.value }))}
                                                className="text-sm border border-gray-300 rounded px-2 py-1"
                                              >
                                                <option value="">No food</option>
                                                {getFoodPackages().map(p => {
                                                  const pid = p.foodPackageId || p._id;
                                                  return <option key={pid} value={pid}>{p.name}</option>;
                                                })}
                                              </select>
                                            </div>
                                          ));
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Payment selection */}
                  <section className="bg-white border border-gray-200 rounded-xl p-5">
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
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Right column - Summary */}
            {locationDetails && totalPrice > 0 && (
              <div className="lg:w-80 xl:w-96 shrink-0">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 sticky top-6 space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> Booking Summary
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between pb-2 border-b border-gray-200">
                      <span className="text-gray-600">Dates</span>
                      <span className="font-medium text-right">
                        {checkInDate && formatDate(checkInDate)} – {checkOutDate && formatDate(checkOutDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in</span>
                      <span className="font-medium">{formData.checkInTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">
                        {sameDayCheckout ? '1 day' : `${nights} night${nights !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Guests</span>
                      <span className="font-medium">{adults} adult{adults !== 1 && 's'}, {kids} kid{kids !== 1 && 's'}</span>
                    </div>
                    {selectedFoodPackage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Food</span>
                        <span className="font-medium text-green-600">{selectedFoodPackage.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between">
                      <span>Total price</span>
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

                  <div className="pt-4">
                    <button
                      onClick={handleBookingSubmit}
                      disabled={!isFormValid || isSubmitting || offerLoading || !locationDetails}
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
                      ) : (
                        'Create Booking'
                      )}
                    </button>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Secure payment</p>
                      <p className="text-xs text-gray-600">Powered by Razorpay</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingModal;