import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;
const API_URL = `${API_BASE_URL}/offers`;

// Get all offers
export const getAllOffers = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching offers:', error);
    throw error;
  }
};

// Get offer by ID
export const getOfferById = async (offerId) => {
  try {
    const response = await axios.get(`${API_URL}/${offerId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching offer:', error);
    throw error;
  }
};

// Create new offer
export const createOffer = async (offerData) => {
  try {
    const response = await axios.post(API_URL, offerData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating offer:', error);
    throw error;
  }
};

// Update offer
export const updateOffer = async (offerId, offerData) => {
  try {
    const response = await axios.put(`${API_URL}/${offerId}`, offerData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating offer:', error);
    throw error;
  }
};

// Delete offer
export const deleteOffer = async (offerId) => {
  try {
    const response = await axios.delete(`${API_URL}/${offerId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting offer:', error);
    throw error;
  }
};

// Get active offers for location
export const getActiveOffersForLocation = async (locationId, bookingDate) => {
  try {
    const response = await axios.get(`${API_URL}/active/location`, {
      params: {
        locationId,
        bookingDate
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching active offers for location:', error);
    throw error;
  }
};

// Get active offers for pool party
export const getActiveOffersForPoolParty = async (poolPartyId, bookingDate) => {
  try {
    const response = await axios.get(`${API_URL}/active/poolparty`, {
      params: {
        poolPartyId,
        bookingDate
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching active offers for pool party:', error);
    throw error;
  }
};
