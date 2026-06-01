// services/analyticsService.js

const API_BASE_URL = 'https://my-project-backend-ee4t.onrender.com/api';

export const analyticsService = {
  // Get counts for categories, subcategories, products
  getAnalyticsCounts: async () => {
    try {
      // Fetch categories
      const categoryRes = await fetch(`${API_BASE_URL}/category/categories`);
      const categoryData = await categoryRes.json();
      const categoryCount = categoryData?.categories?.length || 0;

      // Fetch subcategories
      const subcategoryRes = await fetch(`${API_BASE_URL}/subcategory`);
      const subcategoryData = await subcategoryRes.json();
      const subcategoryCount = subcategoryData?.subcategories?.length || 0;

      // Fetch products
      const productRes = await fetch(`${API_BASE_URL}/product/`);
      const productData = await productRes.json();
      const productCount = productData?.data?.length || 0;

      return {
        categories: categoryCount,
        subcategories: subcategoryCount,
        products: productCount,
      };
    } catch (error) {
      console.error('Error fetching analytics counts:', error);
      return {
        categories: 0,
        subcategories: 0,
        products: 0,
      };
    }
  },

  // Get all users - Using correct API endpoint
  getAllUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user`);
      const data = await response.json();
      console.log('Users API response:', data); // Debug log
      return data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Get order analytics (public)
  getOrderAnalytics: async (period = 'monthly') => {
    try {
      const response = await fetch(`${API_BASE_URL}/order/analytics?period=${period}`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      return null;
    }
  },

  // Get all orders (public)
  getAllOrders: async (status = null) => {
    try {
      const token = localStorage.getItem('token'); // or get from your auth store
      const url = status
        ? `${API_BASE_URL}/order/admin/all?status=${status}`
        : `${API_BASE_URL}/order/admin/all`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  // Get recent orders
  getRecentOrders: async (limit = 50) => {
    try {
      const orders = await analyticsService.getAllOrders();
      return orders.slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return [];
    }
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const [orderAnalytics, users, allOrders] = await Promise.all([
        analyticsService.getOrderAnalytics('monthly'),
        analyticsService.getAllUsers(),
        analyticsService.getAllOrders(),
      ]);

      const totalRevenue = orderAnalytics?.summary?.totalRevenue || 0;
      const totalOrders = orderAnalytics?.summary?.totalOrders || 0;
      const averageOrderValue = orderAnalytics?.summary?.averageOrderValue || 0;
      const cancelledOrders = orderAnalytics?.cancellation?.cancelledOrders || 0;

      // Calculate order status breakdown
      const orderStatusBreakdown = {};
      allOrders.forEach((order) => {
        // eslint-disable-next-line prefer-destructuring
        const status = order.status;
        orderStatusBreakdown[status] = (orderStatusBreakdown[status] || 0) + 1;
      });

      // Calculate recent revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentOrders = allOrders.filter(
        (order) => order.createdAt && new Date(order.createdAt) >= thirtyDaysAgo
      );

      const recentRevenue = recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      return {
        totalUsers: users.length,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        cancelledOrders,
        recentRevenue,
        recentOrdersCount: recentOrders.length,
        orderStatusBreakdown,
        topProducts: orderAnalytics?.topProducts || [],
        orderTrends: {
          labels: orderAnalytics?.trends?.monthly?.map((item) => item._id) || [],
          orders: orderAnalytics?.trends?.monthly?.map((item) => item.orders) || [],
          revenue: orderAnalytics?.trends?.monthly?.map((item) => item.revenue) || [],
        },
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        cancelledOrders: 0,
        recentRevenue: 0,
        recentOrdersCount: 0,
        orderStatusBreakdown: {},
        topProducts: [],
        orderTrends: { labels: [], orders: [], revenue: [] },
      };
    }
  },
};
