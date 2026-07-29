import React from "react";
import { AlertTriangle, ShieldAlert, Check, X } from "lucide-react";

const DrugInteractionModal = ({ interactions, onConfirm, onCancel }) => {
  if (!interactions || interactions.length === 0) return null;

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
          maxWidth: "520px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid #E2E8F0"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            background: "linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 100%)",
            borderBottom: "1px solid #FEE2E2",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#DC2626"
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#991B1B" }}>
              Drug Interaction Warning Detected
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#B91C1C" }}>
              Potential adverse interaction with existing active prescriptions
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: "1.5rem", maxHeight: "350px", overflowY: "auto" }}>
          {interactions.map((item, idx) => {
            const isHigh = item.severity === "High";
            return (
              <div
                key={idx}
                style={{
                  background: isHigh ? "#FEF2F2" : "#FFFBEB",
                  borderRadius: "14px",
                  padding: "1rem 1.25rem",
                  border: `1px solid ${isHigh ? "#FECACA" : "#FDE68A"}`,
                  marginBottom: "1rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <strong style={{ fontSize: "0.95rem", color: isHigh ? "#991B1B" : "#92400E" }}>
                    {item.medicine_a} ↔ {item.medicine_b}
                  </strong>
                  <span
                    style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "12px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      background: isHigh ? "#DC2626" : "#D97706",
                      color: "#FFFFFF",
                      textTransform: "uppercase"
                    }}
                  >
                    {item.severity} Severity
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.84rem", color: isHigh ? "#7F1D1D" : "#78350F", lineHeight: 1.45 }}>
                  {item.description}
                </p>
              </div>
            );
          })}

          <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748B", fontStyle: "italic" }}>
            * Note: Always consult your prescribing physician before combining interactive medications.
          </p>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "#F8FAFC",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justify: "flex-end",
            gap: "0.75rem"
          }}
        >
          <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
            <X size={16} style={{ marginRight: "0.3rem" }} /> Cancel & Change Medicine
          </button>
          <button type="button" onClick={onConfirm} className="btn btn-primary" style={{ fontSize: "0.85rem", background: "#DC2626" }}>
            <Check size={16} style={{ marginRight: "0.3rem" }} /> Acknowledge & Save Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrugInteractionModal;
