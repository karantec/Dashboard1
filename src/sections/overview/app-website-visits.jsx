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
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get period display text
  const getPeriodDisplayText = () => {
    switch (period) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return 'Monthly';
    }
  };

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:8000/api/order/analytics?period=${period}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        setData(response.data.data);
      } catch (err) {
        console.error('Error fetching order analytics:', err);
        setError(err.response?.data?.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };

  // Prepare chart data based on period
  const getChartData = () => {
    if (!data) return { labels: [], orderSeries: [], revenueSeries: [] };

    let trendsData = [];
    let labels = [];

    if (period === 'daily' && data.trends?.daily) {
      trendsData = data.trends.daily;
      labels = trendsData.map(item => item._id);
    } else if (period === 'weekly' && data.trends?.weekly) {
      trendsData = data.trends.weekly;
      labels = trendsData.map(item => `Week ${item._id.split('-')[1]}`);
    } else if (period === 'monthly' && data.trends?.monthly) {
      trendsData = data.trends.monthly;
      labels = trendsData.map(item => {
        const [year, month] = item._id.split('-');
        return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
      });
    } else if (period === 'yearly' && data.trends?.yearly) {
      trendsData = data.trends.yearly;
      labels = trendsData.map(item => item._id);
    }

    const orderSeries = trendsData.map(item => item.orders);
    const revenueSeries = trendsData.map(item => item.revenue);

    return { labels, orderSeries, revenueSeries };
  };

  const { labels, orderSeries, revenueSeries } = getChartData();

  // Chart options
  const chartOptions = useChart({
    colors: ['#00A76F', '#FFAB00'],
    plotOptions: {
      bar: {
        columnWidth: '16%',
        borderRadius: 4,
      },
    },
    fill: {
      type: ['solid', 'gradient'],
    },
    labels: labels,
    xaxis: {
      type: period === 'daily' ? 'datetime' : 'category',
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Orders / Revenue (₹)',
        style: {
          fontSize: '12px',
        },
      },
      labels: {
        formatter: (value) => `${value.toFixed(0)}`,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value, { seriesIndex }) => {
          if (seriesIndex === 0) {
            return `${value} orders`;
          }
          return `₹${value.toFixed(2)}`;
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
    },
    stroke: {
      width: [0, 2],
      curve: 'smooth',
    },
  });

  const series = [
    {
      name: 'Orders',
      type: 'column',
      data: orderSeries,
      fill: 'solid',
    },
    {
      name: 'Revenue (₹)',
      type: 'line',
      data: revenueSeries,
      fill: 'gradient',
    },
  ];

  // Prepare hourly distribution data
  const hourlyLabels = data?.trends?.hourlyDistribution?.map(item => `${item._id}:00`) || [];
  const hourlyOrders = data?.trends?.hourlyDistribution?.map(item => item.orders) || [];

  const hourlyChartOptions = useChart({
    colors: ['#2065D1'],
    plotOptions: {
      bar: {
        columnWidth: '70%',
        borderRadius: 4,
      },
    },
    labels: hourlyLabels,
    xaxis: {
      title: {
        text: 'Hour of Day',
        style: {
          fontSize: '12px',
        },
      },
      labels: {
        rotate: -45,
      },
    },
    yaxis: {
      title: {
        text: 'Number of Orders',
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} orders`,
      },
    },
  });

  const hourlySeries = [
    {
      name: 'Orders',
      type: 'bar',
      data: hourlyOrders,
    },
  ];

  // Prepare status pie chart data
  const statusColors = {
    PLACED: theme.palette.success.main,
    CONFIRMED: theme.palette.info.main,
    PROCESSING: theme.palette.warning.main,
    SHIPPED: theme.palette.secondary.main,
    DELIVERED: theme.palette.success.dark,
    CANCELLED: theme.palette.error.main,
  };

  const statusLabels = data?.orderStatus?.map(item => item._id) || [];
  const statusSeries = data?.orderStatus?.map(item => item.count) || [];
  const statusColorsArray = statusLabels.map(label => statusColors[label] || theme.palette.grey[500]);

  const pieChartOptions = useChart({
    labels: statusLabels,
    colors: statusColorsArray,
    legend: {
      position: 'bottom',
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} orders`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
        },
        dataLabels: {
          offset: -10,
        },
      },
    },
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
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        }
      />

      <Box sx={{ p: 3 }}>
        {/* Summary Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.neutral' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4" color="primary.main">
                {data.summary?.totalOrders?.toLocaleString() || 0}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.neutral' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" color="success.main">
                ₹{(data.summary?.totalRevenue || 0).toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.neutral' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Average Order Value
              </Typography>
              <Typography variant="h4">
                ₹{(data.summary?.averageOrderValue || 0).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.neutral' }}>
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
              <Chart
                dir="ltr"
                type="line"
                series={series}
                options={chartOptions}
                width="100%"
                height={364}
              />
            </Paper>
          </Grid>

          {/* Order Status Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Order Status Distribution
              </Typography>
              {statusSeries.length > 0 ? (
                <Chart
                  dir="ltr"
                  type="donut"
                  series={statusSeries}
                  options={pieChartOptions}
                  width="100%"
                  height={320}
                />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                  <Typography variant="body2" color="text.secondary">
                    No order data available
                  </Typography>
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
              {hourlyOrders.length > 0 ? (
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
                  <Typography variant="body2" color="text.secondary">
                    No hourly data available
                  </Typography>
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
                Most popular items this {getPeriodDisplayText().toLowerCase()}
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
                  <Typography variant="body2" color="text.secondary">
                    No product data available
                  </Typography>
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
                    <Typography variant="caption" color="text.secondary">
                      Total Delivery Fee Collected
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold">
                      ₹{(data.summary?.totalDeliveryFee || 0).toLocaleString()}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Cancelled Orders Revenue
                    </Typography>
                    <Typography variant="subtitle1" color="error.main">
                      ₹{(data.cancellation?.cancelledRevenue || 0).toLocaleString()}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Returning Customers
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {data.customers?.returningCustomers || 0}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Avg Time to Deliver
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {data.fulfillment?.averageTimeToDeliverHours || 0} hours
                    </Typography>
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