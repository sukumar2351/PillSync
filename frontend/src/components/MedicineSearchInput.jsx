import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { medicineMasterService } from "../services/api";

const MedicineSearchInput = ({ value, onChange, onSelectMedicine }) => {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); // { success: bool, msg: str }
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 1 && isOpen) {
        setIsLoading(true);
        medicineMasterService
          .search(query)
          .then((res) => {
            setSuggestions(res || []);
          })
          .catch(() => setSuggestions([]))
          .finally(() => setIsLoading(false));
      } else {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
    setRequestStatus(null);
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    onChange(item.name);
    if (onSelectMedicine) onSelectMedicine(item);
    setIsOpen(false);
  };

  const handleRequestNew = async () => {
    if (!query.trim()) return;
    try {
      setIsLoading(true);
      await medicineMasterService.requestMedicine({
        name: query.trim(),
        generic_name: query.trim(),
        medicine_type: "Tablet"
      });
      setRequestStatus({ success: true, msg: `Request submitted for "${query.trim()}". Pending admin review!` });
      setIsOpen(false);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to submit request.";
      setRequestStatus({ success: false, msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search medicine master database (e.g. Paracetamol, Dolo 650)..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          required
          style={{ paddingLeft: "2.5rem" }}
        />
        <Search
          size={18}
          color="#64748B"
          style={{ position: "absolute", left: "0.85rem", pointerEvents: "none" }}
        />
      </div>

      {requestStatus && (
        <div
          style={{
            marginTop: "0.5rem",
            fontSize: "0.82rem",
            padding: "0.4rem 0.75rem",
            borderRadius: "8px",
            background: requestStatus.success ? "#F0FDF4" : "#FEF2F2",
            color: requestStatus.success ? "#166534" : "#991B1B",
            border: `1px solid ${requestStatus.success ? "#BBF7D0" : "#FECACA"}`
          }}
        >
          {requestStatus.msg}
        </div>
      )}

      {isOpen && (query.trim().length > 0) && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            border: "1px solid #E2E8F0",
            marginTop: "0.35rem",
            maxHeight: "240px",
            overflowY: "auto"
          }}
        >
          {isLoading && (
            <div style={{ padding: "0.85rem", textAlign: "center", color: "#64748B", fontSize: "0.85rem" }}>
              Searching Medicine Master...
            </div>
          )}

          {!isLoading && suggestions.length > 0 && (
            suggestions.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{
                  padding: "0.75rem 1rem",
                  cursor: "pointer",
                  borderBottom: "1px solid #F1F5F9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
                className="hover-card"
              >
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "#1E293B", display: "block" }}>{item.name}</strong>
                  <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                    {item.generic_name} • {item.category || item.medicine_type || "Medication"}
                  </span>
                </div>
                <span className="badge badge-primary" style={{ fontSize: "0.7rem" }}>Verified</span>
              </div>
            ))
          )}

          {!isLoading && suggestions.length === 0 && (
            <div style={{ padding: "1rem", textAlign: "center" }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#64748B" }}>
                No exact match found in approved database for "{query}".
              </p>
              <button
                type="button"
                onClick={handleRequestNew}
                className="btn btn-secondary"
                style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
              >
                <Plus size={14} style={{ marginRight: "0.3rem" }} /> Request Admin Approval for "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicineSearchInput;
