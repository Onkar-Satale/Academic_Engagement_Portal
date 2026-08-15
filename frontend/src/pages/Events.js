import { useEffect, useState, useCallback } from "react";
import EventCard from "../components/EventCard";
import api from "../api/axios";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredEventIds, setRegisteredEventIds] = useState([]);

  const fetchEvents = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
      const res = await api.get("/events");
      setEvents(res.data);

      // Fetch registered events for the current user
      if (user) {
        try {
          const myRes = await api.get("/event-registrations/my");
          const ids = myRes.data.map(e => String(e.event_id));
          setRegisteredEventIds(ids);
        } catch (e) {
          console.error("Failed to fetch registered events", e);
        }
      }
    } catch (err) {
      console.error("Failed to fetch Event/Session", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) return <p>Loading Event/Session...</p>;

  return (
    <div style={{
      padding: "40px 32px",
      minHeight: "100vh",
      background: "#000000",
      backgroundImage: "radial-gradient(circle at 50% 15%, rgba(124, 58, 237, 0.1) 0%, transparent 60%)",
      color: "#ffffff"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{
          fontSize: "2.2rem",
          fontWeight: 700,
          color: "#ffffff",
          marginBottom: "8px",
          letterSpacing: "-0.02em"
        }}>
          Campus Events & Competitions
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "32px" }}>
          Discover upcoming workshops, hackathons, and activities organized by campus clubs.
        </p>

        {events.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "rgba(18, 18, 22, 0.85)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px"
          }}>
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>No events found at the moment.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px"
          }}>
            {events.map((event) => (
              <EventCard
                key={event.event_id}
                event={event}
                isRegistered={registeredEventIds.includes(String(event.event_id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
