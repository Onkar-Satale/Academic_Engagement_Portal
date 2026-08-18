import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { toast } from "react-toastify";
import "./MyEvents.css";

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const isClubLeader = user && (user.role_name === "Club Head" || user.role_name === "Club Mentor");

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const res = await axios.get("/event-registrations/my");
      setEvents(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-events-container">
      <h2>{isClubLeader ? "📅 Club & Enrolled Events" : "🎉 My Enrolled Events"}</h2>
      <p className="subtitle">
        {isClubLeader 
          ? "Events organized by your club or events you are registered in"
          : "Events and sessions you have registered for on campus"}
      </p>

      {loading ? (
        <div className="loading-spinner">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          {isClubLeader 
            ? "No events organized by your club yet." 
            : "You have not registered for any events yet."}
        </div>
      ) : (
        <div className="my-events-grid">
          {events.map((event) => (
            <div 
              key={event.event_id} 
              className="my-event-card"
              onClick={() => navigate(`/events/${event.event_id}`)}
              style={{ cursor: "pointer" }}
              title="Click to view event details and attendee registrations"
            >
              <div className="event-header">
                <div>
                  {event.club_name && (
                    <span style={{
                      display: "inline-block",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#c084fc",
                      marginBottom: "4px"
                    }}>
                      🏛️ {event.club_name}
                    </span>
                  )}
                  <h3>{event.title}</h3>
                </div>
                <span className="status-badge">{event.status || "Upcoming"}</span>
              </div>
              <p className="event-venue">📍 {event.venue || "Campus Venue"}</p>
              <p className="event-date">📅 {event.date ? new Date(event.date).toLocaleDateString() : "TBA"}</p>

              {event.total_registrations !== undefined && (
                <p style={{ fontSize: "0.82rem", color: "#a78bfa", marginTop: "6px", fontWeight: "600" }}>
                  👥 {event.total_registrations} Registered Attendees
                </p>
              )}

              {event.description && <p className="event-desc">{event.description}</p>}

              <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>View Details →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;
