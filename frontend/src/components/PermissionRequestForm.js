import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axios";
import { toast } from "react-toastify";
import "./PermissionRequestForm.css";

const PermissionRequestForm = () => {
  const [clubs, setClubs] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const resubmitState = location.state;
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [formData, setFormData] = useState({
    title: resubmitState?.initialTitle || "",
    description: resubmitState?.initialDescription || "",
    event_date: resubmitState?.initialDate || "",
    venue: resubmitState?.initialVenue || "",
    club_id: resubmitState?.club_id ? String(resubmitState.club_id) : user?.club_id ? String(user.club_id) : "",
    old_request_id: resubmitState?.old_request_id || null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await axios.get("/clubs");
      setClubs(res.data);
      const userClub = res.data.find(c => Number(c.club_id) === Number(user?.club_id) || c.club_head_id === user?.id || c.club_mentor_id === user?.id);
      if (userClub && !formData.club_id) {
        setFormData((prev) => ({ ...prev, club_id: String(userClub.club_id) }));
      } else if (!formData.club_id && res.data.length > 0) {
        setFormData((prev) => ({ ...prev, club_id: String(res.data[0].club_id) }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load clubs list");
    }
  };

  const assignedClub = clubs.find(c => String(c.club_id) === String(formData.club_id)) || clubs.find(c => Number(c.club_id) === Number(user?.club_id));
  const isClubRole = user?.role_name === "Club Head" || user?.role_name === "Club Mentor" || !!user?.club_id;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date || !formData.venue || !formData.club_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/permissions", formData);
      toast.success("Permission request submitted successfully! 🚀");
      setTimeout(() => {
        navigate("/my-requests");
      }, 800);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="permission-form-container">
      <div className="permission-card">
        <h2>📝 Submit Permission Request</h2>
        <p className="subtitle">Request approval for club events across authority levels</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event / Request Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Annual Tech Hackathon 2026"
              required
            />
          </div>

          <div className="form-group">
            <label>Organizing Club *</label>
            {isClubRole ? (
              <div style={{
                background: "rgba(124, 58, 237, 0.12)",
                border: "1px solid rgba(124, 58, 237, 0.35)",
                borderRadius: "8px",
                padding: "12px 16px",
                color: "#e2e8f0",
                fontSize: "0.95rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <span>🏛️</span>
                <span>{assignedClub ? assignedClub.name : "Your Assigned Club"}</span>
                <span style={{
                  marginLeft: "auto",
                  fontSize: "0.75rem",
                  background: "rgba(124, 58, 237, 0.3)",
                  color: "#c084fc",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontWeight: "600"
                }}>
                  {user?.role_name || "Club Leader"}
                </span>
              </div>
            ) : (
              <select name="club_id" value={formData.club_id} onChange={handleChange} required>
                {clubs.map((c) => (
                  <option key={c.club_id} value={c.club_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Event Date *</label>
              <input
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Venue *</label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g. Main Auditorium"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description / Justification</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe the scope, objectives, budget, and required facilities..."
            ></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Submitting..." : "🚀 Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PermissionRequestForm;
