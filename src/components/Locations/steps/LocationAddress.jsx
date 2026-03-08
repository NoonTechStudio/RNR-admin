// components/steps/LocationAddress.jsx
import React from 'react';
import { toast } from 'react-hot-toast';

const LocationAddress = ({ formData, setFormData }) => {
  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleCoordinatesChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [field]: value
      }
    }));
  };

  const extractCoordinatesFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      
      // Format 1: https://www.google.com/maps/@lat,lng,z
      if (urlObj.pathname.startsWith('/maps/@')) {
        const parts = urlObj.pathname.split('/@')[1].split(',');
        if (parts.length >= 2) {
          return {
            lat: parseFloat(parts[0]),
            lng: parseFloat(parts[1])
          };
        }
      }
      
      // Format 2: https://www.google.com/maps/place/.../@lat,lng,z
      const placeMatch = url.match(/@([-\d.]+),([-\d.]+)/);
      if (placeMatch) {
        return {
          lat: parseFloat(placeMatch[1]),
          lng: parseFloat(placeMatch[2])
        };
      }
      
      // Format 3: https://www.google.com/maps?q=lat,lng
      const queryMatch = url.match(/[?&]q=([-\d.]+),([-\d.]+)/);
      if (queryMatch) {
        return {
          lat: parseFloat(queryMatch[1]),
          lng: parseFloat(queryMatch[2])
        };
      }
      
      throw new Error('Could not extract coordinates from URL');
    } catch (error) {
      throw new Error('Invalid Google Maps URL format');
    }
  };

  const handleMapUrlPaste = async (url) => {
    if (!url.trim()) return;
    
    try {
      const coords = extractCoordinatesFromUrl(url);
      handleCoordinatesChange('lat', coords.lat);
      handleCoordinatesChange('lng', coords.lng);
      toast.success('Coordinates extracted successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">
        Location & Address
      </h2>
      
      <div className="space-y-6">
        {/* Google Maps URL Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-800 font-medium">Quick Coordinates Setup</span>
          </div>
          <p className="text-blue-700 text-sm mb-3">
            Paste a Google Maps URL to automatically extract coordinates
          </p>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Maps URL
          </label>
          <input
            type="url"
            placeholder="Paste Google Maps URL here"
            onBlur={(e) => handleMapUrlPaste(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-gray-500 text-xs mt-1">
            Go to the location in Google Maps, copy the URL from address bar and paste here
          </p>
        </div>

        {/* Coordinates Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={formData.coordinates.lat || ''}
              onChange={(e) => handleCoordinatesChange('lat', e.target.value)}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="text-gray-500 text-xs mt-1">Auto-filled from Google Maps URL</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={formData.coordinates.lng || ''}
              onChange={(e) => handleCoordinatesChange('lng', e.target.value)}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="text-gray-500 text-xs mt-1">Auto-filled from Google Maps URL</p>
          </div>
        </div>

        {/* Address Details */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Address Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1 *
              </label>
              <input
                type="text"
                value={formData.address.line1}
                onChange={(e) => handleAddressChange('line1', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.address.line2}
                onChange={(e) => handleAddressChange('line2', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode *
              </label>
              <input
                type="text"
                value={formData.address.pincode}
                onChange={(e) => handleAddressChange('pincode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LocationAddress);