import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  validationRules, 
  validateField, 
  validateForm 
} from "../../utils/locations/validations";
import { 
  extractCoordinatesFromUrl, 
  handleAddressSearch, 
  parseSuggestionToFormData 
} from "../../utils/locations/locationUtils";
import { 
  amenitiesOptions, 
  initialFormState, 
  addressFields 
} from "../../utils/locations/constants";
import { 
  handleNestedChange, 
  handleBlur, 
  prepareSubmitData 
} from "../../utils/locations/formHelpers";

const AddLocation = () => {
  const { id } = useParams(); // Get location ID from URL for update
  const navigate = useNavigate();
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 5;
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  const isEditMode = Boolean(id);

  // Step titles
  const stepTitles = {
    1: "Basic Information",
    2: "Location & Address",
    3: "Property Features",
    4: "Pricing & Amenities",
    5: "Review & Submit"
  };

  // Fetch location data for editing
  useEffect(() => {
    if (isEditMode) {
      fetchLocationData();
    }
  }, [id]);

  const fetchLocationData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/locations/${id}`);
      const locationData = res.data;
      
      // Transform the API data to match our form structure
      setForm({
        name: locationData.name || "",
        description: locationData.description || "",
        capacityOfPersons: locationData.capacityOfPersons || "",
        address: {
          line1: locationData.address?.line1 || "",
          line2: locationData.address?.line2 || "",
          landmark: locationData.address?.landmark || "",
          city: locationData.address?.city || "",
          state: locationData.address?.state || "",
          pincode: locationData.address?.pincode || ""
        },
        coordinates: {
          lat: locationData.latitude?.toString() || "",  // Change this
          lng: locationData.longitude?.toString() || ""  // Change this
        },
        propertyDetails: {
          bedrooms: locationData.propertyDetails?.bedrooms || 0,
          kitchens: locationData.propertyDetails?.kitchens || 0,
          swimmingPools: locationData.propertyDetails?.swimmingPools || 0,
          withFood: locationData.propertyDetails?.withFood || false,
          withNightStay: locationData.propertyDetails?.withNightStay || false
        },
        pricing: {
          pricePerAdult: locationData.pricing?.pricePerAdult || 0,
          pricePerKid: locationData.pricing?.pricePerKid || 0,
          extraPersonCharge: locationData.pricing?.extraPersonCharge || 0
        },
        amenities: locationData.amenities || []
      });
    } catch (err) {
      alert("❌ Error fetching location data: " + err.response?.data?.error);
      navigate("/locations");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Maps URL paste
  const handleGoogleMapsUrlPaste = (url) => {
    setGoogleMapsUrl(url);
    
    if (!url) return;

    const coordinates = extractCoordinatesFromUrl(url);
    
    if (coordinates) {
      setForm(prev => ({
        ...prev,
        coordinates: {
          lat: coordinates.lat.toString(),
          lng: coordinates.lng.toString()
        }
      }));
      
      alert(`✅ Coordinates extracted successfully!\nLatitude: ${coordinates.lat}\nLongitude: ${coordinates.lng}`);
    } else {
      alert("❌ Could not extract coordinates from this URL. Please make sure it's a valid Google Maps link with location data.");
    }
  };

  // Address search with debouncing
  const handleAddressSearchWithDebounce = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    const results = await handleAddressSearch(query);
    setSuggestions(results);
    setShowSuggestions(true);
    setIsSearching(false);
  };

  // Select suggestion and auto-fill form
  const handleSelectSuggestion = (suggestion) => {
    const formData = parseSuggestionToFormData(suggestion, form);
    setForm(prev => ({ ...prev, ...formData }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Custom handleNestedChange for this component
  const customHandleNestedChange = (section, key, value) => {
    handleNestedChange(form, setForm, section, key, value);
  };

  // Custom handleBlur for this component
  const customHandleBlur = (fieldName) => {
    handleBlur(fieldName, setTouched, touched, form, validateField, setErrors);
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step validation
  const validateStep = (step) => {
    const stepErrors = {};
    
    switch (step) {
      case 1:
        if (!form.name.trim()) stepErrors.name = "Resort name is required";
        if (!form.description.trim()) stepErrors.description = "Description is required";
        if (!form.capacityOfPersons || form.capacityOfPersons < 1) stepErrors.capacityOfPersons = "Valid capacity is required";
        break;
      
      case 2:
        if (!form.address.line1.trim()) stepErrors["address.line1"] = "Address line 1 is required";
        if (!form.address.city.trim()) stepErrors["address.city"] = "City is required";
        if (!form.address.state.trim()) stepErrors["address.state"] = "State is required";
        if (!form.address.pincode || !/^\d{6}$/.test(form.address.pincode)) stepErrors["address.pincode"] = "Valid 6-digit pincode is required";
        if (!form.coordinates.lat) stepErrors["coordinates.lat"] = "Latitude is required";
        if (!form.coordinates.lng) stepErrors["coordinates.lng"] = "Longitude is required";
        break;
      
      case 3:
        // Property features are optional, no validation needed
        break;
      
      case 4:
        // Pricing and amenities are optional, no validation needed
        break;
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleStepNext = () => {
    if (validateStep(currentStep)) {
      nextStep();
    } else {
      alert("❌ Please fix the errors before proceeding to the next step.");
    }
  };

  // Submit function - handles both create and update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allTouched = {};
    Object.keys(form).forEach(key => {
      if (typeof form[key] === "object" && form[key] !== null) {
        Object.keys(form[key]).forEach(subKey => {
          allTouched[`${key}.${subKey}`] = true;
        });
      } else {
        allTouched[key] = true;
      }
    });
    setTouched(allTouched);
    
    const { isValid, errors: formErrors } = validateForm(form);
    setErrors(formErrors);
    
    if (!isValid) {
      alert("❌ Please fix the errors before submitting");
      return;
    }
    
    try {
      const dataToSend = prepareSubmitData(form);
      
      if (isEditMode) {
        // Update existing location
        const res = await axios.put(`${API_BASE_URL}/locations/${id}`, dataToSend);
        alert("✅ Resort updated successfully!");
        console.log(res.data);
        navigate("/locations"); // Redirect to locations list after update
      } else {
        // Create new location
        const res = await axios.post(`${API_BASE_URL}/locations`, dataToSend);
        alert("✅ Resort created successfully!");
        console.log(res.data);
        // Reset form after successful submission
        setForm(initialFormState);
        setGoogleMapsUrl("");
        setCurrentStep(1);
      }
    } catch (err) {
      alert("❌ Error: " + err.response?.data?.error);
    }
  };

  // Helper to get error message
  const getError = (fieldName) => {
    return errors[fieldName];
  };

  // Progress bar calculation
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Step components (same as before, but now with pre-filled data when editing)
  const Step1BasicInfo = () => (
    <div className="space-y-6">
      <div className="transform transition-all duration-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Resort Name *
        </label>
        <input
          type="text"
          placeholder="e.g., Serenity Beach Resort"
          className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 bg-white ${
            getError("name") ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
          }`}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onBlur={() => customHandleBlur("name")}
          required
        />
        {getError("name") && (
          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
            <span>⚠</span> {getError("name")}
          </p>
        )}
      </div>

      <div className="transform transition-all duration-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Description *
        </label>
        <textarea
          placeholder="Describe your resort's features, ambiance, and special offerings..."
          className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 bg-white resize-none ${
            getError("description") ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
          }`}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          onBlur={() => customHandleBlur("description")}
          rows={4}
        />
        {getError("description") && (
          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
            <span>⚠</span> {getError("description")}
          </p>
        )}
      </div>

      <div className="transform transition-all duration-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Total Guest Capacity *
        </label>
        <input
          type="number"
          placeholder="Maximum number of guests"
          min="1"
          max="1000"
          className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 bg-white ${
            getError("capacityOfPersons") ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
          }`}
          value={form.capacityOfPersons}
          onChange={(e) => setForm({ ...form, capacityOfPersons: e.target.value })}
          onBlur={() => customHandleBlur("capacityOfPersons")}
          required
        />
        {getError("capacityOfPersons") && (
          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
            <span>⚠</span> {getError("capacityOfPersons")}
          </p>
        )}
      </div>
    </div>
  );

  const Step2LocationAddress = () => (
    <div className="space-y-6">
      {/* Google Maps URL Section */}
      <div className="transform transition-all duration-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Quick Method: Paste Google Maps Link
        </label>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-sm">🔗</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 mb-1">Paste Google Maps URL</p>
              <p className="text-xs text-blue-700">
                Go to your resort location on Google Maps → Copy the URL from address bar → Paste below
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Paste Google Maps URL here (e.g., https://maps.google.com/...)"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 bg-white"
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            onPaste={(e) => {
              const pastedUrl = e.clipboardData.getData('text');
              setTimeout(() => {
                handleGoogleMapsUrlPaste(pastedUrl);
              }, 100);
            }}
          />
          
          <button
            type="button"
            onClick={() => handleGoogleMapsUrlPaste(googleMapsUrl)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Extract Coordinates from URL
          </button>
        </div>
      </div>

      {/* OR Separator */}
      <div className="relative flex items-center py-2">
        <div className="grow border-t border-gray-300"></div>
        <span className="shrink mx-4 text-sm text-gray-500 font-medium">OR</span>
        <div className="grow border-t border-gray-300"></div>
      </div>

      {/* Address Search Section */}
      <div className="transform transition-all duration-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Find Location by Address
        </label>

        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Type resort name, address, or area to find coordinates..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 bg-white"
              onChange={(e) => handleAddressSearchWithDebounce(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
            />
            
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <div className="font-medium text-sm text-gray-800 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">📍</span>
                      {suggestion.display_name.split(',').slice(0, 3).join(',')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 ml-6">
                      {suggestion.display_name.split(',').slice(3).join(',')}
                    </div>
                    <div className="text-xs text-blue-600 mt-1 ml-6 font-mono">
                      {suggestion.lat}, {suggestion.lon}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coordinates Display */}
      {form.coordinates.lat && form.coordinates.lng && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">✅ Location Coordinates Set</p>
                <p className="text-xs text-green-700 font-mono">
                  Lat: <strong>{form.coordinates.lat}</strong>, Lng: <strong>{form.coordinates.lng}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm(prev => ({
                  ...prev,
                  coordinates: { lat: "", lng: "" }
                }));
                setGoogleMapsUrl("");
              }}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Manual Coordinates Input */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-gray-600 text-sm">✏️</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 mb-1">Manual Coordinates</p>
            <p className="text-xs text-gray-600">
              Enter coordinates manually if needed
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Latitude *</label>
            <input
              type="text"
              placeholder="28.6139"
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                getError("coordinates.lat") ? "border-red-500" : "border-gray-300"
              }`}
              value={form.coordinates.lat}
              onChange={(e) => customHandleNestedChange("coordinates", "lat", e.target.value)}
              onBlur={() => customHandleBlur("coordinates.lat")}
            />
            {getError("coordinates.lat") && (
              <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                <span>⚠</span> {getError("coordinates.lat")}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Longitude *</label>
            <input
              type="text"
              placeholder="77.2090"
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                getError("coordinates.lng") ? "border-red-500" : "border-gray-300"
              }`}
              value={form.coordinates.lng}
              onChange={(e) => customHandleNestedChange("coordinates", "lng", e.target.value)}
              onBlur={() => customHandleBlur("coordinates.lng")}
            />
            {getError("coordinates.lng") && (
              <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                <span>⚠</span> {getError("coordinates.lng")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Address Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Address Details</h3>
        {addressFields.map((field) => (
          <div key={field.key} className="transform transition-all duration-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {field.label} {field.required && "*"}
            </label>
            <input
              placeholder={field.placeholder}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 bg-white ${
                getError(`address.${field.key}`) ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
              }`}
              value={form.address[field.key]}
              onChange={(e) => customHandleNestedChange("address", field.key, e.target.value)}
              onBlur={() => customHandleBlur(`address.${field.key}`)}
              required={field.required}
            />
            {getError(`address.${field.key}`) && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <span>⚠</span> {getError(`address.${field.key}`)}
              </p>
            )}
          </div>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["city", "state"].map((field) => (
            <div key={field} className="transform transition-all duration-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                {field} *
              </label>
              <input
                placeholder={field === "city" ? "City name" : "State"}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 bg-white ${
                  getError(`address.${field}`) ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                }`}
                value={form.address[field]}
                onChange={(e) => customHandleNestedChange("address", field, e.target.value)}
                onBlur={() => customHandleBlur(`address.${field}`)}
                required
              />
              {getError(`address.${field}`) && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <span>⚠</span> {getError(`address.${field}`)}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="transform transition-all duration-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Postal Code *
          </label>
          <input
            placeholder="6-digit Pincode"
            maxLength="6"
            className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 bg-white ${
              getError("address.pincode") ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
            }`}
            value={form.address.pincode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              customHandleNestedChange("address", "pincode", value);
            }}
            onBlur={() => customHandleBlur("address.pincode")}
            required
          />
          {getError("address.pincode") && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <span>⚠</span> {getError("address.pincode")}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const Step3PropertyFeatures = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(form.propertyDetails).map((key) =>
          key === "withFood" || key === "withNightStay" ? (
            <div key={key} className="flex items-center gap-3 p-4 rounded-lg border border-gray-300 bg-white col-span-1 md:col-span-2 transform transition-all duration-200 hover:border-blue-300">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.propertyDetails[key]}
                  onChange={(e) =>
                    customHandleNestedChange("propertyDetails", key, e.target.checked)
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
              </div>
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {key === "withFood" ? "Includes Food & Dining Service" : "Includes Night Stay"}
              </label>
            </div>
          ) : (
            <div key={key} className="transform transition-all duration-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                type="number"
                min="0"
                max="50"
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 bg-white"
                value={form.propertyDetails[key]}
                onChange={(e) =>
                  customHandleNestedChange(
                    "propertyDetails",
                    key,
                    Number(e.target.value)
                  )
                }
                onBlur={() => customHandleBlur(`propertyDetails.${key}`)}
              />
              {getError(key) && (
                <p className="text-red-500 text-sm mt-2">{getError(key)}</p>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );

  const Step4PricingAmenities = () => (
    <div className="space-y-8">
      {/* Pricing Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(form.pricing).map(([key, value]) => (
            <div key={key} className="transform transition-all duration-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-600 font-semibold">₹</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="50"
                  placeholder="0"
                  className={`w-full border rounded-lg pl-11 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 bg-white ${
                    getError(key) ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
                  }`}
                  value={value}
                  onChange={(e) =>
                    customHandleNestedChange("pricing", key, Number(e.target.value))
                  }
                  onBlur={() => customHandleBlur(key)}
                />
              </div>
              {getError(key) && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <span>⚠</span> {getError(key)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Amenities Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resort Amenities</h3>
        <div className="transform transition-all duration-200">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Select Available Amenities
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {amenitiesOptions.map((amenity) => (
              <div
                key={amenity}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  form.amenities.includes(amenity)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
                onClick={() => {
                  setForm(prev => ({
                    ...prev,
                    amenities: prev.amenities.includes(amenity)
                      ? prev.amenities.filter(a => a !== amenity)
                      : [...prev.amenities, amenity]
                  }));
                }}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                  form.amenities.includes(amenity)
                    ? "bg-blue-500 border-blue-500"
                    : "bg-white border-gray-300"
                }`}>
                  {form.amenities.includes(amenity) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const Step5ReviewSubmit = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-blue-800">
            {isEditMode ? "Ready to Update Resort" : "Ready to Create Resort"}
          </h3>
        </div>
        <p className="text-sm text-blue-700">
          {isEditMode 
            ? "Please review all the information. Once submitted, your resort will be updated with the new details."
            : "Please review all the information you've entered. Once submitted, your resort will be created and available for bookings."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
          <div>
            <p className="text-sm text-gray-600">Resort Name</p>
            <p className="font-medium">{form.name || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Description</p>
            <p className="font-medium">{form.description || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Guest Capacity</p>
            <p className="font-medium">{form.capacityOfPersons || "Not provided"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">Location Details</h4>
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-medium">
              {form.address.line1 && `${form.address.line1}, ${form.address.city}, ${form.address.state} - ${form.address.pincode}` || "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Coordinates</p>
            <p className="font-medium">
              {form.coordinates.lat && form.coordinates.lng 
                ? `Lat: ${form.coordinates.lat}, Lng: ${form.coordinates.lng}`
                : "Not provided"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">Property Features</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {Object.entries(form.propertyDetails).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                <span className="font-medium">
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '0'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">Pricing & Amenities</h4>
          <div className="space-y-2 text-sm">
            {Object.entries(form.pricing).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                <span className="font-medium">₹{value}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Amenities ({form.amenities.length})</p>
            <div className="flex flex-wrap gap-1">
              {form.amenities.map(amenity => (
                <span key={amenity} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {amenity}
                </span>
              ))}
              {form.amenities.length === 0 && (
                <span className="text-gray-500 text-sm">No amenities selected</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo />;
      case 2:
        return <Step2LocationAddress />;
      case 3:
        return <Step3PropertyFeatures />;
      case 4:
        return <Step4PricingAmenities />;
      case 5:
        return <Step5ReviewSubmit />;
      default:
        return <Step1BasicInfo />;
    }
  };

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading resort data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-left mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-l-4 border-blue-500 pl-6 py-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {isEditMode ? "Update Resort" : "Create New Resort"}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {isEditMode ? "Update your property details" : "Add your property details to start receiving bookings"} - Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {totalSteps}: {stepTitles[currentStep]}
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
                <div
                  key={step}
                  className={`flex flex-col items-center ${
                    step === currentStep ? 'text-blue-600' : 
                    step < currentStep ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                      step === currentStep
                        ? 'bg-blue-600 text-white border-blue-600'
                        : step < currentStep
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-400 border-gray-300'
                    }`}
                  >
                    {step}
                  </div>
                  <span className="text-xs mt-2 font-medium text-center hidden sm:block">
                    {stepTitles[step]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 sm:p-8 border border-gray-200">
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 mt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 sm:px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 order-2 sm:order-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleStepNext}
                  className="px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  Next
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 sm:px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 order-1 sm:order-2"
                  disabled={Object.keys(errors).length > 0}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEditMode ? "Update Resort Listing" : "Create Resort Listing"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddLocation;