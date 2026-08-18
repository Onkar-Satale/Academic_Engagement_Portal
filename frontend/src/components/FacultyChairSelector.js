import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./FacultyChairSelector.css";

export default function FacultyChairSelector({
  title,
  subtitle,
  icon = "🏛️",
  selectedUserId,
  candidates = [],
  onChange,
  accentColor = "#fde047"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  // Close when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Lock background scroll
      setTimeout(() => searchInputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const selectedCandidate = candidates.find(
    (c) => String(c.user_id) === String(selectedUserId)
  );

  const filteredCandidates = candidates.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = c.name?.toLowerCase().includes(q);
    const matchEmail = c.email?.toLowerCase().includes(q);
    const matchDept = c.department?.toLowerCase().includes(q);
    const matchRole = c.role_name?.toLowerCase().includes(q);
    return matchName || matchEmail || matchDept || matchRole;
  });

  const handleSelect = (userId) => {
    onChange(userId ? String(userId) : "");
    setIsOpen(false);
    setSearchQuery("");
  };

  const modalContent = isOpen ? (
    <div className="chair-modal-backdrop" onClick={() => setIsOpen(false)}>
      <div
        className="chair-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="chair-modal-header">
          <div>
            <h4 className="modal-title">
              {icon} Appoint Faculty: <span style={{ color: accentColor }}>{title}</span>
            </h4>
            <p className="modal-subtitle">
              Search by name, email, or department to appoint an eligible faculty member.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Unified Search Input */}
        <div className="chair-search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by faculty name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chair-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>

        {/* Candidate List */}
        <div className="candidates-list">
          {/* Unassign Option */}
          <div
            className={`candidate-item unassign-item ${!selectedUserId ? "active" : ""}`}
            onClick={() => handleSelect("")}
          >
            <div className="candidate-avatar unassign-avatar">✕</div>
            <div className="candidate-details">
              <span className="candidate-name" style={{ color: "#94a3b8" }}>
                -- Leave Chair Unassigned --
              </span>
            </div>
            {!selectedUserId && <span className="selected-check">✓ Active</span>}
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="no-candidates-msg">
              <p>No faculty found matching "{searchQuery}"</p>
            </div>
          ) : (
            filteredCandidates.map((c) => {
              const isSelected = String(c.user_id) === String(selectedUserId);
              return (
                <div
                  key={c.user_id}
                  className={`candidate-item ${isSelected ? "active" : ""}`}
                  onClick={() => handleSelect(c.user_id)}
                >
                  <div className="candidate-avatar">
                    {c.name ? c.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="candidate-details">
                    <div className="candidate-name-row">
                      <span className="candidate-name">{c.name}</span>
                      {c.department && (
                        <span className="candidate-dept-tag">{c.department}</span>
                      )}
                    </div>
                    <span className="candidate-email">{c.email}</span>
                    <span className="candidate-current-role">Current Post: {c.role_name || "Faculty"}</span>
                  </div>
                  {isSelected && <span className="selected-check">✓ Selected</span>}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="chair-modal-footer">
          <span className="candidate-counter">
            Showing {filteredCandidates.length} of {candidates.length} eligible faculty
          </span>
          <button
            type="button"
            className="modal-cancel-btn"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="chair-selector-card">
      {/* Chair Header */}
      <div className="chair-header">
        <div className="chair-title-wrap">
          <span className="chair-icon">{icon}</span>
          <div>
            <h4 className="chair-title" style={{ color: accentColor }}>
              {title}
            </h4>
            {subtitle && <p className="chair-subtitle">{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Selected Appointee Card or Empty State */}
      {selectedCandidate ? (
        <div className="appointee-card">
          <div className="appointee-avatar">
            {selectedCandidate.name ? selectedCandidate.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="appointee-info">
            <div className="appointee-name-row">
              <span className="appointee-name">{selectedCandidate.name}</span>
              {selectedCandidate.department && (
                <span className="dept-pill">{selectedCandidate.department}</span>
              )}
            </div>
            <span className="appointee-email">{selectedCandidate.email}</span>
            <span className="current-role-badge">
              Current Post: {selectedCandidate.role_name || "Faculty"}
            </span>
          </div>
          <div className="appointee-actions">
            <button
              type="button"
              className="change-btn"
              onClick={() => setIsOpen(true)}
              title="Change appointee"
            >
              🔄 Change
            </button>
            <button
              type="button"
              className="unassign-btn"
              onClick={() => handleSelect("")}
              title="Unassign chair"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div
          className="empty-chair-slot"
          onClick={() => setIsOpen(true)}
          role="button"
          tabIndex={0}
        >
          <span className="plus-icon">+</span>
          <span>Appoint Faculty Member</span>
        </div>
      )}

      {/* Render Modal via Portal directly to body */}
      {isOpen && ReactDOM.createPortal(modalContent, document.body)}
    </div>
  );
}
