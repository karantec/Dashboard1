/* eslint-disable perfectionist/sort-imports */
/* eslint-disable no-unused-vars */
/* eslint-disable perfectionist/sort-named-imports */
/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
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
  Stack,
} from '@mui/material';

import { analyticsService } from 'src/services/ApiService';
import AppWidgetSummary from '../app-widget-summary';

// ─── Helpers ─────────────────────────────────────────────────
const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${Number(amount).toLocaleString()}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ─── Recent Users Table ─────────────────────────────────────
function RecentUsersTable({ users }) {
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent Users
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Joined</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No users yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={u.avatar || undefined}
                        sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}
                      >
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                      <Typography variant="body2">{u.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{u.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.role}
                      size="small"
                      color={u.role === 'admin' ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{formatDate(u.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// ─── Recent Cart Activity Table ─────────────────────────────
function RecentCartTable({ activity }) {
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent Cart Activity
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Product</strong></TableCell>
              <TableCell align="center"><strong>Qty</strong></TableCell>
              <TableCell><strong>Added</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activity.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No cart activity yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              activity.map((row) => (
                <TableRow key={row.cart_item_id} hover>
                  <TableCell>
                    <Typography variant="body2">{row.user_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.user_email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.product_name}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={row.quantity} size="small" color="primary" />
                  </TableCell>
                  <TableCell>{formatDate(row.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// ─── Category Breakdown Table ───────────────────────────────
function CategoryBreakdown({ categories }) {
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Category Breakdown
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell align="center"><strong>Products</strong></TableCell>
              <TableCell align="right"><strong>Avg Price</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No categories yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={c.image || undefined}
                        variant="rounded"
                        sx={{ width: 28, height: 28 }}
                      >
                        {c.name?.charAt(0)?.toUpperCase() || 'C'}
                      </Avatar>
                      <Typography variant="body2">{c.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={c.product_count} size="small" color="info" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(c.avg_price)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// ─── Main View ──────────────────────────────────────────────
export default function AppView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const dashboard = await analyticsService.getDashboard();
        setData(dashboard);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to load dashboard'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Typography variant="h6" color="error" sx={{ mt: 4 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  const { overview, catalog_value, recent_users, recent_cart_activity, category_breakdown } = data;

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>
        Hi, Welcome back 👋
      </Typography>

      {/* ─── KPI Widgets ─────────────────────────────────────── */}
      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Categories"
            total={overview.total_categories}
            color="success"
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Products"
            total={overview.total_products}
            color="info"
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Total Users"
            total={overview.total_users}
            color="warning"
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Cart Items"
            total={overview.total_cart_items}
            color="error"
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Low Stock"
            total={overview.low_stock}
            color="warning"
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Out of Stock"
            total={overview.out_of_stock}
            color="error"
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Active Products"
            total={overview.active_products}
            color="success"
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Users With Cart"
            total={overview.users_with_cart}
            color="info"
          />
        </Grid>

        {/* ─── Inventory Value Card ─────────────────────────── */}
        <Grid xs={12} md={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Catalog Value
            </Typography>
            <Stack direction="row" spacing={4} flexWrap="wrap">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Inventory Value
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(catalog_value.total_inventory_value)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Avg Product Price
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(catalog_value.avg_product_price)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Max Price
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(catalog_value.max_price)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Min Price
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(catalog_value.min_price)}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* ─── Tables ─────────────────────────────────────────── */}
        <Grid xs={12} md={6}>
          <RecentUsersTable users={recent_users} />
        </Grid>

        <Grid xs={12} md={6}>
          <CategoryBreakdown categories={category_breakdown} />
        </Grid>

        <Grid xs={12} md={12}>
          <RecentCartTable activity={recent_cart_activity} />
        </Grid>
      </Grid>
    </Container>
  );
}