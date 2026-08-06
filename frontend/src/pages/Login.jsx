import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Activity, ArrowRight, Shield, Bell, Users, Pill, ArrowLeft } from "lucide-react";
import { authService } from "../services/api";

const Login = ({ setAuth, triggerLoader }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Forgot Password / Reset Password Flow State
  const [forgotState, setForgotState] = useState("login"); // "login", "forgot", "otp", "reset"
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const width = card.width;
    const height = card.height;
    const mouseX = e.clientX - card.left - width / 2;
    const mouseY = e.clientY - card.top - height / 2;
    const rX = -(mouseY / height) * 16;
    const rY = (mouseX / width) * 16;
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const validateLogin = () => {
    const tempErrors = {};
    if (!email) {
      tempErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      tempErrors.password = "Password is required";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      
      const proceedLogin = () => {
        setAuth({
          token: data.access_token,
          role: data.role,
          email: data.email,
        });

        if (data.role === "admin") {
          navigate("/admin-dashboard");
        } else if (data.role === "patient") {
          navigate("/patient-dashboard");
        } else if (data.role === "caregiver") {
          navigate("/caregiver-dashboard");
        }
      };

      if (triggerLoader) {
        triggerLoader(proceedLogin);
      } else {
        proceedLogin();
      }
    } catch (err) {
      console.error("[Login] error object:", err);
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data.detail === "string") {
          setServerError(data.detail);
        } else {
          setServerError("Failed to sign in. Please verify your credentials.");
        }
      } else {
        setServerError("Connection failed. Check server port 8000.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password triggers
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!forgotEmail) {
      setErrors({ forgotEmail: "Email address is required" });
      return;
    } else if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      setErrors({ forgotEmail: "Please enter a valid email address" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(forgotEmail);
      setSuccessMessage(res.message);
      setForgotState("otp");
      setErrors({});
    } catch (err) {
      setServerError(err.response?.data?.detail || "Failed to trigger password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!otpCode) {
      setErrors({ otpCode: "OTP Code is required" });
      return;
    } else if (otpCode.length !== 6) {
      setErrors({ otpCode: "OTP must be exactly 6 digits" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.verifyOtp(forgotEmail, otpCode);
      setSuccessMessage(res.message);
      setForgotState("reset");
      setErrors({});
    } catch (err) {
      setServerError(err.response?.data?.detail || "Invalid or expired OTP code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    const tempErrors = {};
    if (!newPassword) {
      tempErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = "Password must be at least 6 characters";
    }

    if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword(forgotEmail, otpCode, newPassword);
      setSuccessMessage(res.message);
      setTimeout(() => {
        setForgotState("login");
        setEmail(forgotEmail);
        setForgotEmail("");
        setOtpCode("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccessMessage("");
      }, 3000);
      setErrors({});
    } catch (err) {
      setServerError(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--bg-base)",
      overflow: "hidden"
    }}>
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
      }} className="login-left-panel">
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
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            style={{ color: "white", fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", letterSpacing: "-0.03em" }}
          >
            Welcome to PillSync
          </motion.h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.1rem", marginBottom: "0.25rem" }}>
            Your Intelligent Healthcare Partner
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "2rem" }}>
            Developed by Sukumar Karnam, BCA Graduate
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[
              { icon: <Pill size={16} />, text: "Automated Medicine Scheduling" },
              { icon: <Bell size={16} />, text: "Real-time Twilio SMS & Browser Alerts" },
              { icon: <Shield size={16} />, text: "Secure JWT Authentication Layer" },
              { icon: <Users size={16} />, text: "Dedicated Caregiver Oversight" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.6, delay: idx * 0.15, ease: "easeInOut" }}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "rgba(255,255,255,0.85)" }}
              >
                <div style={{ color: "#06B6D4" }}>{item.icon}</div>
                <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ zIndex: 5, display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
          <span>© 2026 PillSync</span>
          <span>v2.0</span>
        </div>

      </div>

      {/* RIGHT PANEL */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--bg-base)"
      }}>
        <div style={{ perspective: 1200, width: "100%", maxWidth: 440 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30, filter: "blur(4px)" }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              filter: "blur(0px)",
              rotateX,
              rotateY,
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="card"
            style={{
              width: "100%",
              padding: "3rem 2.5rem",
              borderRadius: 24,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              boxShadow: "var(--shadow-lg)",
              transformStyle: "preserve-3d",
              transition: "box-shadow 0.5s ease"
            }}
          >
          
          {forgotState === "login" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Sign In</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Access your health monitoring portal</p>
              </div>

              {serverError && (
                <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>
                  <Shield size={16} />
                  <span>{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                  <label className="form-label" htmlFor="email-input">Email Address</label>
                  <input
                    id="email-input"
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
                  <label className="form-label" htmlFor="password-input">Password</label>
                  <div className="password-wrapper">
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      className={`form-input password-field ${errors.password ? "is-invalid" : ""}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <div className="form-error-msg">{errors.password}</div>}
                </div>

                {/* Forgot Password Link */}
                <div style={{ textAlign: "right", marginBottom: "1.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotState("forgot");
                      setServerError("");
                      setSuccessMessage("");
                      setErrors({});
                    }}
                    style={{ background: "transparent", border: "none", color: "var(--primary)", fontWeight: "600", fontSize: "0.82rem", cursor: "pointer" }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <motion.button
                  type="submit"
                  className="btn btn-primary btn-block flex-center"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ padding: "0.875rem" }}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#fff", marginRight: "8px" }} />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={16} style={{ marginLeft: "6px" }} />
                    </>
                  )}
                </motion.button>
              </form>

              <div style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Don't have an account? <Link to="/register" style={{ fontWeight: "600", color: "var(--primary)" }}>Register here</Link>
              </div>
            </>
          )}

          {forgotState === "forgot" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <button
                  onClick={() => setForgotState("login")}
                  style={{ background: "transparent", border: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--text-secondary)", fontSize: "0.8rem", cursor: "pointer", padding: 0, marginBottom: "1rem" }}
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Forgot Password</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Enter your email to receive a verification OTP</p>
              </div>

              {serverError && <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>{serverError}</div>}
              {successMessage && <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>{successMessage}</div>}

              <form onSubmit={handleForgotPasswordSubmit} noValidate>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label" htmlFor="forgot-email-input">Email Address</label>
                  <input
                    id="forgot-email-input"
                    type="email"
                    className={`form-input ${errors.forgotEmail ? "is-invalid" : ""}`}
                    placeholder="name@domain.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.forgotEmail && <div className="form-error-msg">{errors.forgotEmail}</div>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block flex-center"
                  disabled={isLoading}
                  style={{ padding: "0.875rem" }}
                >
                  {isLoading ? "Sending OTP..." : "Send Verification OTP"}
                </button>
              </form>
            </>
          )}

          {forgotState === "otp" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Verify OTP</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>We sent a 6-digit OTP code to: <strong>{forgotEmail}</strong></p>
              </div>

              {serverError && <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>{serverError}</div>}
              {successMessage && <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>{successMessage}</div>}

              <form onSubmit={handleVerifyOtpSubmit} noValidate>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label" htmlFor="otp-input">Enter 6-Digit OTP</label>
                  <input
                    id="otp-input"
                    type="text"
                    className={`form-input ${errors.otpCode ? "is-invalid" : ""}`}
                    placeholder="123456"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    disabled={isLoading}
                    style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "8px", fontWeight: "800" }}
                  />
                  {errors.otpCode && <div className="form-error-msg">{errors.otpCode}</div>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block flex-center"
                  disabled={isLoading}
                  style={{ padding: "0.875rem" }}
                >
                  {isLoading ? "Verifying..." : "Verify & Continue"}
                </button>
              </form>
            </>
          )}

          {forgotState === "reset" && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Reset Password</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Create a secure new password for your account</p>
              </div>

              {serverError && <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>{serverError}</div>}
              {successMessage && <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>{successMessage}</div>}

              <form onSubmit={handleResetPasswordSubmit} noValidate>
                <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                  <label className="form-label" htmlFor="new-password-input">New Password</label>
                  <input
                    id="new-password-input"
                    type="password"
                    className={`form-input ${errors.newPassword ? "is-invalid" : ""}`}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.newPassword && <div className="form-error-msg">{errors.newPassword}</div>}
                </div>

                <div className="form-group" style={{ marginBottom: "1.75rem" }}>
                  <label className="form-label" htmlFor="confirm-password-input">Confirm New Password</label>
                  <input
                    id="confirm-password-input"
                    type="password"
                    className={`form-input ${errors.confirmPassword ? "is-invalid" : ""}`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && <div className="form-error-msg">{errors.confirmPassword}</div>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block flex-center"
                  disabled={isLoading}
                  style={{ padding: "0.875rem" }}
                >
                  {isLoading ? "Saving New Password..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          </motion.div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 820px) {
          .login-left-panel {
            display: none !important;
          }
        }
      ` }} />
    </div>
  );
};

export default Login;
