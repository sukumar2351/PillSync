import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, Sparkles, Plus, Trash2, Edit2, Check, ArrowRight, FileCheck } from "lucide-react";
import { ocrService } from "../services/api";

const PrescriptionUploadModal = ({ isOpen, onClose, onMedicinesSaved }) => {
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [step, setStep] = useState("upload"); // 'upload' | 'extracting' | 'review' | 'saving'
  const [progress, setProgress] = useState(0);

  const [uploadedRecord, setUploadedRecord] = useState(null);
  const [extractedData, setExtractedData] = useState([]);
  const [rawOcrText, setRawOcrText] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile) => {
    setError("");
    setSuccessMsg("");

    const ext = selectedFile.name.split(".").pop().toLowerCase();
    if (!["jpg", "jpeg", "png", "pdf"].includes(ext)) {
      setError(`Unsupported format '.${ext}'. Please upload JPG, JPEG, PNG, or PDF files.`);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    setFile(selectedFile);
    if (ext !== "pdf") {
      setFilePreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!file) {
      setError("Please select a prescription file first.");
      return;
    }

    try {
      setStep("extracting");
      setError("");
      setProgress(25);

      // Upload Step
      const uploadRes = await ocrService.uploadFile(file);
      setUploadedRecord(uploadRes);
      setProgress(60);

      // Extract Step
      const extractRes = await ocrService.extractPrescription(uploadRes.record_id);
      setProgress(100);

      setExtractedData(extractRes.medicines || []);
      setRawOcrText(extractRes.raw_text || "");
      setStep("review");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to process prescription OCR.");
      setStep("upload");
    }
  };

  const handleTableEdit = (index, field, value) => {
    const updated = [...extractedData];
    updated[index][field] = value;
    setExtractedData(updated);
  };

  const handleRemoveRow = (index) => {
    setExtractedData((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomRow = () => {
    setExtractedData([
      ...extractedData,
      {
        name: "",
        dosage: "500mg",
        frequency: "Once Daily",
        duration: "7 days",
        instructions: "As directed",
        status: "Not Matched",
        is_matched: false,
        confidence: 0.90
      }
    ]);
  };

  const handleSaveToMedicineList = async () => {
    const validMeds = extractedData.filter((m) => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      setError("No valid medicines to save. Please enter at least one medicine name.");
      return;
    }

    try {
      setStep("saving");
      setError("");
      const res = await ocrService.saveMedicines(validMeds);
      setSuccessMsg(res.message);

      if (onMedicinesSaved) {
        onMedicinesSaved(res.saved_medicines);
      }

      setTimeout(() => {
        handleReset();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save medicines.");
      setStep("review");
    }
  };

  const handleReset = () => {
    setFile(null);
    setFilePreviewUrl(null);
    setStep("upload");
    setProgress(0);
    setExtractedData([]);
    setRawOcrText("");
    setError("");
    setSuccessMsg("");
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
          maxWidth: step === "review" ? "850px" : "620px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid #E2E8F0",
          transition: "max-width 0.3s ease"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            background: "linear-gradient(135deg, #1E1B4B 0%, #1E293B 100%)",
            color: "#FFFFFF",
            display: "flex",
            justify: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Sparkles size={20} color="#60A5FA" />
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Prescription OCR Module</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.75rem", maxHeight: "550px", overflowY: "auto" }}>
          {error && <div className="alert alert-danger" style={{ marginBottom: "1.25rem" }}>{error}</div>}
          {successMsg && <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>{successMsg}</div>}

          {/* UPLOAD STEP */}
          {step === "upload" && (
            <div>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? "#2563EB" : "#CBD5E1"}`,
                  borderRadius: "16px",
                  padding: "2.5rem 1.5rem",
                  textAlign: "center",
                  background: dragActive ? "#EFF6FF" : "#F8FAFC",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <UploadCloud size={48} color={dragActive ? "#2563EB" : "#64748B"} style={{ marginBottom: "0.85rem" }} />
                <h4 style={{ margin: "0 0 0.3rem", fontSize: "1.05rem", color: "#1E293B", fontWeight: 700 }}>
                  Drag & Drop Prescription Image or PDF
                </h4>
                <p style={{ margin: "0 0 1.25rem", fontSize: "0.84rem", color: "#64748B" }}>
                  Supports JPG, JPEG, PNG, or PDF files (Max 10MB)
                </p>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="prescription-file-upload-input"
                />
                <label
                  htmlFor="prescription-file-upload-input"
                  className="btn btn-primary"
                  style={{ cursor: "pointer", fontSize: "0.85rem", padding: "0.5rem 1.25rem" }}
                >
                  Browse Prescription File
                </label>
              </div>

              {/* Selected File Card */}
              {file && (
                <div
                  style={{
                    marginTop: "1.25rem",
                    padding: "1rem 1.25rem",
                    borderRadius: "14px",
                    background: "#F1F5F9",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    justify: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    {filePreviewUrl ? (
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "8px",
                          background: "#E2E8F0",
                          display: "flex",
                          alignItems: "center",
                          justify: "center"
                        }}
                      >
                        <FileText size={24} color="#2563EB" />
                      </div>
                    )}
                    <div>
                      <strong style={{ fontSize: "0.9rem", color: "#1E293B", display: "block" }}>{file.name}</strong>
                      <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                        {(file.size / 1024).toFixed(1)} KB • {file.name.split(".").pop().toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setFile(null); setFilePreviewUrl(null); }}
                    style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* EXTRACTING STEP (PROGRESS INDICATOR) */}
          {(step === "extracting" || step === "saving") && (
            <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
              <Sparkles size={40} color="#2563EB" className="animate-bounce" style={{ marginBottom: "1rem" }} />
              <h4 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "#1E293B" }}>
                {step === "extracting" ? "Running Intelligent Prescription OCR..." : "Saving Validated Medicines..."}
              </h4>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "#64748B" }}>
                Analyzing dosage, frequency, and matching against Medicine Master database.
              </p>
              <div style={{ width: "100%", height: "8px", background: "#E2E8F0", borderRadius: "99px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #2563EB, #06B6D4)",
                    transition: "width 0.4s ease"
                  }}
                />
              </div>
            </div>
          )}

          {/* REVIEW STEP (EDITABLE TABLE) */}
          {step === "review" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1rem", color: "#1E293B", fontWeight: 800 }}>
                    Extracted Prescription Items ({extractedData.length})
                  </h4>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Multi-stage OCR extracted medication data matched against Medicine Master database.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomRow}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                >
                  <Plus size={14} style={{ marginRight: "0.2rem" }} /> Add Row
                </button>
              </div>

              {/* Warning alert if low confidence items exist */}
              {extractedData.some(item => item.warning_note || item.confidence < 65) && (
                <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", padding: "0.75rem 1rem", borderRadius: "12px", marginBottom: "1rem", color: "#92400E", fontSize: "0.83rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <AlertCircle size={18} color="#D97706" />
                  <span>We could not confidently identify all medicines. Please review and verify values manually before saving.</span>
                </div>
              )}

              {/* Editable Review Table */}
              <div style={{ overflowX: "auto", border: "1px solid #E2E8F0", borderRadius: "12px", marginBottom: "1.25rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569" }}>
                      <th style={{ padding: "0.75rem" }}>Medicine Name</th>
                      <th style={{ padding: "0.75rem" }}>Strength</th>
                      <th style={{ padding: "0.75rem" }}>Dosage</th>
                      <th style={{ padding: "0.75rem" }}>Frequency</th>
                      <th style={{ padding: "0.75rem" }}>Duration</th>
                      <th style={{ padding: "0.75rem" }}>Matched Medicine</th>
                      <th style={{ padding: "0.75rem" }}>Status</th>
                      <th style={{ padding: "0.75rem" }}>Confidence</th>
                      <th style={{ padding: "0.75rem", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9", background: item.status === "Auto-Corrected" ? "#F0FDF4" : (item.is_matched ? "#FFFFFF" : "#FFFBEB") }}>
                        <td style={{ padding: "0.4rem" }}>
                          <input
                            type="text"
                            className="form-control"
                            value={item.name}
                            onChange={(e) => handleTableEdit(idx, "name", e.target.value)}
                            style={{ fontSize: "0.82rem", padding: "0.3rem 0.5rem" }}
                            placeholder="Medicine Name"
                          />
                        </td>
                        <td style={{ padding: "0.4rem" }}>
                          <input
                            type="text"
                            className="form-control"
                            value={item.strength || "500 mg"}
                            onChange={(e) => handleTableEdit(idx, "strength", e.target.value)}
                            style={{ fontSize: "0.82rem", padding: "0.3rem 0.5rem", width: "80px" }}
                          />
                        </td>
                        <td style={{ padding: "0.4rem" }}>
                          <input
                            type="text"
                            className="form-control"
                            value={item.dosage}
                            onChange={(e) => handleTableEdit(idx, "dosage", e.target.value)}
                            style={{ fontSize: "0.82rem", padding: "0.3rem 0.5rem", width: "95px" }}
                          />
                        </td>
                        <td style={{ padding: "0.4rem" }}>
                          <select
                            className="form-control"
                            value={item.frequency}
                            onChange={(e) => handleTableEdit(idx, "frequency", e.target.value)}
                            style={{ fontSize: "0.82rem", padding: "0.3rem 0.5rem" }}
                          >
                            <option value="Once Daily">Once Daily</option>
                            <option value="Twice Daily">Twice Daily</option>
                            <option value="Three Times Daily">Three Times Daily</option>
                            <option value="Four Times Daily">Four Times Daily</option>
                            <option value="As Needed">As Needed</option>
                          </select>
                        </td>
                        <td style={{ padding: "0.4rem" }}>
                          <input
                            type="text"
                            className="form-control"
                            value={item.duration}
                            onChange={(e) => handleTableEdit(idx, "duration", e.target.value)}
                            style={{ fontSize: "0.82rem", padding: "0.3rem 0.5rem", width: "75px" }}
                          />
                        </td>
                        <td style={{ padding: "0.4rem", color: "#475569", fontWeight: 600 }}>
                          {item.matched_medicine || (item.is_matched ? item.name : "N/A")}
                        </td>
                        <td style={{ padding: "0.4rem" }}>
                          <span
                            style={{
                              padding: "0.2rem 0.5rem",
                              borderRadius: "10px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              background: item.status === "Auto-Corrected" ? "#DCFCE7" : (item.is_matched ? "#E0F2FE" : "#FEF3C7"),
                              color: item.status === "Auto-Corrected" ? "#15803D" : (item.is_matched ? "#0369A1" : "#B45309")
                            }}
                          >
                            {item.status || (item.is_matched ? "Matched" : "Needs Review")}
                          </span>
                        </td>
                        <td style={{ padding: "0.4rem" }}>
                          <span style={{ fontWeight: 800, color: item.confidence >= 80 ? "#166534" : "#D97706", fontSize: "0.8rem" }}>
                            {item.confidence || 90}%
                          </span>
                        </td>
                        <td style={{ padding: "0.4rem", textAlign: "center" }}>
                          <button
                            onClick={() => handleRemoveRow(idx)}
                            style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Raw OCR Collapsible */}
              <details style={{ background: "#F8FAFC", borderRadius: "10px", padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#64748B" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700, color: "#334155" }}>
                  View Raw Extracted OCR Text
                </summary>
                <pre style={{ margin: "0.5rem 0 0", whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "0.75rem" }}>
                  {rawOcrText}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.75rem",
            background: "#F8FAFC",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justify: "space-between",
            alignItems: "center"
          }}
        >
          {step === "review" ? (
            <button type="button" onClick={handleReset} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              Re-upload File
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              Cancel
            </button>

            {step === "upload" && (
              <button
                type="button"
                onClick={handleUploadAndExtract}
                disabled={!file}
                className="btn btn-primary"
                style={{ fontSize: "0.85rem" }}
              >
                <Sparkles size={16} style={{ marginRight: "0.4rem" }} /> Extract Prescription
              </button>
            )}

            {step === "review" && (
              <button
                type="button"
                onClick={handleSaveToMedicineList}
                className="btn btn-primary"
                style={{ fontSize: "0.85rem", background: "#10B981" }}
              >
                <Check size={16} style={{ marginRight: "0.4rem" }} /> Save to Medicine List
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUploadModal;
