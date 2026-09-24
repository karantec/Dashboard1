/* eslint-disable */
import axios from "axios";
import { useState, useEffect, useCallback, useMemo } from "react";

/* ─── CONFIG ─────────────────────────────────────────────── */
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://lifestyle-backend-lime.vercel.app";

const getAdminToken = () =>
  localStorage.getItem("adminToken") ||
  localStorage.getItem("admin_token") ||
  localStorage.getItem("token") ||
  null;

/* ─── STATUS CONFIG ─────────────────────────────────────── */
const STATUS_CONFIG = {
  created:            { bg: "#FFF8E1", color: "#B45309", border: "#FDE68A", dot: "#F59E0B", label: "Awaiting Payment", icon: "⏳" },
  paid:               { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", dot: "#3B82F6", label: "Paid", icon: "✅" },
  shipped:            { bg: "#F0F9FF", color: "#0369A1", border: "#BAE6FD", dot: "#0EA5E9", label: "Shipped", icon: "🚚" },
  delivered:          { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0", dot: "#22C55E", label: "Delivered", icon: "🎯" },
  cancelled:          { bg: "#FFF1F2", color: "#BE123C", border: "#FECDD3", dot: "#EF4444", label: "Cancelled", icon: "❌" },
  failed:             { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA", dot: "#DC2626", label: "Failed", icon: "⚠️" },
  partially_refunded: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A", dot: "#D97706", label: "Partial Refund", icon: "↩️" },
  refunded:           { bg: "#F3E8FF", color: "#6B21A8", border: "#E9D5FF", dot: "#9333EA", label: "Refunded", icon: "💸" },
};

const PAYMENT_CONFIG = {
  card:       { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE", icon: "💳", label: "Card" },
  upi:        { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", icon: "📱", label: "UPI" },
  netbanking: { bg: "#FEF3C7", color: "#D97706", border: "#FDE68A", icon: "🏦", label: "NetBanking" },
  wallet:     { bg: "#F3E8FF", color: "#9333EA", border: "#E9D5FF", icon: "👛", label: "Wallet" },
  null:       { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB", icon: "•",  label: "Not Paid" },
};

/* ─── BADGES ────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.created;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 20, padding: "4px 12px",
      fontSize: 11, fontWeight: 700,
      letterSpacing: "0.3px", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 11 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
};
const PaymentBadge = ({ method, status }) => {
  // If order is paid/shipped/delivered, it IS paid — even if method is unknown
  const isPaidStatus = ["paid", "shipped", "delivered", "partially_refunded", "refunded"].includes(status);

  // If payment was never captured
  if (status === "created" || status === "failed") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB",
        borderRadius: 20, padding: "4px 12px",
        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
      }}>
        <span style={{ fontSize: 10 }}>•</span>
        {status === "failed" ? "Failed" : "Not Paid"}
      </span>
    );
  }

  // If order is paid, use method if known, else show "Paid"
  if (isPaidStatus) {
    const cfg = PAYMENT_CONFIG[method];
    if (cfg) {
      return (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          borderRadius: 20, padding: "4px 12px",
          fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
        }}>
          <span style={{ fontSize: 10 }}>{cfg.icon}</span>
          {cfg.label}
        </span>
      );
    }
    // Paid but method unknown (test payments, webhook-only, etc.)
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0",
        borderRadius: 20, padding: "4px 12px",
        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
      }}>
        <span style={{ fontSize: 10 }}>✓</span>
        Paid
      </span>
    );
  }

  return null;
};
// const PaymentBadge = ({ method, status }) => {
//   const cfg = PAYMENT_CONFIG[method] || PAYMENT_CONFIG.null;
//   const isPending = !method && status === "created";
//   return (
//     <span style={{
//       display: "inline-flex", alignItems: "center", gap: 4,
//       background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
//       borderRadius: 20, padding: "4px 12px",
//       fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
//     }}>
//       <span style={{ fontSize: 10 }}>{cfg.icon}</span>
//       {isPending ? "Not Paid" : cfg.label}
//     </span>
//   );
// };

/* ─── VERIFICATION ROW — 3 states: ok / pending / error ── */
const VerifyRow = ({ state, label, hint }) => {
  const cfg = {
    ok:      { bg: "#F0FDF4", border: "#BBF7D0", icon: "✓", iconBg: "#22C55E", color: "#15803D", tag: null },
    pending: { bg: "#FFF8E1", border: "#FDE68A", icon: "⏳", iconBg: "#F59E0B", color: "#B45309", tag: "Pending" },
    error:   { bg: "#FFF1F2", border: "#FECDD3", icon: "✕", iconBg: "#EF4444", color: "#B91C1C", tag: "Failed" },
  }[state] || { bg: "#F3F4F6", border: "#E5E7EB", icon: "•", iconBg: "#9CA3AF", color: "#4B5563", tag: null };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 12px", borderRadius: 8,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 12,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%",
        background: cfg.iconBg, color: "#fff",
        fontSize: 11, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{cfg.icon}</span>
      <span style={{ color: cfg.color, fontWeight: 700, flex: 1 }}>{label}</span>
      {cfg.tag && (
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: "0.6px",
          color: cfg.color, background: "#fff", border: `1px solid ${cfg.border}`,
          padding: "2px 6px", borderRadius: 4,
        }}>{cfg.tag}</span>
      )}
      {hint && (
        <span style={{
          color: "#64748B", fontSize: 11, fontWeight: 600,
          fontFamily: "monospace", maxWidth: 220,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{hint}</span>
      )}
    </div>
  );
};

/* ─── SECTION ───────────────────────────────────────────── */
const Section = ({ title, icon, children, action }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 11, fontWeight: 700, color: "#475569",
      textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span>{title}</span>
      <div style={{ flex: 1, height: 1, background: "#E8EEF7", marginLeft: 8 }} />
      {action}
    </div>
    {children}
  </div>
);

/* ─── FIELD ─────────────────────────────────────────────── */
const Field = ({ label, value, mono = false, small = false, color }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{
      fontSize: 10, color: "#94A3B8", fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4,
    }}>{label}</div>
    <div style={{
      fontSize: small ? 11 : 13,
      fontFamily: mono ? "ui-monospace,SFMono-Regular,Menlo,monospace" : "inherit",
      fontWeight: 600, color: color || "#1E293B",
      wordBreak: "break-all", lineHeight: 1.5,
    }}>{value || "—"}</div>
  </div>
);

/* ─── STAT CARD ─────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent }) => (
  <div style={{
    background: "#fff", borderRadius: 12, padding: "14px 18px",
    border: "1px solid #E8EEF7", flex: 1, minWidth: 140,
    display: "flex", alignItems: "center", gap: 12,
    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, fontSize: 18,
      background: accent + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>{value}</div>
    </div>
  </div>
);

/* ─── ORDER TIMELINE ────────────────────────────────────── */
const OrderTimeline = ({ status }) => {
  const stages = [
    { key: "created",   label: "Placed",    icon: "📝" },
    { key: "paid",      label: "Paid",      icon: "💳" },
    { key: "shipped",   label: "Shipped",   icon: "🚚" },
    { key: "delivered", label: "Delivered", icon: "🎯" },
  ];

  const order = { created: 0, paid: 1, shipped: 2, delivered: 3 };
  const isCancelled = ["cancelled", "failed", "refunded", "partially_refunded"].includes(status);
  const currentIdx = isCancelled ? -1 : (order[status] ?? 0);

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 0,
      padding: "18px 12px", background: "#F8FAFD",
      borderRadius: 12, border: "1px solid #E8EEF7",
    }}>
      {stages.map((s, i) => {
        const done = currentIdx >= i;
        const active = currentIdx === i;
        return (
          <div key={s.key} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 68 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: done ? "#2563EB" : "#fff",
                border: `2px solid ${done ? "#2563EB" : "#E2EAF4"}`,
                color: done ? "#fff" : "#94A3B8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 700,
                boxShadow: active ? "0 0 0 4px rgba(37,99,235,0.15)" : "none",
                transition: "all 0.3s ease",
              }}>{s.icon}</div>
              <div style={{
                fontSize: 11, fontWeight: 700,
                color: done ? "#1E293B" : "#94A3B8",
                textAlign: "center",
              }}>{s.label}</div>
            </div>
            {i < stages.length - 1 && (
              <div style={{
                flex: 1, height: 3, marginTop: -22,
                background: currentIdx > i ? "#2563EB" : "#E2EAF4",
                transition: "background 0.3s ease",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── MAIN COMPONENT ────────────────────────────────────── */
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, error = false) => {
    setToast({ message, error });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── FETCH ──────────────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    try {
      const token = getAdminToken();
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/admin/payment/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setStats(res.data.data);
    } catch (err) {
      console.error("Stats fetch failed:", err);
    }
  }, []);

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const token = getAdminToken();
      if (!token) throw new Error("No admin token");
      const params = { page, limit };
      if (filterStatus !== "ALL") params.status = filterStatus;
      const res = await axios.get(`${API_BASE_URL}/api/admin/payment/orders`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setOrders(res.data.data || []);
        if (res.data.pagination) setPagination({
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages,
        });
      }
    } catch (err) {
      if (!silent) showToast(err.response?.data?.message || err.message, true);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, filterStatus]);

  const fetchOrderDetail = useCallback(async (orderId) => {
    setDetailLoading(true);
    try {
      const token = getAdminToken();
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/payment/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setSelectedOrder(res.data.data);
        setTrackingNumber(res.data.data.tracking_number || "");
        setCarrier(res.data.data.carrier || "");
      }
    } catch (err) {
      showToast("Failed to load order detail", true);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); fetchStats(); }, [fetchOrders, fetchStats]);

  /* ─── ACTIONS ────────────────────────────────────────── */
  const handleStatusUpdate = async (orderId, newStatus, extra = {}) => {
    const payload = { status: newStatus, ...extra };
    if (newStatus === "shipped") {
      if (!trackingNumber.trim() || !carrier.trim()) {
        return showToast("Tracking + carrier required to ship", true);
      }
      payload.tracking_number = trackingNumber.trim();
      payload.carrier = carrier.trim();
    }
    try {
      setUpdatingStatus(true);
      const token = getAdminToken();
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/payment/orders/${orderId}/status`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        showToast(`✓ Marked as ${newStatus}`);
        await fetchOrderDetail(orderId);
        await fetchOrders({ silent: true });
        await fetchStats();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", true);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder) return;
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) return showToast("Invalid amount", true);
    const max = parseFloat(selectedOrder.amount) - parseFloat(selectedOrder.refund_amount || 0);
    if (amount > max) return showToast(`Max ₹${max.toFixed(2)}`, true);
    try {
      setRefunding(true);
      const token = getAdminToken();
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/payment/orders/${selectedOrder._id}/refund`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        showToast(`✓ Refunded ₹${amount}`);
        setRefundAmount("");
        await fetchOrderDetail(selectedOrder._id);
        await fetchOrders({ silent: true });
        await fetchStats();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Refund failed", true);
    } finally {
      setRefunding(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      (o._id || "").toLowerCase().includes(q) ||
      (o.razorpay_order_id || "").toLowerCase().includes(q) ||
      (o.customer_name || "").toLowerCase().includes(q) ||
      (o.customer_email || "").toLowerCase().includes(q) ||
      (o.customer_phone || "").toLowerCase().includes(q)
    );
  }, [orders, search]);

  const displayStats = stats || { totalOrders: 0, totalRevenue: 0, byStatus: {} };

  const inputStyle = {
    width: "100%", border: "1.5px solid #E2EAF4", borderRadius: 8,
    padding: "10px 12px", fontSize: 13, color: "#1E293B",
    background: "#fff", outline: "none", fontFamily: "inherit",
    boxSizing: "border-box",
  };

  /* ─── RENDER ─────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FC", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>

      {/* HEADER */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E8EEF7",
        padding: "18px 32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg,#2563EB,#60A5FA)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>📦</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>Order Management</div>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
              {pagination.total} total · Page {page}/{pagination.totalPages || 1}
            </div>
          </div>
        </div>
        <button
          onClick={() => { setRefreshing(true); fetchOrders({ silent: true }); fetchStats(); }}
          disabled={refreshing}
          style={{
            background: refreshing ? "#94A3B8" : "linear-gradient(135deg,#2563EB,#3B82F6)",
            color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px",
            fontSize: 13, fontWeight: 700, cursor: refreshing ? "not-allowed" : "pointer",
          }}
        >
          {refreshing ? "⟳ Refreshing…" : "⟳ Refresh"}
        </button>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1500, margin: "0 auto" }}>

        {/* STATS */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Total" value={displayStats.totalOrders} icon="📦" accent="#2563EB" />
          <StatCard label="Revenue" value={"₹" + (displayStats.totalRevenue || 0).toLocaleString()} icon="💰" accent="#22C55E" />
          <StatCard label="Paid" value={displayStats.byStatus?.paid?.count || 0} icon="✅" accent="#16A34A" />
          <StatCard label="Shipped" value={displayStats.byStatus?.shipped?.count || 0} icon="🚚" accent="#0EA5E9" />
          <StatCard label="Delivered" value={displayStats.byStatus?.delivered?.count || 0} icon="🎯" accent="#22C55E" />
          <StatCard label="Pending" value={displayStats.byStatus?.created?.count || 0} icon="⏳" accent="#F59E0B" />
        </div>

        {/* FILTERS */}
        <div style={{
          background: "#fff", border: "1px solid #E8EEF7", borderRadius: 12,
          padding: "16px 20px", marginBottom: 16,
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              style={{
                border: "1.5px solid #E2EAF4", borderRadius: 8,
                padding: "8px 12px", fontSize: 13, fontWeight: 500,
                background: "#F8FAFD", cursor: "pointer", outline: "none",
              }}
            >
              {["ALL","created","paid","shipped","delivered","cancelled","failed","partially_refunded","refunded"].map((s) => (
                <option key={s} value={s}>{s === "ALL" ? "All Orders" : s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍  Search order / razorpay / customer…"
            style={{ ...inputStyle, width: 340, background: "#F8FAFD" }}
          />
        </div>

        {/* TABLE */}
        <div style={{
          background: "#fff", borderRadius: 14, border: "1px solid #E8EEF7",
          overflow: "hidden",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "110px 1.2fr 1.5fr 100px 130px 110px 80px",
            padding: "12px 20px", background: "#F8FAFD",
            borderBottom: "1.5px solid #E8EEF7",
            fontSize: 11, fontWeight: 700, color: "#64748B",
            textTransform: "uppercase", letterSpacing: "0.7px",
          }}>
            <div>Order</div>
            <div>Customer</div>
            <div>Contact</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Payment</div>
            <div></div>
          </div>

          {loading && <div style={{ padding: 60, textAlign: "center", color: "#94A3B8" }}>Loading orders…</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 60, textAlign: "center", color: "#94A3B8" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>No orders found
            </div>
          )}

          {!loading && filtered.map((row, i) => (
            <div key={row._id} style={{
              display: "grid",
              gridTemplateColumns: "110px 1.2fr 1.5fr 100px 130px 110px 80px",
              padding: "14px 20px", alignItems: "center",
              borderBottom: i < filtered.length - 1 ? "1px solid #F1F5FA" : "none",
            }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#2563EB", fontWeight: 700 }}>
                #{row._id?.slice(-8)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                  {row.customer_name || <em style={{ color: "#94A3B8" }}>Unknown</em>}
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace", marginTop: 2 }}>
                  {row.user_id?.slice(-12)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#1E293B" }}>{row.customer_email || "—"}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{row.customer_phone || "—"}</div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                ₹{parseFloat(row.amount || 0).toLocaleString("en-IN")}
              </div>
              <div><StatusBadge status={row.status} /></div>
              <div><PaymentBadge method={row.payment_method} status={row.status} /></div>
              <div>
                <button
                  onClick={() => { setModalOpen(true); fetchOrderDetail(row._id); }}
                  style={{
                    background: "transparent", border: "1.5px solid #BFDBFE",
                    color: "#2563EB", borderRadius: 8, padding: "6px 12px",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >View →</button>
              </div>
            </div>
          ))}
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "1.5px solid #E2EAF4",
                background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer",
                color: page === 1 ? "#94A3B8" : "#0F172A", fontWeight: 600,
              }}
            >← Prev</button>
            <span style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#64748B" }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "1.5px solid #E2EAF4",
                background: "#fff", cursor: page >= pagination.totalPages ? "not-allowed" : "pointer",
                color: page >= pagination.totalPages ? "#94A3B8" : "#0F172A", fontWeight: 600,
              }}
            >Next →</button>
          </div>
        )}
      </div>

      {/* ═══════════════ MODAL ═══════════════ */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(4px)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 18, width: 860, maxWidth: "100%",
              maxHeight: "92vh", overflowY: "auto",
              boxShadow: "0 24px 64px rgba(15,23,42,0.25)",
            }}
          >
            {detailLoading || !selectedOrder ? (
              <div style={{ padding: 80, textAlign: "center", color: "#94A3B8" }}>
                Loading order details…
              </div>
            ) : (() => {
              const v = selectedOrder.verification || {};
              const isPendingPayment = selectedOrder.status === "created" && !selectedOrder.razorpay_payment_id;
              const isFailed = ["failed", "cancelled"].includes(selectedOrder.status);
              const isFinal = ["delivered", "cancelled", "failed", "refunded"].includes(selectedOrder.status);

              return (
                <>
                  {/* ─── HEADER ─── */}
                  <div style={{
                    padding: "22px 26px", borderBottom: "1px solid #F1F5FA",
                    position: "sticky", top: 0, background: "#fff", zIndex: 10,
                    borderRadius: "18px 18px 0 0",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>
                          Order ID
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", fontFamily: "ui-monospace,monospace" }}>
                          #{selectedOrder._id}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>
                          Placed {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusBadge status={selectedOrder.status} />
                        <PaymentBadge method={selectedOrder.payment_method} status={selectedOrder.status} />
                        <button
                          onClick={() => setModalOpen(false)}
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E2EAF4",
                            background: "#F8FAFD", color: "#64748B", cursor: "pointer", fontSize: 15,
                          }}
                        >✕</button>
                      </div>
                    </div>

                    {/* STATUS BANNER — tells the story at a glance */}
                    <div style={{
                      padding: "12px 16px", borderRadius: 10,
                      background: isPendingPayment ? "#FFF8E1" : isFailed ? "#FFF1F2" : "#F0FDF4",
                      border: `1px solid ${isPendingPayment ? "#FDE68A" : isFailed ? "#FECDD3" : "#BBF7D0"}`,
                      fontSize: 13, fontWeight: 600,
                      color: isPendingPayment ? "#B45309" : isFailed ? "#B91C1C" : "#15803D",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ fontSize: 16 }}>
                        {isPendingPayment ? "⏳" : isFailed ? "⚠️" : "✅"}
                      </span>
                      {isPendingPayment && "Customer has not completed payment. Waiting for Razorpay verification."}
                      {isFailed && `Order ${selectedOrder.status}. No further payment actions can be taken.`}
                      {!isPendingPayment && !isFailed && "Payment verified. Order is confirmed and ready for fulfillment."}
                    </div>
                  </div>

                  <div style={{ padding: "22px 26px 30px" }}>

                    {/* ─── TIMELINE ─── */}
                    <div style={{ marginBottom: 24 }}>
                      <OrderTimeline status={selectedOrder.status} />
                    </div>

                    {/* ─── VERIFICATION ─── */}
                    <Section title="Verification" icon="🛡️">
                      <div style={{ display: "grid", gap: 6 }}>
                        <VerifyRow
                          state={v.user_id_matches_db ? "ok" : "error"}
                          label="Order belongs to a registered user"
                          hint={selectedOrder.customer_name}
                        />
                        <VerifyRow
                          state={v.has_razorpay_order_id ? "ok" : "error"}
                          label="Razorpay order was created"
                          hint={selectedOrder.razorpay_order_id}
                        />
                        <VerifyRow
                          state={v.has_signature ? "ok" : isPendingPayment ? "pending" : "error"}
                          label={
                            v.signature_via_webhook
                              ? "Signature verified via webhook"
                              : v.has_signature
                              ? "Signature stored (client verification)"
                              : "Signature not yet received"
                          }
                          hint={selectedOrder.razorpay_signature?.slice(0, 18) ? selectedOrder.razorpay_signature.slice(0, 18) + "…" : null}
                        />
                        <VerifyRow
                          state={v.has_razorpay_payment_id ? "ok" : isPendingPayment ? "pending" : "error"}
                          label="Payment captured with Razorpay"
                          hint={selectedOrder.razorpay_payment_id || null}
                        />
                        <VerifyRow
                          state={v.amount_matches_items ? "ok" : "error"}
                          label="Order amount matches items total"
                          hint={`₹${selectedOrder.amount} = ₹${(v.items_total || 0).toFixed(2)}`}
                        />
                        <VerifyRow
                          state={v.has_shipping_address ? "ok" : "error"}
                          label="Shipping address on file"
                        />
                      </div>
                    </Section>

                    {/* ─── CUSTOMER ─── */}
                    <Section title="Customer" icon="👤">
                      <div style={{
                        display: "grid", gridTemplateColumns: "auto 1fr", gap: 16,
                        padding: 16, background: "#F8FAFD",
                        borderRadius: 12, border: "1px solid #E8EEF7",
                      }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: "50%",
                          background: "linear-gradient(135deg,#2563EB,#60A5FA)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 22, fontWeight: 800,
                        }}>
                          {(selectedOrder.customer_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>
                            {selectedOrder.customer_name || "Unknown user"}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, color: "#475569" }}>
                            <div>✉️ {selectedOrder.customer_email || "—"}</div>
                            <div>📞 {selectedOrder.customer_phone || "—"}</div>
                          </div>
                          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 8, fontFamily: "ui-monospace,monospace" }}>
                            {selectedOrder.user_id}
                          </div>
                          {selectedOrder.customer_since && (
                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                              Member since {new Date(selectedOrder.customer_since).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                            </div>
                          )}
                        </div>
                      </div>
                    </Section>

                    {/* ─── PAYMENT ─── */}
                    <Section title="Payment" icon="💳">
                      <div style={{
                        padding: 16, background: "#F8FAFD",
                        borderRadius: 12, border: "1px solid #E8EEF7",
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
                      }}>
                        <Field label="Razorpay Order ID" value={selectedOrder.razorpay_order_id} mono small />
                        <Field label="Razorpay Payment ID" value={selectedOrder.razorpay_payment_id} mono small
                          color={selectedOrder.razorpay_payment_id ? "#0F172A" : "#94A3B8"} />
                        <Field label="Payment Method" value={<PaymentBadge method={selectedOrder.payment_method} status={selectedOrder.status} />} />
                        <Field label="Currency" value={selectedOrder.currency || "INR"} />
                        <Field label="Amount Charged" value={`₹${parseFloat(selectedOrder.amount || 0).toFixed(2)}`} mono />
                        <Field
                          label="Refunded"
                          value={`₹${parseFloat(selectedOrder.refund_amount || 0).toFixed(2)}`}
                          mono
                          color={parseFloat(selectedOrder.refund_amount) > 0 ? "#9333EA" : "#0F172A"}
                        />
                        {selectedOrder.refund_id && (
                          <Field label="Refund ID" value={selectedOrder.refund_id} mono small />
                        )}
                        {selectedOrder.refund_status && (
                          <Field label="Refund Status" value={selectedOrder.refund_status} />
                        )}
                        <div style={{ gridColumn: "1 / -1" }}>
                          <Field
                            label="Razorpay Signature (HMAC)"
                            value={selectedOrder.razorpay_signature || "Not received"}
                            mono
                            small
                            color={selectedOrder.razorpay_signature ? "#0F172A" : "#94A3B8"}
                          />
                        </div>
                      </div>
                    </Section>

                    {/* ─── ITEMS + CUSTOMIZATIONS ─── */}
                    <Section title={`Products (${selectedOrder.items?.length || 0})`} icon="📦">
                      <div style={{ display: "grid", gap: 12 }}>
                        {(selectedOrder.items || []).map((item, idx) => {
                          const thumb = Array.isArray(item.media) && item.media[0]?.url;
                          const priceDrift = item.current_price &&
                            Math.abs(parseFloat(item.current_price) - parseFloat(item.unit_price)) > 0.01;
                          const customizations = Array.isArray(item.selected_customizations)
                            ? item.selected_customizations
                            : [];

                          return (
                            <div key={idx} style={{
                              display: "grid", gridTemplateColumns: "80px 1fr auto",
                              gap: 16, padding: 16,
                              border: "1px solid #E8EEF7", borderRadius: 12,
                              background: "#fff",
                            }}>
                              {/* Thumbnail */}
                              <div style={{
                                width: 80, height: 80, borderRadius: 10,
                                background: "#F1F5FA", overflow: "hidden",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                border: "1px solid #E8EEF7",
                              }}>
                                {thumb ? (
                                  <img src={thumb} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : <span style={{ fontSize: 30 }}>📦</span>}
                              </div>

                              {/* Details */}
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
                                  {item.name || item.product_name || "Unknown product"}
                                </div>
                                <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "ui-monospace,monospace", marginBottom: 10 }}>
                                  ID: {item.product_id}
                                </div>

                                {/* Price row */}
                                <div style={{
                                  display: "flex", gap: 20, flexWrap: "wrap",
                                  padding: "10px 12px", background: "#F8FAFD",
                                  borderRadius: 8, border: "1px solid #E8EEF7",
                                  marginBottom: customizations.length ? 12 : 0,
                                }}>
                                  <div>
                                    <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Unit Price</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", fontFamily: "monospace" }}>
                                      ₹{parseFloat(item.unit_price).toFixed(2)}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quantity</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                                      × {item.quantity}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Subtotal</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", fontFamily: "monospace" }}>
                                      ₹{parseFloat(item.subtotal).toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                {/* Customizations */}
                                {customizations.length > 0 && (
                                  <div style={{
                                    padding: 12, background: "#EFF6FF",
                                    borderRadius: 8, border: "1px solid #BFDBFE",
                                  }}>
                                    <div style={{
                                      fontSize: 10, fontWeight: 800, color: "#1D4ED8",
                                      textTransform: "uppercase", letterSpacing: "0.6px",
                                      marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
                                    }}>
                                      🎨 Customizations
                                    </div>
                                    <div style={{ display: "grid", gap: 6 }}>
                                      {customizations.map((c, ci) => {
                                        const val = Array.isArray(c.value) ? c.value.join(", ") : String(c.value ?? "—");
                                        return (
                                          <div key={ci} style={{
                                            display: "grid", gridTemplateColumns: "1fr 2fr",
                                            gap: 10, fontSize: 12,
                                            paddingBottom: 6,
                                            borderBottom: ci < customizations.length - 1 ? "1px dashed #BFDBFE" : "none",
                                          }}>
                                            <div style={{ fontWeight: 700, color: "#1E40AF" }}>
                                              {c.id || c.label || `Field ${ci + 1}`}
                                            </div>
                                            <div style={{ color: "#1E293B", fontWeight: 600 }}>
                                              {val}
                                              {c.priceAdjustment > 0 && (
                                                <span style={{ marginLeft: 8, color: "#15803D", fontSize: 11, fontWeight: 700 }}>
                                                  +₹{parseFloat(c.priceAdjustment).toFixed(2)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Price drift warning */}
                                {priceDrift && (
                                  <div style={{
                                    marginTop: 10, fontSize: 11,
                                    background: "#FEF3C7", color: "#92400E",
                                    padding: "6px 10px", borderRadius: 6,
                                    border: "1px solid #FDE68A", display: "inline-block",
                                  }}>
                                    ⚠️ Current product price is ₹{item.current_price} (changed since order)
                                  </div>
                                )}
                              </div>

                              {/* Right: total */}
                              <div style={{ textAlign: "right", fontFamily: "ui-monospace,monospace" }}>
                                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                                  Total
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                                  ₹{parseFloat(item.subtotal).toLocaleString("en-IN")}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Order total bar */}
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          padding: "14px 18px", background: "#EFF6FF",
                          border: "1.5px solid #BFDBFE", borderRadius: 12,
                          fontSize: 15, fontWeight: 800,
                        }}>
                          <span style={{ color: "#0F172A" }}>Order Total</span>
                          <span style={{ color: "#2563EB", fontFamily: "monospace" }}>
                            ₹{parseFloat(selectedOrder.amount || 0).toFixed(2)} {selectedOrder.currency}
                          </span>
                        </div>
                      </div>
                    </Section>

                    {/* ─── SHIPPING ─── */}
                    {selectedOrder.shipping_address && (
                      <Section title="Shipping Address" icon="📍">
                        <div style={{
                          padding: 16, background: "#F8FAFD",
                          borderRadius: 12, border: "1px solid #E8EEF7", fontSize: 13,
                          lineHeight: 1.7,
                        }}>
                          {selectedOrder.shipping_address.name && (
                            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, color: "#0F172A" }}>
                              {selectedOrder.shipping_address.name}
                            </div>
                          )}
                          {selectedOrder.shipping_address.phone && (
                            <div style={{ color: "#475569" }}>📞 {selectedOrder.shipping_address.phone}</div>
                          )}
                          {selectedOrder.shipping_address.line1 && (
                            <div style={{ color: "#475569" }}>{selectedOrder.shipping_address.line1}</div>
                          )}
                          {selectedOrder.shipping_address.line2 && (
                            <div style={{ color: "#475569" }}>{selectedOrder.shipping_address.line2}</div>
                          )}
                          <div style={{ color: "#475569" }}>
                            {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} — {selectedOrder.shipping_address.pincode}
                          </div>
                          {selectedOrder.shipping_address.country && (
                            <div style={{ color: "#94A3B8", marginTop: 4 }}>{selectedOrder.shipping_address.country}</div>
                          )}
                        </div>
                      </Section>
                    )}

                    {/* ─── FULFILLMENT HISTORY ─── */}
                    <Section title="Activity Timeline" icon="🕒">
                      {Array.isArray(selectedOrder.status_history) && selectedOrder.status_history.length > 0 ? (
                        <div style={{ position: "relative", paddingLeft: 22 }}>
                          <div style={{
                            position: "absolute", left: 8, top: 6, bottom: 6, width: 2,
                            background: "#E2EAF4",
                          }} />
                          {[...selectedOrder.status_history].reverse().map((h, i) => (
                            <div key={i} style={{
                              position: "relative", paddingBottom: 14,
                            }}>
                              <div style={{
                                position: "absolute", left: -21, top: 4,
                                width: 12, height: 12, borderRadius: "50%",
                                background: "#2563EB", border: "2px solid #fff",
                                boxShadow: "0 0 0 2px #2563EB",
                              }} />
                              <div style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                gap: 12,
                              }}>
                                <div style={{
                                  fontSize: 13, fontWeight: 700, color: "#0F172A",
                                  textTransform: "capitalize",
                                }}>
                                  {h.status}
                                  {h.tracking_number && (
                                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: "#64748B", fontFamily: "monospace" }}>
                                      {h.tracking_number}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: "#94A3B8" }}>
                                  {h.timestamp ? new Date(h.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                                </div>
                              </div>
                              {h.carrier && (
                                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                                  via {h.carrier}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          padding: 20, textAlign: "center",
                          background: "#F8FAFD", border: "1px dashed #E2EAF4",
                          borderRadius: 10, fontSize: 12, color: "#94A3B8",
                        }}>No activity yet</div>
                      )}
                    </Section>

                    {/* ─── ACTION BAR ─── */}
                    {!isFinal && (
                      <Section title="Actions" icon="⚡">
                        {/* Ship controls — only for paid */}
                        {selectedOrder.status === "paid" && (
                          <div style={{
                            padding: 16, background: "#F0F9FF",
                            border: "1px solid #BAE6FD", borderRadius: 12,
                            marginBottom: 12,
                          }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0369A1", marginBottom: 10 }}>
                              🚚 Ship this order
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
                              <input
                                placeholder="Tracking number"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                style={inputStyle}
                              />
                              <input
                                placeholder="Carrier (e.g. BlueDart)"
                                value={carrier}
                                onChange={(e) => setCarrier(e.target.value)}
                                style={inputStyle}
                              />
                              <button
                                onClick={() => handleStatusUpdate(selectedOrder._id, "shipped")}
                                disabled={updatingStatus}
                                style={{
                                  background: updatingStatus ? "#94A3B8" : "#0EA5E9",
                                  color: "#fff", border: "none", borderRadius: 8,
                                  padding: "0 22px", fontSize: 13, fontWeight: 700,
                                  cursor: updatingStatus ? "not-allowed" : "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >{updatingStatus ? "…" : "Ship"}</button>
                            </div>
                          </div>
                        )}

                        {/* Deliver button */}
                        {selectedOrder.status === "shipped" && (
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder._id, "delivered")}
                            disabled={updatingStatus}
                            style={{
                              width: "100%", background: updatingStatus ? "#94A3B8" : "#22C55E",
                              color: "#fff", border: "none", borderRadius: 10, padding: "14px",
                              fontSize: 14, fontWeight: 800, cursor: updatingStatus ? "not-allowed" : "pointer",
                              marginBottom: 12,
                            }}
                          >{updatingStatus ? "Updating…" : "🎯 Mark as Delivered"}</button>
                        )}

                        {/* Refund controls */}
                        {["paid", "shipped", "delivered", "partially_refunded"].includes(selectedOrder.status) && (
                          <div style={{
                            padding: 16, background: "#FEF3C7",
                            border: "1px solid #FDE68A", borderRadius: 12,
                          }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 10 }}>
                              ↩️ Issue Refund
                              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: "#78350F" }}>
                                Max: ₹{(parseFloat(selectedOrder.amount) - parseFloat(selectedOrder.refund_amount || 0)).toFixed(2)}
                              </span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                              <input
                                type="number"
                                placeholder="Amount in ₹"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                style={inputStyle}
                              />
                              <button
                                onClick={handleRefund}
                                disabled={refunding}
                                style={{
                                  background: refunding ? "#94A3B8" : "#9333EA",
                                  color: "#fff", border: "none", borderRadius: 8,
                                  padding: "0 22px", fontSize: 13, fontWeight: 700,
                                  cursor: refunding ? "not-allowed" : "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >{refunding ? "…" : "Refund"}</button>
                            </div>
                          </div>
                        )}
                      </Section>
                    )}

                    {isFinal && (
                      <div style={{
                        padding: 16, background: "#F3F4F6", borderRadius: 12,
                        fontSize: 13, color: "#475569", textAlign: "center",
                        fontWeight: 600,
                      }}>
                        {selectedOrder.status === "delivered" && "🎯 Order delivered. No further actions available."}
                        {selectedOrder.status === "cancelled" && "❌ Order cancelled."}
                        {selectedOrder.status === "failed" && "⚠️ Payment failed."}
                        {selectedOrder.status === "refunded" && "💸 Order fully refunded."}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          background: toast.error ? "#FFF1F2" : "#F0FDF4",
          border: `1px solid ${toast.error ? "#FECDD3" : "#BBF7D0"}`,
          color: toast.error ? "#B91C1C" : "#15803D",
          padding: "14px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>{toast.error ? "⚠️" : "✓"}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}