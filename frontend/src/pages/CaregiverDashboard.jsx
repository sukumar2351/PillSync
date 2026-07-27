import React, { useEffect, useState } from "react";
import { authService, caregiverService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Eye, X, Bell, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CaregiverDashboard = ({ auth }) => {
  const [userData, setUserData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Search, pagination & sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected Patient Details Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserData(user);

        const patientsData = await caregiverService.getAssignedPatients();
        setPatients(patientsData);

        const statsData = await caregiverService.getDashboardSummary();
        setDashboardStats(statsData);
      } catch (err) {
        console.error("Failed to load caregiver dashboard:", err);
        setErrorMsg("Failed to retrieve dashboard records.");
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
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
      console.error("Failed to load detailed patient history:", err);
      const errMsg = err.response && err.response.data && err.response.data.detail
        ? err.response.data.detail
        : "Failed to load clinical compliance details: connection failed.";
      setDetailError(errMsg);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseHistory = () => {
    setIsModalOpen(false);
    setSelectedPatientId(null);
    setPatientDetail(null);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
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

  const profile = userData?.profile || {};

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    const query = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.bloodGroup || "").toLowerCase().includes(query) ||
      (p.phone || "").includes(query)
    );
  });

  // Sort patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate patients
  const totalPages = Math.max(1, Math.ceil(sortedPatients.length / itemsPerPage));
  const pageToRender = Math.min(currentPage, totalPages);
  const indexOfLastItem = pageToRender * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedPatients = sortedPatients.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="app-container" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar role={auth.role} email={auth.email} />
      
      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
        <Navbar pageTitle="Caregiver Dashboard" />
        
        <main className="content-area" style={{ padding: "2rem" }}>
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
          
          <div className="welcome-banner card" style={{ borderLeft: "4px solid var(--primary-color)", marginBottom: "2rem" }}>
            <h2>Welcome back, {profile.full_name || "Caregiver"}!</h2>
            <p>You are logged into your Caregiver home dashboard. Below is your profile and assigned patient roster.</p>
          </div>

          <div className="grid grid-cols-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
            {/* Profile Information Card */}
            <div className="card">
              <h3 className="card-title">Caregiver Profile</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-val">{profile.full_name || "Not provided"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-val">{userData?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Role:</span>
                  <span className="info-val capitalize">{userData?.role}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-val">{profile.phone || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Gender:</span>
                  <span className="info-val capitalize">{profile.gender || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Status:</span>
                  <span className={`badge ${profile.account_status === "Active" ? "badge-success" : "badge-secondary"}`}>
                    {profile.account_status || "Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Meta Details Card */}
            <div className="card">
              <h3 className="card-title">Address Information</h3>
              <div className="info-list">
                <div className="info-item-block">
                  <span className="info-label-block">Home/Office Address</span>
                  <p className="info-val-block">{profile.address || "No address provided."}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Patients Table */}
          <div className="card" style={{ padding: "2rem", borderRadius: "16px" }}>
            <h3 className="card-title" style={{ marginBottom: "1.5rem", fontWeight: 800 }}>Assigned Patients</h3>
            
            {/* Table Search & Pagination Toolbar */}
            <div className="table-toolbar" style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="search-input-wrapper" style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-secondary)", padding: "0.4rem 1rem", borderRadius: "10px", border: "1px solid var(--border)", width: "300px" }}>
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="form-input search-field"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ border: "none", background: "transparent", width: "100%", outline: "none" }}
                />
              </div>

              {totalPages > 1 && (
                <div className="pagination-controls" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="page-info" style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                    Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedPatients.length)} of {sortedPatients.length}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={pageToRender === 1}
                    className="btn-page"
                    style={{ padding: "0.3rem 0.75rem", borderRadius: "8px", cursor: "pointer" }}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={pageToRender === totalPages}
                    className="btn-page"
                    style={{ padding: "0.3rem 0.75rem", borderRadius: "8px", cursor: "pointer" }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                      Patient ID {sortField === "id" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                      Patient Name {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th>Age</th>
                    <th>Blood Group</th>
                    <th>Phone Number</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((pat) => (
                    <tr key={pat.id}>
                      <td>#{pat.id}</td>
                      <td><strong>{pat.name}</strong></td>
                      <td>{pat.age}</td>
                      <td>{pat.bloodGroup || "—"}</td>
                      <td>{pat.phone || "—"}</td>
                      <td>
                        <span className={`badge ${pat.status === "Active" ? "badge-success" : "badge-secondary"}`}>
                          {pat.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleOpenHistory(pat.id)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 1rem", fontSize: "0.82rem", borderRadius: "8px" }}
                        >
                          <Eye size={14} />
                          <span>View History</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedPatients.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "1.5rem" }}>No matching patients found.</td>
                    </tr>
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
                  <h3 style={{ margin: 0, fontWeight: 850, fontSize: "1.25rem", color: "var(--text-primary)" }}>Medication Compliance Report</h3>
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
                    
                    {/* Patient Details */}
                    <div className="card" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)", padding: "1.5rem", borderRadius: "12px" }}>
                      <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--primary)" }}>Patient Details</h4>
                      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "1.5rem" }}>
                        {patientDetail.patient.profile_photo ? (
                          <img
                            src={patientDetail.patient.profile_photo}
                            alt="Patient profile"
                            style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)" }}
                          />
                        ) : (
                          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.5rem" }}>
                            {patientDetail.patient.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>{patientDetail.patient.name}</h3>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>ID: #{patientDetail.patient.id} | {patientDetail.patient.email}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2" style={{ gap: "1rem 1.5rem", fontSize: "0.85rem" }}>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block" }}>Age</span>
                          <strong>{patientDetail.patient.age} yrs</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block" }}>Gender</span>
                          <strong style={{ textTransform: "capitalize" }}>{patientDetail.patient.gender || "—"}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block" }}>Blood Group</span>
                          <strong>{patientDetail.patient.bloodGroup || "—"}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block" }}>Phone Number</span>
                          <strong>{patientDetail.patient.phone || "—"}</strong>
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
                      <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--accent)" }}>Statistics</h4>
                      <div className="grid grid-cols-4" style={{ gap: "1rem", textAlign: "center" }}>
                        <div style={{ background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-light)", display: "block" }}>Weekly Adherence</span>
                          <strong style={{ fontSize: "1.1rem" }}>{patientDetail.adherence.weekly_rate}%</strong>
                        </div>
                        <div style={{ background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-light)", display: "block" }}>Monthly Adherence</span>
                          <strong style={{ fontSize: "1.1rem" }}>{patientDetail.adherence.monthly_rate}%</strong>
                        </div>
                        <div style={{ background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-light)", display: "block" }}>Missed Dose Count</span>
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
                      <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--primary)" }}>Notifications</h4>
                      <div className="grid grid-cols-3" style={{ gap: "1rem", fontSize: "0.85rem" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ color: "var(--text-light)", fontSize: "0.7rem" }}>Browser Notification Status</span>
                          <strong>{patientDetail.notifications.browser_notifications}</strong>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ color: "var(--text-light)", fontSize: "0.7rem" }}>Email Reminder Status</span>
                          <strong>{patientDetail.notifications.email_reminder_status}</strong>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ color: "var(--text-light)", fontSize: "0.7rem" }}>Last Reminder Sent</span>
                          <strong>{patientDetail.notifications.last_reminder_sent}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Today's Status */}
                    <div className="card" style={{ padding: "1.5rem", borderRadius: "12px" }}>
                      <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>Today's Status</h4>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.85rem" }}>
                        <div>
                          <span style={{ color: "var(--text-light)", display: "block", marginBottom: "4px" }}>Today's Medicines</span>
                          {patientDetail.today_summary.today_medicines.length === 0 ? (
                            <span style={{ color: "var(--text-light)" }}>None scheduled today</span>
                          ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {patientDetail.today_summary.today_medicines.map((m, idx) => (
                                <span key={idx} style={{ background: "var(--bg-secondary)", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.8rem" }}>{m}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-4" style={{ gap: "1rem" }}>
                          <div style={{ borderLeft: "3px solid var(--success-color)", paddingLeft: "8px" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-light)", display: "block" }}>Completed</span>
                            <strong>{patientDetail.today_summary.completed.length} Dose(s)</strong>
                          </div>
                          <div style={{ borderLeft: "3px solid var(--warning)", paddingLeft: "8px" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-light)", display: "block" }}>Pending</span>
                            <strong>{patientDetail.today_summary.pending.length} Dose(s)</strong>
                          </div>
                          <div style={{ borderLeft: "3px solid var(--error-color)", paddingLeft: "8px" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-light)", display: "block" }}>Missed</span>
                            <strong>{patientDetail.today_summary.missed.length} Dose(s)</strong>
                          </div>
                          <div style={{ borderLeft: "3px solid var(--accent)", paddingLeft: "8px" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-light)", display: "block" }}>Upcoming</span>
                            <strong>{patientDetail.today_summary.upcoming.length} Dose(s)</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Medicine Details */}
                    <div>
                      <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>Medicine Details</h4>
                      {patientDetail.medicines.length === 0 ? (
                        <p style={{ fontSize: "0.82rem", color: "var(--text-light)" }}>No medicines registered for this patient.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {patientDetail.medicines.map((m) => (
                            <div key={m.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <strong style={{ fontSize: "0.95rem" }}>{m.name}</strong>
                                <span className="badge badge-primary">{m.dosage}</span>
                              </div>
                              <div className="grid grid-cols-3" style={{ fontSize: "0.8rem", gap: "0.5rem" }}>
                                <div>
                                  <span style={{ color: "var(--text-light)" }}>Frequency:</span> <strong>{m.frequency}</strong>
                                </div>
                                <div>
                                  <span style={{ color: "var(--text-light)" }}>Relationship:</span> <strong>{m.food_relationship}</strong>
                                </div>
                                <div>
                                  <span style={{ color: "var(--text-light)" }}>Active Span:</span> <strong>{m.start_date} to {m.end_date}</strong>
                                </div>
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--text-light)", borderTop: "1px dashed var(--border)", paddingTop: "0.4rem" }}>
                                <strong>Instructions:</strong> {m.instructions}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Medication History table */}
                    <div>
                      <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>Medication History</h4>
                      <div style={{ overflowX: "auto", maxHeight: "250px" }}>
                        <table className="table" style={{ fontSize: "0.82rem" }}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Medicine Name</th>
                              <th>Scheduled Time</th>
                              <th>Status</th>
                              <th>Caregiver Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patientDetail.history.length === 0 ? (
                              <tr>
                                <td colSpan="6" style={{ textAlign: "center", color: "var(--text-light)" }}>No historical logs available.</td>
                              </tr>
                            ) : (
                              patientDetail.history.map((h) => (
                                <tr key={h.id}>
                                  <td>{h.date}</td>
                                  <td>{h.time}</td>
                                  <td><strong>{h.medicine_name}</strong></td>
                                  <td>{h.scheduled_time}</td>
                                  <td>
                                    <span className={`badge ${h.status === "Taken" ? "badge-success" : h.status === "Missed" ? "badge-danger" : "badge-warning"}`}>
                                      {h.status}
                                    </span>
                                  </td>
                                  <td>{h.caregiver_notes}</td>
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

export default CaregiverDashboard;
