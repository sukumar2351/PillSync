import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ArrowLeft, Mail, Phone, MapPin, Send, HelpCircle, CheckCircle, ChevronDown, Clock, BookOpen, User
} from "lucide-react";

const Section = ({ children, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.8, ease: "easeInOut" }}
    style={style}
  >
    {children}
  </motion.div>
);

const FAQS = [
  { q: "How do I link a caregiver to my account?", a: "Go to your Profile settings, click the Caregiver Link option, enter your caregiver's registered email, and verify. Once validated, they will gain access to your adherence metrics." },
  { q: "Why did my SMS reminder fail?", a: "SMS reminders require a valid phone number formatted in E.164 (e.g., +919988776601). If you are using a Twilio Trial account, the destination number must also be verified in the Twilio Console." },
  { q: "Can I manage multiple medication timings?", a: "Yes, you can schedule doses for Morning, Afternoon, Evening, or Night. The dashboard generates logs for each active slot separately." },
  { q: "Is browser push notification secure?", a: "Yes. Push notifications run inside your local browser context using standard web notification APIs. No private information is sent over third-party notification networks." },
];

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const temp = {};
    if (!name.trim()) temp.name = "Name is required";
    if (!email) {
      temp.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      temp.email = "Invalid email format";
    }
    if (!message.trim()) temp.message = "Message is required";
    
    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSuccess(true);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingTop: 68 }}>
      
      {/* Hero */}
      <section style={{
        background: "linear-gradient(160deg, #060a14 0%, #0d1a35 60%, #0a1628 100%)",
        padding: "5rem 2rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "30%", left: "15%", width: 300, height: 300, borderRadius: "50%", background: "rgba(34,197,94,0.08)", filter: "blur(80px)" }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#06B6D4", marginBottom: "1rem" }}>Support Channels</p>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "white", letterSpacing: "-0.04em", marginBottom: "1.5rem", lineHeight: 1.1 }}>
            Contact Us
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(148,163,184,0.9)", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
            If you have any questions, suggestions, or feedback about PillSync, feel free to contact me.
          </p>
        </motion.div>
      </section>

      {/* Main Grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", marginBottom: "5rem" }}>
          
          {/* Contact Details */}
          <Section>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "2.5rem", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontWeight: 850, marginBottom: "1.5rem", fontSize: "1.25rem", letterSpacing: "-0.02em" }}>Developer Profile</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {[
                    { icon: <User size={18} />, label: "Developer", val: "Sukumar Karnam" },
                    { icon: <Phone size={18} />, label: "Phone", val: "+91 XXXXXXXXXX" },
                    { icon: <Mail size={18} />, label: "Email", val: "your_email@example.com" },
                    { icon: <BookOpen size={18} />, label: "College / Education", val: "BCA Student · Nalanda Degree College" }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <div style={{ color: "var(--primary)", marginTop: "2px" }}>{item.icon}</div>
                      <div>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-light)", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>{item.label}</p>
                        <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600, margin: 0 }}>{item.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "1rem", alignItems: "center" }}>
                <Clock size={18} style={{ color: "var(--primary)" }} />
                <div>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-light)", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Working Hours</p>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600, margin: 0 }}>Monday - Saturday (9:00 AM - 6:00 PM)</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Form */}
          <Section>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "2.5rem" }}>
              <h3 style={{ fontWeight: 850, marginBottom: "1.5rem", fontSize: "1.25rem", letterSpacing: "-0.02em" }}>Send Message</h3>

              {success && (
                <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
                  <CheckCircle size={16} />
                  <span>Message sent! We'll reply within 24 hours.</span>
                </div>
              )}

              <form onSubmit={handleSend} noValidate>
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className={`form-input ${errors.name ? "is-invalid" : ""}`}
                    placeholder="Sukumar Karnam"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <div className="form-error-msg">{errors.name}</div>}
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className={`form-input ${errors.email ? "is-invalid" : ""}`}
                    placeholder="your_email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <div className="form-error-msg">{errors.email}</div>}
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="General Inquiry / Feedback"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label">Message</label>
                  <textarea
                    className={`form-input ${errors.message ? "is-invalid" : ""}`}
                    rows={4}
                    placeholder="Describe your issue or query..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  {errors.message && <div className="form-error-msg">{errors.message}</div>}
                </div>

                <button type="submit" className="btn btn-primary btn-block flex-center" style={{ padding: "0.8rem" }}>
                  <span>Send Message</span>
                  <Send size={16} style={{ marginLeft: "6.5px" }} />
                </button>
              </form>
            </div>
          </Section>
        </div>

        {/* FAQs */}
        <Section>
          <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 20, padding: "2.5rem" }}>
            <h3 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "1.5rem" }}>FAQ Corner</h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {FAQS.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <footer style={{ background: "#060a14", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#475569", fontSize: "0.85rem" }}>© 2026 PillSync. All rights reserved. | <Link to="/" style={{ color: "#06B6D4" }}>Return to Home</Link></p>
      </footer>
    </div>
  );
};

// FAQ Item component
const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "1rem 0" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          textAlign: "left", color: "var(--text-primary)"
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{q}</span>
        <ChevronDown size={18} style={{ color: "var(--text-light)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, marginTop: "0.75rem", marginBottom: 0 }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Contact;
