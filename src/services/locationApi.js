// services/locationService.js
//import axios from 'axios';
import api from './api';

//const API_BASE_URL = process.env.VITE_API_CONNECTION_HOST || 'http://localhost:5000/api';

export const createLocation = async (locationData) => {
  const response = await api.post('/locations', locationData);
  return response.data;
};

export const updateLocation = async (id, locationData) => {
  const response = await api.put(`/locations/${id}`, locationData);
  return response.data;
};

export const getLocationById = async (id) => {
  const response = await api.get(`/locations/${id}`);
  return response.data;
};

export const getLocations = async () => {
  const response = await api.get('/locations');
  return response.data;
};

export const deleteLocation = async (id) => {
  const response = await api.delete(`/locations/${id}`);
  return response.data;
};