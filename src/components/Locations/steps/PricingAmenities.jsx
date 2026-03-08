// components/steps/PricingAmenities.jsx
import React, { useState } from 'react';

const amenitiesOptions = [
  'yoga health center', 'Horseriding', 'Poolparty', 'Rain Shower', 'Swimming Pool', 'Treehouse', 'minizoo',
  'Indoor Game', 'Outdoor Game', 'Music', 'Banquet Hall', 'Garden Area', 'WiFi', 'Parking', 'Air Conditioning', 'Gym',
  'Restaurant', 'Spa', 'Bar', 'Room Service', 'Conference Room', 'Business Center', 'Laundry Service', 'Childcare',
  'Pet Friendly', 'Beach Access', 'Mountain View', 'Lake View', 'Hot Tub', 'Sauna', 'Tennis Court', 'Basketball Court',
  'Golf Course', 'Bicycle Rental', 'Car Rental', 'Airport Shuttle', 'Concierge', '24-Hour Front Desk', 'Security'
];

const PricingAmenities = ({ formData, setFormData }) => {
  const [amenityInput, setAmenityInput] = useState('');

  const handlePricingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value
      }
    }));
  };

  const handleAddAmenity = (amenity) => {
    if (amenity && !formData.amenities.includes(amenity)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenity]
      }));
    }
    setAmenityInput('');
  };

  const handleRemoveAmenity = (amenityToRemove) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(amenity => amenity !== amenityToRemove)
    }));
  };

  const filteredAmenities = amenitiesOptions.filter(amenity =>
    amenity.toLowerCase().includes(amenityInput.toLowerCase()) &&
    !formData.amenities.includes(amenity)
  );

  // Group amenities for better organization in quick add
  const quickAddAmenities = [
    // Basic Amenities
    ['Parking','Swimming Pool'],
    // Leisure & Recreation
    ['yoga health center', 'Horseriding', 'Poolparty', 'Treehouse', 'minizoo'],
    // Sports & Games
    ['Indoor Game', 'Outdoor Game'],
    // Facilities
    ['Banquet Hall', 'Garden Area'],
    // Services
    ['Rain Shower', 'Music']
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">
        Pricing & Amenities
      </h2>
      
      <div className="space-y-8">
        {/* Pricing Section */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Pricing Details</h3>

          {/* New Pricing Structure */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Per Person (Per Night)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  type="number"
                  value={formData.pricing.pricePerPersonNight || ''}
                  onChange={(e) => handlePricingChange('pricePerPersonNight', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 1500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used for night stay bookings (per person per night).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Per Adult (Per Day)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  type="number"
                  value={formData.pricing.pricePerAdultDay || ''}
                  onChange={(e) => handlePricingChange('pricePerAdultDay', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 1200"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used for day bookings when night stay is disabled.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Per Kid (Per Day)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  type="number"
                  value={formData.pricing.pricePerKidDay || ''}
                  onChange={(e) => handlePricingChange('pricePerKidDay', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 800"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Kid pricing for day bookings.
              </p>
            </div>
          </div>

          {/* Legacy / fallback pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extra Person Charge
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  type="number"
                  value={formData.pricing.extraPersonCharge || ''}
                  onChange={(e) => handlePricingChange('extraPersonCharge', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Charge per extra guest"
                />
              </div>
          </div>
          </div>

          {/* Food Packages */}
{/* Food Packages - Dynamic */}
<div className="mt-6 border-t border-gray-200 pt-4">
  <div className="flex justify-between items-center mb-4">
    <h4 className="text-sm font-semibold text-gray-800">
      Food Packages (for location bookings)
    </h4>
    <button
      type="button"
      onClick={() => {
        const newPackages = [...(formData.pricing.foodPackages || [])];
        newPackages.push({
          name: `Food Package ${newPackages.length + 1}`,
          description: '',
          pricePerAdult: '',
          pricePerKid: '',
          isActive: true
        });
        setFormData(prev => ({
          ...prev,
          pricing: {
            ...prev.pricing,
            foodPackages: newPackages
          }
        }));
      }}
      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add Food Package
    </button>
  </div>
  
  <p className="text-xs text-gray-500 mb-4">
    These packages are used when guests choose "with food" during location booking.
  </p>
  
  <div className="space-y-4">
    {(formData.pricing.foodPackages || []).map((foodPackage, index) => (
      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-3">
          <h5 className="text-sm font-medium text-gray-800">
            Package {index + 1}: {foodPackage.name || 'Unnamed Package'}
          </h5>
          <button
            type="button"
            onClick={() => {
              const newPackages = [...(formData.pricing.foodPackages || [])];
              newPackages.splice(index, 1);
              setFormData(prev => ({
                ...prev,
                pricing: {
                  ...prev.pricing,
                  foodPackages: newPackages
                }
              }));
            }}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Remove
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Package Name *
            </label>
            <input
              type="text"
              value={foodPackage.name}
              onChange={(e) => {
                const newPackages = [...(formData.pricing.foodPackages || [])];
                newPackages[index].name = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  pricing: {
                    ...prev.pricing,
                    foodPackages: newPackages
                  }
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Breakfast, Lunch, Dinner"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={foodPackage.description || ''}
              onChange={(e) => {
                const newPackages = [...(formData.pricing.foodPackages || [])];
                newPackages[index].description = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  pricing: {
                    ...prev.pricing,
                    foodPackages: newPackages
                  }
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Includes continental breakfast"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Price Per Adult *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
              <input
                type="number"
                value={foodPackage.pricePerAdult || ''}
                onChange={(e) => {
                  const newPackages = [...(formData.pricing.foodPackages || [])];
                  newPackages[index].pricePerAdult = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    pricing: {
                      ...prev.pricing,
                      foodPackages: newPackages
                    }
                  }));
                }}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Price Per Kid *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
              <input
                type="number"
                value={foodPackage.pricePerKid || ''}
                onChange={(e) => {
                  const newPackages = [...(formData.pricing.foodPackages || [])];
                  newPackages[index].pricePerKid = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    pricing: {
                      ...prev.pricing,
                      foodPackages: newPackages
                    }
                  }));
                }}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center">
          <input
            type="checkbox"
            checked={foodPackage.isActive !== false}
            onChange={(e) => {
              const newPackages = [...(formData.pricing.foodPackages || [])];
              newPackages[index].isActive = e.target.checked;
              setFormData(prev => ({
                ...prev,
                pricing: {
                  ...prev.pricing,
                  foodPackages: newPackages
                }
              }));
            }}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            id={`package-active-${index}`}
          />
          <label htmlFor={`package-active-${index}`} className="ml-2 text-xs text-gray-700">
            Active (available for selection)
          </label>
        </div>
      </div>
    ))}
    
    {(!formData.pricing.foodPackages || formData.pricing.foodPackages.length === 0) && (
      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500 text-sm mb-3">No food packages added yet</p>
        <p className="text-gray-400 text-xs">Add food packages that guests can select during booking</p>
      </div>
    )}
  </div>
</div>
        </div>

        {/* Amenities Section */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Amenities</h3>
          
          {/* Selected Amenities */}
          {formData.amenities.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Amenities ({formData.amenities.length})
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-12">
                {formData.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-200"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(amenity)}
                      className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Amenity Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search and Add Amenity
            </label>
            <div className="relative">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                placeholder="Type to search all amenities..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {/* Amenity Suggestions */}
              {amenityInput && filteredAmenities.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredAmenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleAddAmenity(amenity)}
                    >
                      {amenity}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Type to search from {amenitiesOptions.length} available amenities
            </p>
          </div>

          {/* Quick Add Sections */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Quick Add Amenities
            </label>
            
            {quickAddAmenities.map((amenityGroup, index) => (
              <div key={index} className="flex flex-wrap gap-2">
                {amenityGroup.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleAddAmenity(amenity)}
                    disabled={formData.amenities.includes(amenity)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      formData.amenities.includes(amenity)
                        ? 'bg-green-100 text-green-700 border border-green-300 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {amenity}
                    {formData.amenities.includes(amenity) && ' ✓'}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* All Available Amenities Count */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> You can add any of the {amenitiesOptions.length} available amenities. 
              Use the search above or quick add buttons to quickly select amenities for your property.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PricingAmenities);