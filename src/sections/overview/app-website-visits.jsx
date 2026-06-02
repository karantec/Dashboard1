/* eslint-disable perfectionist/sort-imports */
/* eslint-disable object-shorthand */
// src/sections/dashboard/ViewOrderAnalytics.js
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
// eslint-disable-next-line perfectionist/sort-imports
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
// eslint-disable-next-line perfectionist/sort-imports
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';

import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export default function ViewOrderAnalytics({ title, subheader, ...other }) {
  const theme = useTheme();
  const [period, setPeriod] = useState('yearly');
  const [data, setData] = useState(null);
  const [visitorCount, setVisitorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get period display text
  const getPeriodDisplayText = () => {
    switch (period) {
      case 'yearly':
        return 'Yearly';
      case 'all':
        return 'All Time';
      default:
        return 'Yearly';
    }
  };

  // Fetch analytics data & visitor count concurrently
  useEffect(() => {
    const fetchAnalyticsAndVisitors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Make both API requests simultaneously
        const [analyticsResponse, visitorResponse] = await Promise.all([
          axios.get(
            `https://my-project-backend-ee4t.onrender.com/api/order/analytics?period=${period}`,
            { headers }
          ),
          axios.get(
            `https://my-project-backend-ee4t.onrender.com/api/visitor/visit`,
            { headers }
          ).catch(err => {
            console.error('Failed to fetch visitor count:', err);
            return { data: { count: 0 } }; // Fallback if visitor API fails
          })
        ]);
        
        console.log('Full Analytics API Response:', analyticsResponse.data); // Debug log
        console.log('Visitor API Response:', visitorResponse.data); // Debug log

        setData(analyticsResponse.data.data);
        
        // Adjust based on your exact API key structure (assuming response.data.count or response.data.data.count)
        const count = visitorResponse.data?.count ?? visitorResponse.data?.data?.count ?? 0;
        setVisitorCount(count);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsAndVisitors();
  }, [period]);

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };

  // Prepare chart data based on period
  const getChartData = () => {
    if (!data) return { labels: [], orderSeries: [], revenueSeries: [] };

    let trendsData = [];
    let labels = [];

    if (period === 'yearly' && data.trends?.yearly && data.trends.yearly.length > 0) {
      trendsData = data.trends.yearly;
      labels = trendsData.map(item => String(item._id));
    } else if (period === 'all') {
      if (data.trends?.yearly && data.trends.yearly.length > 0) {
        trendsData = data.trends.yearly;
        labels = trendsData.map(item => String(item._id));
      } else if (data.trends?.all && data.trends.all.length > 0) {
        trendsData = data.trends.all;
        labels = trendsData.map(item => String(item._id));
      }
    }

    const orderSeries = trendsData.map(item => item.orders || 0);
    const revenueSeries = trendsData.map(item => item.revenue || 0);

    return { labels, orderSeries, revenueSeries };
  };

  const { labels, orderSeries, revenueSeries } = getChartData();

  // Chart options - NO HOVER EFFECTS
  const chartOptions = useChart({
    colors: ['#00A76F', '#FFAB00'],
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true },
    },
    plotOptions: {
      bar: { columnWidth: '16%', borderRadius: 4 },
    },
    fill: {
      type: ['solid', 'gradient'],
      opacity: [0.85, 0.9],
      gradient: {
        shade: 'light',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#FFAB00'],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.8,
      },
    },
    labels: labels,
    xaxis: {
      type: 'category',
      categories: labels,
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px',
          fontWeight: 500,
          colors: theme.palette.text.secondary,
        },
      },
      axisBorder: { show: true, color: theme.palette.divider },
      axisTicks: { show: true, color: theme.palette.divider },
    },
    yaxis: {
      title: {
        text: 'Orders / Revenue (₹)',
        style: { fontSize: '12px', fontWeight: 500 },
      },
      labels: {
        formatter: (value) => `${Math.round(value)}`,
        style: { colors: theme.palette.text.secondary },
      },
      min: 0,
    },
    tooltip: { enabled: false, shared: false, intersect: false },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontWeight: 500,
      labels: { colors: theme.palette.text.primary },
      onItemHover: { highlightDataSeries: false },
    },
    stroke: {
      width: [0, 3],
      curve: 'smooth',
      colors: ['#00A76F', '#FFAB00'],
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: {
      enabled: true,
      offsetY: -10,
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: ['#00A76F', '#FFAB00'],
      },
      formatter: (val) => {
        if (typeof val === 'number') {
          return val > 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val);
        }
        return val;
      },
    },
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } },
    },
    responsive: [
      {
        breakpoint: 600,
        options: { dataLabels: { enabled: false } },
      },
    ],
  });

  const series = [
    { name: 'Orders', type: 'column', data: orderSeries, fill: 'solid' },
    { name: 'Revenue (₹)', type: 'line', data: revenueSeries, fill: 'gradient' },
  ];

  // Prepare hourly distribution data
  const hourlyLabels = data?.trends?.hourlyDistribution?.map(item => `${item._id}:00`) || [];
  const hourlyOrders = data?.trends?.hourlyDistribution?.map(item => item.orders) || [];

  const hourlyChartOptions = useChart({
    colors: ['#2065D1'],
    chart: { toolbar: { show: false }, zoom: { enabled: false } },
    plotOptions: { bar: { columnWidth: '70%', borderRadius: 4 } },
    labels: hourlyLabels,
    xaxis: {
      title: { text: 'Hour of Day', style: { fontSize: '12px' } },
      labels: { rotate: -45 },
    },
    yaxis: { title: { text: 'Number of Orders' }, min: 0 },
    tooltip: { enabled: false },
    dataLabels: {
      enabled: true,
      offsetY: -5,
      style: { fontSize: '10px', fontWeight: 600 },
      formatter: (val) => Math.round(val),
    },
    states: { hover: { filter: { type: 'none' } } },
    grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
  });

  const hourlySeries = [{ name: 'Orders', type: 'bar', data: hourlyOrders }];

  // Prepare status pie chart data
  const statusLabels = data?.orderStatus?.map(item => item._id) || [];
  const statusSeries = data?.orderStatus?.map(item => item.count) || [];
  
  const getStatusColor = (status) => {
    const colors = {
      'PLACED': '#00A76F',
      'CONFIRMED': '#2065D1',
      'PROCESSING': '#FFAB00',
      'SHIPPED': '#8E24AA',
      'DELIVERED': '#1E7E34',
      'CANCELLED': '#FF4842',
      'PENDING': '#919EAB',
      'REFUNDED': '#FF6B4A',
    };
    return colors[status] || theme.palette.grey[500];
  };
  
  const statusColorsArray = statusLabels.map(label => getStatusColor(label));
  const totalOrdersForPie = statusSeries.reduce((a, b) => a + b, 0);

  const pieChartOptions = useChart({
    chart: { type: 'donut' },
    colors: statusColorsArray,
    labels: statusLabels,
    legend: { show: false },
    stroke: { colors: [theme.palette.background.paper], width: 2 },
    dataLabels: {
      enabled: true,
      dropShadow: { enabled: false },
      formatter: (val) => `${val.toFixed(1)}%`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: '600',
              color: theme.palette.text.secondary,
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: '700',
              color: theme.palette.text.primary,
              formatter: (val) => val,
            },
            total: {
              show: true,
              label: 'Total Orders',
              fontSize: '12px',
              fontWeight: '500',
              color: theme.palette.text.secondary,
              formatter: () => totalOrdersForPie,
            },
          },
        },
      },
    },
    tooltip: { enabled: false },
    states: { hover: { filter: { type: 'none' } } },
  });

  if (loading) {
    return (
      <Card {...other}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card {...other}>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card {...other}>
        <Box sx={{ p: 3 }}>
          <Typography>No data available</Typography>
        </Box>
      </Card>
    );
  }

  const hasChartData = labels.length > 0 && orderSeries.length > 0;

  return (
    <Card {...other}>
      <CardHeader
        title={title || 'Order Analytics Dashboard'}
        subheader={subheader || 'Track your order performance and trends'}
        action={
          <Select
            value={period}
            onChange={handlePeriodChange}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="yearly">Yearly</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        }
      />

      <Box sx={{ p: 3 }}>
        {/* Summary Stats Cards - Modified Grid to fit 5 cards nicely */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.neutral' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Total Visitors
              </Typography>
              <Typography variant="h4" color="info.main">
                {visitorCount.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.neutral' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4" color="primary.main">
                {data.summary?.totalOrders?.toLocaleString() || 0}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={4} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.neutral' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" color="success.main">
                ₹{(data.summary?.totalRevenue || 0).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.neutral' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Avg Order Value
              </Typography>
              <Typography variant="h4">
                ₹{(data.summary?.averageOrderValue || 0).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.neutral' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Cancel Rate
              </Typography>
              <Typography variant="h4" color="error.main">
                {(data.cancellation?.cancelRate || 0).toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Main Chart - Order & Revenue Trends */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order & Revenue Trends
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {getPeriodDisplayText()} performance
              </Typography>
              {hasChartData ? (
                <Chart
                  dir="ltr"
                  type="line"
                  series={series}
                  options={chartOptions}
                  width="100%"
                  height={364}
                />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 364 }}>
                  <Typography variant="body2" color="text.secondary">
                    No chart data available for the selected period
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Order Status Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Order Status Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Breakdown by order status
              </Typography>
              
              {statusSeries.length > 0 && totalOrdersForPie > 0 ? (
                <>
                  <Chart
                    type="donut"
                    series={statusSeries}
                    options={pieChartOptions}
                    width="100%"
                    height={340}
                  />
                  <Stack spacing={0.5} sx={{ mt: 2, maxHeight: 100, overflow: 'auto' }}>
                    {statusLabels.map((label, idx) => {
                      const percentage = ((statusSeries[idx] / totalOrdersForPie) * 100).toFixed(1);
                      return (
                        <Box key={label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: statusColorsArray[idx] }} />
                            <Typography variant="caption" color="text.secondary">{label}:</Typography>
                          </Box>
                          <Typography variant="caption" fontWeight="medium">
                            {statusSeries[idx]} ({percentage}%)
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 340 }}>
                  <Typography variant="body2" color="text.secondary">No order status data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Hourly Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Hourly Order Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                When do customers order most?
              </Typography>
              {hourlyOrders.length > 0 && hourlyOrders.some(val => val > 0) ? (
                <Chart
                  dir="ltr"
                  type="bar"
                  series={hourlySeries}
                  options={hourlyChartOptions}
                  width="100%"
                  height={320}
                />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                  <Typography variant="body2" color="text.secondary">No hourly data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Selling Products
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Most popular items {period === 'yearly' ? 'this year' : 'of all time'}
              </Typography>
              {data.topProducts && data.topProducts.length > 0 ? (
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <th style={{ textAlign: 'left', padding: '12px 8px' }}>Product</th>
                        <th style={{ textAlign: 'center', padding: '12px 8px' }}>Quantity</th>
                        <th style={{ textAlign: 'right', padding: '12px 8px' }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProducts.map((product, index) => (
                        <tr key={index} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                          <td style={{ padding: '12px 8px' }}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {product._id.name}
                            </Typography>
                          </td>
                          <td style={{ textAlign: 'center', padding: '12px 8px' }}>
                            <Typography variant="body2">{product.totalQuantity}</Typography>
                          </td>
                          <td style={{ textAlign: 'right', padding: '12px 8px' }}>
                            <Typography variant="body2" color="success.main">
                              ₹{product.totalRevenue.toLocaleString()}
                            </Typography>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="body2" color="text.secondary">No product data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Additional Metrics */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Key Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">Total Delivery Fee Collected</Typography>
                    <Typography variant="subtitle1" fontWeight="bold">₹{(data.summary?.totalDeliveryFee || 0).toLocaleString()}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">Cancelled Orders Revenue</Typography>
                    <Typography variant="subtitle1" color="error.main">₹{(data.cancellation?.cancelledRevenue || 0).toLocaleString()}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">Returning Customers</Typography>
                    <Typography variant="subtitle1" fontWeight="bold">{data.customers?.returningCustomers || 0}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">Avg Time to Deliver</Typography>
                    <Typography variant="subtitle1" fontWeight="bold">{data.fulfillment?.averageTimeToDeliverHours || 0} hours</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}

ViewOrderAnalytics.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
};