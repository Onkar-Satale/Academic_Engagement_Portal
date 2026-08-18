import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import ClubCard from "../components/ClubCard";
import api from "../api/axios";
import "./Clubs.css";
import RegistrationModal from "../components/RegistrationModal";

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Club Form State
  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [newClubTagline, setNewClubTagline] = useState("");
  const [newClubCategory, setNewClubCategory] = useState("");
  const [selectedHeadId, setSelectedHeadId] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");

  const [headSearch, setHeadSearch] = useState("");
  const [headDropdownOpen, setHeadDropdownOpen] = useState(false);
  const [mentorSearch, setMentorSearch] = useState("");
  const [mentorDropdownOpen, setMentorDropdownOpen] = useState(false);

  const [candidates, setCandidates] = useState({ students: [], teachers: [] });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [enrolledClubs, setEnrolledClubs] = useState([]);

  const headRef = useRef(null);
  const mentorRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role_id === 3 || user?.role_name === "Admin";

  const fetchCandidates = async () => {
    if (!isAdmin) return;
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/clubs/candidates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidates(res.data || { students: [], teachers: [] });
    } catch (err) {
      console.error("Failed to fetch candidates for club assignment:", err);
    }
  };

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await api.get("/clubs", { headers });
      setClubs(res.data || []);

      if (user) {
        try {
          const enrolledRes = await api.get("/clubs/my/enrolled", { headers });
          setEnrolledClubs(enrolledRes.data || []);
        } catch (e) {
          console.error("Failed to fetch enrolled clubs", e);
        }
      }
    } catch (err) {
      console.error("Failed to fetch clubs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
    if (isAdmin) {
      fetchCandidates();
    }
  }, []);

  // Close custom dropdowns on click outside
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

  const addClub = async () => {
    if (!newClubName.trim()) {
      toast.error("Club Name is required ⚠️");
      return;
    }
    if (!newClubDesc.trim() || newClubDesc.trim().length < 10) {
      toast.error("Club Description is required (minimum 10 characters) ⚠️");
      return;
    }
    if (!selectedHeadId) {
      toast.error("A Club Head (Student) must be assigned to create a club 👑");
      return;
    }
    if (!selectedMentorId) {
      toast.error("A Club Mentor (Teacher / Faculty) must be assigned to create a club 🎓");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await api.post(
        "/clubs",
        {
          name: newClubName.trim(),
          description: newClubDesc.trim(),
          tagline: newClubTagline.trim() || null,
          category: newClubCategory.trim() || null,
          club_head_id: selectedHeadId ? Number(selectedHeadId) : null,
          club_mentor_id: selectedMentorId ? Number(selectedMentorId) : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Club created and leadership assigned successfully! 🏛️");

      setNewClubName("");
      setNewClubDesc("");
      setNewClubTagline("");
      setNewClubCategory("");
      setSelectedHeadId("");
      setSelectedMentorId("");
      setHeadSearch("");
      setMentorSearch("");
      fetchClubs();
      fetchCandidates();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add club ❌");
    }
  };

  const handleJoinClick = (club) => {
    setSelectedClub(club);
    setShowModal(true);
  };

  // Filtered candidate lists for searching
  const filteredStudents = (candidates.students || []).filter((s) => {
    if (!headSearch.trim()) return true;
    const q = headSearch.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  });

  const filteredTeachers = (candidates.teachers || []).filter((t) => {
    if (!mentorSearch.trim()) return true;
    const q = mentorSearch.toLowerCase();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.department && t.department.toLowerCase().includes(q))
    );
  });

  const selectedHeadObj = (candidates.students || []).find(
    (s) => String(s.user_id) === String(selectedHeadId)
  );

  const selectedMentorObj = (candidates.teachers || []).find(
    (t) => String(t.user_id) === String(selectedMentorId)
  );

  if (loading) return <p style={{ color: "#fff", padding: "20px" }}>Loading clubs...</p>;

  return (
    <>
      <div className="clubs-container">
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ margin: 0 }}>All Clubs ({clubs.length})</h2>
        </div>

        {/* Admin Add Club Section */}
        {isAdmin && (
          <div className="add-club-form" style={{ marginBottom: "32px", background: "#1c1917", border: "1px solid rgba(234, 179, 8, 0.35)", borderRadius: "14px", padding: "24px" }}>
            <h3 style={{ color: "#fef08a", marginTop: 0 }}>🏛️ Add New Club</h3>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "6px", fontWeight: 600 }}>Club Name *</label>
              <input
                className="input-field"
                name="new_club_title_field"
                autoComplete="off"
                placeholder="e.g. ACM Student Chapter"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "6px", fontWeight: 600 }}>Description *</label>
              <textarea
                className="input-field"
                name="new_club_desc_field"
                autoComplete="off"
                rows="2"
                style={{ resize: "vertical", minHeight: "44px" }}
                placeholder="Short overview of club purpose and mission"
                value={newClubDesc}
                onChange={(e) => setNewClubDesc(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "6px", fontWeight: 600 }}>Tagline (Optional)</label>
                <input
                  className="input-field"
                  placeholder="e.g. Innovate, Create, Inspire"
                  value={newClubTagline}
                  onChange={(e) => setNewClubTagline(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "6px", fontWeight: 600 }}>Category (Optional)</label>
                <input
                  className="input-field"
                  placeholder="e.g. Technical / Cultural / Sports"
                  value={newClubCategory}
                  onChange={(e) => setNewClubCategory(e.target.value)}
                />
              </div>
            </div>

            {/* 👑 Search & Assign Club Head (From Students) */}
            <div style={{ marginBottom: "16px", padding: "14px", background: "rgba(0, 0, 0, 0.35)", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }} ref={headRef}>
              <label style={{ display: "block", fontSize: "0.88rem", color: "#fde047", fontWeight: 700, marginBottom: "8px" }}>
                👑 Appoint Club Head (Student) *
              </label>

              {selectedHeadObj ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#27272a", border: "1px solid rgba(234, 179, 8, 0.4)", borderRadius: "8px", padding: "8px 14px", marginBottom: "6px" }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "#f8fafc" }}>{selectedHeadObj.name}</span>
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginLeft: "8px" }}>({selectedHeadObj.email})</span>
                    {selectedHeadObj.department && (
                      <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700, marginLeft: "8px" }}>
                        {selectedHeadObj.department}{selectedHeadObj.year ? ` - Yr ${selectedHeadObj.year}` : ''}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedHeadId(""); setHeadSearch(""); }}
                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}
                    title="Remove selection"
                  >
                    ✕
                  </button>
                </div>
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
                      {filteredStudents.length === 0 ? (
                        <p style={{ padding: "12px", color: "#94a3b8", margin: 0, fontSize: "0.85rem", textAlign: "center" }}>No students found</p>
                      ) : (
                        filteredStudents.map((s) => (
                          <div
                            key={s.user_id}
                            onClick={() => {
                              setSelectedHeadId(String(s.user_id));
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

            {/* 🎓 Search & Assign Club Mentor (From Teachers) */}
            <div style={{ marginBottom: "20px", padding: "14px", background: "rgba(0, 0, 0, 0.35)", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }} ref={mentorRef}>
              <label style={{ display: "block", fontSize: "0.88rem", color: "#fde047", fontWeight: 700, marginBottom: "8px" }}>
                🎓 Appoint Club Mentor (Teacher / Faculty) *
              </label>

              {selectedMentorObj ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#27272a", border: "1px solid rgba(234, 179, 8, 0.4)", borderRadius: "8px", padding: "8px 14px", marginBottom: "6px" }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "#f8fafc" }}>Prof. {selectedMentorObj.name}</span>
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginLeft: "8px" }}>({selectedMentorObj.email})</span>
                    {selectedMentorObj.department && (
                      <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700, marginLeft: "8px" }}>
                        {selectedMentorObj.department}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedMentorId(""); setMentorSearch(""); }}
                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}
                    title="Remove selection"
                  >
                    ✕
                  </button>
                </div>
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
                      {filteredTeachers.length === 0 ? (
                        <p style={{ padding: "12px", color: "#94a3b8", margin: 0, fontSize: "0.85rem", textAlign: "center" }}>No faculty found</p>
                      ) : (
                        filteredTeachers.map((t) => (
                          <div
                            key={t.user_id}
                            onClick={() => {
                              setSelectedMentorId(String(t.user_id));
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

            <button
              className="add-club-btn"
              onClick={addClub}
              style={{
                background: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
                color: "#000",
                fontWeight: 700,
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "0.95rem",
                cursor: "pointer"
              }}
            >
              ➕ Create Club
            </button>
          </div>
        )}

        {/* Clubs Grid */}
        {clubs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(255, 255, 255, 0.02)", border: "1px dashed rgba(255, 255, 255, 0.15)", borderRadius: "12px", color: "#94a3b8" }}>
            <p style={{ margin: 0 }}>No clubs have been created yet.</p>
          </div>
        ) : (
          <div className="clubs-grid">
            {clubs.map((c) => (
              <ClubCard
                key={c.club_id}
                club={c}
                onJoin={handleJoinClick}
                isEnrolled={enrolledClubs.some(id => String(id) === String(c.club_id))}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && selectedClub && (
        <RegistrationModal
          clubId={selectedClub.club_id}
          clubName={selectedClub.name}
          onClose={() => {
            setShowModal(false);
            setSelectedClub(null);
          }}
          onSuccess={(msg) => {
            toast.success(msg || "Application submitted successfully! 🎉");
            setShowModal(false);
            setSelectedClub(null);
            fetchClubs();
          }}
        />
      )}
    </>
  );
}
