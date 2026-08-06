import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { emergencyCardService } from "../services/api";
import { ShieldAlert, Printer, Heart, Phone, User, Stethoscope, Save, CheckCircle } from "lucide-react";

const EmergencyCard = ({ auth }) => {
  const [cardData, setCardData] = useState(null);
  const [form, setForm] = useState({
    blood_group: "",
    allergies: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: "",
    doctor_name: "",
    doctor_contact: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCard();
  }, []);

  const fetchCard = async () => {
    try {
      setIsLoading(true);
      const res = await emergencyCardService.getCard();
      setCardData(res);
      setForm({
        blood_group: res.blood_group || "O+",
        allergies: res.allergies || "",
        emergency_contact_name: res.emergency_contact_name || "",
        emergency_contact_phone: res.emergency_contact_phone || "",
        medical_conditions: res.medical_conditions || "",
        doctor_name: res.doctor_name || "",
        doctor_contact: res.doctor_contact || ""
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await emergencyCardService.updateCard(form);
      setMessage("Emergency Card updated successfully!");
      fetchCard();
    } catch (err) {
      setMessage("Failed to save emergency card.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-container" style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#F8FAFC" }}>
      <Sidebar role={auth?.role} email={auth?.email} />

      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
        <Navbar pageTitle="Emergency Medical Profile" />

        <main className="content-area" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
          {message && <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>{message}</div>}

          {/* Action Header */}
          <div
            className="page-section stagger-1 card"
            style={{
              padding: "1.5rem 2rem",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
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
              <ShieldAlert size={36} color="#FFFFFF" />
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Emergency Medical ID Card</h2>
                <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                  Instant emergency profile accessible for first responders and ER personnel
                </span>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ background: "#FFFFFF", color: "#991B1B", fontWeight: 800, fontSize: "0.85rem" }}
            >
              <Printer size={16} style={{ marginRight: "0.4rem" }} /> Print Emergency ID Badge
            </button>
          </div>

          <div className="grid grid-cols-2" style={{ gap: "2rem", alignItems: "start" }}>
            {/* Left: Printable ID Badge Preview */}
            <div className="page-section stagger-2">
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1E293B", marginBottom: "1rem" }}>
                Digital Card Preview
              </h3>

              <div
                id="printable-emergency-card"
                className="card"
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                  borderRadius: "20px",
                  border: "2px solid #E2E8F0",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
                  overflow: "hidden"
                }}
              >
                {/* ID Card Top Header */}
                <div style={{ background: "#DC2626", color: "#FFFFFF", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Heart size={20} fill="#FFFFFF" />
                    <span style={{ fontWeight: 900, letterSpacing: "0.05em", fontSize: "0.95rem" }}>PILLSYNC EMERGENCY MEDICAL ID</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.2)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontWeight: 700 }}>
                    BLOOD: {form.blood_group || "O+"}
                  </span>
                </div>

                {/* ID Card Body */}
                <div style={{ padding: "1.5rem" }}>
                  <h3 style={{ margin: "0 0 0.2rem", fontSize: "1.3rem", color: "#1E293B", fontWeight: 800 }}>
                    {cardData?.patient_name || "Patient Profile"}
                  </h3>
                  <span style={{ fontSize: "0.82rem", color: "#64748B", display: "block", marginBottom: "1.25rem" }}>
                    Primary Phone: {cardData?.phone || "N/A"}
                  </span>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                    <div style={{ background: "#FEF2F2", padding: "0.75rem", borderRadius: "10px", border: "1px solid #FEE2E2" }}>
                      <strong style={{ color: "#991B1B", display: "block", fontSize: "0.75rem", textTransform: "uppercase" }}>Known Allergies:</strong>
                      <span style={{ color: "#7F1D1D", fontWeight: 700 }}>{form.allergies || "None reported"}</span>
                    </div>

                    <div style={{ background: "#F0F9FF", padding: "0.75rem", borderRadius: "10px", border: "1px solid #E0F2FE" }}>
                      <strong style={{ color: "#0369A1", display: "block", fontSize: "0.75rem", textTransform: "uppercase" }}>Medical Conditions:</strong>
                      <span style={{ color: "#0C4A6E", fontWeight: 700 }}>{form.medical_conditions || "None reported"}</span>
                    </div>
                  </div>

                  {/* Active Medicines Summary */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <strong style={{ fontSize: "0.78rem", color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                      Current Active Prescriptions:
                    </strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {cardData?.current_medicines?.length > 0 ? (
                        cardData.current_medicines.map((m, idx) => (
                          <span key={idx} className="badge badge-primary" style={{ fontSize: "0.75rem" }}>
                            {m}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: "0.82rem", color: "#64748B" }}>No active prescriptions</span>
                      )}
                    </div>
                  </div>

                  {/* Contacts */}
                  <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.82rem" }}>
                    <div>
                      <span style={{ color: "#64748B", display: "block" }}>Emergency Contact:</span>
                      <strong style={{ color: "#1E293B" }}>{form.emergency_contact_name || "Caregiver"}</strong>
                      <div style={{ color: "#DC2626", fontWeight: 700 }}>{form.emergency_contact_phone || "911"}</div>
                    </div>

                    <div>
                      <span style={{ color: "#64748B", display: "block" }}>Attending Doctor:</span>
                      <strong style={{ color: "#1E293B" }}>{form.doctor_name || "Dr. Jenkins"}</strong>
                      <div style={{ color: "#2563EB", fontWeight: 700 }}>{form.doctor_contact || "N/A"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form Editor */}
            <div className="page-section stagger-3 card" style={{ padding: "1.75rem", borderRadius: "20px", background: "#FFFFFF" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1E293B", marginBottom: "1.25rem" }}>
                Update Emergency Medical Info
              </h3>

              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-control"
                    value={form.blood_group}
                    onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Known Drug/Food Allergies</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Penicillin, Sulfa, Peanuts"
                    value={form.allergies}
                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Medical Conditions</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                    value={form.medical_conditions}
                    onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="form-label">Emergency Contact Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.emergency_contact_name}
                      onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Emergency Contact Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.emergency_contact_phone}
                      onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="form-label">Attending Doctor Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.doctor_name}
                      onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Doctor Contact Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.doctor_contact}
                      onChange={(e) => setForm({ ...form, doctor_contact: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
                  <Save size={16} style={{ marginRight: "0.4rem" }} /> {isSaving ? "Saving..." : "Save Emergency Profile"}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmergencyCard;
