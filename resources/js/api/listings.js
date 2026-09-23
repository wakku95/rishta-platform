import api from './client';

export const searchAssistedListings = async (params = {}) => {
  const response = await api.get('/listings', { params });
  return response.data;
};

export const getPublicAssistedListing = async (listingCode) => {
  const response = await api.get(`/listings/${listingCode}`);
  return response.data;
};

export const submitListingInterest = async (listingCode, data) => {
  const response = await api.post(`/listings/${listingCode}/interest`, data);
  return response.data;
};
