import api from './api';

export const bookingAPI = {
  // Get all bookings
  getBookings: () => api.get('/bookings'),

  getLocations: () => api.get('/locations'),
  
  // Get booking by ID
  getBookingById: (id) => api.get(`/bookings/${id}`),
  
  // Create new booking
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  
  // Update booking
  updateBooking: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
  
  // Get booked dates for a location
  getBookedDates: (locationId) => api.get(`/bookings/dates/${locationId}`),

  // Cancellation & refund (location bookings)
  getCancellationPreview: (id) => api.get(`/bookings/${id}/cancellation-preview`),
  cancelBooking: (id, payload) => api.post(`/bookings/${id}/cancel`, payload),
};