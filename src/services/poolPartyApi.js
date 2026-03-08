// services/poolPartyApi.js
import api from './api';

export const createPoolParty = async (poolPartyData) => {
  const response = await api.post('/pool-parties', poolPartyData);
  return response.data;
};

export const updatePoolParty = async (poolPartyId, poolPartyData) => {
  const response = await api.put(`/pool-parties/${poolPartyId}`, poolPartyData);
  return response.data;
};

export const getPoolPartyByLocationId = async (locationId) => {
  const response = await api.get(`/pool-parties/location/${locationId}`);
  return response.data;
};

export const deletePoolParty = async (locationId) => {
  const response = await api.delete(`/pool-parties/${locationId}`);
  return response.data;
};

export const getSharedPoolParties = async () => {
  const response = await api.get('/locations/shared-pool-parties');
  return response.data;
};

export const getPoolParties = async () => {
  const response = await api.get('/pool-parties/');
  return response.data;
};