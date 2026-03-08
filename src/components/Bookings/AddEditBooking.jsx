// AdminEditBookingPage.jsx – Full admin edit page with corrected payment amount handling
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Calendar, User, Phone, Mail, Home, Clock, Utensils, CreditCard,
  CheckCircle, AlertCircle, Users, Loader2, ChevronDown, ArrowLeft, Shield, Download
} from 'lucide-react';

// ----------------------------------------------------------------------
// Helper: extract YYYY‑MM‑DD from ISO string
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
const AdminEditBookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  // ---------- State (dates as YYYY-MM-DD strings) ----------
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [bookedDates, setBookedDates] = useState([]); // string[] in YYYY-MM-DD

  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [sameDayCheckout, setSameDayCheckout] = useState(false);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    checkInTime: '10:00 AM',
  });
  const [selectedFoodPackage, setSelectedFoodPackage] = useState(null);
  const [dailyFoodSelections, setDailyFoodSelections] = useState({});
  const [showDailySelection, setShowDailySelection] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [paymentType, setPaymentType] = useState('token');
  const [manualAmountPaid, setManualAmountPaid] = useState('');
  const [updateResult, setUpdateResult] = useState(null);
  const [step, setStep] = useState('booking'); // 'booking' | 'confirmation'

  // ---------- Derived values (using UTC dates) ----------
  const totalGuests = adults + kids;

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate || sameDayCheckout) return 0;
    const start = utcDate(checkInDate);
    const end = utcDate(checkOutDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }, [checkInDate, checkOutDate, sameDayCheckout]);

  const days = useMemo(() => {
    if (!checkInDate) return 0;
    if (sameDayCheckout) return 1;
    if (!checkOutDate) return 1;
    const start = utcDate(checkInDate);
    const end = utcDate(checkOutDate);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }, [checkInDate, checkOutDate, sameDayCheckout]);

  // Price calculation (identical to create page)
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
  const tokenAmount = useMemo(() => Math.round((totalPrice * 0.5) / 100) * 100, [totalPrice]);
  const remainingAmount = useMemo(() => Math.max(0, totalPrice - (parseFloat(manualAmountPaid) || 0)), [totalPrice, manualAmountPaid]);

  // ✅ Only update manualAmountPaid when paymentType changes (not on totalPrice changes)
  // This preserves the existing paid amount while editing dates/guests
  useEffect(() => {
    if (paymentType === 'full') {
      setManualAmountPaid(totalPrice.toString());
    } else {
      setManualAmountPaid(tokenAmount.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentType]); // totalPrice and tokenAmount removed intentionally

  // --------------------------------------------------------------------
  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/bookings/${id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Booking not found');
        const b = data.booking;

        setBooking(b);
        const locationId = b.location?._id || b.location;
        if (locationId) {
          const locRes = await fetch(`${API_BASE_URL}/locations/${locationId}`);
          const locData = await locRes.json();
          setLocationDetails(locData);

          // Fetch booked dates and exclude current booking's dates
          const bookedRes = await fetch(`${API_BASE_URL}/bookings/dates/${locationId}`);
          const bookedData = await bookedRes.json();
          if (bookedData.success) {
            const currentDates = [];
            const start = b.checkInDate.split('T')[0];
            const end = b.checkOutDate.split('T')[0];
            let current = new Date(utcDate(start));
            const endDate = new Date(utcDate(end));
            while (current <= endDate) {
              const y = current.getUTCFullYear();
              const m = String(current.getUTCMonth() + 1).padStart(2, '0');
              const d = String(current.getUTCDate()).padStart(2, '0');
              currentDates.push(`${y}-${m}-${d}`);
              current.setUTCDate(current.getUTCDate() + 1);
            }
            const filtered = bookedData.bookedDates.filter(d => !currentDates.includes(d));
            setBookedDates(filtered);
          }
        }

        // Populate form
        setCheckInDate(toDateString(b.checkInDate));
        setCheckOutDate(toDateString(b.checkOutDate));
        setSameDayCheckout(b.sameDayCheckout || false);
        setAdults(b.adults || 1);
        setKids(b.kids || 0);
        setFormData({
          name: b.name || '',
          phone: b.phone || '',
          email: b.email || '',
          address: b.address || '',
          checkInTime: b.checkInTime || '10:00 AM',
        });
        setPaymentType(b.paymentType || 'token');
        setManualAmountPaid((b.amountPaid || 0).toString());

        if (b.withFood && b.foodPackage) {
          setSelectedFoodPackage({
            id: b.foodPackage.packageId || b.foodPackage._id,
            name: b.foodPackage.name,
            pricePerAdult: b.foodPackage.pricePerAdult,
            pricePerKid: b.foodPackage.pricePerKid,
          });
        }

        if (b.dailyFoodPackages && b.dailyFoodPackages.length > 0) {
          const selections = {};
          b.dailyFoodPackages.forEach(day => {
            selections[toDateString(day.date)] = day.packageId;
          });
          setDailyFoodSelections(selections);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load booking');
        navigate('/admin/bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, API_BASE_URL, navigate]);

  // Fetch active offer when check-in date changes
  const fetchActiveOffer = useCallback(async () => {
    if (!locationDetails?._id || !checkInDate) {
      setActiveOffer(null);
      return;
    }
    setOfferLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/offers/active/location?locationId=${locationDetails._id}&bookingDate=${checkInDate}`
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
  }, [locationDetails, checkInDate, API_BASE_URL]);

  useEffect(() => {
    fetchActiveOffer();
  }, [fetchActiveOffer]);

  // --------------------------------------------------------------------
  // Conflict check (using strings)
  const hasDateConflict = useMemo(() => {
    if (!checkInDate || !checkOutDate || bookedDates.length === 0) return false;
    const start = utcDate(checkInDate);
    const end = utcDate(checkOutDate);
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      if (bookedDates.includes(key)) return true;
    }
    return false;
  }, [checkInDate, checkOutDate, bookedDates]);

  // --------------------------------------------------------------------
  // Form validation
  const isFormValid = useMemo(() => {
    if (!locationDetails) return false;
    if (!checkInDate) return false;
    if (!sameDayCheckout && !checkOutDate) return false;
    if (hasDateConflict) return false;
    if (!formData.name.trim()) return false;
    if (!/^\d{10}$/.test(formData.phone)) return false;
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) return false;
    if (!formData.address.trim()) return false;
    if (totalGuests > (locationDetails.capacityOfPersons || Infinity)) return false;
    return true;
  }, [locationDetails, checkInDate, checkOutDate, sameDayCheckout, hasDateConflict, formData, totalGuests]);

  // --------------------------------------------------------------------
  // Update handler
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setSubmitting(true);

    const dailyPackages = Object.entries(dailyFoodSelections)
      .filter(([_, pkgId]) => pkgId)
      .map(([date, pkgId]) => ({ date, packageId: pkgId }));

    const payload = {
      checkInDate,
      checkOutDate: sameDayCheckout ? checkInDate : checkOutDate,
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
      paymentType,
      amountPaid: parseFloat(manualAmountPaid) || 0,
      remainingAmount: Math.max(0, totalPrice - (parseFloat(manualAmountPaid) || 0)),
      sameDayCheckout,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
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
                      <span className="text-gray-600">Food:</span>
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
                    onClick={() => downloadPDF(updateResult._id)}
                    className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download PDF
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/admin/bookings')}
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Booking</h1>
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

          {hasDateConflict && (
            <div className="mx-6 mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
              <div className="shrink-0 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">!</div>
              <p className="text-sm text-yellow-800">Selected dates overlap with existing bookings.</p>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 p-6">
            {/* Left column - Form */}
            <div className="flex-1 space-y-6">
              {/* Location (disabled) */}
              <section className="bg-white border border-gray-200 rounded-xl p-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={locationDetails?.name || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </section>

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
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check‑out *</label>
                    <input
                      type="date"
                      value={sameDayCheckout ? checkInDate : checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate}
                      disabled={sameDayCheckout}
                      required={!sameDayCheckout}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    />
                  </div>
                </div>
                {locationDetails?.propertyDetails?.nightStay && (
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
                  <User className="w-5 h-5 text-blue-600" /> Guest Details
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
                                      const start = new Date(utcDate(checkInDate));
                                      const foodDays = days + 1;
                                      const daysArray = [];
                                      for (let i = 0; i < foodDays; i++) {
                                        const d = new Date(start);
                                        d.setUTCDate(d.getUTCDate() + i);
                                        const y = d.getUTCFullYear();
                                        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
                                        const day = String(d.getUTCDate()).padStart(2, '0');
                                        daysArray.push({
                                          date: d,
                                          dateKey: `${y}-${m}-${day}`,
                                        });
                                      }
                                      return daysArray.map(day => (
                                        <div key={day.dateKey} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <span className="text-sm font-medium">
                                            {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
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

              {/* Payment section */}
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
                      onClick={handleUpdate}
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEditBookingPage;