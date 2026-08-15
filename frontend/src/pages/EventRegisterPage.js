import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./EventRegisterPage.css";

export default function EventRegisterPage() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Use event from state if available
  const [event, setEvent] = useState(location.state?.event || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    year: "",
    rollNo: "",
    notes: ""
  });

  const getYearLabel = (y) => {
    if (String(y) === "1") return "FE (First Year)";
    if (String(y) === "2") return "SE (Second Year)";
    if (String(y) === "3") return "TE (Third Year)";
    if (String(y) === "4") return "BE (Final / Fourth Year)";
    return y ? `${y} Year` : "Not Specified";
  };

  // IMMEDIATE authentication check on mount & prefill user info
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/login", { replace: true });
    } else {
      setIsAuthenticated(true);
      setUserProfile(user);
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        department: user.department || "",
        year: user.year || ""
      }));
    }
    setIsChecking(false);
  }, [navigate]);

  // Fetch event details ONLY if authenticated and not passed from state
  useEffect(() => {
    if (isAuthenticated && !event) {
      api.get(`/events/${eventId}`)
        .then(res => setEvent(res.data))
        .catch(() => toast.error("Failed to load event details ❌"));
    }
  }, [eventId, event, isAuthenticated]);

  // Check if already registered
  useEffect(() => {
    if (isAuthenticated && eventId) {
      api.get(`/event-registrations/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => {
          const alreadyIn = res.data.some(e => String(e.event_id) === String(eventId));
          setIsAlreadyRegistered(alreadyIn);
        })
        .catch(() => { }); // silently fail
    }
  }, [isAuthenticated, eventId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameToSubmit = userProfile?.name || formData.name;
    const emailToSubmit = userProfile?.email || formData.email;
    const deptToSubmit = userProfile?.department || formData.department;
    const yearToSubmit = userProfile?.year || formData.year;

    if (!formData.phone || !formData.rollNo) {
      toast.error("Please fill Phone Number and Roll Number");
      return;
    }

    if (!event) {
      toast.error("Event details not loaded ❌");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1️⃣ Send to backend
      await api.post(
        "/event-registrations/register",
        {
          event_id: event.event_id,
          full_name: nameToSubmit,
          email: emailToSubmit,
          phone: formData.phone,
          department: deptToSubmit,
          year: yearToSubmit,
          roll_no: formData.rollNo,
          notes: formData.notes
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      // 2️⃣ Optional Web3Forms submission
      const web3FormsKey = process.env.REACT_APP_WEB3FORMS_KEY;
      if (web3FormsKey) {
        try {
          await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify({
              access_key: web3FormsKey,
              subject: `New Event Registration - ${event.title}`,
              event_name: event.title,
              name: nameToSubmit,
              email: emailToSubmit,
              phone: formData.phone,
              department: deptToSubmit,
              year: yearToSubmit,
              notes: formData.notes
            })
          });
        } catch (wErr) {
          console.warn("Web3Forms error ignored:", wErr);
        }
      }

      toast.success(`Registered successfully for ${event.title} 🎉`);

      // Clear editable fields
      setFormData(prev => ({
        ...prev,
        phone: "",
        rollNo: "",
        notes: ""
      }));

    } catch (err) {
      console.error('Registration error:', err);
      if (err.response) {
        const errorMessage = err.response.data?.message || 'Failed to register';
        if (err.response.status === 409) {
          toast.warning(errorMessage + ' ⚠️');
        } else if (err.response.status === 401) {
          toast.error('Please login again 🔒');
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }, 2000);
        } else {
          toast.error(errorMessage + ' ❌');
        }
      } else {
        toast.error('Failed to register ❌');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking || !isAuthenticated) {
    return null;
  }

  if (isAlreadyRegistered) {
    return (
      <div className="event-register-container">
        <div className="event-register-form" style={{ textAlign: 'center', padding: '40px' }}>
          <h2>✅ Already Registered!</h2>
          <p style={{ marginTop: '16px', color: '#94a3b8' }}>
            You have already registered for <strong>{event?.title || 'this event'}</strong>.
          </p>
          <button
            style={{ marginTop: '24px' }}
            onClick={() => navigate('/events')}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-register-container">

      {event ? (
        <form className="event-register-form" onSubmit={handleSubmit}>
          <h2>Register for {event.title}</h2>

          {/* Read-Only Student Account Profile Summary */}
          <div className="applicant-details-card">
            <div className="applicant-detail-item">
              <span className="detail-label">Full Name</span>
              <span className="detail-value">{userProfile?.name || "Student"}</span>
            </div>
            <div className="applicant-detail-item">
              <span className="detail-label">College Email</span>
              <span className="detail-value">{userProfile?.email || "N/A"}</span>
            </div>
            <div className="applicant-detail-item">
              <span className="detail-label">Department</span>
              <span className="detail-value badge-highlight">{userProfile?.department || "N/A"}</span>
            </div>
            <div className="applicant-detail-item">
              <span className="detail-label">Year of Study</span>
              <span className="detail-value badge-highlight">{getYearLabel(userProfile?.year)}</span>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--primary-light)', fontWeight: '600' }}>
              Phone Number *
            </label>
            <input
              name="phone"
              placeholder="e.g. +91 9876543210"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--primary-light)', fontWeight: '600' }}>
              College Roll Number *
            </label>
            <input
              name="rollNo"
              placeholder="e.g. 31105"
              value={formData.rollNo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--primary-light)', fontWeight: '600' }}>
              Notes / Special Remarks (Optional)
            </label>
            <textarea
              name="notes"
              rows="3"
              placeholder="Any questions or special requirements..."
              value={formData.notes}
              onChange={handleChange}
            ></textarea>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Confirm Event Registration"}
          </button>
        </form>
      ) : (
        <p>Loading event details...</p>
      )}
    </div>
  );
}
