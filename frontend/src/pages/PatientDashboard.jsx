import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Bell, Pill, Check, LogOut, ShieldAlert, Award, Calendar, RefreshCw, X, Edit, Trash, Activity, Users, Eye } from "lucide-react";
import { authService, medicineService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const PatientDashboard = ({ auth, setAuth }) => {
  const navigate = useNavigate();
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

  if (isLoading) {
    return (
      <div className="app-container" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar role={auth?.role} email={auth?.email} />
        <div className="main-content flex-center" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const profile = userData?.profile || {};

  // Split reminders into different compliance categories
  const completedReminders = reminders.filter(r => r.status === "Taken");
  const missedReminders = reminders.filter(r => r.status === "Missed");
  const pendingReminders = reminders.filter(r => r.status === "Pending");

  return (
    <div className="app-container" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar role={auth?.role} email={auth?.email} />

      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
        <Navbar pageTitle="Patient Dashboard" />

        <main className="content-area" style={{ padding: "2rem" }}>
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          {/* Welcome Banner Card */}
          <div className="welcome-banner card" style={{ borderLeft: "4px solid var(--primary-color)", marginBottom: "2rem" }}>
            <h2>Welcome back, {profile.full_name || "Patient"}!</h2>
            <p>You are logged into your Patient Dashboard. Manage your medicines, reminders, medication history and health records from here.</p>
          </div>

          {/* Two-Column Profile Grid */}
          <div className="grid grid-cols-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
            {/* Card 1: Patient Profile */}
            <div className="card">
              <h3 className="card-title">Patient Profile</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-val">{profile.full_name || "Not provided"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-val">{userData?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-val">{profile.phone || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Gender:</span>
                  <span className="info-val capitalize">{profile.gender || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Age:</span>
                  <span className="info-val">{profile.age || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Blood Group:</span>
                  <span className="info-val">{profile.blood_group || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Status:</span>
                  <span className={`badge ${profile.account_status === "Active" ? "badge-success" : "badge-secondary"}`}>
                    {profile.account_status || "Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Address Information */}
            <div className="card">
              <h3 className="card-title">Address Information</h3>
              <div className="info-list">
                <div className="info-item-block" style={{ marginBottom: "1rem" }}>
                  <span className="info-label-block">Home Address</span>
                  <p className="info-val-block">{profile.address || "No address provided."}</p>
                </div>
                <div className="info-item">
                  <span className="info-label">Emergency Contact:</span>
                  <span className="info-val">{profile.emergency_contact || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Assigned Caregiver:</span>
                  <span className="info-val" style={{ fontWeight: "bold", color: "var(--primary-color)" }}>
                    {profile.caregiver_name || "No caregiver assigned"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Medication & Compliance Section */}
          <div className="grid grid-cols-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
            
            {/* Today's Medicines (Checklist) */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Today's Medicines Checklist</span>
                <span className="badge badge-primary">{pendingReminders.length} Pending</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                {pendingReminders.map((r) => (
                  <div key={r.id} className="flex-center" style={{ justifyContent: "space-between", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justify: "center", color: "var(--primary-color)" }}>
                        <Pill size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem" }}>{r.name}</h4>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)", display: "flex", gap: "1rem" }}>
                          <span>Dosage: <strong>{r.dosage}</strong></span>
                          <span>Time: <strong>{r.scheduled_time}</strong></span>
                          <span>Food: <strong>{r.food_relation}</strong></span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => handleLogDose(r.id, "Taken", r.time_of_day)} className="btn btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Check size={14} /> Take
                      </button>
                      <button onClick={() => handleLogDose(r.id, "Missed", r.time_of_day)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "var(--error-color)" }}>
                        Miss
                      </button>
                      <button onClick={() => handleSnooze(r.id)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                        Snooze
                      </button>
                    </div>
                  </div>
                ))}
                {pendingReminders.length === 0 && (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-light)" }}>
                    <Check size={28} color="var(--success-color)" style={{ marginBottom: "0.5rem" }} />
                    <p style={{ margin: 0, fontSize: "0.9rem" }}>Awesome! All pending medicines logged for today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics & Reminder Preferences */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Adherence Card */}
              <div className="card" style={{ flex: 1 }}>
                <h3 className="card-title">Medication Adherence</h3>
                <div className="grid grid-cols-3" style={{ gap: "1rem", textAlign: "center", marginTop: "1rem" }}>
                  <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "10px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Compliance Rate</span>
                    <strong style={{ fontSize: "1.5rem", color: "var(--primary-color)" }}>{historyStats?.adherence_rate || 0}%</strong>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "10px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Doses Logged</span>
                    <strong style={{ fontSize: "1.5rem", color: "var(--success-color)" }}>{historyStats?.total_taken || 0}</strong>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "10px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Missed Doses</span>
                    <strong style={{ fontSize: "1.5rem", color: "var(--error-color)" }}>{historyStats?.total_missed || 0}</strong>
                  </div>
                </div>
              </div>

              {/* Preference / Service settings card */}
              <div className="card">
                <h3 className="card-title">Reminder Status</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-light)" }}>Twilio SMS Reminders:</span>
                    <strong style={{ color: notifSettings?.sms_enabled ? "var(--success-color)" : "var(--text-light)" }}>
                      {notifSettings?.sms_enabled ? "Active" : "Disabled"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-light)" }}>Email Reminders:</span>
                    <strong style={{ color: notifSettings?.email_enabled ? "var(--success-color)" : "var(--text-light)" }}>
                      {notifSettings?.email_enabled ? "Active" : "Disabled"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-light)" }}>Browser Push:</span>
                    <strong style={{ color: notifSettings?.browser_notifications ? "var(--success-color)" : "var(--text-light)" }}>
                      {notifSettings?.browser_notifications ? "Active" : "Disabled"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Completed / Missed / Upcoming breakdown grids */}
          <div className="grid grid-cols-3" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
            {/* Completed Medicines Card */}
            <div className="card">
              <h3 className="card-title" style={{ color: "var(--success-color)" }}>Completed Today</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem", fontSize: "0.85rem" }}>
                {completedReminders.map(c => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "0.4rem" }}>
                    <span>{c.name} ({c.dosage})</span>
                    <span style={{ color: "var(--text-light)" }}>{c.scheduled_time}</span>
                  </div>
                ))}
                {completedReminders.length === 0 && <span style={{ color: "var(--text-light)" }}>No completed doses logged yet.</span>}
              </div>
            </div>

            {/* Missed Doses Card */}
            <div className="card">
              <h3 className="card-title" style={{ color: "var(--error-color)" }}>Missed Today</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem", fontSize: "0.85rem" }}>
                {missedReminders.map(m => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "0.4rem" }}>
                    <span>{m.name} ({m.dosage})</span>
                    <span style={{ color: "var(--text-light)" }}>{m.scheduled_time}</span>
                  </div>
                ))}
                {missedReminders.length === 0 && <span style={{ color: "var(--text-light)" }}>No missed doses logged today.</span>}
              </div>
            </div>

            {/* Upcoming Medicines */}
            <div className="card">
              <h3 className="card-title" style={{ color: "var(--primary-color)" }}>Upcoming Medicines</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem", fontSize: "0.85rem" }}>
                {pendingReminders.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "0.4rem" }}>
                    <span>{p.name} ({p.dosage})</span>
                    <strong>{p.scheduled_time}</strong>
                  </div>
                ))}
                {pendingReminders.length === 0 && <span style={{ color: "var(--text-light)" }}>No upcoming doses.</span>}
              </div>
            </div>
          </div>

          {/* Medicines database management table card */}
          <div className="card" style={{ padding: "2rem", borderRadius: "16px" }}>
            <div className="flex-center" style={{ justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h3 className="card-title" style={{ margin: 0, fontWeight: 800 }}>Manage Medication Database</h3>
              <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "8px" }}>
                <Plus size={16} /> Add Medicine
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Dosage</th>
                    <th>Remaining Stock</th>
                    <th>Schedule Times</th>
                    <th>Instruction</th>
                    <th>Duration</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med) => (
                    <tr key={med.id}>
                      <td><strong>{med.name}</strong></td>
                      <td>{med.dosage}</td>
                      <td>
                        <span className={`badge ${med.quantity <= 5 ? "badge-danger" : "badge-secondary"}`}>
                          {med.quantity} left
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                          {med.reminder_schedules?.map(s => (
                            <span key={s.id} className="badge badge-primary" style={{ fontSize: "0.72rem" }}>
                              {s.scheduled_time}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{med.food_relation}</td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>
                        {med.start_date} to {med.end_date}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          <button onClick={() => openEditModal(med)} className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}>Edit</button>
                          <button onClick={() => handleDeleteMedicine(med.id)} className="btn btn-danger" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem", background: "var(--error-color)", borderColor: "var(--error-color)", color: "#fff" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {medicines.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--text-light)" }}>No medications in database. Create your first medication record now.</td>
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
                <input type="text" className="form-input" required value={medFrequency} onChange={(e) => setMedFrequency(e.target.value)} placeholder="e.g. Daily" />
              </div>

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
                <textarea className="form-input" value={medNotes} onChange={(e) => setMedNotes(e.target.value)} placeholder="Take with warm water..." rows="2" />
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
