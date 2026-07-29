import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, Sparkles, Plus } from "lucide-react";
import { ocrService } from "../services/api";

const PrescriptionUploadModal = ({ isOpen, onClose, onExtractedMedicines }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a prescription image or PDF file.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const data = await ocrService.uploadPrescription(file);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to process prescription OCR.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyMedication = (med) => {
    if (onExtractedMedicines) {
      onExtractedMedicines(med);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}
    >
      <div
        className="modal-content animate-fade-in-up"
        style={{
          background: "#FFFFFF",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "600px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid #E2E8F0"
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            background: "linear-gradient(135deg, #1E1B4B 0%, #1E293B 100%)",
            color: "#FFFFFF",
            display: "flex",
            justify: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Sparkles size={20} color="#60A5FA" />
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Smart Prescription OCR</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.5rem", maxHeight: "420px", overflowY: "auto" }}>
          {error && <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}

          {!result && (
            <div>
              <div
                style={{
                  border: "2px dashed #CBD5E1",
                  borderRadius: "16px",
                  padding: "2rem",
                  textAlign: "center",
                  background: "#F8FAFC",
                  cursor: "pointer",
                  marginBottom: "1.25rem"
                }}
              >
                <UploadCloud size={40} color="#2563EB" style={{ marginBottom: "0.75rem" }} />
                <h4 style={{ margin: "0 0 0.3rem", fontSize: "1rem", color: "#1E293B" }}>
                  Upload Prescription Image or PDF
                </h4>
                <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "#64748B" }}>
                  Supports PNG, JPG, JPEG, PDF. Automatic extraction of dosage & frequency.
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="prescription-file-input"
                />
                <label htmlFor="prescription-file-input" className="btn btn-primary" style={{ cursor: "pointer", fontSize: "0.85rem" }}>
                  Select Prescription File
                </label>
              </div>

              {file && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F1F5F9", padding: "0.75rem 1rem", borderRadius: "12px", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileText size={18} color="#2563EB" />
                    <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1E293B" }}>{file.name}</span>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#64748B" }}>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>
          )}

          {result && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#1E293B" }}>Extracted Prescriptions</h4>
                <span className="badge badge-primary">{result.extracted_medications.length} Detected</span>
              </div>

              {result.extracted_medications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1.5rem", color: "#64748B", background: "#F8FAFC", borderRadius: "12px" }}>
                  <p style={{ margin: 0, fontSize: "0.88rem" }}>No matching medicine names detected in uploaded prescription.</p>
                </div>
              ) : (
                result.extracted_medications.map((med, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#F8FAFC",
                      borderRadius: "14px",
                      padding: "1rem",
                      border: "1px solid #E2E8F0",
                      marginBottom: "0.85rem",
                      display: "flex",
                      justify: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <strong style={{ fontSize: "0.95rem", color: "#1E293B" }}>{med.name}</strong>
                        <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: "10px", background: med.is_confident ? "#DCFCE7" : "#FEF3C7", color: med.is_confident ? "#15803D" : "#B45309", fontWeight: 700 }}>
                          {(med.confidence * 100).toFixed(0)}% Confidence
                        </span>
                      </div>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#64748B" }}>
                        Dosage: {med.dosage} • Frequency: {med.frequency} • Duration: {med.duration}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyMedication(med)}
                      className="btn btn-primary"
                      style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}
                    >
                      <Plus size={14} style={{ marginRight: "0.2rem" }} /> Auto Fill
                    </button>
                  </div>
                ))
              )}

              <div style={{ background: "#F1F5F9", borderRadius: "12px", padding: "0.85rem", marginTop: "1rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                  Raw OCR Text:
                </span>
                <pre style={{ margin: 0, fontSize: "0.78rem", color: "#334155", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                  {result.ocr_text}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "#F8FAFC",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justify: "space-between",
            alignItems: "center"
          }}
        >
          {result ? (
            <button type="button" onClick={() => setResult(null)} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              Upload Another
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              Close
            </button>
            {!result && (
              <button type="button" onClick={handleUpload} disabled={isLoading} className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
                {isLoading ? "Running OCR..." : "Extract Prescription"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUploadModal;
