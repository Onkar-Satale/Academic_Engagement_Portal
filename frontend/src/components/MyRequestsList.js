import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";
import "./MyRequestsList.css";

const MyRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="requests-container">
      <h2>📋 My Permission Requests</h2>
      <p className="subtitle">Track real-time status of your event approval requests</p>

      {loading ? (
        <div className="loading-spinner">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">No permission requests submitted yet.</div>
      ) : (
        <div className="requests-grid">
          {requests.map((req) => (
            <div key={req.request_id} className={`request-card status-${req.status}`}>
              <div className="card-header">
                <h3>{req.title}</h3>
                <span className={`status-badge badge-${req.status}`}>
                  {req.status.toUpperCase()}
                </span>
              </div>
              <p className="club-tag">🏛️ {req.club_name || "Club Request"}</p>

              <div className="meta-details">
                <p>📍 <strong>Venue:</strong> {req.venue}</p>
                <p>📅 <strong>Date:</strong> {req.event_date ? new Date(req.event_date).toLocaleDateString() : "N/A"}</p>
                <p>⏳ <strong>Current Level:</strong> {getLevelName(req.current_level)}</p>
              </div>

              {req.description && (
                <p className="description">{req.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequestsList;
