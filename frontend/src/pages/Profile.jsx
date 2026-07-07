import React, { useEffect, useState } from "react";
import { authService, userService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

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
          <Navbar pageTitle="Admin Profile" />
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
    <div className="app-container">
      <Sidebar role={auth.role} email={auth.email} />
      <div className="main-content">
        <Navbar pageTitle="Manage Profile" />
        
        <main className="content-area">
          {successMsg && <div className="alert alert-success">{successMsg}</div>}
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

          <div className="card">
            <h3 className="card-title">Personal Metadata Editor</h3>
            <form onSubmit={handleSave} noValidate>
              <div className="grid grid-cols-2">
                
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="fullname-input">
                    Full Name <span style={{ color: "var(--error-color)" }}>*</span>
                  </label>
                  <input
                    id="fullname-input"
                    type="text"
                    className={`form-input ${errors.fullName ? "is-invalid" : ""}`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSaving}
                  />
                  {errors.fullName && <div className="form-error-msg">{errors.fullName}</div>}
                </div>

                {/* Email (Read Only) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email-readonly">Email Address (Primary)</label>
                  <input
                    id="email-readonly"
                    type="text"
                    className="form-input"
                    value={userEmail}
                    disabled={true}
                    style={{ backgroundColor: "var(--bg-secondary)", cursor: "not-allowed" }}
                  />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="form-label" htmlFor="phone-input">Phone Number</label>
                  <input
                    id="phone-input"
                    type="text"
                    className={`form-input ${errors.phone ? "is-invalid" : ""}`}
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSaving}
                  />
                  {errors.phone && <div className="form-error-msg">{errors.phone}</div>}
                </div>

                {/* Age */}
                <div className="form-group">
                  <label className="form-label" htmlFor="age-input">Age</label>
                  <input
                    id="age-input"
                    type="number"
                    className={`form-input ${errors.age ? "is-invalid" : ""}`}
                    placeholder="e.g. 35"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    disabled={isSaving}
                  />
                  {errors.age && <div className="form-error-msg">{errors.age}</div>}
                </div>

                {/* Gender */}
                <div className="form-group">
                  <label className="form-label" htmlFor="gender-select">Gender</label>
                  <select
                    id="gender-select"
                    className="form-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={isSaving}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Patient specific: Blood Group */}
                {auth.role === "patient" && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="blood-input">Blood Group</label>
                    <input
                      id="blood-input"
                      type="text"
                      className={`form-input ${errors.bloodGroup ? "is-invalid" : ""}`}
                      placeholder="e.g. O+, A-"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      disabled={isSaving}
                    />
                    {errors.bloodGroup && <div className="form-error-msg">{errors.bloodGroup}</div>}
                  </div>
                )}

                {/* Patient specific: Emergency Contact */}
                {auth.role === "patient" && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="emergency-input">Emergency Contact Info</label>
                    <input
                      id="emergency-input"
                      type="text"
                      className={`form-input ${errors.emergencyContact ? "is-invalid" : ""}`}
                      placeholder="Name / Contact Phone"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      disabled={isSaving}
                    />
                    {errors.emergencyContact && <div className="form-error-msg">{errors.emergencyContact}</div>}
                  </div>
                )}
              </div>

              {/* Address (Full Width) */}
              <div className="form-group">
                <label className="form-label" htmlFor="address-textarea">Residential Address</label>
                <textarea
                  id="address-textarea"
                  className="form-textarea"
                  placeholder="Enter full address detail"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary flex-center" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#fff" }} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
