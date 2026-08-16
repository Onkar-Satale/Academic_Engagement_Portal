import { useNavigate } from "react-router-dom";
import "./EventCard.css";

export default function EventCard({ event, isRegistered }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isOrganizer = user && Number(event.organizer_id) === Number(user.id);
  const isStudent = user && (user.role_name === "Student" || Number(user.role_id) === 1 || Number(user.role) === 1);
  const showRegister = isStudent && !isRegistered;



  const handleRegisterClick = () => {
    navigate(`/events/${event.event_id}/register`, {
      state: { event } // optional, useful later
    });
  };

  const handleViewDetails = () => {
    navigate(`/events/${event.event_id}`);
  };

  return (
    <>
      <div className="event-card">
        <h3>{event.title}</h3>
        {isOrganizer && <span className="organizer-badge">Admin/Organized</span>}
        <p>{event.description}</p>

        <div className="event-info">
          <span>📅 {new Date(event.date).toLocaleDateString()}</span>
          <span>📍 {event.venue}</span>

        </div>

        <div className="event-buttons">
          {showRegister && (
            <button className="register-btn" onClick={handleRegisterClick}>
              Register
            </button>
          )}
          <button className="details-btn" onClick={handleViewDetails}>
            View Details
          </button>
        </div>
      </div>
    </>
  );
}
