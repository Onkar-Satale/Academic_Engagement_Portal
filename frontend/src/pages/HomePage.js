import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./HomePage.css";
import Footer from "../components/Footer";

// ── Animated counter hook ──────────────────────────────────────────────────
function useCounter(target, duration = 2000, start = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, start]);
    return count;
}

export default function HomePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [clubs, setClubs] = useState([]);
    const [events, setEvents] = useState([]);
    const [toast, setToast] = useState(null);
    const [toastType, setToastType] = useState("success");
    const [statsVisible, setStatsVisible] = useState(false);
    const statsRef = useRef(null);

    const clubCount = useCounter(clubs.length || 12, 1800, statsVisible);
    const eventCount = useCounter(events.length || 40, 1800, statsVisible);
    const studentCount = useCounter(500, 2000, statsVisible);
    const regCount = useCounter(1200, 2200, statsVisible);

    const [feedbacks, setFeedbacks] = useState([]);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showAllFeedbacksModal, setShowAllFeedbacksModal] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [expandedFeedbacks, setExpandedFeedbacks] = useState({});

    const toggleExpandFeedback = (idKey) => {
        setExpandedFeedbacks(prev => ({
            ...prev,
            [idKey]: !prev[idKey]
        }));
    };

    const defaultTestimonials = [
        { name: "Priya S.", role_name: "Student", department: "CSE", message: "Finding and joining clubs was never this easy! I registered for 3 events in under 5 minutes.", user_name: "Priya S." },
        { name: "Prof. Mehta", role_name: "Club Mentor", department: "IT", message: "Managing event permissions used to take days. Now it's done in minutes with full transparency.", user_name: "Prof. Mehta" },
        { name: "Rahul K.", role_name: "Club Head", department: "CSI", message: "Creating events and tracking student enrollments is seamless. Our club activity doubled!", user_name: "Rahul K." }
    ];

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        setUser(storedUser);

        api.get("/clubs").then(res => setClubs(res.data.slice(0, 3))).catch(() => { });
        api.get("/events").then(res => setEvents(res.data.slice(0, 3))).catch(() => { });
        fetchFeedbacks();

        // Scroll reveal
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add("visible");
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

        setTimeout(() => {
            document.querySelectorAll(".fade-up").forEach(el => observer.observe(el));
        }, 100);

        // Stats counter trigger
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) setStatsVisible(true);
        }, { threshold: 0.3 });

        if (statsRef.current) statsObserver.observe(statsRef.current);

        return () => { observer.disconnect(); statsObserver.disconnect(); };
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const res = await api.get("/feedbacks");
            setFeedbacks(res.data || []);
        } catch (err) {
            console.error("Failed to fetch feedbacks", err);
        }
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (!feedbackText.trim()) return showToast("Please enter your feedback message.", "error");
        setSubmittingFeedback(true);
        try {
            await api.post("/feedbacks", { message: feedbackText.trim() });
            showToast("Feedback submitted successfully! 🎉 Thank you for your thoughts.");
            setFeedbackText("");
            setShowFeedbackModal(false);
            fetchFeedbacks();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to submit feedback.", "error");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const [showDeleteFeedbackConfirm, setShowDeleteFeedbackConfirm] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState(null);

    const askDeleteFeedback = (feedbackId) => {
        setFeedbackToDelete(feedbackId);
        setShowDeleteFeedbackConfirm(true);
    };

    const confirmDeleteFeedback = async () => {
        if (!feedbackToDelete) return;
        try {
            await api.delete(`/feedbacks/${feedbackToDelete}`);
            showToast("Feedback deleted successfully! 🗑️");
            fetchFeedbacks();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to delete feedback.", "error");
        } finally {
            setShowDeleteFeedbackConfirm(false);
            setFeedbackToDelete(null);
        }
    };

    const showToast = (msg, type = "success") => {
        setToast(msg); setToastType(type);
        setTimeout(() => setToast(null), 2500);
    };

    const handleJoinClub = (clubId) => {
        if (user) navigate(`/clubs/${clubId}`);
        else { showToast("Please login to join clubs", "error"); setTimeout(() => navigate("/login"), 1500); }
    };

    const handleRegisterEvent = (eventId) => {
        if (user) navigate(`/events/${eventId}/register`);
        else { showToast("Please login to register for events", "error"); setTimeout(() => navigate("/login"), 1500); }
    };

    return (
        <div className="hp-root">

            {/* ═══════════════════════════════════════════════════════
                HERO SECTION
            ═══════════════════════════════════════════════════════ */}
            <section className="hp-hero">
                <div className="hp-hero-bg">
                    <div className="hp-orb hp-orb-1" />
                    <div className="hp-orb hp-orb-2" />
                    <div className="hp-orb hp-orb-3" />
                    <div className="hp-grid-overlay" />
                </div>

                <div className="hp-hero-content fade-up">
                    <div className="hp-hero-badge">
                        <span className="hp-badge-dot" />
                        Academic Engagement Portal
                    </div>
                    <h1 className="hp-hero-title">
                        One Platform for All<br />
                        <span className="hp-gradient-text">College Clubs & Events</span>
                    </h1>
                    <p className="hp-hero-sub">
                        Discover clubs, enroll in events, manage approvals — all in one
                        seamless digital experience. Say goodbye to paperwork.
                    </p>
                    <div className="hp-hero-actions">
                        <button className="hp-btn hp-btn-primary" onClick={() => navigate("/events")}>
                            <span>🎯</span> Explore Events
                        </button>
                        <button className="hp-btn hp-btn-secondary" onClick={() => navigate("/clubs")}>
                            <span>🏛️</span> Explore Clubs
                        </button>
                        {!user && (
                            <button className="hp-btn hp-btn-ghost" onClick={() => navigate("/login")}>
                                Login / Get Started →
                            </button>
                        )}
                    </div>
                    <div className="hp-hero-chips">
                        <span className="hp-chip">✅ Digital Approvals</span>
                        <span className="hp-chip">✅ Role-Based Access</span>
                        <span className="hp-chip">✅ Real-Time Updates</span>
                    </div>
                </div>

                <div className="hp-hero-visual fade-up">
                    <div className="hp-dashboard-mock">
                        <div className="hp-mock-header">
                            <div className="hp-mock-dot red" /><div className="hp-mock-dot yellow" /><div className="hp-mock-dot green" />
                            <span className="hp-mock-title">Academic Portal</span>
                        </div>
                        <div className="hp-mock-body">
                            <div className="hp-mock-sidebar">
                                {["🏠 Home", "🏛️ Clubs", "🎯 Events", "📋 Approvals", "👤 Profile"].map(item => (
                                    <div key={item} className="hp-mock-nav-item">{item}</div>
                                ))}
                            </div>
                            <div className="hp-mock-main">
                                <div className="hp-mock-stat-row">
                                    <div className="hp-mock-stat blue"><div className="hp-mock-stat-num">12</div><div className="hp-mock-stat-label">Clubs</div></div>
                                    <div className="hp-mock-stat purple"><div className="hp-mock-stat-num">40+</div><div className="hp-mock-stat-label">Events</div></div>
                                    <div className="hp-mock-stat teal"><div className="hp-mock-stat-num">500+</div><div className="hp-mock-stat-label">Students</div></div>
                                </div>
                                <div className="hp-mock-card-row">
                                    <div className="hp-mock-event-card">
                                        <div className="hp-mock-event-dot" />
                                        <div>
                                            <div className="hp-mock-event-title">AWS Cloud Workshop</div>
                                            <div className="hp-mock-event-date">📅 Feb 20 · 📍 Seminar Hall</div>
                                        </div>
                                    </div>
                                    <div className="hp-mock-event-card">
                                        <div className="hp-mock-event-dot purple" />
                                        <div>
                                            <div className="hp-mock-event-title">CSI Tech Fest</div>
                                            <div className="hp-mock-event-date">📅 Mar 5 · 📍 Auditorium</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="hp-mock-approval">
                                    <span className="hp-mock-approval-label">Permission Request</span>
                                    <span className="hp-mock-approval-status approved">✓ Approved</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                PROBLEM → SOLUTION SECTION
            ═══════════════════════════════════════════════════════ */}
            <section className="hp-section hp-problem-section fade-up">
                <div className="hp-section-inner">
                    <div className="hp-section-label">The Problem We Solve</div>
                    <h2 className="hp-section-title">From Chaos <span className="hp-gradient-text">to Clarity</span></h2>
                    <p className="hp-section-sub">See exactly what changed — and why it matters.</p>

                    <div className="hp-ps-grid">
                        {/* Column Headers */}
                        <div className="hp-ps-col-header bad">
                            <span className="hp-ps-header-icon">😩</span>
                            <span>Before — The Old Way</span>
                        </div>
                        <div className="hp-ps-spacer-header" />
                        <div className="hp-ps-col-header good">
                            <span className="hp-ps-header-icon">🚀</span>
                            <span>After — Our Platform</span>
                        </div>

                        {/* Paired rows */}
                        {[
                            {
                                bad: { icon: "📄", text: "Manual paperwork for every event permission" },
                                good: { icon: "⚡", text: "Digital approval in minutes — no forms, no queues" },
                            },
                            {
                                bad: { icon: "📌", text: "Club info scattered across notice boards & WhatsApp" },
                                good: { icon: "🌐", text: "One centralized hub for all clubs & events" },
                            },
                            {
                                bad: { icon: "⏳", text: "Approval process takes days with no visibility" },
                                good: { icon: "🔔", text: "Real-time status updates & instant notifications" },
                            },
                            {
                                bad: { icon: "📞", text: "Communication gaps between students & faculty" },
                                good: { icon: "💬", text: "Seamless role-based messaging & coordination" },
                            },
                            {
                                bad: { icon: "🗂️", text: "No record of who attended what — zero tracking" },
                                good: { icon: "📊", text: "Full participation history & activity dashboard" },
                            },
                        ].map((row, i) => (
                            <div key={i} className="hp-ps-row-group">
                                <div className="hp-ps-item bad" style={{ animationDelay: `${i * 0.12}s` }}>
                                    <span className="hp-ps-x">✕</span>
                                    <span className="hp-ps-item-icon">{row.bad.icon}</span>
                                    <span className="hp-ps-item-text">{row.bad.text}</span>
                                </div>
                                <div className="hp-ps-arrow-cell">
                                    <div className="hp-ps-arrow" style={{ animationDelay: `${i * 0.12 + 0.08}s` }}>→</div>
                                </div>
                                <div className="hp-ps-item good" style={{ animationDelay: `${i * 0.12 + 0.15}s` }}>
                                    <span className="hp-ps-check">✓</span>
                                    <span className="hp-ps-item-icon">{row.good.icon}</span>
                                    <span className="hp-ps-item-text">{row.good.text}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                FEATURES BY ROLE
            ═══════════════════════════════════════════════════════ */}
            <section className="hp-section hp-features-section fade-up">
                <div className="hp-section-inner">
                    <div className="hp-section-label">Role-Based Features</div>
                    <h2 className="hp-section-title">Built for Everyone</h2>
                    <p className="hp-section-sub">Every stakeholder gets exactly what they need.</p>

                    <div className="hp-features-grid">
                        <div className="hp-feature-card student">
                            <div className="hp-feature-icon-wrap">🎓</div>
                            <h3>For Students</h3>
                            <ul className="hp-feature-list">
                                <li>🔍 Explore all college clubs & events</li>
                                <li>📝 Enroll online with one click</li>
                                <li>🏛️ Join clubs and build your portfolio</li>
                                <li>📊 Track your participation history</li>
                                <li>🔔 Get real-time notifications</li>
                            </ul>
                            <button className="hp-feature-btn" onClick={() => navigate(user ? "/clubs" : "/login")}>
                                Get Started →
                            </button>
                        </div>

                        <div className="hp-feature-card head">
                            <div className="hp-feature-icon-wrap">👑</div>
                            <h3>For Club Heads</h3>
                            <ul className="hp-feature-list">
                                <li>🎯 Create and manage club events</li>
                                <li>👥 View and manage enrolled students</li>
                                <li>✅ Approve or reject applications</li>
                                <li>📋 Coordinate with mentors</li>
                                <li>📈 Monitor club activity</li>
                            </ul>
                            <button className="hp-feature-btn" onClick={() => navigate(user ? "/my-club" : "/login")}>
                                Manage Club →
                            </button>
                        </div>

                        <div className="hp-feature-card mentor">
                            <div className="hp-feature-icon-wrap">🏫</div>
                            <h3>For Mentors & Authorities</h3>
                            <ul className="hp-feature-list">
                                <li>📋 Review permission requests</li>
                                <li>✅ Approve or reject event requests</li>
                                <li>📊 Monitor all club activities</li>
                                <li>🔔 Instant approval notifications</li>
                                <li>🗂️ Complete audit trail</li>
                            </ul>
                            <button className="hp-feature-btn" onClick={() => navigate(user ? "/my-events" : "/login")}>
                                View Dashboard →
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                HOW IT WORKS
            ═══════════════════════════════════════════════════════ */}
            <section className="hp-section hp-how-section fade-up">
                <div className="hp-section-inner">
                    <div className="hp-section-label">Simple Process</div>
                    <h2 className="hp-section-title">How It Works</h2>
                    <p className="hp-section-sub">From signup to participation in 4 simple steps.</p>

                    <div className="hp-steps">
                        {[
                            { num: "01", icon: "👤", title: "Join the Platform", desc: "Students and staff sign up with their college credentials and get role-based access instantly." },
                            { num: "02", icon: "🏛️", title: "Clubs Create Events", desc: "Club Heads and Mentors create events, set details, and submit permission requests digitally." },
                            { num: "03", icon: "✅", title: "Authorities Approve", desc: "Permission requests flow to the right authorities who approve or reject with a single click." },
                            { num: "04", icon: "🎉", title: "Students Participate", desc: "Students discover approved events, register online, and track their participation history." },
                        ].map((step, i) => (
                            <div key={step.num} className="hp-step">
                                <div className="hp-step-num">{step.num}</div>
                                <div className="hp-step-icon">{step.icon}</div>
                                <h3 className="hp-step-title">{step.title}</h3>
                                <p className="hp-step-desc">{step.desc}</p>
                                {i < 3 && <div className="hp-step-arrow">→</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                STATS SECTION
            ═══════════════════════════════════════════════════════ */}
            <section className="hp-stats-section fade-up" ref={statsRef}>
                <div className="hp-stats-inner">
                    <div className="hp-section-label light">Our Impact</div>
                    <h2 className="hp-section-title light">Numbers That Speak</h2>
                    <div className="hp-stats-grid">
                        {[
                            { value: clubCount, suffix: "+", label: "Active Clubs", icon: "🏛️" },
                            { value: eventCount, suffix: "+", label: "Events Hosted", icon: "🎯" },
                            { value: studentCount, suffix: "+", label: "Students Enrolled", icon: "🎓" },
                            { value: regCount, suffix: "+", label: "Registrations", icon: "📋" },
                        ].map(stat => (
                            <div key={stat.label} className="hp-stat-card">
                                <div className="hp-stat-icon">{stat.icon}</div>
                                <div className="hp-stat-value">{stat.value}{stat.suffix}</div>
                                <div className="hp-stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                FEATURED CLUBS
            ═══════════════════════════════════════════════════════ */}
            <section className="hp-section fade-up">
                <div className="hp-section-inner">
                    <div className="hp-section-label">Explore</div>
                    <h2 className="hp-section-title">Featured Clubs</h2>
                    <p className="hp-section-sub">Find your community. Join a club that matches your passion.</p>

                    <div className="hp-cards-grid">
                        {clubs.length > 0 ? clubs.map(club => (
                            <div key={club.club_id} className="hp-club-card">
                                <div className="hp-club-avatar">
                                    {club.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="hp-club-name">{club.name}</h3>
                                <p className="hp-club-desc">{club.description || "A vibrant college club."}</p>
                                <div className="hp-club-meta">
                                    <span>👥 {club.active_members || 0} {Number(club.active_members) === 1 ? "member" : "members"}</span>
                                </div>
                                <div className="hp-club-actions">
                                    <button className="hp-card-btn secondary" onClick={() => navigate(`/clubs/${club.club_id}`)}>
                                        Details
                                    </button>
                                    <button className="hp-card-btn primary" onClick={() => handleJoinClub(club.club_id)}>
                                        Join Club
                                    </button>
                                </div>
                            </div>
                        )) : (
                            [1, 2, 3].map(i => (
                                <div key={i} className="hp-club-card skeleton">
                                    <div className="hp-skeleton-avatar" />
                                    <div className="hp-skeleton-line wide" />
                                    <div className="hp-skeleton-line" />
                                    <div className="hp-skeleton-line short" />
                                </div>
                            ))
                        )}
                    </div>

                    <div className="hp-section-cta">
                        <button className="hp-btn hp-btn-outline" onClick={() => navigate("/clubs")}>
                            View All Clubs →
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                UPCOMING EVENTS
            ═══════════════════════════════════════════════════════ */}
            <section className="hp-section hp-events-bg fade-up">
                <div className="hp-section-inner">
                    <div className="hp-section-label">Don't Miss Out</div>
                    <h2 className="hp-section-title">Upcoming Events</h2>
                    <p className="hp-section-sub">Register now before seats fill up.</p>

                    <div className="hp-cards-grid">
                        {events.length > 0 ? events.map(event => (
                            <div key={event.event_id} className="hp-event-card">
                                <div className="hp-event-header">
                                    <span className="hp-event-badge">Upcoming</span>
                                </div>
                                <h3 className="hp-event-title">{event.title}</h3>
                                <p className="hp-event-desc">{event.description}</p>
                                <div className="hp-event-meta">
                                    <span>📅 {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                    <span>📍 {event.venue}</span>
                                </div>
                                <div className="hp-club-actions">
                                    <button className="hp-card-btn secondary" onClick={() => navigate(`/events/${event.event_id}`)}>
                                        Details
                                    </button>
                                    <button className="hp-card-btn primary" onClick={() => handleRegisterEvent(event.event_id)}>
                                        Register
                                    </button>
                                </div>
                            </div>
                        )) : (
                            [1, 2, 3].map(i => (
                                <div key={i} className="hp-event-card skeleton">
                                    <div className="hp-skeleton-line wide" />
                                    <div className="hp-skeleton-line" />
                                    <div className="hp-skeleton-line short" />
                                </div>
                            ))
                        )}
                    </div>

                    <div className="hp-section-cta">
                        <button className="hp-btn hp-btn-outline" onClick={() => navigate("/events")}>
                            View All Events →
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                TESTIMONIALS
            ═══════════════════════════════════════════════════════ */}
            <section className="hp-section fade-up">
                <div className="hp-section-inner">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
                        <div>
                            <div className="hp-section-label">Voices</div>
                            <h2 className="hp-section-title" style={{ margin: 0 }}>What People Say</h2>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            {user ? (
                                <button 
                                    className="hp-btn hp-btn-primary"
                                    onClick={() => setShowFeedbackModal(true)}
                                    style={{ padding: "10px 18px", fontSize: "0.9rem" }}
                                >
                                    💬 Give Feedback
                                </button>
                            ) : (
                                <button 
                                    className="hp-btn hp-btn-primary"
                                    onClick={() => navigate("/login")}
                                    style={{ padding: "10px 18px", fontSize: "0.9rem" }}
                                >
                                    💬 Log In to Give Feedback
                                </button>
                            )}

                            <button 
                                className="hp-btn hp-btn-outline"
                                onClick={() => setShowAllFeedbacksModal(true)}
                                style={{ padding: "10px 18px", fontSize: "0.9rem" }}
                            >
                                See All Testimonials ({feedbacks.length + defaultTestimonials.length})
                            </button>
                        </div>
                    </div>

                    <div className="hp-testimonials">
                        {[...feedbacks, ...defaultTestimonials].slice(0, 3).map((t, idx) => {
                            const displayName = t.user_name || t.name;
                            const displayRole = `${t.role_name || t.role}${t.department ? `, ${t.department}` : ''}`;
                            const avatarInitial = (displayName || "?").charAt(0).toUpperCase();
                            const fullText = t.message || t.text || "";
                            const canDelete = t.feedback_id && user && Number(user.id) === Number(t.user_id);
                            
                            const key = t.feedback_id ? `f_${t.feedback_id}` : `d_${idx}`;
                            const isExpanded = !!expandedFeedbacks[key];
                            const isLong = fullText.length > 120;
                            const displayText = (isLong && !isExpanded) ? `${fullText.substring(0, 120)}...` : fullText;

                            return (
                                <div key={key} className="hp-testimonial-card" style={{ position: "relative" }}>
                                    {canDelete && (
                                        <button 
                                            className="hp-delete-feedback-btn"
                                            onClick={() => askDeleteFeedback(t.feedback_id)}
                                            title="Delete Your Feedback"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                    <div className="hp-testimonial-quote">"</div>
                                    <p className="hp-testimonial-text">
                                        {displayText}
                                        {isLong && (
                                            <button 
                                                onClick={() => toggleExpandFeedback(key)}
                                                className="hp-read-more-btn"
                                            >
                                                {isExpanded ? " Read Less" : " Read More"}
                                            </button>
                                        )}
                                    </p>
                                    <div className="hp-testimonial-author">
                                        <div className="hp-testimonial-avatar">{avatarInitial}</div>
                                        <div>
                                            <div className="hp-testimonial-name">{displayName}</div>
                                            <div className="hp-testimonial-role">{displayRole}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                FINAL CTA
            ═══════════════════════════════════════════════════════ */}
            <section className="hp-cta-section fade-up">
                <div className="hp-cta-orb hp-cta-orb-1" />
                <div className="hp-cta-orb hp-cta-orb-2" />
                <div className="hp-cta-inner">
                    <h2 className="hp-cta-title">Ready to Get Started?</h2>
                    <p className="hp-cta-sub">
                        Join hundreds of students already using the platform to discover clubs,
                        attend events, and build their college journey.
                    </p>
                    <div className="hp-cta-actions">
                        {user ? (
                            <>
                                <button className="hp-btn hp-btn-white" onClick={() => navigate("/events")}>🎯 Explore Events</button>
                                <button className="hp-btn hp-btn-ghost-white" onClick={() => navigate("/clubs")}>🏛️ Explore Clubs</button>
                            </>
                        ) : (
                            <>
                                <button className="hp-btn hp-btn-white" onClick={() => navigate("/login")}>🚀 Join Now — It's Free</button>
                                <button className="hp-btn hp-btn-ghost-white" onClick={() => navigate("/events")}>🎯 Explore Events</button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* 💬 GIVE FEEDBACK MODAL */}
            {showFeedbackModal && (
                <div className="hp-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
                    <div className="hp-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="hp-modal-header">
                            <h3>💬 Share Your Feedback</h3>
                            <button className="hp-modal-close" onClick={() => setShowFeedbackModal(false)}>✕</button>
                        </div>
                        <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginBottom: "16px" }}>
                            Your feedback will be featured on the portal Home Page for everyone to see!
                        </p>
                        <form onSubmit={handleSubmitFeedback}>
                            <div className="hp-form-group">
                                <label style={{ fontSize: "0.85rem", color: "#cbd5e1", fontWeight: 600, display: "block", marginBottom: "6px" }}>Your Name & Role</label>
                                <input 
                                    type="text" 
                                    value={`${user?.name || 'User'} (${user?.role_name || 'Member'}${user?.department ? `, ${user.department}` : ''})`}
                                    disabled
                                    style={{ width: "100%", padding: "10px 14px", background: 'rgba(255,255,255,0.05)', border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: '#94a3b8', cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className="hp-form-group" style={{ marginTop: "14px" }}>
                                <label style={{ fontSize: "0.85rem", color: "#cbd5e1", fontWeight: 600, display: "block", marginBottom: "6px" }}>Your Message / Thoughts *</label>
                                <textarea 
                                    rows={4}
                                    placeholder="Tell us what you love about the platform or how it helped your college experience..."
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "12px", background: "#141418", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
                                <button 
                                    type="button" 
                                    className="hp-btn hp-btn-outline" 
                                    onClick={() => setShowFeedbackModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="hp-btn hp-btn-primary" 
                                    disabled={submittingFeedback}
                                >
                                    {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 📜 SEE ALL TESTIMONIALS MODAL */}
            {showAllFeedbacksModal && (
                <div className="hp-modal-overlay" onClick={() => setShowAllFeedbacksModal(false)}>
                    <div className="hp-modal-card hp-modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="hp-modal-header">
                            <h3>Voices — All Community Testimonials ({feedbacks.length + defaultTestimonials.length})</h3>
                            <button className="hp-modal-close" onClick={() => setShowAllFeedbacksModal(false)}>✕</button>
                        </div>
                        <div className="hp-all-feedbacks-list">
                            {[...feedbacks, ...defaultTestimonials].map((f, i) => {
                                const displayName = f.user_name || f.name;
                                const avatar = (displayName || "?").charAt(0).toUpperCase();
                                const roleStr = `${f.role_name || f.role}${f.department ? `, ${f.department}` : ''}`;
                                const canDelete = f.feedback_id && user && Number(user.id) === Number(f.user_id);
                                const fullText = f.message || f.text || "";

                                const key = f.feedback_id ? `modal_f_${f.feedback_id}` : `modal_d_${i}`;
                                const isExpanded = !!expandedFeedbacks[key];
                                const isLong = fullText.length > 140;
                                const displayText = (isLong && !isExpanded) ? `${fullText.substring(0, 140)}...` : fullText;

                                return (
                                    <div key={key} className="hp-testimonial-card-full" style={{ position: "relative" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div className="hp-testimonial-author">
                                                <div className="hp-testimonial-avatar">{avatar}</div>
                                                <div>
                                                    <div className="hp-testimonial-name">{displayName}</div>
                                                    <div className="hp-testimonial-role">{roleStr}</div>
                                                </div>
                                            </div>
                                            {canDelete && (
                                                <button 
                                                    className="hp-delete-feedback-btn-pill"
                                                    onClick={() => askDeleteFeedback(f.feedback_id)}
                                                    title="Delete Your Feedback"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            )}
                                        </div>
                                        <p className="hp-testimonial-text-full">
                                            "{displayText}"
                                            {isLong && (
                                                <button 
                                                    onClick={() => toggleExpandFeedback(key)}
                                                    className="hp-read-more-btn"
                                                >
                                                    {isExpanded ? " Read Less" : " Read More"}
                                                </button>
                                            )}
                                        </p>
                                        <div className="hp-testimonial-date">
                                            {f.created_at ? new Date(f.created_at).toLocaleDateString() : "Featured Testimonial"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                            <button className="hp-btn hp-btn-outline" onClick={() => setShowAllFeedbacksModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🗑️ DELETE FEEDBACK CONFIRMATION OVERLAY */}
            {showDeleteFeedbackConfirm && (
                <div className="confirm-toast">
                    <p>🗑️ Are you sure you want to <b>delete your feedback</b>? This action cannot be undone!</p>
                    <div className="confirm-actions">
                        <button className="yes-btn" style={{ background: '#ef4444' }} onClick={confirmDeleteFeedback}>
                            Yes, Delete
                        </button>
                        <button
                            className="no-btn"
                            onClick={() => {
                                setShowDeleteFeedbackConfirm(false);
                                setFeedbackToDelete(null);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <Footer />

            {toast && <div className={`toast ${toastType}`}>{toast}</div>}
        </div>
    );
}
