import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, Bell, Pill, Check, LogOut, ShieldAlert, Award, Calendar, 
  RefreshCw, X, Edit, Trash2, Activity, Users, Search, Filter, 
  AlertTriangle, Clock, CheckCircle2, ArrowUpDown, Sparkles,
  TrendingUp, User, History, Zap, Sliders, ChevronRight, Heart, Mail, CheckCircle
} from "lucide-react";
import { authService, medicineService, drugInteractionService, insightsService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MedicineSearchInput from "../components/MedicineSearchInput";
import PrescriptionUploadModal from "../components/PrescriptionUploadModal";
import DrugInteractionModal from "../components/DrugInteractionModal";

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

  // Time & Date State for Live Clock in Hero
  const [currentTime, setCurrentTime] = useState(new Date());

  // Search & Filter Toolbar States for Medicine Management Table
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

  // M3 Modals & Insights States
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [interactionWarnings, setInteractionWarnings] = useState([]);
  const [pendingSavePayload, setPendingSavePayload] = useState(null);
  const [healthInsights, setHealthInsights] = useState(null);

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

      try {
        const insightsRes = await insightsService.getInsights();
        setHealthInsights(insightsRes);
      } catch (e) {
        console.error("Insights fetch failed:", e);
      }
    } catch (err) {
      setErrorMsg("Failed to load patient dashboard modules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Clock update interval
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

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

    return () => {
      clearInterval(clockTimer);
      clearInterval(interval);
    };
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

  // Calculated Statistics & Breakdown
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

    const taken = reminders.filter(r => r.status === "Taken").length;
    const missed = reminders.filter(r => r.status === "Missed").length;
    const pending = reminders.filter(r => r.status === "Pending").length;
    const upcoming = pending;

    const todayTotal = reminders.length;
    const todayAdherencePct = todayTotal > 0 ? Math.round((taken / todayTotal) * 100) : 100;
    const overallAdherence = historyStats?.adherence_rate || 0;

    return {
      total,
      active,
      lowStock,
      expiringSoon,
      todayDoses: todayTotal,
      taken,
      pending,
      missed,
      upcoming,
      todayAdherencePct,
      overallAdherence,
      completedCourses
    };
  }, [medicines, reminders, historyStats]);

  // Filtered and Sorted Medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const matchesSearch = 
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.dosage.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const todayDate = new Date();
      const endDate = med.end_date ? new Date(med.end_date) : null;
      const isCompleted = endDate && endDate < todayDate;
      const isExpiring = endDate && !isCompleted && Math.ceil((endDate - todayDate) / (1000 * 60 * 60 * 24)) <= 7;

      if (statusFilter === "active" && isCompleted) return false;
      if (statusFilter === "completed" && !isCompleted) return false;
      if (statusFilter === "expiring" && !isExpiring) return false;

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

    // Module 4: Check for drug interactions before saving
    try {
      const warnings = await drugInteractionService.checkInteractions(medName);
      if (warnings && warnings.length > 0) {
        setInteractionWarnings(warnings);
        setPendingSavePayload(payload);
        return; // Pause and show DrugInteractionModal
      }
    } catch (e) {
      console.error("Interaction check skipped:", e);
    }

    executeSaveMedicine(payload);
  };

  const executeSaveMedicine = async (payload) => {
    try {
      await medicineService.addMedicine(payload);
      setSuccessMsg("Medicine added successfully!");
      setShowAddModal(false);
      setInteractionWarnings([]);
      setPendingSavePayload(null);
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
        <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
          <Navbar pageTitle="Patient Dashboard" />
          {/* Premium Skeleton Loader */}
          <div style={{ padding: "2rem", maxWidth: "1440px", margin: "0 auto", width: "100%" }}>
            {/* Hero skeleton */}
            <div className="skeleton" style={{ height: "140px", borderRadius: "24px", marginBottom: "2rem" }} />
            {/* Quick actions skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem", marginBottom: "2.5rem" }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "16px" }} />
              ))}
            </div>
            {/* Stats skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "1.25rem", marginBottom: "2.5rem" }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "90px", borderRadius: "14px" }} />
              ))}
            </div>
            {/* Content skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
              <div className="skeleton" style={{ height: "320px", borderRadius: "20px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div className="skeleton" style={{ height: "150px", borderRadius: "20px" }} />
                <div className="skeleton" style={{ height: "150px", borderRadius: "20px" }} />
              </div>
            </div>
            <div className="skeleton" style={{ height: "400px", borderRadius: "20px" }} />
          </div>
        </div>
      </div>
    );
  }

  const profile = userData?.profile || {};

  return (
    <div className="app-container" style={{ 
      display: "flex", 
      height: "100vh", 
      overflow: "hidden",
      position: "relative",
      backgroundColor: "#F8FAFC"
    }}>
      {/* Subtle Healthcare SVG Pattern Overlay */}
      <div style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232563EB' fill-rule='evenodd'%3E%3Cpath d='M36 36V16h8v20h20v8H44v20h-8V44H16v-8h20z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat"
      }} />

      <Sidebar role={auth?.role} email={auth?.email} />

      <div className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto", zIndex: 1 }}>
        <Navbar pageTitle="Patient Dashboard" />

        <main className="content-area" style={{ padding: "2rem", maxWidth: "1440px", margin: "0 auto", width: "100%" }}>
          
          {/* Toast Alert Notifications */}
          {errorMsg && (
            <div className="alert alert-danger" style={{ 
              marginBottom: "1.5rem", 
              borderRadius: "12px", 
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.15)",
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
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.15)",
              display: "flex",
              justify: "space-between",
              alignItems: "center"
            }}>
              <span>{successMsg}</span>
              <X size={18} style={{ cursor: "pointer" }} onClick={() => setSuccessMsg("")} />
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. WELCOME HERO SECTION                                    */}
          {/* ========================================================= */}
          <div className="page-section stagger-1" style={{
            background: "linear-gradient(135deg, #1E1B4B 0%, #1E293B 50%, #0F172A 100%)",
            borderRadius: "24px",
            padding: "2.25rem",
            color: "#FFFFFF",
            marginBottom: "2rem",
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}>
            {/* Background Ambient Glow Orbs */}
            <div style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "250px",
              height: "250px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(37,99,235,0.3) 0%, rgba(0,0,0,0) 70%)",
              pointerEvents: "none"
            }} />
            <div style={{
              position: "absolute",
              bottom: "-40px",
              left: "30%",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, rgba(0,0,0,0) 70%)",
              pointerEvents: "none"
            }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem", zIndex: 1 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ 
                    padding: "0.25rem 0.75rem", 
                    borderRadius: "20px", 
                    background: "rgba(255,255,255,0.12)", 
                    fontSize: "0.8rem", 
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                    backdropFilter: "blur(4px)"
                  }}>
                    {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} • {currentTime.toLocaleTimeString()}
                  </span>
                </div>
                <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Welcome back, {profile.full_name || "Patient"}! 👋
                </h1>
                <p style={{ margin: "0.5rem 0 0", color: "#94A3B8", fontSize: "0.98rem", maxWidth: "600px", lineHeight: 1.5 }}>
                  You have <strong style={{ color: "#60A5FA" }}>{stats.todayDoses} medicines</strong> scheduled today. 
                  &nbsp;<span style={{ color: "#4ADE80" }}>{stats.taken} completed</span>, <span style={{ color: "#F87171" }}>{stats.pending} remaining</span>.
                </p>
              </div>

              {/* Today's Adherence Circle Badge */}
              <div style={{ 
                background: "rgba(255, 255, 255, 0.08)", 
                padding: "1.25rem 1.75rem", 
                borderRadius: "20px", 
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                gap: "1.25rem"
              }}>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.8rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", display: "block" }}>Today's Compliance</span>
                  <strong style={{ fontSize: "1.85rem", fontWeight: 900, color: stats.todayAdherencePct === 100 ? "#4ADE80" : "#60A5FA" }}>
                    {stats.todayAdherencePct}%
                  </strong>
                </div>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(37,99,235,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60A5FA" }}>
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            {/* Health Quote Banner */}
            <div style={{ 
              background: "rgba(255, 255, 255, 0.05)", 
              padding: "0.85rem 1.25rem", 
              borderRadius: "12px", 
              borderLeft: "3px solid #10B981", 
              fontSize: "0.88rem", 
              color: "#CBD5E1",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              zIndex: 1
            }}>
              <Sparkles size={18} color="#10B981" />
              <span>"Consistency in your medication schedule is key to long-term wellness. Keep up the good momentum!"</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. QUICK ACTIONS SECTION                                   */}
          {/* ========================================================= */}
          <div className="page-section stagger-2" style={{ marginBottom: "2.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B", marginBottom: "1rem", letterSpacing: "-0.01em" }}>
              Quick Actions
            </h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "1.25rem" 
            }}>
              {/* Action 1: Add Medicine */}
              <div 
                onClick={() => { resetForm(); setShowAddModal(true); }}
                style={{ 
                  background: "#FFFFFF", 
                  padding: "1.25rem", 
                  borderRadius: "16px", 
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  transition: "all 0.2s ease"
                }}
                className="hover-card"
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
                  <Plus size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#1E293B" }}>Add Medicine</h4>
                  <span style={{ fontSize: "0.78rem", color: "#64748B" }}>New prescription</span>
                </div>
              </div>

              {/* Action 2: Reminder Settings */}
              <div 
                onClick={() => navigate("/notifications-settings")}
                style={{ 
                  background: "#FFFFFF", 
                  padding: "1.25rem", 
                  borderRadius: "16px", 
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  transition: "all 0.2s ease"
                }}
                className="hover-card"
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(6,182,212,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#06B6D4" }}>
                  <Bell size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#1E293B" }}>Reminder Settings</h4>
                  <span style={{ fontSize: "0.78rem", color: "#64748B" }}>SMS & Email alerts</span>
                </div>
              </div>

              {/* Action 3: Profile Settings */}
              <div 
                onClick={() => navigate("/profile")}
                style={{ 
                  background: "#FFFFFF", 
                  padding: "1.25rem", 
                  borderRadius: "16px", 
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  transition: "all 0.2s ease"
                }}
                className="hover-card"
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
                  <User size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#1E293B" }}>My Profile</h4>
                  <span style={{ fontSize: "0.78rem", color: "#64748B" }}>Update profile info</span>
                </div>
              </div>

              {/* Action 4: Medication History */}
              <div 
                onClick={() => {
                  const el = document.getElementById("medication-table-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                style={{ 
                  background: "#FFFFFF", 
                  padding: "1.25rem", 
                  borderRadius: "16px", 
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  transition: "all 0.2s ease"
                }}
                className="hover-card"
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1" }}>
                  <History size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#1E293B" }}>Medication History</h4>
                  <span style={{ fontSize: "0.78rem", color: "#64748B" }}>View full list</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. REDESIGNED STATISTICS CARDS GRID                        */}
          {/* ========================================================= */}
          <div className="page-section stagger-3" style={{ marginBottom: "2.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B", marginBottom: "1rem", letterSpacing: "-0.01em" }}>
              Key Statistics & Overview
            </h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
              gap: "1.25rem" 
            }}>
              {/* Total Medicines */}
              <div className="card" style={{ padding: "1.25rem", borderRadius: "16px", borderLeft: "4px solid #2563EB", background: "#FFFFFF", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Total Medicines</span>
                  <Pill size={18} color="#2563EB" />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1E293B", margin: "0.4rem 0 0.1rem" }}>{stats.total}</div>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Registered list</span>
              </div>

              {/* Today's Doses */}
              <div className="card" style={{ padding: "1.25rem", borderRadius: "16px", borderLeft: "4px solid #06B6D4", background: "#FFFFFF", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Today's Doses</span>
                  <Calendar size={18} color="#06B6D4" />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#06B6D4", margin: "0.4rem 0 0.1rem" }}>{stats.todayDoses}</div>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Scheduled today</span>
              </div>

              {/* Taken */}
              <div className="card" style={{ padding: "1.25rem", borderRadius: "16px", borderLeft: "4px solid #10B981", background: "#FFFFFF", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Doses Taken</span>
                  <CheckCircle2 size={18} color="#10B981" />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10B981", margin: "0.4rem 0 0.1rem" }}>{stats.taken}</div>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Logged successfully</span>
              </div>

              {/* Pending */}
              <div className="card" style={{ padding: "1.25rem", borderRadius: "16px", borderLeft: "4px solid #F59E0B", background: "#FFFFFF", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Pending</span>
                  <Clock size={18} color="#F59E0B" />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#F59E0B", margin: "0.4rem 0 0.1rem" }}>{stats.pending}</div>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Awaiting logs</span>
              </div>

              {/* Missed */}
              <div className="card" style={{ padding: "1.25rem", borderRadius: "16px", borderLeft: "4px solid #EF4444", background: "#FFFFFF", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Missed</span>
                  <AlertTriangle size={18} color="#EF4444" />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#EF4444", margin: "0.4rem 0 0.1rem" }}>{stats.missed}</div>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Missed today</span>
              </div>

              {/* Overall Adherence */}
              <div className="card" style={{ padding: "1.25rem", borderRadius: "16px", borderLeft: "4px solid #6366F1", background: "#FFFFFF", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Adherence</span>
                  <Award size={18} color="#6366F1" />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#6366F1", margin: "0.4rem 0 0.1rem" }}>{stats.overallAdherence}%</div>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Overall rate</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. TODAY'S TIMELINE & HEALTH INSIGHTS GRID                 */}
          {/* ========================================================= */}
          <div className="page-section stagger-4 grid grid-cols-2" style={{ gap: "1.5rem", marginBottom: "2.5rem" }}>
            
            {/* TODAY'S MEDICINE VERTICAL TIMELINE */}
            <div className="card" style={{ padding: "1.75rem", borderRadius: "20px", boxShadow: "0 8px 30px rgba(0,0,0,0.03)", background: "#FFFFFF" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1E293B", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Clock size={20} color="#2563EB" /> Today's Schedule Timeline
                </h3>
                <span className="badge badge-primary">{reminders.length} Scheduled</span>
              </div>

              <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
                {/* Vertical Line */}
                <div style={{ 
                  position: "absolute", 
                  left: "7px", 
                  top: "10px", 
                  bottom: "10px", 
                  width: "2px", 
                  background: "#E2E8F0" 
                }} />

                {reminders.map((r, idx) => {
                  const isTaken = r.status === "Taken";
                  const isMissed = r.status === "Missed";
                  const isPending = r.status === "Pending";

                  return (
                    <div key={r.id} style={{ position: "relative", marginBottom: "1.5rem" }}>
                      {/* Timeline Circle Bullet */}
                      <div style={{ 
                        position: "absolute", 
                        left: "-1.85rem", 
                        top: "2px", 
                        width: "16px", 
                        height: "16px", 
                        borderRadius: "50%", 
                        background: isTaken ? "#10B981" : isMissed ? "#EF4444" : "#2563EB",
                        border: "3px solid #FFFFFF",
                        boxShadow: "0 0 0 2px " + (isTaken ? "#10B981" : isMissed ? "#EF4444" : "#2563EB")
                      }} />

                      <div style={{ 
                        background: "#F8FAFC", 
                        padding: "1rem 1.25rem", 
                        borderRadius: "14px", 
                        border: "1px solid #E2E8F0",
                        display: "flex",
                        justify: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.75rem"
                      }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
                            <strong style={{ fontSize: "0.85rem", color: "#2563EB" }}>{r.scheduled_time}</strong>
                            <span style={{ fontSize: "0.75rem", color: "#64748B" }}>({r.food_relation})</span>
                          </div>
                          <h4 style={{ margin: "0 0 0.2rem", fontSize: "0.98rem", color: "#1E293B", fontWeight: 700 }}>{r.name}</h4>
                          <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Dosage: {r.dosage}</span>
                        </div>

                        {/* Actions or Status Badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {isPending ? (
                            <>
                              <button onClick={() => handleLogDose(r.id, "Taken", r.time_of_day)} className="btn btn-primary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <Check size={14} /> Take
                              </button>
                              <button onClick={() => handleLogDose(r.id, "Missed", r.time_of_day)} className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem", color: "#EF4444" }}>
                                Miss
                              </button>
                              <button onClick={() => handleSnooze(r.id)} className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}>
                                Snooze
                              </button>
                            </>
                          ) : (
                            <span style={{ 
                              padding: "0.3rem 0.75rem", 
                              borderRadius: "20px", 
                              fontSize: "0.78rem", 
                              fontWeight: 700,
                              background: isTaken ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                              color: isTaken ? "#10B981" : "#EF4444",
                              border: "1px solid " + (isTaken ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)")
                            }}>
                              {r.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {reminders.length === 0 && (
                  <div style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                    <CheckCircle size={32} color="#10B981" style={{ marginBottom: "0.5rem" }} />
                    <p style={{ margin: 0, fontSize: "0.92rem" }}>No active reminders remaining today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* HEALTH INSIGHTS & PROGRESS CARDS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Dynamic Health Insights Card */}
              <div className="card" style={{ 
                padding: "1.75rem", 
                borderRadius: "20px", 
                boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
                background: "linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(16,185,129,0.05) 100%)",
                border: "1px solid rgba(37,99,235,0.15)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                  <Sparkles size={22} color="#2563EB" />
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1E293B" }}>
                    Smart Health Insights
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ background: "#FFFFFF", padding: "1rem 1.25rem", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                    <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.92rem", color: "#1E293B", fontWeight: 700 }}>
                      Adherence Progress: {stats.overallAdherence}%
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748B", lineHeight: 1.4 }}>
                      {stats.overallAdherence >= 80 
                        ? "You maintain excellent adherence consistency! Keep following your schedule." 
                        : "Try setting reminder alarms to improve your daily medication log rate."}
                    </p>
                  </div>

                  <div style={{ background: "#FFFFFF", padding: "1rem 1.25rem", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                    <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.92rem", color: "#1E293B", fontWeight: 700 }}>
                      Inventory Alert
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748B", lineHeight: 1.4 }}>
                      {stats.lowStock > 0 
                        ? `You have ${stats.lowStock} medicine(s) low on stock. Plan your refill soon.` 
                        : "All medication stock levels are sufficient for upcoming doses."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Profile Card */}
              <div className="card" style={{ padding: "1.5rem", borderRadius: "20px", boxShadow: "0 8px 30px rgba(0,0,0,0.03)", background: "#FFFFFF" }}>
                <h3 className="card-title" style={{ fontSize: "1rem", marginBottom: "1rem" }}>Profile Summary</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.88rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Name:</span>
                    <strong style={{ color: "#1E293B" }}>{profile.full_name || "—"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Blood Group:</span>
                    <strong style={{ color: "#2563EB" }}>{profile.blood_group || "—"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Emergency Contact:</span>
                    <strong style={{ color: "#1E293B" }}>{profile.emergency_contact || "—"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Assigned Caregiver:</span>
                    <strong style={{ color: "#10B981" }}>{profile.caregiver_name || "None"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. PREMIUM HEALTHCARE SAAS MEDICINE MANAGEMENT MODULE      */}
          {/* ========================================================= */}
          
          <div id="medication-table-section" className="page-section stagger-5" style={{ 
            display: "flex", 
            justify: "space-between", 
            alignItems: "center", 
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
            paddingTop: "1rem"
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
                <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.02em" }}>
                  Medicine Database Management
                </h2>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.88rem", color: "#64748B" }}>
                  Manage medicines, schedules and inventory refills.
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
                padding: "0.65rem 1.3rem", 
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                fontWeight: 600,
                fontSize: "0.9rem",
                boxShadow: "0 4px 14px rgba(37,99,235,0.3)"
              }}
            >
              <Plus size={18} /> Add Medicine
            </button>
          </div>

          {/* SEARCH & FILTER TOOLBAR & TABLE CONTAINER CARD */}
          <div className="card" style={{ 
            padding: "1.75rem", 
            borderRadius: "20px", 
            boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
            border: "1px solid #E2E8F0",
            background: "#FFFFFF"
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
              borderBottom: "1px solid #E2E8F0"
            }}>
              {/* Search Bar */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.6rem", 
                background: "#F8FAFC", 
                padding: "0.55rem 1rem", 
                borderRadius: "10px", 
                border: "1px solid #E2E8F0",
                minWidth: "260px",
                flex: 1
              }}>
                <Search size={18} color="#64748B" />
                <input
                  type="text"
                  placeholder="Search by medicine name or dosage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: "none", background: "transparent", width: "100%", outline: "none", fontSize: "0.9rem", color: "#1E293B" }}
                />
                {searchTerm && (
                  <X size={16} color="#64748B" style={{ cursor: "pointer" }} onClick={() => setSearchTerm("")} />
                )}
              </div>

              {/* Filters & Sorting Controls */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Filter size={15} color="#64748B" />
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ 
                      padding: "0.5rem 0.8rem", 
                      borderRadius: "8px", 
                      border: "1px solid #E2E8F0", 
                      background: "#F8FAFC", 
                      fontSize: "0.85rem",
                      color: "#1E293B",
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

                <select 
                  value={stockFilter} 
                  onChange={(e) => setStockFilter(e.target.value)}
                  style={{ 
                    padding: "0.5rem 0.8rem", 
                    borderRadius: "8px", 
                    border: "1px solid #E2E8F0", 
                    background: "#F8FAFC", 
                    fontSize: "0.85rem",
                    color: "#1E293B",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  <option value="all">All Stock Levels</option>
                  <option value="low">Low Stock (≤ 5)</option>
                  <option value="sufficient">Sufficient Stock (&gt; 5)</option>
                </select>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <ArrowUpDown size={15} color="#64748B" />
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ 
                      padding: "0.5rem 0.8rem", 
                      borderRadius: "8px", 
                      border: "1px solid #E2E8F0", 
                      background: "#F8FAFC", 
                      fontSize: "0.85rem",
                      color: "#1E293B",
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
                  <tr style={{ background: "#F8FAFC", color: "#64748B", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                          background: "#FFFFFF", 
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
                              <strong style={{ color: "#1E293B", fontSize: "0.95rem", display: "block" }}>{med.name}</strong>
                              {med.notes && (
                                <span style={{ fontSize: "0.78rem", color: "#64748B", display: "block", marginTop: "0.15rem" }}>
                                  {med.notes.length > 35 ? `${med.notes.substring(0, 35)}...` : med.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "1rem", fontSize: "0.9rem", color: "#1E293B", fontWeight: 500 }}>
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

                        <td style={{ padding: "1rem", fontSize: "0.85rem", color: "#1E293B" }}>
                          <span style={{ 
                            padding: "0.25rem 0.65rem", 
                            borderRadius: "6px", 
                            background: "#F8FAFC", 
                            fontSize: "0.8rem",
                            border: "1px solid #E2E8F0"
                          }}>
                            {med.food_relation}
                          </span>
                        </td>

                        <td style={{ padding: "1rem", fontSize: "0.8rem", color: "#64748B" }}>
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

                        <td style={{ padding: "1rem", textAlign: "right", borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}>
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", alignItems: "center" }}>
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
                      <td colSpan="8" style={{ textAlign: "center", padding: "3rem 2rem", color: "#64748B" }}>
                        <Pill size={36} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
                        <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>No medications found matching your criteria.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* DELETE CONFIRMATION DIALOG MODAL */}
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
            border: "1px solid #E2E8F0",
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

            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.35rem", fontWeight: 800, color: "#1E293B" }}>
              Delete Medicine
            </h3>

            <p style={{ margin: "0 0 1.75rem", fontSize: "0.92rem", color: "#64748B", lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this medicine?
            </p>

            {deletingMed && (
              <div style={{ 
                background: "#F8FAFC", 
                padding: "0.75rem 1rem", 
                borderRadius: "10px", 
                marginBottom: "1.5rem",
                fontSize: "0.88rem",
                color: "#1E293B",
                border: "1px solid #E2E8F0"
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowOcrModal(true)}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                >
                  <Sparkles size={14} style={{ marginRight: "0.25rem" }} /> Scan OCR
                </button>
                <X size={20} style={{ cursor: "pointer", color: "#64748B" }} onClick={() => setShowAddModal(false)} />
              </div>
            </div>

            <form onSubmit={handleAddMedicine}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Medicine Name (Validated Master Database)</label>
                <MedicineSearchInput
                  value={medName}
                  onChange={(val) => setMedName(val)}
                  onSelectMedicine={(item) => {
                    setMedName(item.name);
                    if (item.strength && item.unit) {
                      setMedDosage(`${item.strength}${item.unit}`);
                    }
                  }}
                />
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
                      <span style={{ fontSize: "0.85rem", color: "#64748B", width: "60px" }}>Time {index + 1}:</span>
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
              <X size={20} style={{ cursor: "pointer", color: "#64748B" }} onClick={() => setShowEditModal(false)} />
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
                      <span style={{ fontSize: "0.85rem", color: "#64748B", width: "60px" }}>Time {index + 1}:</span>
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

      {/* Module 3 OCR Prescription Upload Modal */}
      <PrescriptionUploadModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onExtractedMedicines={(extracted) => {
          setMedName(extracted.name);
          setMedDosage(extracted.dosage);
          if (extracted.frequency) {
            setMedFrequency(extracted.frequency);
          }
          setShowAddModal(true);
        }}
      />

      {/* Module 4 Drug Interaction Warning Modal */}
      {interactionWarnings.length > 0 && (
        <DrugInteractionModal
          interactions={interactionWarnings}
          onConfirm={() => {
            if (pendingSavePayload) {
              executeSaveMedicine(pendingSavePayload);
            }
          }}
          onCancel={() => {
            setInteractionWarnings([]);
            setPendingSavePayload(null);
          }}
        />
      )}
    </div>
  );
};

export default PatientDashboard;
