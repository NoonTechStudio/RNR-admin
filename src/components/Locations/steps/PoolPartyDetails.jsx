// components/Locations/steps/PoolPartyDetails.jsx
import React, { useState, useEffect } from 'react';
import { getSharedPoolParties } from '../../../services/poolPartyApi';

const defaultTimings = [
  { session: 'Morning', startTime: '08:00', endTime: '14:00' },
  { session: 'Evening', startTime: '15:00', endTime: '21:00' },
  { session: 'Full Day', startTime: '08:00', endTime: '20:00' }
];

const validatePoolPartyStep = (formData, poolPartyConfig) => {
  if (!formData.isPoolPartyAvailable) return true;
  
  const errors = [];
  
  // Validate pool party type selection
  if (!poolPartyConfig.poolPartyType || poolPartyConfig.poolPartyType === 'none') {
    return true; // No pool party is valid
  }
  
  // If shared pool party
  if (poolPartyConfig.poolPartyType === 'shared') {
    // FIX: Require either a selected existing pool OR creation of a new one
    if (!poolPartyConfig.sharedPoolPartyId && !poolPartyConfig.createNewSharedPool) {
      errors.push('Please select an existing shared pool party or create a new one');
    }
    
    // If creating new shared pool, validate timings
    if (poolPartyConfig.createNewSharedPool) {
      if (!poolPartyConfig.newSharedPoolData?.name) {
        errors.push('Pool party name is required');
      }
      if (!poolPartyConfig.newSharedPoolData?.timings || poolPartyConfig.newSharedPoolData.timings.length === 0) {
        errors.push('At least one session timing is required');
      } else {
        poolPartyConfig.newSharedPoolData.timings.forEach((timing, index) => {
          if (!timing.startTime || !timing.endTime) {
            errors.push(`Session ${timing.session || index + 1}: Start time and end time are required`);
          }
          if (timing.startTime >= timing.endTime) {
            errors.push(`Session ${timing.session || index + 1}: Start time must be before end time`);
          }
          if (!timing.capacity || parseInt(timing.capacity) <= 0) {
            errors.push(`Session ${timing.session || index + 1}: Capacity is required and must be greater than 0`);
          }
          if (!timing.pricing?.perAdult || parseFloat(timing.pricing.perAdult) <= 0) {
            errors.push(`Session ${timing.session || index + 1}: Price per adult is required`);
          }
          if (!timing.pricing?.perKid || parseFloat(timing.pricing.perKid) < 0) {
            errors.push(`Session ${timing.session || index + 1}: Price per kid is required`);
          }
        });
      }
    }
  }
  
  // If private pool party
  if (poolPartyConfig.poolPartyType === 'private' && poolPartyConfig.createNewPrivatePool) {
    if (!poolPartyConfig.newPrivatePoolData?.name) {
      errors.push('Pool party name is required');
    }
    if (!poolPartyConfig.newPrivatePoolData?.timings || poolPartyConfig.newPrivatePoolData.timings.length === 0) {
      errors.push('At least one session timing is required');
    } else {
      poolPartyConfig.newPrivatePoolData.timings.forEach((timing, index) => {
        if (!timing.startTime || !timing.endTime) {
          errors.push(`Session ${timing.session || index + 1}: Start time and end time are required`);
        }
        if (timing.startTime >= timing.endTime) {
          errors.push(`Session ${timing.session || index + 1}: Start time must be before end time`);
        }
        if (!timing.capacity || parseInt(timing.capacity) <= 0) {
          errors.push(`Session ${timing.session || index + 1}: Capacity is required and must be greater than 0`);
        }
        if (!timing.pricing?.perAdult || parseFloat(timing.pricing.perAdult) <= 0) {
          errors.push(`Session ${timing.session || index + 1}: Price per adult is required`);
        }
        if (!timing.pricing?.perKid || parseFloat(timing.pricing.perKid) < 0) {
          errors.push(`Session ${timing.session || index + 1}: Price per kid is required`);
        }
      });
    }
  }
  
  return errors.length === 0 ? true : errors;
};

const PoolPartyDetails = ({ formData, poolPartyConfig, setPoolPartyConfig, isEditing }) => {
  const [sharedPoolParties, setSharedPoolParties] = useState([]);
  const [loadingSharedPools, setLoadingSharedPools] = useState(false);
  const [useDefaultTimings, setUseDefaultTimings] = useState(true);
  const [savedDefaultTimings, setSavedDefaultTimings] = useState(null);
  const [savedCustomTimings, setSavedCustomTimings] = useState(null);
  // NEW: Store the last selected shared pool ID when in "Select Existing" mode
  const [lastSelectedSharedPoolId, setLastSelectedSharedPoolId] = useState(null);

  // Initialize pool party config
  useEffect(() => {
    if (!poolPartyConfig.poolPartyType) {
      setPoolPartyConfig(prev => ({
        ...prev,
        poolPartyType: 'none',
        sharedPoolPartyId: null,
        createNewSharedPool: false,
        createNewPrivatePool: false,
        newSharedPoolData: {
          name: '',
          description: '',
          locationName: formData.name || '',
          timings: defaultTimings.map(timing => ({
            ...timing,
            capacity: '',
            pricing: {
              perAdult: '',
              perKid: ''
            }
          }))
        }
      }));
    }
  }, []);

  // Fetch shared pool parties when needed
  useEffect(() => {
    if (poolPartyConfig.poolPartyType === 'shared' && !poolPartyConfig.createNewSharedPool) {
      fetchSharedPoolParties();
    }
  }, [poolPartyConfig.poolPartyType, poolPartyConfig.createNewSharedPool]);

  const fetchSharedPoolParties = async () => {
    try {
      setLoadingSharedPools(true);
      const response = await getSharedPoolParties();
      if (response.success) {
        setSharedPoolParties(response.poolParties || []);
      }
    } catch (error) {
      console.error('Error fetching shared pool parties:', error);
      setSharedPoolParties([]);
    } finally {
      setLoadingSharedPools(false);
    }
  };

  // Initialize timings for new shared pool
  useEffect(() => {
    if (poolPartyConfig.createNewSharedPool && poolPartyConfig.newSharedPoolData && 
        (!poolPartyConfig.newSharedPoolData.timings || poolPartyConfig.newSharedPoolData.timings.length === 0)) {
      const initialTimings = (useDefaultTimings ? defaultTimings : [{ session: 'Custom', startTime: '', endTime: '' }])
        .map(timing => ({
          ...timing,
          capacity: '',
          pricing: {
            perAdult: '',
            perKid: ''
          }
        }));
      
      setPoolPartyConfig(prev => ({
        ...prev,
        newSharedPoolData: {
          ...prev.newSharedPoolData,
          timings: initialTimings
        }
      }));
    }
  }, [useDefaultTimings, poolPartyConfig.createNewSharedPool]);

  // NEW: Initialize lastSelectedSharedPoolId when the location data loads
  useEffect(() => {
    if (poolPartyConfig.poolPartyType === 'shared' &&
        !poolPartyConfig.createNewSharedPool &&
        poolPartyConfig.sharedPoolPartyId) {
      setLastSelectedSharedPoolId(poolPartyConfig.sharedPoolPartyId);
    }
  }, [poolPartyConfig.poolPartyType, poolPartyConfig.createNewSharedPool, poolPartyConfig.sharedPoolPartyId]);

  const handlePoolPartyTypeChange = (type) => {
    setPoolPartyConfig(prev => ({
      ...prev,
      poolPartyType: type,
      // For private pools, we always want the creation checkbox enabled by default.
      // For shared or none, ensure it's false.
      createNewPrivatePool: type === 'private',
      // IMPORTANT: Do NOT reset sharedPoolPartyId, createNewSharedPool, newSharedPoolData,
      // or newPrivatePoolData. They are preserved so that when you come back to the step,
      // the form reflects your previous choices.
    }));
  };

  const handleTimingChange = (index, field, value) => {
    const updatedTimings = [...poolPartyConfig.newSharedPoolData.timings];
    
    if (field === 'session' && value === 'Custom') {
      updatedTimings[index] = {
        ...updatedTimings[index],
        session: 'Custom',
        startTime: '',
        endTime: '',
        capacity: '',
        pricing: {
          perAdult: '',
          perKid: ''
        }
      };
    } else if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'pricing') {
        updatedTimings[index] = {
          ...updatedTimings[index],
          pricing: {
            ...updatedTimings[index].pricing,
            [child]: value === '' ? '' : parseFloat(value) || 0
          }
        };
      }
    } else {
      updatedTimings[index] = {
        ...updatedTimings[index],
        [field]: field === 'capacity' ? (value === '' ? '' : parseInt(value) || 0) : value
      };
    }
    
    setPoolPartyConfig(prev => ({
      ...prev,
      newSharedPoolData: {
        ...prev.newSharedPoolData,
        timings: updatedTimings
      }
    }));
  };

  const handleSessionTypeChange = (useDefault) => {
    if (useDefault === useDefaultTimings) return;

    // Get current timings from poolPartyConfig
    const currentTimings = (poolPartyConfig.poolPartyType === 'shared' && poolPartyConfig.createNewSharedPool)
      ? poolPartyConfig.newSharedPoolData?.timings || []
      : (poolPartyConfig.poolPartyType === 'private' && poolPartyConfig.createNewPrivatePool)
        ? poolPartyConfig.newPrivatePoolData?.timings || []
        : [];

    // Save current timings to the mode we are leaving
    if (useDefaultTimings) {
      setSavedDefaultTimings(currentTimings);
    } else {
      setSavedCustomTimings(currentTimings);
    }

    // Determine new timings to load
    let newTimings;
    if (useDefault) {
      // Switching to default: use savedDefaultTimings if available, else create empty default sessions
      newTimings = savedDefaultTimings || defaultTimings.map(timing => ({
        ...timing,
        capacity: '',
        pricing: { perAdult: '', perKid: '' }
      }));
    } else {
      // Switching to custom: use savedCustomTimings if available, else create one empty custom session
      newTimings = savedCustomTimings || [{
        session: 'Custom',
        startTime: '',
        endTime: '',
        capacity: '',
        pricing: { perAdult: '', perKid: '' }
      }];
    }

    // Update poolPartyConfig with new timings
    if (poolPartyConfig.poolPartyType === 'shared' && poolPartyConfig.createNewSharedPool) {
      setPoolPartyConfig(prev => ({
        ...prev,
        newSharedPoolData: {
          ...prev.newSharedPoolData,
          timings: newTimings
        }
      }));
    } else if (poolPartyConfig.poolPartyType === 'private' && poolPartyConfig.createNewPrivatePool) {
      setPoolPartyConfig(prev => ({
        ...prev,
        newPrivatePoolData: {
          ...prev.newPrivatePoolData,
          timings: newTimings
        }
      }));
    }

    setUseDefaultTimings(useDefault);
  };

  useEffect(() => {
    // Get timings from the current poolPartyConfig
    const timings = (poolPartyConfig.poolPartyType === 'shared' && poolPartyConfig.createNewSharedPool)
      ? poolPartyConfig.newSharedPoolData?.timings
      : (poolPartyConfig.poolPartyType === 'private' && poolPartyConfig.createNewPrivatePool)
        ? poolPartyConfig.newPrivatePoolData?.timings
        : null;

    // If timings exist and saved states are still null (first load), initialize them
    if (timings && timings.length > 0 && savedDefaultTimings === null && savedCustomTimings === null) {
      setSavedDefaultTimings(timings);
      setSavedCustomTimings(timings);
    }
  }, [poolPartyConfig]); // runs when poolPartyConfig is set (e.g., after fetch)

  const addCustomSession = () => {
    const updatedTimings = [...poolPartyConfig.newSharedPoolData.timings];
    updatedTimings.push({ 
      session: 'Custom', 
      startTime: '', 
      endTime: '',
      capacity: '',
      pricing: {
        perAdult: '',
        perKid: ''
      }
    });
    
    setPoolPartyConfig(prev => ({
      ...prev,
      newSharedPoolData: {
        ...prev.newSharedPoolData,
        timings: updatedTimings
      }
    }));
  };

  const removeSession = (index) => {
    if (poolPartyConfig.newSharedPoolData.timings.length > 1) {
      const updatedTimings = [...poolPartyConfig.newSharedPoolData.timings];
      updatedTimings.splice(index, 1);
      
      setPoolPartyConfig(prev => ({
        ...prev,
        newSharedPoolData: {
          ...prev.newSharedPoolData,
          timings: updatedTimings
        }
      }));
    }
  };

  const calculateTotalCapacity = () => {
    return poolPartyConfig.newSharedPoolData?.timings?.reduce((sum, timing) => 
      sum + (parseInt(timing.capacity) || 0), 0) || 0;
  };

  const handleSharedPoolSelection = async (poolId) => {
    setPoolPartyConfig(prev => ({
      ...prev,
      sharedPoolPartyId: poolId,
      createNewSharedPool: false
    }));
    
    // Optionally, you could update the pool party here
    // to add this location to its sharedLocations array
    if (poolId && isEditing) {
      try {
        await fetch(`${API_BASE_URL}/locations/${id}/add-to-poolparty`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ poolPartyId: poolId })
        });
      } catch (error) {
        console.error('Failed to add location to pool party:', error);
      }
    }
  };

  const [selectedFoodPackages, setSelectedFoodPackages] = useState([]);
  useEffect(() => {
    const shouldShowFoodPackages = 
      (poolPartyConfig.poolPartyType === 'shared' && poolPartyConfig.createNewSharedPool) ||
      (poolPartyConfig.poolPartyType === 'private' && poolPartyConfig.createNewPrivatePool);
    
    if (shouldShowFoodPackages) {
      const foodPackages = formData.pricing?.foodPackages || [];
      
      // Get already selected packages from poolPartyConfig
      const existingSelected = 
        (poolPartyConfig.poolPartyType === 'shared' 
          ? poolPartyConfig.newSharedPoolData?.selectedFoodPackages 
          : poolPartyConfig.newPrivatePoolData?.selectedFoodPackages) || [];
      
      setSelectedFoodPackages(
        foodPackages
          .filter(pkg => pkg.isActive !== false)
          .map(pkg => ({
            foodPackageId: pkg.name, // or use a unique ID if available
            name: pkg.name,
            description: pkg.description,
            pricePerAdult: parseFloat(pkg.pricePerAdult) || 0,
            pricePerKid: parseFloat(pkg.pricePerKid) || 0,
            selected: existingSelected.some(ep => ep.foodPackageId === pkg.name) // ✅ pre‑select
          }))
      );
    }
  }, [poolPartyConfig.poolPartyType, poolPartyConfig.createNewSharedPool, poolPartyConfig.createNewPrivatePool, formData.pricing?.foodPackages]);  

  // Handle food package selection
  const handleFoodPackageToggle = (index) => {
    const updatedPackages = [...selectedFoodPackages];
    updatedPackages[index].selected = !updatedPackages[index].selected;
    setSelectedFoodPackages(updatedPackages);
    
    const selectedPackages = updatedPackages.filter(pkg => pkg.selected);
    
    // Update pool party config based on type
    if (poolPartyConfig.poolPartyType === 'shared' && poolPartyConfig.createNewSharedPool) {
      setPoolPartyConfig(prev => ({
        ...prev,
        newSharedPoolData: {
          ...prev.newSharedPoolData,
          selectedFoodPackages: selectedPackages
        }
      }));
    } else if (poolPartyConfig.poolPartyType === 'private' && poolPartyConfig.createNewPrivatePool) {
      setPoolPartyConfig(prev => ({
        ...prev,
        newPrivatePoolData: {
          ...prev.newPrivatePoolData,
          selectedFoodPackages: selectedPackages
        }
      }));
    }
  };

  if (!formData.isPoolPartyAvailable) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
          <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Pool Party Not Enabled</h3>
          <p className="text-yellow-700 mb-4">
            Pool party facility is not enabled for this location.
          </p>
          <p className="text-sm text-yellow-600">
            Go back to <strong>Basic Information</strong> step and check "Pool Party Available" to configure pool party details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-8">
        {/* Pool Party Type Selection */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Pool Party Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              poolPartyConfig.poolPartyType === 'none'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <input
                type="radio"
                name="poolPartyType"
                value="none"
                checked={poolPartyConfig.poolPartyType === 'none'}
                onChange={() => handlePoolPartyTypeChange('none')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">No Pool Party</span>
                <p className="text-xs text-gray-500">Location without pool party</p>
              </div>
            </label>

            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              poolPartyConfig.poolPartyType === 'shared'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <input
                type="radio"
                name="poolPartyType"
                value="shared"
                checked={poolPartyConfig.poolPartyType === 'shared'}
                onChange={() => handlePoolPartyTypeChange('shared')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">Shared Pool Party</span>
                <p className="text-xs text-gray-500">Share pool with other locations</p>
              </div>
            </label>

            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              poolPartyConfig.poolPartyType === 'private'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <input
                type="radio"
                name="poolPartyType"
                value="private"
                checked={poolPartyConfig.poolPartyType === 'private'}
                onChange={() => handlePoolPartyTypeChange('private')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">Private Pool Party</span>
                <p className="text-xs text-gray-500">Exclusive pool for this location</p>
              </div>
            </label>
          </div>
        </div>

        {/* Shared Pool Party Configuration */}
        {poolPartyConfig.poolPartyType === 'shared' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shared Pool Party Configuration</h3>
            
            <div className="space-y-4">
              {/* Select Existing */}
              <div>
                <label className="flex items-center mb-3">
                  <input
                    type="radio"
                    name="sharedPoolOption"
                    checked={!poolPartyConfig.createNewSharedPool}
                    onChange={() => {
                      setPoolPartyConfig(prev => ({
                        ...prev,
                        createNewSharedPool: false,
                        // Restore the last selected ID when switching back
                        sharedPoolPartyId: lastSelectedSharedPoolId !== null
                          ? lastSelectedSharedPoolId
                          : prev.sharedPoolPartyId
                      }));
                    }}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Select Existing Shared Pool Party</span>
                </label>
                
                {!poolPartyConfig.createNewSharedPool && (
                  <div className="ml-6 mt-2">
                    {loadingSharedPools ? (
                      <div className="text-sm text-gray-500">Loading shared pool parties...</div>
                    ) : (
                      <select
                        value={poolPartyConfig.sharedPoolPartyId || ''}
                        onChange={(e) => {
                          const newId = e.target.value || null;
                          // Update both the config and the stored last selected ID
                          setLastSelectedSharedPoolId(newId);
                          setPoolPartyConfig(prev => ({
                            ...prev,
                            sharedPoolPartyId: newId
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select a shared pool party</option>
                        {sharedPoolParties.map(pool => (
                          <option key={pool._id} value={pool._id}>
                            {pool.name} - {pool.locationName} ({pool.sharedLocations?.length || 0} locations)
                          </option>
                        ))}
                      </select>
                    )}
                    {sharedPoolParties.length === 0 && !loadingSharedPools && (
                      <p className="text-xs text-gray-500 mt-1">No shared pool parties available. Create a new one below.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Create New */}
              <div>
                <label className="flex items-center mb-3">
                  <input
                    type="radio"
                    name="sharedPoolOption"
                    checked={poolPartyConfig.createNewSharedPool}
                    onChange={() => {
                      // Store the current selection before clearing it
                      setLastSelectedSharedPoolId(poolPartyConfig.sharedPoolPartyId);
                      setPoolPartyConfig(prev => ({
                        ...prev,
                        createNewSharedPool: true,
                        sharedPoolPartyId: null  // Clear ID only when creating new
                      }));
                    }}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Create New Shared Pool Party</span>
                </label>
                
                {poolPartyConfig.createNewSharedPool && (
                  <div className="ml-6 mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pool Party Name *
                      </label>
                      <input
                        type="text"
                        value={poolPartyConfig.newSharedPoolData?.name || ''}
                        onChange={(e) => setPoolPartyConfig(prev => ({
                          ...prev,
                          newSharedPoolData: {
                            ...prev.newSharedPoolData,
                            name: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder={`${formData.name || 'Location'} Shared Pool`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={poolPartyConfig.newSharedPoolData?.description || ''}
                        onChange={(e) => setPoolPartyConfig(prev => ({
                          ...prev,
                          newSharedPoolData: {
                            ...prev.newSharedPoolData,
                            description: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows="3"
                        placeholder="Describe the shared pool party..."
                      />
                    </div>

                    {/* Session Configuration */}
                    <div className="mt-6">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Session Type
                        </label>
                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={() => handleSessionTypeChange(true)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              useDefaultTimings
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Use Default Sessions
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSessionTypeChange(false)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              !useDefaultTimings
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Custom Sessions
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {poolPartyConfig.newSharedPoolData?.timings?.map((timing, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium text-gray-900 capitalize">{timing.session} Session</h4>
                              {!useDefaultTimings && poolPartyConfig.newSharedPoolData.timings.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSession(index)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Start Time *
                                </label>
                                <input
                                  type="time"
                                  value={timing.startTime}
                                  onChange={(e) => handleTimingChange(index, 'startTime', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  End Time *
                                </label>
                                <input
                                  type="time"
                                  value={timing.endTime}
                                  onChange={(e) => handleTimingChange(index, 'endTime', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  required
                                />
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Session Capacity *
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={timing.capacity || ''}
                                onChange={(e) => handleTimingChange(index, 'capacity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Maximum persons for this session"
                                required
                              />
                            </div>
                            
                            <div className="bg-blue-50 p-3 rounded-md">
                              <label className="block text-sm font-medium text-blue-800 mb-2">
                                Session Pricing *
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price Per Adult *
                                  </label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <span className="text-gray-500">₹</span>
                                    </div>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={timing.pricing?.perAdult || ''}
                                      onChange={(e) => handleTimingChange(index, 'pricing.perAdult', e.target.value)}
                                      className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md"
                                      placeholder="0.00"
                                      required
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price Per Kid *
                                  </label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <span className="text-gray-500">₹</span>
                                    </div>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={timing.pricing?.perKid || ''}
                                      onChange={(e) => handleTimingChange(index, 'pricing.perKid', e.target.value)}
                                      className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md"
                                      placeholder="0.00"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {!useDefaultTimings && poolPartyConfig.newSharedPoolData.timings.length < 3 && (
                        <button
                          type="button"
                          onClick={addCustomSession}
                          className="mt-4 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          + Add Session
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Food Package Selection for Shared Pool Party */}
            {poolPartyConfig.poolPartyType === 'shared' && poolPartyConfig.createNewSharedPool && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Food Packages for Pool Party
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select which food packages from your location should be available for pool party bookings.
                  Guests can choose these packages when booking pool parties.
                </p>
                
                {selectedFoodPackages.length > 0 ? (
                  <div className="space-y-3">
                    {selectedFoodPackages.map((pkg, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={pkg.selected || false}
                              onChange={() => handleFoodPackageToggle(index)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="ml-3">
                              <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span>Adult: ₹{pkg.pricePerAdult}</span>
                                <span>Kid: ₹{pkg.pricePerKid}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${pkg.selected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {pkg.selected ? 'Selected' : 'Not selected'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm mb-3">No food packages available</p>
                    <p className="text-gray-400 text-xs">
                      Add food packages in the <strong>Pricing & Amenities</strong> step to make them available here.
                    </p>
                  </div>
                )}
                
                {/* Selected Packages Summary */}
                {selectedFoodPackages.filter(pkg => pkg.selected).length > 0 && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 font-medium">
                      {selectedFoodPackages.filter(pkg => pkg.selected).length} food package(s) selected
                    </p>
                    <div className="mt-2 space-y-1">
                      {selectedFoodPackages
                        .filter(pkg => pkg.selected)
                        .map((pkg, index) => (
                          <div key={index} className="flex justify-between text-sm text-blue-700">
                            <span>{pkg.name}</span>
                            <span>₹{pkg.pricePerAdult} / ₹{pkg.pricePerKid}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Private Pool Party Configuration */}
        {poolPartyConfig.poolPartyType === 'private' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Private Pool Party Configuration</h3>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={poolPartyConfig.createNewPrivatePool}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setPoolPartyConfig(prev => {
                      const updatedConfig = {
                        ...prev,
                        createNewPrivatePool: isChecked
                      };
                      
                      // Initialize private pool data when checked
                      if (isChecked) {
                        updatedConfig.newPrivatePoolData = {
                          name: `${formData.name || 'Location'} Private Pool`,
                          description: '',
                          timings: useDefaultTimings ? defaultTimings.map(timing => ({
                            ...timing,
                            capacity: '',
                            pricing: {
                              perAdult: '',
                              perKid: ''
                            }
                          })) : [{ 
                            session: 'Custom', 
                            startTime: '', 
                            endTime: '',
                            capacity: '',
                            pricing: {
                              perAdult: '',
                              perKid: ''
                            }
                          }]
                        };
                      }
                      return updatedConfig;
                    });
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Create private pool party for this location
                </span>
              </label>
            </div>

            {/* Private Pool Party Details - Only show if checkbox is checked */}
            {poolPartyConfig.createNewPrivatePool && (
              <div className="space-y-6 mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    This private pool party will be created exclusively for this location.
                    Guests can book pool party sessions along with their location booking.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pool Party Name *
                  </label>
                  <input
                    type="text"
                    value={poolPartyConfig.newPrivatePoolData?.name || ''}
                    onChange={(e) => setPoolPartyConfig(prev => ({
                      ...prev,
                      newPrivatePoolData: {
                        ...prev.newPrivatePoolData,
                        name: e.target.value
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={`${formData.name || 'Location'} Private Pool`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={poolPartyConfig.newPrivatePoolData?.description || ''}
                    onChange={(e) => setPoolPartyConfig(prev => ({
                      ...prev,
                      newPrivatePoolData: {
                        ...prev.newPrivatePoolData,
                        description: e.target.value
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="3"
                    placeholder="Describe the private pool party..."
                  />
                </div>

                {/* Session Configuration - Same as shared pool */}
                <div className="mt-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Session Type
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => {
                          setUseDefaultTimings(true);
                          setPoolPartyConfig(prev => ({
                            ...prev,
                            newPrivatePoolData: {
                              ...prev.newPrivatePoolData,
                              timings: defaultTimings.map(timing => ({
                                ...timing,
                                capacity: '',
                                pricing: {
                                  perAdult: '',
                                  perKid: ''
                                }
                              }))
                            }
                          }));
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          useDefaultTimings
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Use Default Sessions
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseDefaultTimings(false);
                          setPoolPartyConfig(prev => ({
                            ...prev,
                            newPrivatePoolData: {
                              ...prev.newPrivatePoolData,
                              timings: [{ 
                                session: 'Custom', 
                                startTime: '', 
                                endTime: '',
                                capacity: '',
                                pricing: {
                                  perAdult: '',
                                  perKid: ''
                                }
                              }]
                            }
                          }));
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          !useDefaultTimings
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Custom Sessions
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {poolPartyConfig.newPrivatePoolData?.timings?.map((timing, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-900 capitalize">{timing.session} Session</h4>
                          {!useDefaultTimings && poolPartyConfig.newPrivatePoolData.timings.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updatedTimings = [...poolPartyConfig.newPrivatePoolData.timings];
                                updatedTimings.splice(index, 1);
                                setPoolPartyConfig(prev => ({
                                  ...prev,
                                  newPrivatePoolData: {
                                    ...prev.newPrivatePoolData,
                                    timings: updatedTimings
                                  }
                                }));
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Time *
                            </label>
                            <input
                              type="time"
                              value={timing.startTime}
                              onChange={(e) => {
                                const updatedTimings = [...poolPartyConfig.newPrivatePoolData.timings];
                                updatedTimings[index] = {
                                  ...updatedTimings[index],
                                  startTime: e.target.value
                                };
                                setPoolPartyConfig(prev => ({
                                  ...prev,
                                  newPrivatePoolData: {
                                    ...prev.newPrivatePoolData,
                                    timings: updatedTimings
                                  }
                                }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Time *
                            </label>
                            <input
                              type="time"
                              value={timing.endTime}
                              onChange={(e) => {
                                const updatedTimings = [...poolPartyConfig.newPrivatePoolData.timings];
                                updatedTimings[index] = {
                                  ...updatedTimings[index],
                                  endTime: e.target.value
                                };
                                setPoolPartyConfig(prev => ({
                                  ...prev,
                                  newPrivatePoolData: {
                                    ...prev.newPrivatePoolData,
                                    timings: updatedTimings
                                  }
                                }));
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Session Capacity *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={timing.capacity || ''}
                            onChange={(e) => {
                              const updatedTimings = [...poolPartyConfig.newPrivatePoolData.timings];
                              updatedTimings[index] = {
                                ...updatedTimings[index],
                                capacity: e.target.value === '' ? '' : parseInt(e.target.value) || 0
                              };
                              setPoolPartyConfig(prev => ({
                                ...prev,
                                newPrivatePoolData: {
                                  ...prev.newPrivatePoolData,
                                  timings: updatedTimings
                                }
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Maximum persons for this session"
                            required
                          />
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-md">
                          <label className="block text-sm font-medium text-blue-800 mb-2">
                            Session Pricing *
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price Per Adult *
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500">₹</span>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={timing.pricing?.perAdult || ''}
                                  onChange={(e) => {
                                    const updatedTimings = [...poolPartyConfig.newPrivatePoolData.timings];
                                    updatedTimings[index] = {
                                      ...updatedTimings[index],
                                      pricing: {
                                        ...updatedTimings[index].pricing,
                                        perAdult: e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                                      }
                                    };
                                    setPoolPartyConfig(prev => ({
                                      ...prev,
                                      newPrivatePoolData: {
                                        ...prev.newPrivatePoolData,
                                        timings: updatedTimings
                                      }
                                    }));
                                  }}
                                  className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md"
                                  placeholder="0.00"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price Per Kid *
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500">₹</span>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={timing.pricing?.perKid || ''}
                                  onChange={(e) => {
                                    const updatedTimings = [...poolPartyConfig.newPrivatePoolData.timings];
                                    updatedTimings[index] = {
                                      ...updatedTimings[index],
                                      pricing: {
                                        ...updatedTimings[index].pricing,
                                        perKid: e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                                      }
                                    };
                                    setPoolPartyConfig(prev => ({
                                      ...prev,
                                      newPrivatePoolData: {
                                        ...prev.newPrivatePoolData,
                                        timings: updatedTimings
                                      }
                                    }));
                                  }}
                                  className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md"
                                  placeholder="0.00"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!useDefaultTimings && poolPartyConfig.newPrivatePoolData.timings.length < 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updatedTimings = [...poolPartyConfig.newPrivatePoolData.timings];
                        updatedTimings.push({ 
                          session: 'Custom', 
                          startTime: '', 
                          endTime: '',
                          capacity: '',
                          pricing: {
                            perAdult: '',
                            perKid: ''
                          }
                        });
                        setPoolPartyConfig(prev => ({
                          ...prev,
                          newPrivatePoolData: {
                            ...prev.newPrivatePoolData,
                            timings: updatedTimings
                          }
                        }));
                      }}
                      className="mt-4 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      + Add Session
                    </button>
                  )}
                </div>

                {/* Food Package Selection for Private Pool Party */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Food Packages for Pool Party
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select which food packages from your location should be available for pool party bookings.
                    Guests can choose these packages when booking pool parties.
                  </p>
                  
                  {selectedFoodPackages.length > 0 ? (
                    <div className="space-y-3">
                      {selectedFoodPackages.map((pkg, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={pkg.selected || false}
                                onChange={() => handleFoodPackageToggle(index)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="ml-3">
                                <h4 className="font-medium text-gray-900">{pkg.name}<span>({pkg.description})</span></h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                  <span>Adult: ₹{pkg.pricePerAdult}</span>
                                  <span>Kid: ₹{pkg.pricePerKid}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${pkg.selected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {pkg.selected ? 'Selected' : 'Not selected'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 text-sm mb-3">No food packages available</p>
                      <p className="text-gray-400 text-xs">
                        Add food packages in the <strong>Pricing & Amenities</strong> step to make them available here.
                      </p>
                    </div>
                  )}
                  
                  {/* Selected Packages Summary */}
                  {selectedFoodPackages.filter(pkg => pkg.selected).length > 0 && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 font-medium">
                        {selectedFoodPackages.filter(pkg => pkg.selected).length} food package(s) selected
                      </p>
                      <div className="mt-2 space-y-1">
                        {selectedFoodPackages
                          .filter(pkg => pkg.selected)
                          .map((pkg, index) => (
                            <div key={index} className="flex justify-between text-sm text-blue-700">
                              <span>{pkg.name}</span>
                              <span>₹{pkg.pricePerAdult} / ₹{pkg.pricePerKid}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Card */}
        {poolPartyConfig.poolPartyType !== 'none' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-md font-semibold text-blue-800 mb-3">Pool Party Configuration Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Pool Party Type:</span>
                <p className="text-blue-800 capitalize">{poolPartyConfig.poolPartyType}</p>
              </div>
              {poolPartyConfig.poolPartyType === 'shared' && (
                <>
                  {poolPartyConfig.sharedPoolPartyId && (
                    <div>
                      <span className="text-blue-600 font-medium">Selected Pool:</span>
                      <p className="text-blue-800">
                        {sharedPoolParties.find(p => p._id === poolPartyConfig.sharedPoolPartyId)?.name || 'Loading...'}
                      </p>
                    </div>
                  )}
                  {poolPartyConfig.createNewSharedPool && (
                    <>
                      <div>
                        <span className="text-blue-600 font-medium">New Pool Name:</span>
                        <p className="text-blue-800">
                          {poolPartyConfig.newSharedPoolData?.name || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium">Total Sessions:</span>
                        <p className="text-blue-800">
                          {poolPartyConfig.newSharedPoolData?.timings?.length || 0} session(s)
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium">Total Capacity:</span>
                        <p className="text-blue-800">
                          {calculateTotalCapacity()} persons
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
              {poolPartyConfig.poolPartyType === 'private' && poolPartyConfig.createNewPrivatePool && (
                <>
                  <div>
                    <span className="text-blue-600 font-medium">Pool Name:</span>
                    <p className="text-blue-800">
                      {poolPartyConfig.newPrivatePoolData?.name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Total Sessions:</span>
                    <p className="text-blue-800">
                      {poolPartyConfig.newPrivatePoolData?.timings?.length || 0} session(s)
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Status:</span>
                    <p className="text-blue-800">Will be created as private pool</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

PoolPartyDetails.validateCurrentStep = validatePoolPartyStep;

export default PoolPartyDetails;