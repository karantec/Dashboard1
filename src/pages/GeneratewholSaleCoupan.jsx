/* eslint-disable perfectionist/sort-named-imports */
/* eslint-disable react/prop-types */
/* eslint-disable */
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Snackbar,
  Typography,
  Chip,
  TextField,
  MenuItem,
  Alert,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
// Remove the icons import - comment out or delete this line
// import {
//   Refresh as RefreshIcon,
//   Block as BlockIcon,
//   LocalOffer as CouponIcon,
// } from "@mui/icons-material";

import {
  getAllWholesalers,
  getAllCoupons,
  applyCouponToWholesaler,
  getWholesalerCoupons,
  revokeCouponFromWholesaler,
  getCouponStatistics,
  formatCouponDiscount,
  isCouponExpired,
  getCouponStatusInfo,
  bulkApplyCoupon,
} from "../services/WholeSaleService";

const primaryButtonStyle = {
  bgcolor: "#dc2626",
  color: "white",
  "&:hover": { bgcolor: "#b91c1c" },
  "&.Mui-disabled": {
    bgcolor: "#fca5a5",
    color: "white",
  },
};

const secondaryButtonStyle = {
  borderColor: "#dc2626",
  color: "#dc2626",
  "&:hover": {
    borderColor: "#b91c1c",
    color: "#b91c1c",
    bgcolor: "rgba(220, 38, 38, 0.04)",
  },
};

export default function WholesaleCouponManager() {
  const [wholesalers, setWholesalers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selectedWholesaler, setSelectedWholesaler] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [applicationHistory, setApplicationHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [bulkWholesalers, setBulkWholesalers] = useState([]);
  const [bulkCoupon, setBulkCoupon] = useState("");
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");

  useEffect(() => {
    fetchInitialData();
    fetchStatistics();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [wholesalersRes, couponsRes] = await Promise.all([
        getAllWholesalers(),
        getAllCoupons(),
      ]);
      
      setWholesalers(wholesalersRes.wholesalers || wholesalersRes.data || []);
      setCoupons(couponsRes.data || couponsRes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error fetching data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await getCouponStatistics();
      setStatistics(stats.data || stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchWholesalerHistory = async (wholesalerId) => {
    if (!wholesalerId) return;
    try {
      const history = await getWholesalerCoupons(wholesalerId);
      setApplicationHistory(history.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      setApplicationHistory([]);
    }
  };

  const handleWholesalerChange = (event) => {
    const wholesalerId = event.target.value;
    setSelectedWholesaler(wholesalerId);
    if (wholesalerId) {
      fetchWholesalerHistory(wholesalerId);
    } else {
      setApplicationHistory([]);
    }
  };

  const handleApplyCoupon = async () => {
    if (!selectedWholesaler) {
      setSnackbar({
        open: true,
        message: "Please select a wholesaler",
        severity: "error",
      });
      return;
    }

    if (!selectedCoupon) {
      setSnackbar({
        open: true,
        message: "Please select a coupon",
        severity: "error",
      });
      return;
    }

    const wholesaler = wholesalers.find(w => w._id === selectedWholesaler);
    const coupon = coupons.find(c => c._id === selectedCoupon);

    setApplying(true);
    try {
      await applyCouponToWholesaler(selectedWholesaler, coupon.code);
      
      setSnackbar({
        open: true,
        message: `Coupon ${coupon.code} applied to ${wholesaler?.storeName} successfully!`,
        severity: "success",
      });
      
      await fetchWholesalerHistory(selectedWholesaler);
      await fetchStatistics();
      
      setSelectedWholesaler("");
      setSelectedCoupon("");
      
    } catch (error) {
      console.error("Error applying coupon:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to apply coupon",
        severity: "error",
      });
    } finally {
      setApplying(false);
    }
  };

  const handleRevokeCoupon = async () => {
    if (!selectedApplication) return;

    try {
      await revokeCouponFromWholesaler(selectedApplication._id, revokeReason);
      
      setSnackbar({
        open: true,
        message: "Coupon revoked successfully",
        severity: "success",
      });
      
      await fetchWholesalerHistory(selectedWholesaler);
      await fetchStatistics();
      
      setRevokeDialogOpen(false);
      setSelectedApplication(null);
      setRevokeReason("");
    } catch (error) {
      console.error("Error revoking coupon:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to revoke coupon",
        severity: "error",
      });
    }
  };

  const handleBulkApply = async () => {
    if (bulkWholesalers.length === 0) {
      setSnackbar({
        open: true,
        message: "Please select at least one wholesaler",
        severity: "error",
      });
      return;
    }

    if (!bulkCoupon) {
      setSnackbar({
        open: true,
        message: "Please select a coupon",
        severity: "error",
      });
      return;
    }

    const coupon = coupons.find(c => c._id === bulkCoupon);
    setApplying(true);
    
    try {
      const result = await bulkApplyCoupon(bulkWholesalers, coupon.code);
      
      setSnackbar({
        open: true,
        message: result.message || `Applied to ${result.data?.success?.length || 0} wholesalers`,
        severity: "success",
      });
      
      await fetchStatistics();
      setBulkWholesalers([]);
      setBulkCoupon("");
      
    } catch (error) {
      console.error("Error bulk applying:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to apply coupons",
        severity: "error",
      });
    } finally {
      setApplying(false);
    }
  };

  const openRevokeDialog = (application) => {
    setSelectedApplication(application);
    setRevokeDialogOpen(true);
  };

  const selectedWholesalerDetails = wholesalers.find(w => w._id === selectedWholesaler);
  const selectedCouponDetails = coupons.find(c => c._id === selectedCoupon);

  if (loading && !wholesalers.length) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: "#dc2626" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="600" color="#1f2937">
            Wholesale Coupon Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Apply coupons to wholesalers, track usage, and manage applications
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton onClick={() => { fetchInitialData(); fetchStatistics(); }}>
            🔄
          </IconButton>
        </Tooltip>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fef2f2" }}>
              <Typography variant="h4" fontWeight="700" color="#dc2626">
                {statistics.totalApplications || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Applications</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f0fdf4" }}>
              <Typography variant="h4" fontWeight="700" color="#16a34a">
                {statistics.uniqueWholesalers || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Wholesalers Served</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fefce8" }}>
              <Typography variant="h4" fontWeight="700" color="#ca8a04">
                {statistics.uniqueCoupons || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Unique Coupons Used</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#eff6ff" }}>
              <Typography variant="h4" fontWeight="700" color="#2563eb">
                {statistics.statusBreakdown?.find(s => s._id === "ACTIVE")?.count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Active Coupons</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Single Apply" />
        <Tab label="Bulk Apply" />
        <Tab label="Application History" />
      </Tabs>

      {/* Tab 1: Single Apply */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Apply Coupon to Wholesaler
                </Typography>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select Wholesaler</InputLabel>
                  <Select
                    value={selectedWholesaler}
                    onChange={handleWholesalerChange}
                    label="Select Wholesaler"
                    disabled={applying}
                  >
                    {wholesalers.map((wholesaler) => (
                      <MenuItem key={wholesaler._id} value={wholesaler._id}>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Typography variant="body1" fontWeight="500">
                            {wholesaler.storeName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            PIN: {wholesaler.pincode || wholesaler.pin} | {wholesaler.city}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select a wholesaler from the list</FormHelperText>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select Coupon</InputLabel>
                  <Select
                    value={selectedCoupon}
                    onChange={(e) => setSelectedCoupon(e.target.value)}
                    label="Select Coupon"
                    disabled={applying}
                  >
                    {coupons.map((coupon) => (
                      <MenuItem key={coupon._id} value={coupon._id}>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body1" fontWeight="600" color="#dc2626">
                              {coupon.code}
                            </Typography>
                            <Chip 
                              label={formatCouponDiscount(coupon)} 
                              size="small" 
                              sx={{ bgcolor: "#fee2e2", color: "#dc2626" }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Min Order: ₹{coupon.minOrderAmount?.toLocaleString()}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select a coupon to apply</FormHelperText>
                </FormControl>

                {(selectedWholesalerDetails || selectedCouponDetails) && (
                  <Paper sx={{ p: 2, mb: 3, bgcolor: "#f9fafb", borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight="600" mb={1}>
                      Selected Details:
                    </Typography>
                    {selectedWholesalerDetails && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <strong>Wholesaler:</strong> {selectedWholesalerDetails.storeName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Email:</strong> {selectedWholesalerDetails.email}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Phone:</strong> {selectedWholesalerDetails.phoneNumber}
                        </Typography>
                      </Box>
                    )}
                    {selectedCouponDetails && (
                      <Box>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2">
                          <strong>Coupon:</strong> {selectedCouponDetails.code}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Discount:</strong> {formatCouponDiscount(selectedCouponDetails)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Valid Till:</strong> {new Date(selectedCouponDetails.validTill).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}

                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedWholesaler("");
                      setSelectedCoupon("");
                      setApplicationHistory([]);
                    }}
                    sx={secondaryButtonStyle}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleApplyCoupon}
                    disabled={!selectedWholesaler || !selectedCoupon || applying}
                    sx={primaryButtonStyle}
                  >
                    {applying ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Apply Coupon"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={2}>
                  Recent Applications
                </Typography>
                {applicationHistory.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography sx={{ fontSize: 48, mb: 1 }}>🎫</Typography>
                    <Typography color="text.secondary">No coupons applied yet</Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                    {applicationHistory.map((app) => {
                      const statusInfo = getCouponStatusInfo(app.status, app.expiryDate);
                      return (
                        <Paper key={app._id} sx={{ p: 2, mb: 2, bgcolor: "#f9fafb", position: "relative" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Box>
                              <Chip 
                                label={app.couponCode} 
                                size="small" 
                                sx={{ bgcolor: "#dc2626", color: "white", mb: 1 }}
                              />
                              <Typography variant="body2">
                                <strong>Discount:</strong> {formatCouponDiscount(app)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Status:</strong> 
                                <Chip 
                                  label={statusInfo.text} 
                                  size="small" 
                                  color={statusInfo.color}
                                  sx={{ ml: 1 }} 
                                />
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Applied: {new Date(app.appliedAt).toLocaleString()}
                              </Typography>
                            </Box>
                            {app.status === "ACTIVE" && !isCouponExpired(app.expiryDate) && (
                              <Tooltip title="Revoke Coupon">
                                <IconButton size="small" onClick={() => openRevokeDialog(app)}>
                                  🚫
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Bulk Apply */}
      {activeTab === 1 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" mb={3}>
              Bulk Apply Coupon to Multiple Wholesalers
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Wholesalers (Multiple)</InputLabel>
              <Select
                multiple
                value={bulkWholesalers}
                onChange={(e) => setBulkWholesalers(e.target.value)}
                label="Select Wholesalers (Multiple)"
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const wholesaler = wholesalers.find(w => w._id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={wholesaler?.storeName} 
                          size="small" 
                          sx={{ bgcolor: "#fee2e2" }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {wholesalers.map((wholesaler) => (
                  <MenuItem key={wholesaler._id} value={wholesaler._id}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography>{wholesaler.storeName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {wholesaler.city} - {wholesaler.pincode || wholesaler.pin}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>You can select multiple wholesalers</FormHelperText>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Coupon</InputLabel>
              <Select
                value={bulkCoupon}
                onChange={(e) => setBulkCoupon(e.target.value)}
                label="Select Coupon"
              >
                {coupons.map((coupon) => (
                  <MenuItem key={coupon._id} value={coupon._id}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography fontWeight="600" color="#dc2626">{coupon.code}</Typography>
                      <Typography variant="caption">{formatCouponDiscount(coupon)}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleBulkApply}
                disabled={bulkWholesalers.length === 0 || !bulkCoupon || applying}
                sx={primaryButtonStyle}
              >
                {applying ? <CircularProgress size={24} /> : `Apply to ${bulkWholesalers.length} Wholesaler(s)`}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: All Applications */}
      {activeTab === 2 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" mb={2}>
              All Coupon Applications
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f9fafb" }}>
                    <TableCell>Wholesaler</TableCell>
                    <TableCell>Coupon Code</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applicationHistory.map((app) => {
                    const wholesaler = wholesalers.find(w => w._id === app.wholesaler);
                    const statusInfo = getCouponStatusInfo(app.status, app.expiryDate);
                    const isExpired = isCouponExpired(app.expiryDate);
                    return (
                      <TableRow key={app._id}>
                        <TableCell>{wholesaler?.storeName || app.wholesaler}</TableCell>
                        <TableCell>
                          <Chip label={app.couponCode} size="small" sx={{ bgcolor: "#fee2e2", color: "#dc2626" }} />
                        </TableCell>
                        <TableCell>{formatCouponDiscount(app)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={statusInfo.text} 
                            size="small"
                            color={statusInfo.color}
                          />
                        </TableCell>
                        <TableCell>{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(app.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {app.status === "ACTIVE" && !isExpired && (
                            <Tooltip title="Revoke">
                              <IconButton size="small" onClick={() => openRevokeDialog(app)}>
                                🚫
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {applicationHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" py={4}>
                          No coupon applications found. Select a wholesaler to view history.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Revoke Coupon</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to revoke coupon <strong>{selectedApplication?.couponCode}</strong>?
          </Typography>
          <TextField
            fullWidth
            label="Reason (Optional)"
            multiline
            rows={3}
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="Enter reason for revoking this coupon"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRevokeCoupon} variant="contained" color="error">
            Revoke Coupon
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, message: "", severity: "success" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            width: "100%",
            bgcolor: snackbar.severity === "error" ? "#dc2626" : "#10b981",
            color: "white",
            "& .MuiAlert-icon": { color: "white" },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}