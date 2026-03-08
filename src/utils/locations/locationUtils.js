// Location and coordinate utilities
export const extractCoordinatesFromUrl = (url) => {
  if (!url) return null;

  try {
    // Method 1: Direct coordinates in URL (e.g., .../@28.6139,77.2090,15z)
    const directMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (directMatch) {
      return {
        lat: parseFloat(directMatch[1]),
        lng: parseFloat(directMatch[2])
      };
    }

    // Method 2: Query parameters (e.g., ...?q=28.6139,77.2090)
    const queryMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (queryMatch) {
      return {
        lat: parseFloat(queryMatch[1]),
        lng: parseFloat(queryMatch[2])
      };
    }

    // Method 3: Data parameters (e.g., ...!3d28.6139!4d77.2090)
    const dataMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (dataMatch) {
      return {
        lat: parseFloat(dataMatch[1]),
        lng: parseFloat(dataMatch[2])
      };
    }

    return null;
  } catch (error) {
    console.error("Error extracting coordinates:", error);
    return null;
  }
};

export const handleAddressSearch = async (query) => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    return [];
  }
};

export const parseSuggestionToFormData = (suggestion, currentForm) => {
  const address = suggestion.address;
  
  return {
    coordinates: {
      lat: suggestion.lat,
      lng: suggestion.lon
    },
    address: {
      line1: suggestion.display_name.split(',')[0] || currentForm.address.line1,
      line2: currentForm.address.line2,
      city: address.city || address.town || address.village || address.county || currentForm.address.city,
      state: address.state || currentForm.address.state,
      pincode: address.postcode || currentForm.address.pincode
    }
  };
};