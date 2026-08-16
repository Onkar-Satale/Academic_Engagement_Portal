import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { toast } from "react-toastify";
import "./MyRequestsList.css";

const MyRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTargetReq, setDeleteTargetReq] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("/permissions/my-requests");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load permission requests");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteRequest = async () => {
    if (!deleteTargetReq) return;
    setDeleting(true);
    try {
      await axios.delete(`/permissions/${deleteTargetReq.request_id}`);
      toast.success("Permission request cancelled & withdrawn successfully 🗑️");
      setDeleteTargetReq(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete request ❌");
    } finally {
      setDeleting(false);
    }
  };

  const getLevelName = (level) => {
    switch (level) {
      case 1:
        return "Club Mentor (Level 1)";
      case 2:
        return "Estate Manager (Level 2)";
      case 3:
        return "Principal (Level 3)";
      case 4:
        return "Director (Level 4)";
      default:
        return `Level ${level}`;
    }
  };

  const handleResubmit = (req) => {
    navigate("/create-permission", {
      state: {
        initialTitle: req.title,
        initialDescription: req.description,
        initialVenue: req.venue,
        initialDate: req.event_date ? new Date(req.event_date).toISOString().split('T')[0] : "",
        club_id: req.club_id,
        old_request_id: req.request_id
      }
    });
  };

  return (
    <div className="requests-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2>📋 My Permission Requests</h2>
          <p className="subtitle" style={{ margin: 0 }}>Track real-time authority approval pipeline, reviews & remarks</p>
        </div>
        <button
          onClick={() => navigate("/create-permission")}
          className="btn-new-permission"
        >
          ➕ New Permission Request
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">No permission requests submitted yet.</div>
      ) : (
        <div className="requests-grid">
          {requests.map((req) => {
            const approvals = req.approval_history || [];
            const isRejected = req.status === "rejected";
            const isApproved = req.status === "approved";

            return (
              <div key={req.request_id} className={`request-card status-${req.status}`}>
                <div className="card-header">
                  <div>
                    <h3>{req.title}</h3>
                    <p className="club-tag" style={{ margin: "4px 0 0 0" }}>🏛️ {req.club_name || "Club Request"}</p>
                  </div>
                  <span className={`status-badge badge-${req.status}`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>

                <div className="meta-details">
                  <p>📍 <strong>Venue:</strong> {req.venue}</p>
                  <p>📅 <strong>Event Date:</strong> {req.event_date ? new Date(req.event_date).toLocaleDateString() : "N/A"}</p>
                  <p>⏳ <strong>Current Stage:</strong> {isApproved ? "🎉 Approved & Published" : isRejected ? `❌ Rejected at Level ${req.current_level}` : getLevelName(req.current_level)}</p>
                </div>

                {req.description && (
                  <p className="description"><strong>Details:</strong> {req.description}</p>
                )}

                {/* 4-Level Visual Pipeline */}
                <div className="approval-pipeline">
                  <span className="pipeline-title">Approval Pipeline Progress:</span>
                  <div className="pipeline-steps">
                    {[
                      { level: 1, name: "Mentor" },
                      { level: 2, name: "Estate Mgr" },
                      { level: 3, name: "Principal" },
                      { level: 4, name: "Director" }
                    ].map((step) => {
                      const stepApproval = approvals.find((a) => a.level === step.level);
                      let stepStatus = "pending";
                      if (stepApproval) {
                        stepStatus = stepApproval.status;
                      } else if (isApproved || req.current_level > step.level) {
                        stepStatus = "approved";
                      } else if (req.current_level === step.level && !isRejected) {
                        stepStatus = "current";
                      }

                      return (
                        <div key={step.level} className={`pipeline-step step-${stepStatus}`}>
                          <div className="step-circle">
                            {stepStatus === "approved" ? "✓" : stepStatus === "rejected" ? "✗" : step.level}
                          </div>
                          <span className="step-label">{step.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Authority Remarks Timeline */}
                {approvals.length > 0 && (
                  <div className="remarks-timeline">
                    <span className="timeline-heading">💬 Authority Remarks & Feedback:</span>
                    {approvals.map((app, idx) => (
                      <div key={idx} className={`remark-entry remark-${app.status}`}>
                        <div className="remark-header">
                          <span className="auth-name">
                            {app.authority_role} ({app.authority_name || "Authority"}):
                          </span>
                          <span className={`remark-badge badge-${app.status}`}>
                            {app.status === "approved" ? "Approved" : "Rejected"}
                          </span>
                        </div>
                        <p className="remark-text">
                          {app.remarks ? `"${app.remarks}"` : <em>No written remark provided.</em>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Resubmit for Rejected Requests */}
                {isRejected && (
                  <div className="resubmit-action-box">
                    <p className="rejection-note">
                      ⚠️ <strong>Request was rejected.</strong> Review the authority remarks above, edit details, and resubmit.
                    </p>
                    <button
                      type="button"
                      className="btn-resubmit-req"
                      onClick={() => handleResubmit(req)}
                    >
                      🔄 Edit Details
                    </button>
                  </div>
                )}

                {/* Cancel / Withdraw Request Option (Available for Active & Rejected requests) */}
                {!isApproved && (
                  <div className="card-footer-actions">
                    <button
                      type="button"
                      className="btn-withdraw-req"
                      onClick={() => setDeleteTargetReq(req)}
                      title="Cancel and withdraw this permission request"
                    >
                      🗑️ Withdraw Request
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Deleting/Withdrawing Request */}
      {deleteTargetReq && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeleteTargetReq(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">⚠️</span>
              <h3>Withdraw Permission Request?</h3>
            </div>
            <p className="modal-desc">
              Are you sure you want to cancel and delete the permission request for <strong>"{deleteTargetReq.title}"</strong> ({deleteTargetReq.club_name})?
            </p>
            <p className="modal-subtext">
              All authorities currently reviewing this request (up to Level {deleteTargetReq.current_level}) will receive an immediate cancellation notification.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setDeleteTargetReq(null)}
                disabled={deleting}
              >
                Keep Request
              </button>
              <button
                type="button"
                className="modal-btn-delete"
                onClick={confirmDeleteRequest}
                disabled={deleting}
              >
                {deleting ? "Withdrawing..." : "Yes, Withdraw & Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequestsList;
