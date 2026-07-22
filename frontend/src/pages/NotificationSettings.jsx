import React, { useEffect, useState } from "react";
import { medicineService } from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const NotificationSettings = ({ auth }) => {
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState("Daily");
  const [phoneNumber, setPhoneNumber] = useState("");

  // SMS status panel fields
  const [lastSmsSent, setLastSmsSent] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [messageSid, setMessageSid] = useState("");
  const [smsRecipient, setSmsRecipient] = useState("");
  const [smsError, setSmsError] = useState("");

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
    setSmsEnabled(data.sms_enabled ?? false);
    setBrowserNotifications(data.browser_notifications ?? true);
    setNotificationFrequency(data.notification_frequency || "Daily");
    setPhoneNumber(data.phone_number || data.phone || "");
    setLastSmsSent(data.last_sms_sent ? new Date(data.last_sms_sent).toLocaleString() : "No SMS sent yet");
    setDeliveryStatus(data.delivery_status || "Not configured");
    setMessageSid(data.sms_message_sid || "");
    setSmsRecipient(data.sms_recipient || "");
    setSmsError(data.sms_error || "");
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
    e.preventDefault();
    console.log("[NotificationSettings] Save Preferences clicked.");
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (smsEnabled && !phoneNumber) {
      setErrorMsg("Phone number is required when SMS reminders are enabled.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        phone_number: phoneNumber || null,
        phone: phoneNumber || null,
        sms_enabled: smsEnabled,
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

  const handleTestSMS = async () => {
    console.log("[NotificationSettings] Send Test SMS clicked.");
    setTesting(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (!phoneNumber) {
      setErrorMsg("Please enter and save a valid phone number before sending a test SMS.");
      setTesting(false);
      return;
    }

    try {
      console.log("[NotificationSettings] POST test-sms...");
      const res = await medicineService.sendTestSMS();
      console.log("[NotificationSettings] Test SMS response:", res);

      setSuccessMsg(
        `✓ Real SMS sent via Twilio! SID: ${res.sid || "—"} | Status: ${res.delivery_status || "queued"} | To: ${res.recipient || phoneNumber}`
      );
      setMessageSid(res.sid || "");
      setDeliveryStatus(res.delivery_status || "queued");
      setSmsRecipient(res.recipient || phoneNumber);
      setSmsError("");
      setLastSmsSent(new Date().toLocaleString());
    } catch (err) {
      const parsed = parseErrorMessage(err);
      setErrorMsg(`SMS failed: ${parsed}`);
    } finally {
      setTesting(false);
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

  // Determine status badge colour
  const statusOk = ["queued", "sent", "delivered"].includes((deliveryStatus || "").toLowerCase());

  return (
    <div className="app-container">
      <Sidebar role={auth.role} email={auth.email} />
      <div className="main-content">
        <Navbar pageTitle="Notification & SMS Settings" />

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
                Enable SMS reminders to receive real Twilio SMS messages on your registered mobile number
                whenever your medicine schedule is due.
              </p>

              <form onSubmit={handleSave}>
                <div className="form-group" style={{ marginBottom: "1.5rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={smsEnabled}
                      onChange={(e) => setSmsEnabled(e.target.checked)}
                      style={{ width: "1.2rem", height: "1.2rem" }}
                      disabled={saving || testing}
                    />
                    Enable SMS Reminders (Twilio Live)
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

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", color: "var(--text-light)", cursor: "not-allowed" }}>
                    <input
                      type="checkbox"
                      disabled
                      style={{ width: "1.2rem", height: "1.2rem" }}
                    />
                    <span>Enable Email Reminders <small style={{ background: "var(--border-strong)", color: "var(--text-secondary)", padding: "2px 6px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700 }}>Coming Soon</small></span>
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

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label">Mobile Number (E.164 Format)</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +919988776601 or +19566732072"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required={smsEnabled}
                    disabled={saving || testing}
                  />
                  <small style={{ color: "var(--text-light)" }}>
                    Format: +[Country Code][Number] — e.g. +919988776601 (India) or +12025550123 (USA)
                  </small>
                </div>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button type="submit" className="btn btn-primary" disabled={saving || testing}>
                    {saving ? "Saving..." : "Save Preferences"}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestSMS}
                    className="btn btn-secondary"
                    disabled={saving || testing || !phoneNumber}
                    title={!phoneNumber ? "Enter a phone number first" : "Send a real test SMS via Twilio"}
                  >
                    {testing ? "Sending via Twilio..." : "Send Test SMS"}
                  </button>
                </div>
              </form>
            </div>

            {/* ── Twilio Status Panel ── */}
            <div className="card col-span-1" style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
              <h3 className="card-title" style={{ color: "var(--text-primary)" }}>Twilio SMS Status</h3>

              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <span className="info-label-block" style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Delivery Status</span>
                  <span className={`badge ${statusOk ? "badge-success" : deliveryStatus === "failed" ? "badge-danger" : "badge-secondary"}`}>
                    {deliveryStatus || "Not configured"}
                  </span>
                </div>

                {messageSid && (
                  <div>
                    <span className="info-label-block" style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Message SID</span>
                    <code style={{ fontSize: "0.8rem", background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", wordBreak: "break-all" }}>
                      {messageSid}
                    </code>
                  </div>
                )}

                {smsRecipient && (
                  <div>
                    <span className="info-label-block" style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Last Sent To</span>
                    <span style={{ fontSize: "0.9rem" }}>{smsRecipient}</span>
                  </div>
                )}

                <div>
                  <span className="info-label-block" style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Last SMS Time</span>
                  <span style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>{lastSmsSent}</span>
                </div>

                {smsError && (
                  <div>
                    <span className="info-label-block" style={{ fontSize: "0.75rem", color: "var(--text-light)", display: "block" }}>Last Error</span>
                    <span style={{ fontSize: "0.8rem", color: "#dc2626", wordBreak: "break-word" }}>{smsError}</span>
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
