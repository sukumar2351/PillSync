import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authService, medicineService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const PatientDashboard = ({ auth }) => {
  const [userData, setUserData] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [historyStats, setHistoryStats] = useState(null);
  const [notifSettings, setNotifSettings] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals Toggles
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [showM3Modal, setShowM3Modal] = useState(false);

  // Form Fields
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medQuantity, setMedQuantity] = useState("");
  const [medFrequency, setMedFrequency] = useState("Daily");
  const [medMorning, setMedMorning] = useState(false);
  const [medAfternoon, setMedAfternoon] = useState(false);
  const [medNight, setMedNight] = useState(false);
  const [medFood, setMedFood] = useState("After Food");
  const [medStart, setMedStart] = useState("");
  const [medEnd, setMedEnd] = useState("");
  const [medNotes, setMedNotes] = useState("");

  // Snoozed reminders tracking (stored locally as key: timestamp)
  const [snoozedMap, setSnoozedMap] = useState({});

  const fetchData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setUserData(user);

      const meds = await medicineService.getMedicines();
      setMedicines(meds);

      const rems = await medicineService.getRemindersToday();
      setReminders(rems);

      const stats = await medicineService.getAdherenceHistory();
      setHistoryStats(stats);

      const notifs = await medicineService.getNotificationSettings();
      setNotifSettings(notifs);
    } catch (err) {
      setErrorMsg("Failed to load patient dashboard modules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Request Notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Set up periodic reminders refresh interval (every 15 seconds)
    const interval = setInterval(async () => {
      try {
        const rems = await medicineService.getRemindersToday();
        setReminders(rems);
      } catch (err) {
        console.error("Failed to fetch reminders:", err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Browser Notification Trigger Helper
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      const now = new Date();
      reminders.forEach((r) => {
        if (r.status === "Pending") {
          // Check if it is snoozed
          const snoozeTime = snoozedMap[r.id];
          if (snoozeTime && now.getTime() < snoozeTime) {
            return; // Still snoozed
          }

          // Trigger notification
          const notif = new Notification("PillSync Reminder", {
            body: `Time to take ${r.name} (${r.dosage}) - ${r.time_of_day} (${r.food_relation})`,
            icon: "/favicon.ico"
          });
        }
      });
    }
  }, [reminders, snoozedMap]);

  // Handle Add Medicine
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!medMorning && !medAfternoon && !medNight) {
      alert("Please select at least one dosage time (Morning, Afternoon, or Night).");
      return;
    }

    try {
      const payload = {
        name: medName,
        dosage: medDosage,
        quantity: parseInt(medQuantity, 10),
        frequency: medFrequency,
        morning: medMorning,
        afternoon: medAfternoon,
        night: medNight,
        food_relation: medFood,
        start_date: medStart,
        end_date: medEnd,
        notes: medNotes || null
      };

      await medicineService.addMedicine(payload);
      setSuccessMsg("Medicine added successfully!");
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add medicine.");
    }
  };

  // Open Edit Modal
  const openEditModal = (med) => {
    setEditingMed(med);
    setMedName(med.name);
    setMedDosage(med.dosage);
    setMedQuantity(String(med.quantity));
    setMedFrequency(med.frequency);
    setMedMorning(med.morning);
    setMedAfternoon(med.afternoon);
    setMedNight(med.night);
    setMedFood(med.food_relation);
    setMedStart(med.start_date);
    setMedEnd(med.end_date);
    setMedNotes(med.notes || "");
    setShowEditModal(true);
  };

  // Handle Update Medicine
  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    if (!medMorning && !medAfternoon && !medNight) {
      alert("Please select at least one dosage time.");
      return;
    }

    try {
      const payload = {
        name: medName,
        dosage: medDosage,
        quantity: parseInt(medQuantity, 10),
        frequency: medFrequency,
        morning: medMorning,
        afternoon: medAfternoon,
        night: medNight,
        food_relation: medFood,
        start_date: medStart,
        end_date: medEnd,
        notes: medNotes || null
      };

      await medicineService.updateMedicine(editingMed.id, payload);
      setSuccessMsg("Medicine updated successfully!");
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update medicine.");
    }
  };

  // Handle Delete Medicine
  const handleDeleteMedicine = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine? All related schedules will be lost.")) {
      return;
    }

    try {
      await medicineService.deleteMedicine(id);
      setSuccessMsg("Medicine deleted successfully.");
      fetchData();
    } catch (err) {
      alert("Failed to delete medicine.");
    }
  };

  // Log Reminder status (Taken / Missed / Snooze)
  const handleLogReminder = async (medId, timeOfDay, status, reminderId) => {
    if (status === "Snoozed") {
      // Snooze locally for 5 minutes (300,000 ms)
      const now = new Date();
      const snoozeUntil = now.getTime() + 5 * 60 * 1000;
      setSnoozedMap((prev) => ({
        ...prev,
        [reminderId]: snoozeUntil
      }));
      alert(`Reminder for ${timeOfDay} has been snoozed for 5 minutes.`);
      return;
    }

    try {
      const payload = {
        status: status,
        time_of_day: timeOfDay,
        scheduled_date: new Date().toISOString().split("T")[0]
      };
      await medicineService.logReminder(medId, payload);
      setSuccessMsg(`Medication marked as ${status}.`);
      fetchData();
    } catch (err) {
      alert("Failed to log status.");
    }
  };

  const resetForm = () => {
    setMedName("");
    setMedDosage("");
    setMedQuantity("");
    setMedFrequency("Daily");
    setMedMorning(false);
    setMedAfternoon(false);
    setMedNight(false);
    setMedFood("After Food");
    setMedStart("");
    setMedEnd("");
    setMedNotes("");
    setEditingMed(null);
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <Sidebar role={auth.role} email={auth.email} />
        <div className="main-content flex-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const profile = userData?.profile || {};
  const activeReminders = reminders.filter(r => r.status === "Pending");
  
  // Resolve upcoming reminders (still pending or next due intervals)
  const upcomingReminders = reminders.filter(r => {
    // Basic simulation: show all pending that are not Morning if current time is past 10am, etc.
    // For simplicity, display all due reminders that are not logged as Taken/Missed yet.
    return r.status === "Pending";
  });

  return (
    <div className="app-container">
      <Sidebar role={auth.role} email={auth.email} />
      <div className="main-content">
        <Navbar pageTitle="Patient Dashboard" />
        
        <main className="content-area">
          {successMsg && (
            <div className="alert alert-success" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg("")} className="btn-close" style={{ background: "none", border: "none", color: "var(--primary-color)", fontWeight: "bold", cursor: "pointer" }}>×</button>
            </div>
          )}
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

          {/* Welcome Panel */}
          <div className="welcome-banner card">
            <h2>Welcome back, {profile.full_name || "Patient"}!</h2>
            <p>Monitor your active reminder notifications, SMS updates, and manage your medicine schedule efficiently.</p>
          </div>

          {/* Adherence Stats Metrics & SMS configurations */}
          <div className="grid grid-cols-4 stats-grid" style={{ marginBottom: "2rem" }}>
            {historyStats && (
              <>
                <div className="card stat-card" style={{ borderLeft: "4px solid var(--primary-color)" }}>
                  <span className="stat-label">Adherence Rate</span>
                  <h3 className="stat-val" style={{ color: "var(--primary-color)", fontSize: "1.75rem", fontWeight: "bold" }}>
                    {historyStats.adherence_rate}%
                  </h3>
                </div>
                <div className="card stat-card" style={{ borderLeft: "4px solid #10b981" }}>
                  <span className="stat-label">Doses Logged</span>
                  <h3 className="stat-val" style={{ color: "#10b981", fontSize: "1.75rem", fontWeight: "bold" }}>
                    {historyStats.taken_count} / {historyStats.total_scheduled}
                  </h3>
                </div>
              </>
            )}
            
            {/* SMS Status Panel */}
            <div className="card stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
              <span className="stat-label">SMS Status</span>
              <h3 className="stat-val" style={{ color: "#3b82f6", fontSize: "1.25rem", fontWeight: "bold" }}>
                {notifSettings?.sms_enabled ? "✓ Enabled" : "✗ Disabled"}
              </h3>
              <small style={{ color: "var(--text-light)" }}>Preference: {notifSettings?.notification_preference}</small>
            </div>

            {/* Notification Status Panel */}
            <div className="card stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
              <span className="stat-label">Delivery Endpoint</span>
              <h3 className="stat-val" style={{ color: "#f59e0b", fontSize: "1rem", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {notifSettings?.phone || "No phone set"}
              </h3>
              <small style={{ color: "var(--text-light)" }}>Twilio status: {notifSettings?.delivery_status || "Pending"}</small>
            </div>
          </div>

          {/* Milestone 3 Sidebar Placeholders & Reminders */}
          <div className="grid grid-cols-3">
            {/* Active Reminder Panel */}
            <div className="card col-span-1 reminders-panel" style={{ background: "#fef3c7", borderColor: "#fde68a" }}>
              <h3 className="card-title" style={{ color: "#b45309" }}>Due Reminders Today</h3>
              <div className="reminder-list">
                {activeReminders.map((rem) => (
                  <div key={rem.id} className="reminder-item card" style={{ background: "#ffffff", padding: "1rem", marginBottom: "1rem" }}>
                    <div style={{ fontWeight: "bold", fontSize: "1rem", color: "var(--text-primary)" }}>{rem.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      Dosage: {rem.dosage} | {rem.time_of_day} ({rem.scheduled_time})
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-light)", marginBottom: "0.5rem" }}>
                      Instruction: {rem.food_relation}
                    </div>
                    <div className="reminder-actions" style={{ display: "flex", gap: "0.5rem" }}>
                      <button 
                        onClick={() => handleLogReminder(rem.medicine_id, rem.time_of_day, "Taken", rem.id)}
                        className="btn btn-primary" 
                        style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem", background: "#10b981", borderColor: "#10b981" }}
                      >
                        Taken
                      </button>
                      <button 
                        onClick={() => handleLogReminder(rem.medicine_id, rem.time_of_day, "Missed", rem.id)}
                        className="btn btn-secondary" 
                        style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem", background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
                      >
                        Missed
                      </button>
                      <button 
                        onClick={() => handleLogReminder(rem.medicine_id, rem.time_of_day, "Snoozed", rem.id)}
                        className="btn" 
                        style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem", background: "#f59e0b", border: "1px solid #f59e0b", color: "#fff" }}
                      >
                        Snooze
                      </button>
                    </div>
                  </div>
                ))}
                {activeReminders.length === 0 && (
                  <p style={{ textAlign: "center", color: "#b45309", fontSize: "0.9rem" }}>No active reminders pending for today.</p>
                )}
              </div>

              {/* Upcoming Medicines Block */}
              <h4 style={{ color: "#b45309", marginTop: "1.5rem", marginBottom: "0.75rem", fontSize: "0.95rem", fontWeight: "bold" }}>Upcoming Medicines Today</h4>
              <ul style={{ paddingLeft: "1.2rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {upcomingReminders.slice(0, 3).map((rem) => (
                  <li key={rem.id} style={{ marginBottom: "0.4rem" }}>
                    <strong>{rem.name}</strong> - {rem.time_of_day} at {rem.scheduled_time}
                  </li>
                ))}
                {upcomingReminders.length === 0 && <li>No upcoming scheduled doses remaining today.</li>}
              </ul>
            </div>

            {/* My Medicines List Panel */}
            <div className="card col-span-2">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 className="card-title">My Medicines Directory</h3>
                <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn btn-primary">
                  + Add Medicine
                </button>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Dosage</th>
                      <th>Quantity</th>
                      <th>Schedules</th>
                      <th>Instruction</th>
                      <th>Start / End Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((med) => (
                      <tr key={med.id}>
                        <td><strong>{med.name}</strong></td>
                        <td>{med.dosage}</td>
                        <td>{med.quantity} left</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap" }}>
                            {med.morning && <span className="badge badge-primary" style={{ fontSize: "0.7rem" }}>Morn</span>}
                            {med.afternoon && <span className="badge badge-secondary" style={{ fontSize: "0.7rem" }}>Aft</span>}
                            {med.night && <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>Night</span>}
                          </div>
                        </td>
                        <td>{med.food_relation}</td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                          {med.start_date} to {med.end_date}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button onClick={() => openEditModal(med)} className="btn btn-secondary" style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}>Edit</button>
                            <button onClick={() => handleDeleteMedicine(med.id)} className="btn btn-danger" style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem", background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {medicines.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--text-light)" }}>No medicines configured. Click "+ Add Medicine" to start.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Milestone 3 Features Section */}
          <div className="card" style={{ marginTop: "2rem", background: "#f8fafc" }}>
            <h3 className="card-title">AI & Smart Features (Upcoming in Milestone 3)</h3>
            <p style={{ color: "var(--text-light)", fontSize: "0.875rem", marginBottom: "1rem" }}>Expand your PillSync capabilities with our planned AI modules. Click on any block to view descriptions.</p>
            
            <div className="grid grid-cols-4" style={{ gap: "1rem" }}>
              <div 
                className="card" 
                onClick={() => setShowM3Modal(true)}
                style={{ cursor: "pointer", border: "1px dashed var(--border-color)", padding: "1rem", textAlign: "center", opacity: 0.7 }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📷</div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "bold" }}>Prescription Scanner</h4>
                <span className="badge badge-secondary" style={{ fontSize: "0.7rem", marginTop: "0.5rem" }}>Coming in Milestone 3</span>
              </div>

              <div 
                className="card" 
                onClick={() => setShowM3Modal(true)}
                style={{ cursor: "pointer", border: "1px dashed var(--border-color)", padding: "1rem", textAlign: "center", opacity: 0.7 }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🧠</div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "bold" }}>AI Refill Prediction</h4>
                <span className="badge badge-secondary" style={{ fontSize: "0.7rem", marginTop: "0.5rem" }}>Coming in Milestone 3</span>
              </div>

              <div 
                className="card" 
                onClick={() => setShowM3Modal(true)}
                style={{ cursor: "pointer", border: "1px dashed var(--border-color)", padding: "1rem", textAlign: "center", opacity: 0.7 }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🤖</div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "bold" }}>OpenAI GPT Assistant</h4>
                <span className="badge badge-secondary" style={{ fontSize: "0.7rem", marginTop: "0.5rem" }}>Coming in Milestone 3</span>
              </div>

              <div 
                className="card" 
                onClick={() => setShowM3Modal(true)}
                style={{ cursor: "pointer", border: "1px dashed var(--border-color)", padding: "1rem", textAlign: "center", opacity: 0.7 }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔬</div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "bold" }}>Smart AI Adherence</h4>
                <span className="badge badge-secondary" style={{ fontSize: "0.7rem", marginTop: "0.5rem" }}>Coming in Milestone 3</span>
              </div>
            </div>
          </div>

          {/* Adherence History logs list */}
          <div className="card" style={{ marginTop: "2rem" }}>
            <h3 className="card-title">Medication Logs History</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Medicine Name</th>
                    <th>Dosage</th>
                    <th>Schedule</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th>Log Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {historyStats?.history?.slice(0, 10).map((log) => (
                    <tr key={log.id}>
                      <td>#{log.id}</td>
                      <td><strong>{log.medicine_name}</strong></td>
                      <td>{log.dosage}</td>
                      <td>{log.time_of_day}</td>
                      <td>{log.scheduled_date}</td>
                      <td>
                        <span className={`badge ${log.status === "Taken" ? "badge-success" : log.status === "Missed" ? "badge-danger" : "badge-secondary"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>{new Date(log.action_time).toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!historyStats?.history || historyStats.history.length === 0) && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-light)" }}>No history logs recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="modal-backdrop flex-center" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000 }}>
          <div className="card modal-content" style={{ width: "500px", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 className="card-title" style={{ marginBottom: "1rem" }}>Add New Medicine</h3>
            <form onSubmit={handleAddMedicine}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Medicine Name</label>
                <input type="text" className="form-input" required value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="e.g. Paracetamol" />
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Dosage</label>
                <input type="text" className="form-input" required value={medDosage} onChange={(e) => setMedDosage(e.target.value)} placeholder="e.g. 500mg or 1 tablet" />
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Quantity</label>
                <input type="number" className="form-input" required value={medQuantity} onChange={(e) => setMedQuantity(e.target.value)} placeholder="e.g. 30" min="1" />
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Frequency</label>
                <input type="text" className="form-input" required value={medFrequency} onChange={(e) => setMedFrequency(e.target.value)} placeholder="e.g. Daily or Every 12 Hours" />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Reminders Scheduling (Select times)</label>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                  <label><input type="checkbox" checked={medMorning} onChange={(e) => setMedMorning(e.target.checked)} /> Morning (08:00)</label>
                  <label><input type="checkbox" checked={medAfternoon} onChange={(e) => setMedAfternoon(e.target.checked)} /> Afternoon (14:00)</label>
                  <label><input type="checkbox" checked={medNight} onChange={(e) => setMedNight(e.target.checked)} /> Night (20:00)</label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Food Relationship</label>
                <select className="form-input" value={medFood} onChange={(e) => setMedFood(e.target.value)}>
                  <option value="After Food">After Food</option>
                  <option value="Before Food">Before Food</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" required value={medStart} onChange={(e) => setMedStart(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" required value={medEnd} onChange={(e) => setMedEnd(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Notes (Optional)</label>
                <textarea className="form-input" value={medNotes} onChange={(e) => setMedNotes(e.target.value)} placeholder="Take with warm water, avoid milk..." rows="2" />
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {showEditModal && (
        <div className="modal-backdrop flex-center" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000 }}>
          <div className="card modal-content" style={{ width: "500px", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 className="card-title" style={{ marginBottom: "1rem" }}>Edit Medicine Details</h3>
            <form onSubmit={handleUpdateMedicine}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Medicine Name</label>
                <input type="text" className="form-input" required value={medName} onChange={(e) => setMedName(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Dosage</label>
                <input type="text" className="form-input" required value={medDosage} onChange={(e) => setMedDosage(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Quantity</label>
                <input type="number" className="form-input" required value={medQuantity} onChange={(e) => setMedQuantity(e.target.value)} min="1" />
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Frequency</label>
                <input type="text" className="form-input" required value={medFrequency} onChange={(e) => setMedFrequency(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Reminders Scheduling (Select times)</label>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                  <label><input type="checkbox" checked={medMorning} onChange={(e) => setMedMorning(e.target.checked)} /> Morning (08:00)</label>
                  <label><input type="checkbox" checked={medAfternoon} onChange={(e) => setMedAfternoon(e.target.checked)} /> Afternoon (14:00)</label>
                  <label><input type="checkbox" checked={medNight} onChange={(e) => setMedNight(e.target.checked)} /> Night (20:00)</label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Food Relationship</label>
                <select className="form-input" value={medFood} onChange={(e) => setMedFood(e.target.value)}>
                  <option value="After Food">After Food</option>
                  <option value="Before Food">Before Food</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" required value={medStart} onChange={(e) => setMedStart(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" required value={medEnd} onChange={(e) => setMedEnd(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Notes (Optional)</label>
                <textarea className="form-input" value={medNotes} onChange={(e) => setMedNotes(e.target.value)} rows="2" />
              </div>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone 3 Professional Modal */}
      {showM3Modal && (
        <div className="modal-backdrop flex-center" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000 }}>
          <div className="card modal-content" style={{ width: "500px", padding: "2rem", borderRadius: "12px", border: "1px solid #bfdbfe", background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary-color)" }}>
                <span>✨</span> Feature Not Available Yet
              </h3>
              <button onClick={() => setShowM3Modal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-light)" }}>&times;</button>
            </div>
            
            <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-primary)", marginBottom: "1.25rem" }}>
              This feature is planned for <strong>Milestone 3</strong>. It will be available after the completion and mentor approval of Milestone 2.
            </p>

            <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
              <strong style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--text-primary)" }}>Upcoming Features:</strong>
              <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <li>• OCR Prescription Scanner</li>
                <li>• OCR Medicine Recognition</li>
                <li>• AI Refill Prediction</li>
                <li>• Disease Analysis</li>
                <li>• OpenAI Assistant</li>
                <li>• Medicine Image Recognition</li>
                <li>• Refill Analytics</li>
                <li>• Smart AI Recommendations</li>
              </ul>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowM3Modal(false)} className="btn btn-primary">Understood</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
