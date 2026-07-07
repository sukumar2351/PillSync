import React from "react";

const Navbar = ({ pageTitle }) => {
  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <header className="navbar-header">
      <div className="navbar-left">
        <h1 className="page-title">{pageTitle}</h1>
        <span className="navbar-date">{formattedDate}</span>
      </div>
      <div className="navbar-right">
        <button className="nav-icon-btn" onClick={() => alert("Notifications feature is coming in Milestone 2.")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="nav-badge"></span>
        </button>
        
        <div className="navbar-divider"></div>
        
        <div className="navbar-user">
          <div className="nav-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <span className="system-status">
            <span className="status-dot"></span> Online
          </span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .navbar-header {
          height: 70px;
          background-color: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        }

        .navbar-left {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .page-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .navbar-date {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .nav-icon-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.375rem;
          border-radius: 50%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .nav-icon-btn:hover {
          background-color: var(--bg-hover);
          color: var(--text-primary);
        }

        .nav-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--error-color);
          border: 1.5px solid var(--bg-primary);
        }

        .navbar-divider {
          width: 1px;
          height: 24px;
          background-color: var(--border-color);
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .nav-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #eff6ff;
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #bfdbfe;
        }

        .system-status {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-weight: 500;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--success-color);
          display: inline-block;
        }

        @media (max-width: 768px) {
          .navbar-header {
            padding: 0 1rem;
            height: 60px;
          }
          .page-title {
            font-size: 1.125rem;
          }
          .navbar-date {
            display: none;
          }
          .navbar-divider {
            display: none;
          }
        }
      ` }} />
    </header>
  );
};

export default Navbar;
