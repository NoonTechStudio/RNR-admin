// Form manipulation helpers
export const handleNestedChange = (form, setForm, section, key, value) => {
  const fieldValue = typeof value === "string" && !isNaN(value) && value !== '' ? Number(value) : value;
  
  setForm({ 
    ...form, 
    [section]: { 
      ...form[section], 
      [key]: fieldValue 
    } 
  });
  
  return fieldValue;
};

export const handleBlur = (fieldName, setTouched, touched, form, validateField, setErrors) => {
  setTouched({ ...touched, [fieldName]: true });
  
  let value;
  if (fieldName.includes(".")) {
    const [section, key] = fieldName.split(".");
    value = form[section][key];
  } else {
    value = form[fieldName];
  }
  
  const error = validateField(fieldName, value);
  if (error) {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  } else {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }
};

export const prepareSubmitData = (form) => {
  return {
    ...form,
    coordinates: {
    latitude: parseFloat(form.coordinates.lat),  // Change this
    longitude: parseFloat(form.coordinates.lng), // Change this
    },
    amenities: form.amenities
  };
};