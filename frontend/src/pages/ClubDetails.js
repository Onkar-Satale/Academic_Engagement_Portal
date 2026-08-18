import React, { useEffect, useState, useRef } from "react";
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
    club_mentor_id: "",
  });

  const [candidates, setCandidates] = useState({ students: [], teachers: [] });
  const [headSearch, setHeadSearch] = useState("");
  const [headDropdownOpen, setHeadDropdownOpen] = useState(false);
  const [mentorSearch, setMentorSearch] = useState("");
  const [mentorDropdownOpen, setMentorDropdownOpen] = useState(false);

  const headRef = useRef(null);
  const mentorRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user && (user.role_name === "Admin" || user.role_id === 3 || user.role === 3);

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/clubs/candidates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || { students: [], teachers: [] };
      if (club && club.club_head_id && !data.students.some(s => s.user_id === club.club_head_id)) {
        data.students.push({
          user_id: club.club_head_id,
          name: club.head_name || "Current Club Head",
          email: club.head_email || "",
          department: club.head_department || "",
          year: club.head_year || ""
        });
      }
      if (club && club.club_mentor_id && !data.teachers.some(t => t.user_id === club.club_mentor_id)) {
        data.teachers.push({
          user_id: club.club_mentor_id,
          name: club.mentor_name || "Current Club Mentor",
          email: club.mentor_email || "",
          department: club.mentor_department || ""
        });
      }
      setCandidates(data);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    }
  };

  useEffect(() => {
    fetchClub();
    fetchCandidates();
  }, [clubId]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleOutside = (e) => {
      if (headRef.current && !headRef.current.contains(e.target)) {
        setHeadDropdownOpen(false);
      }
      if (mentorRef.current && !mentorRef.current.contains(e.target)) {
        setMentorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

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

  const isAuthority = user && (["Admin", "Estate Manager", "Principal", "Club Mentor", "Club Head", "Teacher"].includes(user.role_name) || [2, 3, 4, 5, 6, 7].includes(Number(user.role_id || user.role)));
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
      const payload = {
        ...formData,
        club_head_id: formData.club_head_id ? Number(formData.club_head_id) : null,
        club_mentor_id: formData.club_mentor_id ? Number(formData.club_mentor_id) : null,
      };
      await api.put(`/clubs/${clubId}`, payload, {
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
              <h2>Edit Club Details & Leadership</h2>

              <label>Club Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label>Tagline</label>
                  <input
                    name="tagline"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  />
                </div>
                <div>
                  <label>Category</label>
                  <input
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

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

              {/* 👑 Search & Reassign Club Head (Admin Only) */}
              {isAdmin && (
                <div style={{ marginTop: "14px", padding: "14px", background: "rgba(0, 0, 0, 0.35)", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }} ref={headRef}>
                  <label style={{ display: "block", fontSize: "0.88rem", color: "#fde047", fontWeight: 700, marginBottom: "8px" }}>
                    👑 Reassign Club Head (Student)
                  </label>

                  {formData.club_head_id && (candidates.students || []).find(s => String(s.user_id) === String(formData.club_head_id)) ? (
                    (() => {
                      const s = (candidates.students || []).find(s => String(s.user_id) === String(formData.club_head_id));
                      return (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#27272a", border: "1px solid rgba(234, 179, 8, 0.4)", borderRadius: "8px", padding: "8px 14px", marginBottom: "6px" }}>
                          <div>
                            <span style={{ fontWeight: 700, color: "#f8fafc" }}>{s.name}</span>
                            <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginLeft: "8px" }}>({s.email})</span>
                            {s.department && (
                              <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700, marginLeft: "8px" }}>
                                {s.department}{s.year ? ` - Yr ${s.year}` : ''}
                              </span>
                            )}
                            {Number(s.user_id) === Number(club?.club_head_id) && (
                              <span style={{ color: "#fde047", fontSize: "0.75rem", marginLeft: "8px", fontWeight: 600 }}>👑 Current Head</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setFormData(prev => ({ ...prev, club_head_id: "" })); setHeadSearch(""); }}
                            style={{ background: "none", border: "none", color: "#ef4444", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}
                            title="Remove selection"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        placeholder="🔍 Search student by name, email, or department..."
                        value={headSearch}
                        onChange={(e) => {
                          setHeadSearch(e.target.value);
                          setHeadDropdownOpen(true);
                        }}
                        onFocus={() => setHeadDropdownOpen(true)}
                        style={{ width: "100%", padding: "10px 14px", background: "#18181b", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                      />

                      {headDropdownOpen && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px", background: "#18181b", border: "1px solid rgba(234, 179, 8, 0.4)", borderRadius: "8px", maxHeight: "200px", overflowY: "auto", zIndex: 50, boxShadow: "0 10px 30px rgba(0,0,0,0.7)" }}>
                          {(candidates.students || []).filter(s => {
                            if (!headSearch.trim()) return true;
                            const q = headSearch.toLowerCase();
                            return (
                              (s.name && s.name.toLowerCase().includes(q)) ||
                              (s.email && s.email.toLowerCase().includes(q)) ||
                              (s.department && s.department.toLowerCase().includes(q))
                            );
                          }).length === 0 ? (
                            <p style={{ padding: "12px", color: "#94a3b8", margin: 0, fontSize: "0.85rem", textAlign: "center" }}>No students found</p>
                          ) : (
                            (candidates.students || []).filter(s => {
                              if (!headSearch.trim()) return true;
                              const q = headSearch.toLowerCase();
                              return (
                                (s.name && s.name.toLowerCase().includes(q)) ||
                                (s.email && s.email.toLowerCase().includes(q)) ||
                                (s.department && s.department.toLowerCase().includes(q))
                              );
                            }).map((s) => (
                              <div
                                key={s.user_id}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, club_head_id: String(s.user_id) }));
                                  setHeadDropdownOpen(false);
                                  setHeadSearch("");
                                }}
                                style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(234, 179, 8, 0.15)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <div>
                                  <span style={{ fontWeight: 600, color: "#fff" }}>{s.name}</span>
                                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginLeft: "8px" }}>{s.email}</span>
                                </div>
                                {s.department && (
                                  <span style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700 }}>
                                    {s.department}{s.year ? ` - Yr ${s.year}` : ''}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 🎓 Search & Reassign Club Mentor (Admin Only) */}
              {isAdmin && (
                <div style={{ marginTop: "14px", padding: "14px", background: "rgba(0, 0, 0, 0.35)", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }} ref={mentorRef}>
                  <label style={{ display: "block", fontSize: "0.88rem", color: "#fde047", fontWeight: 700, marginBottom: "8px" }}>
                    🎓 Reassign Club Mentor (Teacher / Faculty)
                  </label>

                  {formData.club_mentor_id && (candidates.teachers || []).find(t => String(t.user_id) === String(formData.club_mentor_id)) ? (
                    (() => {
                      const t = (candidates.teachers || []).find(t => String(t.user_id) === String(formData.club_mentor_id));
                      return (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#27272a", border: "1px solid rgba(234, 179, 8, 0.4)", borderRadius: "8px", padding: "8px 14px", marginBottom: "6px" }}>
                          <div>
                            <span style={{ fontWeight: 700, color: "#f8fafc" }}>Prof. {t.name}</span>
                            <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginLeft: "8px" }}>({t.email})</span>
                            {t.department && (
                              <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700, marginLeft: "8px" }}>
                                {t.department}
                              </span>
                            )}
                            {Number(t.user_id) === Number(club?.club_mentor_id) && (
                              <span style={{ color: "#fde047", fontSize: "0.75rem", marginLeft: "8px", fontWeight: 600 }}>🎓 Current Mentor</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setFormData(prev => ({ ...prev, club_mentor_id: "" })); setMentorSearch(""); }}
                            style={{ background: "none", border: "none", color: "#ef4444", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}
                            title="Remove selection"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        placeholder="🔍 Search teacher by name, email, or department..."
                        value={mentorSearch}
                        onChange={(e) => {
                          setMentorSearch(e.target.value);
                          setMentorDropdownOpen(true);
                        }}
                        onFocus={() => setMentorDropdownOpen(true)}
                        style={{ width: "100%", padding: "10px 14px", background: "#18181b", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                      />

                      {mentorDropdownOpen && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px", background: "#18181b", border: "1px solid rgba(234, 179, 8, 0.4)", borderRadius: "8px", maxHeight: "200px", overflowY: "auto", zIndex: 50, boxShadow: "0 10px 30px rgba(0,0,0,0.7)" }}>
                          {(candidates.teachers || []).filter(t => {
                            if (!mentorSearch.trim()) return true;
                            const q = mentorSearch.toLowerCase();
                            return (
                              (t.name && t.name.toLowerCase().includes(q)) ||
                              (t.email && t.email.toLowerCase().includes(q)) ||
                              (t.department && t.department.toLowerCase().includes(q))
                            );
                          }).length === 0 ? (
                            <p style={{ padding: "12px", color: "#94a3b8", margin: 0, fontSize: "0.85rem", textAlign: "center" }}>No faculty found</p>
                          ) : (
                            (candidates.teachers || []).filter(t => {
                              if (!mentorSearch.trim()) return true;
                              const q = mentorSearch.toLowerCase();
                              return (
                                (t.name && t.name.toLowerCase().includes(q)) ||
                                (t.email && t.email.toLowerCase().includes(q)) ||
                                (t.department && t.department.toLowerCase().includes(q))
                              );
                            }).map((t) => (
                              <div
                                key={t.user_id}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, club_mentor_id: String(t.user_id) }));
                                  setMentorDropdownOpen(false);
                                  setMentorSearch("");
                                }}
                                style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(234, 179, 8, 0.15)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <div>
                                  <span style={{ fontWeight: 600, color: "#fff" }}>Prof. {t.name}</span>
                                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginLeft: "8px" }}>{t.email}</span>
                                </div>
                                {t.department && (
                                  <span style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700 }}>
                                    {t.department}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="club-edit-form-actions" style={{ marginTop: "20px" }}>
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
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)", boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)" }}
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
                if (isAdmin) {
                  fetchCandidates();
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
                    style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid #a855f7" }}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Full Name</label>
                  <div style={{ color: "#fff", fontSize: "1rem", fontWeight: "600" }}>{selectedMember.student_name || selectedMember.name}</div>
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>College Email</label>
                  <div style={{ color: "#fff", fontSize: "1rem" }}>{selectedMember.email}</div>
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Department</label>
                  <div style={{ color: "#fff", fontSize: "1rem" }}>{selectedMember.department || selectedMember.branch || "N/A"}</div>
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Academic Year</label>
                  <div style={{ color: "#fff", fontSize: "1rem" }}>{selectedMember.year ? `Year ${selectedMember.year}` : "N/A"}</div>
                </div>
              </div>

              {(selectedMember.reason || selectedMember.statement_of_purpose) && (
                <div style={{ marginTop: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", borderRadius: "8px" }}>
                  <label style={{ color: "#c084fc", fontSize: "0.88rem", fontWeight: "600", display: "block", marginBottom: "6px" }}>Statement of Purpose / Motivation</label>
                  <p style={{ color: "#cbd5e1", lineHeight: "1.6", margin: 0, fontSize: "0.92rem" }}>
                    "{selectedMember.reason || selectedMember.statement_of_purpose}"
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
                            background: "rgba(168, 85, 247, 0.15)",
                            color: "#c084fc",
                            border: "1px solid rgba(168, 85, 247, 0.3)",
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