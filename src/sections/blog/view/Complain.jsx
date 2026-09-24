/* eslint-disable perfectionist/sort-named-imports */
/* eslint-disable react/prop-types */
/* eslint-disable */
import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Stack,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  InputAdornment,
  Divider,
  Avatar,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
} from "@mui/material";

// ─── API base (adjust to your env) ────────────────────────────────
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://lifestyle-backend-lime.vercel.app";

const getAdminToken = () =>
  localStorage.getItem("adminToken") ||
  localStorage.getItem("admin_token") ||
  localStorage.getItem("token") ||
  null;

// ─── Theme tokens ────────────────────────────────────────────────
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
  // status
  openBg: "#FFF3E0",
  openText: "#E65100",
  openBorder: "#FFCC80",
  inProgressBg: "#E3F2FD",
  inProgressText: "#1565C0",
  inProgressBorder: "#90CAF9",
  awaitingBg: "#F3E5F5",
  awaitingText: "#6A1B9A",
  awaitingBorder: "#CE93D8",
  resolvedBg: "#E8F5E9",
  resolvedText: "#2E7D32",
  resolvedBorder: "#81C784",
  closedBg: "#ECEFF1",
  closedText: "#455A64",
  closedBorder: "#B0BEC5",
  rejectedBg: "#FFEBEE",
  rejectedText: "#C62828",
  rejectedBorder: "#EF9A9A",
  // priority
  urgentBg: "#FFEBEE",
  urgentText: "#C62828",
  highBg: "#FFE0B2",
  highText: "#E65100",
  mediumBg: "#FFF8E1",
  mediumText: "#F57F17",
  lowBg: "#E8F5E9",
  lowText: "#2E7D32",
};

// ─── Enum maps ────────────────────────────────────────────────────
const STATUS_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  awaiting_customer: "Awaiting Customer",
  resolved: "Resolved",
  closed: "Closed",
  rejected: "Rejected",
};

const PRIORITY_LABELS = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const CATEGORY_LABELS = {
  damaged: "Damaged Product",
  wrong_item: "Wrong Item",
  quality: "Quality Issue",
  not_received: "Not Received",
  late_delivery: "Late Delivery",
  refund_issue: "Refund Issue",
  other: "Other",
};

// ─── API ──────────────────────────────────────────────────────────
const complaintApi = {
  // GET /api/admin/complaints?page=&limit=&status=&priority=&category=&search=
  getAll: async (params = {}) => {
    const token = getAdminToken();
    if (!token) throw new Error("No admin token. Please log in as admin.");

    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    });

    const res = await fetch(
      `${API_BASE_URL}/api/admin/complaints?${qs.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to load complaints");
    return data; // { success, pagination, count, data: [...] }
  },

  // GET /api/admin/complaints/stats
  getStats: async () => {
    const token = getAdminToken();
    const res = await fetch(`${API_BASE_URL}/api/admin/complaints/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  // GET /api/admin/complaints/:id  (with messages thread)
  getOne: async (id) => {
    const token = getAdminToken();
    const res = await fetch(`${API_BASE_URL}/api/admin/complaints/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  // PUT /api/admin/complaints/:id/status
  updateStatus: async (id, status, admin_notes) => {
    const token = getAdminToken();
    const res = await fetch(
      `${API_BASE_URL}/api/admin/complaints/${id}/status`,
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

  // PUT /api/admin/complaints/:id/priority
  updatePriority: async (id, priority) => {
    const token = getAdminToken();
    const res = await fetch(
      `${API_BASE_URL}/api/admin/complaints/${id}/priority`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priority }),
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  // POST /api/admin/complaints/:id/messages
  reply: async (id, message, mark_in_progress = true) => {
    const token = getAdminToken();
    const res = await fetch(
      `${API_BASE_URL}/api/admin/complaints/${id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, mark_in_progress }),
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};

// ─── Helpers ─────────────────────────────────────────────────────
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

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusStyle = (status) => {
  switch (status) {
    case "open":
      return { bgcolor: theme.openBg, color: theme.openText, borderColor: theme.openBorder };
    case "in_progress":
      return { bgcolor: theme.inProgressBg, color: theme.inProgressText, borderColor: theme.inProgressBorder };
    case "awaiting_customer":
      return { bgcolor: theme.awaitingBg, color: theme.awaitingText, borderColor: theme.awaitingBorder };
    case "resolved":
      return { bgcolor: theme.resolvedBg, color: theme.resolvedText, borderColor: theme.resolvedBorder };
    case "closed":
      return { bgcolor: theme.closedBg, color: theme.closedText, borderColor: theme.closedBorder };
    case "rejected":
      return { bgcolor: theme.rejectedBg, color: theme.rejectedText, borderColor: theme.rejectedBorder };
    default:
      return { bgcolor: theme.primaryBg, color: theme.primary, borderColor: theme.primaryBgDeep };
  }
};

const priorityStyle = (priority) => {
  switch (priority) {
    case "urgent":
      return { bgcolor: theme.urgentBg, color: theme.urgentText };
    case "high":
      return { bgcolor: theme.highBg, color: theme.highText };
    case "medium":
      return { bgcolor: theme.mediumBg, color: theme.mediumText };
    case "low":
      return { bgcolor: theme.lowBg, color: theme.lowText };
    default:
      return { bgcolor: theme.primaryBg, color: theme.primary };
  }
};

const priorityBarColor = (priority) => {
  switch (priority) {
    case "urgent": return theme.urgentText;
    case "high": return theme.highText;
    case "medium": return theme.mediumText;
    case "low": return theme.lowText;
    default: return theme.primary;
  }
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case "urgent": return "🔴";
    case "high": return "🟠";
    case "medium": return "🟡";
    case "low": return "🟢";
    default: return "⚪";
  }
};

// ─── Small components ────────────────────────────────────────────
const DetailRow = ({ icon, label, value }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
    <Box sx={{ color: theme.primary, mt: "2px", flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.8px", color: theme.textMuted, fontWeight: 600, mb: "2px" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.9rem", color: theme.textPrimary, lineHeight: 1.5, wordBreak: "break-word" }}>
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

const SkeletonCard = () => (
  <Card sx={{ borderRadius: 3, border: `1px solid ${theme.border}`, boxShadow: "none", overflow: "hidden" }}>
    <Box sx={{ height: 4, bgcolor: theme.primaryBgDeep }} />
    <CardContent>
      {[80, 95, 60].map((w, i) => (
        <Box
          key={i}
          sx={{
            height: 12, bgcolor: theme.primaryBg, borderRadius: 1, mb: 1.5, width: `${w}%`,
            animation: "pulse 1.4s ease infinite", animationDelay: `${i * 0.15}s`,
            "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
          }}
        />
      ))}
      <Box sx={{ height: 36, bgcolor: theme.primaryBg, borderRadius: 2, mt: 2 }} />
    </CardContent>
  </Card>
);

const FilterBtn = ({ label, active, onClick, color }) => (
  <Button
    onClick={onClick}
    size="small"
    variant={active ? "contained" : "outlined"}
    sx={{
      borderRadius: 20, px: 2, py: 0.5,
      fontSize: "0.75rem", fontWeight: 600,
      textTransform: "none", letterSpacing: "0.3px", minWidth: 0,
      ...(active
        ? { bgcolor: color || theme.primary, borderColor: color || theme.primary, color: "#fff", "&:hover": { bgcolor: color || theme.primaryLight } }
        : { borderColor: theme.border, color: color || theme.textSecondary, bgcolor: "transparent", "&:hover": { bgcolor: theme.primaryBg, borderColor: theme.primaryLighter } }),
    }}
  >
    {label}
  </Button>
);

// ─── Status Update Dialog ────────────────────────────────────────
const StatusUpdateDialog = ({ open, complaint, onClose, onUpdate, loading }) => {
  const [selectedStatus, setSelectedStatus] = useState("resolved");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!notes.trim()) {
      setError("Resolution notes are required.");
      return;
    }
    onUpdate(complaint._id, selectedStatus, notes);
  };

  useEffect(() => {
    if (!open) {
      setNotes("");
      setSelectedStatus("resolved");
      setError("");
    }
  }, [open]);

  if (!complaint) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontWeight: 700, color: theme.textPrimary }}>
            Update Complaint Status
          </Typography>
          <Button onClick={onClose} size="small" sx={{ minWidth: 0, p: 0.5, color: theme.textMuted }}>
            ✕
          </Button>
        </Stack>
        <Typography variant="body2" sx={{ color: theme.textMuted, mt: 0.5 }}>
          {complaint.subject}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" sx={{ mb: 3, mt: 1 }}>
          <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
            New Status
          </FormLabel>
          <RadioGroup
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            sx={{ gap: 0.5 }}
          >
            {["in_progress", "awaiting_customer", "resolved", "rejected", "closed"].map((s) => (
              <FormControlLabel
                key={s}
                value={s}
                control={<Radio />}
                label={
                  <Chip
                    label={STATUS_LABELS[s]}
                    size="small"
                    sx={{ ...statusStyle(s), border: "1px solid", fontWeight: 700 }}
                  />
                }
              />
            ))}
          </RadioGroup>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Admin Notes / Resolution Details"
          placeholder="Explain the outcome. This is stored in admin_notes and visible only to admins."
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            if (error) setError("");
          }}
          error={!!error}
          helperText={error}
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
            bgcolor: selectedStatus === "resolved" ? theme.resolvedText : theme.primary,
            "&:hover": {
              bgcolor: selectedStatus === "resolved" ? "#1B5E20" : theme.primaryLight,
            },
          }}
        >
          {loading ? <CircularProgress size={24} /> : `Mark as ${STATUS_LABELS[selectedStatus]}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Component ───────────────────────────────────────────────
export default function ComplaintView() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [activePriority, setActivePriority] = useState("all");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [selectedForUpdate, setSelectedForUpdate] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // ─── Fetch list ────────────────────────────────────────────
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page: 1, limit: 100 };
      if (activeStatus !== "all") params.status = activeStatus;
      if (activePriority !== "all") params.priority = activePriority;
      if (search.trim()) params.search = search.trim();

      const res = await complaintApi.getAll(params);
      setComplaints(res.data || []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load complaints.");
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [activeStatus, activePriority, search]);

  // ─── Fetch stats ───────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const s = await complaintApi.getStats();
      setStats(s);
    } catch (e) {
      console.error("Stats fetch failed:", e);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Open detail ───────────────────────────────────────────
  const openDetail = async (complaint) => {
    setSelected(complaint);      // Show immediately with list data
    setDetailLoading(true);
    try {
      const full = await complaintApi.getOne(complaint._id);
      setSelected(full);         // Replace with full data (with messages thread)
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Status update ─────────────────────────────────────────
  const handleStatusUpdate = async (id, status, admin_notes) => {
    setUpdating(true);
    try {
      await complaintApi.updateStatus(id, status, admin_notes);
      setSnackbar({
        open: true,
        message: `Complaint marked as ${STATUS_LABELS[status]}`,
        severity: "success",
      });
      setStatusUpdateOpen(false);
      setSelectedForUpdate(null);
      // Refresh list + detail + stats
      await fetchComplaints();
      await fetchStats();
      if (selected?._id === id) {
        const fresh = await complaintApi.getOne(id);
        setSelected(fresh);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to update status",
        severity: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  // ─── Reply ─────────────────────────────────────────────────
  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setReplying(true);
    try {
      await complaintApi.reply(selected._id, replyText.trim(), true);
      setReplyText("");
      setSnackbar({ open: true, message: "Reply posted", severity: "success" });
      // Refresh the detail with new message
      const fresh = await complaintApi.getOne(selected._id);
      setSelected(fresh);
      await fetchComplaints();
      await fetchStats();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to post reply",
        severity: "error",
      });
    } finally {
      setReplying(false);
    }
  };

  // ─── Derived stats (fallback if API stats missing) ────────
  const total = stats?.total ?? complaints.length;
  const open = stats?.byStatus?.open ?? complaints.filter((c) => c.status === "open").length;
  const inProgress =
    stats?.byStatus?.in_progress ?? complaints.filter((c) => c.status === "in_progress").length;
  const resolvedCount = stats?.byStatus?.resolved ?? complaints.filter((c) => c.status === "resolved").length;

  // ─── Client-side filter (search only; status/priority already applied server-side) ─
  const filtered = complaints.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.subject || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q) ||
      (c.customer_name || "").toLowerCase().includes(q) ||
      (c.customer_email || "").toLowerCase().includes(q) ||
      (c.category || "").toLowerCase().includes(q) ||
      (c.razorpay_order_id || "").toLowerCase().includes(q) ||
      (c.product_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: theme.offWhite }}>
      {/* ── Hero Header ─────────────────────────────────────── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 60%, ${theme.primaryLighter} 100%)`,
          pt: 5, pb: 6, px: 3,
          position: "relative", overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 60%)",
          },
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={3}>
            <Box>
              <Typography
                sx={{
                  fontFamily: "'Georgia', serif",
                  fontSize: { xs: "1.8rem", md: "2.4rem" },
                  fontWeight: 700, color: "#fff",
                  letterSpacing: "-0.5px", lineHeight: 1.1, mb: 0.5,
                }}
              >
                Complaint Management
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", fontWeight: 300 }}>
                Track, review and resolve all incoming complaints
              </Typography>
            </Box>

            <Stack direction="row" gap={2}>
              {[
                { label: "Total", val: total, color: "#fff" },
                { label: "Open", val: open, color: "#FFD54F" },
                { label: "In Progress", val: inProgress, color: "#90CAF9" },
                { label: "Resolved", val: resolvedCount, color: "#A5D6A7" },
              ].map((s) => (
                <Box
                  key={s.label}
                  sx={{
                    textAlign: "center",
                    bgcolor: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                    borderRadius: 3,
                    px: 3, py: 1.5,
                    border: "1px solid rgba(255,255,255,0.2)",
                    minWidth: 78,
                  }}
                >
                  <Typography sx={{ fontFamily: "'Georgia', serif", fontSize: "1.5rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>
                    {loading ? "—" : s.val}
                  </Typography>
                  <Typography sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.8px", mt: 0.5 }}>
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ── Filters & Search ─────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: -2 }}>
        <Box
          sx={{
            bgcolor: theme.white,
            borderRadius: 3,
            border: `1px solid ${theme.border}`,
            boxShadow: "0 4px 20px rgba(21,101,192,0.08)",
            px: 3, py: 2,
            display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center",
          }}
        >
          <FilterBtn label="All" active={activeStatus === "all"} onClick={() => setActiveStatus("all")} />
          <FilterBtn label="Open" active={activeStatus === "open"} onClick={() => setActiveStatus("open")} color={theme.openText} />
          <FilterBtn label="In Progress" active={activeStatus === "in_progress"} onClick={() => setActiveStatus("in_progress")} color={theme.inProgressText} />
          <FilterBtn label="Awaiting" active={activeStatus === "awaiting_customer"} onClick={() => setActiveStatus("awaiting_customer")} color={theme.awaitingText} />
          <FilterBtn label="Resolved" active={activeStatus === "resolved"} onClick={() => setActiveStatus("resolved")} color={theme.resolvedText} />
          <FilterBtn label="Closed" active={activeStatus === "closed"} onClick={() => setActiveStatus("closed")} color={theme.closedText} />
          <FilterBtn label="Rejected" active={activeStatus === "rejected"} onClick={() => setActiveStatus("rejected")} color={theme.rejectedText} />

          <Box sx={{ width: 1, height: 24, bgcolor: theme.border, display: { xs: "none", sm: "block" } }} />

          <FilterBtn label="🔴 Urgent" active={activePriority === "urgent"} onClick={() => setActivePriority(activePriority === "urgent" ? "all" : "urgent")} color={theme.urgentText} />
          <FilterBtn label="🟠 High" active={activePriority === "high"} onClick={() => setActivePriority(activePriority === "high" ? "all" : "high")} color={theme.highText} />
          <FilterBtn label="🟡 Medium" active={activePriority === "medium"} onClick={() => setActivePriority(activePriority === "medium" ? "all" : "medium")} color={theme.mediumText} />
          <FilterBtn label="🟢 Low" active={activePriority === "low"} onClick={() => setActivePriority(activePriority === "low" ? "all" : "low")} color={theme.lowText} />

          <Box sx={{ flex: 1, minWidth: 180 }}>
            <TextField
              size="small"
              placeholder="Search subject, customer, order ID, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Box component="span" sx={{ color: theme.textMuted, fontSize: "1rem" }}>🔍</Box></InputAdornment>,
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
            onClick={() => { fetchComplaints(); fetchStats(); }}
            size="small"
            startIcon={<Box component="span" sx={{ fontSize: "0.9rem" }}>↺</Box>}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              color: theme.primary,
              border: `1px solid ${theme.border}`,
              px: 2, fontSize: "0.8rem",
              "&:hover": { bgcolor: theme.primaryBg },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Container>

      {/* ── Card Grid ─────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ mt: 3, pb: 6 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Grid container spacing={3}>
            {Array(6).fill(0).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <SkeletonCard />
              </Grid>
            ))}
          </Grid>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, color: theme.textMuted }}>
            <Typography sx={{ fontSize: "3rem", mb: 2 }}>📭</Typography>
            <Typography sx={{ fontFamily: "'Georgia', serif", fontSize: "1.3rem", color: theme.textPrimary, mb: 1 }}>
              No complaints found
            </Typography>
            <Typography sx={{ fontSize: "0.85rem" }}>Try adjusting your filters or search query.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((c, i) => {
              const isAnon = !c.customer_name;
              return (
                <Grid item xs={12} sm={6} md={4} key={c._id}>
                  <Card
                    onClick={() => openDetail(c)}
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${theme.border}`,
                      boxShadow: "0 2px 12px rgba(21,101,192,0.06)",
                      cursor: "pointer",
                      overflow: "hidden",
                      bgcolor: theme.white,
                      transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                      animation: `fadeUp 0.35s ease both`,
                      animationDelay: `${i * 0.05}s`,
                      "@keyframes fadeUp": {
                        from: { opacity: 0, transform: "translateY(10px)" },
                        to: { opacity: 1, transform: "translateY(0)" },
                      },
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: `0 8px 32px rgba(21,101,192,0.14)`,
                        borderColor: theme.primaryLighter,
                      },
                    }}
                  >
                    <Box sx={{ height: 4, bgcolor: priorityBarColor(c.priority) }} />

                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: theme.textPrimary, lineHeight: 1.3, flex: 1 }}>
                          {c.subject || "Untitled"}
                        </Typography>
                        <Chip
                          label={STATUS_LABELS[c.status] || c.status}
                          size="small"
                          sx={{
                            ...statusStyle(c.status),
                            border: `1px solid`,
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            letterSpacing: "0.4px",
                            height: 22,
                            flexShrink: 0,
                          }}
                        />
                      </Stack>

                      <Typography
                        sx={{
                          color: theme.textSecondary,
                          fontSize: "0.8rem",
                          lineHeight: 1.5,
                          mb: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {c.description || "No description provided."}
                      </Typography>

                      {(c.razorpay_order_id || c.product_name) && (
                        <Stack direction="row" gap={0.8} mb={1.5} flexWrap="wrap">
                          {c.razorpay_order_id && (
                            <Chip
                              label={`Order: ${c.razorpay_order_id}`}
                              size="small"
                              sx={{ bgcolor: theme.primaryBg, color: theme.primary, fontWeight: 500, fontSize: "0.68rem", height: 20 }}
                            />
                          )}
                          {c.product_name && (
                            <Chip
                              label={`Product: ${c.product_name}`}
                              size="small"
                              sx={{ bgcolor: theme.primaryBg, color: theme.primary, fontWeight: 500, fontSize: "0.68rem", height: 20 }}
                            />
                          )}
                        </Stack>
                      )}

                      <Stack direction="row" gap={0.8} mb={2} flexWrap="wrap">
                        <Chip
                          label={CATEGORY_LABELS[c.category] || c.category}
                          size="small"
                          sx={{ bgcolor: theme.primaryBg, color: theme.primary, fontWeight: 600, fontSize: "0.68rem", height: 20, border: `1px solid ${theme.primaryBgDeep}` }}
                        />
                        <Chip
                          label={`${getPriorityIcon(c.priority)} ${PRIORITY_LABELS[c.priority] || c.priority}`}
                          size="small"
                          sx={{ ...priorityStyle(c.priority), fontWeight: 700, fontSize: "0.68rem", height: 20 }}
                        />
                      </Stack>

                      <Divider sx={{ borderColor: theme.border, mb: 2 }} />

                      <Stack direction="row" alignItems="center" gap={1.2}>
                        <Avatar
                          sx={{
                            width: 32, height: 32,
                            bgcolor: theme.primary,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          {getInitials(c.customer_name)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              color: isAnon ? theme.textMuted : theme.textPrimary,
                              fontStyle: isAnon ? "italic" : "normal",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {isAnon ? "Anonymous" : c.customer_name}
                          </Typography>
                          <Typography sx={{ fontSize: "0.68rem", color: theme.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.customer_email || c.customer_phone || "No contact info"}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: "0.67rem", color: theme.textMuted, flexShrink: 0 }}>
                          {formatDate(c.created_at)}
                        </Typography>
                      </Stack>

                      {["open", "in_progress", "awaiting_customer"].includes(c.status) && (
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedForUpdate(c);
                            setStatusUpdateOpen(true);
                          }}
                          sx={{
                            mt: 2,
                            borderRadius: 2,
                            textTransform: "none",
                            borderColor: theme.primary,
                            color: theme.primary,
                            "&:hover": {
                              bgcolor: theme.primaryBg,
                              borderColor: theme.primaryLight,
                            },
                          }}
                        >
                          ✏️ Update Status
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* ── Detail Dialog ─────────────────────────────────────── */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 4, overflow: "hidden", boxShadow: "0 24px 64px rgba(21,101,192,0.18)" },
        }}
      >
        {selected && (
          <>
            <Box sx={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`, px: 3, py: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontFamily: "'Georgia', serif", fontSize: "1.25rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, mb: 1 }}>
                    {selected.subject || "Untitled Complaint"}
                  </Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    <Chip label={STATUS_LABELS[selected.status]} size="small" sx={{ ...statusStyle(selected.status), fontWeight: 700, fontSize: "0.65rem", height: 22, border: "1px solid" }} />
                    <Chip label={`${getPriorityIcon(selected.priority)} ${PRIORITY_LABELS[selected.priority]}`} size="small" sx={{ ...priorityStyle(selected.priority), fontWeight: 700, fontSize: "0.65rem", height: 22 }} />
                    <Chip label={CATEGORY_LABELS[selected.category] || selected.category} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600, fontSize: "0.65rem", height: 22 }} />
                  </Stack>
                </Box>
                {["open", "in_progress", "awaiting_customer"].includes(selected.status) && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setSelectedForUpdate(selected);
                      setStatusUpdateOpen(true);
                    }}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.2)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                      textTransform: "none",
                    }}
                  >
                    Update Status
                  </Button>
                )}
              </Stack>
            </Box>

            <DialogContent sx={{ px: 3, py: 3, bgcolor: theme.white }}>
              {/* Description */}
              <Box sx={{ bgcolor: theme.offWhite, borderRadius: 2, p: 2, mb: 3, border: `1px solid ${theme.border}` }}>
                <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.8px", color: theme.textMuted, fontWeight: 600, mb: 1 }}>
                  Description
                </Typography>
                <Typography sx={{ fontSize: "0.88rem", color: theme.textPrimary, lineHeight: 1.6 }}>
                  {selected.description || "—"}
                </Typography>
              </Box>

              {/* Attachments */}
              {Array.isArray(selected.attachments) && selected.attachments.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.8px", color: theme.textMuted, fontWeight: 600, mb: 1 }}>
                    Attachments ({selected.attachments.length})
                  </Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {selected.attachments.map((a, i) => (
                      <a
                        key={i}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: "none",
                          fontSize: "0.75rem",
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: theme.primaryBg,
                          color: theme.primary,
                          fontWeight: 600,
                        }}
                      >
                        📎 {a.name || `File ${i + 1}`}
                      </a>
                    ))}
                  </Stack>
                </Box>
              )}

              <Divider sx={{ borderColor: theme.border, mb: 3 }} />

              {/* Order & Product */}
              {(selected.razorpay_order_id || selected.product_name) && (
                <>
                  <Typography sx={{ fontFamily: "'Georgia', serif", fontSize: "0.95rem", fontWeight: 700, color: theme.textPrimary, mb: 2 }}>
                    Order Information
                  </Typography>
                  {selected.razorpay_order_id && <DetailRow icon="📦" label="Razorpay Order ID" value={selected.razorpay_order_id} />}
                  {selected.order_amount && <DetailRow icon="💰" label="Order Amount" value={`₹${selected.order_amount}`} />}
                  {selected.order_status && <DetailRow icon="📊" label="Order Status" value={selected.order_status} />}
                  {selected.product_name && <DetailRow icon="🏷️" label="Product Name" value={selected.product_name} />}
                  <Divider sx={{ borderColor: theme.border, mb: 3 }} />
                </>
              )}

              {/* Customer */}
              <Typography sx={{ fontFamily: "'Georgia', serif", fontSize: "0.95rem", fontWeight: 700, color: theme.textPrimary, mb: 2 }}>
                Customer Details
              </Typography>
              <DetailRow icon="👤" label="Name" value={selected.customer_name || "Anonymous"} />
              <DetailRow icon="✉️" label="Email" value={selected.customer_email} />
              <DetailRow icon="📞" label="Phone" value={selected.customer_phone} />
              <Divider sx={{ borderColor: theme.border, mb: 3, mt: 1 }} />

              {/* Complaint info */}
              <Typography sx={{ fontFamily: "'Georgia', serif", fontSize: "0.95rem", fontWeight: 700, color: theme.textPrimary, mb: 2 }}>
                Complaint Info
              </Typography>
              <DetailRow icon="🏷️" label="Category" value={CATEGORY_LABELS[selected.category] || selected.category} />
              <DetailRow icon="⚡" label="Priority" value={PRIORITY_LABELS[selected.priority] || selected.priority} />
              <DetailRow icon="📅" label="Created" value={formatDate(selected.created_at)} />
              <DetailRow icon="🔄" label="Last Updated" value={formatDate(selected.updated_at)} />
              {selected.resolved_at && (
                <DetailRow icon="✅" label="Resolved On" value={formatDate(selected.resolved_at)} />
              )}
              {selected.admin_notes && (
                <>
                  <Divider sx={{ borderColor: theme.border, mb: 3, mt: 1 }} />
                  <DetailRow icon="📝" label="Admin Notes" value={selected.admin_notes} />
                </>
              )}

              {/* ── Message thread ── */}
              {Array.isArray(selected.messages) && selected.messages.length > 0 && (
                <>
                  <Divider sx={{ borderColor: theme.border, my: 3 }} />
                  <Typography sx={{ fontFamily: "'Georgia', serif", fontSize: "0.95rem", fontWeight: 700, color: theme.textPrimary, mb: 2 }}>
                    Conversation ({selected.messages.length})
                  </Typography>
                  <Stack gap={1.5} sx={{ mb: 2 }}>
                    {selected.messages.map((m) => {
                      const isAdmin = m.sender_role === "admin";
                      return (
                        <Box
                          key={m._id}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: isAdmin ? theme.primaryBg : theme.offWhite,
                            border: `1px solid ${isAdmin ? theme.primaryBgDeep : theme.border}`,
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: theme.textPrimary }}>
                              {isAdmin ? "🛡️ Admin" : "👤 Customer"} · {m.sender_name || (isAdmin ? "Admin" : "Customer")}
                            </Typography>
                            <Typography sx={{ fontSize: "0.65rem", color: theme.textMuted }}>
                              {formatDateTime(m.created_at)}
                            </Typography>
                          </Stack>
                          <Typography sx={{ fontSize: "0.83rem", color: theme.textPrimary, lineHeight: 1.5 }}>
                            {m.message}
                          </Typography>
                          {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                            <Stack direction="row" gap={0.8} mt={1} flexWrap="wrap">
                              {m.attachments.map((a, i) => (
                                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: "0.7rem", color: theme.primary, fontWeight: 600 }}>
                                  📎 {a.name || `File ${i + 1}`}
                                </a>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </>
              )}

              {/* ── Reply box ── */}
              {!["closed", "rejected"].includes(selected.status) && (
                <>
                  <Divider sx={{ borderColor: theme.border, my: 2 }} />
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: theme.textPrimary, mb: 1 }}>
                    Reply as Admin
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Type your reply to the customer..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    sx={{ mb: 1.5 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    sx={{ textTransform: "none" }}
                  >
                    {replying ? <CircularProgress size={20} /> : "Send Reply"}
                  </Button>
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: theme.offWhite, borderTop: `1px solid ${theme.border}` }}>
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

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        open={statusUpdateOpen}
        complaint={selectedForUpdate}
        onClose={() => {
          setStatusUpdateOpen(false);
          setSelectedForUpdate(null);
        }}
        onUpdate={handleStatusUpdate}
        loading={updating}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}