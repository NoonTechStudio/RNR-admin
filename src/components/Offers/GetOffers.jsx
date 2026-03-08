import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Pencil,
  Calendar,
  MapPin,
  DollarSign,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  getAllOffers,
  deleteOffer,
} from "../../services/offerApi";
import { getLocations } from "../../services/locationApi";
import { getPoolParties } from "../../services/poolPartyApi";

export default function GetOffers() {
  const [offers, setOffers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [poolParties, setPoolParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOffer, setExpandedOffer] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [filterType, setFilterType] = useState("all"); // "all", "location", "poolparty"
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "active", "inactive"

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  // Fetch offers and related data
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const [offersRes, locationsRes, poolPartiesRes] = await Promise.all([
        getAllOffers(),
        getLocations(),
        getPoolParties(),
      ]);

      setOffers(offersRes.data || []);
      
      // Handle locations - API returns array directly
      const locationsList = Array.isArray(locationsRes) ? locationsRes : locationsRes.data || [];
      setLocations(locationsList);

      // Handle pool parties - API returns { success: true, poolParties: [...], pagination: {...} }
      const poolPartiesList = poolPartiesRes?.poolParties || poolPartiesRes?.data || [];
      setPoolParties(poolPartiesList);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Check if offer is currently active
  const isOfferActive = (startDate, endDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return now >= start && now <= end;
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteOffer(selectedOfferId);
      toast.success("Offer deleted successfully");
      setShowDeleteModal(false);
      setSelectedOfferId(null);
      fetchOffers();
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast.error("Failed to delete offer");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get selected location/pool party names
  const getSelectedItemNames = (offer) => {
    if (offer.offerType === "location") {
      return offer.selectedLocations
        .map((loc) => {
          if (typeof loc === "object") return loc.name;
          const location = locations.find((l) => l._id === loc);
          return location?.name || "Unknown";
        })
        .join(", ");
    } else {
      return offer.selectedPoolParties
        .map((pool) => {
          if (typeof pool === "object") return pool.name;
          const poolParty = poolParties.find((p) => p._id === pool);
          return poolParty?.name || "Unknown";
        })
        .join(", ");
    }
  };

  // Filter offers
  const filteredOffers = offers.filter((offer) => {
    let typeMatch = true;
    let statusMatch = true;

    if (filterType !== "all") {
      typeMatch = offer.offerType === filterType;
    }

    if (filterStatus !== "all") {
      const isActive = isOfferActive(offer.startDate, offer.endDate);
      statusMatch =
        filterStatus === "active"
          ? isActive && offer.isActive
          : !isActive || !offer.isActive;
    }

    return typeMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Offers Management
            </h1>
            <p className="text-gray-600">
              Create and manage special pricing offers for locations and pool
              parties
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/offers/create")}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Plus size={20} />
            Create New Offer
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="location">Locations</option>
              <option value="poolparty">Pool Parties</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No offers found</p>
          <button
            onClick={() => navigate("/admin/offers/create")}
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            <Plus size={18} />
            Create your first offer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => {
            const isActive = isOfferActive(offer.startDate, offer.endDate) && offer.isActive;

            return (
              <div
                key={offer._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Offer Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedOffer(
                      expandedOffer === offer._id ? null : offer._id
                    )
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {offer.name}
                        </h3>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            <CheckCircle2 size={14} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                            <AlertCircle size={14} />
                            Inactive
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        {offer.description}
                      </p>

                      <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin size={16} className="text-blue-600" />
                          <span className="font-semibold text-gray-800">
                            {offer.offerType === "location"
                              ? "Location Offer"
                              : "Pool Party Offer"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar size={16} className="text-blue-600" />
                          <span>
                            {formatDate(offer.startDate)} -{" "}
                            {formatDate(offer.endDate)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          {offer.offerType === "location" ? (
                            <>
                              <MapPin size={16} className="text-blue-600" />
                              <span className="text-sm">
                                {offer.selectedLocations.length} location(s)
                              </span>
                            </>
                          ) : (
                            <>
                              <DollarSign size={16} className="text-blue-600" />
                              <span className="text-sm">
                                {offer.selectedPoolParties.length} pool
                                part(ies)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedOffer(
                          expandedOffer === offer._id ? null : offer._id
                        );
                      }}
                    >
                      {expandedOffer === offer._id ? (
                        <ChevronUp size={24} />
                      ) : (
                        <ChevronDown size={24} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOffer === offer._id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Applied To */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Applied To:
                        </h4>
                        <p className="text-gray-700 text-sm">
                          {getSelectedItemNames(offer)}
                        </p>
                      </div>

                      {/* Pricing */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Offer Pricing:
                        </h4>
                        {offer.offerType === "location" ? (
                          <div className="space-y-2 text-sm text-gray-700">
                            {offer.locationPricing?.pricePerAdultDay && (
                              <div>
                                Adult/Day:{" "}
                                <span className="font-semibold text-green-600">
                                  ₹{offer.locationPricing.pricePerAdultDay}
                                </span>
                              </div>
                            )}
                            {offer.locationPricing?.pricePerKidDay && (
                              <div>
                                Kid/Day:{" "}
                                <span className="font-semibold text-green-600">
                                  ₹{offer.locationPricing.pricePerKidDay}
                                </span>
                              </div>
                            )}
                            {offer.locationPricing?.pricePerPersonNight && (
                              <div>
                                Per Person/Night:{" "}
                                <span className="font-semibold text-green-600">
                                  ₹{offer.locationPricing.pricePerPersonNight}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm text-gray-700">
                            {offer.poolPartyPricing?.sessions?.map((session) => (
                              <div key={session.session}>
                                {session.session}:{" "}
                                <span className="font-semibold text-green-600">
                                  Adult ₹{session.perAdult}, Kid ₹
                                  {session.perKid}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Food Packages */}
                    {/* Food Packages */}
{(offer.locationPricing?.foodPackages?.length > 0 ||
  offer.poolPartyPricing?.foodPackages?.length > 0) && (
  <div className="mb-6">
    <h4 className="font-semibold text-gray-800 mb-3">
      Food Package Pricing:
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* LOCATION FOOD PACKAGES */}
      {offer.offerType === "location" && 
       offer.locationPricing?.foodPackages?.length > 0 && 
       offer.locationPricing.foodPackages.map((pkg, idx) => (
        <div
          key={idx}
          className="bg-white p-4 rounded-lg border border-gray-200"
        >
          <div className="flex justify-between items-start mb-2">
            <p className="font-semibold text-gray-800 text-sm">
              {pkg.name}
            </p>
            {pkg.locationId && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {locations.find(l => l._id === (pkg.locationId._id || pkg.locationId))?.name || 'Location'}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              Adult:{" "}
              <span className="text-green-600 font-semibold">
                ₹{pkg.pricePerAdult}
              </span>
            </p>
            <p>
              Kid:{" "}
              <span className="text-green-600 font-semibold">
                ₹{pkg.pricePerKid}
              </span>
            </p>
          </div>
        </div>
      ))}

      {/* POOL PARTY FOOD PACKAGES */}
      {offer.offerType === "poolparty" && 
       offer.poolPartyPricing?.foodPackages?.length > 0 && 
       offer.poolPartyPricing.foodPackages.map((pkg, idx) => (
        <div
          key={idx}
          className="bg-white p-4 rounded-lg border border-gray-200"
        >
          <div className="flex justify-between items-start mb-2">
            <p className="font-semibold text-gray-800 text-sm">
              {pkg.name}
            </p>
            {pkg.poolPartyId && (
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                {poolParties.find(p => p._id === (pkg.poolPartyId._id || pkg.poolPartyId))?.name || 'Pool Party'}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              Adult:{" "}
              <span className="text-green-600 font-semibold">
                ₹{pkg.pricePerAdult}
              </span>
            </p>
            <p>
              Kid:{" "}
              <span className="text-green-600 font-semibold">
                ₹{pkg.pricePerKid}
              </span>
            </p>
          </div>
        </div>
      ))}
      
    </div>
  </div>
)}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          navigate(`/admin/offers/edit/${offer._id}`)
                        }
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOfferId(offer._id);
                          setShowDeleteModal(true);
                        }}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Delete Offer?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this offer? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
