import axios from 'axios';

// Get base URL and ensure it includes /api
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_CONNECTION_HOST;
  
  // If the env URL already includes /api, use it as is
  if (envURL?.endsWith('/api')) {
    return envURL;
  }
  
  // Otherwise, append /api
  return envURL ? `${envURL}/api` : 'http://localhost:5001/api';
};

const API_BASE_URL = getBaseURL();

console.log('🔧 API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API methods - REMOVED /api PREFIX (since baseURL already has it)
export const authAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  register: (adminData) => api.post('/admin/register', adminData),
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (profileData) => api.put('/admin/profile', profileData),
  changePassword: (passwordData) => api.put('/admin/change-password', passwordData),
};

// Location API methods
export const locationAPI = {
  getAll: () => api.get('/locations'),
  getById: (id) => api.get(`/locations/${id}`),
  create: (locationData) => api.post('/locations', locationData),
  update: (id, locationData) => api.put(`/locations/${id}`, locationData),
  delete: (id) => api.delete(`/locations/${id}`),
};

// Location Image API methods
export const locationImageAPI = {
  getAll: () => api.get('/location-images'),
  getByLocationId: (locationId) => api.get(`/location-images?locationId=${locationId}`),
  create: (imageData) => api.post('/location-images', imageData),
  delete: (id) => api.delete(`/location-images/${id}`),
};

// Booking API methods
export const bookingAPI = {
  getAll: () => api.get('/bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (bookingData) => api.post('/bookings', bookingData),
  update: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
  delete: (id) => api.delete(`/bookings/${id}`),
};

// Review API methods
export const reviewAPI = {
  getAll: () => api.get('/reviews'),
  getByLocationId: (locationId) => api.get(`/reviews?locationId=${locationId}`),
  create: (reviewData) => api.post('/reviews', reviewData),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// Dashboard API methods
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Payment API methods
export const paymentAPI = {
  createOrder: (orderData) => api.post('/payments/create-order', orderData),
  verifyPayment: (paymentData) => api.post('/payments/verify', paymentData),
};

// Export the main api instance for other requests
export default api;