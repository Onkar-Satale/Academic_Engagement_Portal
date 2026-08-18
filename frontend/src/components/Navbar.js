import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "./Navbar.css";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Auto close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const updateUser = () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setUser(storedUser);
    };

    updateUser();

    // Listen to storage events & custom auth events
    window.addEventListener("storage", updateUser);
    window.addEventListener("authChange", updateUser);

    // Short interval polling to ensure state stays 100% in sync
    const interval = setInterval(updateUser, 300);

    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("authChange", updateUser);
      clearInterval(interval);
    };
  }, []);

  // Auto-resolve club_id for Club Head & Mentor if not cached in user object
  useEffect(() => {
    if (user && (user.role_name === "Club Head" || user.role_name === "Club Mentor") && !user.club_id) {
      import("../api/axios").then(({ default: api }) => {
        api.get("/clubs").then((res) => {
          const matched = res.data.find(c => c.club_head_id === user.id || c.club_mentor_id === user.id);
          if (matched) {
            const updated = { ...user, club_id: matched.club_id };
            localStorage.setItem("user", JSON.stringify(updated));
            setUser(updated);
          }
        }).catch(() => {});
      });
    }
  }, [user]);

  const confirmLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setShowLogoutConfirm(false);
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event("authChange"));
    toast.info("Logged out successfully 👋");
    navigate("/");
  };

  const firstLetter = user?.name?.charAt(0).toUpperCase();

  return (
    <>
      <nav className={`navbar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        {/* Left side: Profile circle + PICT PORTAL logo */}
        <div className="nav-left">
          {user && (
            <div className="profile-circle-wrapper" onClick={() => { setIsMobileMenuOpen(false); navigate("/account"); }}>
              <div className="profile-circle">
                {firstLetter}
              </div>
              <span className="profile-role-badge">{user.role_name}</span>
            </div>
          )}
          <h2 className="portal-title" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>PICT PORTAL</h2>
        </div>

        {/* Mobile menu toggle hamburger button */}
        <div className="nav-mobile-controls">
          {user && (
            <div className="mobile-bell-wrapper">
              <NotificationBell />
            </div>
          )}
          <button 
            className={`hamburger-btn ${isMobileMenuOpen ? "open" : ""}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>

        {/* Backdrop for mobile drawer */}
        {isMobileMenuOpen && (
          <div className="mobile-backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        {/* Main navigation links drawer */}
        <div className={`nav-menu-wrapper ${isMobileMenuOpen ? "active" : ""}`}>
          <div className="nav-center">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
            <Link to="/events" className={`nav-link ${isActive('/events') ? 'active' : ''}`}>Events</Link>
            <Link to="/clubs" className={`nav-link ${isActive('/clubs') ? 'active' : ''}`}>Clubs</Link>

            {/* Club Head specific links */}
            {user?.role_name === "Club Head" && (
              <>
                <Link 
                  to={user?.club_id ? `/clubs/${user.club_id}` : '/clubs'} 
                  className={`nav-link ${isActive(user?.club_id ? `/clubs/${user.club_id}` : '/clubs') ? 'active' : ''}`}
                >
                  My Club
                </Link>
                <Link to="/my-events" className={`nav-link ${isActive('/my-events') ? 'active' : ''}`}>My Events</Link>
                <Link to="/my-requests" className={`nav-link ${isActive('/my-requests') ? 'active' : ''}`}>My Requests</Link>
              </>
            )}

            {/* Club Mentor specific links */}
            {user?.role_name === "Club Mentor" && (
              <>
                <Link 
                  to={user?.club_id ? `/clubs/${user.club_id}` : '/clubs'} 
                  className={`nav-link ${isActive(user?.club_id ? `/clubs/${user.club_id}` : '/clubs') ? 'active' : ''}`}
                >
                  My Club
                </Link>
                <Link to="/my-events" className={`nav-link ${isActive('/my-events') ? 'active' : ''}`}>My Events</Link>
              </>
            )}

            {/* Approvals for 3-Tier Authorities & Mentors */}
            {["Club Mentor", "Estate Manager", "Principal"].includes(user?.role_name) && (
              <Link to="/approvals" className={`nav-link ${isActive('/approvals') ? 'active' : ''}`}>Approvals</Link>
            )}
          </div>

          {/* Right side: Notification Bell + Auth buttons */}
          <div className="nav-right">
            {user ? (
              <>
                <div className="desktop-bell-wrapper">
                  <NotificationBell />
                </div>
                <button className="auth-btn logout-btn" onClick={() => setShowLogoutConfirm(true)}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="auth-btn auth-btn-login">Login</Link>
                <Link to="/Signup" className="auth-btn auth-btn-signup">Signup</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="confirm-toast">
          <p>Are you sure you want to log out?</p>
          <div className="confirm-actions">
            <button className="yes-btn danger" style={{ background: "#ef4444" }} onClick={confirmLogout}>
              Yes, Logout
            </button>
            <button className="no-btn" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
