import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Pill, Bell, Heart, Shield, Users, Activity, ChevronRight,
  Star, ArrowRight, X, Sun, Moon, Zap, BarChart3,
  Mail, Phone, MapPin, Award, Code, BookOpen, Layers, Lock

} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

/* ── Cinematic Heading (Letter by Letter) ──────────── */
const AnimatedTitle = ({ text }) => {
  const words = text.split(" ");
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 15, filter: "blur(4px)", scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: { duration: 1.2, ease: "easeInOut" }
    }
  };

  return (
    <motion.h1
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        fontSize: "clamp(3.5rem, 9vw, 5.5rem)",
        fontWeight: 900,
        lineHeight: 1.05,
        letterSpacing: "-0.04em",
        marginBottom: "1.25rem",
        color: "white",
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "0.25em"
      }}
    >
      {words.map((word, wordIdx) => (
        <span key={wordIdx} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          {word.split("").map((char, charIdx) => (
            <motion.span
              key={charIdx}
              variants={letterVariants}
              style={{ display: "inline-block" }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.h1>
  );
};

/* ── Background Floating Cross and Particle generator ── */
const ParticleBG = () => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const items = [...Array(15)].map((_, idx) => ({
      id: idx,
      size: Math.random() * 8 + 4,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5
    }));
    setParticles(items);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: ["0%", "100%", "0%"],
            x: [`${p.x}%`, `${p.x + (Math.random() * 10 - 5)}%`, `${p.x}%`],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            background: "rgba(6,182,212,0.2)",
            borderRadius: "50%",
            filter: "blur(1px)"
          }}
        />
      ))}
    </div>
  );
};

const FloatIcon = ({ icon, style }) => (
  <motion.div
    animate={{ y: [0, -18, 0], rotate: [0, 8, -8, 0] }}
    transition={{ duration: 7 + Math.random() * 4, repeat: Infinity, ease: "easeInOut" }}
    style={{
      position: "absolute",
      width: 54, height: 54,
      borderRadius: 14,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(12px)",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "rgba(255,255,255,0.5)",
      zIndex: 2,
      ...style,
    }}
  >
    {icon}
  </motion.div>
);

const Heartbeat = () => (
  <svg viewBox="0 0 300 60" style={{ width: "100%", maxWidth: 360, opacity: 0.6 }}>
    <motion.path
      d="M0 30 L60 30 L80 10 L100 50 L120 20 L140 40 L160 30 L300 30"
      fill="none"
      stroke="url(#hbGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    />
    <defs>
      <linearGradient id="hbGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#22C55E" />
      </linearGradient>
    </defs>
  </svg>
);

const Section = ({ children, id, style }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      id={id}
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: "easeInOut" } }
      }}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      style={{ padding: "5rem 2rem", maxWidth: 1160, margin: "0 auto", width: "100%", ...style }}
    >
      {children}
    </motion.section>
  );
};

const Landing = ({ triggerLoader }) => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingTop: 68 }}>
      
      {/* Hero Section */}
      <section style={{
        minHeight: "calc(100vh - 68px)",
        background: "linear-gradient(160deg, #060a14 0%, #0d1a35 40%, #0a1628 70%, #06111f 100%)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Glow circles & particles */}
        <div style={{ position: "absolute", top: "15%", left: "8%", width: 450, height: 450, borderRadius: "50%", background: "rgba(37,99,235,0.12)", filter: "blur(110px)", animation: "floatSlow 14s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "8%", width: 350, height: 350, borderRadius: "50%", background: "rgba(6,182,212,0.1)", filter: "blur(90px)", animation: "floatSlow 18s ease-in-out infinite reverse" }} />
        
        <ParticleBG />

        {/* Floating cross & shapes */}
        <FloatIcon icon={<Pill size={22} />} style={{ top: "20%", left: "10%" }} />
        <FloatIcon icon={<Heart size={22} />} style={{ top: "28%", right: "12%" }} />
        <FloatIcon icon={<Shield size={22} />} style={{ bottom: "24%", left: "15%" }} />
        <FloatIcon icon={<Bell size={22} />} style={{ bottom: "18%", right: "18%" }} />

        {/* Medical Cross Custom SVG */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", top: "15%", right: "20%", opacity: 0.15, pointerEvents: "none" }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z" />
          </svg>
        </motion.div>

        <div style={{ maxWidth: 840, textAlign: "center", padding: "0 2rem", position: "relative", zIndex: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
              color: "#60a5fa", padding: "6px 18px", borderRadius: 99,
              fontSize: "0.8rem", fontWeight: 700, marginBottom: "1.75rem", letterSpacing: "0.05em",
            }}>
              <Zap size={12} fill="#60a5fa" /> PillSync Live Portal
            </span>
          </motion.div>

          <AnimatedTitle text="PillSync" />

          <motion.p
            initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeInOut" }}
            style={{
              fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
              color: "rgba(241,245,249,0.95)",
              marginBottom: "1rem",
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            Intelligent Medicine Reminder &amp; Medication Tracking Platform
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.6, ease: "easeInOut" }}
            style={{
              fontSize: "0.95rem",
              color: "rgba(148,163,184,0.85)",
              lineHeight: 1.7,
              marginBottom: "2.75rem",
              maxWidth: 640,
              margin: "0 auto 2.75rem",
            }}
          >
            PillSync is a smart healthcare platform designed to help patients manage medicines, schedule reminders, receive browser and SMS notifications, monitor medication history, and improve medication adherence. Caregivers can also monitor patient medication activities through a secure dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
            style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(37,99,235,0.5)", y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (triggerLoader) {
                  triggerLoader(() => navigate("/login"));
                } else {
                  navigate("/login");
                }
              }}
              style={{
                padding: "0.9rem 2.25rem", borderRadius: 14,
                background: "linear-gradient(135deg, #2563EB, #06B6D4)",
                border: "none", cursor: "pointer", fontWeight: 700,
                fontSize: "1rem", color: "#fff", fontFamily: "inherit",
                boxShadow: "0 4px 18px rgba(37,99,235,0.45)",
                display: "flex", alignItems: "center", gap: "0.5rem",
                transition: "box-shadow 0.6s ease"
              }}
            >
              Get Started <ArrowRight size={18} />
            </motion.button>
            <a href="#features">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: "0.9rem 2.25rem", borderRadius: 14,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer", fontWeight: 600, fontSize: "1rem",
                  color: "white", fontFamily: "inherit",
                  backdropFilter: "blur(8px)",
                }}
              >
                Learn More
              </motion.button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1.0 }}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Heartbeat />
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <Section id="features">
        <motion.p variants={fadeUp} className="section-eyebrow" style={{ textAlign: "center" }}>Capabilities</motion.p>
        <motion.h2 variants={fadeUp} style={{ textAlign: "center", fontSize: "2.25rem", fontWeight: 800, marginBottom: "3rem" }}>
          Platform Features
        </motion.h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {[
            { icon: <Pill size={24} />, title: "Medicine Management", desc: "Easily schedule daily doses, specify quantities, frequency metrics, and check physical med parameters." },
            { icon: <Zap size={24} />, title: "Medicine Scheduling", desc: "Enable customized timeslot alerts for Morning, Afternoon, Evening, or Night reminder slots." },
            { icon: <Bell size={24} />, title: "Browser Notifications", desc: "Receive immediate browser push notification chimes when a scheduled medicine is due." },
            { icon: <Mail size={24} />, title: "SMS Reminders", desc: "Get real, live SMS reminders dispatching via Twilio directly to your registered number." },
            { icon: <BarChart3 size={24} />, title: "Medication History", desc: "Generate complete user compliance logs and medication check history automatically." },
            { icon: <Users size={24} />, title: "Caregiver Dashboard", desc: "Link caregiver check emails to display Linked Patient Profiles and adherence histories." },
            { icon: <Lock size={24} />, title: "Secure Authentication", desc: "JWT cookies, bcrypt password hashing, authed endpoint protection, and validation guards." },
            { icon: <Layers size={24} />, title: "Responsive Design", desc: "Fluid grid structures that work flawlessly across phone, tablet, laptop, and desktop viewports." }
          ].map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: idx * 0.1, ease: "easeInOut" }}
              whileHover={{ y: -6, scale: 1.03 }}
              style={{
                background: "var(--bg-card)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border)",
                borderRadius: 20, padding: "2rem",
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.6s ease"
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(37,99,235,0.08)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.5rem" }}>{feat.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Developer Section */}
      <div style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <Section style={{ padding: "4.5rem 2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2.5rem", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", marginBottom: "0.5rem" }}>Core Architect</p>
              <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "1rem", letterSpacing: "-0.03em" }}>Developer Card</h2>
              
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                style={{
                  background: "linear-gradient(135deg, rgba(37,99,235,0.05), rgba(6,182,212,0.05))",
                  border: "1px solid var(--border)",
                  borderRadius: 20, padding: "2rem",
                  transition: "all 0.5s ease"
                }}
              >
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Developer</p>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Sukumar Karnam</h3>
                
                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-light)", marginTop: "4px", marginBottom: "8px" }}>
                  BCA Student · Nalanda Degree College
                </p>
                <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 700, background: "rgba(6,182,212,0.12)", color: "#06B6D4", padding: "2px 8px", borderRadius: 99, marginBottom: "1rem" }}>
                  Full Stack Developer
                </span>
                
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  Focused on implementing reliable Full Stack healthcare portals with PostgreSQL integrity constraints and high-grade SaaS aesthetics.
                </p>
              </motion.div>
            </div>

            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" }}>Technology Stack</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {[
                  { name: "React", icon: <Code size={16} /> },
                  { name: "FastAPI", icon: <Zap size={16} /> },
                  { name: "Python", icon: <Activity size={16} /> },
                  { name: "PostgreSQL", icon: <Database size={16} /> },
                  { name: "SQLAlchemy", icon: <Layers size={16} /> },
                  { name: "JWT Authentication", icon: <Lock size={16} /> },
                  { name: "Tailwind CSS", icon: <BookOpen size={16} /> }
                ].map((tech) => (
                  <div key={tech.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-base)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <div style={{ color: "var(--primary)" }}>{tech.icon}</div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <footer style={{
        background: "#060a14",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "3rem 2rem 2rem",
        color: "#64748b",
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Activity size={18} color="#2563EB" />
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "white" }}>PillSync</span>
              </div>
              <p style={{ fontSize: "0.8rem", margin: 0 }}>Intelligent medicine reminder &amp; tracking portal.</p>
            </div>
            
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <a href="#" style={{ color: "#64748b", fontSize: "0.875rem" }}>Privacy Policy</a>
              <a href="#" style={{ color: "#64748b", fontSize: "0.875rem" }}>Terms &amp; Conditions</a>
              <Link to="/contact" style={{ color: "#64748b", fontSize: "0.875rem" }}>Contact</Link>
            </div>
            
            <div style={{ display: "flex", gap: "1.3rem" }}>
              <a href="#" aria-label="GitHub" style={{ color: "#475569" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" style={{ color: "#475569" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>
          
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.8rem" }}>
            <span>© 2026 PillSync. Developed By Sukumar Karnam · Nalanda Degree College. All Rights Reserved.</span>
            <span style={{ color: "var(--primary)", fontWeight: 600 }}>v2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Database = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color }}>
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
    <path d="M3 12A9 3 0 0 0 21 12"></path>
  </svg>
);

export default Landing;
