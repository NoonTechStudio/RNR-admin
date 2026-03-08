// services/paymentApi.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_CONNECTION_HOST,
});

// ✅ ADD THIS MISSING REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    console.log('🔐 Adding Authorization header:', !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header added to request');
    } else {
      console.warn('❌ No adminToken found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('🚨 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('🚨 API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      headers: error.config?.headers // This will now show if Authorization was sent
    });
    
    if (error.response?.status === 401) {
      console.error('🔐 401 Unauthorized - Token might be invalid or missing');
      // Remove invalid token
      localStorage.removeItem('adminToken');
      // Optional: redirect to login
      // window.location.href = '/admin/login';
    }
    
    return Promise.reject(error);
  }
);

export const paymentAPI = {
  // User payment processing
  createOrder: (orderData) => api.post('/payments/create-order', orderData),
  verifyPayment: (paymentData) => api.post('/payments/verify', paymentData),
  getPaymentStatus: (bookingId) => api.get(`/payments/status/${bookingId}`),
  
  // Admin payment processing (requires auth)
  processAdminPayment: (paymentData) => api.post('/payments/admin/process-payment', paymentData),
  markAsPaid: (paymentData) => api.post('/payments/admin/mark-paid', paymentData),
  
  // Get all payments (admin only)
  getAllPayments: (params = {}) => api.get('/payments', { params }),
  
  // Refund payment (admin only)
  refundPayment: (paymentId, refundData) => api.post(`/payments/${paymentId}/refund`, refundData),

  // Pool party payment processing
  createPoolPartyOrder: (orderData) => api.post('/payments/create-poolparty-order', orderData),
  verifyPoolPartyPayment: (paymentData) => api.post('/payments/verify-poolparty', paymentData),
  
  // Pool party admin payment processing
  markPoolPartyAsPaid: (bookingId, paymentData) => api.post(`/pool-parties/bookings/${bookingId}/mark-paid`, paymentData),
  updatePoolPartyPaymentStatus: (bookingId, paymentData) => api.patch(`/pool-parties/bookings/${bookingId}/payment-status`, paymentData),
};

export default paymentAPI;