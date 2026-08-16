import { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";
import "./AdminCreateEvent.css";

export default function AdminCreateEvent({ onEventCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.venue.trim()) {
      toast.error("Event title, date, and venue are required");
      return;
    }
    try {
      await api.post("/events", {
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        venue: form.venue.trim()
      });
      toast.success("Event created successfully 🚀");

      if (onEventCreated) {
        onEventCreated();
      }

      setForm({
        title: "",
        description: "",
        date: "",
        venue: "",
      });

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create Event 🚫");
    }
  };


  return (
    <>
      <form onSubmit={submit}>
        <h2>Create Event/Session</h2>

        <input
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />

        <input
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />

        <input
          type="date"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
        />

        <input
          placeholder="Venue"
          value={form.venue}
          onChange={e => setForm({ ...form, venue: e.target.value })}
        />
        <button type="submit">Add Event/Session</button>
      </form>
    </>
  );
}
