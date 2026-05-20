/* eslint-disable */
import axios from "axios";
import { useState, useEffect, useCallback, useRef } from "react";

/* ─── DUMMY DATA ─────────────────────────────────────────── */
const getDummyOrders = () => [
  {
    _id: "ORD001123456", totalAmount: 1250, status: "PLACED",
    items: [{ name: "Wireless Mouse", quantity: 2, sellingPrice: 599 }, { name: "USB Keyboard", quantity: 1, sellingPrice: 1200 }],
    trackingUpdates: [], adminModified: false,
    payment: { method: "ONLINE", status: "PAID", amount: 1250, currency: "INR" },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    _id: "ORD002789012", totalAmount: 3499, status: "SHIPPED",
    items: [{ name: "Noise Cancelling Headphones", quantity: 1, sellingPrice: 3499 }],
    trackingUpdates: [{ status: "Picked Up", location: "Mumbai Hub", updatedAt: new Date().toISOString() }, { status: "In Transit", location: "Nagpur Depot", updatedAt: new Date().toISOString() }],
    adminModified: true,
    payment: { method: "ONLINE", status: "PENDING", amount: 3499, currency: "INR" },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    _id: "ORD003345678", totalAmount: 799, status: "DELIVERED",
    items: [{ name: "Phone Stand", quantity: 1, sellingPrice: 399 }, { name: "USB-C Cable", quantity: 2, sellingPrice: 200 }],
    trackingUpdates: [{ status: "Delivered", location: "Customer Doorstep", updatedAt: new Date().toISOString() }], adminModified: false,
    payment: { method: "COD", status: "NOT_INITIATED", amount: 799, currency: "INR" },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

/* ─── GET ADMIN TOKEN ────────────────────────────────────── */
const getAdminToken = () =>
  localStorage.getItem("adminToken") || localStorage.getItem("admin_token") || null;

/* ─── API BASE URL ───────────────────────────────────────── */
const API_BASE_URL = "https://my-project-backend-ee4t.onrender.com/api/order";

/* ─── STATUS CONFIG ──────────────────────────────────────── */
const STATUS_CONFIG = {
  PLACED:    { bg: "#FFF8E1", color: "#F59E0B", border: "#FDE68A", dot: "#F59E0B" },
  CONFIRMED: { bg: "#EFF6FF", color: "#3B82F6", border: "#BFDBFE", dot: "#3B82F6" },
  SHIPPED:   { bg: "#F0F9FF", color: "#0EA5E9", border: "#BAE6FD", dot: "#0EA5E9" },
  PROCESSING: { bg: "#FEF3C7", color: "#D97706", border: "#FDE68A", dot: "#D97706" },
  DELIVERED: { bg: "#F0FDF4", color: "#22C55E", border: "#BBF7D0", dot: "#22C55E" },
  CANCELLED: { bg: "#FFF1F2", color: "#EF4444", border: "#FECDD3", dot: "#EF4444" },
};

/* ─── PAYMENT CONFIG ─────────────────────────────────────── */
const PAYMENT_CONFIG = {
  PAID:          { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", icon: "✓",  label: "Paid" },
  PENDING:       { bg: "#FFF8E1", color: "#D97706", border: "#FDE68A", icon: "⏳", label: "Pending" },
  CREATED:       { bg: "#EFF6FF", color: "#3B82F6", border: "#BFDBFE", icon: "🔗", label: "Created" },
  NOT_INITIATED: { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB", icon: "💵", label: "COD" },
  FAILED:        { bg: "#FFF1F2", color: "#EF4444", border: "#FECDD3", icon: "✕",  label: "Failed" },
};

/* ─── STATUS BADGE ───────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB", dot: "#6B7280" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 600, fontFamily: "monospace",
      letterSpacing: "0.4px", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {status}
    </span>
  );
};

/* ─── PAYMENT BADGE ──────────────────────────────────────── */
const PaymentBadge = ({ payment }) => {
  if (!payment) return null;
  const ps = payment.status || "PENDING";
  const cfg = PAYMENT_CONFIG[ps] || PAYMENT_CONFIG.PENDING;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 10 }}>{cfg.icon}</span>
      {cfg.label}
      {payment.method && payment.method !== "COD" && ps !== "NOT_INITIATED" && (
        <span style={{ fontSize: 10, opacity: 0.65, marginLeft: 2 }}>• {payment.method}</span>
      )}
    </span>
  );
};

/* ─── STAT CARD ──────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent }) => (
  <div style={{
    background: "#fff", borderRadius: 12, padding: "16px 20px",
    border: "1px solid #E8EEF7", flex: 1, minWidth: 130,
    display: "flex", alignItems: "center", gap: 14,
    boxShadow: "0 1px 4px rgba(37,99,235,0.06)",
    transition: "box-shadow 0.2s, transform 0.2s",
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(37,99,235,0.06)"; e.currentTarget.style.transform = "none"; }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: 10, fontSize: 20,
      background: accent + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#1E3A5F", letterSpacing: "-0.5px" }}>{value}</div>
    </div>
  </div>
);

/* ─── MAIN COMPONENT ─────────────────────────────────────── */
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingDummyData, setUsingDummyData] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState("");
  const [trackingLocation, setTrackingLocation] = useState("");
  const [toast, setToast] = useState(null);
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastAutoRefresh, setLastAutoRefresh] = useState(new Date());
  const intervalRef = useRef(null);
  const ordersRef = useRef(orders);
  const [cancelledOrderIds, setCancelledOrderIds] = useState(new Set());

  // Update ref when orders change
  useEffect(() => {
    ordersRef.current = orders;
    
    // Track cancelled orders for highlighting
    const cancelled = new Set(orders.filter(o => o.status === "CANCELLED").map(o => o._id));
    setCancelledOrderIds(cancelled);
  }, [orders]);

  /* FETCH ORDERS - GET /admin/all */
  const fetchOrders = useCallback(async (showRefreshToast = false, isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }
      const token = getAdminToken();

      if (!token) {
        console.warn("No admin token found in localStorage");
        throw new Error("No authentication token");
      }

      console.log("Fetching orders from API at:", new Date().toLocaleTimeString());
      const res = await axios.get(`${API_BASE_URL}/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      console.log("API Response:", res.data);

      let ordersData = null;
      if (res.data?.orders && Array.isArray(res.data.orders)) ordersData = res.data.orders;
      else if (Array.isArray(res.data)) ordersData = res.data;
      else if (res.data?.data && Array.isArray(res.data.data)) ordersData = res.data.data;

      if (ordersData && ordersData.length > 0) {
        // Check if orders have changed
        const previousOrders = ordersRef.current;
        const ordersChanged = JSON.stringify(ordersData) !== JSON.stringify(previousOrders);
        
        // Log status changes for debugging
        if (ordersChanged && previousOrders.length > 0) {
          console.log("Orders changed! Previous count:", previousOrders.length, "New count:", ordersData.length);
          
          // Check for status changes
          ordersData.forEach(newOrder => {
            const oldOrder = previousOrders.find(o => o._id === newOrder._id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
              console.log(`🔔 Order ${newOrder._id} status changed from ${oldOrder.status} to ${newOrder.status}`);
              
              if (newOrder.status === "CANCELLED") {
                showToast(`❌ Order #${newOrder._id.slice(-6)} has been CANCELLED!`, false);
              } else if (oldOrder.status === "CANCELLED" && newOrder.status !== "CANCELLED") {
                showToast(`✅ Order #${newOrder._id.slice(-6)} status changed from CANCELLED to ${newOrder.status}`, false);
              }
            }
          });
          
          // Check for new cancelled orders
          const newCancelledOrders = ordersData.filter(o => 
            o.status === "CANCELLED" && !previousOrders.find(po => po._id === o._id && po.status === "CANCELLED")
          );
          
          if (newCancelledOrders.length > 0) {
            console.log(`⚠️ Found ${newCancelledOrders.length} new cancelled orders!`);
            newCancelledOrders.forEach(order => {
              showToast(`⚠️ Order #${order._id.slice(-6)} has been cancelled!`, false);
            });
          }
        }
        
        setOrders(ordersData);
        setUsingDummyData(false);
        
        if (showRefreshToast && ordersChanged) {
          showToast(`✓ Refreshed ${ordersData.length} orders`);
        } else if (showRefreshToast && !ordersChanged) {
          showToast(`No changes detected`);
        } else if (!isAutoRefresh && !showRefreshToast) {
          showToast(`✓ Loaded ${ordersData.length} orders successfully`);
        }
      } else if (ordersData && ordersData.length === 0) {
        setOrders([]);
        setUsingDummyData(false);
        if (!isAutoRefresh) {
          showToast("No orders found");
        }
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("❌ API Error:", error);
      if (!isAutoRefresh) {
        if (error.response?.status === 401) showToast("Authentication failed. Please login again.", true);
        else if (error.response?.status === 403) showToast("You don't have permission to view orders.", true);
        else if (error.request) showToast("Network error - Could not connect to server", true);
        else showToast(error.message || "Failed to load orders", true);

        setOrders(getDummyOrders());
        setUsingDummyData(true);
        showToast("Using demo data (API connection failed)", true);
      } else {
        console.log("Auto-refresh failed, will retry soon");
      }
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
      setRefreshing(false);
      if (isAutoRefresh) {
        setLastAutoRefresh(new Date());
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Set up auto-refresh polling
  useEffect(() => {
    if (autoRefreshEnabled && !usingDummyData) {
      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Set up new interval - refresh every 10 seconds for faster cancellation detection
      intervalRef.current = setInterval(() => {
        console.log("Auto-refreshing orders at:", new Date().toLocaleTimeString());
        fetchOrders(false, true);
      }, 10000); // 10 seconds
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Clear interval when auto-refresh is disabled or using dummy data
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [autoRefreshEnabled, usingDummyData, fetchOrders]);

  const showToast = (message, error = false) => {
    setToast({ message, error });
    setTimeout(() => setToast(null), 5000);
  };

  /* UPDATE STATUS - PATCH /admin/:id/status */
  const handleStatusUpdate = async (id, status) => {
    if (usingDummyData) {
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      showToast(`Status updated to ${status} (Demo Mode)`);
      return;
    }
    try {
      const token = getAdminToken();
      const response = await axios.patch(
        `${API_BASE_URL}/admin/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Status update response:", response.data);
      
      if (response.data.success && response.data.order) {
        // Update with the exact order from response
        setOrders(prev => prev.map(o => o._id === id ? response.data.order : o));
        if (selectedOrder && selectedOrder._id === id) {
          setSelectedOrder(response.data.order);
        }
        showToast(`✓ Status updated to ${status}`);
        
        // Trigger a refresh after status update to ensure consistency
        setTimeout(() => {
          fetchOrders(false, true);
        }, 1000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Status update failed:", error);
      showToast(error.response?.data?.message || "Status update failed", true);
    }
  };

  /* ADD TRACKING - POST /admin/:id/tracking */
  const handleAddTracking = async () => {
    if (!trackingStatus.trim() || !trackingLocation.trim()) {
      showToast("Please enter both status and location", true);
      return;
    }
    
    setUpdatingTracking(true);
    const newEntry = { 
      status: trackingStatus.trim(), 
      location: trackingLocation.trim(), 
      updatedAt: new Date().toISOString() 
    };

    if (usingDummyData) {
      const updatedOrder = { 
        ...selectedOrder, 
        trackingUpdates: [...(selectedOrder.trackingUpdates || []), newEntry] 
      };
      setSelectedOrder(updatedOrder);
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
      setTrackingStatus(""); 
      setTrackingLocation("");
      showToast("Tracking update added (Demo Mode)");
      setUpdatingTracking(false);
      return;
    }
    
    try {
      const token = getAdminToken();
      const res = await axios.post(
        `${API_BASE_URL}/admin/${selectedOrder._id}/tracking`,
        { status: trackingStatus.trim(), location: trackingLocation.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data && res.data.order) {
        setSelectedOrder(res.data.order);
        setOrders(prev => prev.map(o => 
          o._id === res.data.order._id ? res.data.order : o
        ));
      } else if (res.data) {
        const updatedOrder = {
          ...selectedOrder,
          trackingUpdates: [...(selectedOrder.trackingUpdates || []), newEntry]
        };
        setSelectedOrder(updatedOrder);
        setOrders(prev => prev.map(o => 
          o._id === updatedOrder._id ? updatedOrder : o
        ));
      }
      
      setTrackingStatus(""); 
      setTrackingLocation("");
      showToast("✓ Tracking update added successfully");
      
      // Refresh after tracking update
      setTimeout(() => {
        fetchOrders(false, true);
      }, 1000);
    } catch (error) {
      console.error("Failed to add tracking:", error);
      showToast(error.response?.data?.message || "Failed to add tracking update", true);
    } finally {
      setUpdatingTracking(false);
    }
  };

  /* REMOVE TRACKING - Client-side only */
  const handleRemoveTracking = async (index) => {
    if (!selectedOrder.trackingUpdates || selectedOrder.trackingUpdates.length === 0) return;
    
    const updatedTrackingUpdates = selectedOrder.trackingUpdates.filter((_, i) => i !== index);
    
    if (usingDummyData) {
      const updatedOrder = { ...selectedOrder, trackingUpdates: updatedTrackingUpdates };
      setSelectedOrder(updatedOrder);
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
      showToast("Tracking update removed (Demo Mode)");
      return;
    }
    
    // Note: Backend doesn't have a DELETE endpoint for tracking updates
    // This is a client-side only removal
    const updatedOrder = { ...selectedOrder, trackingUpdates: updatedTrackingUpdates };
    setSelectedOrder(updatedOrder);
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    showToast("Tracking update removed (client-side only)");
  };

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || o._id.toLowerCase().includes(q) || o.items.some(i => i.name.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const counts = { PLACED: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
  let totalRevenue = 0, paidCount = 0;
  orders.forEach(o => {
    counts[o.status] = (counts[o.status] || 0) + 1;
    if (o.status !== "CANCELLED" && o.totalAmount) totalRevenue += o.totalAmount;
    if (o.payment?.status === "PAID") paidCount++;
  });

  const inputStyle = {
    width: "100%", border: "1.5px solid #E2EAF4", borderRadius: 8,
    padding: "9px 12px", fontSize: 13, color: "#1E3A5F",
    background: "#F8FAFD", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s",
  };

  // Helper function to render status select options based on current status
  const renderStatusOptions = (currentStatus) => {
    switch(currentStatus) {
      case "PLACED":
        return (
          <>
            <option value="PLACED">PLACED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </>
        );
      case "CONFIRMED":
        return (
          <>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </>
        );
      case "SHIPPED":
        return (
          <>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
          </>
        );
      case "DELIVERED":
        return (
          <option value="DELIVERED">DELIVERED</option>
        );
      case "CANCELLED":
        return (
          <option value="CANCELLED">CANCELLED</option>
        );
      default:
        return (
          <>
            <option value="PLACED">PLACED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </>
        );
    }
  };

  // Check if status update is allowed (not final state)
  const isStatusUpdatable = (status) => {
    return status !== "CANCELLED" && status !== "DELIVERED";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FC", fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>

      {/* ─── HEADER ─── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E8EEF7",
        padding: "18px 32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 1px 8px rgba(37,99,235,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #2563EB, #60A5FA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
          }}>📦</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1E3A5F", letterSpacing: "-0.3px" }}>Order Management</div>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
              {orders.length} total orders
              {usingDummyData && <span style={{ marginLeft: 8, color: "#F59E0B", background: "#FFF8E1", border: "1px solid #FDE68A", borderRadius: 4, padding: "1px 6px", fontSize: 10 }}>DEMO MODE</span>}
              {autoRefreshEnabled && !usingDummyData && (
                <span style={{ marginLeft: 8, color: "#22C55E", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 4, padding: "1px 6px", fontSize: 10, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  🔄 Auto-refresh (10s)
                  <span style={{ fontSize: 9, opacity: 0.7 }}>
                    {new Date(lastAutoRefresh).toLocaleTimeString()}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button 
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            disabled={usingDummyData}
            style={{
              background: autoRefreshEnabled ? "#10B981" : "#6B7280",
              color: "#fff",
              border: "none", 
              borderRadius: 9, 
              padding: "9px 18px",
              fontSize: 13, 
              fontWeight: 700, 
              cursor: usingDummyData ? "not-allowed" : "pointer",
              boxShadow: autoRefreshEnabled ? "0 2px 8px rgba(16,185,129,0.3)" : "none",
              display: "flex", 
              alignItems: "center", 
              gap: 6,
              opacity: usingDummyData ? 0.6 : 1,
            }}
          >
            {autoRefreshEnabled ? "⏸️ Pause Auto-Refresh" : "▶️ Start Auto-Refresh"}
          </button>
          <button 
            onClick={() => {
              setRefreshing(true);
              fetchOrders(true, false);
            }} 
            disabled={refreshing}
            style={{
              background: refreshing ? "#94A3B8" : "linear-gradient(135deg, #2563EB, #3B82F6)", 
              color: "#fff",
              border: "none", borderRadius: 9, padding: "9px 18px",
              fontSize: 13, fontWeight: 700, cursor: refreshing ? "not-allowed" : "pointer",
              boxShadow: refreshing ? "none" : "0 2px 8px rgba(37,99,235,0.3)", 
              display: "flex", alignItems: "center", gap: 6,
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            {refreshing ? "⟳ Refreshing..." : "⟳ Refresh Now"}
          </button>
          
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ─── STATS ─── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Total Orders" value={orders.length} icon="📦" accent="#2563EB" />
          <StatCard label="Revenue" value={"₹" + totalRevenue.toLocaleString()} icon="💰" accent="#22C55E" />
          <StatCard label="Paid Orders" value={paidCount} icon="✅" accent="#16A34A" />
          <StatCard label="Shipped" value={counts.SHIPPED || 0} icon="🚚" accent="#0EA5E9" />
          <StatCard label="Pending" value={(counts.PLACED || 0) + (counts.CONFIRMED || 0)} icon="⏳" accent="#F59E0B" />
          <StatCard label="Cancelled" value={counts.CANCELLED || 0} icon="❌" accent="#EF4444" />
        </div>

        {/* Auto-refresh info bar */}
        {autoRefreshEnabled && !usingDummyData && (
          <div style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 8,
            padding: "8px 16px",
            marginBottom: 16,
            fontSize: 12,
            color: "#1E40AF",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span>🔄</span>
            <span>Auto-refreshing every 10 seconds to show latest order status (including cancellations)</span>
            <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.7 }}>
              Last refresh: {lastAutoRefresh.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* ─── FILTER & SEARCH ─── */}
        <div style={{
          background: "#fff", border: "1px solid #E8EEF7", borderRadius: 12,
          padding: "16px 20px", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          boxShadow: "0 1px 4px rgba(37,99,235,0.05)",
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Filter by Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                border: "1.5px solid #E2EAF4",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 500,
                background: "#F8FAFD",
                cursor: "pointer",
                outline: "none",
                fontFamily: "inherit",
              }}
            >
              <option value="ALL">ALL ORDERS</option>
              <option value="PLACED">PLACED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search by order ID or item..."
            style={{ ...inputStyle, width: 260, background: "#F8FAFD" }}
            onFocus={e => e.target.style.borderColor = "#2563EB"}
            onBlur={e => e.target.style.borderColor = "#E2EAF4"}
          />
        </div>

        {/* ─── TABLE ─── */}
        <div style={{
          background: "#fff", borderRadius: 14, border: "1px solid #E8EEF7",
          overflow: "hidden", boxShadow: "0 1px 8px rgba(37,99,235,0.06)",
        }}>
          {/* Table Head */}
          <div style={{
            display: "grid", gridTemplateColumns: "110px 1fr 100px 130px 120px 170px 90px",
            padding: "12px 20px", background: "#F8FAFD",
            borderBottom: "1.5px solid #E8EEF7",
            fontSize: 11, fontWeight: 700, color: "#94A3B8",
            textTransform: "uppercase", letterSpacing: "0.8px",
          }}>
            <div>Order ID</div>
            <div>Items</div>
            <div>Amount</div>
            <div>Order Status</div>
            <div>Payment</div>
            <div>Update Status</div>
            <div>Actions</div>
          </div>

          {loading && (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ width: 40, height: 40, border: "3px solid #E2EAF4", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ color: "#94A3B8" }}>Loading orders...</div>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              No orders found
            </div>
          )}

          {!loading && filtered.map((row, i) => {
            const mainItem = row.items[0];
            const extraCount = row.items.length - 1;
            const orderId = row._id || row.orderId || "";
            const displayId = orderId.length > 6 ? orderId.slice(-6) : orderId;
            const isCancelled = row.status === "CANCELLED";

            return (
              <div key={row._id} style={{
                display: "grid", gridTemplateColumns: "110px 1fr 100px 130px 120px 170px 90px",
                padding: "14px 20px", alignItems: "center",
                borderBottom: i < filtered.length - 1 ? "1px solid #F1F5FA" : "none",
                transition: "background 0.15s",
                backgroundColor: isCancelled ? "#FFF1F2" : "transparent",
              }}
                onMouseEnter={e => e.currentTarget.style.background = isCancelled ? "#FEE2E2" : "#F8FAFD"}
                onMouseLeave={e => e.currentTarget.style.background = isCancelled ? "#FFF1F2" : "transparent"}
              >
                <div style={{ fontFamily: "monospace", fontSize: 13, color: "#2563EB", fontWeight: 700 }}>#{displayId}</div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1E3A5F" }}>{mainItem?.name || "Unknown Item"}</div>
                  {extraCount > 0 && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>+{extraCount} more item{extraCount > 1 ? "s" : ""}</div>}
                </div>

                <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#1E3A5F" }}>
                  ₹{(row.totalAmount || 0).toLocaleString()}
                </div>

                <div><StatusBadge status={row.status} /></div>

                <div><PaymentBadge payment={row.payment} /></div>

                <div>
                  <div>
                    <select 
                      value={row.status} 
                      onChange={(e) => handleStatusUpdate(row._id, e.target.value)}
                      disabled={!isStatusUpdatable(row.status)}
                      style={{
                        border: "1.5px solid #E2EAF4",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: !isStatusUpdatable(row.status) ? "#94A3B8" : "#1E3A5F",
                        background: !isStatusUpdatable(row.status) ? "#F3F4F6" : "#F8FAFD",
                        cursor: !isStatusUpdatable(row.status) ? "not-allowed" : "pointer",
                        outline: "none",
                        fontFamily: "inherit",
                        width: "160px",
                        opacity: !isStatusUpdatable(row.status) ? 0.7 : 1,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {renderStatusOptions(row.status)}
                    </select>
                    {!isStatusUpdatable(row.status) && (
                      <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4, fontWeight: 600, textAlign: "center" }}>
                        Final Status Locked
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <button onClick={() => { setSelectedOrder(row); setModalOpen(true); }} style={{
                    background: "transparent", border: "1.5px solid #BFDBFE",
                    color: "#2563EB", borderRadius: 8, padding: "6px 14px",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.borderColor = "#2563EB"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                  >View →</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── MODAL ─── */}
      {modalOpen && selectedOrder && (
        <div onClick={() => setModalOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(15,30,60,0.45)",
          backdropFilter: "blur(4px)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 18, width: 700, maxHeight: "88vh",
            overflowY: "auto", boxShadow: "0 24px 64px rgba(15,30,60,0.2)", border: "1px solid #E8EEF7",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "22px 24px 18px", borderBottom: "1px solid #F1F5FA",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              position: "sticky", top: 0, background: "#fff", borderRadius: "18px 18px 0 0",
              zIndex: 10,
            }}>
              <div>
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Order Details</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#1E3A5F" }}>
                  #{selectedOrder._id?.slice(-8) || selectedOrder._id}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StatusBadge status={selectedOrder.status} />
                <PaymentBadge payment={selectedOrder.payment} />
                <button onClick={() => setModalOpen(false)} style={{
                  width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E2EAF4",
                  background: "#F8FAFD", color: "#94A3B8", cursor: "pointer", fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
              </div>
            </div>

            <div style={{ padding: "20px 24px 24px" }}>

              {/* Order Summary Row */}
              <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", padding: "12px", background: "#F8FAFD", borderRadius: 10, border: "1px solid #E8EEF7" }}>
                <div>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Created At</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F" }}>
                    {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Last Updated</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F" }}>
                    {selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Subtotal</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1E3A5F", fontFamily: "monospace" }}>
                    ₹{(selectedOrder.subTotal || 0).toLocaleString()}
                  </div>
                </div>
                {selectedOrder.deliveryFee !== undefined && (
                  <div>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Delivery Fee</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B", fontFamily: "monospace" }}>
                      ₹{(selectedOrder.deliveryFee || 0).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── PAYMENT INFO CARD ─── */}
              {selectedOrder.payment && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Payment Info</div>
                  <div style={{
                    border: `1px solid ${selectedOrder.payment.status === "PAID" ? "#BBF7D0" : selectedOrder.payment.status === "FAILED" ? "#FECDD3" : "#E8EEF7"}`,
                    borderRadius: 10, overflow: "hidden", marginBottom: 20,
                    background: selectedOrder.payment.status === "PAID" ? "#F0FDF4" : selectedOrder.payment.status === "FAILED" ? "#FFF1F2" : "#F8FAFD",
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                      <div style={{ padding: "12px 16px", borderRight: "1px solid #E8EEF7", borderBottom: "1px solid #E8EEF7" }}>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Method</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E3A5F" }}>
                          {selectedOrder.payment.method === "COD" ? "💵 Cash on Delivery" : "💳 Online (Razorpay)"}
                        </div>
                      </div>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #E8EEF7" }}>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Payment Status</div>
                        <PaymentBadge payment={selectedOrder.payment} />
                      </div>
                      <div style={{ padding: "12px 16px", borderRight: "1px solid #E8EEF7" }}>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Amount</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1E3A5F", fontFamily: "monospace" }}>
                          ₹{(selectedOrder.payment.amount || 0).toLocaleString()} {selectedOrder.payment.currency}
                        </div>
                      </div>
                      <div style={{ padding: "12px 16px" }}>
                        {selectedOrder.payment.paidAt ? (
                          <>
                            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Paid At</div>
                            <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>
                              {new Date(selectedOrder.payment.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            </div>
                          </>
                        ) : selectedOrder.payment.razorpayOrderId ? (
                          <>
                            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Razorpay Order ID</div>
                            <div style={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace", wordBreak: "break-all" }}>
                              {selectedOrder.payment.razorpayOrderId}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Currency</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F" }}>{selectedOrder.payment.currency || "INR"}</div>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedOrder.payment.razorpayPaymentId && (
                      <div style={{ padding: "10px 16px", borderTop: "1px solid #BBF7D0", background: "#DCFCE7" }}>
                        <span style={{ fontSize: 10, color: "#15803D", fontWeight: 700, textTransform: "uppercase", marginRight: 8 }}>Payment ID:</span>
                        <span style={{ fontSize: 11, color: "#15803D", fontFamily: "monospace" }}>{selectedOrder.payment.razorpayPaymentId}</span>
                      </div>
                    )}
                    {selectedOrder.payment.failedReason && (
                      <div style={{ padding: "10px 16px", borderTop: "1px solid #FECDD3", background: "#FFF1F2" }}>
                        <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 700, textTransform: "uppercase", marginRight: 8 }}>Fail Reason:</span>
                        <span style={{ fontSize: 12, color: "#EF4444" }}>{selectedOrder.payment.failedReason}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Items Ordered with Full Details */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Items Ordered</div>
              <div style={{ border: "1px solid #E8EEF7", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} style={{
                    padding: "16px",
                    borderBottom: idx < selectedOrder.items.length - 1 ? "1px solid #F1F5FA" : "none",
                    background: idx % 2 === 0 ? "#fff" : "#FAFBFF",
                  }}>
                    {/* Product Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1E3A5F" }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                          Product ID: {item.product || "N/A"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1E3A5F" }}>
                          ₹{item.lineTotal?.toLocaleString() || (item.sellingPrice * item.quantity).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                          Qty: {item.quantity} × ₹{item.sellingPrice || 0}
                        </div>
                      </div>
                    </div>

                    {/* Price Details Row */}
                    <div style={{ display: "flex", gap: 20, marginBottom: 12, padding: "8px 0", borderTop: "1px solid #F1F5FA", borderBottom: "1px solid #F1F5FA" }}>
                      {item.mrp && (
                        <div>
                          <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>MRP</div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#64748B", textDecoration: "line-through" }}>₹{item.mrp}</div>
                        </div>
                      )}
                      {item.sellingPrice && (
                        <div>
                          <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>Selling Price</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>₹{item.sellingPrice}</div>
                        </div>
                      )}
                      {item.discount > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>Discount</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#22C55E" }}>{item.discount}% OFF</div>
                        </div>
                      )}
                      {item.unit && (
                        <div>
                          <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>Unit</div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#64748B" }}>{item.unit}</div>
                        </div>
                      )}
                    </div>

                    {/* Designs / Custom Configurations */}
                    {item.designs && item.designs.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>🎨</span> Design Specifications
                        </div>
                        {item.designs.map((design, dIdx) => (
                          <div key={dIdx} style={{
                            background: "#F8FAFD", borderRadius: 8, padding: "12px",
                            marginBottom: dIdx < item.designs.length - 1 ? 8 : 0,
                            border: "1px solid #E8EEF7"
                          }}>
                            {design.config && (
                              <div style={{ display: "grid", gap: 8 }}>
                                {/* Display each config field */}
                                {Object.entries(design.config).map(([key, value]) => {
                                  // Skip quantity as it's displayed separately
                                  if (key === "quantity") return null;
                                  
                                  // Format the key for better display
                                  const displayKey = key.replace(/_/g, " ").replace(/front/gi, "(Front)").replace(/back/gi, "(Back)");
                                  
                                  // Handle file attachments
                                  const isFile = value && (typeof value === "string") && (value.includes("cloudinary") || value.includes("res.cloudinary") || value.match(/\.(jpg|jpeg|png|gif|webp)$/i));
                                  
                                  return (
                                    <div key={key} style={{ fontSize: 12 }}>
                                      <div style={{ fontWeight: 600, color: "#475569", marginBottom: 4 }}>{displayKey}:</div>
                                      {isFile ? (
                                        <a href={value} target="_blank" rel="noopener noreferrer" style={{
                                          color: "#2563EB", fontSize: 11, wordBreak: "break-all", textDecoration: "none",
                                          background: "#EFF6FF", padding: "4px 8px", borderRadius: 6, display: "inline-block"
                                        }}>
                                          📎 View Uploaded File
                                        </a>
                                      ) : Array.isArray(value) ? (
                                        <div style={{ color: "#1E3A5F", fontWeight: 500, display: "flex", flexWrap: "wrap", gap: 4 }}>
                                          {value.map((v, i) => (
                                            <span key={i} style={{ background: "#EFF6FF", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{v}</span>
                                          ))}
                                        </div>
                                      ) : (
                                        <div style={{ color: "#1E3A5F", fontWeight: 500 }}>{value}</div>
                                      )}
                                    </div>
                                  );
                                })}
                                {design.quantity && (
                                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #E2EAF4", fontSize: 12 }}>
                                    <span style={{ fontWeight: 600, color: "#475569" }}>Design Quantity:</span> {design.quantity}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ padding: "14px 16px", background: "#EFF6FF", display: "flex", justifyContent: "space-between", borderTop: "1.5px solid #BFDBFE" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1E3A5F" }}>Total Amount</div>
                  <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 800, color: "#2563EB" }}>
                    ₹{(selectedOrder.totalAmount || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10, marginTop: 16 }}>Shipping Address</div>
                  <div style={{ padding: "14px 16px", background: "#F8FAFD", borderRadius: 10, border: "1px solid #E8EEF7", marginBottom: 20, fontSize: 13 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{selectedOrder.shippingAddress.name}</div>
                    <div style={{ marginBottom: 4 }}>📞 {selectedOrder.shippingAddress.phone}</div>
                    <div style={{ marginBottom: 4 }}>📍 {selectedOrder.shippingAddress.line1}</div>
                    <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</div>
                  </div>
                </>
              )}

              {/* Tracking Updates */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>Tracking Updates</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <input 
                    placeholder="Status (e.g. Dispatched)" 
                    value={trackingStatus} 
                    onChange={e => setTrackingStatus(e.target.value)}
                    style={inputStyle} 
                    disabled={updatingTracking}
                    onFocus={e => e.target.style.borderColor = "#2563EB"} 
                    onBlur={e => e.target.style.borderColor = "#E2EAF4"} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input 
                    placeholder="Location" 
                    value={trackingLocation} 
                    onChange={e => setTrackingLocation(e.target.value)}
                    style={inputStyle} 
                    disabled={updatingTracking}
                    onFocus={e => e.target.style.borderColor = "#2563EB"} 
                    onBlur={e => e.target.style.borderColor = "#E2EAF4"} 
                  />
                </div>
                <button 
                  onClick={handleAddTracking} 
                  disabled={updatingTracking}
                  style={{
                    background: updatingTracking ? "#94A3B8" : "linear-gradient(135deg, #2563EB, #3B82F6)", 
                    color: "#fff", border: "none",
                    borderRadius: 8, padding: "0 16px", fontSize: 13, fontWeight: 700,
                    cursor: updatingTracking ? "not-allowed" : "pointer", 
                    whiteSpace: "nowrap", flexShrink: 0, 
                    boxShadow: updatingTracking ? "none" : "0 2px 6px rgba(37,99,235,0.25)",
                    opacity: updatingTracking ? 0.6 : 1,
                  }}
                >
                  {updatingTracking ? "Adding..." : "+ Add"}
                </button>
              </div>

              {selectedOrder.trackingUpdates && selectedOrder.trackingUpdates.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedOrder.trackingUpdates.map((t, i) => (
                    <div key={i} style={{ 
                      display: "flex", alignItems: "center", gap: 10, 
                      padding: "10px 14px", borderRadius: 8, 
                      background: "#F8FAFD", border: "1px solid #E8EEF7",
                      position: "relative",
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB", flexShrink: 0, boxShadow: "0 0 0 3px rgba(37,99,235,0.15)" }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", flex: 1 }}>{t.status}</div>
                      <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: "monospace" }}>📍 {t.location}</div>
                      {t.updatedAt && (
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>
                          {new Date(t.updatedAt).toLocaleString()}
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveTracking(i)}
                        style={{
                          background: "transparent",
                          border: "1px solid #FECDD3",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 11,
                          color: "#EF4444",
                          cursor: "pointer",
                          marginLeft: "auto",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "18px", textAlign: "center", background: "#F8FAFD", border: "1px dashed #E2EAF4", borderRadius: 8, fontSize: 13, color: "#94A3B8" }}>
                  No tracking updates yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST ─── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          background: toast.error ? "#FFF1F2" : "#F0FDF4",
          border: `1px solid ${toast.error ? "#FECDD3" : "#BBF7D0"}`,
          color: toast.error ? "#EF4444" : "#16A34A",
          padding: "12px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 8,
        }}>
          {toast.error ? "⚠️" : "✓"} {toast.message}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select { appearance: auto; }
      `}</style>
    </div>
  );
}