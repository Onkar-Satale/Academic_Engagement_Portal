import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import ClubCard from "../components/ClubCard";
import api from "../api/axios";
import "./Account.css";
import EventCard from "../components/EventCard";


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

  // Roles that should only see profile info (no events/clubs)
  const profileOnlyRoles = ["Estate Manager", "Principal", "Director", "Club Mentor"];
  const isProfileOnly = profileOnlyRoles.includes(user?.role_name);

  useEffect(() => {
    // Only fetch clubs and events if user is not a profile-only role
    if (!isProfileOnly) {
      fetchMyClubs();
      fetchMyEvents();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <>
              <p><b>Department:</b> {user?.department}</p>
              <p><b>Year:</b> {user?.year}</p>
            </>
          )}
          <p><b>Role:</b> <span style={{ color: '#6c63ff', fontWeight: '600' }}>{user?.role_name}</span></p>

          <button
            className="delete-account-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑️ Delete Account
          </button>
        </div>

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
    </>
  );
}
