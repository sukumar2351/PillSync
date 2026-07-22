import React, { useEffect, useState } from "react";
import { medicineService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const NotificationSettings = ({ auth }) => {
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState("Daily");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState("");

  // Email status panel fields
  const [lastEmailSent, setLastEmailSent] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [smtpServer, setSmtpServer] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailError, setEmailError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Safely parse error details to prevent JSX object-rendering crashes
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
    const dbEmail = data.notification_email || auth.email || "";
    setNotificationEmail(dbEmail);
    setTempEmail(dbEmail);
    setLastEmailSent(data.last_email_sent ? new Date(data.last_email_sent).toLocaleString() : "No Email sent yet");
    setDeliveryStatus(data.delivery_status || "Not configured");
    setSmtpServer(data.email_message_sid || "Gmail-SMTP");
    setEmailRecipient(data.email_recipient || dbEmail);
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

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    console.log("[NotificationSettings] Save Preferences clicked.");
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    // Validate email if enabled
    if (emailEnabled && !notificationEmail) {
      setErrorMsg("A valid notification email is required when email reminders are enabled.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        notification_email: notificationEmail || auth.email,
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
      setIsEditingEmail(false);
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
        `✓ Real verification email sent successfully! Status: ${res.delivery_status || "sent"} | To: ${res.recipient || notificationEmail}`
      );
      setSmtpServer(res.provider || "Gmail-SMTP");
      setDeliveryStatus(res.delivery_status || "sent");
      setEmailRecipient(res.recipient || notificationEmail);
      setEmailError("");
      setLastEmailSent(new Date().toLocaleString());
    } catch (err) {
      const parsed = parseErrorMessage(err);
      setErrorMsg(`Email failed: ${parsed}`);
    } finally {
      setTesting(false);
    }
  };

  const handleUseProfileEmail = () => {
    setNotificationEmail(auth.email);
    setTempEmail(auth.email);
    setSuccessMsg("Reset to your account login email. Make sure to click Save Preferences!");
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
                Enable email notifications to receive automatic medicine alerts on your registered email address
                whenever your medicine schedule is due.
              </p>

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

                {/* Editable Registered Notification Email Section */}
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <label className="form-label" style={{ margin: 0 }}>Registered Notification Email</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={handleUseProfileEmail}
                        className="btn-link"
                        style={{ fontSize: "0.75rem", background: "none", border: "none", color: "var(--primary-color)", cursor: "pointer", textDecoration: "underline" }}
                      >
                        Use Profile Email
                      </button>
                      {!isEditingEmail && (
                        <button
                          type="button"
                          onClick={() => {
                            setTempEmail(notificationEmail);
                            setIsEditingEmail(true);
                          }}
                          className="btn-link"
                          style={{ fontSize: "0.75rem", background: "none", border: "none", color: "var(--primary-color)", cursor: "pointer", fontWeight: "bold" }}
                        >
                          ✎ Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingEmail ? (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="email"
                        className="form-input"
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        placeholder="Enter notification email address"
                        style={{ flex: 1 }}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setNotificationEmail(tempEmail);
                          setIsEditingEmail(false);
                        }}
                        style={{ padding: "0 1rem" }}
                      >
                        Ok
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setTempEmail(notificationEmail);
                          setIsEditingEmail(false);
                        }}
                        style={{ padding: "0 1rem", background: "var(--border)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <input
                      type="email"
                      className="form-input"
                      value={notificationEmail}
                      disabled
                      style={{ background: "var(--bg-secondary)", cursor: "not-allowed", opacity: 0.85 }}
                    />
                  )}
                  <small style={{ color: "var(--text-light)", marginTop: "0.25rem", display: "block" }}>
                    Emails will be delivered here for all active medication tracking schedules.
                  </small>
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

                {emailRecipient && (
                  <div>
                    <span className="info-label-block" style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Registered Email</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{emailRecipient}</span>
                  </div>
                )}

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
