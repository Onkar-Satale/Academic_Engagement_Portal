import { db } from "../config/db.js";

export const EventModel = {
  createWithOrganizer: async (reqUser, bodyData) => {
    let { title, description, date, venue, club_id, additional_info, conducted_by } = bodyData;

    if (!club_id) {
      if (reqUser.role === 2) {
        const [[headClub]] = await db.query("SELECT club_id FROM club WHERE club_head_id = ?", [reqUser.id]);
        if (headClub) club_id = headClub.club_id;
      } else if (reqUser.role === 5) {
        const [[mentorClub]] = await db.query("SELECT club_id FROM club WHERE club_mentor_id = ?", [reqUser.id]);
        if (mentorClub) club_id = mentorClub.club_id;
      }
    }

    const [res] = await db.query(
      "INSERT INTO event (title, description, date, venue, status, club_id, organizer_id, additional_info, conducted_by) VALUES (?,?,?,?,?,?,?,?,?)",
      [title, description, date, venue, "APPROVED", club_id || null, reqUser.id, additional_info, conducted_by]
    );
    return res.insertId;
  },

  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM event ORDER BY date DESC");
    return rows;
  },

  getById: async (id) => {
    const [[row]] = await db.query("SELECT * FROM event WHERE event_id = ?", [id]);
    return row;
  },

  getByIdWithDetails: async (eventId) => {
    const [rows] = await db.query(
      `SELECT 
          e.*,
          u.name AS creator_name,
          c.club_head_id,
          c.club_mentor_id
       FROM event e
       LEFT JOIN user u ON u.user_id = e.organizer_id
       LEFT JOIN club c ON c.club_id = e.club_id
       WHERE e.event_id = ?`,
      [eventId]
    );
    return rows[0];
  },

  delete: async (eventId, reqUser) => {
    const [[event]] = await db.query("SELECT * FROM event WHERE event_id = ?", [eventId]);
    if (!event) return { status: 404, message: "Event not found" };

    const [[club]] = await db.query("SELECT club_head_id, club_mentor_id FROM club WHERE club_id = ?", [event.club_id]);
    let isAuthorized = reqUser.role === 4 || (club && (club.club_head_id === reqUser.id || club.club_mentor_id === reqUser.id));
    if (!isAuthorized) return { status: 403, message: "Not allowed" };

    await db.query("DELETE FROM event WHERE event_id = ?", [eventId]);
    return { status: 200, message: "Event deleted successfully" };
  },

  update: async (eventId, reqUser, bodyData) => {
    const { title, description, date, venue, additional_info, conducted_by } = bodyData;
    const [[event]] = await db.query("SELECT * FROM event WHERE event_id = ?", [eventId]);
    if (!event) return { status: 404, message: "Event not found" };

    const [[club]] = await db.query("SELECT club_head_id, club_mentor_id FROM club WHERE club_id = ?", [event.club_id]);
    let isAuthorized = reqUser.role === 4 || (club && (club.club_head_id === reqUser.id || club.club_mentor_id === reqUser.id));
    if (!isAuthorized) return { status: 403, message: "Not allowed. Only Club Head or Mentor of this club can edit." };

    await db.query(
      `UPDATE event SET title=?, description=?, date=?, venue=?, additional_info=?, conducted_by=? WHERE event_id=?`,
      [title, description, date, venue, additional_info, conducted_by, eventId]
    );
    return { status: 200, message: "Event updated" };
  }
};

export default EventModel;
