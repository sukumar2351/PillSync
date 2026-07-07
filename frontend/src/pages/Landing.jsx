import React from "react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="logo-section">
          <span className="logo-text">PillSync</span>
        </div>
        <nav className="nav-buttons">
          <Link to="/login" className="btn btn-secondary">Login</Link>
          <Link to="/register" className="btn btn-primary">Register</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Intelligent Medicine Reminder & Medication Tracking Platform</h1>
          <p className="hero-subtitle">
            A secure and professional healthcare portal designed to connect patients, caregivers, and medical administrators for streamlined profiles and account management.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Access Portal</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="info-section">
        <h2 className="section-title">Milestone 1 Key Capabilities</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Secure JWT Authentication</h3>
            <p>Provides secure registration and credentials-based login with state-of-the-art token security and bcrypt password protection.</p>
          </div>
          <div className="feature-card">
            <h3>Role-Based User Dashboards</h3>
            <p>Custom home environments tailored specifically for Patients, Caregivers, and system Administrators.</p>
          </div>
          <div className="feature-card">
            <h3>Comprehensive Profiles</h3>
            <p>Enables updating phone numbers, emergency contact details, addresses, and physical metrics with strong validation rules.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="about-card">
          <h2>About PillSync</h2>
          <p>
            PillSync is an intelligent solution designed to reduce medication non-adherence. 
            Milestone 1 focuses on building the foundational security layer, modular backend APIs, 
            PostgreSQL relational schemas, and responsive dashboards, laying down the groundwork for medication tracking in subsequent milestones.
          </p>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-section">
        <h2 className="section-title">Technology Stack</h2>
        <div className="tech-grid">
          <div className="tech-item">
            <strong>React.js</strong>
            <span>Frontend framework</span>
          </div>
          <div className="tech-item">
            <strong>Python FastAPI</strong>
            <span>High-performance backend</span>
          </div>
          <div className="tech-item">
            <strong>PostgreSQL</strong>
            <span>Robust relational database</span>
          </div>
          <div className="tech-item">
            <strong>JWT & bcrypt</strong>
            <span>Secure auth & hashing</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 PillSync. Developed for Infosys Springboard Milestone 1.</p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .landing-container {
          background-color: var(--bg-secondary);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background-color: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .nav-buttons {
          display: flex;
          gap: 1rem;
        }

        .hero-section {
          padding: 5rem 2rem;
          text-align: center;
          background-color: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .hero-content h1 {
          font-size: 2.5rem;
          line-height: 1.2;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
        }

        .hero-subtitle {
          font-size: 1.125rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .hero-cta {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .btn-lg {
          padding: 0.75rem 1.75rem;
          font-size: 1rem;
        }

        .section-title {
          text-align: center;
          margin-bottom: 2.5rem;
          font-size: 1.75rem;
        }

        .info-section {
          padding: 4rem 2rem;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .feature-card {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 2rem;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
        }

        .feature-card h3 {
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
          color: var(--primary-color);
        }

        .feature-card p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .about-section {
          padding: 4rem 2rem;
          background-color: var(--bg-primary);
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }

        .about-card {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .about-card h2 {
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .about-card p {
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .tech-section {
          padding: 4rem 2rem;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .tech-item {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 1.5rem;
          text-align: center;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .tech-item strong {
          color: var(--text-primary);
          font-size: 1rem;
        }

        .tech-item span {
          color: var(--text-secondary);
          font-size: 0.75rem;
        }

        .landing-footer {
          margin-top: auto;
          background-color: var(--bg-primary);
          border-top: 1px solid var(--border-color);
          padding: 1.5rem;
          text-align: center;
          color: var(--text-light);
          font-size: 0.8125rem;
        }

        @media (max-width: 768px) {
          .features-grid, .tech-grid {
            grid-template-columns: 1fr;
          }
          .hero-content h1 {
            font-size: 1.75rem;
          }
          .hero-cta {
            flex-direction: column;
          }
        }
      ` }} />
    </div>
  );
};

export default Landing;
