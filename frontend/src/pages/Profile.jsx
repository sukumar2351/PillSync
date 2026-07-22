import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { authService, userService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

// ── Form Input Wrapper (with staggers, 3D lift, and focus glow scaling) ──
const AnimatedFormGroup = ({ children, delay, error }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => setIsFocused(false)}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        transformOrigin: "center left",
        transition: "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease",
        transform: isFocused ? "scale(1.02)" : "scale(1)",
        zIndex: isFocused ? 5 : 1,
      }}
      className={error ? "shake-error" : ""}
    >
      {children}
    </motion.div>
  );
};

// ── Letter Stagger for the Header Title ──
const StaggeredTitle = ({ text }) => {
  const letters = Array.from(text);
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };
  const item = {
    hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5 } }
  };

  return (
    <motion.h2
      variants={container}
      initial="hidden"
      animate="visible"
      style={{ fontSize: "1.85rem", fontWeight: 900, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.03em" }}
    >
      {letters.map((char, idx) => (
        <motion.span key={idx} variants={item} style={{ display: "inline-block" }}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.h2>
  );
};

const Profile = ({ auth }) => {
  const [profileData, setProfileData] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Mouse tilt mechanics for 3D parallax card
  const cardRef = useRef(null);
  const rotateX = useSpring(0, { damping: 25, stiffness: 120 });
  const rotateY = useSpring(0, { damping: 25, stiffness: 120 });
  const translateZ = useSpring(0, { damping: 25, stiffness: 120 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    // Scale down the rotation to max 4.5 degrees for subtle parallax depth
    const rX = -(mouseY / (height / 2)) * 4.5;
    const rY = (mouseX / (width / 2)) * 4.5;
    
    rotateX.set(rX);
    rotateY.set(rY);
    translateZ.set(20); // Move closer in Z space
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    translateZ.set(0); // Reset Z depth
  };

  // Auto-hide success toast after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserEmail(user.email);
        
        const profile = user.profile || {};
        setProfileData(profile);
        
        // Populate form states
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setAge(profile.age !== null && profile.age !== undefined ? String(profile.age) : "");
        setGender(profile.gender || "");
        setBloodGroup(profile.blood_group || "");
        setAddress(profile.address || "");
        setEmergencyContact(profile.emergency_contact || "");
      } catch (err) {
        setErrorMsg("Failed to load user profile details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validate = () => {
    const tempErrors = {};
    
    if (!fullName.trim()) {
      tempErrors.fullName = "Full name is required";
    }

    if (phone) {
      const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");
      if (!/^\d+$/.test(cleanPhone) || cleanPhone.length < 10 || cleanPhone.length > 15) {
        tempErrors.phone = "Phone number must contain between 10 and 15 digits";
      }
    }

    if (age) {
      const parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120) {
        tempErrors.age = "Age must be a valid integer between 0 and 120";
      }
    }

    if (auth.role === "patient" && bloodGroup) {
      const allowed = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
      if (!allowed.includes(bloodGroup.toUpperCase())) {
        tempErrors.bloodGroup = "Invalid blood group (e.g. A+, O-, AB+)";
      }
    }

    if (auth.role === "patient" && emergencyContact) {
      if (emergencyContact.trim().length < 2) {
        tempErrors.emergencyContact = "Emergency contact detail must be at least 2 characters";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!validate()) return;

    setIsSaving(true);
    try {
      const updatePayload = {
        full_name: fullName,
        phone: phone || null,
        age: age ? parseInt(age, 10) : null,
        gender: gender || null,
        address: address || null,
      };

      if (auth.role === "patient") {
        updatePayload.blood_group = bloodGroup.toUpperCase() || null;
        updatePayload.emergency_contact = emergencyContact || null;
      }

      await userService.updateProfile(updatePayload);
      setSuccessMsg("Profile saved successfully!");
      
      // Update local profile representation
      setProfileData({ ...profileData, ...updatePayload });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg("Failed to update profile. Check server connections.");
      }
    } finally {
      setIsSaving(false);
    }
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

  // Admin cannot edit a profile (since admins do not have patient/caregiver records)
  if (auth.role === "admin") {
    return (
      <div className="app-container">
        <Sidebar role={auth.role} email={auth.email} />
        <div className="main-content">
          <main className="content-area">
            <div className="card">
              <h3 className="card-title">Account Details</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                Administrators do not have Patient or Caregiver profiles.
              </p>
              <div className="info-list" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                  <strong>Role:</strong> <span style={{ textTransform: "capitalize" }}>{auth.role}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                  <strong>Email:</strong> <span>{userEmail}</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container profile-page-layout">
      
      <Sidebar role={auth.role} email={auth.email} />
      
      {/* Scrollable Right Panel Area */}
      <div className="main-content profile-scrollable-content">
        
        <main className="content-area" style={{ position: "relative", paddingBottom: "4rem" }}>
          
          {/* Subtle Background Lighting Orbs */}
          <div style={{ position: "absolute", top: "-5%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "rgba(37,99,235,0.05)", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "absolute", bottom: "15%", left: "5%", width: 250, height: 250, borderRadius: "50%", background: "rgba(6,182,212,0.04)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />

          {/* Header Title Block */}
          <div style={{ marginBottom: "2rem", position: "relative", zIndex: 2 }}>
            <StaggeredTitle text="Manage Profile" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.0 }}
              style={{ fontSize: "0.85rem", color: "var(--text-light)", marginTop: "0.35rem" }}
            >
              Update your health settings and personal metadata record. Last sync: Monday, July 20, 2026.
            </motion.p>
          </div>

          {/* Success Toast */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="alert alert-success"
                style={{
                  boxShadow: "0 10px 25px rgba(34,197,94,0.15)",
                  borderLeft: "4px solid var(--accent)",
                  borderRadius: "12px",
                  padding: "1rem",
                  position: "relative",
                  zIndex: 10
                }}
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Shake Indicator */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ type: "spring", stiffness: 500 }}
                className="alert alert-danger"
                style={{
                  boxShadow: "0 10px 25px rgba(239,68,68,0.15)",
                  borderLeft: "4px solid var(--error-color)",
                  borderRadius: "12px",
                  padding: "1rem",
                  position: "relative",
                  zIndex: 10
                }}
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Perspective Card Wrapper */}
          <div style={{ perspective: 1200, width: "100%", position: "relative", zIndex: 2 }}>
            <motion.div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              initial={{ opacity: 0, y: 40, scale: 0.94, rotateX: 10 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              transition={{ duration: 1.0, ease: "easeOut" }}
              style={{
                transformStyle: "preserve-3d",
                rotateX,
                rotateY,
                translateZ,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.06), 0 0 40px rgba(37,99,235,0.02)",
                borderRadius: "24px",
                padding: "2.5rem",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                cursor: "pointer"
              }}
            >
              <h3 className="card-title" style={{ fontWeight: 850, fontSize: "1.15rem", marginBottom: "2rem", letterSpacing: "-0.01em", transform: "translateZ(30px)" }}>
                Personal Metadata Editor
              </h3>
              
              <form onSubmit={handleSave} noValidate style={{ transform: "translateZ(15px)", transformStyle: "preserve-3d" }}>
                <div className="grid grid-cols-2" style={{ gap: "1.5rem" }}>
                  
                  {/* Full Name */}
                  <AnimatedFormGroup delay={0.08} error={errors.fullName}>
                    <label className="form-label" htmlFor="fullname-input">
                      Full Name <span style={{ color: "var(--error-color)" }}>*</span>
                    </label>
                    <input
                      id="fullname-input"
                      type="text"
                      className={`form-input profile-input-element ${errors.fullName ? "is-invalid" : ""}`}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isSaving}
                    />
                    {errors.fullName && <div className="form-error-msg">{errors.fullName}</div>}
                  </AnimatedFormGroup>

                  {/* Email (Read Only) */}
                  <AnimatedFormGroup delay={0.16}>
                    <label className="form-label" htmlFor="email-readonly">
                      Email Address (Primary)
                    </label>
                    <input
                      id="email-readonly"
                      type="text"
                      className="form-input profile-input-element"
                      value={userEmail}
                      disabled={true}
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        cursor: "not-allowed",
                        opacity: 0.7
                      }}
                    />
                  </AnimatedFormGroup>

                  {/* Phone */}
                  <AnimatedFormGroup delay={0.24} error={errors.phone}>
                    <label className="form-label" htmlFor="phone-input">
                      Phone Number
                    </label>
                    <input
                      id="phone-input"
                      type="text"
                      className={`form-input profile-input-element ${errors.phone ? "is-invalid" : ""}`}
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isSaving}
                    />
                    {errors.phone && <div className="form-error-msg">{errors.phone}</div>}
                  </AnimatedFormGroup>

                  {/* Age */}
                  <AnimatedFormGroup delay={0.32} error={errors.age}>
                    <label className="form-label" htmlFor="age-input">
                      Age
                    </label>
                    <input
                      id="age-input"
                      type="number"
                      className={`form-input profile-input-element ${errors.age ? "is-invalid" : ""}`}
                      placeholder="e.g. 35"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      disabled={isSaving}
                    />
                    {errors.age && <div className="form-error-msg">{errors.age}</div>}
                  </AnimatedFormGroup>

                  {/* Gender */}
                  <AnimatedFormGroup delay={0.40}>
                    <label className="form-label" htmlFor="gender-select">
                      Gender
                    </label>
                    <select
                      id="gender-select"
                      className="form-select profile-input-element"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      disabled={isSaving}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </AnimatedFormGroup>

                  {/* Patient specific: Blood Group */}
                  {auth.role === "patient" && (
                    <AnimatedFormGroup delay={0.48} error={errors.bloodGroup}>
                      <label className="form-label" htmlFor="blood-input">
                        Blood Group
                      </label>
                      <input
                        id="blood-input"
                        type="text"
                        className={`form-input profile-input-element ${errors.bloodGroup ? "is-invalid" : ""}`}
                        placeholder="e.g. O+, A-"
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        disabled={isSaving}
                      />
                      {errors.bloodGroup && <div className="form-error-msg">{errors.bloodGroup}</div>}
                    </AnimatedFormGroup>
                  )}

                  {/* Patient specific: Emergency Contact */}
                  {auth.role === "patient" && (
                    <AnimatedFormGroup delay={0.56} error={errors.emergencyContact}>
                      <label className="form-label" htmlFor="emergency-input">
                        Emergency Contact Info
                      </label>
                      <input
                        id="emergency-input"
                        type="text"
                        className={`form-input profile-input-element ${errors.emergencyContact ? "is-invalid" : ""}`}
                        placeholder="Name / Contact Phone"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        disabled={isSaving}
                      />
                      {errors.emergencyContact && <div className="form-error-msg">{errors.emergencyContact}</div>}
                    </AnimatedFormGroup>
                  )}
                </div>

                {/* Address (Full Width) */}
                <AnimatedFormGroup delay={0.64}>
                  <label className="form-label" htmlFor="address-textarea" style={{ marginTop: "1rem" }}>
                    Residential Address
                  </label>
                  <textarea
                    id="address-textarea"
                    className="form-textarea profile-input-element"
                    placeholder="Enter full address detail"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isSaving}
                    style={{ minHeight: "100px" }}
                  />
                </AnimatedFormGroup>

                {/* Save Button with custom glow effects */}
                <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
                  <motion.button
                    type="submit"
                    className="btn btn-primary flex-center save-btn-3d"
                    disabled={isSaving}
                    whileHover={{ scale: 1.05, boxShadow: "0 6px 20px rgba(37,99,235,0.4)", y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    style={{ borderRadius: "12px", padding: "0.65rem 2rem", fontWeight: 700 }}
                  >
                    {isSaving ? (
                      <>
                        <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#fff", marginRight: "6px" }} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17 21 17 13 7 13 7 21"></polyline>
                          <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span>Save Changes</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Desktop & responsive layout overrides ── */
        @media (min-width: 769px) {
          .profile-page-layout {
            display: flex;
            height: 100vh;
            overflow: hidden;
          }
          .profile-scrollable-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow-y: auto;
            min-width: 0;
          }
        }

        /* ── Input custom hover and focus transitions ── */
        .profile-input-element {
          border-radius: 12px !important;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease !important;
        }
        .profile-input-element:hover {
          border-color: rgba(37,99,235,0.4) !important;
          box-shadow: 0 0 8px rgba(37,99,235,0.06);
        }
        .profile-input-element:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.15) !important;
          transform: scale(1.01);
        }

        /* ── Pulsing Online Dot ── */
        .online-pulse-dot {
          animation: pulseOnline 2s infinite;
        }
        @keyframes pulseOnline {
          0% {
            box-shadow: 0 0 0 0 rgba(34,197,94,0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(34,197,94,0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34,197,94,0);
          }
        }

        /* ── Shake errors ── */
        .shake-error {
          animation: shakeProfileGroup 0.5s ease-in-out;
        }
        @keyframes shakeProfileGroup {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}} />
    </div>
  );
};

export default Profile;
