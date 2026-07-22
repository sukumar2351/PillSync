import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowLeft, Target, Eye, Heart, Code, Clock, Award } from "lucide-react";

const Section = ({ children, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    style={style}
  >
    {children}
  </motion.div>
);

const About = () => {
  const techStack = [
    { name: "React 19", desc: "Frontend framework with Framer Motion", color: "#61DAFB" },
    { name: "Python FastAPI", desc: "High-performance async backend API", color: "#009688" },
    { name: "PostgreSQL", desc: "Relational database with SQLAlchemy ORM", color: "#336791" },
    { name: "JWT Auth", desc: "Secure token-based authentication", color: "#F59E0B" },
    { name: "Twilio SMS", desc: "Real SMS delivery to mobile numbers", color: "#F22F46" },
    { name: "Framer Motion", desc: "Premium animations and page transitions", color: "#8B5CF6" },
  ];

  const milestones = [
    { label: "Milestone 1", date: "June 2026", title: "Foundation & Auth", desc: "User registration, JWT login, role-based dashboards (Patient, Caregiver, Admin), PostgreSQL schema.", done: true },
    { label: "Milestone 2", date: "July 2026", title: "Medicine & SMS", desc: "Medicine CRUD, reminder scheduling, Twilio SMS integration, notification settings, adherence history.", done: true },
    { label: "Milestone 3", date: "TBD", title: "AI & Intelligence", desc: "AI-powered adherence prediction, smart scheduling suggestions, caregiver alerts, analytics dashboard.", done: false },
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
          <Link to="/login"><button style={{ padding: "0.4rem 1rem", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", fontFamily: "inherit" }}>Login</button></Link>
          <Link to="/register"><button style={{ padding: "0.4rem 1rem", borderRadius: 8, background: "linear-gradient(135deg, #2563EB, #06B6D4)", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", color: "#fff", fontFamily: "inherit" }}>Register</button></Link>
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
        <div style={{ position: "absolute", top: "30%", left: "15%", width: 300, height: 300, borderRadius: "50%", background: "rgba(37,99,235,0.1)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "20%", right: "15%", width: 250, height: 250, borderRadius: "50%", background: "rgba(6,182,212,0.08)", filter: "blur(70px)" }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#06B6D4", marginBottom: "1rem" }}>About Us</p>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "white", letterSpacing: "-0.04em", marginBottom: "1.5rem", lineHeight: 1.1 }}>
            About <span style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4, #22C55E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PillSync</span>
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(148,163,184,0.9)", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
            A professional healthcare platform built to eliminate medication non-adherence through intelligent reminders, caregiver oversight, and real-time tracking.
          </p>
        </motion.div>
      </section>

      {/* Mission / Vision / Goal */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "4rem" }}>
          {[
            { icon: <Target size={24} />, color: "#2563EB", title: "Our Mission", text: "To reduce medication non-adherence by providing patients, caregivers, and healthcare providers with a reliable, secure, and intelligent medication tracking platform." },
            { icon: <Eye size={24} />, color: "#06B6D4", title: "Our Vision", text: "A world where every patient takes the right medicine at the right time — empowered by technology, supported by caregivers, and guided by AI." },
            { icon: <Heart size={24} />, color: "#22C55E", title: "Our Goal", text: "Build a production-ready healthcare SaaS platform that can scale to thousands of patients while maintaining the highest standards of privacy and security." },
          ].map((c) => (
            <Section key={c.title}>
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 20, padding: "2rem",
                backdropFilter: "blur(12px)",
                boxShadow: "var(--shadow-sm)",
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${c.color}18`, color: c.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  {c.icon}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>{c.title}</h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.9rem" }}>{c.text}</p>
              </div>
            </Section>
          ))}
        </div>

        {/* Tech Stack */}
        <Section>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "linear-gradient(135deg, #2563EB, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.75rem" }}>Technology</p>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "2rem" }}>Built With Modern Technology</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "4rem" }}>
            {techStack.map((t) => (
              <motion.div key={t.name} whileHover={{ y: -4 }} style={{
                background: "var(--bg-primary)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "1.25rem",
                borderLeft: `3px solid ${t.color}`,
              }}>
                <p style={{ fontWeight: 700, color: t.color, marginBottom: "0.25rem", fontSize: "0.95rem" }}>{t.name}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Timeline */}
        <Section>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "linear-gradient(135deg, #2563EB, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.75rem" }}>Timeline</p>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "2.5rem" }}>Project Milestones</h2>
          <div style={{ position: "relative", paddingLeft: "2rem" }}>
            <div style={{ position: "absolute", left: "0.6rem", top: 0, bottom: 0, width: 2, background: "var(--border)" }} />
            {milestones.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{ marginBottom: "2rem", position: "relative" }}
              >
                <div style={{
                  position: "absolute", left: "-2.6rem", top: "0.25rem",
                  width: 14, height: 14, borderRadius: "50%",
                  background: m.done ? "linear-gradient(135deg, #2563EB, #06B6D4)" : "var(--border)",
                  border: `2px solid ${m.done ? "#2563EB" : "var(--border-strong)"}`,
                  boxShadow: m.done ? "0 0 12px rgba(37,99,235,0.4)" : "none",
                }} />
                <div style={{
                  background: "var(--bg-primary)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: "1.5rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px",
                      borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em",
                      background: m.done ? "rgba(37,99,235,0.1)" : "var(--bg-hover)",
                      color: m.done ? "#2563EB" : "var(--text-light)",
                    }}>{m.label}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>{m.date}</span>
                    {m.done && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#22C55E", padding: "2px 8px", background: "rgba(34,197,94,0.1)", borderRadius: 99 }}>✓ Complete</span>}
                  </div>
                  <h3 style={{ fontWeight: 700, marginBottom: "0.4rem" }}>{m.title}</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Developer */}
        <Section>
          <div style={{
            background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(6,182,212,0.08))",
            border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: 20, padding: "2.5rem", textAlign: "center",
          }}>
            <Award size={40} style={{ color: "#06B6D4", margin: "0 auto 1rem" }} />
            <h3 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: "0.25rem" }}>Sukumar Karnam</h3>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Developer · Full Stack Developer</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-light)", fontWeight: 600, marginBottom: "1.25rem" }}>BCA Student · Nalanda Degree College</p>
            
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 1.5rem" }}>
              PillSync is developed as part of the Infosys Springboard Internship program, demonstrating full-stack healthcare application development with industry best practices.
            </p>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, padding: "6px 16px", borderRadius: 99, background: "linear-gradient(135deg, #2563EB, #06B6D4)", color: "white" }}>v2.0 — Milestone 2</span>
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

export default About;
