import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;
const API_URL = `${API_BASE_URL}/coupons`;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

// ---- Admin CRUD ----
export const getAllCoupons = async () => {
  const res = await axios.get(API_URL, { headers: authHeaders() });
  return res.data;
};

export const getCouponById = async (couponId) => {
  const res = await axios.get(`${API_URL}/${couponId}`, { headers: authHeaders() });
  return res.data;
};

export const createCoupon = async (data) => {
  const res = await axios.post(API_URL, data, {
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });
  return res.data;
};

export const updateCoupon = async (couponId, data) => {
  const res = await axios.put(`${API_URL}/${couponId}`, data, {
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });
  return res.data;
};

export const deleteCoupon = async (couponId) => {
  const res = await axios.delete(`${API_URL}/${couponId}`, { headers: authHeaders() });
  return res.data;
};

// ---- Public (booking flow) ----
export const validateCoupon = async ({ code, locationId, bookingDate, subtotal }) => {
  const res = await axios.post(`${API_URL}/validate`, {
    code,
    locationId,
    bookingDate,
    subtotal,
  });
  return res.data;
};
