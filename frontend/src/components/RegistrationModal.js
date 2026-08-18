import React, { useState } from "react";
import api from "../api/axios";
import "./RegistrationModal.css";

export default function RegistrationModal({ clubId, clubName, onClose, onSuccess }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getYearLabel = (y) => {
    if (String(y) === "1") return "FE (First Year)";
    if (String(y) === "2") return "SE (Second Year)";
    if (String(y) === "3") return "TE (Third Year)";
    if (String(y) === "4") return "BE (Final / Fourth Year)";
    return y ? `${y} Year` : "Not Specified";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 10) {
      setError("Please provide a valid motivation / reason (at least 10 characters).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/clubs/${clubId}/join`,
        {
          reason: reason.trim(),
          department: user?.department || "General",
          year: user?.year || "1"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onSuccess) {
        onSuccess(`Successfully applied to join ${clubName}!`);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Apply to Join {clubName}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        {/* Read-Only Student Account Profile Summary */}
        <div className="applicant-details-card">
          <div className="applicant-detail-item">
            <span className="detail-label">Applicant Name</span>
            <span className="detail-value">{user?.name || "Student"}</span>
          </div>
          <div className="applicant-detail-item">
            <span className="detail-label">College Email</span>
            <span className="detail-value">{user?.email || "N/A"}</span>
          </div>
          <div className="applicant-detail-item">
            <span className="detail-label">Department</span>
            <span className="detail-value badge-highlight">{user?.department || "N/A"}</span>
          </div>
          <div className="applicant-detail-item">
            <span className="detail-label">Year of Study</span>
            <span className="detail-value badge-highlight">{getYearLabel(user?.year)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Why do you want to join this club? *</label>
            <textarea
              rows="4"
              placeholder="Briefly state your motivation, skills, or interest in this club..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Submitting Application..." : "Submit Join Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
