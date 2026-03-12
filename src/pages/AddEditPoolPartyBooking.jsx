// AdminEditPoolPartyBookingPage.jsx – Fixed food package selection + deferred selection
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Calendar, User, Phone, Mail, Home, Clock, Utensils, CreditCard,
  CheckCircle, AlertCircle, Users, Loader2, ChevronDown, ArrowLeft, Shield, Download
} from 'lucide-react';

// ----------------------------------------------------------------------
// Helper: get YYYY‑MM‑DD in local time (prevents timezone shift)
const toDateString = (isoString) => isoString.split('T')[0];

// Helper: create UTC Date object from YYYY‑MM‑DD (for calculations)
const utcDate = (dateStr) => new Date(dateStr + 'T00:00:00Z');

// Helper: format date for display (uses UTC to preserve day)
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = utcDate(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

// ----------------------------------------------------------------------
// Main component
const AdminEditPoolPartyBookingPage = () => {
  const { id } = useParams(); // booking ID
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;
  const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

  // ---------- State ----------
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const [poolPartyData, setPoolPartyData] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [sessionsAvailability, setSessionsAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    bookingDate: '',
    session: '',
    adults: 1,
    kids: 0,
    withFood: false,
    foodPackage: '', // will hold the unique _id of the selected package
  });

  // Offer
  const [activeOffer, setActiveOffer] = useState(null);
  const [offerLoading, setOfferLoading] = useState(false);

  // Payment
  const [paymentType, setPaymentType] = useState('token'); // 'full' or 'token'
  const [manualAmountPaid, setManualAmountPaid] = useState('');
  const [updateResult, setUpdateResult] = useState(null);
  const [step, setStep] = useState('booking'); // 'booking' | 'confirmation'

  // ---------- Refs & extra state ----------
  // Track the last selected foodPackageId (stable across list changes)
  const lastSelectedFoodPackageId = useRef(null);
  // Prevent initial selection from overriding user choice after first run
  const initialSelectionDone = useRef(false);
  // Desired food package ID to select when it becomes available (e.g., from offer)
  const [desiredFoodPackageId, setDesiredFoodPackageId] = useState(null);

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

  // Memoized food packages – replaces getFoodPackages function
  const foodPackages = useMemo(() => {
    if (activeOffer && activeOffer.poolPartyPricing?.foodPackages) {
      return activeOffer.poolPartyPricing.foodPackages.filter(
        fp => fp.poolPartyId === poolPartyData?._id
      );
    }
    return poolPartyData?.selectedFoodPackages || [];
  }, [activeOffer, poolPartyData]);

  // Price calculations – use the package's unique _id for selection
  const calculateTotalPrice = useCallback(() => {
    if (!poolPartyData || !formData.session) return 0;
    const pricing = getSessionPricing(formData.session);
    const adultPrice = pricing.perAdult * formData.adults;
    const kidPrice = pricing.perKid * formData.kids;
    let foodPrice = 0;
    if (formData.withFood && formData.foodPackage) {
      const selectedFoodPkg = foodPackages.find(
        pkg => String(pkg._id) === formData.foodPackage
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

  // Update manualAmountPaid only when paymentType changes (preserve existing paid amount during edits)
  useEffect(() => {
    if (paymentType === 'full') {
      setManualAmountPaid(totalPrice.toString());
    } else {
      setManualAmountPaid(tokenAmount.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentType]);

  // --------------------------------------------------------------------
  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/pool-parties/bookings/${id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Booking not found');
        const b = data.booking;

        setBooking(b);

        // Fetch pool party details
        const poolPartyId = b.poolPartyId?._id || b.poolPartyId;
        if (poolPartyId) {
          const ppRes = await fetch(`${API_BASE_URL}/pool-parties/${poolPartyId}`);
          const ppData = await ppRes.json();
          if (ppData.success) {
            setPoolPartyData(ppData.poolParty);
          } else {
            toast.error('Failed to load pool party details');
          }

          // Fetch location details (for display)
          const locationId = b.locationId?._id || b.locationId;
          if (locationId) {
            const locRes = await fetch(`${API_BASE_URL}/locations/${locationId}`);
            const locData = await locRes.json();
            setLocationDetails(locData);
            // After setting locationDetails, fetch availability using its _id
            const dateStr = toDateString(b.bookingDate);
            setFormData(prev => ({ ...prev, bookingDate: dateStr }));
            if (locData._id && dateStr) {
              await fetchSessionsAvailability(locData._id, dateStr, b.session);
            }
          } else {
            setAvailabilityError('Location ID not found in booking');
          }
        }

        // Populate form – basic fields (foodPackage set later)
        setFormData(prev => ({
          ...prev,
          name: b.guestName || '',
          phone: b.phone || '',
          email: b.email || '',
          address: b.address || '',
          session: b.session || '',
          adults: b.adults || 1,
          kids: b.kids || 0,
          withFood: b.withFood || false,
          // foodPackage will be set in a separate effect after poolPartyData is available
        }));

        setPaymentType(b.paymentType || 'token');
        setManualAmountPaid((b.amountPaid || 0).toString());

      } catch (err) {
        console.error(err);
        toast.error('Failed to load booking');
        navigate('/admin/pool-party-bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, API_BASE_URL, navigate]);

  // --------------------------------------------------------------------
  // After poolPartyData is loaded, set the initial foodPackage value using the unique _id
  useEffect(() => {
    if (!poolPartyData || !booking) return;
    if (initialSelectionDone.current) return;

    const storedFoodId = booking.foodPackage?.foodPackageId || booking.foodPackage?._id || '';
    // Try to find a package that matches by _id first, then by foodPackageId
    const matchingPkg = foodPackages.find(pkg => 
      String(pkg._id) === storedFoodId || 
      (pkg.foodPackageId && pkg.foodPackageId === storedFoodId)
    );

    if (matchingPkg) {
      // Found – select it immediately
      lastSelectedFoodPackageId.current = matchingPkg.foodPackageId;
      setFormData(prev => ({ 
        ...prev, 
        withFood: true,
        foodPackage: String(matchingPkg._id) 
      }));
      setDesiredFoodPackageId(null);
    } else {
      // Not found yet – store the desired ID so we can select it later when it appears
      setDesiredFoodPackageId(storedFoodId);
      // Keep withFood false for now (no selection shown)
      setFormData(prev => ({ ...prev, withFood: false, foodPackage: '' }));
    }
    initialSelectionDone.current = true;
  }, [poolPartyData, booking, foodPackages]);

  // --------------------------------------------------------------------
  // Remap selection when foodPackages changes (e.g., offer loads after user choice)
  useEffect(() => {
    // If we have a desired package ID waiting, try to select it now
    if (desiredFoodPackageId) {
      const matchingPkg = foodPackages.find(pkg => 
        String(pkg._id) === desiredFoodPackageId || 
        (pkg.foodPackageId && pkg.foodPackageId === desiredFoodPackageId)
      );
      if (matchingPkg) {
        lastSelectedFoodPackageId.current = matchingPkg.foodPackageId;
        setFormData(prev => ({
          ...prev,
          withFood: true,
          foodPackage: String(matchingPkg._id),
        }));
        setDesiredFoodPackageId(null);
        return;
      }
    }

    // Otherwise, handle case where user already selected a package but its _id disappeared
    if (!formData.withFood || !formData.foodPackage) return;

    const exists = foodPackages.some(pkg => String(pkg._id) === formData.foodPackage);
    if (exists) return;

    // Not found – try to remap using the last known foodPackageId
    if (lastSelectedFoodPackageId.current) {
      const matchingPkg = foodPackages.find(
        pkg => pkg.foodPackageId === lastSelectedFoodPackageId.current
      );
      if (matchingPkg) {
        setFormData(prev => ({
          ...prev,
          foodPackage: String(matchingPkg._id),
        }));
        return;
      }
    }

    // If still no match, fallback: deselect food
    console.warn('Selected food package not found in new list, clearing selection');
    setFormData(prev => ({ ...prev, withFood: false, foodPackage: '' }));
    lastSelectedFoodPackageId.current = null;
  }, [foodPackages, desiredFoodPackageId, formData.withFood, formData.foodPackage]);

  // Fetch session availability using locationId
  const fetchSessionsAvailability = useCallback(async (locationId, date, currentSession = null) => {
    if (!locationId || !date) return;
    setAvailabilityLoading(true);
    setAvailabilityError('');
    try {
      const res = await fetch(
        `${API_BASE_URL}/pool-parties/sessions-availability/${locationId}?date=${date}`
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
  }, [API_BASE_URL]);

  // When bookingDate changes and locationDetails is available, refetch availability
  useEffect(() => {
    if (locationDetails?._id && formData.bookingDate) {
      fetchSessionsAvailability(locationDetails._id, formData.bookingDate, formData.session);
    }
  }, [formData.bookingDate, locationDetails?._id, fetchSessionsAvailability]);

  // Fetch active offer when date changes
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

  useEffect(() => {
    fetchActiveOffer();
  }, [fetchActiveOffer]);

  // --------------------------------------------------------------------
  // Form validation
  const isFormValid = useMemo(() => {
    if (!locationDetails) return false;
    if (!formData.bookingDate) return false;
    if (!formData.session) return false;
    if (!isSessionAvailable) return false;
    if (!formData.name.trim()) return false;
    if (!/^\d{10}$/.test(formData.phone)) return false;
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) return false;
    if (!formData.address.trim()) return false;
    if (totalGuests > (poolPartyData?.totalCapacity || Infinity)) return false;
    return true;
  }, [locationDetails, formData, isSessionAvailable, totalGuests, poolPartyData]);

  // --------------------------------------------------------------------
  // Handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
  // Update submission
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setSubmitting(true);

    const selectedFoodPkg = foodPackages.find(
      pkg => String(pkg._id) === formData.foodPackage
    );

    const payload = {
      guestName: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      bookingDate: formData.bookingDate,
      session: formData.session,
      adults: formData.adults,
      kids: formData.kids,
      withFood: formData.withFood,
      foodPackage: formData.withFood && selectedFoodPkg ? {
        foodPackageId: selectedFoodPkg._id, // send the unique _id
        name: selectedFoodPkg.name,
        pricePerAdult: selectedFoodPkg.pricePerAdult,
        pricePerKid: selectedFoodPkg.pricePerKid,
      } : null,
      paymentType,
      amountPaid: parseFloat(manualAmountPaid) || 0,
      remainingAmount: Math.max(0, totalPrice - (parseFloat(manualAmountPaid) || 0)),
      pricing: {
        pricePerAdult: getSessionPricing(formData.session).perAdult,
        pricePerKid: getSessionPricing(formData.session).perKid,
        totalPrice: totalPrice,
      },
    };

    try {
      const res = await fetch(`${API_BASE_URL}/pool-parties/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setUpdateResult(data.booking);
        setStep('confirmation');
        toast.success('Booking updated successfully');
      } else {
        toast.error(data.error || 'Failed to update booking');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
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
  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // --------------------------------------------------------------------
  // Confirmation step
  if (step === 'confirmation' && updateResult) {
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Updated!</h3>
                <p className="text-gray-500 text-sm mb-6">Booking ID: #{updateResult._id?.slice(-8)}</p>

                <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left space-y-3">
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
                        {foodPackages.find(p => String(p._id) === formData.foodPackage)?.name}
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
                    onClick={() => downloadPDF(updateResult._id)}
                    className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download PDF
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/admin/pool-party-bookings')}
                    className="flex-1 bg-gray-600 text-white font-semibold py-3 rounded-xl hover:bg-gray-700"
                  >
                    Back to List
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
  // Edit form
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Pool Party Booking</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Step indicator */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-sm">
            <div className="flex items-center text-blue-600 font-semibold">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-xs">1</span>
              Edit Details
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 rotate-270" />
            <div className="flex items-center text-gray-500">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center mr-2 text-xs">2</span>
              Confirmation
            </div>
          </div>

          {/* Main content */}
          <form onSubmit={handleUpdate} className="p-6 space-y-6">
            {/* Location (disabled) */}
            <section className="border border-gray-200 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={locationDetails?.name || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              />
            </section>

            {/* Booking Date */}
            <section className="border border-gray-200 rounded-xl p-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Booking Date
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
              {availabilityError && (
                <p className="text-sm text-red-600 mt-2">{availabilityError}</p>
              )}
            </section>

            {/* Session Selection */}
            {sessionsAvailability.length > 0 && (
              <section className="border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" /> Session
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessionsAvailability.map((session) => {
                    const sessionPricing = getSessionPricing(session.session);
                    const isAvailable = session.isAvailable && session.availableCapacity >= totalGuests;
                    const isSelected = formData.session === session.session;
                    return (
                      <div
                        key={session.session}
                        onClick={() => !submitting && isAvailable && setFormData(prev => ({ ...prev, session: session.session }))}
                        className={`cursor-pointer border-2 rounded-xl p-5 transition-all ${
                          isSelected
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
                            isSelected
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
                {!isSessionAvailable && formData.session && (
                  <p className="text-sm text-red-600 mt-2">
                    Selected session is no longer available with current guest count.
                  </p>
                )}
              </section>
            )}

            {/* Guest Count */}
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

            {/* Food Packages – FIXED with deferred selection */}
            {foodPackages.length > 0 && (
              <section className="border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-blue-600" /> Food Packages
                  {activeOffer && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                      Special offer
                    </span>
                  )}
                </h3>
                <div className="space-y-3">
                  {/* No food option */}
                  <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="foodOption"
                      checked={!formData.withFood}
                      onChange={() => {
                        lastSelectedFoodPackageId.current = null;
                        setDesiredFoodPackageId(null); // clear any pending selection
                        setFormData(prev => ({ ...prev, withFood: false, foodPackage: '' }));
                      }}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">No food package</span>
                  </label>

                  {/* Food packages */}
                  {foodPackages.map(pkg => {
                    const pkgId = String(pkg._id);
                    const isOfferPackage = pkg.foodPackageId?.startsWith('custom');

                    return (
                      <label
                        key={pkgId}
                        className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="foodOption"
                          value={pkgId}
                          checked={formData.withFood && formData.foodPackage === pkgId}
                          onChange={() => {
                            lastSelectedFoodPackageId.current = pkg.foodPackageId;
                            setDesiredFoodPackageId(null); // clear any pending selection
                            setFormData(prev => ({
                              ...prev,
                              withFood: true,
                              foodPackage: pkgId,
                            }));
                          }}
                          className="mt-1 w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{pkg.name}</p>
                          <p className="text-sm text-gray-600">
                            ₹{pkg.pricePerAdult} per adult, ₹{pkg.pricePerKid} per kid
                          </p>

                          {/* Badge – only shown when activeOffer exists */}
                          {activeOffer && (
                            <span
                              className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                                isOfferPackage
                                  ? 'bg-green-100 text-green-700'  // Offer badge
                                  : 'bg-gray-100 text-gray-700'    // Original badge
                              }`}
                            >
                              {isOfferPackage ? 'Offer' : 'Original'}
                            </span>
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
                disabled={!isFormValid || submitting || offerLoading}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                  </>
                ) : offerLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Checking offers...
                  </>
                ) : (
                  'Update Booking'
                )}
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Admin update</p>
                <p className="text-xs text-gray-600">Changes will be saved</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminEditPoolPartyBookingPage;
