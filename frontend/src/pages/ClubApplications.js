import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/axios";
import { toast } from "react-toastify";
import "./ClubApplications.css";

const ClubApplications = () => {
  const { clubId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`/clubs/${clubId}/applications`);
      setApplications(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load club applications");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    try {
      await axios.post(`/clubs/${clubId}/applications/${userId}`, { action });
      toast.success(`Application ${action}d!`);
      setApplications((prev) => prev.filter((a) => a.user_id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} application`);
    }
  };

  return (
    <div className="club-apps-container">
      <h2>👑 Club Member Applications</h2>
      <p className="subtitle">Review student membership requests for your club</p>

      {loading ? (
        <div className="loading-spinner">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="empty-state">🎉 No pending membership applications at this time!</div>
      ) : (
        <div className="apps-grid">
          {applications.map((app) => (
            <div key={app.user_id} className="app-card">
              <div className="user-info">
                <h3>{app.name}</h3>
                <p>📧 {app.email}</p>
                <p>🎓 {app.department} | Year {app.year}</p>
              </div>

              <div className="card-actions">
                <button className="accept-btn" onClick={() => handleAction(app.user_id, "approve")}>
                  ✅ Approve
                </button>
                <button className="decline-btn" onClick={() => handleAction(app.user_id, "reject")}>
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubApplications;
