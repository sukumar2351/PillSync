import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, User, Bell, LogOut, Activity, Users,
  Pill, Shield, Settings, ChevronRight, Clock,
} from "lucide-react";
import { authService } from "../services/api";

const getLinks = (role) => {
  switch (role) {
    case "admin":
      return [
        { path: "/admin-dashboard",   label: "Dashboard",      icon: <LayoutDashboard size={18} /> },
        { path: "/profile",           label: "Admin Profile",  icon: <User size={18} /> },
      ];
    case "patient":
      return [
        { path: "/patient-dashboard",     label: "Dashboard",              icon: <LayoutDashboard size={18} /> },
        { path: "/profile",               label: "My Profile",             icon: <User size={18} /> },
        { path: "/notifications-settings",label: "Notification Settings",  icon: <Bell size={18} /> },
      ];
    case "caregiver":
      return [
        { path: "/caregiver-dashboard", label: "Dashboard",  icon: <LayoutDashboard size={18} /> },
        { path: "/profile",             label: "My Profile", icon: <User size={18} /> },
      ];
    default:
      return [];
  }
};

const roleColors = {
  admin:    { bg: "rgba(239,68,68,0.15)",    text: "#f87171" },
  patient:  { bg: "rgba(37,99,235,0.15)",    text: "#60a5fa" },
  caregiver:{ bg: "rgba(34,197,94,0.15)",    text: "#4ade80" },
};

const Sidebar = ({ role, email }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const links = getLinks(role);
  const rc = roleColors[role] || { bg: "#1e293b", text: "#94a3b8" };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
    window.location.reload();
  };

  return (
    <aside style={{
      width: 256,
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0a0e1a 0%, #0d1220 60%, #0b0f1a 100%)",
      display: "flex",
      flexDirection: "column",
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
      flexShrink: 0,
      zIndex: 100,
      borderRight: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Brand */}
      <div style={{ padding: "1.75rem 1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
              flexShrink: 0,
            }}
          >
            <Activity size={20} color="white" />
          </motion.div>
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.025em" }}>
            Pill<span style={{ background: "linear-gradient(135deg, #06B6D4, #22C55E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sync</span>
          </span>
        </Link>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: "inline-block",
            marginTop: "0.75rem",
            fontSize: "0.65rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            background: rc.bg,
            color: rc.text,
            padding: "3px 10px",
            borderRadius: 99,
            border: `1px solid ${rc.text}33`,
          }}
        >
          {role}
        </motion.span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "1.25rem 0.875rem" }}>
        <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(148,163,184,0.5)", padding: "0 0.75rem", marginBottom: "0.5rem" }}>
          Navigation
        </p>
        <ul style={{ listStyle: "none" }}>
          {links.map((link, i) => {
            const active = location.pathname === link.path;
            return (
              <motion.li
                key={link.path}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ marginBottom: "0.25rem" }}
              >
                <Link
                  to={link.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.7rem 0.875rem",
                    borderRadius: 10,
                    fontSize: "0.875rem",
                    fontWeight: active ? 700 : 500,
                    color: active ? "#ffffff" : "#94a3b8",
                    background: active
                      ? "linear-gradient(135deg, rgba(37,99,235,0.9), rgba(6,182,212,0.7))"
                      : "transparent",
                    boxShadow: active ? "0 4px 14px rgba(37,99,235,0.3)" : "none",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = "#f1f5f9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#94a3b8";
                    }
                  }}
                >
                  {link.icon}
                  <span style={{ flex: 1 }}>{link.label}</span>
                  {active && <ChevronRight size={14} style={{ opacity: 0.7 }} />}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div style={{
        padding: "1.25rem 0.875rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.2)",
      }}>
        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", padding: "0 0.25rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #2563EB, #06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0,
          }}>
            {role ? role[0].toUpperCase() : "U"}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", margin: 0, textTransform: "capitalize" }}>{role}</p>
            <p style={{ fontSize: "0.75rem", color: "#475569", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</p>
          </div>
        </div>

        {/* Logout */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "#f87171",
            borderRadius: 10,
            padding: "0.6rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </motion.button>
      </div>
    </aside>
  );
};

export default Sidebar;
