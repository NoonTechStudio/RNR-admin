import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  MapPin,
  Users,
  Calendar,
  Clock,
  Trash2,
  Pencil,
  Plus,
  DollarSign,
  CheckCircle,
  XCircle,
  TrendingUp,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  Globe,
  Lock,
} from "lucide-react";

export default function GetPoolParties() {
  const [poolParties, setPoolParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    locationName: "",
    timings: [],
    isActive: true,
    selectedFoodPackages: [],
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "active", "inactive"

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  // Helper to extract location ID (for private pools) – not used for delete anymore
  const extractLocationId = (locationId) => {
    if (!locationId) return null;
    if (typeof locationId === "string") return locationId;
    if (typeof locationId === "object") return locationId._id || locationId.id || null;
    return String(locationId);
  };

  const fetchPoolParties = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/pool-parties`);
      if (!res.ok) throw new Error("Failed to fetch pool parties");
      const data = await res.json();

      // Normalize the data to ensure we have poolParty._id and other fields
      const normalizedParties = (data.poolParties || []).map((party) => ({
        ...party,
        _id: party._id, // pool party's own ID
        locationId: extractLocationId(party.locationId), // for private pools only
        locationName: party.locationName || "Unknown Location",
        stats: party.stats || {
          totalBookings: 0,
          bookedToday: 0,
          totalRevenue: 0,
        },
      }));

      console.log("Normalized parties:", normalizedParties);
      setPoolParties(normalizedParties);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter parties based on active filter
  const filteredParties = poolParties.filter((party) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return party.isActive === true;
    if (activeFilter === "inactive") return party.isActive === false;
    return true;
  });

  const showDeleteConfirmation = (partyId, locationName) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col sm:flex-row ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="shrink-0 pt-0.5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Delete Pool Party
              </p>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                Are you sure you want to delete pool party at "{locationName}"?
                This will also delete all associated bookings.
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-t sm:border-t-0 sm:border-l border-gray-200">
          <button
            onClick={() => {
              handleDelete(partyId);
              toast.dismiss(t.id);
            }}
            className="flex-1 border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Yes
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              toast.error("Deletion cancelled");
            }}
            className="flex-1 border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            No
          </button>
        </div>
      </div>
    ));
  };

  const handleDelete = async (partyId) => {
    try {
      // ⚠️ The backend currently expects a location ID (for private pools).
      // For shared pools, this won't work unless the backend is updated to delete by pool party ID.
      // We're passing the pool party's own ID; adjust the backend route to /pool-parties/:id if needed.
      const res = await fetch(`${API_BASE_URL}/pool-parties/${partyId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete pool party");
      }

      toast.success("Pool party deleted successfully!");
      setPoolParties((prev) => prev.filter((p) => p._id !== partyId));
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message);
    }
  };

  const handleDeleteClick = (party) => {
    if (!party._id) {
      toast.error("Invalid pool party ID");
      return;
    }
    showDeleteConfirmation(party._id, party.locationName);
  };

  // Handle update click
  const handleUpdateClick = (party) => {
    console.log("Update clicked for party:", party);
    setSelectedParty(party);
    setUpdateForm({
      locationName: party.locationName || "",
      timings: party.timings || [],
      isActive: party.isActive !== undefined ? party.isActive : true,
      selectedFoodPackages: party.selectedFoodPackages || [],
    });
    setShowUpdateModal(true);
  };

  // Update timing field
  const handleTimingChange = (index, field, value) => {
    const updatedTimings = [...updateForm.timings];

    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      if (parent in updatedTimings[index]) {
        updatedTimings[index][parent][child] = value;
      }
    } else {
      updatedTimings[index][field] = value;
    }

    setUpdateForm({ ...updateForm, timings: updatedTimings });
  };

  // Add new timing
  const addTiming = () => {
    setUpdateForm({
      ...updateForm,
      timings: [
        ...updateForm.timings,
        {
          session: "Morning",
          startTime: "09:00",
          endTime: "12:00",
          capacity: 10,
          pricing: { perAdult: 0, perKid: 0 },
          _id: `temp-${Date.now()}`,
        },
      ],
    });
  };

  // Remove timing
  const removeTiming = (index) => {
    const updatedTimings = [...updateForm.timings];
    updatedTimings.splice(index, 1);
    setUpdateForm({ ...updateForm, timings: updatedTimings });
  };

  // Submit update
  const handleUpdateSubmit = async () => {
    try {
      if (!selectedParty || !selectedParty._id) {
        throw new Error("No pool party selected for update");
      }

      const updateData = {
        locationName: updateForm.locationName,
        timings: updateForm.timings.map((timing) => ({
          session: timing.session,
          startTime: timing.startTime,
          endTime: timing.endTime,
          capacity: parseInt(timing.capacity) || 0,
          pricing: {
            perAdult: parseFloat(timing.pricing?.perAdult) || 0,
            perKid: parseFloat(timing.pricing?.perKid) || 0,
          },
        })),
        isActive: updateForm.isActive,
        selectedFoodPackages: updateForm.selectedFoodPackages,
      };

      console.log("Updating pool party with ID:", selectedParty._id);
      console.log("Update data:", updateData);

      const res = await fetch(`${API_BASE_URL}/pool-parties/${selectedParty._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update pool party");
      }

      toast.success("Pool party updated successfully!");
      setShowUpdateModal(false);
      fetchPoolParties(); // Refresh the list
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.message);
    }
  };

  // Calculate total capacity for display
  const calculateTotalCapacity = (timings) => {
    if (!timings || !Array.isArray(timings)) return 0;
    return timings.reduce((sum, timing) => sum + (timing.capacity || 0), 0);
  };

  // Calculate price range for display
  const calculatePriceRange = (timings) => {
    if (!timings || !Array.isArray(timings) || timings.length === 0) {
      return { lowest: 0, highest: 0 };
    }

    const prices = timings
      .map((t) => t.pricing?.perAdult || 0)
      .filter((price) => !isNaN(price));

    if (prices.length === 0) return { lowest: 0, highest: 0 };

    return {
      lowest: Math.min(...prices),
      highest: Math.max(...prices),
    };
  };

  // Toggle card expansion on mobile
  const toggleCardExpansion = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  useEffect(() => {
    fetchPoolParties();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600 text-lg font-medium animate-pulse">
          Loading pool parties...
        </p>
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      <Toaster position="top-center sm:top-right" />

      {/* Mobile Header */}
      <div className="lg:hidden mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Pool Parties</h1>
            <p className="text-xs text-gray-600 mt-1">Manage all pool party venues</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/poolparties/new")}
              className="p-2 bg-[#008DDA] text-white rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Filter Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {filteredParties.length} venue{filteredParties.length !== 1 ? "s" : ""}
            </span>
            {activeFilter !== "all" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Clear filter
              </button>
            )}
          </div>
          {activeFilter === "active" && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              Active only
            </span>
          )}
          {activeFilter === "inactive" && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
              Inactive only
            </span>
          )}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="w-6 h-6 lg:w-7 lg:h-7 text-[#008DDA]" />
            Pool Parties Management
          </h1>
          <p className="text-gray-600 mt-1 lg:mt-2">
            Manage pool party venues, sessions, and pricing
          </p>
        </div>
        <button
          onClick={() => navigate("/poolparties/new")}
          className="flex items-center gap-2 bg-[#008DDA] text-white px-4 py-2 rounded-lg shadow hover:bg-[#0074b8] transition"
        >
          <Plus size={18} /> New Pool Party
        </button>
      </div>

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
                    Status Filter
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveFilter("all");
                        setShowMobileFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg ${
                        activeFilter === "all"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      All Pool Parties
                    </button>
                    <button
                      onClick={() => {
                        setActiveFilter("active");
                        setShowMobileFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg ${
                        activeFilter === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      Active Only
                    </button>
                    <button
                      onClick={() => {
                        setActiveFilter("inactive");
                        setShowMobileFilters(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg ${
                        activeFilter === "inactive"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      Inactive Only
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filters */}
      <div className="hidden lg:flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("active")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeFilter === "active"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Active
          </button>
          <button
            onClick={() => setActiveFilter("inactive")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeFilter === "inactive"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            <XCircle className="w-4 h-4" />
            Inactive
          </button>
        </div>
        <div className="text-gray-600">
          Showing {filteredParties.length} venue{filteredParties.length !== 1 ? "s" : ""}
        </div>
      </div>

      {filteredParties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg mb-2">No pool parties found</p>
          <p className="text-gray-400 text-sm mb-6 px-4">
            {poolParties.length === 0
              ? "No pool parties have been created yet."
              : "No pool parties match your current filter."}
          </p>
          <button
            onClick={() => navigate("/poolparties/new")}
            className="bg-[#008DDA] text-white px-6 py-2 rounded-lg hover:bg-[#0074b8] transition text-sm sm:text-base"
          >
            Create First Pool Party
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredParties.map((party) => {
            const totalCapacity = calculateTotalCapacity(party.timings);
            const priceRange = calculatePriceRange(party.timings);
            const isShared = party.type === "shared";

            return (
              <div
                key={party._id}
                className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-4 sm:p-6 flex flex-col"
              >
                {/* Card Header */}
                <div
                  className="cursor-pointer lg:cursor-auto"
                  onClick={() => window.innerWidth < 1024 && toggleCardExpansion(party._id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 truncate">
                        {party.locationName}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isShared
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isShared ? (
                            <Globe className="w-3 h-3" />
                          ) : (
                            <Lock className="w-3 h-3" />
                          )}
                          {isShared ? "Shared" : "Private"}
                        </span>
                        {isShared && party.sharedLocations?.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {party.sharedLocations.length} linked location
                            {party.sharedLocations.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                          party.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {party.isActive ? (
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                        <span className="hidden sm:inline">
                          {party.isActive ? "Active" : "Inactive"}
                        </span>
                      </span>
                      <button
                        className="lg:hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCardExpansion(party._id);
                        }}
                      >
                        {expandedCard === party._id ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sessions - Collapsed on mobile */}
                  <div className={`lg:block ${expandedCard === party._id ? "block" : "hidden lg:block"}`}>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 border border-gray-100">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#008DDA]" />
                        Sessions ({party.timings?.length || 0})
                      </h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {party.timings?.map((timing, index) => (
                          <div
                            key={timing._id || index}
                            className="flex justify-between items-center text-xs sm:text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-800 truncate block">
                                {timing.session}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {timing.startTime} - {timing.endTime}
                              </span>
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-gray-600 whitespace-nowrap">
                                Capacity: {timing.capacity}
                              </div>
                              <div className="text-xs text-gray-500 whitespace-nowrap">
                                ₹{timing.pricing?.perAdult || 0}/adult
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Food Packages */}
                    {party.selectedFoodPackages?.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-3 sm:p-4 mb-4 border border-orange-100">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <UtensilsCrossed className="w-3 h-3 sm:w-4 sm:h-4 text-[#008DDA]" />
                          Food Packages
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {party.selectedFoodPackages.slice(0, 3).map((pkg, idx) => (
                            <span
                              key={idx}
                              className="bg-white text-orange-700 text-xs px-2 py-1 rounded-md border border-orange-200"
                            >
                              {pkg.name} (₹{pkg.pricePerAdult}/adult)
                            </span>
                          ))}
                          {party.selectedFoodPackages.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{party.selectedFoodPackages.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 border border-blue-100">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-[#008DDA]" />
                        Statistics
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div>
                          <div className="text-gray-500">Total Capacity</div>
                          <div className="font-semibold text-gray-800">{totalCapacity}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Today</div>
                          <div
                            className={`font-semibold ${
                              party.stats?.bookedToday > 0 ? "text-orange-600" : "text-gray-800"
                            }`}
                          >
                            {party.stats?.bookedToday || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Total Bookings</div>
                          <div className="font-semibold text-gray-800">
                            {party.stats?.totalBookings || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Revenue</div>
                          <div className="font-semibold text-green-600 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {party.stats?.totalRevenue || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Summary */}
                    {party.timings?.length > 0 && (
                      <div className="bg-gray-100 border rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-gray-800 mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Pricing Range</h4>
                        <div className="flex justify-between">
                          <div>
                            <div className="text-gray-500">Lowest</div>
                            <div className="font-semibold text-green-600">₹{priceRange.lowest}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Highest</div>
                            <div className="font-semibold text-green-600">₹{priceRange.highest}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions - Always visible */}
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleUpdateClick(party)}
                    className="w-1/2 mr-2 flex justify-center items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm bg-[#008DDA] text-white rounded-md hover:bg-[#0074b8] transition"
                  >
                    <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Update</span>
                    <span className="sm:hidden">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(party)}
                    className="w-1/2 flex justify-center items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Delete</span>
                    <span className="sm:hidden">Del</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Update Modal - Responsive */}
      {showUpdateModal && selectedParty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                  Update Pool Party
                </h2>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={updateForm.locationName}
                    onChange={(e) => setUpdateForm({ ...updateForm, locationName: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008DDA] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter location name"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">Sessions</h3>
                  <button
                    type="button"
                    onClick={addTiming}
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-[#008DDA] text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-[#0074b8]"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Add Session</span>
                  </button>
                </div>

                {updateForm.timings.map((timing, index) => (
                  <div key={timing._id || index} className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-800 text-sm sm:text-base">
                        Session {index + 1}
                      </h4>
                      {updateForm.timings.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTiming(index)}
                          className="text-red-500 hover:text-red-700 text-xs sm:text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-600 mb-1">Session</label>
                        <select
                          value={timing.session}
                          onChange={(e) => handleTimingChange(index, "session", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                        >
                          <option value="Morning">Morning</option>
                          <option value="Evening">Evening</option>
                          <option value="Full Day">Full Day</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-600 mb-1">Capacity</label>
                        <input
                          type="number"
                          value={timing.capacity}
                          onChange={(e) => handleTimingChange(index, "capacity", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-600 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={timing.startTime}
                          onChange={(e) => handleTimingChange(index, "startTime", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-600 mb-1">End Time</label>
                        <input
                          type="time"
                          value={timing.endTime}
                          onChange={(e) => handleTimingChange(index, "endTime", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-600 mb-1">Price per Adult</label>
                        <input
                          type="number"
                          value={timing.pricing.perAdult}
                          onChange={(e) =>
                            handleTimingChange(index, "pricing.perAdult", parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-600 mb-1">Price per Kid</label>
                        <input
                          type="number"
                          value={timing.pricing.perKid}
                          onChange={(e) =>
                            handleTimingChange(index, "pricing.perKid", parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={updateForm.isActive}
                    onChange={(e) => setUpdateForm({ ...updateForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-[#008DDA] border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6 sm:mt-8 pt-4 border-t">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 sm:px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm sm:text-base order-2 sm:order-1 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSubmit}
                  className="px-4 sm:px-6 py-2 bg-[#008DDA] text-white rounded-lg hover:bg-[#0074b8] text-sm sm:text-base order-1 sm:order-2 w-full sm:w-auto"
                >
                  Update Pool Party
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}