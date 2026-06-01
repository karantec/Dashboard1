/* eslint-disable perfectionist/sort-imports */
/* eslint-disable no-unused-vars */
/* eslint-disable perfectionist/sort-named-imports */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import {
  Card,
  Table,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Chip,
  Box,
  CircularProgress,
  Avatar,
  TablePagination,
} from "@mui/material";
import { analyticsService } from "src/services/ApiService";
import ViewOrderAnalytics from "../app-website-visits";
import AppWidgetSummary from "../app-widget-summary";

// Helper function for formatting currency
const formatCurrency = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString()}`;
};

// Helper function for formatting dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Status chip component
const OrderStatusChip = ({ status }) => {
  const statusColors = {
    PLACED: 'info',
    CONFIRMED: 'primary',
    PROCESSING: 'warning',
    SHIPPED: 'secondary',
    DELIVERED: 'success',
    CANCELLED: 'error',
  };
  return <Chip label={status} size="small" color={statusColors[status] || 'default'} />;
};

// Recent Orders Table Component
const RecentOrdersTable = ({ orders }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedOrders = orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent Orders
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Order ID</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell align="right"><strong>Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Payment</strong></TableCell>
             </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell>#{order._id?.slice(-8)}</TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                      {order.user?.name?.charAt(0) || order.user?.phoneNumber?.charAt(0) || 'G'}
                    </Avatar>
                    <Typography variant="body2">
                      {order.user?.name || order.user?.phoneNumber || 'Guest User'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(order.totalAmount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <OrderStatusChip status={order.status} />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={order.payment?.method || 'N/A'} 
                    size="small" 
                    variant="outlined"
                    color={order.payment?.status === 'PAID' ? 'success' : 'warning'}
                  />
                </TableCell>
               </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={orders.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Card>
  );
};

// // Top Products Table Component
// const TopProductsTable = ({ products }) => (
//   <Card sx={{ p: 3 }}>
//     <Typography variant="h6" sx={{ mb: 2 }}>
//       Top Selling Products
//     </Typography>
//     {/* <TableContainer>
//       <Table size="small">
//         <TableHead>
//           <TableRow>
//             <TableCell><strong>Product</strong></TableCell>
//             <TableCell align="center"><strong>Quantity Sold</strong></TableCell>
//             <TableCell align="right"><strong>Revenue</strong></TableCell>
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {products.length > 0 ? (
//             products.map((product, index) => {
//               const productName = product._id?.name || product.name || 'Unknown Product';
//               return (
//                 <TableRow key={index} hover>
//                   <TableCell>
//                     <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
//                       {productName}
//                     </Typography>
//                   </TableCell>
//                   <TableCell align="center">
//                     <Chip label={product.totalQuantity} size="small" color="primary" />
//                   </TableCell>
//                   <TableCell align="right">
//                     <Typography variant="body2" color="success.main" fontWeight="bold">
//                       {formatCurrency(product.totalRevenue)}
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               );
//             })
//           ) : (
//             <TableRow>
//               <TableCell colSpan={3} align="center">
//                 <Typography variant="body2" color="text.secondary">
//                   No product data available
//                 </Typography>
//               </TableCell>
//              </TableRow>
//           )}
//         </TableBody>
//       </Table> */}
//     </TableContainer>
//   </Card>
// );

export default function AppView() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    categories: 0,
    subcategories: 0,
    products: 0,
  });
  const [dashboardStats, setDashboardStats] = useState({
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
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [countsData, statsData, ordersData] = await Promise.all([
          analyticsService.getAnalyticsCounts(),
          analyticsService.getDashboardStats(),
          analyticsService.getRecentOrders(20),
        ]);

        setCounts(countsData);
        setDashboardStats(statsData);
        setRecentOrders(ordersData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        {/* Category Count */}
        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Categories"
            total={counts.categories}
            color="success"
            icon=""
          />
        </Grid>

        {/* Subcategory Count */}
        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Subcategories"
            total={counts.subcategories}
            color="info"
            icon=""
          />
        </Grid>

        {/* Product Count */}
        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Products"
            total={counts.products}
            color="warning"
            icon=""
          />
        </Grid>

        {/* Total Revenue */}
        <Grid xs={12} sm={6} md={3}>
          {/* <AppWidgetSummary
            title="Total Revenue"
            total={formatCurrency(dashboardStats.totalRevenue)}
            color="primary"
            icon=""
          /> */}
        </Grid>

        {/* Total Orders */}
        <Grid xs={12} sm={6} md={3}>
          {/* <AppWidgetSummary
            title="Total Orders"
            total={dashboardStats.totalOrders}
            color="success"
            icon=""
          /> */}
        </Grid>

        {/* Total Users */}
        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Total Users"
            total={dashboardStats.totalUsers}
            color="info"
            icon=""
          />
        </Grid>

        {/* Average Order Value */}
        <Grid xs={12} sm={6} md={3}>
          {/* <AppWidgetSummary
            title="Avg Order Value"
            total={formatCurrency(dashboardStats.averageOrderValue)}
            color="warning"
            icon=""
          /> */}
        </Grid>

        {/* Cancelled Orders */}
        <Grid xs={12} sm={6} md={3}>
          {/* <AppWidgetSummary
            title="Cancelled Orders"
            total={dashboardStats.cancelledOrders}
            color="error"
            icon=""
          /> */}
        </Grid>

        {/* Order Analytics Chart */}
        <Grid xs={12} md={12} lg={12}>
          <ViewOrderAnalytics
            title="Order & Revenue Analytics"
            subheader="Track your order performance and revenue trends"
          />
        </Grid>

        {/* Top Products */}
        {/* <Grid xs={12} md={6}>
          <TopProductsTable products={dashboardStats.topProducts} />
        </Grid> */}

        {/* Order Status Breakdown */}
        {/* <Grid xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Order Status Breakdown</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Count</strong></TableCell>
                    <TableCell align="right"><strong>Percentage</strong></TableCell>
                   </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(dashboardStats.orderStatusBreakdown).map(([status, count]) => {
                    const percentage = dashboardStats.totalOrders > 0 
                      ? ((count / dashboardStats.totalOrders) * 100).toFixed(1) 
                      : 0;
                    return (
                      <TableRow key={status}>
                        <TableCell><OrderStatusChip status={status} /></TableCell>
                        <TableCell align="right">{count.toLocaleString()}</TableCell>
                        <TableCell align="right">{percentage}%</TableCell>
                       </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid> */}

        {/* Recent Orders */}
        {/* <Grid xs={12}>
          <RecentOrdersTable orders={recentOrders} />
        </Grid> */}

        {/* Quick Stats Summary */}
        {/* <Grid xs={12}>
          <Card sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
            <Grid container spacing={3}>
              <Grid xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Recent Revenue (30 days)
                </Typography>
                <Typography variant="h5">{formatCurrency(dashboardStats.recentRevenue)}</Typography>
              </Grid>
              <Grid xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Recent Orders (30 days)
                </Typography>
                <Typography variant="h5">{dashboardStats.recentOrdersCount}</Typography>
              </Grid>
              <Grid xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Completion Rate
                </Typography>
                <Typography variant="h5">
                  {dashboardStats.totalOrders > 0 
                    ? ((1 - dashboardStats.cancelledOrders / dashboardStats.totalOrders) * 100).toFixed(1)
                    : 0}%
                </Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid> */}
      </Grid>
    </Container>
  );
}