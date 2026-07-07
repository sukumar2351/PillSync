import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../services/api";

const Sidebar = ({ role, email }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
    window.location.reload();
  };

  const getLinks = () => {
    switch (role) {
      case "admin":
        return [
          {
            path: "/admin-dashboard",
            label: "Dashboard",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
            )
          },
          {
            path: "/profile",
            label: "Admin Profile",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )
          },
        ];
      case "patient":
        return [
          {
            path: "/patient-dashboard",
            label: "Dashboard",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
            )
          },
          {
            path: "/profile",
            label: "My Profile",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )
          },
        ];
      case "caregiver":
        return [
          {
            path: "/caregiver-dashboard",
            label: "Dashboard",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
            )
          },
          {
            path: "/profile",
            label: "My Profile",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )
          },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="brand-icon">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
          <h2>PillSync</h2>
        </div>
        <span className="role-tag">{role}</span>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {links.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={location.pathname === link.path ? "active" : ""}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar-placeholder">
            {role[0].toUpperCase()}
          </div>
          <div className="user-meta">
            <span className="user-role capitalize">{role}</span>
            <span className="user-email">{email}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn logout-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar {
          width: 260px;
          background-color: #0f172a;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .sidebar-brand {
          padding: 1.75rem 1.5rem;
          border-bottom: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-icon {
          color: #2563eb;
        }

        .sidebar-brand h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 0;
          letter-spacing: -0.02em;
        }

        .role-tag {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          background-color: #1e3a8a;
          color: #60a5fa;
          padding: 0.1875rem 0.5rem;
          border-radius: var(--radius-sm);
          align-self: flex-start;
          letter-spacing: 0.05em;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1.5rem 1rem;
        }

        .sidebar-nav ul {
          list-style: none;
        }

        .sidebar-nav li {
          margin-bottom: 0.375rem;
        }

        .sidebar-nav a {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 1rem;
          color: #94a3b8;
          font-weight: 500;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .sidebar-nav a:hover {
          background-color: #1e293b;
          color: #f8fafc;
        }

        .sidebar-nav a.active {
          background-color: #2563eb;
          color: #ffffff;
        }

        .sidebar-footer {
          padding: 1.5rem 1rem;
          border-top: 1px solid #1e293b;
          background-color: #0b0f19;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0 0.5rem;
        }

        .avatar-placeholder {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #2563eb;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .user-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-role {
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
        }

        .user-email {
          font-size: 0.8125rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logout-btn {
          width: 100%;
          background-color: transparent;
          border: 1px solid #e11d48;
          color: #f43f5e;
          border-radius: var(--radius-md);
          padding: 0.625rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background-color: #f43f5e;
          color: #ffffff;
        }

        .capitalize {
          text-transform: capitalize;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            height: auto;
            position: relative;
            border-bottom: 1px solid #1e293b;
          }
          .sidebar-brand {
            padding: 1rem;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
          .sidebar-nav {
            padding: 0.5rem 1rem;
          }
          .sidebar-nav ul {
            display: flex;
            gap: 0.5rem;
          }
          .sidebar-nav li {
            margin-bottom: 0;
            flex: 1;
          }
          .sidebar-nav a {
            justify-content: center;
          }
          .sidebar-footer {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
          }
          .logout-btn {
            width: auto;
            padding: 0.5rem 1rem;
          }
        }
      ` }} />
    </aside>
  );
};

export default Sidebar;
