import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, Bell, Pill, Check, LogOut, ShieldAlert, Award, Calendar, 
  RefreshCw, X, Edit, Trash2, Activity, Users, Search, Filter, 
  AlertTriangle, Clock, CheckCircle, ArrowUpDown, Sparkles
} from "lucide-react";
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

  // Search & Filter Toolbar States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Modals Toggles
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  // Delete Confirmation Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMed, setDeletingMed] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Auto-clear success messages after 4 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

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

  // Calculated Statistics
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const stats = useMemo(() => {
    const total = medicines.length;
    let active = 0;
    let lowStock = 0;
    let expiringSoon = 0;
    let completedCourses = 0;

    const todayDate = new Date();

    medicines.forEach((med) => {
      if (med.quantity <= 5) lowStock++;

      const endDate = med.end_date ? new Date(med.end_date) : null;

      if (endDate && endDate < todayDate) {
        completedCourses++;
      } else {
        active++;
        if (endDate) {
          const diffDays = Math.ceil((endDate - todayDate) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 7) {
            expiringSoon++;
          }
        }
      }
    });

    return {
      total,
      active,
      lowStock,
      expiringSoon,
      todayDoses: reminders.length,
      completedCourses
    };
  }, [medicines, reminders]);

  // Filtered and Sorted Medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      // Search filter
      const matchesSearch = 
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.dosage.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      const todayDate = new Date();
      const endDate = med.end_date ? new Date(med.end_date) : null;
      const isCompleted = endDate && endDate < todayDate;
      const isExpiring = endDate && !isCompleted && Math.ceil((endDate - todayDate) / (1000 * 60 * 60 * 24)) <= 7;

      if (statusFilter === "active" && isCompleted) return false;
      if (statusFilter === "completed" && !isCompleted) return false;
      if (statusFilter === "expiring" && !isExpiring) return false;

      // Stock filter
      if (stockFilter === "low" && med.quantity > 5) return false;
      if (stockFilter === "sufficient" && med.quantity <= 5) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "stock") return a.quantity - b.quantity;
      if (sortBy === "date") return new Date(a.start_date) - new Date(b.start_date);
      return 0;
    });
  }, [medicines, searchTerm, statusFilter, stockFilter, sortBy]);

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

  // Open Delete Confirmation Dialog
  const openDeleteConfirmation = (med) => {
    setDeletingMed(med);
    setShowDeleteModal(true);
  };

  // Confirm Delete Medicine with loading state and toasts
  const confirmDeleteMedicine = async () => {
    if (!deletingMed) return;
    setIsDeleting(true);

    try {
      await medicineService.deleteMedicine(deletingMed.id);
      setSuccessMsg(`Medicine "${deletingMed.name}" deleted successfully.`);
      setShowDeleteModal(false);
      setDeletingMed(null);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to delete medicine.");
    } finally {
      setIsDeleting(false);
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
    <div className="app-container" style={{ 
      display: "flex", 
      height: "100vh", 
      overflow: "hidden",
      position: "relative"
    }}>
      {/* Subtle Healthcare SVG Pattern Overlay */}
      <div style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232563EB' fill-rule='evenodd'%3E%3Cpath d='M27 27V12h6v15h15v6H33v15h-6V33H12v-6h15z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat"
      }} />

      <Sidebar role={auth?.role} email={auth?.email} />

      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto", zIndex: 1 }}>
        <Navbar pageTitle="Patient Dashboard" />

        <main className="content-area" style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
          {errorMsg && (
            <div className="alert alert-danger" style={{ 
              marginBottom: "1.5rem", 
              borderRadius: "12px", 
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
              display: "flex",
              justify: "space-between",
              alignItems: "center"
            }}>
              <span>{errorMsg}</span>
              <X size={18} style={{ cursor: "pointer" }} onClick={() => setErrorMsg("")} />
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success" style={{ 
              marginBottom: "1.5rem", 
              borderRadius: "12px", 
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
              display: "flex",
              justify: "space-between",
              alignItems: "center"
            }}>
              <span>{successMsg}</span>
              <X size={18} style={{ cursor: "pointer" }} onClick={() => setSuccessMsg("")} />
            </div>
          )}

          {/* Welcome Banner Card */}
          <div className="welcome-banner card" style={{ 
            borderLeft: "4px solid #2563EB", 
            marginBottom: "2rem",
            background: "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(6,182,212,0.04) 100%)",
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)"
          }}>
            <h2>Welcome back, {profile.full_name || "Patient"}!</h2>
            <p>You are logged into your Patient Dashboard. Manage your medicines, reminders, medication history and health records from here.</p>
          </div>

          {/* Two-Column Profile Grid */}
          <div className="grid grid-cols-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
            {/* Card 1: Patient Profile */}
            <div className="card" style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
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
            <div className="card" style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
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
                  <span className="info-val" style={{ fontWeight: "bold", color: "#2563EB" }}>
                    {profile.caregiver_name || "No caregiver assigned"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Medication & Compliance Section */}
          <div className="grid grid-cols-2" style={{ gap: "1.5rem", marginBottom: "2.5rem" }}>
            
            {/* Today's Medicines (Checklist) */}
            <div className="card" style={{ padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <h3 className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Today's Medicines Checklist</span>
                <span className="badge badge-primary">{pendingReminders.length} Pending</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                {pendingReminders.map((r) => (
                  <div key={r.id} className="flex-center" style={{ justifyContent: "space-between", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
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
                      <button onClick={() => handleLogDose(r.id, "Missed", r.time_of_day)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "#EF4444" }}>
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
                    <Check size={28} color="#10B981" style={{ marginBottom: "0.5rem" }} />
                    <p style={{ margin: 0, fontSize: "0.9rem" }}>Awesome! All pending medicines logged for today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics & Reminder Preferences */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Adherence Card */}
              <div className="card" style={{ flex: 1, borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <h3 className="card-title">Medication Adherence</h3>
                <div className="grid grid-cols-3" style={{ gap: "1rem", textAlign: "center", marginTop: "1rem" }}>
                  <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "10px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Compliance Rate</span>
                    <strong style={{ fontSize: "1.5rem", color: "#2563EB" }}>{historyStats?.adherence_rate || 0}%</strong>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "10px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Doses Logged</span>
                    <strong style={{ fontSize: "1.5rem", color: "#10B981" }}>{historyStats?.total_taken || 0}</strong>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "10px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Missed Doses</span>
                    <strong style={{ fontSize: "1.5rem", color: "#EF4444" }}>{historyStats?.total_missed || 0}</strong>
                  </div>
                </div>
              </div>

              {/* Preference / Service settings card */}
              <div className="card" style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <h3 className="card-title">Reminder Status</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-light)" }}>Twilio SMS Reminders:</span>
                    <strong style={{ color: notifSettings?.sms_enabled ? "#10B981" : "var(--text-light)" }}>
                      {notifSettings?.sms_enabled ? "Active" : "Disabled"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-light)" }}>Email Reminders:</span>
                    <strong style={{ color: notifSettings?.email_enabled ? "#10B981" : "var(--text-light)" }}>
                      {notifSettings?.email_enabled ? "Active" : "Disabled"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-light)" }}>Browser Push:</span>
                    <strong style={{ color: notifSettings?.browser_notifications ? "#10B981" : "var(--text-light)" }}>
                      {notifSettings?.browser_notifications ? "Active" : "Disabled"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Completed / Missed / Upcoming breakdown grids */}
          <div className="grid grid-cols-3" style={{ gap: "1.5rem", marginBottom: "2.5rem" }}>
            {/* Completed Medicines Card */}
            <div className="card" style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <h3 className="card-title" style={{ color: "#10B981" }}>Completed Today</h3>
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
            <div className="card" style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <h3 className="card-title" style={{ color: "#EF4444" }}>Missed Today</h3>
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
            <div className="card" style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <h3 className="card-title" style={{ color: "#2563EB" }}>Upcoming Medicines</h3>
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

          {/* ========================================================= */}
          {/* PREMIUM HEALTHCARE SAAS MEDICINE MANAGEMENT MODULE         */}
          {/* ========================================================= */}
          
          {/* HEADER SECTION */}
          <div style={{ 
            display: "flex", 
            justify: "space-between", 
            alignItems: "center", 
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 8px 16px rgba(37,99,235,0.25)"
              }}>
                <Pill size={26} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Medicine Management
                </h1>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.9rem", color: "var(--text-light)" }}>
                  Manage medicines, reminders and stock efficiently.
                </p>
              </div>
            </div>

            <button 
              onClick={() => { resetForm(); setShowAddModal(true); }} 
              className="btn btn-primary" 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                padding: "0.7rem 1.4rem", 
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                fontWeight: 600,
                fontSize: "0.92rem",
                boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
                transition: "all 0.2s ease"
              }}
            >
              <Plus size={18} /> Add Medicine
            </button>
          </div>

          {/* STATISTICS CARDS GRID */}
          <div className="grid grid-cols-6" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
            gap: "1.25rem", 
            marginBottom: "2rem" 
          }}>
            {/* Card 1: Total Medicines */}
            <div className="card" style={{ 
              padding: "1.25rem", 
              borderRadius: "14px", 
              borderLeft: "4px solid #2563EB",
              background: "linear-gradient(180deg, var(--bg-card) 0%, rgba(37,99,235,0.03) 100%)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              transition: "transform 0.2s ease",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-light)", textTransform: "uppercase" }}>Total Medicines</span>
                <Pill size={20} color="#2563EB" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>{stats.total}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.25rem" }}>Registered prescriptions</div>
            </div>

            {/* Card 2: Active Medicines */}
            <div className="card" style={{ 
              padding: "1.25rem", 
              borderRadius: "14px", 
              borderLeft: "4px solid #06B6D4",
              background: "linear-gradient(180deg, var(--bg-card) 0%, rgba(6,182,212,0.03) 100%)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-light)", textTransform: "uppercase" }}>Active Medicines</span>
                <Activity size={20} color="#06B6D4" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#06B6D4" }}>{stats.active}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.25rem" }}>Ongoing treatments</div>
            </div>

            {/* Card 3: Low Stock */}
            <div className="card" style={{ 
              padding: "1.25rem", 
              borderRadius: "14px", 
              borderLeft: "4px solid #EF4444",
              background: "linear-gradient(180deg, var(--bg-card) 0%, rgba(239,68,68,0.03) 100%)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-light)", textTransform: "uppercase" }}>Low Stock</span>
                <AlertTriangle size={20} color="#EF4444" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#EF4444" }}>{stats.lowStock}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.25rem" }}>Refill required (≤ 5)</div>
            </div>

            {/* Card 4: Expiring Soon */}
            <div className="card" style={{ 
              padding: "1.25rem", 
              borderRadius: "14px", 
              borderLeft: "4px solid #F59E0B",
              background: "linear-gradient(180deg, var(--bg-card) 0%, rgba(245,158,11,0.03) 100%)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-light)", textTransform: "uppercase" }}>Expiring Soon</span>
                <Clock size={20} color="#F59E0B" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#F59E0B" }}>{stats.expiringSoon}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.25rem" }}>Ending within 7 days</div>
            </div>

            {/* Card 5: Today's Scheduled Doses */}
            <div className="card" style={{ 
              padding: "1.25rem", 
              borderRadius: "14px", 
              borderLeft: "4px solid #10B981",
              background: "linear-gradient(180deg, var(--bg-card) 0%, rgba(16,185,129,0.03) 100%)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-light)", textTransform: "uppercase" }}>Today's Doses</span>
                <Calendar size={20} color="#10B981" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#10B981" }}>{stats.todayDoses}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.25rem" }}>Scheduled today</div>
            </div>

            {/* Card 6: Completed Courses */}
            <div className="card" style={{ 
              padding: "1.25rem", 
              borderRadius: "14px", 
              borderLeft: "4px solid #6366F1",
              background: "linear-gradient(180deg, var(--bg-card) 0%, rgba(99,102,241,0.03) 100%)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-light)", textTransform: "uppercase" }}>Completed</span>
                <Award size={20} color="#6366F1" />
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#6366F1" }}>{stats.completedCourses}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.25rem" }}>Finished courses</div>
            </div>
          </div>

          {/* SEARCH & FILTER TOOLBAR & TABLE CONTAINER CARD */}
          <div className="card" style={{ 
            padding: "1.75rem", 
            borderRadius: "18px", 
            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
            border: "1px solid var(--border)"
          }}>
            {/* Toolbar */}
            <div style={{ 
              display: "flex", 
              gap: "1rem", 
              flexWrap: "wrap", 
              alignItems: "center", 
              justify: "space-between",
              marginBottom: "1.5rem",
              paddingBottom: "1.25rem",
              borderBottom: "1px solid var(--border)"
            }}>
              {/* Search Bar */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.6rem", 
                background: "var(--bg-secondary)", 
                padding: "0.55rem 1rem", 
                borderRadius: "10px", 
                border: "1px solid var(--border)",
                minWidth: "260px",
                flex: 1
              }}>
                <Search size={18} color="var(--text-light)" />
                <input
                  type="text"
                  placeholder="Search by medicine name or dosage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: "none", background: "transparent", width: "100%", outline: "none", fontSize: "0.9rem", color: "var(--text-primary)" }}
                />
                {searchTerm && (
                  <X size={16} color="var(--text-light)" style={{ cursor: "pointer" }} onClick={() => setSearchTerm("")} />
                )}
              </div>

              {/* Filters & Sorting Controls */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                {/* Status Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Filter size={15} color="var(--text-light)" />
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ 
                      padding: "0.5rem 0.8rem", 
                      borderRadius: "8px", 
                      border: "1px solid var(--border)", 
                      background: "var(--bg-secondary)", 
                      fontSize: "0.85rem",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Treatments</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="completed">Completed Courses</option>
                  </select>
                </div>

                {/* Stock Filter */}
                <select 
                  value={stockFilter} 
                  onChange={(e) => setStockFilter(e.target.value)}
                  style={{ 
                    padding: "0.5rem 0.8rem", 
                    borderRadius: "8px", 
                    border: "1px solid var(--border)", 
                    background: "var(--bg-secondary)", 
                    fontSize: "0.85rem",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  <option value="all">All Stock Levels</option>
                  <option value="low">Low Stock (≤ 5)</option>
                  <option value="sufficient">Sufficient Stock (&gt; 5)</option>
                </select>

                {/* Sorting */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <ArrowUpDown size={15} color="var(--text-light)" />
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ 
                      padding: "0.5rem 0.8rem", 
                      borderRadius: "8px", 
                      border: "1px solid var(--border)", 
                      background: "var(--bg-secondary)", 
                      fontSize: "0.85rem",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="stock">Sort by Stock</option>
                    <option value="date">Sort by Start Date</option>
                  </select>
                </div>
              </div>
            </div>

            {/* MEDICINES TABLE */}
            <div className="table-container" style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)", color: "var(--text-light)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "0.9rem 1rem", borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>Medicine</th>
                    <th style={{ padding: "0.9rem 1rem" }}>Dosage</th>
                    <th style={{ padding: "0.9rem 1rem" }}>Remaining Stock</th>
                    <th style={{ padding: "0.9rem 1rem" }}>Reminder Times</th>
                    <th style={{ padding: "0.9rem 1rem" }}>Food Relationship</th>
                    <th style={{ padding: "0.9rem 1rem" }}>Duration</th>
                    <th style={{ padding: "0.9rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.9rem 1rem", textAlign: "right", borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((med) => {
                    const todayDate = new Date();
                    const endDate = med.end_date ? new Date(med.end_date) : null;
                    const isCompleted = endDate && endDate < todayDate;
                    const isExpiring = endDate && !isCompleted && Math.ceil((endDate - todayDate) / (1000 * 60 * 60 * 24)) <= 7;

                    return (
                      <tr 
                        key={med.id} 
                        style={{ 
                          background: "var(--bg-card)", 
                          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <td style={{ padding: "1rem", borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{ 
                              width: "36px", 
                              height: "36px", 
                              borderRadius: "10px", 
                              background: "rgba(37,99,235,0.1)", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              color: "#2563EB",
                              flexShrink: 0
                            }}>
                              <Pill size={18} />
                            </div>
                            <div>
                              <strong style={{ color: "var(--text-primary)", fontSize: "0.95rem", display: "block" }}>{med.name}</strong>
                              {med.notes && (
                                <span style={{ fontSize: "0.78rem", color: "var(--text-light)", display: "block", marginTop: "0.15rem" }}>
                                  {med.notes.length > 35 ? `${med.notes.substring(0, 35)}...` : med.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "1rem", fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 500 }}>
                          {med.dosage}
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <span style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "0.3rem", 
                            padding: "0.3rem 0.75rem", 
                            borderRadius: "20px", 
                            fontSize: "0.8rem", 
                            fontWeight: 600,
                            background: med.quantity <= 5 ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                            color: med.quantity <= 5 ? "#EF4444" : "#10B981",
                            border: `1px solid ${med.quantity <= 5 ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.25)"}`
                          }}>
                            {med.quantity <= 5 && <AlertTriangle size={12} />}
                            {med.quantity} remaining
                          </span>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                            {med.reminder_schedules?.map(s => (
                              <span key={s.id} style={{ 
                                padding: "0.25rem 0.6rem", 
                                borderRadius: "6px", 
                                background: "rgba(37,99,235,0.08)", 
                                color: "#2563EB", 
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                border: "1px solid rgba(37,99,235,0.15)"
                              }}>
                                {s.scheduled_time}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                          <span style={{ 
                            padding: "0.25rem 0.65rem", 
                            borderRadius: "6px", 
                            background: "var(--bg-secondary)", 
                            fontSize: "0.8rem",
                            border: "1px solid var(--border)"
                          }}>
                            {med.food_relation}
                          </span>
                        </td>

                        <td style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--text-light)" }}>
                          <div>{med.start_date}</div>
                          <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>to {med.end_date}</div>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          {isCompleted ? (
                            <span className="badge" style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.2)" }}>
                              Completed
                            </span>
                          ) : isExpiring ? (
                            <span className="badge" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
                              Expiring Soon
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
                              Active
                            </span>
                          )}
                        </td>

                        {/* ACTIONS COLUMN WITH EDIT AND DELETE BUTTONS */}
                        <td style={{ padding: "1rem", textAlign: "right", borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}>
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", alignItems: "center" }}>
                            {/* EDIT BUTTON */}
                            <button 
                              onClick={() => openEditModal(med)} 
                              className="btn"
                              style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "0.35rem", 
                                padding: "0.4rem 0.85rem", 
                                borderRadius: "8px", 
                                fontSize: "0.8rem", 
                                fontWeight: 600,
                                background: "rgba(37,99,235,0.08)",
                                color: "#2563EB",
                                border: "1px solid rgba(37,99,235,0.2)",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                            >
                              <Edit size={14} /> Edit
                            </button>

                            {/* DELETE BUTTON (RED OUTLINE BUTTON WITH TRASH ICON & HOVER EFFECT) */}
                            <button 
                              onClick={() => openDeleteConfirmation(med)} 
                              className="btn"
                              style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "0.35rem", 
                                padding: "0.4rem 0.85rem", 
                                borderRadius: "8px", 
                                fontSize: "0.8rem", 
                                fontWeight: 600,
                                background: "transparent",
                                color: "#EF4444",
                                border: "1.5px solid #EF4444",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#EF4444";
                                e.currentTarget.style.color = "#FFFFFF";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "#EF4444";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredMedicines.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "3rem 2rem", color: "var(--text-light)" }}>
                        <Pill size={36} style={{ margin: "0 auto 0.75rem", opacity: 0.4, color: "var(--text-light)" }} />
                        <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>No medications found matching your criteria.</p>
                        <span style={{ fontSize: "0.85rem" }}>Try adjusting your search terms or filters.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION DIALOG MODAL                          */}
      {/* ========================================================= */}
      {showDeleteModal && (
        <div className="modal-backdrop flex-center" style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          width: "100%", 
          height: "100%", 
          background: "rgba(0,0,0,0.6)", 
          backdropFilter: "blur(4px)",
          zIndex: 1100 
        }}>
          <div className="card modal-content" style={{ 
            width: "440px", 
            padding: "2rem", 
            borderRadius: "20px", 
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            border: "1px solid var(--border)",
            textAlign: "center"
          }}>
            <div style={{ 
              width: "56px", 
              height: "56px", 
              borderRadius: "50%", 
              background: "rgba(239, 68, 68, 0.1)", 
              color: "#EF4444", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              margin: "0 auto 1.25rem" 
            }}>
              <Trash2 size={28} />
            </div>

            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Delete Medicine
            </h3>

            <p style={{ margin: "0 0 1.75rem", fontSize: "0.92rem", color: "var(--text-light)", lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this medicine?
            </p>

            {deletingMed && (
              <div style={{ 
                background: "var(--bg-secondary)", 
                padding: "0.75rem 1rem", 
                borderRadius: "10px", 
                marginBottom: "1.5rem",
                fontSize: "0.88rem",
                color: "var(--text-primary)",
                border: "1px solid var(--border)"
              }}>
                <strong>{deletingMed.name}</strong> ({deletingMed.dosage})
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button 
                type="button" 
                onClick={() => { setShowDeleteModal(false); setDeletingMed(null); }} 
                disabled={isDeleting}
                className="btn btn-secondary"
                style={{ 
                  flex: 1, 
                  padding: "0.65rem 1.25rem", 
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  fontWeight: 600
                }}
              >
                Cancel
              </button>

              <button 
                type="button" 
                onClick={confirmDeleteMedicine}
                disabled={isDeleting}
                className="btn"
                style={{ 
                  flex: 1, 
                  padding: "0.65rem 1.25rem", 
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  background: "#EF4444",
                  color: "#FFFFFF",
                  border: "none",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="modal-backdrop flex-center" style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          width: "100%", 
          height: "100%", 
          background: "rgba(0,0,0,0.6)", 
          backdropFilter: "blur(4px)",
          zIndex: 1000 
        }}>
          <div className="card modal-content" style={{ width: "520px", padding: "2rem", maxHeight: "90vh", overflowY: "auto", borderRadius: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Add New Medicine</h3>
              <X size={20} style={{ cursor: "pointer", color: "var(--text-light)" }} onClick={() => setShowAddModal(false)} />
            </div>

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
                          style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: "6px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justify: "center" }}
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
        <div className="modal-backdrop flex-center" style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          width: "100%", 
          height: "100%", 
          background: "rgba(0,0,0,0.6)", 
          backdropFilter: "blur(4px)",
          zIndex: 1000 
        }}>
          <div className="card modal-content" style={{ width: "520px", padding: "2rem", maxHeight: "90vh", overflowY: "auto", borderRadius: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Edit Medicine Details</h3>
              <X size={20} style={{ cursor: "pointer", color: "var(--text-light)" }} onClick={() => setShowEditModal(false)} />
            </div>

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
                          style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: "6px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justify: "center" }}
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
