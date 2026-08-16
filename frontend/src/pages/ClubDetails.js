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

  const [visibleClubKeys, setVisibleClubKeys] = useState({ head: false, mentor: false });
  const [copiedClubKeyType, setCopiedClubKeyType] = useState(null);
  const [showRevokeClubKeyConfirm, setShowRevokeClubKeyConfirm] = useState(false);
  const [keyTypeToRevoke, setKeyTypeToRevoke] = useState(null);

  const toggleClubKeyVisibility = (type) => {
    setVisibleClubKeys(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const copyClubKey = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedClubKeyType(type);
    toast.info("Club secret key copied to clipboard! 📋");
    setTimeout(() => {
      setCopiedClubKeyType(curr => (curr === type ? null : curr));
    }, 2000);
  };

  const generateCryptoClubKey = async (type) => {
    try {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const randomHex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
      const clubPrefix = club?.name ? club.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() : "CLB";
      const generatedKey = `KEY_${clubPrefix}_${type === 'mentor' ? 'MNTR' : 'HEAD'}_${randomHex}`;

      const token = localStorage.getItem("token");
      await api.post(`/clubs/${clubId}/generate-key`, {
        key_type: type,
        secret_key: generatedKey
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      toast.success(`Cryptographically secure ${type === 'mentor' ? 'Club Mentor' : 'Club Head'} key generated & activated 🛡️`);
      fetchClub();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate key ❌");
    }
  };

  const askRevokeClubKey = (type) => {
    setKeyTypeToRevoke(type);
    setShowRevokeClubKeyConfirm(true);
  };

  const confirmRevokeClubKey = async () => {
    if (!keyTypeToRevoke) return;
    try {
      const token = localStorage.getItem("token");
      await api.post(`/clubs/${clubId}/revoke-key`, {
        key_type: keyTypeToRevoke
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      toast.success(`${keyTypeToRevoke === 'mentor' ? 'Club Mentor' : 'Club Head'} key revoked successfully 🚫`);
      setShowRevokeClubKeyConfirm(false);
      setKeyTypeToRevoke(null);
      fetchClub();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke key ❌");
    }
  };

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


  const isAdmin = user && (user.role_name === "Admin" || user.role_id === 3 || user.role === 3);
  const isAuthority = user && (["Admin", "Estate Manager", "Principal", "Director", "Club Mentor", "Club Head", "Teacher"].includes(user.role_name) || [2, 3, 5, 6, 7, 8, 9].includes(user.role_id) || [2, 3, 5, 6, 7, 8, 9].includes(user.role));
  const isClubHead = user && (user.role_name === "Club Head" || user.role_id === 4 || user.role === 4 || (club && club.club_head_id === user.id));
  const isClubMentor = user && (user.role_name === "Club Mentor" || user.role_id === 5 || user.role === 5 || (club && club.club_mentor_id === user.id));

  const canManageClub = user && club && (
    club.club_head_id === user.id ||
    club.club_mentor_id === user.id ||
    isAdmin
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
      if (!studentName.trim() || !studentEmail.trim()) {
        toast.error("Student Name and Email are required");
        return;
      }

      const nameRegex = /^[a-zA-Z\s.']{2,50}$/;
      if (!nameRegex.test(studentName.trim())) {
        toast.error("Student name must only contain letters and spaces (no emojis or special characters)");
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(studentEmail.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }

      if (studentRoll && !/^\d{5}$/.test(studentRoll.trim())) {
        toast.error("Roll number must be exactly 5 digits (e.g. 31105)");
        return;
      }

      try {
        const token = localStorage.getItem("token");

        await api.post(
          `/clubs/${clubId}/add-student`,
          {
            club_id: clubId,
            name: studentName.trim(),
            email: studentEmail.trim(),
            roll_no: studentRoll ? studentRoll.trim() : null,
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
                        background: "var(--primary-glow)",
                        color: "var(--primary-light)",
                        border: "1px solid var(--border-color)",
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

          {/* Dual-Action Buttons for Students (Non-Authorities) */}
          {!canManageClub && !isAuthority && user && (
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

          {/* 🔑 CLUB SECRET REGISTRATION KEYS MANAGEMENT (Admin Only) */}
          {isAdmin && club && (
            <div className="club-keys-management-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <h3>🔑 Club Secret Keys Management</h3>
              </div>
              <p className="club-keys-subtitle">
                Cryptographically secure single-use registration keys for the Club Head and Club Mentor. Keep them private until shared with the appointed authority.
              </p>

              <div className="club-keys-table-wrapper">
                <table className="club-keys-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Secret Key</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 👑 Club Head Key Row */}
                    <tr>
                      <td>
                        <span className="role-tag">👑 Club Head</span>
                      </td>
                      <td>
                        {club.club_head_key ? (
                          <div className="key-code-badge">
                            <span className="key-badge-text">
                              {visibleClubKeys.head ? club.club_head_key : "••••••••••••••••••••••••"}
                            </span>
                            <div className="key-badge-actions">
                              <button
                                type="button"
                                className="key-badge-btn"
                                onClick={() => toggleClubKeyVisibility("head")}
                                title={visibleClubKeys.head ? "Hide Key" : "Show Key"}
                              >
                                {visibleClubKeys.head ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                  </svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                )}
                              </button>
                              <button
                                type="button"
                                className="key-badge-btn"
                                onClick={() => copyClubKey(club.club_head_key, "head")}
                                title="Copy Secret Key"
                              >
                                {copiedClubKeyType === "head" ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : club.club_head_id ? (
                          <span style={{ color: "#38bdf8", fontSize: "0.82rem", fontWeight: "600" }}>🔒 Single-Use Key Claimed</span>
                        ) : (
                          <span style={{ color: "#64748b", fontStyle: "italic", fontSize: "0.85rem" }}>No key generated</span>
                        )}
                      </td>
                      <td>
                        {club.club_head_id ? (
                          <span className="status-badge status-used">
                            👤 Assigned: {club.head_name || "Club Head"}
                          </span>
                        ) : club.club_head_key ? (
                          <span className="status-badge status-active">
                            ⚡ Active (Unclaimed)
                          </span>
                        ) : (
                          <span className="status-badge status-empty">
                            🚫 No Key Set
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="club-key-action-group">
                          {club.club_head_key ? (
                            <button
                              type="button"
                              className="club-key-revoke-btn"
                              onClick={() => askRevokeClubKey("head")}
                              title="Delete / revoke this secret key"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              <span>Delete Key</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="club-key-gen-action-btn"
                              onClick={() => generateCryptoClubKey("head")}
                              title="Auto-generate a new cryptographically secure key for Club Head"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                              </svg>
                              <span>Auto-Gen Key</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* 🎓 Club Mentor Key Row */}
                    <tr>
                      <td>
                        <span className="role-tag">🎓 Club Mentor</span>
                      </td>
                      <td>
                        {club.club_mentor_key ? (
                          <div className="key-code-badge">
                            <span className="key-badge-text">
                              {visibleClubKeys.mentor ? club.club_mentor_key : "••••••••••••••••••••••••"}
                            </span>
                            <div className="key-badge-actions">
                              <button
                                type="button"
                                className="key-badge-btn"
                                onClick={() => toggleClubKeyVisibility("mentor")}
                                title={visibleClubKeys.mentor ? "Hide Key" : "Show Key"}
                              >
                                {visibleClubKeys.mentor ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                  </svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                )}
                              </button>
                              <button
                                type="button"
                                className="key-badge-btn"
                                onClick={() => copyClubKey(club.club_mentor_key, "mentor")}
                                title="Copy Secret Key"
                              >
                                {copiedClubKeyType === "mentor" ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : club.club_mentor_id ? (
                          <span style={{ color: "#38bdf8", fontSize: "0.82rem", fontWeight: "600" }}>🔒 Single-Use Key Claimed</span>
                        ) : (
                          <span style={{ color: "#64748b", fontStyle: "italic", fontSize: "0.85rem" }}>No key generated</span>
                        )}
                      </td>
                      <td>
                        {club.club_mentor_id ? (
                          <span className="status-badge status-used">
                            👤 Assigned: {club.mentor_name || "Club Mentor"}
                          </span>
                        ) : club.club_mentor_key ? (
                          <span className="status-badge status-active">
                            ⚡ Active (Unclaimed)
                          </span>
                        ) : (
                          <span className="status-badge status-empty">
                            🚫 No Key Set
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="club-key-action-group">
                          {club.club_mentor_key ? (
                            <button
                              type="button"
                              className="club-key-revoke-btn"
                              onClick={() => askRevokeClubKey("mentor")}
                              title="Delete / revoke this secret key"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              <span>Delete Key</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="club-key-gen-action-btn"
                              onClick={() => generateCryptoClubKey("mentor")}
                              title="Auto-generate a new cryptographically secure key for Club Mentor"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                              </svg>
                              <span>Auto-Gen Key</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {canManageClub && (
            <div className="club-admin-buttons">
              {/* Only Club Head or Admin can request event permission; Club Mentor approves at Level 1 */}
              {(isClubHead || (isAdmin && !isClubMentor)) && (
                <button
                  onClick={() => navigate("/create-permission")}
                  style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)" }}
                >
                  📝 Request Event Permission
                </button>
              )}
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
              <button className="yes-btn danger" style={{ background: '#ef4444' }} onClick={deleteClub}>Yes, Delete</button>
              <button className="no-btn" onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* 🗑️ REVOKE CLUB KEY CONFIRM MODAL */}
        {showRevokeClubKeyConfirm && (
          <div className="confirm-toast">
            <p>🗑️ Are you sure you want to <b>delete the secret key for {keyTypeToRevoke === "mentor" ? "Club Mentor" : "Club Head"}</b>? This action cannot be undone!</p>
            <div className="confirm-actions">
              <button className="yes-btn danger" style={{ background: '#ef4444' }} onClick={confirmRevokeClubKey}>
                Yes, Delete Key
              </button>
              <button
                className="no-btn"
                onClick={() => {
                  setShowRevokeClubKeyConfirm(false);
                  setKeyTypeToRevoke(null);
                }}
              >
                Cancel
              </button>
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
              <button className="yes-btn danger" style={{ background: '#ef4444' }} onClick={removeStudent}>
                Remove Student
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
                          background: "var(--primary-gradient)",
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