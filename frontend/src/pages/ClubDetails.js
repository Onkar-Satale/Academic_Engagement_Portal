import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./ClubDetails.css";
import api, { BACKEND_URL } from "../api/axios";
import RegistrationModal from "../components/RegistrationModal";

export default function ClubDetails() {
  const { clubId } = useParams();
  const navigate = useNavigate();

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);

  const [showAddStudent, setShowAddStudent] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [studentYear, setStudentYear] = useState("");
  const [studentBranch, setStudentBranch] = useState("");
  const [showRemoveStudent, setShowRemoveStudent] = useState(false);

  const [removeEmail, setRemoveEmail] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  // Registration modal state
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);




  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tagline: "",
    category: "",
    activities: "",
    club_head_id: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    fetchClub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const fetchClub = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/clubs/${clubId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setClub(res.data);

      let membersData = [];
      try {
        const membersRes = await api.get(`/clubs/${clubId}/members`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        membersData = membersRes.data || [];
      } catch (mErr) {
        console.warn("Members list restricted or unauthenticated:", mErr);
      }

      setClub(prev => ({
        ...prev,
        members: membersData
      }));

      setFormData({
        name: res.data.name || "",
        description: res.data.description || "",
        tagline: res.data.tagline || "",
        category: res.data.category || "",
        activities: res.data.activities || "",
        club_head_id: res.data.club_head_id || "",
        club_mentor_id: res.data.club_mentor_id || "",
      });

      // Check application status if user is logged in
      if (user) {
        try {
          const statusRes = await api.get(`/clubs/${clubId}/my-status`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (statusRes.data?.status) {
            setApplicationStatus(statusRes.data.status);
          } else if (membersData.some(m => m.user_id === user.id)) {
            setApplicationStatus("approved");
          } else {
            setApplicationStatus(null);
          }
        } catch (sErr) {
          if (membersData.some(m => m.user_id === user.id)) {
            setApplicationStatus("approved");
          }
        }
      }
    } catch (err) {
      console.error("fetchClub error:", err);
      toast.error("Failed to fetch club details ❌");
    } finally {
      setLoading(false);
    }
  };


  const canManageClub = user && club && (
    club.club_head_id === user.id ||
    club.club_mentor_id === user.id ||
    user.role_name === "Admin" ||
    user.role_id === 3
  );

  const deleteClub = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/clubs/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Club deleted successfully 🗑️");
      setShowConfirm(false);
      setTimeout(() => navigate("/clubs"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete club ❌");
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await api.put(`/clubs/${clubId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Club updated successfully ✔️");
      setEditing(false);
      fetchClub();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update club ❌");
    }
  };
  const addStudent = async () => {
    try {
      const token = localStorage.getItem("token");

      await api.post(
        `/clubs/${clubId}/add-student`,
        {
          club_id: clubId,
          name: studentName,
          email: studentEmail,
          roll_no: studentRoll,
          year: studentYear,
          branch: studentBranch
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Student added successfully ✅");

      setShowAddStudent(false);
      setStudentName("");
      setStudentEmail("");
      setStudentRoll("");
      setStudentYear("");
      setStudentBranch("");
      fetchClub();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add student 🚫");
    }
  };

  const removeStudent = async () => {
    try {
      const token = localStorage.getItem("token");

      await api.delete(
        `/clubs/${clubId}/remove-student`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { email: removeEmail }
        }
      );

      toast.success("Student removed successfully ✅");
      setShowRemoveStudent(false);
      setRemoveEmail("");
      fetchClub(); // refresh members
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove student ❌");
    }
  };




  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
    additional_info: "",
    conducted_by: ""
  });

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await api.post("/events", {
        ...eventForm,
        club_id: clubId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Event created successfully! 🚀");
      setShowCreateEvent(false);
      setEventForm({
        title: "",
        description: "",
        date: "",
        venue: "",
        additional_info: "",
        conducted_by: ""
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create event ❌");
    }
  };

  const handleApply = () => {
    // If club requires permission (legacy), use permission form?
    // No, new flow uses /events/:id/register
    // This button handles Club Membership application, not Event Registration.
    // Keeping existing logic for club join.
    setShowRegistrationModal(true);
  };


  if (loading) return <p>Loading club details...</p>;
  if (!club) return <p>Club not found</p>;

  return (
    <>
      <div className="club-details-container">
        <button className="back-btn" onClick={() => navigate("/")}>← Back</button>

        {editing ? (
          <form className="club-edit-form" onSubmit={submitEdit}>
            <h2>Edit Club</h2>

            <label>Club Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <label>Tagline</label>
            <input
              name="tagline"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            />

            <label>Category</label>
            <input
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />

            <label>Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <label>Activities</label>
            <textarea
              name="activities"
              rows={3}
              value={formData.activities}
              onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
            />

            <div className="club-edit-form-actions">
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div className="club-header-banner">
              {club.category && <span className="club-category-pill">🏷️ {club.category}</span>}
              <h1 className="club-title">{club.name}</h1>
              {club.tagline && <p className="club-tagline-text">"{club.tagline}"</p>}
            </div>

            <div className="club-info-section">
              <h3>About the Club</h3>
              <p className="club-description-text">{club.description || "No description provided."}</p>
            </div>

            {club.activities && (
              <div className="club-info-section">
                <h3>Key Activities & Focus Areas</h3>
                <div className="activities-grid">
                  {club.activities.split(/(?=\d+\.|\n)/).map(a => a.trim()).filter(Boolean).map((act, idx) => (
                    <div key={idx} className="activity-card">
                      <span className="activity-icon">⚡</span>
                      <span>{act.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="club-info-section">
              <h3>Club Leadership</h3>
              <div className="leadership-cards">
                {/* Club Head */}
                <div className="leader-card">
                  <div className="leader-avatar">
                    {(club.head_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="leader-info">
                    <span className="leader-role-badge">Club Head</span>
                    <p className="leader-name">{club.head_name || "Not Assigned"}</p>
                    {club.head_email && (
                      <p className="leader-email">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        {club.head_email}
                      </p>
                    )}
                  </div>
                </div>
                {/* Club Mentor */}
                <div className="leader-card">
                  <div className="leader-avatar mentor-avatar">
                    {(club.mentor_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="leader-info">
                    <span className="leader-role-badge mentor-badge">Club Mentor</span>
                    <p className="leader-name">{club.mentor_name || "Not Assigned"}</p>
                    {club.mentor_email && (
                      <p className="leader-email">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        {club.mentor_email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {club.members && (
              <div className="club-info-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0 }}>Enrolled Members ({club.members.length})</h3>
                  <button 
                    onClick={() => setShowMembersModal(true)}
                    style={{
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "#818cf8",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    👥 View All Members ({club.members.length})
                  </button>
                </div>
                {club.members.length === 0 ? (
                  <p className="empty-text">No student members enrolled yet.</p>
                ) : (
                  <ul className="member-list">
                    {club.members.slice(0, 5).map((m, i) => (
                      <li key={i} className="member-item">
                        {canManageClub ? (
                          <span
                            onClick={() => setSelectedMember(m)}
                            className="member-name-clickable"
                            title="Click to view details"
                          >
                            👤 {m.student_name || m.name} {m.branch ? `(${m.branch})` : ""}
                          </span>
                        ) : (
                          <span>👤 {m.student_name || m.name} {m.branch ? `(${m.branch})` : ""}</span>
                        )}

                        {canManageClub && (
                          <button
                            className="remove-btn"
                            onClick={() => {
                              setRemoveEmail(m.email);
                              setShowRemoveStudent(true);
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}

        {/* Dual-Action Buttons for Non-Club-Head Users */}
        {!canManageClub && user && (
          <div className="club-action-section">
            {applicationStatus === "approved" ? (
              <button className="is-member-btn" disabled>
                ✅ You are a Member
              </button>
            ) : applicationStatus === "pending" ? (
              <button className="is-member-btn pending-btn" disabled style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.4)", cursor: "not-allowed" }}>
                ⏳ Application Pending (Awaiting Approval)
              </button>
            ) : (
              <button
                className="register-btn"
                onClick={handleApply}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Apply to Join Club
              </button>
            )}
          </div>
        )}

        {canManageClub && (
          <div className="club-admin-buttons">
            <button
              onClick={() => navigate(`/clubs/${clubId}/applications`)}
              style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", boxShadow: "0 4px 14px rgba(59, 130, 246, 0.35)" }}
            >
              📩 View Applications
            </button>
            <button onClick={() => {
              if (club) {
                setFormData({
                  name: club.name || "",
                  description: club.description || "",
                  tagline: club.tagline || "",
                  category: club.category || "",
                  activities: club.activities || "",
                  club_head_id: club.club_head_id || "",
                  club_mentor_id: club.club_mentor_id || "",
                });
              }
              setEditing(true);
            }}>Edit Club</button>
            <button className="delete-btn" onClick={() => setShowConfirm(true)}>Delete Club</button>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="confirm-toast">
          <p>Delete this club permanently?</p>
          <div className="confirm-actions">
            <button className="yes-btn" onClick={deleteClub}>Yes</button>
            <button className="no-btn" onClick={() => setShowConfirm(false)}>No</button>
          </div>
        </div>
      )}


      {showAddStudent && (
        <div className="add-student-form">
          <h3>Add Student</h3>

          <input
            placeholder="Student Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />

          <input
            placeholder="Email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
          />

          <input
            placeholder="Roll Number"
            value={studentRoll}
            onChange={(e) => setStudentRoll(e.target.value)}
          />

          <input
            placeholder="Year"
            value={studentYear}
            onChange={(e) => setStudentYear(e.target.value)}
          />

          <input
            placeholder="Branch"
            value={studentBranch}
            onChange={(e) => setStudentBranch(e.target.value)}
          />

          <button onClick={addStudent}>Save</button>
          <button onClick={() => setShowAddStudent(false)}>Cancel</button>
        </div>
      )}

      {showCreateEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Event</h3>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g., Tech Workshop"
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  required
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Venue *</label>
                <input
                  required
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  placeholder="e.g., Auditorium"
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Conducted By</label>
                <input
                  value={eventForm.conducted_by}
                  onChange={(e) => setEventForm({ ...eventForm, conducted_by: e.target.value })}
                  placeholder="e.g., Guest Speaker Name"
                />
              </div>

              <div className="form-group">
                <label>Additional Info</label>
                <textarea
                  value={eventForm.additional_info}
                  onChange={(e) => setEventForm({ ...eventForm, additional_info: e.target.value })}
                  rows="2"
                  placeholder="e.g., Bring laptops"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">Create Event</button>
                <button type="button" className="cancel-btn" onClick={() => setShowCreateEvent(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRemoveStudent && (
        <div className="confirm-toast">
          <p>Remove this student?</p>

          <input
            placeholder="Student Email"
            value={removeEmail}
            onChange={(e) => setRemoveEmail(e.target.value)}
          />

          <div className="confirm-actions">
            <button className="yes-btn" onClick={removeStudent}>
              Confirm
            </button>
            <button
              className="no-btn"
              onClick={() => {
                setShowRemoveStudent(false);
                setRemoveEmail("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showRegistrationModal && (
        <RegistrationModal
          clubId={clubId}
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={() => {
            fetchClub(); // Refresh to show pending status
          }}
        />
      )}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "20px", marginBottom: "20px" }}>
              {selectedMember.photo_url ? (
                <img
                  src={selectedMember.photo_url.startsWith("http") ? selectedMember.photo_url : `${BACKEND_URL}/${selectedMember.photo_url.replace(/\\/g, "/").replace(/^\/+/, "")}`}
                  alt="Profile"
                  style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid #00ffff" }}
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : (
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #0cebeb, #20e3b2, #29ffc6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", color: "#000", border: "2px solid #fff" }}>
                  {(selectedMember.student_name || selectedMember.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
              {/* Fallback for broken image if onError fires (though logic above handles display none, we need the fallback div to be present) */}
              {selectedMember.photo_url && (
                <div className="fallback-avatar" style={{ display: "none", width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #0cebeb, #20e3b2, #29ffc6)", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", color: "#000", border: "2px solid #fff" }}>
                  {(selectedMember.student_name || selectedMember.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: "1.5rem" }}>Student Details</h3>
                <p style={{ margin: "4px 0 0", color: "#94a3b8" }}>{selectedMember.student_name || selectedMember.name}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Full Name</label>
                <div style={{ color: "#fff", fontSize: "1rem" }}>{selectedMember.student_name || selectedMember.name}</div>
              </div>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>College Email</label>
                <div style={{ color: "#fff", fontSize: "1rem" }}>{selectedMember.email}</div>
              </div>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Roll No</label>
                <div style={{ color: "#fff", fontSize: "1rem" }}>{selectedMember.roll_no}</div>
              </div>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Phone No</label>
                <div style={{ color: "#fff", fontSize: "1rem" }}>{selectedMember.phone_no || "N/A"}</div>
              </div>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Year / Division</label>
                <div style={{ color: "#fff", fontSize: "1rem" }}>{selectedMember.year} {selectedMember.division ? `/ ${selectedMember.division}` : ""}</div>
              </div>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Department</label>
                <div style={{ color: "#fff", fontSize: "1rem" }}>{selectedMember.department || selectedMember.branch || "N/A"}</div>
              </div>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Personal Email</label>
                <div style={{ color: "#fff", fontSize: "1rem" }}>{selectedMember.personal_email || "N/A"}</div>
              </div>
            </div>

            {selectedMember.statement_of_purpose && (
              <div style={{ marginTop: "16px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "8px" }}>
                <label style={{ color: "#00ffff", fontSize: "0.9rem", display: "block", marginBottom: "8px" }}>Statement of Purpose</label>
                <p style={{ color: "#cbd5e1", lineHeight: "1.6", margin: 0, fontSize: "0.95rem" }}>
                  {selectedMember.statement_of_purpose}
                </p>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "24px" }}>
              <button className="cancel-btn" onClick={() => setSelectedMember(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* All Enrolled Members Modal for Students & All Users */}
      {showMembersModal && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "650px", width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#f8fafc" }}>
                👥 Approved Club Members ({club?.members?.length || 0})
              </h2>
              <button 
                onClick={() => setShowMembersModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.5rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {(!club?.members || club.members.length === 0) ? (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0" }}>No approved student members found for this club.</p>
            ) : (
              <div style={{ maxHeight: "400px", overflowY: "auto", display: "grid", gap: "12px", paddingRight: "4px" }}>
                {club.members.map((m, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #a855f7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "1.1rem"
                      }}>
                        {(m.student_name || m.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", color: "#f8fafc", fontSize: "1rem" }}>
                          {m.student_name || m.name}
                        </h4>
                        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>
                          🎓 {m.branch || m.department || "Department N/A"} {m.year ? `| Year ${m.year}` : ""}
                        </p>
                      </div>
                    </div>

                    {canManageClub && (
                      <button
                        onClick={() => {
                          setShowMembersModal(false);
                          setSelectedMember(m);
                        }}
                        style={{
                          background: "rgba(59, 130, 246, 0.15)",
                          color: "#60a5fa",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Details
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button className="cancel-btn" onClick={() => setShowMembersModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
