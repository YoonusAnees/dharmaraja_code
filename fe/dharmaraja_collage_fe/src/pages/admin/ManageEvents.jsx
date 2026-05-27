import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    fee: "",
    budget: "",
  });

  const loadEvents = async () => {
    const res = await api.get("/events");
    setEvents(res.data.events || []);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(form).forEach((key) => formData.append(key, form[key]));
    if (imageFile) {
      formData.append("image", imageFile);
    }
    
    await api.post("/events", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setForm({ title: "", description: "", eventDate: "", location: "", fee: "", budget: "" });
    setImageFile(null);
    if (document.getElementById("eventImageInput")) {
      document.getElementById("eventImageInput").value = "";
    }
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
        <input
          type="number"
          placeholder="Budget Allocation (Rs.)"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
        />
        <textarea className="md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <div className="md:col-span-2 bg-white/5 p-4 rounded-xl">
          <label className="block text-sm font-bold text-white/60 mb-2">Event Image</label>
          <input 
            id="eventImageInput"
            type="file" 
            accept="image/*" 
            onChange={(e) => setImageFile(e.target.files[0])} 
            className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gold file:text-black hover:file:bg-yellow-400"
          />
        </div>
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
            {event.budget > 0 && <p className="text-emerald-400 font-bold mt-2 text-sm">Budget: Rs. {event.budget}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}