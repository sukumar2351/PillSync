import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const PatientDashboard = ({ auth }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await authService.getCurrentUser();
        setUserData(data);
      } catch (err) {
        setErrorMsg("Failed to load patient dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="app-container">
        <Sidebar role={auth.role} email={auth.email} />
        <div className="main-content flex-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const profile = userData?.profile || {};

  return (
    <div className="app-container">
      <Sidebar role={auth.role} email={auth.email} />
      <div className="main-content">
        <Navbar pageTitle="Patient Dashboard" />
        
        <main className="content-area">
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
          
          <div className="welcome-banner card">
            <h2>Welcome back, {profile.full_name || "Patient"}!</h2>
            <p>Here is a summary of your account and personal information details.</p>
          </div>

          <div className="grid grid-cols-2">
            {/* Profile Summary Card */}
            <div className="card">
              <h3 className="card-title">Profile Summary</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Full Name:</span>
                  <span className="info-val">{profile.full_name || "Not provided"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Registered Email:</span>
                  <span className="info-val">{userData?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">User Role:</span>
                  <span className="info-val capitalize">{userData?.role}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Status:</span>
                  <span className={`badge ${profile.account_status === "Active" ? "badge-success" : "badge-secondary"}`}>
                    {profile.account_status || "Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="card">
              <h3 className="card-title">Quick Actions</h3>
              <div className="action-buttons-list">
                <Link to="/profile" className="btn btn-primary action-btn">
                  Edit Personal Information
                </Link>
                <button 
                  onClick={() => alert("Support ticket system is coming in Milestone 2.")} 
                  className="btn btn-secondary action-btn"
                >
                  Contact Clinic Administration
                </button>
              </div>
            </div>
          </div>

          {/* Personal Information Card */}
          <div className="card">
            <h3 className="card-title">Personal Details</h3>
            <div className="details-grid">
              <div className="detail-box">
                <span className="detail-label">Phone Number</span>
                <span className="detail-value">{profile.phone || "—"}</span>
              </div>
              <div className="detail-box">
                <span className="detail-label">Age</span>
                <span className="detail-value">{profile.age !== null && profile.age !== undefined ? profile.age : "—"}</span>
              </div>
              <div className="detail-box">
                <span className="detail-label">Gender</span>
                <span className="detail-value capitalize">{profile.gender || "—"}</span>
              </div>
              <div className="detail-box">
                <span className="detail-label">Blood Group</span>
                <span className="detail-value">{profile.blood_group || "—"}</span>
              </div>
              <div className="detail-box">
                <span className="detail-label">Emergency Contact</span>
                <span className="detail-value">{profile.emergency_contact || "—"}</span>
              </div>
              <div className="detail-box full-width">
                <span className="detail-label">Residential Address</span>
                <span className="detail-value">{profile.address || "—"}</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .welcome-banner {
          background-color: var(--primary-light) !important;
          border-color: #bfdbfe !important;
        }

        .welcome-banner h2 {
          color: var(--primary-color);
          margin-bottom: 0.25rem;
        }

        .welcome-banner p {
          color: var(--text-secondary);
          font-size: 0.9375rem;
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .info-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .info-label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .info-val {
          color: var(--text-primary);
          font-weight: 600;
        }

        .capitalize {
          text-transform: capitalize;
        }

        .action-buttons-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .action-btn {
          width: 100%;
          text-align: center;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .detail-box {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          background-color: var(--bg-secondary);
        }

        .detail-box.full-width {
          grid-column: span 3;
        }

        .detail-label {
          display: block;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-light);
          margin-bottom: 0.25rem;
          font-weight: 600;
        }

        .detail-value {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .details-grid {
            grid-template-columns: 1fr;
          }
          .detail-box.full-width {
            grid-column: span 1;
          }
        }
      ` }} />
    </div>
  );
};

export default PatientDashboard;
