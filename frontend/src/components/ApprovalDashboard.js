import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";
import "./ApprovalDashboard.css";

const ApprovalDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [confirmModal, setConfirmModal] = useState(null); // { req, status }

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const res = await axios.get("/permissions/pending");
      setPendingRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, level, status) => {
    try {
      const requestRemarks = remarks[requestId] || "";
      await axios.post(`/permissions/${requestId}/action`, {
        status,
        remarks: requestRemarks,
        level
      });
      if (status === "approved") {
        toast.success(`Permission request APPROVED! ✅`);
      } else {
        toast.warn(`Permission request REJECTED ❌`);
      }
      setPendingRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      setConfirmModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${status} request`);
      setConfirmModal(null);
    }
  };

  const handleRemarksChange = (requestId, value) => {
    setRemarks((prev) => ({ ...prev, [requestId]: value }));
  };

  return (
    <div className="approval-dashboard-container">
      <h2>🛡️ Authority Approval Dashboard</h2>
      <p className="subtitle">Review and act on pending event permission requests</p>

      {loading ? (
        <div className="loading-spinner">Loading pending approvals...</div>
      ) : pendingRequests.length === 0 ? (
        <div className="empty-state">🎉 No pending permission requests to review!</div>
      ) : (
        <div className="approval-list">
          {pendingRequests.map((req) => (
            <div key={req.request_id} className="approval-card">
              <div className="approval-header">
                <div>
                  <h3>{req.title}</h3>
                  <span className="club-subtitle">🏛️ {req.club_name} | Requested by {req.requester_name || "Student/Head"}</span>
                </div>
                <span className="level-badge">Level {req.current_level} Review</span>
              </div>

              <div className="approval-details">
                <p>📍 <strong>Venue:</strong> {req.venue}</p>
                <p>📅 <strong>Event Date:</strong> {req.event_date ? new Date(req.event_date).toLocaleDateString() : "N/A"}</p>
                {req.description && <p className="desc">📝 {req.description}</p>}
              </div>

              <div className="remarks-box">
                <input
                  type="text"
                  placeholder="Add optional remarks..."
                  value={remarks[req.request_id] || ""}
                  onChange={(e) => handleRemarksChange(req.request_id, e.target.value)}
                />
              </div>

              <div className="action-buttons">
                <button
                  className="approve-btn"
                  onClick={() => setConfirmModal({ req, status: "approved" })}
                >
                  ✅ Approve
                </button>
                <button
                  className="reject-btn"
                  onClick={() => setConfirmModal({ req, status: "rejected" })}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="confirm-toast">
          <p>
            Are you sure you want to <b>{confirmModal.status.toUpperCase()}</b> the permission request for <b>{confirmModal.req.title}</b>?
          </p>
          <div className="confirm-actions">
            <button
              className="yes-btn"
              style={{ background: confirmModal.status === 'rejected' ? '#ef4444' : undefined }}
              onClick={() => handleAction(confirmModal.req.request_id, confirmModal.req.current_level, confirmModal.status)}
            >
              Confirm {confirmModal.status === 'approved' ? 'Approval' : 'Rejection'}
            </button>
            <button className="no-btn" onClick={() => setConfirmModal(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalDashboard;
