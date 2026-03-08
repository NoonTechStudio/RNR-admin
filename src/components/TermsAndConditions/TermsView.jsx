// components/admin/TermsAndConditions/TermsView.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft, Edit, Calendar, Building, Droplets,
  Users, CheckCircle, AlertCircle
} from "lucide-react";

const TermsView = () => {
  const { id } = useParams();
  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  // Memoized fetch function
  const fetchTermsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/terms-and-conditions/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setTerms(data.data);
      } else {
        toast.error(data.error || "Failed to load terms");
      }
    } catch (error) {
      toast.error("Error loading terms");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id, API_BASE_URL]);

  useEffect(() => {
    fetchTermsData();
  }, [fetchTermsData]);

  // Memoized helper functions
  const getStatusBadge = useCallback((status) => {
    const badges = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      inactive: "bg-red-100 text-red-800"
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  }, []);

  // Memoized derived values
  const activeTerms = useMemo(() => 
    terms?.terms?.filter(term => term.isActive) || [], 
    [terms]
  );

  const formattedEffectiveFrom = useMemo(() => 
    terms?.effectiveFrom ? new Date(terms.effectiveFrom).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }) : "",
    [terms?.effectiveFrom]
  );

  const formattedEffectiveUntil = useMemo(() => 
    terms?.effectiveUntil ? new Date(terms.effectiveUntil).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }) : null,
    [terms?.effectiveUntil]
  );

  const statusBadgeClass = useMemo(() => 
    getStatusBadge(terms?.status),
    [terms?.status, getStatusBadge]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!terms) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms not found</h3>
          <p className="text-gray-600">The requested terms and conditions could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <Link
              to="/admin/terms"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={20} />
              Back to Terms List
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{terms.title}</h1>
            {terms.description && (
              <p className="text-gray-600 mt-2">{terms.description}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Link
              to={`/admin/terms/${id}/edit`}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Edit size={18} />
              Edit
            </Link>
          </div>
        </div>

        {/* Meta Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              {terms.type === "location" ? (
                <Building className="text-blue-600" size={24} />
              ) : (
                <Droplets className="text-purple-600" size={24} />
              )}
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium text-gray-900 capitalize">
                  {terms.type === "location" ? "Location Terms" : "Pool Party Terms"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass}`}>
                {terms.status}
              </span>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-gray-900 capitalize">{terms.status}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Calendar className="text-gray-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium text-gray-900">
                  {new Date(terms.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Terms and Conditions</h2>
            <p className="text-sm text-gray-600">
              {terms.terms.length} point{terms.terms.length !== 1 ? "s" : ""}
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {activeTerms.map((term) => (
                <div key={term.pointNumber} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {term.pointNumber}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{term.title}</h3>
                      <p className="text-gray-700 whitespace-pre-line">{term.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Applied Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Applied To
                </h2>
                <p className="text-sm text-gray-600">
                  {terms.applyToAll 
                    ? `All ${terms.type === "location" ? "locations" : "pool parties"}`
                    : `${terms.type === "location" ? terms.appliedLocations.length : terms.appliedPoolParties.length} ${terms.type === "location" ? "location(s)" : "pool party(ies)"}`
                  }
                </p>
              </div>
              
              {!terms.applyToAll && (
                <div className="text-sm text-gray-600">
                  {terms.type === "location" 
                    ? `${terms.appliedLocations.length} locations`
                    : `${terms.appliedPoolParties.length} pool parties`
                  }
                </div>
              )}
            </div>
          </div>
          
          {!terms.applyToAll && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {terms.type === "location"
                  ? terms.appliedLocations.map((location) => (
                      <div key={location._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start gap-3">
                          <Building className="text-blue-600 mt-1" size={20} />
                          <div>
                            <h3 className="font-medium text-gray-900 mb-1">{location.name}</h3>
                            <p className="text-sm text-gray-600">
                              {location.address?.city}, {location.address?.state}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Users size={14} className="text-gray-400" />
                              <span className="text-xs text-gray-500">
                                Capacity: {location.capacityOfPersons} persons
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  : terms.appliedPoolParties.map((poolParty) => (
                      <div key={poolParty._id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                        <div className="flex items-start gap-3">
                          <Droplets className="text-purple-600 mt-1" size={20} />
                          <div>
                            <h3 className="font-medium text-gray-900 mb-1">{poolParty.name}</h3>
                            <p className="text-sm text-gray-600">{poolParty.locationName}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                                {poolParty.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}
          
          {terms.applyToAll && (
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={24} />
                  <div>
                    <h3 className="font-medium text-green-800">Applied to All</h3>
                    <p className="text-sm text-green-700">
                      These terms apply to all {terms.type === "location" ? "locations" : "pool parties"}.
                      New {terms.type === "location" ? "locations" : "pool parties"} will automatically get these terms.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Effective Dates */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Effective Dates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Effective From</p>
              <p className="font-medium text-gray-900">
                {formattedEffectiveFrom}
              </p>
            </div>
            
            {formattedEffectiveUntil && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Effective Until</p>
                <p className="font-medium text-gray-900">
                  {formattedEffectiveUntil}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsView;