import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Sun, Moon, Menu, X, Bell } from "lucide-react";

const Header = ({ darkMode, setDarkMode }) => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isPublicPage = ["/", "/about", "/features", "/contact", "/notifications-settings"].includes(location.pathname);

  // Hide global navbar on auth, dashboard & profile pages to preserve specialized layouts
  if (!isPublicPage) return null;

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Features", path: "/features" },
    { label: "Notifications", path: "/notifications-settings" }, // Navigates to notification details/settings
    { label: "Contact", path: "/contact" },
  ];

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 300,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: scrolled
          ? "rgba(var(--bg-base-rgb, 255,255,255), 0.85)"
          : "transparent",
        borderBottom: "1px solid var(--border)",
        transition: "background 0.3s ease, border 0.3s ease",
      }}
    >
      <div style={{
        maxWidth: 1160, margin: "0 auto", padding: "0 2rem",
        height: 68, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #2563EB, #06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
          }}>
            <Activity size={18} color="white" />
          </div>
          <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            Pill<span style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sync</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: "1.75rem" }} className="desktop-nav-menu">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.label}
                to={link.path}
                style={{
                  color: active ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.9rem",
                  transition: "all 0.2s ease",
                  position: "relative",
                  padding: "4px 0",
                }}
              >
                {link.label}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    style={{
                      position: "absolute", bottom: -2, left: 0, right: 0, height: 2,
                      background: "var(--primary)", borderRadius: 99
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Dark mode toggle */}
          <motion.button
            onClick={() => setDarkMode(!darkMode)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: "var(--bg-hover)", border: "1px solid var(--border)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-secondary)"
            }}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>

          <Link to="/login" style={{ display: "inline-block" }}>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: "0.5rem 1.125rem", borderRadius: 10,
                background: "transparent", border: "1px solid var(--border)",
                cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                color: "var(--text-primary)", fontFamily: "inherit"
              }}
            >
              Login
            </motion.button>
          </Link>
          <Link to="/register" style={{ display: "inline-block" }}>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(37,99,235,0.4)" }} whileTap={{ scale: 0.97 }}
              style={{
                padding: "0.5rem 1.25rem", borderRadius: 10,
                background: "linear-gradient(135deg, #2563EB, #06B6D4)", border: "none",
                cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                color: "#fff", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(37,99,235,0.3)"
              }}
            >
              Register
            </motion.button>
          </Link>

          {/* Mobile Menu Btn */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: "none", background: "none", border: "none",
              color: "var(--text-primary)", cursor: "pointer"
            }}
            className="mobile-menu-btn"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "var(--bg-primary)",
              borderTop: "1px solid var(--border)",
              padding: "1rem 2rem",
              display: "flex", flexDirection: "column", gap: "1rem"
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                style={{
                  color: "var(--text-secondary)", fontWeight: 500, fontSize: "1rem"
                }}
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .desktop-nav-menu {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      ` }} />
    </motion.header>
  );
};

export default Header;
