// components/steps/BasicInformation.jsx
import React from 'react';

const BasicInformation = ({ formData, setFormData }) => {
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePoolPartyChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      isPoolPartyAvailable: checked
    }));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">
        Basic Information
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter location name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe the location, facilities, and unique features"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacity of Persons *
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={formData.capacityOfPersons || ''}
            onChange={(e) => handleChange('capacityOfPersons', e.target.value)}
            placeholder="Enter number of persons"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-gray-500 text-xs mt-1">
            Enter the maximum number of persons this location can accommodate
          </p>
        </div>

        {/* Pool Party Checkbox */}
        <div className="md:col-span-2">
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <label className="flex items-start space-x-3 cursor-pointer">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={formData.isPoolPartyAvailable || false}
                  onChange={(e) => handlePoolPartyChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Pool Party Available
                  </span>
                  {formData.isPoolPartyAvailable && (
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Enabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Check this if the location offers pool party facilities. 
                  This will add a dedicated step for pool party details including capacity, timings, and pricing.
                </p>
                {formData.isPoolPartyAvailable && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-700">
                      ✓ Pool party details step will be available after Pricing & Amenities
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Information Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800">About Pool Party Feature</h4>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Enabling this will add a dedicated step for pool party configuration</li>
              <li>• You can set separate capacity, timings, and pricing for pool parties</li>
              <li>• Pool party bookings will be managed separately from regular bookings</li>
              <li>• You can always disable this later if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BasicInformation);