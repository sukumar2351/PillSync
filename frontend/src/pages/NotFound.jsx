import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="notfound-container flex-center">
      <div className="notfound-card text-center">
        <h1 className="error-code">404</h1>
        <h2>Page Not Found</h2>
        <p className="error-description">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Safety
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .notfound-container {
          min-height: 100vh;
          background-color: var(--bg-secondary);
          padding: 2rem;
        }

        .notfound-card {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 3rem 2rem;
          max-width: 480px;
          width: 100%;
          box-shadow: var(--shadow-lg);
        }

        .text-center {
          text-align: center;
        }

        .error-code {
          font-size: 5rem;
          font-weight: 800;
          color: var(--primary-color);
          margin-bottom: 0.5rem;
          line-height: 1;
        }

        .notfound-card h2 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .error-description {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
      ` }} />
    </div>
  );
};

export default NotFound;
