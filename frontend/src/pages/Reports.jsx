import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { reportsService } from "../services/api";
import { BarChart2, TrendingUp, Award, Calendar, CheckCircle2, XCircle, Printer, Download, Filter } from "lucide-react";

const Reports = ({ auth }) => {
  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [activeTab, setActiveTab] = useState("daily"); // 'daily' | 'weekly'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const [sumRes, dailyRes, weeklyRes] = await Promise.all([
        reportsService.getSummary(),
        reportsService.getDailyAdherence(14),
        reportsService.getWeeklyAdherence(8)
      ]);
      setSummary(sumRes);
      setDailyData(dailyRes || []);
      setWeeklyData(weeklyRes || []);
    } catch (err) {
      setError("Failed to load adherence reports.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <Sidebar role={auth?.role} email={auth?.email} />
        <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
          <Navbar pageTitle="Reports & Analytics" />
          <div style={{ padding: "2rem" }}>
            <div className="skeleton" style={{ height: "120px", borderRadius: "16px", marginBottom: "1.5rem" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: "90px", borderRadius: "12px" }} />)}
            </div>
            <div className="skeleton" style={{ height: "300px", borderRadius: "16px" }} />
          </div>
        </div>
      </div>
    );
  }

  const chartData = activeTab === "daily" ? dailyData : weeklyData;

  return (
    <div className="app-container" style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#F8FAFC" }}>
      <Sidebar role={auth?.role} email={auth?.email} />

      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
        <Navbar pageTitle="Medication Analytics & Reports" />

        <main className="content-area" style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Top Banner / Actions */}
          <div
            className="page-section stagger-1"
            style={{
              background: "linear-gradient(135deg, #1E1B4B 0%, #1E293B 100%)",
              borderRadius: "20px",
              padding: "1.75rem",
              color: "#FFFFFF",
              marginBottom: "2rem",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Medication Adherence Report</h2>
              <p style={{ margin: "0.35rem 0 0", color: "#94A3B8", fontSize: "0.9rem" }}>
                Comprehensive health performance data, streak tracking, and compliance charts.
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ background: "#FFFFFF", color: "#1E293B", fontWeight: 700, fontSize: "0.85rem" }}
            >
              <Printer size={16} style={{ marginRight: "0.4rem" }} /> Export / Print PDF Report
            </button>
          </div>

          {/* Key Analytics Summary Cards */}
          <div
            className="page-section stagger-2"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
              marginBottom: "2rem"
            }}
          >
            {/* Overall Adherence */}
            <div className="card" style={{ padding: "1.25rem", borderRadius: "16px", background: "#FFFFFF", borderLeft: "4px solid #2563EB" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Overall Adherence</span>
              <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#2563EB", margin: "0.3rem 0" }}>
                {summary?.adherence_percentage}%
              </div>
              <span style={{ fontSize: "0.78rem", color: "#10B981" }}>Target: &ge;85%</span>
            </div>

            {/* Consistency Score */}
            <div className="card" style={{ padding: "1.25rem", borderRadius: "16px", background: "#FFFFFF", borderLeft: "4px solid #10B981" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Consistency Score</span>
              <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#10B981", margin: "0.3rem 0" }}>
                {summary?.consistency_score} / 100
              </div>
              <span style={{ fontSize: "0.78rem", color: "#64748B" }}>Based on recent log rates</span>
            </div>

            {/* Current Streak */}
            <div className="card" style={{ padding: "1.25rem", borderRadius: "16px", background: "#FFFFFF", borderLeft: "4px solid #F59E0B" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Current Streak</span>
              <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#F59E0B", margin: "0.3rem 0" }}>
                {summary?.current_streak_days} Days
              </div>
              <span style={{ fontSize: "0.78rem", color: "#64748B" }}>Consecutive full compliance</span>
            </div>

            {/* Total Doses Logged */}
            <div className="card" style={{ padding: "1.25rem", borderRadius: "16px", background: "#FFFFFF", borderLeft: "4px solid #6366F1" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Total Doses Recorded</span>
              <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#6366F1", margin: "0.3rem 0" }}>
                {summary?.total_doses}
              </div>
              <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                {summary?.taken_doses} Taken • {summary?.missed_doses} Missed
              </span>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="page-section stagger-3 card" style={{ padding: "1.75rem", borderRadius: "20px", background: "#FFFFFF", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BarChart2 size={22} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#1E293B" }}>
                  Adherence Compliance Breakdown
                </h3>
              </div>

              {/* Tab Selector */}
              <div style={{ display: "flex", background: "#F1F5F9", padding: "0.25rem", borderRadius: "12px" }}>
                <button
                  onClick={() => setActiveTab("daily")}
                  style={{
                    padding: "0.4rem 1rem",
                    borderRadius: "10px",
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: activeTab === "daily" ? "#FFFFFF" : "transparent",
                    color: activeTab === "daily" ? "#2563EB" : "#64748B",
                    boxShadow: activeTab === "daily" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
                  }}
                >
                  Daily (Last 14 Days)
                </button>
                <button
                  onClick={() => setActiveTab("weekly")}
                  style={{
                    padding: "0.4rem 1rem",
                    borderRadius: "10px",
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: activeTab === "weekly" ? "#FFFFFF" : "transparent",
                    color: activeTab === "weekly" ? "#2563EB" : "#64748B",
                    boxShadow: activeTab === "weekly" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
                  }}
                >
                  Weekly (Last 8 Weeks)
                </button>
              </div>
            </div>

            {/* Custom Visual Bar Graph */}
            <div style={{ height: "260px", display: "flex", alignItems: "flex-end", gap: "1rem", padding: "1rem 0 2rem", borderBottom: "1px solid #E2E8F0" }}>
              {chartData.map((item, idx) => {
                const heightPct = Math.max(8, item.adherence);
                return (
                  <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                      {item.adherence}%
                    </span>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "40px",
                        height: `${heightPct}%`,
                        background: item.adherence >= 80 ? "linear-gradient(180deg, #10B981 0%, #059669 100%)" : "linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)",
                        borderRadius: "8px 8px 0 0",
                        transition: "all 0.3s ease"
                      }}
                      className="hover-card"
                      title={`Doses Taken: ${item.taken} / ${item.total}`}
                    />
                    <span style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "0.5rem", textAlign: "center", whiteSpace: "nowrap" }}>
                      {activeTab === "daily" ? item.day : item.week}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1rem", fontSize: "0.82rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#10B981" }} />
                <span>High Compliance (&ge;80%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#3B82F6" }} />
                <span>Standard Adherence (&lt;80%)</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
