import React, { useEffect, useState } from "react";
import { authService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

// Realistic Indian Patients mappings assigned to each of the 10 Caregivers
const caregiverPatientAssignments = {
  "Ramesh Kumar": [
    { id: 1, name: "Rahul Sharma", age: 28, phone: "+91 99887 76601", bloodGroup: "O+", status: "Active" },
    { id: 11, name: "Nikhil Verma", age: 33, phone: "+91 99887 76611", bloodGroup: "B+", status: "Active" }
  ],
  "Sunitha Devi": [
    { id: 2, name: "Priya Reddy", age: 34, phone: "+91 99887 76602", bloodGroup: "A+", status: "Active" },
    { id: 12, name: "Lakshmi Devi", age: 67, phone: "+91 99887 76612", bloodGroup: "O+", status: "Active" }
  ],
  "Mahesh Rao": [
    { id: 3, name: "Arjun Kumar", age: 45, phone: "+91 99887 76603", bloodGroup: "B+", status: "Active" },
    { id: 13, name: "Harsha Vardhan", age: 58, phone: "+91 99887 76613", bloodGroup: "AB+", status: "Active" }
  ],
  "Kavitha Sharma": [
    { id: 4, name: "Sneha Patel", age: 22, phone: "+91 99887 76604", bloodGroup: "AB+", status: "Active" },
    { id: 14, name: "Deepika Rani", age: 48, phone: "+91 99887 76614", bloodGroup: "A+", status: "Active" }
  ],
  "Rajesh Patel": [
    { id: 5, name: "Ravi Teja", age: 31, phone: "+91 99887 76605", bloodGroup: "O-", status: "Active" },
    { id: 15, name: "Suresh Babu", age: 72, phone: "+91 99887 76615", bloodGroup: "B+", status: "Active" }
  ],
  "Srinivas Reddy": [
    { id: 6, name: "Ananya Rao", age: 29, phone: "+91 99887 76606", bloodGroup: "A-", status: "Active" },
    { id: 16, name: "Meghana Reddy", age: 24, phone: "+91 99887 76616", bloodGroup: "O-", status: "Active" }
  ],
  "Anil Kumar": [
    { id: 7, name: "Vikram Singh", age: 52, phone: "+91 99887 76607", bloodGroup: "B-", status: "Active" },
    { id: 17, name: "Akash Jain", age: 30, phone: "+91 99887 76617", bloodGroup: "A-", status: "Active" }
  ],
  "Sujatha Devi": [
    { id: 8, name: "Kiran Kumar", age: 38, phone: "+91 99887 76608", bloodGroup: "AB-", status: "Active" },
    { id: 18, name: "Bhavya Nair", age: 27, phone: "+91 99887 76618", bloodGroup: "B-", status: "Active" }
  ],
  "Manoj Verma": [
    { id: 9, name: "Pooja Sharma", age: 26, phone: "+91 99887 76609", bloodGroup: "O+", status: "Active" },
    { id: 19, name: "Ajay Kumar", age: 35, phone: "+91 99887 76619", bloodGroup: "AB-", status: "Active" }
  ],
  "Swapna Reddy": [
    { id: 10, name: "Sai Krishna", age: 41, phone: "+91 99887 76610", bloodGroup: "A+", status: "Active" },
    { id: 20, name: "Divya Sri", age: 25, phone: "+91 99887 76620", bloodGroup: "O+", status: "Active" }
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
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((pat) => (
                    <tr key={pat.id}>
                      <td>#{pat.id}</td>
                      <td><strong>{pat.name}</strong></td>
                      <td>{pat.age} years</td>
                      <td>{pat.phone}</td>
                      <td>{pat.bloodGroup}</td>
                      <td>
                        <span className="badge badge-success">{pat.status}</span>
                      </td>
                    </tr>
                  ))}
                  {paginatedPatients.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "1.5rem" }}>No matching patients found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
