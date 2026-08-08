import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";
import "./PermissionRequestForm.css";

const PermissionRequestForm = () => {
  const [clubs, setClubs] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    venue: "",
    club_id: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await axios.get("/clubs");
      setClubs(res.data);
      if (res.data.length > 0) {
        setFormData((prev) => ({ ...prev, club_id: res.data[0].club_id }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load clubs list");
    }
  };

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
      toast.success("Permission request submitted successfully!");
      setFormData({
        title: "",
        description: "",
        event_date: "",
        venue: "",
        club_id: clubs[0]?.club_id || ""
      });
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
            <label>Select Club *</label>
            <select name="club_id" value={formData.club_id} onChange={handleChange} required>
              {clubs.map((c) => (
                <option key={c.club_id} value={c.club_id}>
                  {c.name}
                </option>
              ))}
            </select>
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
