import { db } from "../config/db.js";

export const EventRegistrationModel = {
  async register(eventId, userId, formData) {
    const { full_name, email, phone, department, year, roll_no, notes } = formData;
    await db.query(
      "INSERT INTO event_registration (event_id, student_id, full_name, email, phone, department, year, roll_no, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [eventId, userId, full_name, email, phone, department, year, roll_no, notes]
    );
  },

  async isAlreadyRegistered(eventId, userId) {
    const [rows] = await db.query(
      "SELECT registration_id FROM event_registration WHERE event_id = ? AND student_id = ?",
      [eventId, userId]
    );
    return rows.length > 0;
  },

  async myEvents(userId, userRole) {
    let query;
    let params;

    if (userRole === 1 || userRole === 'Student') {
      query = `
        SELECT DISTINCT
          e.*
        FROM event e
        INNER JOIN event_registration er ON er.event_id = e.event_id
        WHERE er.student_id = ?
        ORDER BY e.date ASC
      `;
      params = [userId];
    } else {
      query = `
        SELECT DISTINCT
          e.*
        FROM event e
        LEFT JOIN event_registration er ON er.event_id = e.event_id AND er.student_id = ?
        LEFT JOIN club c ON c.club_id = e.club_id
        WHERE er.student_id = ? 
           OR e.organizer_id = ? 
           OR c.club_head_id = ? 
           OR c.club_mentor_id = ?
        ORDER BY e.date ASC
      `;
      params = [userId, userId, userId, userId, userId];
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  async getEventRegistrations(eventId) {
    const [rows] = await db.query(
      "SELECT * FROM event_registration WHERE event_id = ? ORDER BY registered_at DESC",
      [eventId]
    );
    return rows;
  }
};
