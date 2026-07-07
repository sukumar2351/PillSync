import React, { useEffect, useState } from "react";
import { adminService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const AdminDashboard = ({ auth }) => {
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Table sorting, pagination & search state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const statsData = await adminService.getDashboardStats();
        setStats(statsData);
        
        const listData = await adminService.getUsersList();
        setUsersList(listData);
      } catch (err) {
        setErrorMsg("Failed to load administration reports.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  // Filter users based on search term
  const filteredUsers = usersList.filter((u) => {
    const query = searchTerm.toLowerCase();
    return (
      u.email.toLowerCase().includes(query) ||
      (u.full_name && u.full_name.toLowerCase().includes(query)) ||
      u.role.toLowerCase().includes(query)
    );
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    if (sortField === "created_at") {
      valA = new Date(valA);
      valB = new Date(valB);
    } else {
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate users
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage));
  const pageToRender = Math.min(currentPage, totalPages);
  const indexOfLastItem = pageToRender * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to page 1 on sort change
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to page 1 on search change
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
    <div className="app-container">
      <Sidebar role={auth.role} email={auth.email} />
      <div className="main-content">
        <Navbar pageTitle="Administration Dashboard" />
        
        <main className="content-area">
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

          {/* Stats Grid - 6 Cards */}
          <div className="grid grid-cols-3 stats-row" style={{ marginBottom: "2rem" }}>
            
            {/* Card 1: Total Registered Users */}
            <div className="card stat-card stat-card-border-blue">
              <div className="stat-header-row">
                <span className="stat-label">Total Users</span>
                <div className="stat-icon-container stat-icon-blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </div>
              <h2 className="stat-value">{stats?.total_users || 0}</h2>
            </div>
            
            {/* Card 2: Patient Accounts */}
            <div className="card stat-card stat-card-border-green">
              <div className="stat-header-row">
                <span className="stat-label">Total Patients</span>
                <div className="stat-icon-container stat-icon-green">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
              </div>
              <h2 className="stat-value">{stats?.total_patients || 0}</h2>
            </div>
            
            {/* Card 3: Caregiver Accounts */}
            <div className="card stat-card stat-card-border-indigo">
              <div className="stat-header-row">
                <span className="stat-label">Total Caregivers</span>
                <div className="stat-icon-container stat-icon-indigo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                  </svg>
                </div>
              </div>
              <h2 className="stat-value">{stats?.total_caregivers || 0}</h2>
            </div>

            {/* Card 4: Today's Registrations */}
            <div className="card stat-card stat-card-border-amber">
              <div className="stat-header-row">
                <span className="stat-label">Today's Registrations</span>
                <div className="stat-icon-container stat-icon-amber">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>
              <h2 className="stat-value">{stats?.todays_registrations || 0}</h2>
            </div>

            {/* Card 5: Active Users */}
            <div className="card stat-card stat-card-border-slate">
              <div className="stat-header-row">
                <span className="stat-label">Active Accounts</span>
                <div className="stat-icon-container stat-icon-slate">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
              </div>
              <h2 className="stat-value">{stats?.active_users || 0}</h2>
            </div>

            {/* Card 6: Inactive Users */}
            <div className="card stat-card stat-card-border-red">
              <div className="stat-header-row">
                <span className="stat-label">Inactive Accounts</span>
                <div className="stat-icon-container stat-icon-red">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
              </div>
              <h2 className="stat-value">{stats?.inactive_users || 0}</h2>
            </div>

          </div>

          <div className="grid grid-cols-2">
            {/* Latest Registered Users */}
            <div className="card full-width-mobile">
              <h3 className="card-title">Latest Registrations</h3>
              <div className="table-container compact-table" style={{ border: "none", boxShadow: "none" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Registered On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.latest_users?.map((u) => (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === "patient" ? "badge-primary" : u.role === "admin" ? "badge-success" : "badge-secondary"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {(!stats?.latest_users || stats.latest_users.length === 0) && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: "center", color: "var(--text-light)" }}>No recent signups.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Default Accounts System Note */}
            <div className="card system-note-card">
              <h3 className="card-title">System Policy Information</h3>
              <p className="note-text">
                PillSync operates under strict security policies. Admin accounts are seeded directly on server initialization. Users cannot register as administrators through the registration form.
              </p>
              <div className="seed-credentials">
                <strong>Default Administrator Testing Credentials:</strong>
                <ul>
                  <li><strong>Email:</strong> admin@pillsync.com</li>
                  <li><strong>Password:</strong> admin123</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Complete Users Management Table */}
          <div className="card">
            <h3 className="card-title">User Accounts Directory</h3>
            
            {/* Search Box, Pagination Header Toolbar */}
            <div className="table-toolbar">
              <div className="search-input-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, email, role..."
                  className="form-input search-field"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="pagination-controls">
                <span className="page-info">
                  Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedUsers.length)} of {sortedUsers.length}
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

            {/* User Directory Table */}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("id")} className="sort-header">
                      User ID {sortField === "id" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("full_name")} className="sort-header">
                      Full Name / Identity {sortField === "full_name" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("email")} className="sort-header">
                      Email Address {sortField === "email" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("role")} className="sort-header">
                      System Role {sortField === "role" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("is_active")} className="sort-header">
                      Account Status {sortField === "is_active" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th onClick={() => handleSort("created_at")} className="sort-header">
                      Created At {sortField === "created_at" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td><strong>{user.full_name || "—"}</strong></td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === "admin" ? "badge-success" : user.role === "patient" ? "badge-primary" : "badge-secondary"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.is_active ? "badge-success" : "badge-secondary"}`}>
                          {user.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>No matching user accounts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .stats-row {
          margin-bottom: 1.5rem;
        }

        .stat-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-bottom: 0 !important;
        }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 0.25rem;
          margin-bottom: 0;
        }

        .compact-table td, .compact-table th {
          padding: 0.75rem 1rem;
        }

        .system-note-card {
          background-color: #f5f3ff !important;
          border-color: #ddd6fe !important;
        }

        .system-note-card:hover {
          transform: none;
          box-shadow: var(--shadow-sm);
        }

        .note-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .seed-credentials {
          font-size: 0.8125rem;
          color: #5b21b6;
          background-color: #ede9fe;
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid #ddd6fe;
        }

        .seed-credentials ul {
          list-style: none;
          margin-top: 0.5rem;
        }

        .seed-credentials li {
          margin-bottom: 0.25rem;
        }

        @media (max-width: 768px) {
          .full-width-mobile {
            grid-column: span 2;
          }
        }
      ` }} />
    </div>
  );
};

export default AdminDashboard;
