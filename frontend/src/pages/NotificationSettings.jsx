import React, { useEffect, useState } from "react";
import { medicineService, userService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const NotificationSettings = ({ auth, setAuth }) => {
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState("Daily");
  
  // New States for use_primary_email and reminder_email
  const [usePrimaryEmail, setUsePrimaryEmail] = useState(true);
  const [reminderEmail, setReminderEmail] = useState("");
  
  // States for editing Primary Email
  const [isEditingPrimaryEmail, setIsEditingPrimaryEmail] = useState(false);
  const [newPrimaryEmail, setNewPrimaryEmail] = useState(auth.email || "");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Email status panel fields
  const [lastEmailSent, setLastEmailSent] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [smtpServer, setSmtpServer] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailError, setEmailError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [emailUpdateSuccess, setEmailUpdateSuccess] = useState("");
  const [emailUpdateError, setEmailUpdateError] = useState("");

  // Safely parse error details
  const parseErrorMessage = (err) => {
    console.error("[NotificationSettings] Request failed:", err);
    if (err.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return detail.map((d) => `${d.loc ? d.loc.join(".") : ""}: ${d.msg}`).join(", ");
      return JSON.stringify(detail);
    }
    return err.message || "An unexpected error occurred.";
  };

  const populateFromData = (data) => {
    setEmailEnabled(data.email_enabled ?? false);
    setBrowserNotifications(data.browser_notifications ?? true);
    setNotificationFrequency(data.notification_frequency || "Daily");
    setUsePrimaryEmail(data.use_primary_email ?? true);
    setReminderEmail(data.reminder_email || "");
    setLastEmailSent(data.last_email_sent ? new Date(data.last_email_sent).toLocaleString() : "No Email sent yet");
    setDeliveryStatus(data.delivery_status || "Not configured");
    setSmtpServer(data.email_message_sid || "Gmail-SMTP");
    setEmailRecipient(data.email_recipient || "");
    setEmailError(data.email_error || "");
  };

  const fetchSettings = async () => {
    console.log("[NotificationSettings] Fetching settings...");
    try {
      const data = await medicineService.getNotificationSettings();
      console.log("[NotificationSettings] Settings loaded:", data);
      populateFromData(data);
    } catch (err) {
      setErrorMsg(`Failed to load settings: ${parseErrorMessage(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    setNewPrimaryEmail(auth.email || "");
  }, [auth.email]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    console.log("[NotificationSettings] Save Preferences clicked.");
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    // Validate custom email if usePrimaryEmail is OFF
    if (emailEnabled && !usePrimaryEmail && !reminderEmail) {
      setErrorMsg("A custom reminder email is required when Email Reminders are enabled and 'Use Primary Email' is toggled off.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        use_primary_email: usePrimaryEmail,
        reminder_email: usePrimaryEmail ? auth.email : reminderEmail,
        email_enabled: emailEnabled,
        browser_notifications: browserNotifications,
        notification_frequency: notificationFrequency,
        notification_preference: notificationFrequency,
      };
      console.log("[NotificationSettings] PUT payload:", payload);
      const updated = await medicineService.updateNotificationSettings(payload);
      console.log("[NotificationSettings] PUT response:", updated);
      setSuccessMsg("Notification preferences saved successfully.");
      populateFromData(updated);
    } catch (err) {
      setErrorMsg(`Save failed: ${parseErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    console.log("[NotificationSettings] Send Test Email clicked.");
    setTesting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      console.log("[NotificationSettings] POST test-email...");
      const res = await medicineService.sendTestEmail();
      console.log("[NotificationSettings] Test Email response:", res);

      setSuccessMsg(
        `✓ Real verification email sent successfully! Status: ${res.delivery_status || "sent"} | To: ${res.recipient}`
      );
      setSmtpServer(res.provider || "Gmail-SMTP");
      setDeliveryStatus(res.delivery_status || "sent");
      setEmailRecipient(res.recipient);
      setEmailError("");
      setLastEmailSent(new Date().toLocaleString());
    } catch (err) {
      const parsed = parseErrorMessage(err);
      setErrorMsg(`Email failed: ${parsed}`);
    } finally {
      setTesting(false);
    }
  };

  const handleUpdatePrimaryEmail = async (e) => {
    e.preventDefault();
    setEmailUpdateError("");
    setEmailUpdateSuccess("");
    setUpdatingEmail(true);

    // Simple format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newPrimaryEmail)) {
      setEmailUpdateError("Invalid email format.");
      setUpdatingEmail(false);
      return;
    }

    if (!confirmPassword) {
      setEmailUpdateError("Current password is required to update email address.");
      setUpdatingEmail(false);
      return;
    }

    try {
      const res = await userService.updateEmail(newPrimaryEmail, confirmPassword);
      setEmailUpdateSuccess("Primary Email updated successfully!");
      setIsEditingPrimaryEmail(false);
      setConfirmPassword("");
      
      // Update global context & localStorage
      localStorage.setItem("email", newPrimaryEmail);
      if (setAuth) {
        setAuth((prev) => ({ ...prev, email: newPrimaryEmail }));
      }
    } catch (err) {
      setEmailUpdateError(parseErrorMessage(err));
    } finally {
      setUpdatingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <Sidebar role={auth.role} email={auth.email} />
        <div className="main-content flex-center"><div className="spinner" /></div>
      </div>
    );
  }

  const statusOk = ["queued", "sent", "delivered"].includes((deliveryStatus || "").toLowerCase());

  return (
    <div className="app-container">
      <Sidebar role={auth.role} email={auth.email} />
      <div className="main-content">
        <Navbar pageTitle="Notification & Email Settings" />

        <main className="content-area">
          {successMsg && (
            <div className="alert alert-success" style={{ marginBottom: "1rem", wordBreak: "break-all" }}>
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="alert alert-danger" style={{ marginBottom: "1rem", wordBreak: "break-all" }}>
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-3">
            {/* ── Preferences Form ── */}
            <div className="card col-span-2">
              <h3 className="card-title">Configure Notification Preferences</h3>
              <p style={{ color: "var(--text-light)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                Enable email notifications to receive automatic medicine alerts on your primary account email address
                whenever your medicine schedule is due.
              </p>

              {/* Primary Email Editor */}
              <div className="form-group" style={{ background: "var(--bg-secondary)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: "600" }}>Primary Account Email</label>
                  {!isEditingPrimaryEmail && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewPrimaryEmail(auth.email || "");
                        setConfirmPassword("");
                        setEmailUpdateError("");
                        setEmailUpdateSuccess("");
                        setIsEditingPrimaryEmail(true);
                      }}
                      className="btn-link"
                      style={{ fontSize: "0.85rem", background: "none", border: "none", color: "var(--primary-color)", cursor: "pointer", fontWeight: "bold" }}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                {emailUpdateSuccess && (
                  <div className="alert alert-success" style={{ fontSize: "0.8rem", padding: "6px 12px", marginBottom: "0.75rem" }}>
                    {emailUpdateSuccess}
                  </div>
                )}
                {emailUpdateError && (
                  <div className="alert alert-danger" style={{ fontSize: "0.8rem", padding: "6px 12px", marginBottom: "0.75rem" }}>
                    {emailUpdateError}
                  </div>
                )}

                {isEditingPrimaryEmail ? (
                  <form onSubmit={handleUpdatePrimaryEmail} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>New Email Address</span>
                      <input
                        type="email"
                        className="form-input"
                        value={newPrimaryEmail}
                        onChange={(e) => setNewPrimaryEmail(e.target.value)}
                        placeholder="Enter new primary email"
                        required
                        disabled={updatingEmail}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>Confirm Account Password</span>
                      <input
                        type="password"
                        className="form-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Verify current password"
                        required
                        disabled={updatingEmail}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                        disabled={updatingEmail}
                      >
                        {updatingEmail ? "Updating..." : "Update Email"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                        onClick={() => setIsEditingPrimaryEmail(false)}
                        disabled={updatingEmail}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <input
                    type="email"
                    className="form-input"
                    value={auth.email || ""}
                    disabled
                    style={{ background: "var(--bg-base)", cursor: "not-allowed", opacity: 0.85 }}
                  />
                )}
              </div>

              {/* Main Preferences Form */}
              <form onSubmit={handleSave}>
                <div className="form-group" style={{ marginBottom: "1.5rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      style={{ width: "1.2rem", height: "1.2rem" }}
                      disabled={saving || testing}
                    />
                    Enable Email Reminders (Gmail SMTP)
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={browserNotifications}
                      onChange={(e) => setBrowserNotifications(e.target.checked)}
                      style={{ width: "1.2rem", height: "1.2rem" }}
                      disabled={saving || testing}
                    />
                    Enable Browser Notifications
                  </label>
                </div>

                {/* Primary Email Toggle */}
                <div className="form-group" style={{ marginBottom: "1.5rem", background: "rgba(0,0,0,0.02)", padding: "1rem", borderRadius: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={usePrimaryEmail}
                      onChange={(e) => setUsePrimaryEmail(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem" }}
                      disabled={saving || testing}
                    />
                    Use Primary Email for Reminders
                  </label>
                  <small style={{ color: "var(--text-light)", display: "block", marginTop: "0.25rem", marginLeft: "1.6rem" }}>
                    When enabled, reminder alerts are automatically redirected to your primary account email.
                  </small>
                </div>

                {/* Optional Custom Email */}
                {!usePrimaryEmail && (
                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label className="form-label">Reminder Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={reminderEmail}
                      onChange={(e) => setReminderEmail(e.target.value)}
                      placeholder="Enter custom reminder email address"
                      disabled={saving || testing}
                      required
                    />
                    <small style={{ color: "var(--text-light)", marginTop: "0.25rem", display: "block" }}>
                      Emails will be delivered here for all active medication tracking schedules.
                    </small>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                  <label className="form-label">Reminder Frequency</label>
                  <select
                    className="form-input"
                    value={notificationFrequency}
                    onChange={(e) => setNotificationFrequency(e.target.value)}
                    disabled={saving || testing}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button type="submit" className="btn btn-primary" disabled={saving || testing}>
                    {saving ? "Saving..." : "Save Preferences"}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    className="btn btn-secondary"
                    disabled={saving || testing}
                    title="Send a real test email via Gmail SMTP"
                  >
                    {testing ? "Sending via SMTP..." : "Send Test Email"}
                  </button>
                </div>
              </form>
            </div>

            {/* ── Email Status Panel ── */}
            <div className="card col-span-1" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
              <h3 className="card-title" style={{ color: "var(--text-primary)" }}>Gmail SMTP Status</h3>

              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <span className="info-label-block" style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Connection Status</span>
                  <span className={`badge ${statusOk ? "badge-success" : deliveryStatus === "failed" ? "badge-danger" : "badge-secondary"}`}>
                    {deliveryStatus || "Not configured"}
                  </span>
                </div>

                {smtpServer && (
                  <div>
                    <span className="info-label-block" style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Email Provider</span>
                    <code style={{ fontSize: "0.8rem", background: "var(--bg-base)", padding: "2px 6px", borderRadius: "4px", wordBreak: "break-all" }}>
                      {smtpServer}
                    </code>
                  </div>
                )}

                <div>
                  <span className="info-label-block" style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Recipient Email</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", wordBreak: "break-all" }}>
                    {usePrimaryEmail ? auth.email : (reminderEmail || auth.email)}
                  </span>
                </div>

                <div>
                  <span className="info-label-block" style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Last Email Sent</span>
                  <span style={{ fontSize: "0.85rem", fontFamily: "monospace", color: "var(--text-primary)" }}>{lastEmailSent}</span>
                </div>

                {emailError && (
                  <div>
                    <span className="info-label-block" style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Last Error</span>
                    <span style={{ fontSize: "0.8rem", color: "#dc2626", wordBreak: "break-word" }}>{emailError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationSettings;
