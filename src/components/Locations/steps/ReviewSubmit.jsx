// components/steps/ReviewSubmit.jsx
import React from 'react';

const ReviewSubmit = ({ formData, poolPartyConfig }) => {
  const renderAddress = () => {
    const { address } = formData;
    return [
      address.line1,
      address.line2,
      `${address.city}, ${address.state} - ${address.pincode}`
    ].filter(Boolean).join(', ');
  };

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not set';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">
        Review & Submit
      </h2>
      
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Location Name</p>
              <p className="font-medium text-gray-900">{formData.name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="font-medium text-gray-900">{formData.capacityOfPersons || 'Not set'} persons</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium text-gray-900">
                {formData.description || 'No description provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pool Party Available</p>
              <div className="flex items-center">
                {formData.isPoolPartyAvailable ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Disabled
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Location & Address */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Location & Address</h3>
          </div>
          
          <div className="space-y-2">
            <p className="font-medium text-gray-900">{renderAddress()}</p>
            {formData.coordinates.lat && formData.coordinates.lng && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Coordinates: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
              </div>
            )}
          </div>
        </div>

        {/* Property Features */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Property Features</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(formData.propertyDetails).map(([key, value]) => {
              if (typeof value === 'boolean') {
                return value ? (
                  <div key={key} className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <p className="text-green-800 text-sm font-medium">{formatFieldName(key)}</p>
                    </div>
                  </div>
                ) : null;
              }
              return value ? (
                <div key={key} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">{formatFieldName(key)}</p>
                  <p className="text-blue-800 font-semibold">{value}</p>
                </div>
              ) : null;
            }).filter(Boolean)}
          </div>
        </div>

        {/* Pricing & Amenities */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Pricing & Amenities</h3>
          </div>
          
          <div className="space-y-6">
            {/* Pricing */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pricing Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {formData.pricing.pricePerPersonNight && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600">Price Per Person Night</p>
                    <p className="text-xl font-semibold text-blue-700">₹{formData.pricing.pricePerPersonNight}</p>
                  </div>
                )}

{formData.pricing.pricePerAdultDay && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600">Price Per Adult Day</p>
                    <p className="text-xl font-semibold text-blue-700">₹{formData.pricing.pricePerAdultDay}</p>
                  </div>
                )}

{formData.pricing.pricePerKidDay && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600">Price Per Kid Day</p>
                    <p className="text-xl font-semibold text-blue-700">₹{formData.pricing.pricePerKidDay}</p>
                  </div>
                )}

{formData.pricing.package1Adult&& (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600">Food Package 1 Adult</p>
                    <p className="text-xl font-semibold text-blue-700">₹{formData.pricing.package1Adult}</p>
                  </div>
                )}
                {formData.pricing.package1Kid&& (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600">Food Package 1 Kid</p>
                    <p className="text-xl font-semibold text-blue-700">₹{formData.pricing.package1Kid}</p>
                  </div>
                )}
                {formData.pricing.package2Adult&& (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600">Food Package 2 Adult</p>
                    <p className="text-xl font-semibold text-blue-700">₹{formData.pricing.package2Adult}</p>
                  </div>
                )}
                {formData.pricing.package2Kid&& (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600">Food Package 2 Kid</p>
                    <p className="text-xl font-semibold text-blue-700">₹{formData.pricing.package2Kid}</p>
                  </div>
                )}
                
                {formData.pricing.extraPersonCharge && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-600">Extra Person Charge</p>
                    <p className="text-xl font-semibold text-purple-700">₹{formData.pricing.extraPersonCharge}</p>
                  </div>
                )}
              </div>
              {formData.pricing?.foodPackages && formData.pricing.foodPackages.length > 0 && (
  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-blue-800 mb-3">
      Food Packages ({formData.pricing.foodPackages.filter(pkg => pkg.isActive !== false).length} active)
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {formData.pricing.foodPackages.map((pkg, index) => (
        <div key={index} className={`bg-white border rounded-lg p-3 ${pkg.isActive === false ? 'opacity-60' : ''}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-medium text-gray-800">{pkg.name}</p>
              {pkg.description && (
                <p className="text-xs text-gray-600 mt-1">{pkg.description}</p>
              )}
            </div>
            {pkg.isActive === false && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Inactive</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Adult:</span>
              <span className="ml-2 font-semibold text-green-600">₹{pkg.pricePerAdult}</span>
            </div>
            <div>
              <span className="text-gray-600">Kid:</span>
              <span className="ml-2 font-semibold text-green-600">₹{pkg.pricePerKid}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
            </div>

            {/* Amenities */}
            {formData.amenities && formData.amenities.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Amenities ({formData.amenities.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pool Party Details - Only show if enabled */}
        {formData.isPoolPartyAvailable && poolPartyConfig && poolPartyConfig.poolPartyType !== 'none' && (
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cyan-900">Pool Party Configuration</h3>
                <p className="text-sm text-cyan-600 capitalize">{poolPartyConfig.poolPartyType} Pool Party</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Pool Party Type Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-cyan-200 rounded-lg p-4">
                  <p className="text-sm text-cyan-600 font-medium">Pool Party Type</p>
                  <p className="text-xl font-bold text-cyan-700 capitalize">{poolPartyConfig.poolPartyType}</p>
                  <p className="text-xs text-cyan-500 mt-1">
                    {poolPartyConfig.poolPartyType === 'shared' 
                      ? 'Shared with other locations' 
                      : 'Exclusive to this location'}
                  </p>
                </div>
                
                <div className="bg-white border border-cyan-200 rounded-lg p-4">
                  <p className="text-sm text-cyan-600 font-medium">Status</p>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Configured
                    </span>
                  </div>
                  <p className="text-xs text-cyan-500 mt-1">Pool party configuration is complete</p>
                </div>
              </div>

              {/* Shared Pool Party Details */}
              {poolPartyConfig.poolPartyType === 'shared' && (
                <>
                  {poolPartyConfig.sharedPoolPartyId && (
                    <div className="bg-white border border-cyan-200 rounded-lg p-4">
                      <p className="text-sm text-cyan-600 font-medium mb-2">Selected Shared Pool Party</p>
                      <p className="text-lg font-semibold text-cyan-700">Pool Party ID: {poolPartyConfig.sharedPoolPartyId}</p>
                      <p className="text-xs text-cyan-500 mt-1">Using existing shared pool party</p>
                    </div>
                  )}

                  {poolPartyConfig.createNewSharedPool && poolPartyConfig.newSharedPoolData && (
                    <>
                      <div className="bg-white border border-cyan-200 rounded-lg p-4">
                        <p className="text-sm text-cyan-600 font-medium mb-2">New Shared Pool Party</p>
                        <p className="text-lg font-semibold text-cyan-700">{poolPartyConfig.newSharedPoolData.name || 'Not set'}</p>
                        {poolPartyConfig.newSharedPoolData.description && (
                          <p className="text-sm text-cyan-600 mt-1">{poolPartyConfig.newSharedPoolData.description}</p>
                        )}
                      </div>

                      {/* Pool Party Timings */}
                      {poolPartyConfig.newSharedPoolData.timings && poolPartyConfig.newSharedPoolData.timings.length > 0 && (
                        <div>
                          <h4 className="font-medium text-cyan-900 mb-3">Session Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {poolPartyConfig.newSharedPoolData.timings.map((timing, index) => (
                              <div key={index} className="bg-white border border-cyan-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-cyan-600 capitalize">{timing.session}</p>
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center text-xs text-cyan-500">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    {formatTime(timing.startTime)} - {formatTime(timing.endTime)}
                                  </div>
                                  <div className="flex items-center text-xs text-cyan-500">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    Capacity: {timing.capacity || '0'} persons
                                  </div>
                                  <div className="flex items-center text-xs text-cyan-500">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                    </svg>
                                    Adult: ₹{timing.pricing?.perAdult || '0'} | Kid: ₹{timing.pricing?.perKid || '0'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Private Pool Party Details */}
              {poolPartyConfig.poolPartyType === 'private' && (
                <div className="bg-white border border-cyan-200 rounded-lg p-4">
                  <p className="text-sm text-cyan-600 font-medium mb-2">Private Pool Party</p>
                  <p className="text-lg font-semibold text-cyan-700">
                    {poolPartyConfig.createNewPrivatePool ? 'Will be created' : 'Not enabled'}
                  </p>
                  <p className="text-xs text-cyan-500 mt-1">
                    A private pool party will be created exclusively for this location. 
                    You can configure details after location creation.
                  </p>
                </div>
              )}
            </div>
            {poolPartyConfig.newSharedPoolData?.selectedFoodPackages && 
  poolPartyConfig.newSharedPoolData.selectedFoodPackages.length > 0 && (
  <div className="bg-white border border-cyan-200 rounded-lg p-4 mt-4">
    <p className="text-sm text-cyan-600 font-medium mb-2">Selected Food Packages</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {poolPartyConfig.newSharedPoolData.selectedFoodPackages.map((pkg, index) => (
        <div key={index} className="bg-cyan-50 border border-cyan-100 rounded p-2">
          <p className="text-sm font-medium text-cyan-700">{pkg.name}</p>
          <p className="text-xs text-cyan-600">
            Adult: ₹{pkg.pricePerAdult} | Kid: ₹{pkg.pricePerKid}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
          </div>
        )}
      </div>

      {/* Final Check */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Ready to Submit</h3>
            <p className="text-green-700 mb-3">
              Please review all the information above carefully. Once submitted, the location will be 
              {formData.isPoolPartyAvailable ? ' available for both regular and pool party bookings.' : ' available for regular bookings.'}
            </p>
            <div className="space-y-2 text-sm text-green-600">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                All basic information is complete
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Location details are properly configured
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {formData.isPoolPartyAvailable ? 'Pool party configuration is complete' : 'No pool party configuration needed'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ReviewSubmit);