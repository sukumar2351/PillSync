import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Shield, UserCheck, Heart, Activity, ArrowLeft } from "lucide-react";
import { authService } from "../services/api";

const Register = ({ triggerLoader }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("patient"); // 'patient' or 'caregiver'
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const validate = () => {
    const tempErrors = {};
    if (!fullName.trim()) tempErrors.fullName = "Full Name is required";
    
    if (!email) {
      tempErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      tempErrors.password = "Password is required";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsLoading(true);
    try {
      if (role === "patient") {
        await authService.registerPatient(email, password, fullName);
      } else {
        await authService.registerCaregiver(email, password, fullName);
      }
      
      if (triggerLoader) {
        triggerLoader(() => setSuccess(true));
      } else {
        setSuccess(true);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setServerError(err.response.data.detail);
      } else {
        setServerError("Registration failed. Please check your network connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", overflow: "hidden" }}>
      
      {/* LEFT PANEL */}
      <div style={{
        width: "45%",
        background: "linear-gradient(135deg, #0f0c29, #1a1040, #0c1a35)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "3rem",
        position: "relative",
        overflow: "hidden"
      }} className="register-left-panel">
        <div style={{ position: "absolute", top: "15%", left: "10%", width: 250, height: 250, borderRadius: "50%", background: "rgba(37,99,235,0.12)", filter: "blur(70px)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(6,182,212,0.1)", filter: "blur(60px)" }} />

        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", zIndex: 5 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #2563EB, #06B6D4)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Activity size={18} color="white" />
          </div>
          <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>
            PillSync
          </span>
        </Link>

        <div style={{ zIndex: 5, margin: "auto 0" }}>
          <h1 style={{ color: "white", fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", letterSpacing: "-0.03em" }}>
            Join PillSync Today
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.1rem", marginBottom: "2.5rem" }}>
            Your Health, Our Priority
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[
              { icon: <Shield size={16} />, text: "Secure User Data & Compliance" },
              { icon: <UserCheck size={16} />, text: "Direct Caregiver Connection Option" },
              { icon: <Heart size={16} />, text: "Patient Wellness Focus" }
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "rgba(255,255,255,0.85)" }}>
                <div style={{ color: "#06B6D4" }}>{item.icon}</div>
                <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ zIndex: 5, display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
          <span>© 2026 PillSync</span>
          <span>v2.0</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg-base)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card"
          style={{
            width: "100%",
            maxWidth: 460,
            padding: "2.5rem",
            borderRadius: 24,
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-lg)"
          }}
        >
          {success ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--success-light)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <UserCheck size={32} />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>Registration Successful!</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: 1.6 }}>
                Your PillSync account has been created. You can now login to access your customized dashboard.
              </p>
              <Link to="/login">
                <button className="btn btn-primary btn-block">Go to Login</button>
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.4rem" }}>Create Account</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Start managing your medications today</p>
              </div>

              {serverError && <div className="alert alert-danger" style={{ marginBottom: "1.25rem" }}>{serverError}</div>}

              <form onSubmit={handleSubmit} noValidate>
                {/* Role Switcher */}
                <div style={{ display: "flex", gap: "0.5rem", background: "var(--bg-hover)", padding: "4px", borderRadius: 10, marginBottom: "1.25rem" }}>
                  <button
                    type="button"
                    onClick={() => setRole("patient")}
                    style={{
                      flex: 1, padding: "0.5rem", borderRadius: 8, border: "none", cursor: "pointer",
                      fontWeight: 600, fontSize: "0.85rem",
                      background: role === "patient" ? "var(--bg-primary)" : "transparent",
                      color: role === "patient" ? "var(--primary)" : "var(--text-secondary)",
                      boxShadow: role === "patient" ? "var(--shadow-xs)" : "none",
                      transition: "all 0.2s"
                    }}
                  >Patient</button>
                  <button
                    type="button"
                    onClick={() => setRole("caregiver")}
                    style={{
                      flex: 1, padding: "0.5rem", borderRadius: 8, border: "none", cursor: "pointer",
                      fontWeight: 600, fontSize: "0.85rem",
                      background: role === "caregiver" ? "var(--bg-primary)" : "transparent",
                      color: role === "caregiver" ? "var(--primary)" : "var(--text-secondary)",
                      boxShadow: role === "caregiver" ? "var(--shadow-xs)" : "none",
                      transition: "all 0.2s"
                    }}
                  >Caregiver</button>
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className={`form-input ${errors.fullName ? "is-invalid" : ""}`}
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.fullName && <div className="form-error-msg">{errors.fullName}</div>}
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className={`form-input ${errors.email ? "is-invalid" : ""}`}
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.email && <div className="form-error-msg">{errors.email}</div>}
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className={`form-input ${errors.password ? "is-invalid" : ""}`}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.password && <div className="form-error-msg">{errors.password}</div>}
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className={`form-input ${errors.confirmPassword ? "is-invalid" : ""}`}
                    placeholder="Verify password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && <div className="form-error-msg">{errors.confirmPassword}</div>}
                </div>

                <button type="submit" className="btn btn-primary btn-block flex-center" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#fff", marginRight: "8px" }} />
                      <span>Registering...</span>
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Already have an account? <Link to="/login" style={{ fontWeight: "600", color: "var(--primary)" }}>Login here</Link>
              </div>
            </>
          )}
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 820px) {
          .register-left-panel {
            display: none !important;
          }
        }
      ` }} />
    </div>
  );
};

export default Register;
