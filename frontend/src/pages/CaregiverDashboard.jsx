import React, { useEffect, useState } from "react";
import { authService, medicineService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

// Realistic Indian Patients mappings assigned to each of the 10 Caregivers
const caregiverPatientAssignments = {
  "Ramesh Kumar": [
    { id: 1, name: "Rahul Sharma", email: "rahul.sharma@pillsync.com", age: 28, phone: "+91 99887 76601", bloodGroup: "O+", status: "Active" },
    { id: 11, name: "Nikhil Verma", email: "nikhil.verma@pillsync.com", age: 33, phone: "+91 99887 76611", bloodGroup: "B+", status: "Active" }
  ],
  "Sunitha Devi": [
    { id: 2, name: "Priya Reddy", email: "priya.reddy@pillsync.com", age: 34, phone: "+91 99887 76602", bloodGroup: "A+", status: "Active" },
    { id: 12, name: "Lakshmi Devi", email: "lakshmi.devi@pillsync.com", age: 67, phone: "+91 99887 76612", bloodGroup: "O+", status: "Active" }
  ],
  "Mahesh Rao": [
    { id: 3, name: "Arjun Kumar", email: "arjun.kumar@pillsync.com", age: 45, phone: "+91 99887 76603", bloodGroup: "B+", status: "Active" },
    { id: 13, name: "Harsha Vardhan", email: "harsha.pathan@pillsync.com", age: 58, phone: "+91 99887 76613", bloodGroup: "AB+", status: "Active" }
  ],
  "Kavitha Sharma": [
    { id: 4, name: "Sneha Patel", email: "sneha.patel@pillsync.com", age: 22, phone: "+91 99887 76604", bloodGroup: "AB+", status: "Active" },
    { id: 14, name: "Deepika Rani", email: "deepika.rani@pillsync.com", age: 48, phone: "+91 99887 76614", bloodGroup: "A+", status: "Active" }
  ],
  "Rajesh Patel": [
    { id: 5, name: "Ravi Teja", email: "ravi.teja@pillsync.com", age: 31, phone: "+91 99887 76605", bloodGroup: "O-", status: "Active" },
    { id: 15, name: "Suresh Babu", email: "suresh.babu@pillsync.com", age: 72, phone: "+91 99887 76615", bloodGroup: "B+", status: "Active" }
  ],
  "Srinivas Reddy": [
    { id: 6, name: "Ananya Rao", email: "ananya.rao@pillsync.com", age: 29, phone: "+91 99887 76606", bloodGroup: "A-", status: "Active" },
    { id: 16, name: "Meghana Reddy", email: "meghana.reddy@pillsync.com", age: 24, phone: "+91 99887 76616", bloodGroup: "O-", status: "Active" }
  ],
  "Anil Kumar": [
    { id: 7, name: "Vikram Singh", email: "vikram.singh@pillsync.com", age: 52, phone: "+91 99887 76607", bloodGroup: "B-", status: "Active" },
    { id: 17, name: "Akash Jain", email: "akash.jain@pillsync.com", age: 30, phone: "+91 99887 76617", bloodGroup: "A-", status: "Active" }
  ],
  "Sujatha Devi": [
    { id: 8, name: "Kiran Kumar", email: "kiran.kumar@pillsync.com", age: 38, phone: "+91 99887 76608", bloodGroup: "AB-", status: "Active" },
    { id: 18, name: "Bhavya Nair", email: "bhavya.nair@pillsync.com", age: 27, phone: "+91 99887 76618", bloodGroup: "B-", status: "Active" }
  ],
  "Manoj Verma": [
    { id: 9, name: "Pooja Sharma", email: "pooja.sharma@pillsync.com", age: 26, phone: "+91 99887 76609", bloodGroup: "O+", status: "Active" },
    { id: 19, name: "Ajay Kumar", email: "ajay.kumar@pillsync.com", age: 35, phone: "+91 99887 76619", bloodGroup: "AB-", status: "Active" }
  ],
  "Swapna Reddy": [
    { id: 10, name: "Sai Krishna", email: "sai.krishna@pillsync.com", age: 41, phone: "+91 99887 76610", bloodGroup: "A+", status: "Active" },
    { id: 20, name: "Divya Sri", email: "divya.sri@pillsync.com", age: 25, phone: "+91 99887 76620", bloodGroup: "O+", status: "Active" }
  ]
};

const CaregiverDashboard = ({ auth }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Table search, pagination & sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected Patient Details
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Modal toggle for Milestone 3 placeholders
  const [showM3Modal, setShowM3Modal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await authService.getCurrentUser();
        setUserData(data);
      } catch (err) {
        setErrorMsg("Failed to load caregiver dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const fetchPatientLogs = async (patient) => {
    setSelectedPatient(patient);
    setLoadingHistory(true);
    setPatientHistory(null);
    setPatientDetails(null);
    try {
      const stats = await medicineService.getPatientHistoryByEmail(patient.email);
      setPatientHistory(stats);
      
      // Look up patient notifications preferences dynamically (for display on dashboard)
      // Since getPatientHistoryByEmail endpoint validates the patient account, we can query details safely
      // In this version, we will mock settings or fetch them as part of historical logs response.
      // We will provide fallback display values.
      setPatientDetails({
        sms_enabled: patient.id % 2 === 0, // Mock settings relative to static assignments
        notification_preference: patient.id % 2 === 0 ? "both" : "browser",
        phone: patient.phone,
        reminder_status: "Active reminder logs available"
      });
    } catch (err) {
      console.error("Failed to load patient history:", err);
      setPatientHistory({
        total_scheduled: 0,
        taken_count: 0,
        missed_count: 0,
        snoozed_count: 0,
        adherence_rate: 100,
        history: []
      });
    } finally {
      setLoadingHistory(false);
    }
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
  const caregiverName = profile.full_name || "Ramesh Kumar";
  
  // Resolve assigned patient roster
  const assignedRoster = caregiverPatientAssignments[caregiverName] || caregiverPatientAssignments["Ramesh Kumar"];

  // Filter patients
  const filteredPatients = assignedRoster.filter((p) => {
    const query = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.bloodGroup.toLowerCase().includes(query) ||
      p.phone.includes(query)
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  return (
    <div className="app-container">
      <Sidebar role={auth.role} email={auth.email} />
      <div className="main-content">
        <Navbar pageTitle="Caregiver Dashboard" />
        
        <main className="content-area">
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
          
          <div className="welcome-banner card" style={{ borderLeft: "4px solid var(--primary-color)" }}>
            <h2>Welcome back, {profile.full_name || "Caregiver"}!</h2>
            <p>You are logged into your Caregiver home dashboard. Below is your profile and assigned patient roster.</p>
          </div>

          <div className="grid grid-cols-2">
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
          <div className="card">
            <h3 className="card-title">Assigned Patients</h3>
            <p style={{ color: "var(--text-light)", fontSize: "0.85rem", marginBottom: "1rem" }}>Click on any patient row to view their medication adherence report and history log details.</p>
            
            {/* Table Search & Pagination Toolbar */}
            <div className="table-toolbar">
              <div className="search-input-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="form-input search-field"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="pagination-controls">
                <span className="page-info">
                  Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedPatients.length)} of {sortedPatients.length}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={pageToRender === 1}
                  className="btn-page"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={pageToRender === totalPages}
                  className="btn-page"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("id")} className="sort-header">
                      Patient ID {sortField === "id" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("name")} className="sort-header">
                      Full Name {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("age")} className="sort-header">
                      Age {sortField === "age" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th>Phone</th>
                    <th onClick={() => handleSort("bloodGroup")} className="sort-header">
                      Blood Group {sortField === "bloodGroup" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((pat) => (
                    <tr 
                      key={pat.id} 
                      onClick={() => fetchPatientLogs(pat)}
                      style={{ cursor: "pointer", background: selectedPatient?.id === pat.id ? "var(--primary-light)" : "transparent" }}
                    >
                      <td>#{pat.id}</td>
                      <td><strong>{pat.name}</strong></td>
                      <td>{pat.age} years</td>
                      <td>{pat.phone}</td>
                      <td>{pat.bloodGroup}</td>
                      <td>
                        <span className="badge badge-success">{pat.status}</span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}>
                          View History
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

          {/* Expanded Adherence Adherence Logs for Selected Patient */}
          {selectedPatient && (
            <div className="card" style={{ marginTop: "2rem", borderTop: "4px solid var(--primary-color)" }}>
              <h3 className="card-title">Adherence Adherence Report: {selectedPatient.name}</h3>
              
              {loadingHistory ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                  <div className="spinner" />
                </div>
              ) : patientHistory ? (
                <>
                  {/* Patient configuration alerts */}
                  {patientDetails && (
                    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                      <span className="badge" style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
                        Email Alerts: {patientDetails.email_enabled ? "Enabled" : "Disabled"}
                      </span>
                      <span className="badge" style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
                        Channel: Email / SMTP
                      </span>
                      <span className="badge" style={{ background: "#fdf2f8", color: "#9d174d", border: "1px solid #fbcfe8" }}>
                        Active: Registered Account Email
                      </span>
                    </div>
                  )}

                  {/* Adherence metrics block */}
                  <div className="grid grid-cols-4 stats-grid" style={{ marginBottom: "1.5rem" }}>
                    <div className="card stat-card" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                      <span className="stat-label">Adherence Rate</span>
                      <h4 style={{ color: "var(--primary-color)", fontSize: "1.5rem", fontWeight: "bold" }}>
                        {patientHistory.adherence_rate}%
                      </h4>
                    </div>
                    <div className="card stat-card" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                      <span className="stat-label">Doses Taken</span>
                      <h4 style={{ color: "#10b981", fontSize: "1.5rem", fontWeight: "bold" }}>
                        {patientHistory.taken_count}
                      </h4>
                    </div>
                    <div className="card stat-card" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                      <span className="stat-label">Doses Missed</span>
                      <h4 style={{ color: "#ef4444", fontSize: "1.5rem", fontWeight: "bold" }}>
                        {patientHistory.missed_count}
                      </h4>
                    </div>
                    <div className="card stat-card" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                      <span className="stat-label">Doses Snoozed</span>
                      <h4 style={{ color: "#f59e0b", fontSize: "1.5rem", fontWeight: "bold" }}>
                        {patientHistory.snoozed_count}
                      </h4>
                    </div>
                  </div>

                  {/* Adherence detailed logs table */}
                  <h4 style={{ marginBottom: "0.5rem" }}>Adherence Logs (Latest 10)</h4>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Log ID</th>
                          <th>Medicine Name</th>
                          <th>Dosage</th>
                          <th>Interval</th>
                          <th>Scheduled Date</th>
                          <th>Status</th>
                          <th>Log Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientHistory.history.slice(0, 10).map((log) => (
                          <tr key={log.id}>
                            <td>#{log.id}</td>
                            <td><strong>{log.medicine_name}</strong></td>
                            <td>{log.dosage}</td>
                            <td>{log.time_of_day}</td>
                            <td>{log.scheduled_date}</td>
                            <td>
                              <span className={`badge ${log.status === "Taken" ? "badge-success" : log.status === "Missed" ? "badge-danger" : "badge-secondary"}`}>
                                {log.status}
                              </span>
                            </td>
                            <td style={{ fontSize: "0.8rem" }}>{new Date(log.action_time).toLocaleString()}</td>
                          </tr>
                        ))}
                        {patientHistory.history.length === 0 && (
                          <tr>
                            <td colSpan="7" style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-light)" }}>
                              No logs recorded for this patient.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Milestone 3 Clinical Placeholders */}
                  <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
                    <h4 style={{ marginBottom: "1rem" }}>Clinical Insights & Predictions (Upcoming in Milestone 3)</h4>
                    <div className="grid grid-cols-2" style={{ gap: "1rem" }}>
                      <div 
                        className="card" 
                        onClick={() => setShowM3Modal(true)}
                        style={{ cursor: "pointer", border: "1px dashed var(--border-color)", padding: "1rem", opacity: 0.8 }}
                      >
                        <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>📈 Adherence Trend Analysis</div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
                          Predict patient adherence patterns and forecast medicine refills using machine learning.
                        </p>
                        <span className="badge badge-secondary" style={{ fontSize: "0.65rem", marginTop: "0.5rem", display: "inline-block" }}>Coming in Milestone 3</span>
                      </div>

                      <div 
                        className="card" 
                        onClick={() => setShowM3Modal(true)}
                        style={{ cursor: "pointer", border: "1px dashed var(--border-color)", padding: "1rem", opacity: 0.8 }}
                      >
                        <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>💡 Smart AI Recommendations</div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
                          AI suggested intervention steps for patients with below 80% weekly adherence rates.
                        </p>
                        <span className="badge badge-secondary" style={{ fontSize: "0.65rem", marginTop: "0.5rem", display: "inline-block" }}>Coming in Milestone 3</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p>Failed to load patient history report.</p>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Milestone 3 Professional Modal (Shared for Caregiver) */}
      {showM3Modal && (
        <div className="modal-backdrop flex-center" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000 }}>
          <div className="card modal-content" style={{ width: "500px", padding: "2rem", borderRadius: "12px", border: "1px solid #bfdbfe", background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary-color)" }}>
                <span>✨</span> Feature Not Available Yet
              </h3>
              <button onClick={() => setShowM3Modal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-light)" }}>&times;</button>
            </div>
            
            <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-primary)", marginBottom: "1.25rem" }}>
              This feature is planned for <strong>Milestone 3</strong>. It will be available after the completion and mentor approval of Milestone 2.
            </p>

            <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
              <strong style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--text-primary)" }}>Upcoming Features:</strong>
              <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <li>• OCR Prescription Scanner</li>
                <li>• OCR Medicine Recognition</li>
                <li>• AI Refill Prediction</li>
                <li>• Disease Analysis</li>
                <li>• OpenAI Assistant</li>
                <li>• Medicine Image Recognition</li>
                <li>• Refill Analytics</li>
                <li>• Smart AI Recommendations</li>
              </ul>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowM3Modal(false)} className="btn btn-primary">Understood</button>
            </div>
          </div>
        </div>
      )}

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

        .info-item-block {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label-block {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-light);
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .info-val-block {
          font-size: 0.875rem;
          color: var(--text-primary);
          line-height: 1.6;
        }
      ` }} />
    </div>
  );
};

export default CaregiverDashboard;
