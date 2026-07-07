import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/api";

const Login = ({ setAuth }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation / Loading states
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const navigate = useNavigate();

  const validate = () => {
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

    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      setAuth({
        token: data.access_token,
        role: data.role,
        email: data.email,
      });

      // Role-based navigation
      if (data.role === "admin") {
        navigate("/admin-dashboard");
      } else if (data.role === "patient") {
        navigate("/patient-dashboard");
      } else if (data.role === "caregiver") {
        navigate("/caregiver-dashboard");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setServerError(err.response.data.detail);
      } else {
        setServerError("Connection failed. Please check your network.");
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
          <h3>Welcome Back</h3>
          <p>Access your medical portal and patient tracking hub</p>
        </div>

        {serverError && <div className="alert alert-danger">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
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
                placeholder="Enter your password"
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

          <button type="submit" className="btn btn-primary btn-block flex-center" disabled={isLoading} style={{ marginTop: "2rem" }}>
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#fff" }} />
                <span>Authenticating...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register" style={{ fontWeight: "600" }}>Register here</Link>
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
          margin-bottom: 2rem;
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

export default Login;
