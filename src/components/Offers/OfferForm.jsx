import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, Plus, X } from "lucide-react";
import {
  createOffer,
  updateOffer,
  getOfferById,
} from "../../services/offerApi";
import { getLocations } from "../../services/locationApi";
import { getPoolParties } from "../../services/poolPartyApi";

export default function OfferForm() {
  const navigate = useNavigate();
  const { offerId } = useParams();
  const isEditMode = !!offerId;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [poolParties, setPoolParties] = useState([]);

  const [newLocationFoodPackage, setNewLocationFoodPackage] = useState({
    name: "",
    description: "",
    pricePerAdult: "",
    pricePerKid: "",
  });
  const [newPoolPartyFoodPackage, setNewPoolPartyFoodPackage] = useState({
    name: "",
    description: "",
    pricePerAdult: "",
    pricePerKid: "",
  });

  const [newPoolPartySession, setNewPoolPartySession] = useState({
    session: "",
    startTime: "",
    endTime: "",
    capacity: "",
    perAdult: "",
    perKid: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    offerType: "location",
    selectedLocations: [],
    selectedPoolParties: [],
    startDate: "",
    endDate: "",
    locationPricing: {
      pricePerAdultDay: "",
      pricePerKidDay: "",
      pricePerPersonNight: "",
      extraPersonCharge: "",
      foodPackages: [],
    },
    poolPartyPricing: {
      sessions: [],
      foodPackages: [],
    },
    isActive: true,
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locationsRes, poolPartiesRes] = await Promise.all([
          getLocations(),
          getPoolParties(),
        ]);

        // Handle locations - API returns array directly
        const locationsList = Array.isArray(locationsRes) ? locationsRes : locationsRes.data || [];
        setLocations(locationsList);

        // Handle pool parties - API returns { success: true, poolParties: [...], pagination: {...} }
        const poolPartiesList = poolPartiesRes?.poolParties || poolPartiesRes?.data || [];
        setPoolParties(poolPartiesList);

        if (isEditMode) {
          const offerRes = await getOfferById(offerId);
          const offer = offerRes.data;

          // Helper to extract ID whether it's an object or string
          const normalizeId = (item) => (typeof item === 'object' ? item._id : item);

          setFormData({
            name: offer.name || "",
            description: offer.description || "",
            offerType: offer.offerType || "location",
            selectedLocations: (offer.selectedLocations || []).map(normalizeId),
            selectedPoolParties: (offer.selectedPoolParties || []).map(normalizeId),
            startDate: new Date(offer.startDate).toISOString().split("T")[0],
            endDate: new Date(offer.endDate).toISOString().split("T")[0],
            locationPricing: offer.locationPricing || {
              pricePerAdultDay: "",
              pricePerKidDay: "",
              pricePerPersonNight: "",
              extraPersonCharge: "",
              foodPackages: [],
            },
            poolPartyPricing: offer.poolPartyPricing || {
              sessions: [],
              foodPackages: [],
            },
            isActive: offer.isActive !== false,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [offerId, isEditMode]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Please enter offer name");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (start > end) {
      toast.error("Start date must be before end date");
      return;
    }

    if (formData.offerType === "location") {
      if (formData.selectedLocations.length === 0) {
        toast.error("Please select at least one location");
        return;
      }
    } else {
      if (formData.selectedPoolParties.length === 0) {
        toast.error("Please select at least one pool party");
        return;
      }
    }

    try {
      setSubmitting(true);

      // Prepare data - send all packages/sessions, but filter to only those belonging to selected items
      const locationPricingForSubmit =
        formData.offerType === "location" && formData.locationPricing
          ? { ...formData.locationPricing }
          : formData.locationPricing;

      const poolPartyPricingForSubmit =
        formData.offerType === "poolparty" && formData.poolPartyPricing
          ? { ...formData.poolPartyPricing }
          : formData.poolPartyPricing;

      // Filter location food packages by selected locations
      if (formData.offerType === "location") {
        const selectedSet = new Set(formData.selectedLocations.map(id => id.toString()));
        if (locationPricingForSubmit.foodPackages) {
          locationPricingForSubmit.foodPackages = locationPricingForSubmit.foodPackages.filter(pkg => {
            const locId = pkg.locationId?._id || pkg.locationId;
            return locId && selectedSet.has(locId.toString());
          });
        }
      }

      // Filter pool party sessions and food packages by selected pool parties
      if (formData.offerType === "poolparty") {
        const selectedSet = new Set(formData.selectedPoolParties.map(id => id.toString()));
        if (poolPartyPricingForSubmit.sessions) {
          poolPartyPricingForSubmit.sessions = poolPartyPricingForSubmit.sessions.filter(sess => {
            const ppId = sess.poolPartyId?._id || sess.poolPartyId;
            return ppId && selectedSet.has(ppId.toString());
          });
        }
        if (poolPartyPricingForSubmit.foodPackages) {
          poolPartyPricingForSubmit.foodPackages = poolPartyPricingForSubmit.foodPackages.filter(pkg => {
            const ppId = pkg.poolPartyId?._id || pkg.poolPartyId;
            return ppId && selectedSet.has(ppId.toString());
          });
        }
      }

      const submitData = {
        ...formData,
        locationPricing: locationPricingForSubmit,
        poolPartyPricing: poolPartyPricingForSubmit,
        selectedLocations:
          formData.offerType === "location"
            ? formData.selectedLocations
            : [],
        selectedPoolParties:
          formData.offerType === "poolparty"
            ? formData.selectedPoolParties
            : [],
      };

      if (isEditMode) {
        await updateOffer(offerId, submitData);
        toast.success("Offer updated successfully");
      } else {
        await createOffer(submitData);
        toast.success("Offer created successfully");
      }

      setTimeout(() => {
        navigate("/admin/offers");
      }, 1500);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data?.error || "Failed to save offer");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle location selection
  const toggleLocation = (locationId) => {
    setFormData((prev) => ({
      ...prev,
      selectedLocations: prev.selectedLocations.includes(locationId)
        ? prev.selectedLocations.filter((id) => id !== locationId)
        : [...prev.selectedLocations, locationId],
    }));
  };

  // Handle pool party selection
  const togglePoolParty = (poolPartyId) => {
    setFormData((prev) => ({
      ...prev,
      selectedPoolParties: prev.selectedPoolParties.includes(poolPartyId)
        ? prev.selectedPoolParties.filter((id) => id !== poolPartyId)
        : [...prev.selectedPoolParties, poolPartyId],
    }));
  };

  const handleLocationPricingChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      locationPricing: {
        ...prev.locationPricing,
        [field]: value === "" ? "" : parseFloat(value),
      },
    }));
  };

  // Location food packages: merge derived packages with saved overrides and custom packages
  useEffect(() => {
    if (formData.offerType !== "location") return;

    const selected = formData.selectedLocations || [];
    if (!selected || selected.length === 0) {
      setFormData((prev) => ({
        ...prev,
        locationPricing: {
          ...prev.locationPricing,
          foodPackages: [],
        },
      }));
      return;
    }

    // Build a map of derived packages from current location data
    const derivedMap = new Map();
    selected.forEach((locId) => {
      const loc = locations.find(
        (l) => l._id === locId || l._id?.toString() === locId?.toString()
      );
      if (!loc) return;
      (loc.pricing?.foodPackages || []).forEach((pkg) => {
        const id = (pkg._id?.toString() || pkg.packageId || pkg.name)?.toString();
        if (!id) return;
        if (!derivedMap.has(id)) {
          derivedMap.set(id, {
            foodPackageId: id,
            name: pkg.name || "Food Package",
            description: pkg.description || "",
            pricePerAdult: pkg.pricePerAdult || "",
            pricePerKid: pkg.pricePerKid || "",
            locationId: locId,
          });
        }
      });
    });

    const existing = formData.locationPricing?.foodPackages || [];
    // Filter existing to only those belonging to selected locations
    const existingForSelected = existing.filter((pkg) => {
      const pkgLocId = pkg.locationId?._id || pkg.locationId;
      return pkgLocId && selected.some((locId) => pkgLocId.toString() === locId?.toString());
    });

    // Build final list
    const finalPackages = [];

    // First, add all derived packages, overlaying any existing overrides
    derivedMap.forEach((derivedPkg, id) => {
      const existingPkg = existingForSelected.find(
        (p) => (p.foodPackageId || p.packageId || p._id)?.toString() === id
      );
      finalPackages.push({
        ...derivedPkg,
        pricePerAdult: existingPkg?.pricePerAdult ?? derivedPkg.pricePerAdult,
        pricePerKid: existingPkg?.pricePerKid ?? derivedPkg.pricePerKid,
        isExisting: true, // mark as derived
      });
    });

    // Then, add any existing packages that are not in derived (custom packages)
    const derivedIds = new Set(derivedMap.keys());
    existingForSelected.forEach((pkg) => {
      const pkgId = (pkg.foodPackageId || pkg.packageId || pkg._id)?.toString();
      if (!pkgId || derivedIds.has(pkgId)) return;
      // This is a custom package (or a package whose original location no longer has it)
      finalPackages.push({
        ...pkg,
        locationId: pkg.locationId?._id || pkg.locationId,
        isCustom: true, // mark as custom for UI
      });
    });

    setFormData((prev) => ({
      ...prev,
      locationPricing: {
        ...prev.locationPricing,
        foodPackages: finalPackages,
      },
    }));
  }, [formData.selectedLocations, locations, formData.offerType]);

  const handleLocationFoodPackageChange = (index, field, value) => {
    setFormData(prev => {
      const list = Array.isArray(prev.locationPricing.foodPackages) ? [...prev.locationPricing.foodPackages] : [];
      list[index] = { ...list[index], [field]: value === "" ? "" : parseFloat(value) };
      return { ...prev, locationPricing: { ...prev.locationPricing, foodPackages: list } };
    });
  };

  // Pool party food packages: merge derived with saved overrides and custom packages
  useEffect(() => {
    if (formData.offerType !== "poolparty") return;

    const selected = formData.selectedPoolParties || [];
    if (!selected || selected.length === 0) {
      setFormData((prev) => ({
        ...prev,
        poolPartyPricing: {
          ...prev.poolPartyPricing,
          foodPackages: [],
        },
      }));
      return;
    }

    // Build a map of derived food packages from current pool party data
    const derivedMap = new Map();
    selected.forEach((ppId) => {
      const pp = poolParties.find(
        (p) => p._id === ppId || p._id?.toString() === ppId?.toString()
      );
      if (!pp) return;
      (pp.selectedFoodPackages || []).forEach((pkg) => {
        const id = (
          pkg.foodPackageId ||
          pkg._id?.toString() ||
          pkg.name
        )?.toString();
        if (!id) return;
        if (!derivedMap.has(id)) {
          derivedMap.set(id, {
            foodPackageId: id,
            name: pkg.name || "Food Package",
            description: pkg.description || "",
            pricePerAdult: pkg.pricePerAdult || "",
            pricePerKid: pkg.pricePerKid || "",
            poolPartyId: ppId,
          });
        }
      });
    });

    const existing = formData.poolPartyPricing?.foodPackages || [];
    // Filter existing to those belonging to selected pool parties
    const existingForSelected = existing.filter((pkg) => {
      const pkgPpId = pkg.poolPartyId?._id || pkg.poolPartyId;
      return pkgPpId && selected.some((ppId) => pkgPpId.toString() === ppId?.toString());
    });

    const finalPackages = [];

    // Derived packages with overrides
    derivedMap.forEach((derivedPkg, id) => {
      const existingPkg = existingForSelected.find(
        (p) => (p.foodPackageId || p.packageId || p._id)?.toString() === id
      );
      finalPackages.push({
        ...derivedPkg,
        pricePerAdult: existingPkg?.pricePerAdult ?? derivedPkg.pricePerAdult,
        pricePerKid: existingPkg?.pricePerKid ?? derivedPkg.pricePerKid,
        isExisting: true,
      });
    });

    // Custom packages not in derived
    const derivedIds = new Set(derivedMap.keys());
    existingForSelected.forEach((pkg) => {
      const pkgId = (pkg.foodPackageId || pkg.packageId || pkg._id)?.toString();
      if (!pkgId || derivedIds.has(pkgId)) return;
      finalPackages.push({
        ...pkg,
        poolPartyId: pkg.poolPartyId?._id || pkg.poolPartyId,
        isCustom: true,
      });
    });

    setFormData((prev) => ({
      ...prev,
      poolPartyPricing: {
        ...prev.poolPartyPricing,
        foodPackages: finalPackages,
      },
    }));
  }, [formData.selectedPoolParties, poolParties, formData.offerType]);

  const handlePoolPartyFoodPackageChange = (index, field, value) => {
    setFormData(prev => {
      const list = Array.isArray(prev.poolPartyPricing.foodPackages) ? [...prev.poolPartyPricing.foodPackages] : [];
      list[index] = { ...list[index], [field]: value === "" ? "" : parseFloat(value) };
      return { ...prev, poolPartyPricing: { ...prev.poolPartyPricing, foodPackages: list } };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <Toaster position="top-right" />

      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin/offers")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4"
          >
            <ArrowLeft size={20} />
            Back to Offers
          </button>
          <h1 className="text-4xl font-bold text-gray-800">
            {isEditMode ? "Edit Offer" : "Create New Offer"}
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          {/* Basic Info Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Offer Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Summer Special Discount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Offer Type *
                </label>
                <select
                  value={formData.offerType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      offerType: e.target.value,
                      selectedLocations: [],
                      selectedPoolParties: [],
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="location">Location Offer</option>
                  <option value="poolparty">Pool Party Offer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the offer details..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date Range Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b">
              Offer Duration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Selection Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b">
              Apply To
            </h2>

            {formData.offerType === "location" ? (
    <div>
      <p className="text-gray-600 mb-4">
        Select locations where this offer will be applied:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((location) => (
          <label
            key={location._id}
            className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <input
              type="checkbox"
              checked={formData.selectedLocations.includes(
                location._id
              )}
              onChange={() => toggleLocation(location._id)}
              className="w-4 h-4 text-blue-600 mt-1"
            />
            <div className="flex-1">
              <span className="text-gray-800 font-semibold block">
                {location.name}
              </span>
              
              {/* Show original pricing when location is selected */}
              {formData.selectedLocations.includes(location._id) && location.pricing && (
                <div className="mt-2 text-xs text-gray-600 bg-blue-50/50 p-2 rounded">
                  <div className="font-medium text-blue-700 mb-1">Current Prices:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {location.pricing.pricePerAdultDay && (
                      <div>Adult/Day: <span className="font-semibold">₹{location.pricing.pricePerAdultDay}</span></div>
                    )}
                    {location.pricing.pricePerKidDay && (
                      <div>Kid/Day: <span className="font-semibold">₹{location.pricing.pricePerKidDay}</span></div>
                    )}
                    {location.pricing.pricePerPersonNight && (
                      <div>Person/Night: <span className="font-semibold">₹{location.pricing.pricePerPersonNight}</span></div>
                    )}
                    {location.pricing.extraPersonCharge && (
                      <div>Extra Person: <span className="font-semibold">₹{location.pricing.extraPersonCharge}</span></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  Select pool parties where this offer will be applied:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {poolParties.map((poolParty) => (
                    <label
                      key={poolParty._id}
                      className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedPoolParties.includes(
                          poolParty._id
                        )}
                        onChange={() => togglePoolParty(poolParty._id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-800 font-semibold">
                        {poolParty.locationName || poolParty.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b">
              Offer Pricing
            </h2>

            {formData.offerType === "location" ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price Per Adult (Day)
                    </label>
                    <input
                      type="number"
                      value={formData.locationPricing.pricePerAdultDay}
                      onChange={(e) =>
                        handleLocationPricingChange("pricePerAdultDay", e.target.value)
                      }
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price Per Kid (Day)
                    </label>
                    <input
                      type="number"
                      value={formData.locationPricing.pricePerKidDay}
                      onChange={(e) =>
                        handleLocationPricingChange("pricePerKidDay", e.target.value)
                      }
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price Per Person (Night)
                    </label>
                    <input
                      type="number"
                      value={formData.locationPricing.pricePerPersonNight}
                      onChange={(e) =>
                        handleLocationPricingChange("pricePerPersonNight", e.target.value)
                      }
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Extra Person Charge
                    </label>
                    <input
                      type="number"
                      value={formData.locationPricing.extraPersonCharge}
                      onChange={(e) =>
                        handleLocationPricingChange("extraPersonCharge", e.target.value)
                      }
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {/* Food package overrides */}
                {Array.isArray(formData.locationPricing.foodPackages) && formData.locationPricing.foodPackages.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-4">Food Package Overrides</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Override existing food package prices below or add a new food package that will be applied to all selected locations.
                    </p>

                    {/* Add new food package for all selected locations */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Package Name
                        </label>
                        <input
                          type="text"
                          value={newLocationFoodPackage.name}
                          onChange={(e) =>
                            setNewLocationFoodPackage((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="e.g., Buffet Lunch"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={newLocationFoodPackage.description}
                          onChange={(e) =>
                            setNewLocationFoodPackage((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="Short details about this package"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Adult Price
                        </label>
                        <input
                          type="number"
                          value={newLocationFoodPackage.pricePerAdult}
                          onChange={(e) =>
                            setNewLocationFoodPackage((prev) => ({
                              ...prev,
                              pricePerAdult: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Kid Price
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={newLocationFoodPackage.pricePerKid}
                            onChange={(e) =>
                              setNewLocationFoodPackage((prev) => ({
                                ...prev,
                                pricePerKid: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const selected = formData.selectedLocations || [];
                              if (!selected.length) {
                                toast.error("Select at least one location to add a food package");
                                return;
                              }
                              if (!newLocationFoodPackage.name.trim()) {
                                toast.error("Please enter package name");
                                return;
                              }
                              setFormData((prev) => {
                                const existing =
                                  Array.isArray(prev.locationPricing.foodPackages)
                                    ? prev.locationPricing.foodPackages
                                    : [];
                                const timestamp = Date.now();
                                const newPkgs = selected.map((locId, idx) => ({
                                  foodPackageId: `custom-loc-${timestamp}-${idx}`,
                                  name: newLocationFoodPackage.name,
                                  description: newLocationFoodPackage.description || "",
                                  pricePerAdult:
                                    newLocationFoodPackage.pricePerAdult === ""
                                      ? ""
                                      : parseFloat(newLocationFoodPackage.pricePerAdult),
                                  pricePerKid:
                                    newLocationFoodPackage.pricePerKid === ""
                                      ? ""
                                      : parseFloat(newLocationFoodPackage.pricePerKid),
                                  locationId: locId,
                                  isCustom: true,
                                }));
                                return {
                                  ...prev,
                                  locationPricing: {
                                    ...prev.locationPricing,
                                    foodPackages: [...existing, ...newPkgs],
                                  },
                                };
                              });
                              setNewLocationFoodPackage({
                                name: "",
                                description: "",
                                pricePerAdult: "",
                                pricePerKid: "",
                              });
                            }}
                            className="px-3 py-2 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                          >
                            Add for all locations
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Group food packages by location */}
                    {formData.selectedLocations.map(locationId => {
                      const location = locations.find(l => l._id === locationId);
                      const locationFoodPackages = formData.locationPricing.foodPackages.filter(
                        pkg => pkg.locationId === locationId || pkg.locationId?._id === locationId
                      );
                      
                      if (locationFoodPackages.length === 0) return null;
                      
                      return (
                        <div key={locationId} className="mb-6">
                          {/* Location Name Header */}
                          <div className="mb-3">
                            <h5 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                              📍 {location?.name || 'Unknown Location'}
                            </h5>
                            <p className="text-sm text-gray-500">Food packages for this location</p>
                          </div>
                          
                          {/* Food Packages Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {locationFoodPackages.map((pkg, idx) => (
                              <div key={pkg.foodPackageId || idx} className="p-4 border rounded-lg bg-white">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <div className="font-semibold text-gray-800">{pkg.name}</div>
                                    {pkg.isCustom && (
                                      <p className="text-xs text-green-600 mt-0.5">
                                        New food package of this location
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-sm text-gray-700">Adult Price</label>
                                    <input 
                                      type="number" 
                                      value={pkg.pricePerAdult}
                                      onChange={(e) => {
                                        const newPackages = formData.locationPricing.foodPackages.map(p => 
                                          (p.foodPackageId === pkg.foodPackageId ? { ...p, pricePerAdult: e.target.value === "" ? "" : parseFloat(e.target.value) } : p)
                                        );
                                        setFormData(prev => ({
                                          ...prev,
                                          locationPricing: { ...prev.locationPricing, foodPackages: newPackages }
                                        }));
                                      }}
                                      className="w-full px-3 py-2 border rounded" 
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-700">Kid Price</label>
                                    <input 
                                      type="number" 
                                      value={pkg.pricePerKid}
                                      onChange={(e) => {
                                        const newPackages = formData.locationPricing.foodPackages.map(p => 
                                          (p.foodPackageId === pkg.foodPackageId ? { ...p, pricePerKid: e.target.value === "" ? "" : parseFloat(e.target.value) } : p)
                                        );
                                        setFormData(prev => ({
                                          ...prev,
                                          locationPricing: { ...prev.locationPricing, foodPackages: newPackages }
                                        }));
                                      }}
                                      className="w-full px-3 py-2 border rounded" 
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Existing session pricing per selected pool party (read-only reference) */}
                <p className="text-gray-600 mb-4">
                  Existing session pricing for each selected pool party:
                </p>
                <div className="space-y-4 mb-6">
                  {formData.selectedPoolParties.map((poolPartyId) => {
                    const poolParty = poolParties.find(
                      (p) => p._id === poolPartyId
                    );
                    if (!poolParty) return null;
                    const timings = poolParty.timings || [];
                    if (!timings.length) return null;

                    return (
                      <div
                        key={poolPartyId}
                        className="p-4 border border-gray-300 rounded-lg bg-white"
                      >
                        <h4 className="font-semibold text-gray-800 mb-2">
                          🏊 {poolParty.name || poolParty.locationName}
                        </h4>
                        <p className="text-xs text-gray-500 mb-3">
                          Existing sessions and pricing (from pool party setup)
                        </p>
                        <div className="space-y-2">
                          {timings.map((timing, idx) => (
                            <div
                              key={`${timing.session}-${idx}`}
                              className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm border rounded px-3 py-2 bg-gray-50"
                            >
                              <div>
                                <span className="font-semibold">
                                  {timing.session}
                                </span>{" "}
                                <span className="text-gray-600">
                                  ({timing.startTime} - {timing.endTime})
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Adult:{" "}
                                </span>
                                <span className="font-medium">
                                  ₹{timing.pricing?.perAdult ?? 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Kid: </span>
                                <span className="font-medium">
                                  ₹{timing.pricing?.perKid ?? 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Capacity: </span>
                                <span className="font-medium">
                                  {timing.capacity ?? 0}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add new session pricing for all selected pool parties */}
                <div className="mb-6 border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    New session pricing for selected pool parties
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Add a new session (e.g., &quot;Late Evening&quot;) that will
                    be available for all selected pool parties in this offer.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Session Name
                      </label>
                      <input
                        type="text"
                        value={newPoolPartySession.session}
                        onChange={(e) =>
                          setNewPoolPartySession((prev) => ({
                            ...prev,
                            session: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="e.g., Late Evening"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="text"
                        value={newPoolPartySession.startTime}
                        onChange={(e) =>
                          setNewPoolPartySession((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="e.g., 09:00 AM"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="text"
                        value={newPoolPartySession.endTime}
                        onChange={(e) =>
                          setNewPoolPartySession((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="e.g., 01:00 PM"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Capacity
                      </label>
                      <input
                        type="number"
                        value={newPoolPartySession.capacity}
                        onChange={(e) =>
                          setNewPoolPartySession((prev) => ({
                            ...prev,
                            capacity: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="e.g., 30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Price Per Adult
                      </label>
                      <input
                        type="number"
                        value={newPoolPartySession.perAdult}
                        onChange={(e) =>
                          setNewPoolPartySession((prev) => ({
                            ...prev,
                            perAdult: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Price Per Kid
                      </label>
                      <input
                        type="number"
                        value={newPoolPartySession.perKid}
                        onChange={(e) =>
                          setNewPoolPartySession((prev) => ({
                            ...prev,
                            perKid: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          const selected = formData.selectedPoolParties || [];
                          if (!selected.length) {
                            toast.error(
                              "Select at least one pool party to add a session"
                            );
                            return;
                          }
                          if (!newPoolPartySession.session.trim()) {
                            toast.error("Please enter session name");
                            return;
                          }

                          setFormData((prev) => {
                            const existing =
                              Array.isArray(prev.poolPartyPricing.sessions)
                                ? prev.poolPartyPricing.sessions
                                : [];
                            const timestamp = Date.now();
                            const newSessions = selected.map((ppId, idx) => ({
                              session: newPoolPartySession.session,
                              startTime: newPoolPartySession.startTime,
                              endTime: newPoolPartySession.endTime,
                              capacity:
                                newPoolPartySession.capacity === ""
                                  ? ""
                                  : parseInt(newPoolPartySession.capacity, 10),
                              perAdult:
                                newPoolPartySession.perAdult === ""
                                  ? ""
                                  : parseFloat(newPoolPartySession.perAdult),
                              perKid:
                                newPoolPartySession.perKid === ""
                                  ? ""
                                  : parseFloat(newPoolPartySession.perKid),
                              poolPartyId: ppId,
                              isCustom: true,
                              _tmpId: `custom-session-${timestamp}-${idx}`,
                            }));
                            return {
                              ...prev,
                              poolPartyPricing: {
                                ...prev.poolPartyPricing,
                                sessions: [...existing, ...newSessions],
                              },
                            };
                          });

                          setNewPoolPartySession({
                            session: "",
                            startTime: "",
                            endTime: "",
                            capacity: "",
                            perAdult: "",
                            perKid: "",
                          });
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Add session for all pool parties
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom (new) session pricing per pool party */}
                {Array.isArray(formData.poolPartyPricing.sessions) &&
                  formData.poolPartyPricing.sessions.length > 0 && (
                    <div className="mt-4 mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        New session pricing per pool party
                      </h4>
                      {formData.selectedPoolParties.map((poolPartyId) => {
                        const poolParty = poolParties.find(
                          (p) => p._id === poolPartyId
                        );
                        const sessionsForPoolParty =
                          formData.poolPartyPricing.sessions.filter(
                            (s) =>
                              (s.poolPartyId?._id || s.poolPartyId) ===
                              poolPartyId
                          );
                        if (!sessionsForPoolParty.length) return null;

                        return (
                          <div
                            key={`custom-sessions-${poolPartyId}`}
                            className="mb-4 p-4 border rounded-lg bg-white"
                          >
                            <div className="mb-2">
                              <h5 className="text-md font-semibold text-blue-600">
                                🏊 {poolParty?.name || poolParty?.locationName}
                              </h5>
                              <p className="text-xs text-green-600">
                                New session pricing of this pool party
                              </p>
                            </div>
                            <div className="space-y-2">
                              {sessionsForPoolParty.map((sess, idx) => (
                                <div
                                  key={sess._tmpId || `${sess.session}-${idx}`}
                                  className="grid grid-cols-1 md:grid-cols-6 gap-2 text-sm border rounded px-3 py-2 bg-gray-50"
                                >
                                  <div>
                                    <label className="block text-xs text-gray-600">
                                      Session
                                    </label>
                                    <input
                                      type="text"
                                      value={sess.session}
                                      onChange={(e) => {
                                        setFormData((prev) => {
                                          const list = Array.isArray(
                                            prev.poolPartyPricing.sessions
                                          )
                                            ? [...prev.poolPartyPricing.sessions]
                                            : [];
                                          list[
                                            list.indexOf(sess)
                                          ] = {
                                            ...sess,
                                            session: e.target.value,
                                          };
                                          return {
                                            ...prev,
                                            poolPartyPricing: {
                                              ...prev.poolPartyPricing,
                                              sessions: list,
                                            },
                                          };
                                        });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600">
                                      Start Time
                                    </label>
                                    <input
                                      type="text"
                                      value={sess.startTime || ""}
                                      onChange={(e) => {
                                        setFormData((prev) => {
                                          const list = Array.isArray(
                                            prev.poolPartyPricing.sessions
                                          )
                                            ? [...prev.poolPartyPricing.sessions]
                                            : [];
                                          list[
                                            list.indexOf(sess)
                                          ] = {
                                            ...sess,
                                            startTime: e.target.value,
                                          };
                                          return {
                                            ...prev,
                                            poolPartyPricing: {
                                              ...prev.poolPartyPricing,
                                              sessions: list,
                                            },
                                          };
                                        });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600">
                                      End Time
                                    </label>
                                    <input
                                      type="text"
                                      value={sess.endTime || ""}
                                      onChange={(e) => {
                                        setFormData((prev) => {
                                          const list = Array.isArray(
                                            prev.poolPartyPricing.sessions
                                          )
                                            ? [...prev.poolPartyPricing.sessions]
                                            : [];
                                          list[
                                            list.indexOf(sess)
                                          ] = {
                                            ...sess,
                                            endTime: e.target.value,
                                          };
                                          return {
                                            ...prev,
                                            poolPartyPricing: {
                                              ...prev.poolPartyPricing,
                                              sessions: list,
                                            },
                                          };
                                        });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600">
                                      Capacity
                                    </label>
                                    <input
                                      type="number"
                                      value={sess.capacity ?? ""}
                                      onChange={(e) => {
                                        const value =
                                          e.target.value === ""
                                            ? ""
                                            : parseInt(e.target.value, 10);
                                        setFormData((prev) => {
                                          const list = Array.isArray(
                                            prev.poolPartyPricing.sessions
                                          )
                                            ? [...prev.poolPartyPricing.sessions]
                                            : [];
                                          list[
                                            list.indexOf(sess)
                                          ] = { ...sess, capacity: value };
                                          return {
                                            ...prev,
                                            poolPartyPricing: {
                                              ...prev.poolPartyPricing,
                                              sessions: list,
                                            },
                                          };
                                        });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600">
                                      Adult Price
                                    </label>
                                    <input
                                      type="number"
                                      value={sess.perAdult}
                                      onChange={(e) => {
                                        const value =
                                          e.target.value === ""
                                            ? ""
                                            : parseFloat(e.target.value);
                                        setFormData((prev) => {
                                          const list = Array.isArray(
                                            prev.poolPartyPricing.sessions
                                          )
                                            ? [...prev.poolPartyPricing.sessions]
                                            : [];
                                          list[
                                            list.indexOf(sess)
                                          ] = { ...sess, perAdult: value };
                                          return {
                                            ...prev,
                                            poolPartyPricing: {
                                              ...prev.poolPartyPricing,
                                              sessions: list,
                                            },
                                          };
                                        });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600">
                                      Kid Price
                                    </label>
                                    <input
                                      type="number"
                                      value={sess.perKid}
                                      onChange={(e) => {
                                        const value =
                                          e.target.value === ""
                                            ? ""
                                            : parseFloat(e.target.value);
                                        setFormData((prev) => {
                                          const list = Array.isArray(
                                            prev.poolPartyPricing.sessions
                                          )
                                            ? [...prev.poolPartyPricing.sessions]
                                            : [];
                                          list[
                                            list.indexOf(sess)
                                          ] = { ...sess, perKid: value };
                                          return {
                                            ...prev,
                                            poolPartyPricing: {
                                              ...prev.poolPartyPricing,
                                              sessions: list,
                                            },
                                          };
                                        });
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* Pool party food package overrides */}
                {Array.isArray(formData.poolPartyPricing.foodPackages) && formData.poolPartyPricing.foodPackages.length > 0 && (
                  <div className="mt-6 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-4">Pool Party Food Package Overrides</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Override existing food package prices below or add a new food package that will be applied to all selected pool parties.
                    </p>

                    {/* Add new food package for all selected pool parties */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Package Name
                        </label>
                        <input
                          type="text"
                          value={newPoolPartyFoodPackage.name}
                          onChange={(e) =>
                            setNewPoolPartyFoodPackage((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="e.g., Buffet Lunch"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={newPoolPartyFoodPackage.description}
                          onChange={(e) =>
                            setNewPoolPartyFoodPackage((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="Short details about this package"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Adult Price
                        </label>
                        <input
                          type="number"
                          value={newPoolPartyFoodPackage.pricePerAdult}
                          onChange={(e) =>
                            setNewPoolPartyFoodPackage((prev) => ({
                              ...prev,
                              pricePerAdult: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Kid Price
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={newPoolPartyFoodPackage.pricePerKid}
                            onChange={(e) =>
                              setNewPoolPartyFoodPackage((prev) => ({
                                ...prev,
                                pricePerKid: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const selected = formData.selectedPoolParties || [];
                              if (!selected.length) {
                                toast.error("Select at least one pool party to add a food package");
                                return;
                              }
                              if (!newPoolPartyFoodPackage.name.trim()) {
                                toast.error("Please enter package name");
                                return;
                              }
                              setFormData((prev) => {
                                const existing =
                                  Array.isArray(prev.poolPartyPricing.foodPackages)
                                    ? prev.poolPartyPricing.foodPackages
                                    : [];
                                const timestamp = Date.now();
                                const newPkgs = selected.map((ppId, idx) => ({
                                  foodPackageId: `custom-pp-${timestamp}-${idx}`,
                                  name: newPoolPartyFoodPackage.name,
                                  description: newPoolPartyFoodPackage.description || "",
                                  pricePerAdult:
                                    newPoolPartyFoodPackage.pricePerAdult === ""
                                      ? ""
                                      : parseFloat(newPoolPartyFoodPackage.pricePerAdult),
                                  pricePerKid:
                                    newPoolPartyFoodPackage.pricePerKid === ""
                                      ? ""
                                      : parseFloat(newPoolPartyFoodPackage.pricePerKid),
                                  poolPartyId: ppId,
                                  isCustom: true,
                                }));
                                return {
                                  ...prev,
                                  poolPartyPricing: {
                                    ...prev.poolPartyPricing,
                                    foodPackages: [...existing, ...newPkgs],
                                  },
                                };
                              });
                              setNewPoolPartyFoodPackage({
                                name: "",
                                description: "",
                                pricePerAdult: "",
                                pricePerKid: "",
                              });
                            }}
                            className="px-3 py-2 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                          >
                            Add for all pool parties
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Group food packages by pool party */}
                    {formData.selectedPoolParties.map(poolPartyId => {
                      const poolParty = poolParties.find(p => p._id === poolPartyId);
                      const poolPartyFoodPackages = formData.poolPartyPricing.foodPackages.filter(
                        pkg => pkg.poolPartyId === poolPartyId || pkg.poolPartyId?._id === poolPartyId
                      );
                      
                      if (poolPartyFoodPackages.length === 0) return null;
                      
                      return (
                        <div key={poolPartyId} className="mb-6">
                          {/* Pool Party Name Header */}
                          <div className="mb-3">
                            <h5 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                              🏊 {poolParty?.name || poolParty?.locationName || 'Unknown Pool Party'}
                            </h5>
                            <p className="text-sm text-gray-500">Food packages for this pool party</p>
                          </div>
                          
                          {/* Food Packages Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {poolPartyFoodPackages.map((pkg, idx) => (
                              <div key={pkg.foodPackageId || idx} className="p-4 border rounded-lg bg-white">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <div className="font-semibold text-gray-800">{pkg.name}({pkg.description})</div>
                                    {pkg.isCustom && (
                                      <p className="text-xs text-green-600 mt-0.5">
                                        New food package of this pool party
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-sm text-gray-700">Adult Price</label>
                                    <input 
                                      type="number" 
                                      value={pkg.pricePerAdult}
                                      onChange={(e) => {
                                        const newPackages = formData.poolPartyPricing.foodPackages.map(p => 
                                          (p.foodPackageId === pkg.foodPackageId ? { ...p, pricePerAdult: e.target.value === "" ? "" : parseFloat(e.target.value) } : p)
                                        );
                                        setFormData(prev => ({
                                          ...prev,
                                          poolPartyPricing: { ...prev.poolPartyPricing, foodPackages: newPackages }
                                        }));
                                      }}
                                      className="w-full px-3 py-2 border rounded" 
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-700">Kid Price</label>
                                    <input 
                                      type="number" 
                                      value={pkg.pricePerKid}
                                      onChange={(e) => {
                                        const newPackages = formData.poolPartyPricing.foodPackages.map(p => 
                                          (p.foodPackageId === pkg.foodPackageId ? { ...p, pricePerKid: e.target.value === "" ? "" : parseFloat(e.target.value) } : p)
                                        );
                                        setFormData(prev => ({
                                          ...prev,
                                          poolPartyPricing: { ...prev.poolPartyPricing, foodPackages: newPackages }
                                        }));
                                      }}
                                      className="w-full px-3 py-2 border rounded" 
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/offers")}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Saving..."
                : isEditMode
                ? "Update Offer"
                : "Create Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}