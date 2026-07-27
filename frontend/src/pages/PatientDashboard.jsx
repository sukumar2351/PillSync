import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Bell, Pill, Check, LogOut, ShieldAlert, Award, Calendar, RefreshCw, X, Edit, Trash, Activity, Users } from "lucide-react";
import { authService, medicineService } from "../services/api";

const PatientDashboard = ({ user, setAuth }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(user);
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

  // Form Fields
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medQuantity, setMedQuantity] = useState("");
  const [medFrequency, setMedFrequency] = useState("Daily");
  const [medFood, setMedFood] = useState("After Food");
  const [medStart, setMedStart] = useState("");
  const [medEnd, setMedEnd] = useState("");
  const [medNotes, setMedNotes] = useState("");

  // Dynamic reminders scheduling fields
  const [medTimesPerDay, setMedTimesPerDay] = useState("Once Daily");
  const [medReminderTimes, setMedReminderTimes] = useState(["08:00"]);

  // Snoozed reminders tracking (stored locally as key: timestamp)
  const [snoozedMap, setSnoozedMap] = useState({});

  const fetchData = async () => {
    try {
      const userRes = await authService.getCurrentUser();
      setUserData(userRes);

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
          const snoozeTime = snoozedMap[r.id];
          if (snoozeTime && now.getTime() < snoozeTime) {
            return;
          }

          new Notification("PillSync Reminder", {
            body: `Time to take ${r.name} (${r.dosage}) - ${r.time_of_day} (${r.food_relation})`,
            icon: "/favicon.ico"
          });
        }
      });
    }
  }, [reminders, snoozedMap]);

  // Handle Times per Day Selection change
  const handleTimesPerDayChange = (val) => {
    setMedTimesPerDay(val);
    let newTimes = [];
    if (val === "Once Daily") {
      newTimes = ["08:00"];
    } else if (val === "Twice Daily") {
      newTimes = ["08:00", "20:00"];
    } else if (val === "Three Times Daily") {
      newTimes = ["08:00", "14:00", "20:00"];
    } else if (val === "Four Times Daily") {
      newTimes = ["08:00", "12:00", "16:00", "20:00"];
    } else if (val === "Five Times Daily") {
      newTimes = ["08:00", "11:00", "14:00", "17:00", "20:00"];
    } else if (val === "Six Times Daily") {
      newTimes = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
    } else {
      newTimes = medReminderTimes.length > 0 ? medReminderTimes : ["08:00"];
    }
    setMedReminderTimes(newTimes);
  };

  const handleAddTimeInput = () => {
    setMedReminderTimes([...medReminderTimes, "08:00"]);
  };

  const handleRemoveTimeInput = (index) => {
    if (medReminderTimes.length <= 1) return;
    const newTimes = medReminderTimes.filter((_, idx) => idx !== index);
    setMedReminderTimes(newTimes);
  };

  const handleTimeChange = (index, value) => {
    const newTimes = [...medReminderTimes];
    newTimes[index] = value;
    setMedReminderTimes(newTimes);
  };

  const validateReminderTimes = () => {
    if (medReminderTimes.some(t => !t)) {
      alert("Please ensure all reminder times are valid.");
      return false;
    }
    const uniqueTimes = new Set(medReminderTimes);
    if (uniqueTimes.size !== medReminderTimes.length) {
      alert("Duplicate reminder times are not allowed. Each reminder time must be unique.");
      return false;
    }
    return true;
  };

  // Handle Add Medicine
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!validateReminderTimes()) return;

    try {
      const payload = {
        name: medName,
        dosage: medDosage,
        quantity: parseInt(medQuantity, 10),
        frequency: medFrequency,
        food_relation: medFood,
        start_date: medStart,
        end_date: medEnd,
        notes: medNotes || null,
        reminder_times: medReminderTimes
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
    setMedFood(med.food_relation);
    setMedStart(med.start_date);
    setMedEnd(med.end_date);
    setMedNotes(med.notes || "");

    const times = med.reminder_schedules ? med.reminder_schedules.map(s => s.scheduled_time) : [];
    setMedReminderTimes(times);

    // Map saved times count to category selection list
    if (times.length === 1 && times[0] === "08:00") {
      setMedTimesPerDay("Once Daily");
    } else if (times.length === 2 && JSON.stringify(times) === JSON.stringify(["08:00", "20:00"])) {
      setMedTimesPerDay("Twice Daily");
    } else if (times.length === 3 && JSON.stringify(times) === JSON.stringify(["08:00", "14:00", "20:00"])) {
      setMedTimesPerDay("Three Times Daily");
    } else if (times.length === 4 && JSON.stringify(times) === JSON.stringify(["08:00", "12:00", "16:00", "20:00"])) {
      setMedTimesPerDay("Four Times Daily");
    } else if (times.length === 5 && JSON.stringify(times) === JSON.stringify(["08:00", "11:00", "14:00", "17:00", "20:00"])) {
      setMedTimesPerDay("Five Times Daily");
    } else if (times.length === 6 && JSON.stringify(times) === JSON.stringify(["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"])) {
      setMedTimesPerDay("Six Times Daily");
    } else {
      setMedTimesPerDay("Custom");
    }

    setShowEditModal(true);
  };

  // Handle Update Medicine
  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    if (!validateReminderTimes()) return;

    try {
      const payload = {
        name: medName,
        dosage: medDosage,
        quantity: parseInt(medQuantity, 10),
        frequency: medFrequency,
        food_relation: medFood,
        start_date: medStart,
        end_date: medEnd,
        notes: medNotes || null,
        reminder_times: medReminderTimes
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

  // Handle Log Dose Action
  const handleLogDose = async (reminderId, statusType, timeLabel) => {
    try {
      await medicineService.logMedicationDose({
        reminder_schedule_id: reminderId,
        status: statusType,
        time_of_day: timeLabel
      });
      setSuccessMsg(`Medication dose marked as ${statusType}!`);
      fetchData();
    } catch (err) {
      alert("Failed to record medication status logs.");
    }
  };

  // Handle Snooze Dose Action
  const handleSnooze = (reminderId) => {
    const minutes = 5;
    const snoozeTime = new Date().getTime() + minutes * 60 * 1000;
    setSnoozedMap((prev) => ({
      ...prev,
      [reminderId]: snoozeTime
    }));
    alert(`Reminder snoozed for ${minutes} minutes.`);
  };

  const resetForm = () => {
    setMedName("");
    setMedDosage("");
    setMedQuantity("");
    setMedFrequency("Daily");
    setMedFood("After Food");
    setMedStart("");
    setMedEnd("");
    setMedNotes("");
    setMedTimesPerDay("Once Daily");
    setMedReminderTimes(["08:00"]);
    setEditingMed(null);
  };

  const handleLogout = () => {
    authService.logout();
    setAuth({ token: null, role: null, email: null });
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: "100vh", background: "var(--bg-base)", flexDirection: "column", gap: "1rem" }}>
        <div className="spinner" style={{ width: "32px", height: "32px", borderTopColor: "var(--primary)" }} />
        <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Powering up PillSync...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Sidebar container */}
      <div style={{ width: "260px", background: "var(--bg-card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
            <Activity size={24} color="var(--primary)" />
            <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-main)" }}>PillSync Dashboard</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <Link to="/patient-dashboard" className="sidebar-link active" style={{ textDecoration: "none", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "8px" }}>
              <Pill size={18} />
              <span>Medicines List</span>
            </Link>
            <Link to="/profile" className="sidebar-link" style={{ textDecoration: "none", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "8px" }}>
              <Users size={18} />
              <span>My Profile</span>
            </Link>
            <Link to="/notifications" className="sidebar-link" style={{ textDecoration: "none", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "8px" }}>
              <Bell size={18} />
              <span>Preferences</span>
            </Link>
          </div>
        </div>

        <button onClick={handleLogout} className="btn btn-secondary flex-center" style={{ gap: "0.5rem", color: "var(--error-color)", borderColor: "var(--border)" }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", height: "100vh" }}>
        
        {/* Top Navbar */}
        <header style={{ height: "64px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", background: "var(--bg-card)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Welcome Back, {userData?.profile?.full_name || "Patient"}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="badge badge-secondary" style={{ textTransform: "capitalize" }}>{userData?.role} Account</span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {successMsg && (
            <div className="alert alert-success" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}><X size={16} /></button>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-danger" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}><X size={16} /></button>
            </div>
          )}

          {/* Compliance Stats Cards */}
          <div className="grid grid-cols-4" style={{ gap: "1.5rem" }}>
            <div className="card" style={{ padding: "1.25rem", borderRadius: "12px", borderLeft: "4px solid var(--primary)" }}>
              <span style={{ color: "var(--text-light)", fontSize: "0.75rem", display: "block" }}>Compliance Rate</span>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.25rem 0" }}>{historyStats?.adherence_rate || 0}%</h3>
              <span style={{ fontSize: "0.7rem", color: "var(--text-light)" }}>Target goal is 95%+</span>
            </div>
            <div className="card" style={{ padding: "1.25rem", borderRadius: "12px", borderLeft: "4px solid var(--success-color)" }}>
              <span style={{ color: "var(--text-light)", fontSize: "0.75rem", display: "block" }}>Doses Logged</span>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.25rem 0" }}>{historyStats?.total_taken || 0}</h3>
              <span style={{ fontSize: "0.7rem", color: "var(--text-light)" }}>All historical intakes</span>
            </div>
            <div className="card" style={{ padding: "1.25rem", borderRadius: "12px", borderLeft: "4px solid var(--error-color)" }}>
              <span style={{ color: "var(--text-light)", fontSize: "0.75rem", display: "block" }}>Missed Doses</span>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.25rem 0" }}>{historyStats?.total_missed || 0}</h3>
              <span style={{ fontSize: "0.7rem", color: "var(--text-light)" }}>Log missed alerts</span>
            </div>
            <div className="card" style={{ padding: "1.25rem", borderRadius: "12px", borderLeft: "4px solid var(--accent)" }}>
              <span style={{ color: "var(--text-light)", fontSize: "0.75rem", display: "block" }}>Active Medicines</span>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.25rem 0" }}>{medicines.length}</h3>
              <span style={{ fontSize: "0.7rem", color: "var(--text-light)" }}>Currently tracking</span>
            </div>
          </div>

          {/* Today's Checklist Schedule Module */}
          <div className="card" style={{ padding: "1.5rem", borderRadius: "16px" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: "800" }}>Today's Medicine Checklist</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reminders.map((r) => (
                <div key={r.id} className="flex-center" style={{ justifyContent: "space-between", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                      <Pill size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem" }}>{r.name}</h4>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "flex", gap: "1rem" }}>
                        <span>Dosage: <strong>{r.dosage}</strong></span>
                        <span>Time: <strong>{r.time_of_day} ({r.scheduled_time})</strong></span>
                        <span>Food: <strong>{r.food_relation}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {r.status === "Pending" ? (
                      <>
                        <button onClick={() => handleLogDose(r.id, "Taken", r.time_of_day)} className="btn btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Check size={14} /> Mark Taken
                        </button>
                        <button onClick={() => handleLogDose(r.id, "Missed", r.time_of_day)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "var(--error-color)" }}>
                          Missed
                        </button>
                        <button onClick={() => handleSnooze(r.id)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                          Snooze
                        </button>
                      </>
                    ) : (
                      <span className={`badge ${r.status === "Taken" ? "badge-success" : "badge-secondary"}`} style={{ padding: "0.5rem 1rem", borderRadius: "20px" }}>
                        {r.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {reminders.length === 0 && (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-light)" }}>
                  <Calendar size={36} style={{ opacity: 0.5, marginBottom: "0.5rem" }} />
                  <p>All clear! No pending reminders schedules for today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Medicines database management */}
          <div className="card" style={{ padding: "1.5rem", borderRadius: "16px" }}>
            <div className="flex-center" style={{ justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800" }}>Active Medications</h3>
              <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Plus size={16} /> Add Medicine
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Dosage</th>
                    <th>Remaining Quantity</th>
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
                          {med.reminder_schedules?.map(s => (
                            <span key={s.id} className="badge badge-primary" style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                              {s.scheduled_time}
                            </span>
                          ))}
                          {(!med.reminder_schedules || med.reminder_schedules.length === 0) && <span style={{ color: "var(--text-light)" }}>—</span>}
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
                      <td colSpan="7" style={{ textAlign: "center", padding: "3rem", color: "var(--text-light)" }}>No medications tracked yet. Add your first medicine to get started!</td>
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

              {/* Dynamic Reminder Times section */}
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Times Per Day</label>
                <select className="form-input" value={medTimesPerDay} onChange={(e) => handleTimesPerDayChange(e.target.value)}>
                  <option value="Once Daily">Once Daily</option>
                  <option value="Twice Daily">Twice Daily</option>
                  <option value="Three Times Daily">Three Times Daily</option>
                  <option value="Four Times Daily">Four Times Daily</option>
                  <option value="Five Times Daily">Five Times Daily</option>
                  <option value="Six Times Daily">Six Times Daily</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Reminder Times</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {medReminderTimes.map((t, index) => (
                    <div key={index} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-light)", width: "60px" }}>Time {index + 1}:</span>
                      <input
                        type="time"
                        className="form-input"
                        required
                        value={t}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {medTimesPerDay === "Custom" && medReminderTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeInput(index)}
                          style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justify: "center" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {medTimesPerDay === "Custom" && (
                    <button
                      type="button"
                      onClick={handleAddTimeInput}
                      className="btn btn-secondary"
                      style={{ padding: "0.4rem", fontSize: "0.8rem", marginTop: "0.25rem" }}
                    >
                      + Add Reminder Time
                    </button>
                  )}
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

              {/* Dynamic Reminder Times section (Edit) */}
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Times Per Day</label>
                <select className="form-input" value={medTimesPerDay} onChange={(e) => handleTimesPerDayChange(e.target.value)}>
                  <option value="Once Daily">Once Daily</option>
                  <option value="Twice Daily">Twice Daily</option>
                  <option value="Three Times Daily">Three Times Daily</option>
                  <option value="Four Times Daily">Four Times Daily</option>
                  <option value="Five Times Daily">Five Times Daily</option>
                  <option value="Six Times Daily">Six Times Daily</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Reminder Times</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {medReminderTimes.map((t, index) => (
                    <div key={index} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-light)", width: "60px" }}>Time {index + 1}:</span>
                      <input
                        type="time"
                        className="form-input"
                        required
                        value={t}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {medTimesPerDay === "Custom" && medReminderTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeInput(index)}
                          style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justify: "center" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {medTimesPerDay === "Custom" && (
                    <button
                      type="button"
                      onClick={handleAddTimeInput}
                      className="btn btn-secondary"
                      style={{ padding: "0.4rem", fontSize: "0.8rem", marginTop: "0.25rem" }}
                    >
                      + Add Reminder Time
                    </button>
                  )}
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
    </div>
  );
};

export default PatientDashboard;
