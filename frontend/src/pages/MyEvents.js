import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";
import "./MyEvents.css";

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const res = await axios.get("/event-registrations/my");
      setEvents(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load registered events");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-events-container">
      <h2>🎉 My Enrolled Events</h2>
      <p className="subtitle">Events you have registered for or are managing</p>

      {loading ? (
        <div className="loading-spinner">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="empty-state">You have not registered for any events yet.</div>
      ) : (
        <div className="my-events-grid">
          {events.map((event) => (
            <div key={event.event_id} className="my-event-card">
              <div className="event-header">
                <h3>{event.title}</h3>
                <span className="status-badge">{event.status || "Upcoming"}</span>
              </div>
              <p className="event-venue">📍 {event.venue}</p>
              <p className="event-date">📅 {event.date ? new Date(event.date).toLocaleDateString() : "TBA"}</p>

              {event.description && <p className="event-desc">{event.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;
