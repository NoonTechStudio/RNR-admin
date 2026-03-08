// components/steps/PropertyFeatures.jsx
import React from 'react';

const PropertyFeatures = ({ formData, setFormData }) => {
  const handlePropertyDetailsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      propertyDetails: {
        ...prev.propertyDetails,
        [field]: value
      }
    }));
  };

  const handleBooleanChange = (field, checked) => {
    handlePropertyDetailsChange(field, checked);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">
        Property Features
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Bedrooms *
          </label>
          <input
            type="number"
            value={formData.propertyDetails.bedrooms || ''}
            onChange={(e) => handlePropertyDetailsChange('bedrooms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AC Bedrooms
          </label>
          <input
            type="number"
            value={formData.propertyDetails.acBedrooms || ''}
            onChange={(e) => handlePropertyDetailsChange('acBedrooms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Non-AC Bedrooms
          </label>
          <input
            type="number"
            value={formData.propertyDetails.nonAcBedrooms || ''}
            onChange={(e) => handlePropertyDetailsChange('nonAcBedrooms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kitchens
          </label>
          <input
            type="number"
            value={formData.propertyDetails.kitchens || ''}
            onChange={(e) => handlePropertyDetailsChange('kitchens', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Living Rooms
          </label>
          <input
            type="number"
            value={formData.propertyDetails.livingRooms || ''}
            onChange={(e) => handlePropertyDetailsChange('livingRooms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Halls
          </label>
          <input
            type="number"
            value={formData.propertyDetails.halls || ''}
            onChange={(e) => handlePropertyDetailsChange('halls', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bathrooms
          </label>
          <input
            type="number"
            value={formData.propertyDetails.bathrooms || ''}
            onChange={(e) => handlePropertyDetailsChange('bathrooms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Swimming Pools
          </label>
          <input
            type="number"
            value={formData.propertyDetails.swimmingPools || ''}
            onChange={(e) => handlePropertyDetailsChange('swimmingPools', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Private Rooms
          </label>
          <input
            type="number"
            value={formData.propertyDetails.privateRooms || ''}
            onChange={(e) => handlePropertyDetailsChange('privateRooms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Boolean Features */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-md font-medium text-gray-900 mb-4">Additional Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.propertyDetails.withFood || false}
              onChange={(e) => handleBooleanChange('withFood', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-gray-700">With Food Service</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.propertyDetails.nightStay || false}
              onChange={(e) => handleBooleanChange('nightStay', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-gray-700">Night Stay Available</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PropertyFeatures);