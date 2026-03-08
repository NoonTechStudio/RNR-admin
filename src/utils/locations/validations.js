// Validation rules and helpers
export const validationRules = {
  name: (value) => {
    if (!value.trim()) return "Resort name is required";
    if (value.trim().length < 3) return "Resort name must be at least 3 characters";
    return null;
  },
  
  capacityOfPersons: (value) => {
    if (!value || value < 1) return "Capacity must be at least 1";
    if (value > 1000) return "Capacity cannot exceed 1000";
    return null;
  },
  
  description: (value) => {
    if (!value.trim()) return "Description is required";
    if (value.trim().length < 10) return "Description must be at least 10 characters";
    return null;
  },
  
  pincode: (value) => {
    const pincodeRegex = /^\d{6}$/;
    if (!value) return "Pincode is required";
    if (!pincodeRegex.test(value)) return "Pincode must be 6 digits";
    return null;
  },
  
  city: (value) => {
    if (!value.trim()) return "City is required";
    return null;
  },
  
  state: (value) => {
    if (!value.trim()) return "State is required";
    return null;
  },
  
  lat: (value) => {
    if (!value) return "Latitude is required";
    if (isNaN(value)) return "Latitude must be a number";
    if (value < -90 || value > 90) return "Latitude must be between -90 and 90";
    return null;
  },
  
  lng: (value) => {
    if (!value) return "Longitude is required";
    if (isNaN(value)) return "Longitude must be a number";
    if (value < -180 || value > 180) return "Longitude must be between -180 and 180";
    return null;
  },
  
  numberField: (value, fieldName) => {
    if (typeof value === "number" && value < 0) {
      return `${fieldName} cannot be negative`;
    }
    return null;
  }
};

export const validateField = (name, value, rules = validationRules) => {
  const fieldName = name.split('.').pop();
  
  if (rules[fieldName]) {
    return rules[fieldName](value);
  }
  
  // Default number field validation
  if (typeof value === "number") {
    return rules.numberField(value, fieldName);
  }
  
  return null;
};

export const validateForm = (form) => {
  const errors = {};
  
  // Basic fields
  if (!form.name.trim()) errors.name = "Resort name is required";
  if (!form.description.trim()) errors.description = "Description is required";
  if (!form.capacityOfPersons || form.capacityOfPersons < 1) errors.capacityOfPersons = "Valid capacity is required";
  
  // Address validation
  if (!form.address.line1.trim()) errors["address.line1"] = "Address line 1 is required";
  if (!form.address.city.trim()) errors["address.city"] = "City is required";
  if (!form.address.state.trim()) errors["address.state"] = "State is required";
  if (!form.address.pincode || !/^\d{6}$/.test(form.address.pincode)) errors["address.pincode"] = "Valid 6-digit pincode is required";
  
  // Coordinates validation
  if (!form.coordinates.lat) errors["coordinates.lat"] = "Latitude is required";
  if (!form.coordinates.lng) errors["coordinates.lng"] = "Longitude is required";
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};