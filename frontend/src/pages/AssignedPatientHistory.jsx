import React, { useEffect, useState } from "react";
import { caregiverService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Eye, X, Award, Bell, Shield, Activity, FileText, Calendar, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AssignedPatientHistory = ({ auth }) => {
  const [patients, setPatients] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal and Patient Detail states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const loadCaregiverData = async () => {
      try {
        const patientsData = await caregiverService.getAssignedPatients();
        setPatients(patientsData);

        const statsData = await caregiverService.getDashboardSummary();
        setDashboardStats(statsData);
      } catch (err) {
        console.error("Failed to load caregiver records:", err);
        setErrorMsg("Failed to retrieve assigned patient records.");
      } finally {
        setIsLoading(false);
      }
    };
    loadCaregiverData();
  }, []);

  const handleOpenHistory = async (patientId) => {
    setSelectedPatientId(patientId);
    setIsModalOpen(true);
    setLoadingDetail(true);
    setDetailError("");
    setPatientDetail(null);

    try {
      const data = await caregiverService.getDetailedPatientHistory(patientId);
      setPatientDetail(data);
    } catch (err) {
      console.error("Failed to load detailed history:", err);
      setDetailError("Failed to retrieve selected patient detailed history.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseHistory = () => {
    setIsModalOpen(false);
    setSelectedPatientId(null);
    setPatientDetail(null);
  };

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

  return (
    <div className="app-container" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar role={auth.role} email={auth.email} />
      
      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
        <Navbar pageTitle="Assigned Patient History" />
        
        <main className="content-area" style={{ padding: "2rem" }}>
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

          {/* Aggregate Stats Summary Cards */}
          {dashboardStats && (
            <div className="grid grid-cols-4" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
              <div className="card" style={{ padding: "1.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-light)" }}>Assigned Patients</span>
                <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.5rem 0 0", color: "var(--text-primary)" }}>{dashboardStats.total_assigned_patients}</h2>
              </div>
              <div className="card" style={{ padding: "1.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-light)" }}>Overall Adherence</span>
                <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.5rem 0 0", color: "var(--primary)" }}>{dashboardStats.overall_adherence_rate}%</h2>
              </div>
              <div className="card" style={{ padding: "1.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-light)" }}>Doses Logged</span>
                <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.5rem 0 0", color: "var(--accent)" }}>{dashboardStats.total_doses_logged}</h2>
              </div>
              <div className="card" style={{ padding: "1.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-light)" }}>Missed Doses</span>
                <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.5rem 0 0", color: "var(--error-color)" }}>{dashboardStats.missed_doses_count}</h2>
              </div>
            </div>
          )}

          {/* Assigned Patients Table (Display ONLY this table - Nothing else below) */}
          <div className="card" style={{ padding: "2rem", borderRadius: "16px", boxShadow: "var(--shadow-premium)" }}>
            <h3 className="card-title" style={{ marginBottom: "1.5rem", fontWeight: 800 }}>Assigned Patients</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Patient Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Blood Group</th>
                    <th>Phone Number</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", color: "var(--text-light)", padding: "2rem" }}>
                        No patients assigned to your care.
                      </td>
                    </tr>
                  ) : (
                    patients.map((p) => (
                      <tr key={p.id}>
                        <td><strong>#{p.id}</strong></td>
                        <td>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-light)" }}>{p.email}</div>
                        </td>
                        <td>{p.age}</td>
                        <td style={{ textTransform: "capitalize" }}>{p.gender || "—"}</td>
                        <td>{p.bloodGroup || "—"}</td>
                        <td>{p.phone || "—"}</td>
                        <td>
                          <span className={`badge ${p.status === "Active" ? "badge-success" : "badge-secondary"}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleOpenHistory(p.id)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 1rem", fontSize: "0.82rem", borderRadius: "8px" }}
                          >
                            <Eye size={14} />
                            <span>View History</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Slide-over Right Panel Modal Dialog (Framer Motion) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(8px)",
              display: "flex",
              justifyContent: "flex-end"
            }}
            onClick={handleCloseHistory}
          >
            <motion.div
              initial={{ x: "100%", opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.95 }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              style={{
                width: "100%",
                maxWidth: "680px",
                height: "100vh",
                background: "var(--bg-card)",
                boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.15)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderLeft: "1px solid var(--border)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 850, fontSize: "1.25rem", color: "var(--text-primary)" }}>Medication compliance report</h3>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-light)" }}>Comprehensive clinical compliance record logs</p>
                </div>
                <button
                  onClick={handleCloseHistory}
                  style={{ background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", padding: "4px" }}
                >
                  <X size={22} />
                </button>
              </div>

              {/* Scrollable details content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
                {loadingDetail && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem" }}>
                    <div className="spinner" />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-light)" }}>Loading patient clinical logs...</span>
                  </div>
                )}

                {detailError && (
                  <div className="alert alert-danger">{detailError}</div>
                )}

                {!loadingDetail && !detailError && patientDetail && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    
                    {/* Patient Information */}
                    <div className="card" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)", padding: "1.5rem", borderRadius: "12px" }}>
                      <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--primary)" }}>Patient Information</h4>
                      <div className="grid grid-cols-2" style={{ gap: "1rem 1.5rem", fontSize: "0.85rem" }}>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block" }}>Name</span>
                          <strong>{patientDetail.patient.name}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block" }}>Phone</span>
                          <strong>{patientDetail.patient.phone || "—"}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block" }}>Age / Gender</span>
                          <strong>{patientDetail.patient.age} yrs / <span style={{ textTransform: "capitalize" }}>{patientDetail.patient.gender || "—"}</span></strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block" }}>Blood Group</span>
                          <strong>{patientDetail.patient.bloodGroup || "—"}</strong>
                        </div>
                        <div className="grid-span-2">
                          <span style={{ color: "var(--text-light)", display: "block" }}>Address</span>
                          <strong>{patientDetail.patient.address || "—"}</strong>
                        </div>
                        <div className="grid-span-2">
                          <span style={{ color: "var(--text-light)", display: "block" }}>Emergency Contact</span>
                          <strong>{patientDetail.patient.emergency_contact || "—"}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Adherence Statistics */}
                    <div className="card" style={{ padding: "1.5rem", borderRadius: "12px" }}>
                      <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--accent)" }}>Adherence Statistics</h4>
                      <div className="grid grid-cols-4" style={{ gap: "1rem", textAlign: "center" }}>
                        <div style={{ background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-light)", display: "block" }}>Weekly %</span>
                          <strong style={{ fontSize: "1.1rem" }}>{patientDetail.adherence.weekly_rate}%</strong>
                        </div>
                        <div style={{ background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-light)", display: "block" }}>Monthly %</span>
                          <strong style={{ fontSize: "1.1rem" }}>{patientDetail.adherence.monthly_rate}%</strong>
                        </div>
                        <div style={{ background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-light)", display: "block" }}>Total Missed</span>
                          <strong style={{ fontSize: "1.1rem", color: "var(--error-color)" }}>{patientDetail.adherence.total_missed}</strong>
                        </div>
                        <div style={{ background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-light)", display: "block" }}>Completion %</span>
                          <strong style={{ fontSize: "1.1rem", color: "var(--primary)" }}>{patientDetail.adherence.completion_rate}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Notifications preferences */}
                    <div className="card" style={{ padding: "1.5rem", borderRadius: "12px" }}>
                      <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--primary)" }}>Notification Status</h4>
                      <div className="grid grid-cols-2" style={{ gap: "1rem", fontSize: "0.85rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Bell size={16} style={{ color: "var(--accent)" }} />
                          <span>Browser Notifications: <strong>{patientDetail.notifications.browser_notifications}</strong></span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Shield size={16} style={{ color: "var(--success-color)" }} />
                          <span>Email Reminders: <strong>{patientDetail.notifications.email_reminder_status}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Medicines List */}
                    <div>
                      <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>Prescribed Medicines</h4>
                      {patientDetail.medicines.length === 0 ? (
                        <p style={{ fontSize: "0.82rem", color: "var(--text-light)" }}>No medicines registered for this patient.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {patientDetail.medicines.map((m) => (
                            <div key={m.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <strong style={{ fontSize: "0.9rem" }}>{m.name}</strong>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "2px" }}>Instructions: {m.instructions}</div>
                              </div>
                              <div style={{ textAlign: "right", fontSize: "0.82rem" }}>
                                <span className="badge badge-primary">{m.dosage}</span>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-light)", marginTop: "4px" }}>{m.frequency}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Today's summary */}
                    <div className="grid grid-cols-2" style={{ gap: "1.25rem" }}>
                      <div className="card" style={{ padding: "1.25rem", borderRadius: "10px", borderLeft: "4px solid var(--success-color)" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-light)", display: "block" }}>Completed Today</span>
                        <div style={{ marginTop: "0.5rem" }}>
                          {patientDetail.today_summary.completed.length === 0 ? (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>No logs yet</span>
                          ) : (
                            patientDetail.today_summary.completed.map((item, idx) => (
                              <div key={idx} style={{ fontSize: "0.85rem", fontWeight: 600, padding: "2px 0" }}>✓ {item}</div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="card" style={{ padding: "1.25rem", borderRadius: "10px", borderLeft: "4px solid var(--error-color)" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-light)", display: "block" }}>Missed Today</span>
                        <div style={{ marginTop: "0.5rem" }}>
                          {patientDetail.today_summary.missed.length === 0 ? (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>None</span>
                          ) : (
                            patientDetail.today_summary.missed.map((item, idx) => (
                              <div key={idx} style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--error-color)", padding: "2px 0" }}>✗ {item}</div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Medication History table */}
                    <div>
                      <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>Administration Log History</h4>
                      <div style={{ overflowX: "auto", maxHeight: "250px" }}>
                        <table className="table" style={{ fontSize: "0.82rem" }}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Medicine</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patientDetail.history.length === 0 ? (
                              <tr>
                                <td colSpan="4" style={{ textAlign: "center", color: "var(--text-light)" }}>No historical logs available.</td>
                              </tr>
                            ) : (
                              patientDetail.history.map((h) => (
                                <tr key={h.id}>
                                  <td>{h.date}</td>
                                  <td>{h.time}</td>
                                  <td><strong>{h.medicine}</strong></td>
                                  <td>
                                    <span className={`badge ${h.status === "Taken" ? "badge-success" : h.status === "Missed" ? "badge-danger" : "badge-warning"}`}>
                                      {h.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssignedPatientHistory;
