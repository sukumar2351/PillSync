import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { ocrService } from "../services/api";
import PrescriptionUploadModal from "../components/PrescriptionUploadModal";
import { Sparkles, FileText, Calendar, CheckCircle2, Clock, Eye, Plus, Search, Filter } from "lucide-react";

const OCRHistory = ({ auth }) => {
  const [history, setHistory] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const data = await ocrService.getHistory();
      setHistory(data || []);
    } catch (err) {
      setError("Failed to load OCR prescription scan history.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const detail = await ocrService.getRecordDetail(id);
      setSelectedRecord(detail);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container" style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#F8FAFC" }}>
      <Sidebar role={auth?.role} email={auth?.email} />

      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
        <Navbar pageTitle="Prescription OCR Scan History" />

        <main className="content-area" style={{ padding: "2rem", maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
          {error && <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>{error}</div>}

          {/* Action Banner */}
          <div
            className="page-section stagger-1 card"
            style={{
              padding: "1.75rem 2rem",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #1E1B4B 0%, #1E293B 100%)",
              color: "#FFFFFF",
              marginBottom: "2rem",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(96, 165, 250, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justify: "center",
                  color: "#60A5FA"
                }}
              >
                <Sparkles size={26} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Prescription Scan History</h2>
                <span style={{ fontSize: "0.85rem", color: "#94A3B8" }}>
                  Archived digital OCR extractions, prescription records, and matched medicine details
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
              style={{ background: "#2563EB", fontWeight: 700, fontSize: "0.85rem" }}
            >
              <Plus size={16} style={{ marginRight: "0.4rem" }} /> Upload New Prescription OCR
            </button>
          </div>

          {/* Table Card */}
          <div className="page-section stagger-2 card" style={{ padding: "1.75rem", borderRadius: "20px", background: "#FFFFFF" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1E293B" }}>
                Scan Records ({history.length})
              </h3>
            </div>

            {isLoading && (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>Loading scan history...</div>
            )}

            {!isLoading && history.length === 0 && (
              <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#64748B" }}>
                <FileText size={40} color="#CBD5E1" style={{ marginBottom: "0.75rem" }} />
                <h4 style={{ margin: "0 0 0.3rem", color: "#1E293B" }}>No Prescription Scans Yet</h4>
                <p style={{ margin: "0 0 1rem", fontSize: "0.85rem" }}>
                  Upload a prescription image or PDF to extract medication schedules automatically.
                </p>
                <button onClick={() => setShowUploadModal(true)} className="btn btn-primary" style={{ fontSize: "0.82rem" }}>
                  Upload Prescription Now
                </button>
              </div>
            )}

            {!isLoading && history.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569" }}>
                      <th style={{ padding: "0.85rem 1rem" }}>Upload Date</th>
                      <th style={{ padding: "0.85rem 1rem" }}>File Name</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Format</th>
                      <th style={{ padding: "0.85rem 1rem" }}>File Size</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Medicines Extracted</th>
                      <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                      <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id} style={{ borderBottom: "1px solid #F1F5F9" }} className="hover-card">
                        <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>
                          {new Date(record.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1E293B" }}>
                          {record.filename}
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span className="badge badge-primary" style={{ fontSize: "0.72rem" }}>
                            {record.file_type}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>
                          {(record.file_size_bytes / 1024).toFixed(1)} KB
                        </td>
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 800, color: "#2563EB" }}>
                          {record.medicines_count} Items
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "12px",
                              fontSize: "0.74rem",
                              fontWeight: 800,
                              background: "#DCFCE7",
                              color: "#15803D"
                            }}
                          >
                            {record.ocr_status}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                          <button
                            onClick={() => handleViewDetail(record.id)}
                            className="btn btn-secondary"
                            style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem" }}
                          >
                            <Eye size={14} style={{ marginRight: "0.2rem" }} /> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justify: "center",
            padding: "1rem"
          }}
        >
          <div
            className="card modal-content"
            style={{ width: "600px", padding: "1.75rem", borderRadius: "20px", background: "#FFFFFF" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#1E293B" }}>
                Prescription Scan Details #{selectedRecord.id}
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "1rem", fontSize: "0.88rem", color: "#475569" }}>
              <div><strong>File Name:</strong> {selectedRecord.filename}</div>
              <div><strong>Scan Date:</strong> {new Date(selectedRecord.created_at).toLocaleString()}</div>
              <div><strong>Extracted Count:</strong> {selectedRecord.medicines_count} Medications</div>
            </div>

            <div style={{ background: "#F8FAFC", borderRadius: "12px", padding: "1rem", border: "1px solid #E2E8F0" }}>
              <strong style={{ fontSize: "0.8rem", color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                Raw OCR Recognized Text:
              </strong>
              <pre style={{ margin: 0, fontSize: "0.78rem", whiteSpace: "pre-wrap", color: "#1E293B", fontFamily: "monospace" }}>
                {selectedRecord.raw_text}
              </pre>
            </div>

            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button onClick={() => setSelectedRecord(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* OCR Upload Modal */}
      <PrescriptionUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onMedicinesSaved={() => {
          fetchHistory();
        }}
      />
    </div>
  );
};

export default OCRHistory;
