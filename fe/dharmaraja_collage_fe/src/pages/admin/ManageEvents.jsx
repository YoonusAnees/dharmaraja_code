import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    fee: "",
  });

  const loadEvents = async () => {
    const res = await api.get("/events");
    setEvents(res.data.events || []);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    await api.post("/events", {
      ...form,
      fee: Number(form.fee) || 0,
    });
    setForm({ title: "", description: "", eventDate: "", location: "", fee: "" });
    loadEvents();
  };

  return (
    <div>
      <h1 className="text-4xl font-black">Manage Events</h1>

      <form onSubmit={submitHandler} className="grid md:grid-cols-2 gap-4 mt-8 bg-white/10 p-6 rounded-2xl">
        <input placeholder="Event Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
        <input
          type="number"
          placeholder="Event Fee (Rs.)"
          value={form.fee}
          onChange={(e) => setForm({ ...form, fee: e.target.value })}
        />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <button className="bg-gold text-black font-bold rounded-xl py-3 md:col-span-2">
          Create Event
        </button>
      </form>

      <div className="grid md:grid-cols-3 gap-5 mt-8">
        {events.map((event) => (
          <div key={event._id} className="bg-white/10 rounded-2xl p-5 border border-white/10">
            <h3 className="text-xl font-bold">{event.title}</h3>
            <p className="text-white/60">{event.location}</p>
            <p className="text-gold mt-2">{event.eventDate?.slice(0, 10)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}