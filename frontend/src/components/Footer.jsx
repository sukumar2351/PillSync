import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity } from "lucide-react";

const Footer = () => {
  const location = useLocation();

  // Determine if it is a public page layout or inside a user session dashboard
  const isPublicPage = ["/", "/about", "/features", "/contact", "/login", "/register"].includes(location.pathname);

  // We only render this global footer on public pages to avoid overlapping with internal dashboard layout views
  if (!isPublicPage) return null;

  return (
    <footer style={{
      background: "#060a14",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "3.5rem 2rem 2.5rem",
      color: "#64748b",
    }}>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "2.5rem", marginBottom: "3rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Activity size={18} color="#2563EB" />
              <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                PillSync
              </span>
            </div>
            <p style={{ fontSize: "0.82rem", margin: 0, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, maxWidth: 300 }}>
              Intelligent medicine reminder &amp; medication tracking portal. Developed by Sukumar Karnam · Nalanda Degree College.
            </p>
          </div>

          <div>
            <h4 style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
              Quick Links
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem" }}>
              <Link to="/" style={{ color: "#64748b", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "var(--primary)"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Home</Link>
              <Link to="/about" style={{ color: "#64748b", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "var(--primary)"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>About</Link>
              <Link to="/features" style={{ color: "#64748b", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "var(--primary)"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Features</Link>
              <Link to="/notifications-settings" style={{ color: "#64748b", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "var(--primary)"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Notifications</Link>
              <Link to="/contact" style={{ color: "#64748b", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "var(--primary)"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Contact</Link>
              <Link to="/login" style={{ color: "#64748b", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "var(--primary)"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Login</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
              Legal
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <a href="#" style={{ color: "#64748b", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "var(--primary)"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Privacy Policy</a>
              <a href="#" style={{ color: "#64748b", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "var(--primary)"} onMouseLeave={(e) => e.target.style.color = "#64748b"}>Terms &amp; Conditions</a>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          fontSize: "0.8rem"
        }}>
          <span>© 2026 PillSync. Developed by Sukumar Karnam (Nalanda Degree College). All Rights Reserved.</span>
          <span style={{ color: "var(--primary)", fontWeight: 700 }}>PillSync v2.0</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
