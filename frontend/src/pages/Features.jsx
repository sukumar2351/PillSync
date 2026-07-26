import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, ArrowLeft, Pill, MessageSquare, Bell, BarChart3, Users, Shield, Cpu, Zap, Star
} from "lucide-react";

const Section = ({ children, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5 }}
    style={style}
  >
    {children}
  </motion.div>
);

const Features = () => {
  const coreFeatures = [
    { icon: <Pill size={28} />, color: "#2563EB", title: "Medicine Reminder", desc: "Easily schedule daily doses, specify quantities, frequency metrics, and check physical med parameters.", details: ["Detailed Dosages", "Custom Intervals", "Stock Count Alerts"] },
    { icon: <MessageSquare size={28} />, color: "#06B6D4", title: "SMS Reminder", desc: "No more mock alerts. Get real, live SMS reminder dispatches powered by Twilio directly to your registered phone number.", details: ["Twilio Live Dispatch", "E.164 Validation", "Failover Audit Trail"] },
    { icon: <Bell size={28} />, color: "#8B5CF6", title: "Browser Notification", desc: "Receive immediate browser push notifications when a dose is due. Fully integrated with patient schedules.", details: ["Zero Install Needed", "Audio Alert Chimes", "Instant Syncing"] },
    { icon: <BarChart3 size={28} />, color: "#22C55E", title: "Medication History", desc: "Log schedules as 'Taken' or 'Missed'. The platform records history and computes adherence percentages.", details: ["Daily Checklists", "Adherence Analytics", "Missed Dose Logging"] },
    { icon: <Users size={28} />, color: "#F59E0B", title: "Caregiver Dashboard", desc: "Link caregivers to patient accounts. Caregivers can view logs, history, and adherence statistics in real-time.", details: ["Adherence Reports", "Email Link Checks", "Patient Profile Views"] },
  ];

  const aiFeatures = [
    { icon: <Cpu size={24} />, title: "OCR Scanner", desc: "Scan medicine labels to auto-extract dosage instructions and auto-populate medicine profile fields." },
    { icon: <Zap size={24} />, title: "AI Features", desc: "AI models predicting future adherence patterns and recommending optimal scheduling structures." },
  ];


  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Navbar */}
      <header style={{
        background: "var(--bg-primary)", borderBottom: "1px solid var(--border)",
        padding: "0 2rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)",
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <ArrowLeft size={16} style={{ color: "var(--text-secondary)" }} />
          <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.875rem" }}>Back to Home</span>
        </Link>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #2563EB, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1.1rem", letterSpacing: "-0.02em" }}>PillSync</span>
        </Link>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/login"><button style={{ padding: "0.4rem 1rem", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>Login</button></Link>
          <Link to="/register"><button style={{ padding: "0.4rem 1rem", borderRadius: 8, background: "linear-gradient(135deg, #2563EB, #06B6D4)", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", color: "#fff" }}>Register</button></Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(160deg, #060a14 0%, #0d1a35 60%, #0a1628 100%)",
        padding: "5rem 2rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "30%", left: "15%", width: 300, height: 300, borderRadius: "50%", background: "rgba(6,182,212,0.1)", filter: "blur(80px)" }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#06B6D4", marginBottom: "1rem" }}>Platform Features</p>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "white", letterSpacing: "-0.04em", marginBottom: "1.5rem", lineHeight: 1.1 }}>
            Built for Adherence
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(148,163,184,0.9)", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
            Explore the powerful modules engineered in Milestone 2. Designed to connect patient schedules to live notification systems.
          </p>
        </motion.div>
      </section>

      {/* Grid of features */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "4rem 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", marginBottom: "5rem" }}>
          {coreFeatures.map((f, i) => (
            <Section key={f.title}>
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 20, padding: "2.5rem", height: "100%",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                boxShadow: "var(--shadow-sm)",
              }}>
                <div>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}18`, color: f.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.75rem" }}>{f.title}</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>{f.desc}</p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {f.details.map((d) => (
                    <span key={d} style={{ fontSize: "0.72rem", fontWeight: 600, background: "var(--bg-hover)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: 99 }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </Section>
          ))}
        </div>

        {/* AI Features coming soon */}
        <Section>
          <div style={{
            background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(6,182,212,0.06))",
            border: "1px solid rgba(37,99,235,0.15)",
            borderRadius: 24, padding: "3rem 2rem", textAlign: "center"
          }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Future AI Intelligence</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "2.5rem" }}>Milestone 3 Roadmap &amp; AI Integration Plans</p>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", textAlign: "left" }}>
              {aiFeatures.map((ai) => (
                <div key={ai.title} style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem", position: "relative" }}>
                  <div style={{ color: "var(--primary)", marginBottom: "0.75rem" }}>{ai.icon}</div>
                  <h4 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem" }}>{ai.title}</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>{ai.desc}</p>
                  <span style={{ position: "absolute", top: 16, right: 16, fontSize: "0.65rem", fontWeight: 700, padding: "3px 10px", background: "rgba(37,99,235,0.12)", color: "var(--primary)", borderRadius: 99 }}>Coming Soon</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <footer style={{ background: "#060a14", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#475569", fontSize: "0.85rem" }}>© 2026 PillSync. All rights reserved. | <Link to="/" style={{ color: "#06B6D4" }}>Return to Home</Link></p>
      </footer>
    </div>
  );
};

export default Features;
