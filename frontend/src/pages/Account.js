import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import ClubCard from "../components/ClubCard";
import api from "../api/axios";
import "./Account.css";
import EventCard from "../components/EventCard";

// Clean SVG Icons
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function Account() {
  const user = JSON.parse(localStorage.getItem("user"));
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

  // 🔑 ADMIN SECRET KEYS STATES
  const [secretKeys, setSecretKeys] = useState([]);
  const [dbRoles, setDbRoles] = useState([]);
  const [selectedRoleForKey, setSelectedRoleForKey] = useState("");
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const [showInputKey, setShowInputKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  // Roles that should only see profile info (no events/clubs)
  const profileOnlyRoles = ["Estate Manager", "Principal", "Director", "Club Mentor"];
  const isProfileOnly = profileOnlyRoles.includes(user?.role_name);

  useEffect(() => {
    if (user?.role_name === "Admin" || user?.role_id === 3) {
      fetchSecretKeys();
      fetchDbRoles();
    }
    // Only fetch clubs and events if user is not a profile-only role
    if (!isProfileOnly) {
      fetchMyClubs();
      fetchMyEvents();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDbRoles = async () => {
    try {
      const res = await api.get("/users/roles");
      const filtered = (res.data || []).filter(r => ["Principal", "Director", "Estate Manager"].includes(r.role_name));
      setDbRoles(filtered);
      if (filtered.length > 0) {
        setSelectedRoleForKey(filtered[0].role_id);
      }
    } catch (err) {
      console.error("Failed to fetch DB roles", err);
    }
  };

  const getKeyForRole = (roleId) => {
    return secretKeys.find((k) => Number(k.role_id) === Number(roleId));
  };

  const fetchSecretKeys = async () => {
    setKeysLoading(true);
    try {
      const res = await api.get("/users/secret-keys");
      setSecretKeys(res.data);
    } catch (err) {
      console.error("Failed to fetch secret keys", err);
    } finally {
      setKeysLoading(false);
    }
  };

  // 🛡️ Cryptographically Secure Random Key Generator (Web Crypto API)
  const generateCryptoKey = () => {
    const existingKey = getKeyForRole(selectedRoleForKey);
    if (existingKey) {
      toast.warning(`A key already exists for this role (${existingKey.is_used ? 'Used' : 'Active'}). Delete the existing key first to generate a new one!`);
      return;
    }
    const roleObj = dbRoles.find((r) => Number(r.role_id) === Number(selectedRoleForKey));
    const rolePrefix = roleObj ? roleObj.role_name.replace(/\s+/g, "_").toUpperCase() : "ROLE";
    const array = new Uint8Array(16); // 128-bit cryptographic randomness
    window.crypto.getRandomValues(array);
    const randomHex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
    const newKey = `KEY_${rolePrefix}_${randomHex}`;
    setCustomKeyInput(newKey);
    toast.success("Cryptographically secure key generated (hidden by default) 🛡️");
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text, id = "input") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    toast.info("Secret key copied to clipboard! 📋");
    setTimeout(() => {
      setCopiedKeyId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    const existingKey = getKeyForRole(selectedRoleForKey);
    if (existingKey) {
      toast.warning(`A key record already exists for this role. Delete it from the table below to generate a new key!`);
      return;
    }
    setGeneratingKey(true);
    try {
      await api.post("/users/generate-key", {
        role_id: Number(selectedRoleForKey),
        secret_key: customKeyInput.trim() || undefined
      });
      toast.success("Role invite key activated successfully! 🎉");
      setCustomKeyInput("");
      fetchSecretKeys();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate key ❌");
    } finally {
      setGeneratingKey(false);
    }
  };

  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState(null);

  const askRevokeKey = (keyString, roleName = "") => {
    setKeyToRevoke({ secret_key: keyString, role_name: roleName });
    setShowRevokeConfirm(true);
  };

  const confirmRevokeKey = async () => {
    if (!keyToRevoke?.secret_key) return;
    try {
      await api.post("/users/revoke-key", { secret_key: keyToRevoke.secret_key });
      toast.success("Secret key record deleted successfully 🚫");
      fetchSecretKeys();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete key ❌");
    } finally {
      setShowRevokeConfirm(false);
      setKeyToRevoke(null);
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
      window.location.href = "/login";
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


  if (loading) return <p>Loading your clubs...</p>;

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
          {!["Estate Manager", "Principal", "Director"].includes(user?.role_name) && (
            <p><b>Department:</b> {user?.department}</p>
          )}
          {["Student", "Club Head"].includes(user?.role_name) && user?.year && (
            <p><b>Year:</b> {user?.year}</p>
          )}
          <p><b>Role:</b> <span style={{ color: 'var(--primary-light)', fontWeight: '600' }}>{user?.role_name}</span></p>

          <button
            className="delete-account-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑️ Delete Account
          </button>
        </div>

        {/* 🔑 ADMIN SECRET KEYS MANAGEMENT SECTION */}
        {(user?.role_name === "Admin" || user?.role_id === 3) && (
          <div className="account-card admin-keys-card">
            <div className="admin-card-header">
              <div>
                <h3>🔑 Authority Secret Key Management</h3>
                <p className="subtitle-text">Generate, track, and revoke single-use cryptographically secure registration keys for Principal, Director, Estate Manager, etc.</p>
              </div>
            </div>

            {/* Key Generation Form */}
            <form onSubmit={handleGenerateKey} className="generate-key-form">
              <div className="form-group role-select-group">
                <label>Target Authority Role</label>
                <select 
                  value={selectedRoleForKey} 
                  onChange={(e) => setSelectedRoleForKey(e.target.value)}
                  className="key-role-select"
                >
                  {dbRoles.map((r) => {
                    const existingKey = getKeyForRole(r.role_id);
                    const icon = r.role_name === "Principal" ? "👑" : r.role_name === "Director" ? "🎓" : "🏢";
                    return (
                      <option key={r.role_id} value={r.role_id} disabled={!!existingKey}>
                        {icon} {r.role_name} {existingKey ? `- 🔴 Key Exists (${existingKey.is_used ? 'Used' : 'Active'})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group key-input-group">
                <label>Cryptographic Secret Key</label>
                <div className="key-input-wrapper">
                  <input 
                    type={showInputKey ? "text" : "password"} 
                    placeholder={getKeyForRole(selectedRoleForKey) ? "A key already exists for this role (delete below first)" : "Click 'Auto-Gen Key' or type custom key..."}
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    disabled={!!getKeyForRole(selectedRoleForKey)}
                    className="key-input"
                  />
                  <div className="key-input-actions">
                    {customKeyInput && (
                      <button 
                        type="button"
                        className="action-icon-btn"
                        onClick={() => copyToClipboard(customKeyInput, "input")}
                        title="Copy Key"
                      >
                        {copiedKeyId === "input" ? <CheckIcon /> : <CopyIcon />}
                      </button>
                    )}
                    <button 
                      type="button"
                      className="action-icon-btn"
                      onClick={() => setShowInputKey(!showInputKey)}
                      title={showInputKey ? "Hide Key" : "Show Key"}
                    >
                      {showInputKey ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group button-group">
                <button
                  type="button"
                  className="generate-crypto-above-btn"
                  onClick={generateCryptoKey}
                  disabled={!!getKeyForRole(selectedRoleForKey) || generatingKey}
                  title={getKeyForRole(selectedRoleForKey) ? "A key record already exists for this role" : "Generate a cryptographically secure random key"}
                >
                  <SparklesIcon />
                  <span>Auto-Gen Key (Crypto)</span>
                </button>
                <button 
                  type="submit" 
                  className="generate-btn" 
                  disabled={!!getKeyForRole(selectedRoleForKey) || generatingKey}
                  title={getKeyForRole(selectedRoleForKey) ? "A key record already exists for this role" : "Activate and save key"}
                >
                  {generatingKey ? "Saving..." : "⚡ Activate Key"}
                </button>
              </div>
            </form>

            {/* Keys List Table */}
            <div className="keys-list-container">
              <h4 style={{ color: "#f8fafc", margin: "20px 0 12px 0", fontSize: "1.1rem" }}>
                Tracked Invite Secret Keys ({secretKeys.length})
              </h4>

              {keysLoading ? (
                <p style={{ color: "#94a3b8" }}>Loading secret keys...</p>
              ) : secretKeys.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>No active or historical invite keys generated yet.</p>
              ) : (
                <div className="keys-table-wrapper">
                  <table className="keys-table">
                    <thead>
                      <tr>
                        <th>Secret Key</th>
                        <th>Target Role</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {secretKeys.filter(k => dbRoles.some(r => Number(r.role_id) === Number(k.role_id))).map((k) => {
                        const isVisible = !!visibleKeys[k.key_id];
                        const isCopied = copiedKeyId === k.key_id;
                        return (
                          <tr key={k.key_id}>
                            <td>
                              <div className="key-code-badge">
                                <span className="key-badge-text">
                                  {isVisible ? k.secret_key : "••••••••••••••••••••••••"}
                                </span>
                                <div className="key-badge-actions">
                                  <button 
                                    type="button" 
                                    className="key-badge-btn"
                                    onClick={() => toggleKeyVisibility(k.key_id)}
                                    title={isVisible ? "Hide Key" : "Show Key"}
                                  >
                                    {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                                  </button>
                                  <button 
                                    type="button" 
                                    className="key-badge-btn"
                                    onClick={() => copyToClipboard(k.secret_key, k.key_id)}
                                    title="Copy Key"
                                  >
                                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="role-tag">{k.role_name}</span>
                            </td>
                            <td>
                              {k.is_used ? (
                                <span className="status-badge status-used">🔴 Used / Claimed</span>
                              ) : (
                                <span className="status-badge status-active">🟢 Active / Available</span>
                              )}
                            </td>
                            <td style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                              {new Date(k.created_at).toLocaleDateString()} {new Date(k.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td>
                              <button 
                                className="revoke-btn"
                                onClick={() => askRevokeKey(k.secret_key, k.role_name)}
                                title="Delete Key Record"
                              >
                                <TrashIcon />
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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

      {/* 🗑️ DELETE SECRET KEY CONFIRM */}
      {showRevokeConfirm && (
        <div className="confirm-toast">
          <p>🗑️ Are you sure you want to <b>delete the secret key record for {keyToRevoke?.role_name || "this role"}</b>? This action cannot be undone!</p>
          <div className="confirm-actions">
            <button className="yes-btn" style={{ background: '#ef4444' }} onClick={confirmRevokeKey}>
              Yes, Delete Key
            </button>
            <button
              className="no-btn"
              onClick={() => {
                setShowRevokeConfirm(false);
                setKeyToRevoke(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
