import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./NotificationBell.css";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const syncProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await api.get("/users/profile");
      if (res.data?.user) {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        if (Number(stored.role_id) !== Number(res.data.user.role_id) || stored.role_name !== res.data.user.role_name) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
          if (res.data.token) localStorage.setItem("token", res.data.token);
          if (res.data.refreshToken) localStorage.setItem("refreshToken", res.data.refreshToken);
          window.dispatchEvent(new Event("authChange"));
        }
      }
    } catch (err) {
      // Ignore if unauthenticated
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
      // Check if any unread notification is role/appointment related
      const hasRoleUpdate = (res.data || []).some(
        (n) => !n.is_read && (n.title?.includes("Appointed") || n.title?.includes("Role") || n.title?.includes("Status") || n.title?.includes("Transition"))
      );
      if (hasRoleUpdate) {
        await syncProfile();
      }
    } catch (err) {
      // Ignore network aborts
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      try {
        await api.put(`/notifications/${n.notification_id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item.notification_id === n.notification_id ? { ...item, is_read: true } : item))
        );
      } catch (err) {
        console.error(err);
      }
    }
    await syncProfile();
    setIsOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="bell-btn" onClick={() => setIsOpen(!isOpen)}>
        🔔
        {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h4>Notifications</h4>
            <span className="unread-tag">{unreadCount} Unread</span>
          </div>

          <div className="dropdown-body">
            {notifications.length === 0 ? (
              <p className="no-notifs">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notification_id}
                  className={`notif-item ${n.is_read ? "read" : "unread"}`}
                  onClick={() => handleNotificationClick(n)}
                  style={{ cursor: "pointer" }}
                >
                  <p className="notif-title">{n.title}</p>
                  <p className="notif-message">{n.message}</p>
                  <span className="notif-time">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
