import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ClubCard from "../components/ClubCard";
import FacultyChairSelector from "../components/FacultyChairSelector";
import api from "../api/axios";
import "./Account.css";
import EventCard from "../components/EventCard";

// Clean SVG Icons
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const clubsRef = useRef(null);

  const scrollToClubs = () => {
    clubsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔽 LEAVE CLUB & DELETE ACCOUNT STATES
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [clubToLeave, setClubToLeave] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [events, setEvents] = useState([]);

  // 📜 AUTHORITY DECISION & APPROVAL HISTORY
  const [authorityHistory, setAuthorityHistory] = useState([]);

  // 🏛️ INSTITUTIONAL AUTHORITY CHAIRS STATES
  const [authoritySeats, setAuthoritySeats] = useState({
    admin_id: "",
    director_id: "",
    principal_id: "",
    estate_manager_id: ""
  });
  const [facultyCandidates, setFacultyCandidates] = useState([]);
  const [savingSeats, setSavingSeats] = useState(false);
  const [seatsLoading, setSeatsLoading] = useState(false);

  // 👥 ADMIN ALL USERS DIRECTORY STATES
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedRoleCategory, setSelectedRoleCategory] = useState("all");
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [togglingRetiredUserId, setTogglingRetiredUserId] = useState(null);
  const [togglingPassoutUserId, setTogglingPassoutUserId] = useState(null);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [showBatchGraduateModal, setShowBatchGraduateModal] = useState(false);
  const [showBatchPromoteModal, setShowBatchPromoteModal] = useState(false);
  const [batchDeptFilter, setBatchDeptFilter] = useState("all");

  const profileOnlyRoles = ["Admin", "Estate Manager", "Principal", "Director", "Club Mentor", "Club Head", "Teacher"];
  const isProfileOnly = profileOnlyRoles.includes(user?.role_name) || [2, 3, 5, 6, 7, 8, 9].includes(user?.role_id) || [2, 3, 5, 6, 7, 8, 9].includes(user?.role);
  const isAdmin = user?.role_name === "Admin" || user?.role_id === 3;

  useEffect(() => {
    syncFreshProfile();

    const handleAuth = () => {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      setUser(u);
    };
    const handleFocus = () => {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u?.role_name === "Admin" || u?.role_id === 3) {
        fetchAllUsers();
        fetchAuthoritySeats();
      }
    };

    window.addEventListener("authChange", handleAuth);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("authChange", handleAuth);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const syncFreshProfile = async () => {
    try {
      const res = await api.get("/users/profile");
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (res.data.token) localStorage.setItem("token", res.data.token);
        if (res.data.refreshToken) localStorage.setItem("refreshToken", res.data.refreshToken);

        const freshIsAdmin = res.data.user.role_name === "Admin" || res.data.user.role_id === 3;
        if (freshIsAdmin) {
          fetchAllUsers();
          fetchAuthoritySeats();
        }

        const freshIsProfileOnly = profileOnlyRoles.includes(res.data.user.role_name) || [2, 3, 5, 6, 7, 8, 9].includes(res.data.user.role_id);
        if (!freshIsProfileOnly) {
          fetchMyClubs();
          fetchMyEvents();
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.warn("Profile sync error:", err);
      setLoading(false);
    }
    fetchAuthorityHistory();
  };

  const fetchAuthorityHistory = async () => {
    try {
      const res = await api.get("/users/authority-history");
      setAuthorityHistory(res.data || []);
    } catch (err) {
      console.warn("Authority history load warning:", err);
    }
  };

  const fetchAuthoritySeats = async () => {
    setSeatsLoading(true);
    try {
      const res = await api.get("/users/authority-seats");
      const { currentHolders, facultyCandidates } = res.data;
      setFacultyCandidates(facultyCandidates || []);

      const seatsObj = { admin_id: "", director_id: "", principal_id: "", estate_manager_id: "" };
      (currentHolders || []).forEach((h) => {
        if (h.role_id === 3) seatsObj.admin_id = String(h.user_id);
        if (h.role_id === 8) seatsObj.director_id = String(h.user_id);
        if (h.role_id === 7) seatsObj.principal_id = String(h.user_id);
        if (h.role_id === 6) seatsObj.estate_manager_id = String(h.user_id);
      });
      setAuthoritySeats(seatsObj);
    } catch (err) {
      console.error("Failed to load authority seats", err);
    } finally {
      setSeatsLoading(false);
    }
  };

  const handleSaveAuthoritySeats = async (e) => {
    e.preventDefault();
    setSavingSeats(true);
    try {
      const res = await api.put("/users/authority-seats", authoritySeats);
      toast.success(res.data?.message || "Authority chairs updated successfully! 🏛️");
      fetchAllUsers();
      fetchAuthoritySeats();
      syncFreshProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update authority chairs ❌");
    } finally {
      setSavingSeats(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await api.get("/users");
      setAllUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch all users", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    setTogglingUserId(targetUser.user_id);
    try {
      const res = await api.patch(`/users/${targetUser.user_id}/toggle-status`);
      toast.success(res.data?.message || "User status updated successfully!");
      setAllUsers((prev) =>
        prev.map((u) =>
          u.user_id === targetUser.user_id
            ? { ...u, is_active: u.is_active === 1 ? 0 : 1 }
            : u
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change user status ❌");
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleToggleSelfRetired = async () => {
    try {
      const res = await api.patch("/users/me/toggle-retired");
      toast.success(res.data?.message || "Retirement status updated!");
      setUser((prev) => ({ ...prev, is_retired: res.data?.user?.is_retired, role_id: res.data?.user?.role_id, role_name: res.data?.user?.role_name }));
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      stored.is_retired = res.data?.user?.is_retired;
      if (res.data?.user?.role_id) stored.role_id = res.data?.user?.role_id;
      if (res.data?.user?.role_name) stored.role_name = res.data?.user?.role_name;
      localStorage.setItem("user", JSON.stringify(stored));
      syncFreshProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update retirement status.");
    }
  };

  const handleAdminToggleRetired = async (targetUser) => {
    setTogglingRetiredUserId(targetUser.user_id);
    try {
      const res = await api.patch(`/users/${targetUser.user_id}/toggle-retired`);
      toast.success(res.data?.message || "User retirement status updated!");
      setAllUsers((prev) =>
        prev.map((u) =>
          u.user_id === targetUser.user_id
            ? {
                ...u,
                is_retired: res.data?.user?.is_retired,
                role_id: res.data?.user?.role_id || u.role_id,
                role_name: res.data?.user?.role_name || u.role_name
              }
            : u
        )
      );
      fetchAuthoritySeats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update retirement status.");
    } finally {
      setTogglingRetiredUserId(null);
    }
  };

  const handleToggleSelfPassout = async () => {
    try {
      const res = await api.patch("/users/me/toggle-passout");
      toast.success(res.data?.message || "Academic status updated!");
      setUser((prev) => ({ ...prev, is_passout: res.data?.user?.is_passout }));
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      stored.is_passout = res.data?.user?.is_passout;
      localStorage.setItem("user", JSON.stringify(stored));
      syncFreshProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update academic status.");
    }
  };

  const handleAdminTogglePassout = async (targetUser) => {
    setTogglingPassoutUserId(targetUser.user_id);
    try {
      const res = await api.patch(`/users/${targetUser.user_id}/toggle-passout`);
      toast.success(res.data?.message || "Student status updated!");
      setAllUsers((prev) =>
        prev.map((u) =>
          u.user_id === targetUser.user_id
            ? { ...u, is_passout: res.data?.user?.is_passout }
            : u
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update passout status.");
    } finally {
      setTogglingPassoutUserId(null);
    }
  };

  const handleBatchGraduate = async () => {
    setBatchActionLoading(true);
    try {
      const res = await api.post("/users/batch-graduate", { department: batchDeptFilter });
      toast.success(res.data?.message || "Final Year BE students graduated successfully! 🎓");
      setShowBatchGraduateModal(false);
      fetchAllUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to execute batch graduation.");
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBatchPromote = async () => {
    setBatchActionLoading(true);
    try {
      const res = await api.post("/users/batch-promote");
      toast.success(res.data?.message || "Annual academic batch roll-over completed! 🚀");
      setShowBatchPromoteModal(false);
      fetchAllUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to execute annual roll-over.");
    } finally {
      setBatchActionLoading(false);
    }
  };

  const fetchMyClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/club-members/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClubs(res.data);
    } catch (err) {
      console.error("Failed to fetch user's clubs", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 OPEN LEAVE CLUB CONFIRM
  const askLeaveClub = (club) => {
    setClubToLeave(club);
    setShowLeaveConfirm(true);
  };

  // 🔹 CONFIRM LEAVE CLUB
  const confirmLeaveClub = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/club-members/leave",
        { club_id: clubToLeave.club_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setClubs(clubs.filter((c) => c.club_id !== clubToLeave.club_id));
      toast.success(`Left ${clubToLeave.name} successfully`);
    } catch (err) {
      toast.error("Failed to leave club ❌");
    } finally {
      setShowLeaveConfirm(false);
      setClubToLeave(null);
    }
  };

  // 👥 ADMIN USER DIRECTORY ACTIONS & FILTERING
  const roleCategories = [
    { key: "all", label: "All Users", icon: "👥" },
    { key: "1", label: "Students", icon: "🎓", roleId: 1, roleName: "Student" },
    { key: "passout", label: "Passout / Alumni", icon: "🎓" },
    { key: "retired", label: "Retired Faculty", icon: "🏷️" },
    { key: "2", label: "Teachers", icon: "👨‍🏫", roleId: 2, roleName: "Teacher" },
    { key: "4", label: "Club Heads", icon: "👑", roleId: 4, roleName: "Club Head" },
    { key: "5", label: "Club Mentors", icon: "🎓", roleId: 5, roleName: "Club Mentor" },
    { key: "6", label: "Estate Managers", icon: "🏢", roleId: 6, roleName: "Estate Manager" },
    { key: "7", label: "Principals", icon: "👑", roleId: 7, roleName: "Principal" },
    { key: "8", label: "Directors", icon: "🎓", roleId: 8, roleName: "Director" },
    { key: "3", label: "Admins", icon: "🛡️", roleId: 3, roleName: "Admin" },
  ];

  const askDeleteUser = (u) => {
    setUserToDelete(u);
    setShowDeleteUserModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      await api.delete(`/users/${userToDelete.user_id}`);
      toast.success(`User '${userToDelete.name}' deleted successfully! 🗑️`);
      setAllUsers((prev) => prev.filter((u) => u.user_id !== userToDelete.user_id));
      setShowDeleteUserModal(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user ❌");
    } finally {
      setDeletingUser(false);
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    if (selectedRoleCategory !== "all") {
      if (selectedRoleCategory === "passout") {
        if (!u.is_passout) return false;
      } else if (selectedRoleCategory === "retired") {
        if (!u.is_retired) return false;
      } else {
        const targetCat = roleCategories.find(c => c.key === selectedRoleCategory);
        const matchesId = Number(u.role_id) === Number(targetCat?.roleId);
        const matchesName = u.role_name?.toLowerCase() === targetCat?.roleName?.toLowerCase();
        if (!matchesId && !matchesName) return false;
      }
    }
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchDept = u.department?.toLowerCase().includes(q);
      const matchRole = u.role_name?.toLowerCase().includes(q);
      const matchYear = u.year && String(u.year).includes(q);
      return matchName || matchEmail || matchDept || matchRole || matchYear;
    }
    return true;
  });

  // 🔹 CONFIRM DELETE ACCOUNT
  const confirmDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.delete("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.dispatchEvent(new Event("authChange"));
      toast.success("Your account has been deleted successfully 👋");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account ❌");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/event-registrations/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch registered events", err);
    }
  };

  if (loading) return <p>Loading your profile...</p>;

  return (
    <>
      <div className="account-container">
        {/* Header */}
        <div className="account-header">
          <h2>My Account</h2>
          <div className="header-actions">
            {!isProfileOnly && (
              <button className="my-clubs-btn" onClick={scrollToClubs}>
                My Clubs
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="account-card">
          <h3>Personal Details</h3>
          <p><b>Name:</b> {user?.name}</p>
          <p><b>Email:</b> {user?.email}</p>
          {!["Admin", "Estate Manager", "Principal", "Director"].includes(user?.role_name) && user?.department && (
            <p><b>Department:</b> {user?.department}</p>
          )}
          {["Student", "Club Head"].includes(user?.role_name) && user?.year && (
            <p><b>Year:</b> {user?.year}</p>
          )}
          <p><b>Role:</b> <span style={{ color: 'var(--primary-light)', fontWeight: '700', fontSize: '1.05rem' }}>
            {(user?.is_retired === 1 || user?.is_retired === true) && !["Student", "Club Head"].includes(user?.role_name)
              ? `Retired ${user?.role_name || 'Faculty'}`
              : (user?.is_passout === 1 || user?.is_passout === true) && ["Student", "Club Head"].includes(user?.role_name)
                ? `Passout / Alumni (Student)`
                : user?.role_name}
          </span></p>

          {["Student", "Club Head"].includes(user?.role_name) && (
            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <b style={{ color: "var(--text-muted)", fontWeight: "500" }}>Academic Status:</b>
                {user?.is_passout === 1 || user?.is_passout === true ? (
                  <span className="retired-status-badge" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#d8b4fe", borderColor: "rgba(168, 85, 247, 0.35)" }}>
                    🎓 Passout / Alumni
                  </span>
                ) : (
                  <span className="active-faculty-badge" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.35)" }}>
                    🎓 Current Active Student (Year {user?.year || "1"})
                  </span>
                )}
              </div>
              <div>
                <button
                  type="button"
                  className={user?.is_passout === 1 || user?.is_passout === true ? "reactivate-faculty-btn" : "declare-retirement-btn"}
                  style={!(user?.is_passout === 1 || user?.is_passout === true) ? { background: "rgba(168, 85, 247, 0.15)", color: "#d8b4fe", borderColor: "rgba(168, 85, 247, 0.35)" } : {}}
                  onClick={handleToggleSelfPassout}
                >
                  {user?.is_passout === 1 || user?.is_passout === true ? "🎓 Mark as Active Student" : "🎓 Declare Graduation (Mark as Passout)"}
                </button>
              </div>
            </div>
          )}

          {!["Student", "Club Head"].includes(user?.role_name) && Number(user?.role_id) !== 1 && Number(user?.role_id) !== 4 && (
            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <b style={{ color: "var(--text-muted)", fontWeight: "500" }}>Faculty Status:</b>
                {user?.is_retired === 1 || user?.is_retired === true ? (
                  <span className="retired-status-badge">🏷️ Retired Faculty</span>
                ) : (
                  <span className="active-faculty-badge">✅ Active Faculty</span>
                )}
              </div>
              <div>
                <button
                  type="button"
                  className={user?.is_retired === 1 || user?.is_retired === true ? "reactivate-faculty-btn" : "declare-retirement-btn"}
                  onClick={handleToggleSelfRetired}
                >
                  {user?.is_retired === 1 || user?.is_retired === true ? "✅ Mark as Active Faculty" : "🏷️ Declare Retirement (Mark as Retired)"}
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: "16px" }}>
            <button
              className="delete-account-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              🗑️ Delete Account
            </button>
          </div>
        </div>

        {/* 📜 MY OFFICIAL APPROVAL & AUTHORITY DECISION HISTORY */}
        {authorityHistory.length > 0 && (
          <div className="account-card" style={{ border: "1px solid rgba(56, 189, 248, 0.3)", background: "linear-gradient(145deg, #0f172a 0%, #18181b 100%)" }}>
            <div className="admin-card-header" style={{ marginBottom: "12px" }}>
              <div>
                <h3 style={{ color: "#38bdf8", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 4px 0" }}>
                  📜 My Official Approval & Decision History
                </h3>
                <p className="subtitle-text" style={{ color: "#94a3b8", margin: 0 }}>
                  Audit log of all event permission reviews and decisions submitted by your account across institutional roles.
                </p>
              </div>
            </div>

            <div className="keys-table-wrapper" style={{ marginTop: "12px" }}>
              <table className="keys-table">
                <thead>
                  <tr>
                    <th>Event Request</th>
                    <th>Club</th>
                    <th>Stage Acted As</th>
                    <th>Decision</th>
                    <th>Date & Time</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {authorityHistory.map((item) => (
                    <tr key={item.approval_id}>
                      <td style={{ fontWeight: "600", color: "#f8fafc" }}>
                        {item.request_title}
                      </td>
                      <td>
                        <span style={{ color: "#cbd5e1" }}>{item.club_name}</span>
                      </td>
                      <td>
                        <span style={{
                          background: "rgba(56, 189, 248, 0.15)",
                          color: "#38bdf8",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: "700"
                        }}>
                          {item.authority_stage_title}
                        </span>
                      </td>
                      <td>
                        {item.status === "approved" ? (
                          <span style={{ color: "#22c55e", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                            ✅ Approved
                          </span>
                        ) : (
                          <span style={{ color: "#ef4444", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                            ❌ Rejected
                          </span>
                        )}
                      </td>
                      <td style={{ color: "#94a3b8", fontSize: "0.84rem" }}>
                        {new Date(item.action_date).toLocaleDateString()} {new Date(item.action_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ color: "#cbd5e1", fontSize: "0.85rem", fontStyle: item.remarks ? "normal" : "italic" }}>
                        {item.remarks ? `"${item.remarks}"` : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🏛️ INSTITUTIONAL AUTHORITY CHAIRS MANAGEMENT (ADMIN ONLY) */}
        {isAdmin && (
          <div className="account-card" style={{ border: "1px solid rgba(234, 179, 8, 0.35)", background: "linear-gradient(145deg, #1c1917 0%, #18181b 100%)" }}>
            <div className="admin-card-header" style={{ marginBottom: "16px" }}>
              <div>
                <h3 style={{ color: "#fef08a", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 4px 0" }}>
                  🏛️ Institutional Authority Chairs
                </h3>
                <p className="subtitle-text" style={{ color: "#a1a1aa", margin: 0 }}>
                  Search and appoint any faculty member directly to Director, Principal, Estate Manager, or Admin chairs without secret keys.
                </p>
              </div>
            </div>

            {seatsLoading ? (
              <p style={{ color: "#94a3b8" }}>Loading authority seats...</p>
            ) : (
              <form onSubmit={handleSaveAuthoritySeats} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginTop: "12px" }}>
                {/* 🎓 Director Chair */}
                <FacultyChairSelector
                  title="Director"
                  subtitle="Level 4 Final Approval Chair"
                  icon="🎓"
                  selectedUserId={authoritySeats.director_id}
                  candidates={facultyCandidates}
                  onChange={(val) => setAuthoritySeats((prev) => ({ ...prev, director_id: val }))}
                  accentColor="#fde047"
                />

                {/* 🏫 Principal Chair */}
                <FacultyChairSelector
                  title="Principal"
                  subtitle="Level 3 Institutional Review Chair"
                  icon="🏫"
                  selectedUserId={authoritySeats.principal_id}
                  candidates={facultyCandidates}
                  onChange={(val) => setAuthoritySeats((prev) => ({ ...prev, principal_id: val }))}
                  accentColor="#fde047"
                />

                {/* 🏢 Estate Manager Chair */}
                <FacultyChairSelector
                  title="Estate Manager"
                  subtitle="Level 2 Infrastructure Review Chair"
                  icon="🏢"
                  selectedUserId={authoritySeats.estate_manager_id}
                  candidates={facultyCandidates}
                  onChange={(val) => setAuthoritySeats((prev) => ({ ...prev, estate_manager_id: val }))}
                  accentColor="#fde047"
                />

                {/* 👑 System Admin Chair */}
                <FacultyChairSelector
                  title="Primary System Admin"
                  subtitle="Institutional Root Administrator"
                  icon="👑"
                  selectedUserId={authoritySeats.admin_id}
                  candidates={facultyCandidates}
                  onChange={(val) => setAuthoritySeats((prev) => ({ ...prev, admin_id: val }))}
                  accentColor="#fde047"
                />

                {/* Save Seats Button */}
                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    type="submit"
                    disabled={savingSeats}
                    style={{
                      background: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
                      color: "#000",
                      border: "none",
                      borderRadius: "8px",
                      padding: "11px 24px",
                      fontWeight: "700",
                      fontSize: "0.92rem",
                      cursor: savingSeats ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(234, 179, 8, 0.35)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    {savingSeats ? "Saving Chairs..." : "💾 Save Authority Assignments"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 👥 ADMIN USER DIRECTORY & ACCOUNT MANAGEMENT */}
        {isAdmin && (
          <div className="account-card admin-users-card">
            <div className="admin-card-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", width: "100%" }}>
                <div>
                  <h3>👥 User Directory & Account Management</h3>
                  <p className="subtitle-text">Inspect registered accounts, filter by role, activate/deactivate access, and delete accounts.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchAllUsers}
                  disabled={usersLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  🔄 {usersLoading ? "Refreshing..." : "Refresh Users"}
                </button>
              </div>
            </div>

            {/* 🎓 BATCH ACADEMIC PROGRESSION & GRADUATION TOOLS */}
            <div style={{
              background: "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
              border: "1px solid rgba(147, 51, 234, 0.3)",
              borderRadius: "12px",
              padding: "16px 20px",
              margin: "18px 0",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h4 style={{ margin: 0, color: "#f8fafc", fontSize: "1.02rem", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
                    🎓 Batch Academic Progression & Graduation Tools
                  </h4>
                  <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "0.83rem" }}>
                    Graduate all 4th-year (BE) students into Passout / Alumni in 1-click, or perform the annual college batch roll-over (FE → SE → TE → BE → Alumni).
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setShowBatchGraduateModal(true)}
                    disabled={batchActionLoading}
                    style={{
                      background: "linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)",
                      color: "#fff",
                      border: "none",
                      padding: "9px 15px",
                      borderRadius: "8px",
                      fontSize: "0.84rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 3px 10px rgba(147, 51, 234, 0.3)"
                    }}
                  >
                    🎓 Graduate BE (Year 4) Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBatchPromoteModal(true)}
                    disabled={batchActionLoading}
                    style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      color: "#fff",
                      border: "none",
                      padding: "9px 15px",
                      borderRadius: "8px",
                      fontSize: "0.84rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 3px 10px rgba(59, 130, 246, 0.3)"
                    }}
                  >
                    🚀 Annual Batch Roll-over (All Years)
                  </button>
                </div>
              </div>
            </div>

            {/* Role Category Filter Chips */}
            <div className="admin-role-filter-bar">
              {roleCategories.map((cat) => {
                let count = 0;
                if (cat.key === "all") count = allUsers.length;
                else if (cat.key === "passout") count = allUsers.filter(u => u.is_passout === 1 || u.is_passout === true).length;
                else if (cat.key === "retired") count = allUsers.filter(u => u.is_retired === 1 || u.is_retired === true).length;
                else count = allUsers.filter(u => Number(u.role_id) === cat.roleId || u.role_name?.toLowerCase() === cat.roleName?.toLowerCase()).length;
                const isSelected = selectedRoleCategory === cat.key;

                return (
                  <button
                    key={cat.key}
                    type="button"
                    className={`role-filter-chip ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedRoleCategory(cat.key)}
                  >
                    <span>{cat.icon} {cat.label}</span>
                    <span className="role-filter-count">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div style={{ margin: "14px 0 20px 0" }}>
              <input
                type="text"
                placeholder="🔍 Search user by name, email, department, or role..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="user-search-input"
              />
            </div>

            {/* Users Table */}
            {usersLoading ? (
              <p style={{ color: "#94a3b8", padding: "20px 0" }}>Loading user directory...</p>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "36px 20px", background: "rgba(255, 255, 255, 0.02)", border: "1px dashed rgba(255, 255, 255, 0.12)", borderRadius: "12px", color: "#94a3b8" }}>
                <p style={{ margin: 0 }}>No users found for the selected category or search filter.</p>
              </div>
            ) : (
              <div className="keys-table-wrapper">
                <table className="keys-table users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Department / Year</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isCurrentUser = Number(u.user_id) === Number(user?.id);
                      const roleName = u.role_name || "Member";
                      const isActive = u.is_active === 1 || u.is_active === true;
                      const icon = roleName === "Student" ? "🎓" 
                        : roleName === "Teacher" ? "👨‍🏫"
                        : roleName === "Admin" ? "🛡️"
                        : roleName === "Club Head" ? "👑"
                        : roleName === "Club Mentor" ? "🎓"
                        : roleName === "Estate Manager" ? "🏢"
                        : roleName === "Principal" ? "👑"
                        : roleName === "Director" ? "🎓"
                        : "👤";

                      return (
                        <tr key={u.user_id} style={{ opacity: isActive ? 1 : 0.65 }}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div className="user-avatar-circle" style={{ background: isActive ? "" : "#475569" }}>
                                {u.name ? u.name.charAt(0).toUpperCase() : "?"}
                              </div>
                              <div>
                                <span style={{ fontWeight: "600", color: "#f8fafc", display: "block" }}>
                                  {u.name} {isCurrentUser && <span style={{ color: "#38bdf8", fontSize: "0.75rem", fontWeight: "700" }}>(You)</span>}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ color: "#94a3b8", fontSize: "0.88rem" }}>{u.email}</span>
                          </td>
                          <td>
                            <span className="role-tag" style={
                              (u.is_retired === 1 || u.is_retired === true) && !["Student", "Club Head"].includes(roleName)
                                ? { border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fca5a5" }
                                : (u.is_passout === 1 || u.is_passout === true) && ["Student", "Club Head"].includes(roleName)
                                  ? { border: "1px solid rgba(168, 85, 247, 0.4)", color: "#d8b4fe" }
                                  : {}
                            }>
                              {icon} {(u.is_retired === 1 || u.is_retired === true) && !["Student", "Club Head"].includes(roleName)
                                ? `Retired ${roleName}`
                                : (u.is_passout === 1 || u.is_passout === true) && ["Student", "Club Head"].includes(roleName)
                                  ? `Passout Student`
                                  : roleName}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                              {isActive ? (
                                <span style={{
                                  background: "rgba(34, 197, 94, 0.15)",
                                  color: "#4ade80",
                                  border: "1px solid rgba(34, 197, 94, 0.3)",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: "0.76rem",
                                  fontWeight: "700"
                                }}>
                                  ● Active
                                </span>
                              ) : (
                                <span style={{
                                  background: "rgba(239, 68, 68, 0.15)",
                                  color: "#f87171",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: "0.76rem",
                                  fontWeight: "700"
                                }}>
                                  ⏸️ Deactivated
                                </span>
                              )}
                              {(u.is_retired === 1 || u.is_retired === true) && !["Student", "Club Head"].includes(roleName) && (
                                <span className="retired-status-badge">
                                  🏷️ Retired
                                </span>
                              )}
                              {(u.is_passout === 1 || u.is_passout === true) && ["Student", "Club Head"].includes(roleName) && (
                                <span className="retired-status-badge" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#d8b4fe", borderColor: "rgba(168, 85, 247, 0.35)" }}>
                                  🎓 Passout
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>
                              {u.department ? u.department : "—"}
                              {u.year ? ` • Year ${u.year}` : ""}
                            </span>
                          </td>
                          <td>
                            {!isCurrentUser ? (
                              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                                {["Student", "Club Head"].includes(roleName) && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdminTogglePassout(u)}
                                    disabled={togglingPassoutUserId === u.user_id}
                                    title={u.is_passout ? "Mark student as active" : "Mark student as passout alumni"}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      padding: "5px 8px",
                                      background: u.is_passout ? "rgba(34, 197, 94, 0.15)" : "rgba(168, 85, 247, 0.15)",
                                      border: u.is_passout ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid rgba(168, 85, 247, 0.35)",
                                      borderRadius: "6px",
                                      color: u.is_passout ? "#4ade80" : "#d8b4fe",
                                      fontSize: "0.76rem",
                                      fontWeight: "600",
                                      cursor: "pointer"
                                    }}
                                  >
                                    {u.is_passout ? "🎓 Unmark Passout" : "🎓 Passout"}
                                  </button>
                                )}
                                {!["Student", "Club Head"].includes(roleName) && Number(u.role_id) !== 1 && Number(u.role_id) !== 4 && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdminToggleRetired(u)}
                                    disabled={togglingRetiredUserId === u.user_id}
                                    title={u.is_retired ? "Mark faculty as active" : "Mark faculty as retired"}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      padding: "5px 8px",
                                      background: u.is_retired ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                      border: u.is_retired ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid rgba(245, 158, 11, 0.35)",
                                      borderRadius: "6px",
                                      color: u.is_retired ? "#4ade80" : "#fbbf24",
                                      fontSize: "0.76rem",
                                      fontWeight: "600",
                                      cursor: "pointer"
                                    }}
                                  >
                                    {u.is_retired ? "✅ Unretire" : "🏷️ Retire"}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(u)}
                                  disabled={togglingUserId === u.user_id}
                                  title={isActive ? "Deactivate user account" : "Activate user account"}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "5px 10px",
                                    background: isActive ? "rgba(245, 158, 11, 0.15)" : "rgba(34, 197, 94, 0.15)",
                                    border: isActive ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid rgba(34, 197, 94, 0.35)",
                                    borderRadius: "6px",
                                    color: isActive ? "#fbbf24" : "#4ade80",
                                    fontSize: "0.78rem",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                  }}
                                >
                                  {isActive ? "⏸️ Deactivate" : "▶️ Activate"}
                                </button>
                                <button
                                  type="button"
                                  className="revoke-btn"
                                  onClick={() => askDeleteUser(u)}
                                  title={`Delete user ${u.name}`}
                                >
                                  <TrashIcon />
                                  <span>Delete</span>
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: "#64748b", fontSize: "0.82rem", fontStyle: "italic" }}>
                                Current Session
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Events & Sessions - Only show for non-profile-only roles */}
        {!isProfileOnly && (
          <>
            <div>
              <h3>Events & Sessions</h3>
            </div>
            <br />
            {events.length === 0 ? (
              <p>You have not registered for any events yet.</p>
            ) : (
              <div className="events-grid">
                {events.map((event) => (
                  <EventCard key={event.event_id} event={event} isRegistered={true} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Clubs - Only show for non-profile-only roles */}
        {!isProfileOnly && (
          <div className="account-card" ref={clubsRef}>
            <h3>My Clubs</h3>
            {clubs.length === 0 ? (
              <p>You are not a member of any clubs yet.</p>
            ) : (
              <div className="clubs-grid">
                {clubs.map((c) => (
                  <div key={c.club_id} className="club-card-wrapper">
                    <ClubCard club={c} isEnrolled={true} />
                    {/* Hide Leave button for Head/Mentor */}
                    {user?.id !== c.club_head_id && user?.id !== c.club_mentor_id && (
                      <button
                        className="leave-club-btn"
                        onClick={() => askLeaveClub(c)}
                      >
                        Leave Club
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🔴 LEAVE CLUB CONFIRM */}
      {showLeaveConfirm && (
        <div className="confirm-toast">
          <p>Leave <b>{clubToLeave?.name}</b>?</p>
          <div className="confirm-actions">
            <button className="yes-btn" onClick={confirmLeaveClub}>
              Confirm
            </button>
            <button
              className="no-btn"
              onClick={() => {
                setShowLeaveConfirm(false);
                setClubToLeave(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ DELETE ACCOUNT CONFIRM */}
      {showDeleteConfirm && (
        <div className="confirm-toast">
          <p>⚠️ Are you sure you want to <b>delete your account</b>? This action cannot be undone!</p>
          <div className="confirm-actions">
            <button className="yes-btn" style={{ background: '#ef4444' }} onClick={confirmDeleteAccount}>
              Delete Account
            </button>
            <button className="no-btn" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE USER BY ADMIN CONFIRM */}
      {showDeleteUserModal && userToDelete && (
        <div className="confirm-toast">
          <p>
            🗑️ Are you sure you want to <b>permanently delete</b> user <b>{userToDelete.name}</b> ({userToDelete.role_name || "User"})?
            <br />
            <span style={{ fontSize: "0.82rem", color: "#fca5a5" }}>
              All their club memberships, registrations, and permissions will be cleared immediately.
            </span>
          </p>
          <div className="confirm-actions">
            <button
              className="yes-btn"
              style={{ background: '#ef4444' }}
              onClick={confirmDeleteUser}
              disabled={deletingUser}
            >
              {deletingUser ? "Deleting..." : "Yes, Delete User"}
            </button>
            <button
              className="no-btn"
              onClick={() => {
                setShowDeleteUserModal(false);
                setUserToDelete(null);
              }}
              disabled={deletingUser}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 🎓 BATCH GRADUATE FINAL YEAR CONFIRM MODAL */}
      {showBatchGraduateModal && (
        <div className="confirm-toast" style={{ maxWidth: "480px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#f8fafc", fontSize: "1.1rem" }}>
            🎓 Graduate Final Year (BE - Year 4) Batch
          </h4>
          <p style={{ margin: "0 0 12px 0", color: "#cbd5e1", fontSize: "0.88rem", lineHeight: "1.5" }}>
            This action will mark all <b>4th-year (BE)</b> students as <b>Passout / Alumni</b>. Any active Club Head leadership held by graduating students will be automatically unlinked.
          </p>
          <div style={{ margin: "10px 0 16px 0", textAlign: "left" }}>
            <label style={{ display: "block", fontSize: "0.82rem", color: "#94a3b8", marginBottom: "4px" }}>Filter Department (Optional):</label>
            <select
              value={batchDeptFilter}
              onChange={(e) => setBatchDeptFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#0f172a",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.88rem"
              }}
            >
              <option value="all">All Departments (College-Wide)</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
            </select>
          </div>
          <div className="confirm-actions">
            <button
              className="yes-btn"
              style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)' }}
              onClick={handleBatchGraduate}
              disabled={batchActionLoading}
            >
              {batchActionLoading ? "Graduating Batch..." : "🎓 Confirm Batch Graduation"}
            </button>
            <button
              className="no-btn"
              onClick={() => setShowBatchGraduateModal(false)}
              disabled={batchActionLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 🚀 ANNUAL BATCH ROLL-OVER CONFIRM MODAL */}
      {showBatchPromoteModal && (
        <div className="confirm-toast" style={{ maxWidth: "500px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#f8fafc", fontSize: "1.1rem" }}>
            🚀 Annual Academic Batch Roll-over
          </h4>
          <p style={{ margin: "0 0 12px 0", color: "#cbd5e1", fontSize: "0.88rem", lineHeight: "1.5" }}>
            Are you sure you want to perform the <b>Annual Academic Progression</b> for all students?
          </p>
          <ul style={{ textAlign: "left", fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.6", margin: "0 0 16px 20px" }}>
            <li><b>Year 4 (BE)</b> students will be graduated to <b>Passout / Alumni</b> 🎓</li>
            <li><b>Year 3 (TE)</b> students will be promoted to <b>Year 4 (BE)</b> ⬆️</li>
            <li><b>Year 2 (SE)</b> students will be promoted to <b>Year 3 (TE)</b> ⬆️</li>
            <li><b>Year 1 (FE)</b> students will be promoted to <b>Year 2 (SE)</b> ⬆️</li>
          </ul>
          <div className="confirm-actions">
            <button
              className="yes-btn"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
              onClick={handleBatchPromote}
              disabled={batchActionLoading}
            >
              {batchActionLoading ? "Promoting All Batches..." : "🚀 Confirm Annual Roll-over"}
            </button>
            <button
              className="no-btn"
              onClick={() => setShowBatchPromoteModal(false)}
              disabled={batchActionLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
