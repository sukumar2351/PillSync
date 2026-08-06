import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { Bell, Check, Trash2, Filter, AlertTriangle, MessageSquare, Info, ShieldAlert } from "lucide-react";

const NotificationCenter = ({ auth }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread' | 'reminder' | 'system'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/notifications/");
      setNotifications(res.data || []);
    } catch (err) {
      setError("Failed to fetch notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/mark-read", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "reminder") return n.type === "reminder" || n.type === "sms";
    if (filter === "system") return n.type === "system";
    return true;
  });

  return (
    <div className="app-container" style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#F8FAFC" }}>
      <Sidebar role={auth?.role} email={auth?.email} />

      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
        <Navbar pageTitle="Notification Center" />

        <main className="content-area" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Header Bar */}
          <div
            className="page-section stagger-1 card"
            style={{
              padding: "1.5rem",
              borderRadius: "20px",
              background: "#FFFFFF",
              marginBottom: "1.5rem",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
                <Bell size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#1E293B" }}>
                  Notification History & Alerts
                </h2>
                <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                  Real-time medicine reminders, system logs & refill warnings
                </span>
              </div>
            </div>

            <button onClick={handleMarkAllRead} className="btn btn-secondary" style={{ fontSize: "0.82rem" }}>
              <Check size={16} style={{ marginRight: "0.3rem" }} /> Mark All as Read
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Notifications" },
              { id: "unread", label: "Unread" },
              { id: "reminder", label: "Reminders & Alerts" },
              { id: "system", label: "System Notices" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "20px",
                  border: "1px solid #E2E8F0",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: filter === f.id ? "#2563EB" : "#FFFFFF",
                  color: filter === f.id ? "#FFFFFF" : "#64748B",
                  transition: "all 0.2s ease"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="page-section stagger-2" style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {isLoading && (
              [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "14px" }} />)
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="card" style={{ padding: "3rem", textAlign: "center", color: "#64748B", borderRadius: "16px" }}>
                <Bell size={36} color="#94A3B8" style={{ marginBottom: "0.75rem" }} />
                <h4 style={{ margin: "0 0 0.25rem", color: "#1E293B" }}>No Notifications Found</h4>
                <p style={{ margin: 0, fontSize: "0.85rem" }}>You are all caught up!</p>
              </div>
            )}

            {!isLoading && filtered.map((n) => (
              <div
                key={n.id}
                className="card hover-card"
                style={{
                  padding: "1.25rem 1.5rem",
                  borderRadius: "16px",
                  background: n.is_read ? "#FFFFFF" : "#F0F9FF",
                  borderLeft: `4px solid ${n.is_read ? "#E2E8F0" : "#2563EB"}`,
                  display: "flex",
                  justify: "space-between",
                  alignItems: "center",
                  gap: "1rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: n.type === "reminder" ? "#EFF6FF" : "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <strong style={{ fontSize: "0.95rem", color: "#1E293B" }}>{n.title}</strong>
                      {!n.is_read && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563EB" }} />}
                    </div>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.84rem", color: "#64748B" }}>{n.message}</p>
                    <span style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(n.id)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                  className="hover-card"
                  title="Delete Notification"
                >
                  <Trash2 size={18} color="#EF4444" />
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationCenter;
