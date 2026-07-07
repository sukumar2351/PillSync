import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/api";

const Register = () => {
  const [role, setRole] = useState("patient"); // Default role
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const validate = () => {
    const tempErrors = {};

    if (!fullName.trim()) {
      tempErrors.fullName = "Full name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      tempErrors.fullName = "Full name can only contain letters and spaces";
    } else if (fullName.trim().length < 2) {
      tempErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!email) {
      tempErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      tempErrors.password = "Password is required";
    } else {
      if (password.length < 6) {
        tempErrors.password = "Password must be at least 6 characters";
      }
      if (!/[A-Za-z]/.test(password)) {
        tempErrors.password = (tempErrors.password || "") + " Must contain at least one letter.";
      }
      if (!/\d/.test(password)) {
        tempErrors.password = (tempErrors.password || "") + " Must contain at least one number.";
      }
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
    setSuccessMsg("");

    if (!validate()) return;

    setIsLoading(true);
    try {
      if (role === "patient") {
        await authService.registerPatient(email, password, fullName);
      } else {
        await authService.registerCaregiver(email, password, fullName);
      }
      setSuccessMsg("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setServerError(err.response.data.detail);
      } else {
        setServerError("Registration failed. Please check backend connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper flex-center">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="brand-icon">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            <h2>PillSync</h2>
          </div>
          <h3>Create Account</h3>
          <p>Register below as a patient or a caregiver</p>
        </div>

        {serverError && <div className="alert alert-danger">{serverError}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Role selector tabs */}
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${role === "patient" ? "active" : ""}`}
              onClick={() => setRole("patient")}
              disabled={isLoading}
            >
              Patient
            </button>
            <button
              type="button"
              className={`role-btn ${role === "caregiver" ? "active" : ""}`}
              onClick={() => setRole("caregiver")}
              disabled={isLoading}
            >
              Caregiver
            </button>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name-input">
              Full Name <span className="required-indicator">*</span>
            </label>
            <input
              id="name-input"
              type="text"
              className={`form-input ${errors.fullName ? "is-invalid" : ""}`}
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
            {errors.fullName && <div className="form-error-msg">{errors.fullName}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Email Address <span className="required-indicator">*</span>
            </label>
            <input
              id="email-input"
              type="email"
              className={`form-input ${errors.email ? "is-invalid" : ""}`}
              placeholder="e.g. name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            {errors.email && <div className="form-error-msg">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              Password <span className="required-indicator">*</span>
            </label>
            <div className="password-wrapper">
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                className={`form-input password-field ${errors.password ? "is-invalid" : ""}`}
                placeholder="Min. 6 characters, letter & number"
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
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <div className="form-error-msg">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-pwd-input">
              Confirm Password <span className="required-indicator">*</span>
            </label>
            <div className="password-wrapper">
              <input
                id="confirm-pwd-input"
                type={showConfirmPassword ? "text" : "password"}
                className={`form-input password-field ${errors.confirmPassword ? "is-invalid" : ""}`}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                tabIndex="-1"
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && <div className="form-error-msg">{errors.confirmPassword}</div>}
          </div>

          <button type="submit" className="btn btn-primary btn-block flex-center" disabled={isLoading} style={{ marginTop: "2rem" }}>
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#fff" }} />
                <span>Registering...</span>
              </>
            ) : (
              `Register as ${role}`
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" style={{ fontWeight: "600" }}>Sign In</Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .auth-wrapper {
          min-height: 100vh;
          padding: 2.5rem 1rem;
          background-color: var(--bg-secondary);
        }

        .auth-card {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 2.75rem 2.5rem;
          width: 100%;
          max-width: 440px;
          box-shadow: var(--shadow-lg);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .auth-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .auth-logo h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0;
          letter-spacing: -0.03em;
        }

        .brand-icon {
          color: var(--primary-color);
        }

        .auth-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .auth-header p {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .role-selector {
          display: flex;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.25rem;
          margin-bottom: 1.75rem;
        }

        .role-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 0.625rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
        }

        .role-btn.active {
          background-color: var(--bg-primary);
          color: var(--primary-color);
          box-shadow: var(--shadow-sm);
        }

        .password-wrapper {
          position: relative;
        }

        .password-field {
          padding-right: 2.75rem !important;
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-light);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
        }

        .password-toggle-btn:hover {
          color: var(--text-secondary);
          background-color: var(--bg-hover);
        }

        .required-indicator {
          color: var(--error-color);
          font-weight: bold;
        }

        .btn-block {
          width: 100%;
          padding: 0.875rem;
          font-size: 0.9375rem;
        }

        .auth-footer {
          margin-top: 1.75rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 2rem 1.5rem;
          }
        }
      ` }} />
    </div>
  );
};

export default Register;
