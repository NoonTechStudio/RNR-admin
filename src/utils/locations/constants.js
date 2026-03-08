// Constants and configuration
export const amenitiesOptions = [
  "Yoga Health Center",
  "Horse Riding",
  "Pool Party",
  "Rooms",
  "Rain Shower",
  "Treehouse",
  "Mini Zoo",
  "Indoor Games",
  "Outdoor Games",
  "Music",
  "Banquet Hall",
  "Garden Area"
];

export const initialFormState = {
  name: "",
  address: { line1: "", line2: "", city: "", state: "", pincode: "" },
  coordinates: { lat: "", lng: "" },
  description: "",
  capacityOfPersons: "",
  propertyDetails: {
    bedrooms: null,
    acBedrooms: null,
    nonAcBedrooms: null,
    kitchens: null,
    livingRooms: null,
    halls: null,
    bathrooms: null,
    swimmingPools: null,
    privateRooms: null,
    withFood: false,
    withNightStay: false,
  },
  amenities: [],
  pricing: {
    pricePerAdult: 0,
    pricePerKid: 0,
    extraPersonCharge: 0,
  },
};

export const addressFields = [
  { key: "line1", placeholder: "Resort name, street, area", required: true, label: "Address Line 1" },
  { key: "line2", placeholder: "Landmark, additional location info", required: false, label: "Address Line 2" }
];