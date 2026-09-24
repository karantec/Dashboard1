/* eslint-disable */
import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Rating,
  Snackbar,
  Alert,
  Box,
  TextField,
  Chip,
  Divider,
  Avatar,
  CircularProgress,
  InputAdornment,
} from "@mui/material";

// ─── Config ───────────────────────────────────────────────────────
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://lifestyle-backend-lime.vercel.app";

const getAdminToken = () =>
  localStorage.getItem("adminToken") ||
  localStorage.getItem("admin_token") ||
  localStorage.getItem("token") ||
  null;

// ─── Theme ────────────────────────────────────────────────────────
const theme = {
  primary: "#1565C0",
  primaryLight: "#1976D2",
  primaryLighter: "#42A5F5",
  primaryBg: "#E3F2FD",
  primaryBgDeep: "#BBDEFB",
  white: "#FFFFFF",
  offWhite: "#F4F8FF",
  border: "#BBDEFB",
  textPrimary: "#0D2B5E",
  textSecondary: "#4A6FA5",
  textMuted: "#7B9CC0",

  pendingBg: "#FFF3E0",
  pendingText: "#E65100",
  pendingBorder: "#FFCC80",
  approvedBg: "#E8F5E9",
  approvedText: "#2E7D32",
  approvedBorder: "#81C784",
  rejectedBg: "#FFEBEE",
  rejectedText: "#C62828",
  rejectedBorder: "#EF9A9A",
  hiddenBg: "#ECEFF1",
  hiddenText: "#455A64",
  hiddenBorder: "#B0BEC5",

  featuredBg: "#FFF8E1",
  featuredText: "#F57F17",
  featuredBorder: "#FFD54F",
};

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  hidden: "Hidden",
};

const statusStyle = (status) => {
  switch (status) {
    case "pending":
      return {
        bgcolor: theme.pendingBg,
        color: theme.pendingText,
        borderColor: theme.pendingBorder,
      };
    case "approved":
      return {
        bgcolor: theme.approvedBg,
        color: theme.approvedText,
        borderColor: theme.approvedBorder,
      };
    case "rejected":
      return {
        bgcolor: theme.rejectedBg,
        color: theme.rejectedText,
        borderColor: theme.rejectedBorder,
      };
    case "hidden":
      return {
        bgcolor: theme.hiddenBg,
        color: theme.hiddenText,
        borderColor: theme.hiddenBorder,
      };
    default:
      return {
        bgcolor: theme.primaryBg,
        color: theme.primary,
        borderColor: theme.primaryBgDeep,
      };
  }
};

// ─── API ──────────────────────────────────────────────────────────
const testimonialApi = {
  getAll: async (params = {}) => {
    const token = getAdminToken();
    if (!token) throw new Error("No admin token. Please log in as admin.");

    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    });

    const res = await fetch(
      `${API_BASE_URL}/api/admin/testimonials?${qs.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (!res.ok || !data.success)
      throw new Error(data.message || "Failed to load testimonials");
    return data;
  },

  getStats: async () => {
    const token = getAdminToken();
    const res = await fetch(
      `${API_BASE_URL}/api/admin/testimonials/stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  getOne: async (id) => {
    const token = getAdminToken();
    const res = await fetch(
      `${API_BASE_URL}/api/admin/testimonials/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateStatus: async (id, status, admin_notes) => {
    const token = getAdminToken();
    const res = await fetch(
      `${API_BASE_URL}/api/admin/testimonials/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, admin_notes }),
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  toggleFeature: async (id) => {
    const token = getAdminToken();
    const res = await fetch(
      `${API_BASE_URL}/api/admin/testimonials/${id}/feature`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  delete: async (id) => {
    const token = getAdminToken();
    const res = await fetch(
      `${API_BASE_URL}/api/admin/testimonials/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },
};

// ─── Helpers ─────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name) => {
  if (!name || !name.trim()) return "?";
  return name
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

// ─── Skeleton ─────────────────────────────────────────────────────
const SkeletonCard = () => (
  <Card
    sx={{
      borderRadius: 3,
      border: `1px solid ${theme.border}`,
      boxShadow: "none",
      overflow: "hidden",
    }}
  >
    <Box sx={{ height: 4, bgcolor: theme.primaryBgDeep }} />
    <CardContent>
      {[80, 95, 60].map((w, i) => (
        <Box
          key={i}
          sx={{
            height: 12,
            bgcolor: theme.primaryBg,
            borderRadius: 1,
            mb: 1.5,
            width: `${w}%`,
            animation: "pulse 1.4s ease infinite",
            animationDelay: `${i * 0.15}s`,
            "@keyframes pulse": {
              "0%,100%": { opacity: 1 },
              "50%": { opacity: 0.4 },
            },
          }}
        />
      ))}
    </CardContent>
  </Card>
);

// ─── Filter Button ────────────────────────────────────────────────
const FilterBtn = ({ label, active, onClick, color }) => (
  <Button
    onClick={onClick}
    size="small"
    variant={active ? "contained" : "outlined"}
    sx={{
      borderRadius: 20,
      px: 2,
      py: 0.5,
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "0.3px",
      minWidth: 0,
      ...(active
        ? {
            bgcolor: color || theme.primary,
            borderColor: color || theme.primary,
            color: "#fff",
            "&:hover": { bgcolor: color || theme.primaryLight },
          }
        : {
            borderColor: theme.border,
            color: color || theme.textSecondary,
            bgcolor: "transparent",
            "&:hover": {
              bgcolor: theme.primaryBg,
              borderColor: theme.primaryLighter,
            },
          }),
    }}
  >
    {label}
  </Button>
);

// ─── Row Helper ───────────────────────────────────────────────────
const Row = ({ label, value, mono }) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    gap={2}
  >
    <Typography
      sx={{
        fontSize: "0.7rem",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        color: theme.textMuted,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: "0.85rem",
        color: theme.textPrimary,
        fontWeight: 600,
        textAlign: "right",
        wordBreak: "break-word",
        fontFamily: mono ? "ui-monospace, monospace" : "inherit",
      }}
    >
      {value}
    </Typography>
  </Stack>
);

// ─── Status Dialog ────────────────────────────────────────────────
const StatusDialog = ({ open, testimonial, onClose, onSubmit, loading }) => {
  const [status, setStatus] = useState("approved");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setStatus("approved");
      setNotes("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (testimonial) onSubmit(testimonial._id, status, notes);
  };

  if (!testimonial) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Moderate: {testimonial.title}
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" gap={1} mb={3}>
          {["approved", "rejected", "hidden"].map((s) => (
            <Button
              key={s}
              variant={status === s ? "contained" : "outlined"}
              onClick={() => setStatus(s)}
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                ...(status === s
                  ? {
                      bgcolor: statusStyle(s).color,
                      color: "#fff",
                      "&:hover": { bgcolor: statusStyle(s).color },
                    }
                  : {}),
              }}
            >
              {STATUS_LABELS[s]}
            </Button>
          ))}
        </Stack>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Admin Notes (internal)"
          placeholder="Optional notes about this moderation decision..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: theme.textMuted }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: statusStyle(status).color,
            "&:hover": { bgcolor: statusStyle(status).color, opacity: 0.9 },
          }}
        >
          {loading ? (
            <CircularProgress size={22} />
          ) : (
            `Mark as ${STATUS_LABELS[status]}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function TestimonialView() {
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeStatus, setActiveStatus] = useState("all");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [moderatingTarget, setModeratingTarget] = useState(null);
  const [moderating, setModerating] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ─── Fetch list ───────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page: 1, limit: 100 };
      if (activeStatus !== "all") params.status = activeStatus;
      if (showFeaturedOnly) params.featured = "true";
      if (search.trim()) params.search = search.trim();

      const res = await testimonialApi.getAll(params);
      setTestimonials(res.data || []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load testimonials.");
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  }, [activeStatus, showFeaturedOnly, search]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await testimonialApi.getStats();
      setStats(s);
    } catch (e) {
      console.error("Stats error:", e);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Open detail ──────────────────────────────────────────────
  const openDetail = async (t) => {
    setSelected(t);
    setDetailLoading(true);
    try {
      const full = await testimonialApi.getOne(t._id);
      setSelected(full);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Moderation ───────────────────────────────────────────────
  const openStatusDialog = (t) => {
    setModeratingTarget(t);
    setStatusDialogOpen(true);
  };

  const handleStatusSubmit = async (id, status, admin_notes) => {
    setModerating(true);
    try {
      await testimonialApi.updateStatus(id, status, admin_notes);
      setSnackbar({
        open: true,
        message: `Marked as ${STATUS_LABELS[status]}`,
        severity: "success",
      });
      setStatusDialogOpen(false);
      setModeratingTarget(null);
      await fetchAll();
      await fetchStats();
      if (selected && selected._id === id) {
        const fresh = await testimonialApi.getOne(id);
        setSelected(fresh);
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    } finally {
      setModerating(false);
    }
  };

  const handleFeatureToggle = async (t) => {
    try {
      const updated = await testimonialApi.toggleFeature(t._id);
      setSnackbar({
        open: true,
        message: updated.is_featured
          ? "Marked as featured ⭐"
          : "Removed from featured",
        severity: "success",
      });
      await fetchAll();
      await fetchStats();
      if (selected && selected._id === t._id) {
        const fresh = await testimonialApi.getOne(t._id);
        setSelected(fresh);
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Permanently delete this testimonial? This cannot be undone."
      )
    )
      return;
    try {
      await testimonialApi.delete(id);
      setSnackbar({
        open: true,
        message: "Testimonial deleted",
        severity: "success",
      });
      await fetchAll();
      await fetchStats();
      setSelected(null);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  // ─── Derived stats ────────────────────────────────────────────
  const total = stats ? stats.total : testimonials.length;
  const pending = stats ? stats.pending : 0;
  const approved = stats ? stats.approved : 0;
  const featured = stats ? stats.featured : 0;
  const avgRating = stats ? stats.avg_rating : 0;

  // ─── Client-side filter ───────────────────────────────────────
  const filtered = testimonials.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (t.title || "").toLowerCase().includes(q) ||
      (t.content || "").toLowerCase().includes(q) ||
      (t.customer_name || "").toLowerCase().includes(q) ||
      (t.customer_email || "").toLowerCase().includes(q) ||
      (t.product_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: theme.offWhite }}>
      {/* ─── HERO HEADER ─────────────────────────────────────── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 60%, ${theme.primaryLighter} 100%)`,
          pt: 5,
          pb: 6,
          px: 3,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 60%)",
          },
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            flexWrap="wrap"
            gap={3}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Georgia', serif",
                  fontSize: { xs: "1.8rem", md: "2.4rem" },
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.5px",
                  lineHeight: 1.1,
                  mb: 0.5,
                }}
              >
                Testimonial Management
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.9rem",
                  fontWeight: 300,
                }}
              >
                Review, approve and feature customer testimonials
              </Typography>
            </Box>

            <Stack direction="row" gap={2}>
              {[
                { label: "Total", val: total, color: "#fff" },
                { label: "Pending", val: pending, color: "#FFD54F" },
                { label: "Approved", val: approved, color: "#A5D6A7" },
                { label: "Featured", val: featured, color: "#FFCC80" },
                {
                  label: "Avg Rating",
                  val: avgRating ? avgRating.toFixed(1) : "—",
                  color: "#90CAF9",
                },
              ].map((s) => (
                <Box
                  key={s.label}
                  sx={{
                    textAlign: "center",
                    bgcolor: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                    borderRadius: 3,
                    px: 2.5,
                    py: 1.5,
                    border: "1px solid rgba(255,255,255,0.2)",
                    minWidth: 72,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: s.color,
                      lineHeight: 1,
                    }}
                  >
                    {loading ? "—" : s.val}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      color: "rgba(255,255,255,0.7)",
                      textTransform: "uppercase",
                      letterSpacing: "0.7px",
                      mt: 0.5,
                    }}
                  >
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ─── FILTERS ─────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: -2 }}>
        <Box
          sx={{
            bgcolor: theme.white,
            borderRadius: 3,
            border: `1px solid ${theme.border}`,
            boxShadow: "0 4px 20px rgba(21,101,192,0.08)",
            px: 3,
            py: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "center",
          }}
        >
          <FilterBtn
            label="All"
            active={activeStatus === "all"}
            onClick={() => setActiveStatus("all")}
          />
          <FilterBtn
            label="Pending"
            active={activeStatus === "pending"}
            onClick={() => setActiveStatus("pending")}
            color={theme.pendingText}
          />
          <FilterBtn
            label="Approved"
            active={activeStatus === "approved"}
            onClick={() => setActiveStatus("approved")}
            color={theme.approvedText}
          />
          <FilterBtn
            label="Rejected"
            active={activeStatus === "rejected"}
            onClick={() => setActiveStatus("rejected")}
            color={theme.rejectedText}
          />
          <FilterBtn
            label="Hidden"
            active={activeStatus === "hidden"}
            onClick={() => setActiveStatus("hidden")}
            color={theme.hiddenText}
          />

          <Box
            sx={{
              width: 1,
              height: 24,
              bgcolor: theme.border,
              display: { xs: "none", sm: "block" },
            }}
          />

          <FilterBtn
            label="⭐ Featured"
            active={showFeaturedOnly}
            onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
            color={theme.featuredText}
          />

          <Box sx={{ flex: 1, minWidth: 180 }}>
            <TextField
              size="small"
              placeholder="Search title, content, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      component="span"
                      sx={{ color: theme.textMuted, fontSize: "1rem" }}
                    >
                      🔍
                    </Box>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  bgcolor: theme.offWhite,
                  fontSize: "0.82rem",
                  "& fieldset": { borderColor: theme.border },
                  "&:hover fieldset": { borderColor: theme.primaryLighter },
                  "&.Mui-focused fieldset": { borderColor: theme.primary },
                },
              }}
              fullWidth
            />
          </Box>

          <Button
            onClick={() => {
              fetchAll();
              fetchStats();
            }}
            size="small"
            startIcon={<Box component="span">↺</Box>}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              color: theme.primary,
              border: `1px solid ${theme.border}`,
              px: 2,
              fontSize: "0.8rem",
              "&:hover": { bgcolor: theme.primaryBg },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Container>

      {/* ─── CARD GRID ────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: 3, pb: 6 }}>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Grid container spacing={3}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <SkeletonCard />
                </Grid>
              ))}
          </Grid>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, color: theme.textMuted }}>
            <Typography sx={{ fontSize: "3rem", mb: 2 }}>⭐</Typography>
            <Typography
              sx={{
                fontFamily: "'Georgia', serif",
                fontSize: "1.3rem",
                color: theme.textPrimary,
                mb: 1,
              }}
            >
              No testimonials found
            </Typography>
            <Typography sx={{ fontSize: "0.85rem" }}>
              Try adjusting filters or search query.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((t, i) => (
              <Grid item xs={12} sm={6} md={4} key={t._id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.border}`,
                    boxShadow: "0 2px 12px rgba(21,101,192,0.06)",
                    overflow: "hidden",
                    bgcolor: theme.white,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition:
                      "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                    animation: `fadeUp 0.35s ease both`,
                    animationDelay: `${i * 0.05}s`,
                    "@keyframes fadeUp": {
                      from: { opacity: 0, transform: "translateY(10px)" },
                      to: { opacity: 1, transform: "translateY(0)" },
                    },
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 8px 32px rgba(21,101,192,0.14)",
                      borderColor: theme.primaryLighter,
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 4,
                      bgcolor: t.is_featured
                        ? theme.featuredBorder
                        : statusStyle(t.status).borderColor,
                    }}
                  />

                  <CardContent
                    sx={{
                      p: 2.5,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      gap={1}
                      mb={1.5}
                    >
                      <Chip
                        label={STATUS_LABELS[t.status]}
                        size="small"
                        sx={{
                          ...statusStyle(t.status),
                          border: "1px solid",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          height: 22,
                        }}
                      />
                      {t.is_featured && (
                        <Chip
                          label="⭐ Featured"
                          size="small"
                          sx={{
                            bgcolor: theme.featuredBg,
                            color: theme.featuredText,
                            border: `1px solid ${theme.featuredBorder}`,
                            fontWeight: 700,
                            fontSize: "0.62rem",
                            height: 22,
                          }}
                        />
                      )}
                    </Stack>

                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: theme.textPrimary,
                        lineHeight: 1.3,
                        mb: 0.5,
                      }}
                    >
                      {t.title}
                    </Typography>

                    <Rating
                      value={t.rating || 0}
                      readOnly
                      size="small"
                      sx={{ mb: 1 }}
                    />

                    <Typography
                      sx={{
                        color: theme.textSecondary,
                        fontSize: "0.8rem",
                        lineHeight: 1.5,
                        mb: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        flex: 1,
                      }}
                    >
                      {t.content}
                    </Typography>

                    {t.product_name && (
                      <Stack direction="row" gap={0.8} mb={1.5} flexWrap="wrap">
                        <Chip
                          label={`📦 ${t.product_name}`}
                          size="small"
                          sx={{
                            bgcolor: theme.primaryBg,
                            color: theme.primary,
                            fontWeight: 500,
                            fontSize: "0.65rem",
                            height: 20,
                          }}
                        />
                      </Stack>
                    )}

                    <Divider sx={{ borderColor: theme.border, mb: 1.5 }} />

                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={1.2}
                      mb={1.5}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: theme.primary,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(t.customer_name)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: theme.textPrimary,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.customer_name || "Anonymous"}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.68rem",
                            color: theme.textMuted,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.customer_email || t.customer_phone || "—"}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "0.67rem",
                          color: theme.textMuted,
                          flexShrink: 0,
                        }}
                      >
                        {formatDate(t.created_at)}
                      </Typography>
                    </Stack>

                    <Stack direction="row" gap={0.8} mt="auto">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openDetail(t)}
                        sx={{
                          flex: 1,
                          textTransform: "none",
                          fontSize: "0.72rem",
                          borderRadius: 2,
                          borderColor: theme.border,
                          color: theme.primary,
                          "&:hover": { bgcolor: theme.primaryBg },
                        }}
                      >
                        View
                      </Button>
                      {t.status === "pending" && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => openStatusDialog(t)}
                          sx={{
                            flex: 1,
                            textTransform: "none",
                            fontSize: "0.72rem",
                            borderRadius: 2,
                            bgcolor: theme.approvedText,
                            "&:hover": { bgcolor: "#1B5E20" },
                          }}
                        >
                          Moderate
                        </Button>
                      )}
                      {t.status === "approved" && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleFeatureToggle(t)}
                          sx={{
                            flex: 1,
                            textTransform: "none",
                            fontSize: "0.72rem",
                            borderRadius: 2,
                            bgcolor: t.is_featured
                              ? "#94A3B8"
                              : theme.featuredText,
                            "&:hover": {
                              bgcolor: t.is_featured ? "#64748B" : "#E65100",
                            },
                          }}
                        >
                          {t.is_featured ? "Unfeature" : "⭐ Feature"}
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* ─── DETAIL DIALOG ────────────────────────────────────── */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
      >
        {selected && (
          <>
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`,
                px: 3,
                py: 3,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                gap={2}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.2,
                      mb: 1,
                    }}
                  >
                    {selected.title}
                  </Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    <Chip
                      label={STATUS_LABELS[selected.status]}
                      size="small"
                      sx={{
                        ...statusStyle(selected.status),
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        height: 22,
                        border: "1px solid",
                      }}
                    />
                    {selected.is_featured && (
                      <Chip
                        label="⭐ Featured"
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          height: 22,
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <DialogContent sx={{ px: 3, py: 3 }}>
              {detailLoading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={28} />
                </Box>
              )}

              <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: theme.primary,
                    fontSize: "1rem",
                    fontWeight: 700,
                  }}
                >
                  {getInitials(selected.customer_name)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontWeight: 700, color: theme.textPrimary }}
                  >
                    {selected.customer_name || "Anonymous"}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.78rem", color: theme.textMuted }}
                  >
                    {selected.customer_email || "—"}
                  </Typography>
                  {selected.customer_phone && (
                    <Typography
                      sx={{ fontSize: "0.78rem", color: theme.textMuted }}
                    >
                      📞 {selected.customer_phone}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Rating
                value={selected.rating || 0}
                readOnly
                sx={{ mb: 2 }}
              />

              <Box
                sx={{
                  bgcolor: theme.offWhite,
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    color: theme.textPrimary,
                    lineHeight: 1.6,
                  }}
                >
                  {selected.content}
                </Typography>
              </Box>

              {Array.isArray(selected.media) && selected.media.length > 0 && (
                <Stack direction="row" gap={1} flexWrap="wrap" mb={3}>
                  {selected.media.map((m, i) => (
                    <a
                      key={i}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      {m.type === "image" ? (
                        <img
                          src={m.url}
                          alt={m.name || ""}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: `1px solid ${theme.border}`,
                          }}
                        />
                      ) : (
                        <Chip
                          label={`📎 ${m.name || "File"}`}
                          size="small"
                        />
                      )}
                    </a>
                  ))}
                </Stack>
              )}

              <Divider sx={{ borderColor: theme.border, mb: 2 }} />

              <Stack spacing={1.5}>
                {selected.product_name && (
                  <Row label="Product" value={selected.product_name} />
                )}
                {selected.razorpay_order_id && (
                  <Row
                    label="Order ID"
                    value={selected.razorpay_order_id}
                    mono
                  />
                )}
                {selected.order_amount && (
                  <Row
                    label="Order Amount"
                    value={`₹${selected.order_amount}`}
                    mono
                  />
                )}
                <Row label="Created" value={formatDate(selected.created_at)} />
                {selected.moderated_at && (
                  <Row
                    label="Moderated"
                    value={formatDate(selected.moderated_at)}
                  />
                )}
                {selected.moderated_by_name && (
                  <Row
                    label="Moderated By"
                    value={selected.moderated_by_name}
                  />
                )}
                {selected.admin_notes && (
                  <Row label="Admin Notes" value={selected.admin_notes} />
                )}
                <Row label="Likes" value={selected.like_count || 0} />
              </Stack>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                py: 2,
                bgcolor: theme.offWhite,
                borderTop: `1px solid ${theme.border}`,
                gap: 1,
              }}
            >
              <Button
                onClick={() => handleDelete(selected._id)}
                color="error"
                size="small"
                sx={{ textTransform: "none", mr: "auto" }}
              >
                Delete
              </Button>
              <Button
                onClick={() => openStatusDialog(selected)}
                variant="outlined"
                size="small"
                sx={{ textTransform: "none" }}
              >
                Change Status
              </Button>
              <Button
                onClick={() => setSelected(null)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  color: theme.primary,
                  fontWeight: 600,
                  border: `1px solid ${theme.border}`,
                  px: 3,
                  "&:hover": { bgcolor: theme.primaryBg },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ─── STATUS DIALOG ────────────────────────────────────── */}
      <StatusDialog
        open={statusDialogOpen}
        testimonial={moderatingTarget}
        onClose={() => {
          setStatusDialogOpen(false);
          setModeratingTarget(null);
        }}
        onSubmit={handleStatusSubmit}
        loading={moderating}
      />

      {/* ─── SNACKBAR ─────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}