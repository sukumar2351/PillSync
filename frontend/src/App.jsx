import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/PatientDashboard";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import NotificationSettings from "./pages/NotificationSettings";
import Reports from "./pages/Reports";
import NotificationCenter from "./pages/NotificationCenter";
import EmergencyCard from "./pages/EmergencyCard";
import OCRHistory from "./pages/OCRHistory";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Features from "./pages/Features";
import Contact from "./pages/Contact";

// Page transition variants — smooth healthcare-grade transitions
const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99, filter: "blur(3px)" },
  enter:   { opacity: 1, y: 0,  scale: 1,    filter: "blur(0px)", transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -8, scale: 0.99, filter: "blur(2px)", transition: { duration: 0.28, ease: [0.55, 0, 1, 0.45] } },
};
const pageTransition = { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] };

// ── Cinematic Global Loader ───────────────────────────
const Loader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 200);
          return 100;
        }
        return prev + 5;
      });
    }, 60);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "radial-gradient(circle at center, #0a0e1a 0%, #05070f 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
      {/* Glow effect */}
      <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(37,99,235,0.15)", filter: "blur(60px)" }} />

      {/* Pill/Capsule Icon */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ marginBottom: "1.5rem" }}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#loaderGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
          <path d="M2 12h20" />
          <defs>
            <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Logo */}
      <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "white", marginBottom: "0.5rem", letterSpacing: "-0.03em" }}>
        Pill<span style={{ background: "linear-gradient(135deg, #06B6D4, #22C55E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sync</span>
      </h2>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "2rem" }}>
        Connecting Adherence
      </p>

      {/* Heartbeat SVG path */}
      <svg width="180" height="40" viewBox="0 0 300 60" style={{ marginBottom: "1.5rem" }}>
        <motion.path
          d="M0 30 L60 30 L80 10 L100 50 L120 20 L140 40 L160 30 L300 30"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* Progress Bar */}
      <div style={{ width: 140, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", position: "relative" }}>
        <motion.div
          style={{ height: "100%", background: "linear-gradient(90deg, #2563EB, #06B6D4)", width: `${progress}%` }}
          transition={{ ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
};

const AnimatedRoutes = ({ auth, setAuth, darkMode, setDarkMode, loading, setLoading, triggerLoader }) => {
  const location = useLocation();

  const handleLoaderComplete = useCallback(() => {
    setLoading(false);
  }, [setLoading]);

  const dashboardProps = { auth, setAuth, darkMode, setDarkMode, triggerLoader };

  return (
    <>
      <AnimatePresence>
        {loading && <Loader onComplete={handleLoaderComplete} />}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        style={{ minHeight: "100vh" }}
      >
        <Routes location={location}>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              auth.token ? (
                auth.role === "admin"     ? <Navigate to="/admin-dashboard" /> :
                auth.role === "patient"   ? <Navigate to="/patient-dashboard" /> :
                                            <Navigate to="/caregiver-dashboard" />
              ) : (
                <Landing darkMode={darkMode} setDarkMode={setDarkMode} triggerLoader={triggerLoader} />
              )
            }
          />
          <Route
            path="/login"
            element={
              auth.token ? (
                auth.role === "admin"     ? <Navigate to="/admin-dashboard" replace /> :
                auth.role === "patient"   ? <Navigate to="/patient-dashboard" replace /> :
                                            <Navigate to="/caregiver-dashboard" replace />
              ) : (
                <Login setAuth={setAuth} darkMode={darkMode} setDarkMode={setDarkMode} triggerLoader={triggerLoader} />
              )
            }
          />
          <Route path="/register"
            element={
              auth.token ? (
                auth.role === "admin"   ? <Navigate to="/admin-dashboard" replace /> :
                auth.role === "patient" ? <Navigate to="/patient-dashboard" replace /> :
                                          <Navigate to="/caregiver-dashboard" replace />
              ) : (
                <Register darkMode={darkMode} setDarkMode={setDarkMode} triggerLoader={triggerLoader} />
              )
            }
          />

          {/* Public Info Pages */}
          <Route path="/about"    element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/contact"  element={<Contact />} />

          {/* Protected Patient Routes */}
          <Route
            path="/patient-dashboard"
            element={
              <ProtectedRoute auth={auth} allowedRoles={["patient"]}>
                <PatientDashboard {...dashboardProps} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications-settings"
            element={
              <ProtectedRoute auth={auth} allowedRoles={["patient"]}>
                <NotificationSettings {...dashboardProps} />
              </ProtectedRoute>
            }
          />

          {/* Protected Caregiver Routes */}
          <Route
            path="/caregiver-dashboard"
            element={
              <ProtectedRoute auth={auth} allowedRoles={["caregiver"]}>
                <CaregiverDashboard {...dashboardProps} />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                <AdminDashboard {...dashboardProps} />
              </ProtectedRoute>
            }
          />

          {/* Shared Protected Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute auth={auth}>
                <Profile {...dashboardProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute auth={auth}>
                <Reports {...dashboardProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications-center"
            element={
              <ProtectedRoute auth={auth}>
                <NotificationCenter {...dashboardProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/emergency-card"
            element={
              <ProtectedRoute auth={auth}>
                <EmergencyCard {...dashboardProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ocr-history"
            element={
              <ProtectedRoute auth={auth}>
                <OCRHistory {...dashboardProps} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
      </AnimatePresence>
    </>
  );
};

const ProtectedRoute = ({ auth, allowedRoles, children }) => {
  if (!auth.token || !auth.role) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    if (auth.role === "patient")   return <Navigate to="/patient-dashboard" replace />;
    if (auth.role === "caregiver") return <Navigate to="/caregiver-dashboard" replace />;
    if (auth.role === "admin")     return <Navigate to="/admin-dashboard" replace />;
    
    // Purge corrupted roles
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const [auth, setAuthState] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    if (token && role) {
      return { token, role, email };
    }
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    return { token: null, role: null, email: null };
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("pillsync-theme");
    return saved === "dark";
  });

  const [loading, setLoading] = useState(true); // Startup splash is true

  const setAuth = useCallback((newAuth) => {
    if (newAuth.token) {
      localStorage.setItem("token", newAuth.token);
      localStorage.setItem("role", newAuth.role);
      localStorage.setItem("email", newAuth.email);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("email");
    }
    setAuthState(newAuth);
  }, []);

  const triggerLoader = useCallback((callback) => {
    setLoading(true);
    setTimeout(() => {
      if (callback) callback();
      setLoading(false);
    }, 1500); // 1.5s splash trigger duration
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("pillsync-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <Router>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <AnimatedRoutes
        auth={auth}
        setAuth={setAuth}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        loading={loading}
        setLoading={setLoading}
        triggerLoader={triggerLoader}
      />
      <Footer />
    </Router>
  );
};

export default App;
