import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import {
  MapPin,
  Users,
  Bed,
  UtensilsCrossed,
  Trash2,
  Pencil,
  Plus,
  Droplet,
  Home,
  Bath,
  DoorOpen,
  Moon,
  Sun,
  Thermometer,
  Waves,
  Coffee,
  CheckCircle,
  XCircle,
  Calendar,
  Navigation,
} from "lucide-react";

// ----------------------------------------------------------------------
// Memoized Location Card – prevents unnecessary re-renders
// ----------------------------------------------------------------------
const LocationCard = memo(({ location, onDeleteClick, onEdit }) => {
  const {
    pricing = {},
    propertyDetails = {},
    poolPartyConfig = {},
    address = {},
    coordinates,
    amenities = [],
    createdAt,
    isActive = true,
  } = location;

  // Active food packages
  const activeFoodPackages = useMemo(
    () => pricing.foodPackages?.filter((p) => p.isActive) || [],
    [pricing.foodPackages]
  );

  // Format date
  const createdDate = useMemo(
    () => (createdAt ? new Date(createdAt).toLocaleDateString() : "N/A"),
    [createdAt]
  );

  // Format address
  const fullAddress = useMemo(
    () => `${address.line1 || ""}${address.line2 ? ", " + address.line2 : ""}, ${address.city || ""}, ${address.state || ""}`.replace(/^, |, $/g, ""),
    [address]
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col">
      {/* Header: Title & Active Status */}
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-xl font-semibold text-gray-800">{location.name}</h2>
        <div className="flex items-center gap-2">
          {isActive ? (
            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
              <CheckCircle size={14} /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
              <XCircle size={14} /> Inactive
            </span>
          )}
          {poolPartyConfig?.hasPoolParty && (
            <span
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                poolPartyConfig.poolPartyType === "shared"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-pink-50 text-pink-700 border-pink-200"
              }`}
            >
              <Waves size={14} />
              {poolPartyConfig.poolPartyType === "shared" ? "Shared Pool" : "Private Pool"}
            </span>
          )}
        </div>
      </div>

      {/* Address & Description */}
      <div className="mb-3">
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-[#008DDA]" />
          {fullAddress || "No address"}
        </p>
        {coordinates?.lat && coordinates?.lng && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <Navigation size={12} />
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </p>
        )}
        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
          {location.description || "No description available."}
        </p>
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
        <Users className="w-4 h-4 text-[#008DDA]" />
        <span>
          <span className="font-medium">{location.capacityOfPersons || "-"}</span> persons
        </span>
      </div>

      {/* Property Details Grid */}
      <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3 mb-3 text-xs border border-gray-100">
        {propertyDetails.bedrooms ? (
          <div className="flex items-center gap-1">
            <Bed className="w-3 h-3 text-[#008DDA]" /> Beds: {propertyDetails.bedrooms}
          </div>
        ) : null}
        {propertyDetails.acBedrooms ? (
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-blue-500" /> AC: {propertyDetails.acBedrooms}
          </div>
        ) : null}
        {propertyDetails.nonAcBedrooms ? (
          <div className="flex items-center gap-1">
            <Sun className="w-3 h-3 text-orange-500" /> Non-AC: {propertyDetails.nonAcBedrooms}
          </div>
        ) : null}
        {propertyDetails.kitchens ? (
          <div className="flex items-center gap-1">
            <Coffee className="w-3 h-3 text-[#008DDA]" /> Kitch: {propertyDetails.kitchens}
          </div>
        ) : null}
        {propertyDetails.livingRooms ? (
          <div className="flex items-center gap-1">
            <Home className="w-3 h-3 text-[#008DDA]" /> Living: {propertyDetails.livingRooms}
          </div>
        ) : null}
        {propertyDetails.halls ? (
          <div className="flex items-center gap-1">
            <DoorOpen className="w-3 h-3 text-[#008DDA]" /> Halls: {propertyDetails.halls}
          </div>
        ) : null}
        {propertyDetails.bathrooms ? (
          <div className="flex items-center gap-1">
            <Bath className="w-3 h-3 text-[#008DDA]" /> Bath: {propertyDetails.bathrooms}
          </div>
        ) : null}
        {propertyDetails.swimmingPools ? (
          <div className="flex items-center gap-1">
            <Waves className="w-3 h-3 text-[#008DDA]" /> Pool: {propertyDetails.swimmingPools}
          </div>
        ) : null}
        {propertyDetails.privateRooms ? (
          <div className="flex items-center gap-1">
            <DoorOpen className="w-3 h-3 text-[#008DDA]" /> Private: {propertyDetails.privateRooms}
          </div>
        ) : null}
      </div>

      {/* Night Stay & With Food Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {propertyDetails.nightStay && (
          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full border border-indigo-200">
            <Moon className="w-3 h-3" /> Night Stay
          </span>
        )}
        {propertyDetails.withFood && (
          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full border border-green-200">
            <UtensilsCrossed className="w-3 h-3" /> With Food
          </span>
        )}
      </div>

      {/* Pricing Details */}
      <div className="bg-gray-100 border rounded-lg p-3 text-sm text-gray-800 mb-3">
        <div className="grid grid-cols-2 gap-1">
          <p className="font-medium text-[#008DDA]">Day Rates</p>
          <p className="font-medium text-[#008DDA]">Night Stay</p>
          <p>👤 Adult: ₹{pricing.pricePerAdultDay || 0}</p>
          <p>🌙 Per person: ₹{pricing.pricePerPersonNight || 0}</p>
          <p>🧒 Kid: ₹{pricing.pricePerKidDay || 0}</p>
          <p>➕ Extra: ₹{pricing.extraPersonCharge || 0}</p>
        </div>
      </div>

      {/* Food Packages */}
      {activeFoodPackages.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <UtensilsCrossed className="w-4 h-4 text-[#008DDA]" />
            Food Packages
          </h3>
          <div className="flex flex-wrap gap-1">
            {activeFoodPackages.slice(0, 3).map((pkg, i) => (
              <span
                key={i}
                className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-md border border-orange-200"
                title={pkg.description || pkg.name}
              >
                {pkg.name} (₹{pkg.pricePerAdult}/adult, ₹{pkg.pricePerKid}/kid)
              </span>
            ))}
            {activeFoodPackages.length > 3 && (
              <span className="text-xs text-gray-500">+{activeFoodPackages.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* Pool Party Details (if available) */}
      {poolPartyConfig?.hasPoolParty && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100 text-xs">
          <p className="font-medium text-[#008DDA] mb-1">Pool Party Config</p>
          <div className="space-y-1 text-gray-700">
            <p>Type: {poolPartyConfig.poolPartyType}</p>
            {poolPartyConfig.sharedPoolPartyId && (
              <p className="truncate">Shared Pool ID: {poolPartyConfig.sharedPoolPartyId}</p>
            )}
            {poolPartyConfig.privatePoolPartyId && (
              <p className="truncate">Private Pool ID: {poolPartyConfig.privatePoolPartyId}</p>
            )}
            <p>Confirmed: {poolPartyConfig.isConfirmedForPoolPartyBooking ? "Yes" : "No"}</p>
          </div>
        </div>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {amenities.slice(0, 6).map((a, i) => (
              <span
                key={i}
                className="bg-blue-50 text-[#008DDA] text-xs font-medium px-2 py-1 rounded-md border border-blue-100"
              >
                {a}
              </span>
            ))}
            {amenities.length > 6 && (
              <span className="text-xs text-gray-500">+{amenities.length - 6} more</span>
            )}
          </div>
        </div>
      )}

      {/* Footer: Created At */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
        <Calendar size={14} />
        <span>Created: {createdDate}</span>
      </div>

      {/* Actions – UNCHANGED */}
      <div className="flex justify-between items-center mt-auto pt-3 border-t">
        <button
          onClick={() => onEdit(location._id)}
          className="w-1/2 mr-2 flex justify-center items-center gap-2 py-2 text-sm bg-[#008DDA] text-white rounded-md hover:bg-[#0074b8] transition"
        >
          <Pencil size={16} /> Update
        </button>
        <button
          onClick={() => onDeleteClick(location._id, location.name)}
          className="w-1/2 flex justify-center items-center gap-2 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition"
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
});

LocationCard.displayName = "LocationCard";

// ----------------------------------------------------------------------
// Main GetLocations Component
// ----------------------------------------------------------------------
export default function GetLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  // Stable fetch function using useCallback
  const fetchLocations = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/locations`);
      setLocations(data);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Delete handler with confirmation toast
  const handleDelete = useCallback(
    async (id) => {
      try {
        await axios.delete(`${API_BASE_URL}/locations/${id}`);
        toast.success("Location deleted successfully!");
        setLocations((prev) => prev.filter((l) => l._id !== id));
      } catch (err) {
        toast.error(err.response?.data?.error || err.message || "Failed to delete");
      }
    },
    [API_BASE_URL]
  );

  // Delete confirmation (unchanged)
  const showDeleteConfirmation = useCallback((locationId, locationName) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
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
                <p className="text-sm font-medium text-gray-900">Delete Location</p>
                <p className="mt-1 text-sm text-gray-500">
                  Are you sure you want to delete "{locationName}"? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => {
                handleDelete(locationId);
                toast.dismiss(t.id);
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
      ),
      { duration: Infinity }
    );
  }, [handleDelete]);

  const handleDeleteClick = useCallback((locationId, locationName) => {
    showDeleteConfirmation(locationId, locationName);
  }, [showDeleteConfirmation]);

  const handleEdit = useCallback((id) => {
    navigate(`/locations/edit/${id}`);
  }, [navigate]);

  // Initial fetch
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600 text-lg font-medium animate-pulse">
          Loading resort locations...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-10">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MapPin className="w-7 h-7 text-[#008DDA]" />
          Resort Locations
        </h1>
        <button
          onClick={() => navigate("/locations/new")}
          className="mt-4 sm:mt-0 flex items-center gap-2 bg-[#008DDA] text-white px-4 py-2 rounded-lg shadow hover:bg-[#0074b8] transition"
        >
          <Plus size={18} /> New Location
        </button>
      </div>

      {locations.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No resort locations found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {locations.map((loc) => (
            <LocationCard
              key={loc._id}
              location={loc}
              onDeleteClick={handleDeleteClick}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}