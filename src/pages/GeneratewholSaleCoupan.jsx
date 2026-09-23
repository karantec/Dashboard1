// src/components/TickerBarManager.jsx
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
  Alert,
  Paper,
  Divider,
  FormControlLabel,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";

import {
  getTickerBar,
  updateTickerBar,
  toggleActive,
  addItem,
  updateItem,
  deleteItem,
} from "../services/TickerBarService";

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

const EMPTY_FORM = { text: "", link: "", order: 0, isActive: true };

/** Unwraps { success, data } envelopes OR returns the raw body */
const unwrap = (body) =>
  body && typeof body === "object" && "data" in body ? body.data : body;

const sortByOrder = (list) =>
  [...list].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

export default function TickerBarManager() {
  const [items, setItems] = useState([]);
  const [isActive, setIsActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [activeTab, setActiveTab] = useState(0);
  const [orderDirty, setOrderDirty] = useState(false);

  // Item form (single apply tab)
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const toast = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  // ─────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const body = await getTickerBar();
      const data = unwrap(body) || {};
      const list = Array.isArray(data.items) ? sortByOrder(data.items) : [];

      setItems(list);
      setIsActive(Boolean(data.isActive));
      setOrderDirty(false);
    } catch (error) {
      console.error("Error fetching ticker bar:", error);
      setItems([]);
      setIsActive(false);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || "Error fetching ticker bar data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Form handlers (Tab 0)
  // ─────────────────────────────────────────────
  const handleFormChange = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const resetForm = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setForm({
      text: item.text ?? item.message ?? "",
      link: item.link ?? "",
      order: item.order ?? 0,
      isActive: item.isActive !== false,
    });
    setActiveTab(0);
  };

  const handleSubmitItem = async () => {
    if (!form.text.trim()) {
      toast("Ticker text is required", "error");
      return;
    }

    const payload = {
      text: form.text.trim(),
      link: form.link.trim(),
      order: Number(form.order) || 0,
      isActive: Boolean(form.isActive),
    };

    setSaving(true);
    try {
      if (editingItem) {
        const body = await updateItem(editingItem._id, payload);
        const updated = unwrap(body);

        setItems((prev) =>
          sortByOrder(
            prev.map((i) =>
              i._id === editingItem._id
                ? updated && updated._id
                  ? updated
                  : { ...i, ...payload }
                : i
            )
          )
        );

        toast("Ticker item updated successfully!", "success");
      } else {
        const body = await addItem(payload);
        const created = unwrap(body);

        setItems((prev) =>
          sortByOrder([
            ...prev,
            created && created._id
              ? created
              : { ...payload, _id: `temp-${Date.now()}` },
          ])
        );

        toast("Ticker item added successfully!", "success");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving ticker item:", error);
      toast(
        error.response?.data?.message || "Failed to save ticker item",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    setSaving(true);
    try {
      await deleteItem(itemToDelete._id);

      setItems((prev) => prev.filter((i) => i._id !== itemToDelete._id));
      toast("Ticker item deleted successfully", "success");

      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting ticker item:", error);
      toast(
        error.response?.data?.message || "Failed to delete ticker item",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Settings handlers (Tab 1)
  // ─────────────────────────────────────────────
  const handleToggleActive = async () => {
    setSaving(true);
    try {
      const body = await toggleActive();
      const data = unwrap(body) || {};

      const next =
        typeof data.isActive === "boolean" ? data.isActive : !isActive;

      setIsActive(next);
      if (Array.isArray(data.items)) setItems(sortByOrder(data.items));

      toast(`Ticker bar ${next ? "activated" : "deactivated"}`, "success");
    } catch (error) {
      console.error("Error toggling ticker bar:", error);
      toast(
        error.response?.data?.message || "Failed to toggle ticker bar",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const moveItem = (index, direction) => {
    setItems((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setOrderDirty(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = {
        isActive,
        items: items.map((it, idx) => ({ ...it, order: idx })),
      };

      const body = await updateTickerBar(payload);
      const data = unwrap(body);

      if (data && Array.isArray(data.items)) {
        setItems(sortByOrder(data.items));
      } else {
        setItems(payload.items);
      }

      setOrderDirty(false);
      toast("Ticker bar saved successfully", "success");
    } catch (error) {
      console.error("Error saving ticker bar:", error);
      toast(
        error.response?.data?.message || "Failed to save ticker bar",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────
  const activeItems = items.filter((i) => i.isActive !== false);
  const inactiveItems = items.filter((i) => i.isActive === false);

  if (loading && !items.length) {
    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress sx={{ color: "#dc2626" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      {/* ── Header ───────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="600" color="#1f2937">
            Ticker Bar Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add announcements, reorder them, and control visibility on the
            storefront
          </Typography>
        </Box>

        <Tooltip title="Refresh Data">
          <span>
            <IconButton
              onClick={fetchInitialData}
              disabled={loading || saving}
            >
              {loading ? <CircularProgress size={22} /> : "🔄"}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* ── Statistics Cards ─────────────────── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fef2f2" }}>
            <Typography variant="h4" fontWeight="700" color="#dc2626">
              {items.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Items
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f0fdf4" }}>
            <Typography variant="h4" fontWeight="700" color="#16a34a">
              {activeItems.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visible Items
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fefce8" }}>
            <Typography variant="h4" fontWeight="700" color="#ca8a04">
              {inactiveItems.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hidden Items
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#eff6ff" }}>
            <Typography
              variant="h4"
              fontWeight="700"
              color={isActive ? "#2563eb" : "#9ca3af"}
            >
              {isActive ? "ON" : "OFF"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ticker Status
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Tabs ─────────────────────────────── */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{ mb: 3 }}
      >
        <Tab label="Manage Items" />
        <Tab label="Settings & Preview" />
      </Tabs>

      {/* ── Tab 1: Manage Items ──────────────── */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          {/* Left — form */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" fontWeight="600">
                    {editingItem ? "Edit Ticker Item" : "Add Ticker Item"}
                  </Typography>

                  {editingItem && (
                    <Chip
                      label={`Editing: ${
                        editingItem.text || editingItem.message
                      }`}
                      size="small"
                      sx={{
                        bgcolor: "#fee2e2",
                        color: "#dc2626",
                        maxWidth: 240,
                      }}
                    />
                  )}
                </Box>

                <TextField
                  fullWidth
                  required
                  label="Ticker Text"
                  value={form.text}
                  onChange={(e) => handleFormChange("text", e.target.value)}
                  placeholder="e.g. Free shipping on orders above ₹999"
                  sx={{ mb: 3 }}
                  helperText="This is the announcement that scrolls on the storefront"
                />

                <TextField
                  fullWidth
                  label="Link (Optional)"
                  value={form.link}
                  onChange={(e) => handleFormChange("link", e.target.value)}
                  placeholder="https://example.com/offers"
                  sx={{ mb: 3 }}
                  helperText="Clicking the ticker text will open this URL"
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Order"
                  value={form.order}
                  onChange={(e) => handleFormChange("order", e.target.value)}
                  sx={{ mb: 2 }}
                  helperText="Lower numbers appear first"
                />

                <FormControlLabel
                  sx={{ mb: 3 }}
                  control={
                    <Switch
                      checked={form.isActive}
                      onChange={(e) =>
                        handleFormChange("isActive", e.target.checked)
                      }
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#dc2626",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                          { bgcolor: "#dc2626" },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Visible on storefront
                    </Typography>
                  }
                />

                {/* Preview of current form */}
                {(form.text || form.link) && (
                  <Paper
                    sx={{
                      p: 2,
                      mb: 3,
                      bgcolor: "#f9fafb",
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="600" mb={1}>
                      Preview:
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: "#111827",
                        color: "#fff",
                        borderRadius: 1.5,
                        py: 1,
                        px: 2,
                        overflow: "hidden",
                        opacity: form.isActive ? 1 : 0.45,
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{ fontSize: 14, fontWeight: 500 }}
                      >
                        {form.text || "Your ticker text here"}
                      </Typography>
                    </Box>
                    {form.link && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          mt: 1,
                          wordBreak: "break-all",
                        }}
                      >
                        🔗 {form.link}
                      </Typography>
                    )}
                  </Paper>
                )}

                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    sx={secondaryButtonStyle}
                  >
                    {editingItem ? "Cancel Edit" : "Reset"}
                  </Button>

                  <Button
                    variant="contained"
                    onClick={handleSubmitItem}
                    disabled={!form.text.trim() || saving}
                    sx={primaryButtonStyle}
                  >
                    {saving ? (
                      <CircularProgress
                        size={24}
                        sx={{ color: "white" }}
                      />
                    ) : editingItem ? (
                      "Update Item"
                    ) : (
                      "Add Item"
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right — recent items list */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={2}>
                  Ticker Items
                </Typography>

                {items.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography sx={{ fontSize: 48, mb: 1 }}>🎫</Typography>
                    <Typography color="text.secondary">
                      No ticker items yet
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 520, overflowY: "auto" }}>
                    {items.map((item) => {
                      const hidden = item.isActive === false;

                      return (
                        <Paper
                          key={item._id}
                          sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: "#f9fafb",
                            position: "relative",
                            borderLeft: hidden
                              ? "4px solid #d1d5db"
                              : "4px solid #dc2626",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 1,
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 0.5,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight="600"
                                  sx={{
                                    wordBreak: "break-word",
                                    textDecoration: hidden
                                      ? "line-through"
                                      : "none",
                                    color: hidden ? "#9ca3af" : "#1f2937",
                                  }}
                                >
                                  {item.text || item.message}
                                </Typography>

                                <Chip
                                  label={hidden ? "Hidden" : "Visible"}
                                  size="small"
                                  sx={{
                                    bgcolor: hidden
                                      ? "#f3f4f6"
                                      : "#dcfce7",
                                    color: hidden ? "#6b7280" : "#16a34a",
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>

                              {item.link ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: "block",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  🔗 {item.link}
                                </Typography>
                              ) : (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  No link attached
                                </Typography>
                              )}

                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.5 }}
                              >
                                Order: {item.order ?? 0}
                              </Typography>
                            </Box>

                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Tooltip title="Edit Item">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditClick(item)}
                                >
                                  ✏️
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Delete Item">
                                <IconButton
                                  size="small"
                                  onClick={() => openDeleteDialog(item)}
                                >
                                  🗑️
                                </IconButton>
                              </Tooltip>
                            </Box>
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

      {/* ── Tab 2: Settings & Preview ────────── */}
      {activeTab === 1 && (
        <Grid container spacing={4}>
          {/* Left — settings + reorder */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="600" mb={3}>
                  Ticker Settings
                </Typography>

                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: "#f9fafb",
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight="600">
                      Ticker Status
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Turn the ticker bar on or off across the storefront
                    </Typography>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={isActive}
                        onChange={handleToggleActive}
                        disabled={saving}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#dc2626",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            { bgcolor: "#dc2626" },
                        }}
                      />
                    }
                    label={
                      <Chip
                        label={isActive ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                          bgcolor: isActive ? "#dcfce7" : "#f3f4f6",
                          color: isActive ? "#16a34a" : "#6b7280",
                          fontWeight: 600,
                        }}
                      />
                    }
                  />
                </Paper>

                <Divider sx={{ mb: 3 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="600">
                      Reorder Items
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Use arrows to change the display order, then save
                    </Typography>
                  </Box>

                  {orderDirty && (
                    <Button
                      variant="contained"
                      onClick={handleSaveAll}
                      disabled={saving}
                      sx={primaryButtonStyle}
                    >
                      {saving ? (
                        <CircularProgress
                          size={22}
                          sx={{ color: "white" }}
                        />
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  )}
                </Box>

                {items.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography sx={{ fontSize: 40, mb: 1 }}>🎫</Typography>
                    <Typography color="text.secondary">
                      No items to reorder
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    {items.map((item, index) => (
                      <Paper
                        key={item._id}
                        sx={{
                          p: 2,
                          bgcolor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <Tooltip title="Move up">
                            <span>
                              <IconButton
                                size="small"
                                disabled={index === 0}
                                onClick={() => moveItem(index, -1)}
                              >
                                ▲
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Chip
                            label={index + 1}
                            size="small"
                            sx={{
                              bgcolor: "#fee2e2",
                              color: "#dc2626",
                              my: 0.5,
                            }}
                          />

                          <Tooltip title="Move down">
                            <span>
                              <IconButton
                                size="small"
                                disabled={index === items.length - 1}
                                onClick={() => moveItem(index, 1)}
                              >
                                ▼
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight="600"
                            sx={{
                              wordBreak: "break-word",
                              color:
                                item.isActive === false
                                  ? "#9ca3af"
                                  : "#1f2937",
                            }}
                          >
                            {item.text || item.message}
                          </Typography>

                          {item.link && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ wordBreak: "break-all" }}
                            >
                              🔗 {item.link}
                            </Typography>
                          )}
                        </Box>

                        {item.isActive === false && (
                          <Chip
                            label="Hidden"
                            size="small"
                            sx={{
                              bgcolor: "#f3f4f6",
                              color: "#6b7280",
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}

                {orderDirty && (
                  <Alert severity="warning" sx={{ mt: 3 }}>
                    You have unsaved order changes. Click{" "}
                    <strong>Save Changes</strong> to persist the new order.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right — live preview */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" mb={2}>
                  Live Preview
                </Typography>

                {activeItems.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography sx={{ fontSize: 48, mb: 1 }}>📢</Typography>
                    <Typography color="text.secondary">
                      No visible items yet
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      overflow: "hidden",
                      bgcolor: "#111827",
                      color: "#fff",
                      borderRadius: 2,
                      py: 1.2,
                      opacity: isActive ? 1 : 0.45,
                    }}
                  >
                    <Box
                      sx={{
                        display: "inline-flex",
                        gap: 6,
                        whiteSpace: "nowrap",
                        animation: isActive
                          ? "tickerScroll 25s linear infinite"
                          : "none",
                        "@keyframes tickerScroll": {
                          "0%": { transform: "translateX(0)" },
                          "100%": { transform: "translateX(-50%)" },
                        },
                        "&:hover": { animationPlayState: "paused" },
                      }}
                    >
                      {[...activeItems, ...activeItems].map((item, idx) => (
                        <Typography
                          key={`${item._id}-${idx}`}
                          component="span"
                          sx={{ fontSize: 14, fontWeight: 500 }}
                        >
                          {item.link ? (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#fca5a5",
                                textDecoration: "none",
                                fontWeight: 600,
                              }}
                            >
                              {item.text || item.message}
                            </a>
                          ) : (
                            item.text || item.message
                          )}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}

                {!isActive && activeItems.length > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    The ticker bar is currently <strong>inactive</strong> and
                    will not be shown on the storefront.
                  </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" fontWeight="600" mb={1}>
                  Summary
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Total items
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {items.length}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Visible items
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    color="#16a34a"
                  >
                    {activeItems.length}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Hidden items
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    color="#6b7280"
                  >
                    {inactiveItems.length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Delete Dialog ────────────────────── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Ticker Item</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete{" "}
            <strong>{itemToDelete?.text || itemToDelete?.message}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteItem}
            variant="contained"
            color="error"
            disabled={saving}
          >
            {saving ? <CircularProgress size={22} /> : "Delete Item"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ─────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar({ open: false, message: "", severity: "success" })
        }
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