import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ClubCard from "../components/ClubCard";
import api from "../api/axios";
import "./Clubs.css";
import RegistrationModal from "../components/RegistrationModal";

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [newClubKey, setNewClubKey] = useState("");
  const [newClubMentorKey, setNewClubMentorKey] = useState("");
  const [showHeadKey, setShowHeadKey] = useState(false);
  const [showMentorKey, setShowMentorKey] = useState(false);
  const [copiedKeyType, setCopiedKeyType] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [enrolledClubs, setEnrolledClubs] = useState([]);

  // 🛡️ Cryptographically Secure Random Key Generators
  const generateHeadCryptoKey = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const randomHex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
    const clubPrefix = newClubName ? newClubName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() : "CLB";
    const key = `KEY_${clubPrefix}_HEAD_${randomHex}`;
    setNewClubKey(key);
    toast.success("Cryptographically secure Club Head key generated 🛡️");
  };

  const generateMentorCryptoKey = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const randomHex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
    const clubPrefix = newClubName ? newClubName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() : "CLB";
    const key = `KEY_${clubPrefix}_MNTR_${randomHex}`;
    setNewClubMentorKey(key);
    toast.success("Cryptographically secure Club Mentor key generated 🛡️");
  };

  const copyToClipboard = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKeyType(type);
    toast.info("Secret key copied to clipboard! 📋");
    setTimeout(() => {
      setCopiedKeyType((curr) => (curr === type ? null : curr));
    }, 2000);
  };

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await api.get("/clubs", { headers });
      setClubs(res.data);

      if (user) {
        try {
          const enrolledRes = await api.get("/clubs/my/enrolled", { headers });
          setEnrolledClubs(enrolledRes.data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addClub = async () => {
    if (!newClubName.trim() || !newClubDesc.trim()) {
      toast.error("Please enter club name and description ⚠️");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await api.post(
        "/clubs",
        {
          name: newClubName,
          description: newClubDesc,
          clubHeadKey: newClubKey,
          clubMentorKey: newClubMentorKey
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Club created successfully! 🏛️");

      setNewClubName("");
      setNewClubDesc("");
      setNewClubKey("");
      setNewClubMentorKey("");
      fetchClubs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add club ❌");
    }
  };

  const handleJoinClick = (club) => {
    setSelectedClub(club);
    setShowModal(true);
  };

  if (loading) return <p>Loading clubs...</p>;

  return (
    <>
      <div className="clubs-container">
        <h2>All Clubs</h2>

        {/* Admin Add Club Section */}
        {(user?.role_id === 3 || user?.role_name === "Admin") && (
          <div className="add-club-form">
            <h3>Add New Club</h3>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "6px", fontWeight: 600 }}>Club Name</label>
              <input
                className="input-field"
                placeholder="e.g. ACM Student Chapter"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "6px", fontWeight: 600 }}>Description</label>
              <input
                className="input-field"
                placeholder="Short overview of club purpose and mission"
                value={newClubDesc}
                onChange={(e) => setNewClubDesc(e.target.value)}
              />
            </div>

            {/* Club Head Secret Key */}
            <div className="key-field-container">
              <div className="key-field-header">
                <label>👑 Club Head Secret Key</label>
                <button
                  type="button"
                  className="crypto-gen-btn"
                  onClick={generateHeadCryptoKey}
                  title="Generate a cryptographically secure random key for Club Head"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span>Auto-Gen Key (Crypto)</span>
                </button>
              </div>
              <div className="club-key-input-wrapper">
                <input
                  type={showHeadKey ? "text" : "password"}
                  className="input-field"
                  placeholder="Click 'Auto-Gen Key' or enter custom key..."
                  value={newClubKey}
                  onChange={(e) => setNewClubKey(e.target.value)}
                />
                <div className="club-key-actions">
                  {newClubKey && (
                    <button
                      type="button"
                      className="club-key-btn"
                      onClick={() => copyToClipboard(newClubKey, "head")}
                      title="Copy Secret Key"
                    >
                      {copiedKeyType === "head" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    className="club-key-btn"
                    onClick={() => setShowHeadKey(!showHeadKey)}
                    title={showHeadKey ? "Hide Key" : "Show Key"}
                  >
                    {showHeadKey ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Club Mentor Secret Key */}
            <div className="key-field-container">
              <div className="key-field-header">
                <label>🎓 Club Mentor Secret Key</label>
                <button
                  type="button"
                  className="crypto-gen-btn"
                  onClick={generateMentorCryptoKey}
                  title="Generate a cryptographically secure random key for Club Mentor"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span>Auto-Gen Key (Crypto)</span>
                </button>
              </div>
              <div className="club-key-input-wrapper">
                <input
                  type={showMentorKey ? "text" : "password"}
                  className="input-field"
                  placeholder="Click 'Auto-Gen Key' or enter custom key..."
                  value={newClubMentorKey}
                  onChange={(e) => setNewClubMentorKey(e.target.value)}
                />
                <div className="club-key-actions">
                  {newClubMentorKey && (
                    <button
                      type="button"
                      className="club-key-btn"
                      onClick={() => copyToClipboard(newClubMentorKey, "mentor")}
                      title="Copy Secret Key"
                    >
                      {copiedKeyType === "mentor" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    className="club-key-btn"
                    onClick={() => setShowMentorKey(!showMentorKey)}
                    title={showMentorKey ? "Hide Key" : "Show Key"}
                  >
                    {showMentorKey ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button className="add-club-btn" onClick={addClub} style={{ marginTop: "8px" }}>
              Add Club
            </button>
          </div>
        )}

        {clubs.length === 0 ? (
          <p>No clubs available</p>
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
            fetchClubs();
          }}
        />
      )}
    </>
  );
}
