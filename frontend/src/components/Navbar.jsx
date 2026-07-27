import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Sun, Moon, User, CheckCheck, X, Pill, Activity,
  MessageSquare, Clock, Search, LogOut, Settings, HelpCircle,
  ChevronRight, Calendar, Globe
} from "lucide-react";
import { authService } from "../services/api";

const notifIcons = {
  reminder: <Pill size={14} />,
  sms: <MessageSquare size={14} />,
  browser: <Bell size={14} />,
  system: <Activity size={14} />,
};

const notifColors = {
  reminder: "var(--primary)",
  sms: "var(--secondary)",
  browser: "var(--accent)",
  system: "var(--warning)",
};

const Navbar = ({ pageTitle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Header / Notification dropdown toggle states
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const [darkMode, setDarkModeState] = useState(() =>
    document.documentElement.getAttribute("data-theme") === "dark" ||
    localStorage.getItem("pillsync-theme") === "dark"
  );

  const profileRef = useRef(null);
  const bellRef = useRef(null);

  const formattedDate = new Date().toLocaleDateString(undefined, {
    month: "short", day: "numeric"
  });
  
  const formattedTime = new Date().toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit"
  });

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnread(data.unread_count || 0);
      }
    } catch (_) { /* silent */ }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/notifications/?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (_) { /* silent */ }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await fetch("http://localhost:8000/api/notifications/mark-read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [] }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch (_) { /* silent */ }
  };

  const handleBellClick = () => {
    if (!notifOpen) {
      fetchNotifications();
      setTimeout(() => {
        markAllRead();
      }, 1500);
    }
    setNotifOpen((v) => !v);
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
    window.location.reload();
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Determine breadcrumb dynamically based on pathname
  const getBreadcrumb = () => {
    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Portal";
    return segments.map(s => s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")).join(" / ");
  };

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        height: 70,
        background: "rgba(15, 23, 42, 0.85)", // Primary: #0F172A with glass transparency
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)", // subtle elegant border
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        position: "sticky",
        top: 0,
        zIndex: 299,
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)", // Apple/Stripe-like depth
        borderRadius: "0 0 16px 16px" // modern rounded bottom corners
      }}
    >
      {/* LEFT SIDE: Logo & Breadcrumbs */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #2563EB, #06B6D4)", // Accent & Highlights
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)"
          }}>
            <Activity size={16} color="white" />
          </div>
        </Link>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <h1 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "-0.015em", fontFamily: "inherit" }}>
            {pageTitle || "PillSync"}
          </h1>
          <span style={{ fontSize: "0.65rem", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {getBreadcrumb()}
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Tools & Dropdowns */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        
        {/* Date / Time */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#E2E8F0", fontSize: "0.78rem", fontWeight: 600, background: "rgba(30, 41, 59, 0.6)", padding: "6px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <Calendar size={13} style={{ color: "#06B6D4" }} />
          <span>{formattedDate}</span>
          <span style={{ color: "rgba(255,255,255,0.15)", margin: "0 2px" }}>|</span>
          <Clock size={13} style={{ color: "#2563EB" }} />
          <span>{formattedTime}</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "rgba(255, 255, 255, 0.12)" }} />

        {/* Dark Mode Toggle */}
        <motion.button
          className="btn-icon"
          onClick={() => {
            const next = !darkMode;
            setDarkModeState(next);
            document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
            localStorage.setItem("pillsync-theme", next ? "dark" : "light");
          }}
          whileHover={{ scale: 1.05, background: "rgba(255, 255, 255, 0.08)" }}
          whileTap={{ scale: 0.95 }}
          style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(30, 41, 59, 0.4)", transition: "background 0.2s" }}
        >
          {darkMode ? <Sun size={15} color="#06B6D4" /> : <Moon size={15} color="#E2E8F0" />}
        </motion.button>

        {/* Bell / Notifications */}
        <div ref={bellRef} style={{ position: "relative" }}>
          <motion.button
            className="nav-icon-btn"
            onClick={handleBellClick}
            whileHover={{ scale: 1.05, background: "rgba(255, 255, 255, 0.08)", rotate: [0, -10, 10, 0] }}
            whileTap={{ scale: 0.95 }}
            style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(30, 41, 59, 0.4)", position: "relative", transition: "background 0.2s" }}
          >
            <Bell size={15} color="#E2E8F0" />
            <AnimatePresence>
              {unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  style={{
                    position: "absolute", top: -3, right: -3,
                    background: "var(--primary)", color: "white",
                    fontSize: "0.625rem", fontWeight: 800,
                    width: 15, height: 15, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 6px rgba(37,99,235,0.4)"
                  }}
                >
                  {unread > 9 ? "9+" : unread}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Sliding Notifications Drawer */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, x: 120 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 120 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{
                  position: "fixed", top: 80, right: 20, width: 340,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  overflow: "hidden", zIndex: 1000
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>Notifications</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: "0.72rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                      <CheckCheck size={12} /> Mark all read
                    </button>
                    <button onClick={() => setNotifOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-light)" }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div style={{ maxHeight: 350, overflowY: "auto" }}>
                  {loading ? (
                    <div style={{ padding: "2rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-light)", fontSize: "0.78rem" }}>
                      No new alerts. Keep it up!
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", background: n.is_read ? "transparent" : "rgba(37,99,235,0.02)" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${notifColors[n.type] || "var(--primary)"}1A`, color: notifColors[n.type] || "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {notifIcons[n.type] || <Bell size={10} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: "0.75rem", margin: 0 }}>{n.title}</p>
                          <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: "1px 0" }}>{n.message}</p>
                          <span style={{ fontSize: "0.625rem", color: "var(--text-light)" }}>{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User / Profile Avatar Dropdown */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <motion.div
              onClick={() => setProfileOpen(!profileOpen)}
              whileHover={{ scale: 1.1, boxShadow: "0 0 10px rgba(37,99,235,0.3)" }}
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", flexShrink: 0, cursor: "pointer"
              }}
            >
              <User size={15} />
            </motion.div>

            <span style={{ fontSize: "0.78rem", color: "#E2E8F0", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <span className="online-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 8px #10B981" }} />
              Online
            </span>
          </div>

          {/* Animated Dropdown Menu */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{
                  position: "absolute", top: 44, right: 0, width: 200,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 14, boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                  overflow: "hidden", zIndex: 1000, padding: "0.5rem"
                }}
              >
                {[
                  { label: "My Profile", path: "/profile", icon: <User size={13} /> },
                  { label: "Notification Settings", path: "/notifications-settings", icon: <Settings size={13} /> },
                  { label: "Help Center", path: "/contact", icon: <HelpCircle size={13} /> }
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={() => setProfileOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.6rem 0.75rem", borderRadius: 8,
                      textDecoration: "none", color: "var(--text-primary)",
                      fontSize: "0.8rem", transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ color: "var(--primary)" }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}

                {/* Divider */}
                <div style={{ height: 1, background: "var(--border)", margin: "0.35rem 0" }} />

                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%", border: "none", background: "transparent",
                    textAlign: "left", cursor: "pointer", display: "flex",
                    alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.75rem",
                    borderRadius: 8, color: "var(--error-color)", fontSize: "0.8rem"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.header>
  );
};

export default Navbar;
