/* eslint-disable no-else-return */
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://my-project-backend-ee4t.onrender.com/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================
// Wholesaler APIs
// ============================================

// Get all wholesalers
export const getAllWholesalers = async () => {
  const res = await API.get('/wholesalers');
  return res.data;
};

// Get wholesaler by ID
export const getWholesalerById = async (id) => {
  const res = await API.get(`/wholesalers/${id}`);
  return res.data;
};

// Search wholesalers by name or PIN
export const searchWholesalers = async (searchTerm) => {
  const res = await API.get(`/wholesalers/search?q=${searchTerm}`);
  return res.data;
};

// ============================================
// Coupon APIs - USING CORRECT ENDPOINT: /offercode
// ============================================

// Get all coupons (from /api/offercode)
export const getAllCoupons = async () => {
  try {
    const res = await API.get('/offercode');
    return res.data;
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
};

// Get active coupons only
export const getActiveCoupons = async () => {
  try {
    const res = await API.get('/offercode/active');
    return res.data;
  } catch (error) {
    // If active endpoint doesn't exist, filter from all coupons
    const allCoupons = await getAllCoupons();
    const now = new Date();
    const activeCoupons = (allCoupons.data || []).filter(
      (coupon) => coupon.isActive && new Date(coupon.validTill) > now
    );
    return { success: true, data: activeCoupons };
  }
};

// Get coupon by code
export const getCouponByCode = async (code) => {
  const res = await API.get(`/offercode/code/${code}`);
  return res.data;
};

// Create new coupon (ADMIN ONLY)
export const createCoupon = async (payload) => {
  const res = await API.post('/offercode/create', payload);
  return res.data;
};

// Update coupon (ADMIN ONLY)
export const updateCoupon = async (id, payload) => {
  const res = await API.put(`/offercode/${id}`, payload);
  return res.data;
};

// Delete coupon (ADMIN ONLY)
export const deleteCoupon = async (id) => {
  const res = await API.delete(`/offercode/${id}`);
  return res.data;
};

// Apply coupon for user order (User)
export const applyCouponForOrder = async (code, cartTotal, userId) => {
  const res = await API.post('/offercode/apply', {
    code,
    cartTotal,
    userId,
  });
  return res.data;
};

// ============================================
// Wholesale Coupon Application APIs
// ============================================

// Apply coupon to wholesaler (ADMIN ONLY)
export const applyCouponToWholesaler = async (wholesalerId, couponCode, appliedBy = null) => {
  const res = await API.post('/wholesale-coupon/apply', {
    wholesalerId,
    couponCode,
    appliedBy,
  });
  return res.data;
};

// Get all coupons applied to a wholesaler
export const getWholesalerCoupons = async (wholesalerId, filters = {}) => {
  const { status, fromDate, toDate } = filters;
  let url = `/wholesale-coupon/wholesaler/${wholesalerId}`;

  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await API.get(url);
  return res.data;
};

// Get active coupons for a wholesaler
export const getActiveCouponsForWholesaler = async (wholesalerId) => {
  const res = await API.get(`/wholesale-coupon/wholesaler/${wholesalerId}/active`);
  return res.data;
};

// Get all wholesalers who have a specific coupon
export const getCouponWholesalers = async (couponId, status = null) => {
  let url = `/wholesale-coupon/coupon/${couponId}/wholesalers`;
  if (status) {
    url += `?status=${status}`;
  }
  const res = await API.get(url);
  return res.data;
};

// Validate coupon for wholesaler order
export const validateCouponForOrder = async (wholesalerId, couponCode, orderAmount) => {
  const res = await API.post('/wholesale-coupon/validate', {
    wholesalerId,
    couponCode,
    orderAmount,
  });
  return res.data;
};

// Mark coupon as used after order
export const useCouponForOrder = async (applicationId, orderId) => {
  const res = await API.put(`/wholesale-coupon/use/${applicationId}`, { orderId });
  return res.data;
};

// Revoke coupon from wholesaler (ADMIN ONLY)
export const revokeCouponFromWholesaler = async (applicationId, reason) => {
  const res = await API.put(`/wholesale-coupon/revoke/${applicationId}`, { reason });
  return res.data;
};

// Get coupon statistics (ADMIN ONLY)
export const getCouponStatistics = async (dateRange = {}) => {
  const { startDate, endDate } = dateRange;
  let url = '/wholesale-coupon/statistics';

  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await API.get(url);
  return res.data;
};

// Get coupon report (ADMIN ONLY)
export const getCouponReport = async (filters = {}) => {
  const { status, fromDate, toDate, wholesalerId, couponCode } = filters;
  let url = '/wholesale-coupon/report';

  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (wholesalerId) params.append('wholesalerId', wholesalerId);
  if (couponCode) params.append('couponCode', couponCode);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await API.get(url);
  return res.data;
};

// Bulk apply coupon to multiple wholesalers (ADMIN ONLY)
export const bulkApplyCoupon = async (wholesalerIds, couponCode, appliedBy = null) => {
  const res = await API.post('/wholesale-coupon/bulk-apply', {
    wholesalerIds,
    couponCode,
    appliedBy,
  });
  return res.data;
};

// Get single coupon application by ID
export const getCouponApplicationById = async (applicationId) => {
  const res = await API.get(`/wholesale-coupon/${applicationId}`);
  return res.data;
};

// Delete expired coupons (ADMIN ONLY)
export const deleteExpiredCoupons = async () => {
  const res = await API.delete('/wholesale-coupon/delete-expired');
  return res.data;
};

// ============================================
// Helper Functions
// ============================================

// Format coupon discount for display
export const formatCouponDiscount = (coupon) => {
  if (!coupon) return '';

  if (coupon.discountType === 'PERCENTAGE') {
    return `${coupon.discountValue}%`;
  }

  if (coupon.discountType === 'FIXED') {
    return `₹${coupon.discountValue.toLocaleString()}`;
  }

  return coupon.discountValue;
};

// Check if coupon is expired
export const isCouponExpired = (expiryDate) => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};

// Get coupon status text and color
export const getCouponStatusInfo = (status, expiryDate) => {
  if (status === 'ACTIVE' && isCouponExpired(expiryDate)) {
    return { text: 'EXPIRED', color: 'error' };
  }

  const statusMap = {
    ACTIVE: { text: 'Active', color: 'success' },
    USED: { text: 'Used', color: 'info' },
    EXPIRED: { text: 'Expired', color: 'error' },
    REVOKED: { text: 'Revoked', color: 'warning' },
  };

  return statusMap[status] || { text: status, color: 'default' };
};

// Calculate discount amount
export const calculateDiscount = (coupon, orderAmount) => {
  if (!coupon || !orderAmount) return 0;

  let discount = 0;

  if (coupon.discountType === 'PERCENTAGE') {
    discount = (orderAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
  } else if (coupon.discountType === 'FIXED') {
    discount = coupon.discountValue;
  }

  return Math.min(discount, orderAmount);
};

// Export all functions as default object
export default {
  getAllWholesalers,
  getWholesalerById,
  searchWholesalers,
  getAllCoupons,
  getActiveCoupons,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCouponForOrder,
  applyCouponToWholesaler,
  getWholesalerCoupons,
  getActiveCouponsForWholesaler,
  getCouponWholesalers,
  validateCouponForOrder,
  useCouponForOrder,
  revokeCouponFromWholesaler,
  getCouponStatistics,
  getCouponReport,
  bulkApplyCoupon,
  getCouponApplicationById,
  deleteExpiredCoupons,
  formatCouponDiscount,
  isCouponExpired,
  getCouponStatusInfo,
  calculateDiscount,
};
