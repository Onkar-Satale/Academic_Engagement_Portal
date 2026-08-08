import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import "./EventDetails.css";

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [showAttendees, setShowAttendees] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Load logged-in user
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  // Fetch event details
  const fetchEvent = useCallback(async () => {
    try {
      const res = await api.get(`/events/${eventId}`);
      setEvent(res.data);
      setForm({
        title: res.data.title,
        description: res.data.description,
        date: res.data.date,
        venue: res.data.venue,
        additional_info: res.data.additional_info || "",
        conducted_by: res.data.conducted_by || "",
      });
    } catch (err) {
      console.error("Failed to fetch Event/Session", err);
    }
  }, [eventId]);

  const fetchAttendees = useCallback(async () => {
    try {
      const res = await api.get(`/event-registrations/${eventId}/attendees`);
      setAttendees(res.data);
    } catch (err) {
      // User likely not authorized, ignore
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    if (user && event) {
      fetchAttendees();
    }
  }, [user, event, fetchAttendees]);

  if (!event || !user) return <p>Loading Events/Sessions...</p>;

  const canManageEvent =
    user.id === event.organizer_id ||
    user.id === event.club_head_id ||
    user.id === event.club_mentor_id ||
    user.role_name === "Admin" ||
    user.role_id === 4;

  // Handle input changes in edit form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save edited event
  const handleSave = async () => {
    try {
      const payload = { ...form, date: form.date.split("T")[0] };
      await api.put(`/events/${event.event_id}`, payload);
      toast.success("Event updated successfully! 📅");
      setEditMode(false);
      fetchEvent();
    } catch (err) {
      toast.error("Failed to update Event ❌");
    }
  };

  // Delete event
  const handleDelete = async () => {
    try {
      await api.delete(`/events/${event.event_id}`);
      toast.success("Event deleted successfully 🗑️");
      setShowDeleteConfirm(false);
      setTimeout(() => {
        navigate("/events");
      }, 1000);
    } catch (err) {
      toast.error("Failed to delete Event ❌");
    }
  };

  return (
    <div className="event-details-container">
      {/* Header card with Action buttons */}
      <div className="event-header-card">
        <div className="event-title-badge">
          <h2>{event.title}</h2>
          <span className={`status-badge ${event.status.toLowerCase()}`}>
            {event.status}
          </span>
        </div>

        <div className="event-meta-info">
          <p>📅 <strong>Date:</strong> {event.date ? event.date.split("T")[0] : "TBD"}</p>
          <p>📍 <strong>Venue:</strong> {event.venue}</p>
          <p>🏛️ <strong>Club:</strong> {event.club_name || "General Campus Event"}</p>
          <p>👤 <strong>Organizer:</strong> {event.organizer_name || "Campus Admin"}</p>
          {event.conducted_by && (
            <p>🎤 <strong>Conducted By:</strong> {event.conducted_by}</p>
          )}
        </div>

        {/* Edit / Delete actions for privilege users */}
        {canManageEvent && (
          <div className="event-action-buttons">
            {!editMode ? (
              <>
                <button className="btn-edit" onClick={() => setEditMode(true)}>
                  ✏️ Edit Event
                </button>
                <button
                  className="btn-delete"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  🗑️ Delete Event
                </button>
              </>
            ) : (
              <button className="btn-cancel" onClick={() => setEditMode(false)}>
                ✖️ Cancel Editing
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Details */}
      {!editMode ? (
        <div className="event-content-card">
          <h3>Description</h3>
          <p className="event-description">{event.description}</p>

          {event.additional_info && (
            <>
              <h3>Additional Information</h3>
              <p className="event-additional-info">{event.additional_info}</p>
            </>
          )}
        </div>
      ) : (
        /* Edit Form */
        <div className="event-edit-card">
          <h3>Edit Event Details</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date ? form.date.split("T")[0] : ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Venue</label>
                <input
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Conducted By</label>
              <input
                type="text"
                name="conducted_by"
                value={form.conducted_by}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Additional Information</label>
              <textarea
                name="additional_info"
                value={form.additional_info}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <button type="submit" className="btn-save">
              💾 Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <h4>Confirm Deletion</h4>
            <p>Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-confirm-delete" onClick={handleDelete}>
                Yes, Delete
              </button>
              <button
                className="btn-cancel-modal"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registered Attendees Section for Admins/Organizers */}
      {canManageEvent && (
        <div className="attendees-section">
          <button
            className="btn-toggle-attendees"
            onClick={() => setShowAttendees(!showAttendees)}
          >
            {showAttendees ? "🙈 Hide Registered Students" : "👥 View Registered Students"} ({attendees.length})
          </button>

          {showAttendees && (
            <div className="attendees-list">
              <h4>Registered Students ({attendees.length})</h4>
              {attendees.length === 0 ? (
                <p>No students registered yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Year</th>
                      <th>Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((attendee) => (
                      <tr
                        key={attendee.registration_id}
                        onClick={() => setSelectedStudent(attendee)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{attendee.full_name}</td>
                        <td>{attendee.email}</td>
                        <td>{attendee.department}</td>
                        <td>{attendee.year}</td>
                        <td>{new Date(attendee.registered_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content student-modal">
            <h4>Student Details</h4>
            <p><strong>Name:</strong> {selectedStudent.full_name}</p>
            <p><strong>Email:</strong> {selectedStudent.email}</p>
            <p><strong>Phone:</strong> {selectedStudent.phone || "N/A"}</p>
            <p><strong>Department:</strong> {selectedStudent.department}</p>
            <p><strong>Year:</strong> {selectedStudent.year}</p>
            <p><strong>Roll No:</strong> {selectedStudent.roll_no || "N/A"}</p>
            {selectedStudent.notes && <p><strong>Notes:</strong> {selectedStudent.notes}</p>}
            <div className="modal-actions">
              <button className="btn-cancel-modal" onClick={() => setSelectedStudent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
