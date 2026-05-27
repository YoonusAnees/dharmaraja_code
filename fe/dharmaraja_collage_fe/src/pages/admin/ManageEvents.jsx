import { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  Calendar,
  MapPin,
  CreditCard,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
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

      {/* ================= FORM ================= */}
      <form
        onSubmit={submitHandler}
        className="grid md:grid-cols-2 gap-6 mt-8 bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
      >
        {/* Event Title */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white/70">
            Event Title
          </label>
          <input
            type="text"
            placeholder="Enter event title"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold transition"
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white/70">
            Location
          </label>
          <input
            type="text"
            placeholder="Enter location"
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold transition"
          />
        </div>

        {/* Event Date */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white/70">
            Event Date
          </label>
          <input
            type="date"
            value={form.eventDate}
            onChange={(e) =>
              setForm({ ...form, eventDate: e.target.value })
            }
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gold transition"
          />
        </div>

        {/* Event Fee */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white/70">
            Event Fee (Rs.)
          </label>
          <input
            type="number"
            placeholder="Enter event fee"
            value={form.fee}
            onChange={(e) =>
              setForm({ ...form, fee: e.target.value })
            }
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold transition"
          />
        </div>

        {/* Budget */}
        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="text-sm font-semibold text-white/70">
            Budget Allocation (Rs.)
          </label>
          <input
            type="number"
            placeholder="Enter budget allocation"
            value={form.budget}
            onChange={(e) =>
              setForm({ ...form, budget: e.target.value })
            }
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold transition"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="text-sm font-semibold text-white/70">
            Description
          </label>
          <textarea
            rows={5}
            placeholder="Write event description..."
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold transition resize-none"
          />
        </div>

        {/* Image Upload */}
        <div className="md:col-span-2 bg-white/5 border border-dashed border-white/20 rounded-2xl p-6 hover:border-gold transition">
          <label className="block text-sm font-semibold text-white/70 mb-3">
            Event Image
          </label>

          <input
            id="eventImageInput"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="w-full text-sm text-white
      file:mr-4
      file:rounded-xl
      file:border-0
      file:bg-gold
      file:px-5
      file:py-3
      file:font-semibold
      file:text-black
      hover:file:bg-yellow-400
      cursor-pointer"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="md:col-span-2 bg-gold hover:bg-yellow-400 text-black font-bold rounded-2xl py-4 text-lg transition-all duration-300 shadow-lg hover:scale-[1.01]"
        >
          Create Event
        </button>
      </form>

      {/* ================= EVENT CARDS ================= */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {events.map((event) => (
          <div
            key={event._id}
            className="group overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 hover:border-gold/40 transition-all duration-300 shadow-xl hover:-translate-y-1"
          >
            {/* Event Image */}
            <div className="relative overflow-hidden">
              {event.image ? (
                <img
                  src={`${import.meta.env.VITE_API_URL.replace("/api", "")}${event.image}`}
                  alt={event.title}
                  className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
                />
              ) : (
                <div className="w-full h-56 bg-white/5 flex items-center justify-center text-white/30 text-sm">
                  No Event Image
                </div>
              )}

              {/* Date Badge */}
              <div className="absolute top-4 right-4 bg-gold text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> {event.eventDate?.slice(0, 10)}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Title */}
              <h3 className="text-2xl font-bold text-white line-clamp-1">
                {event.title}
              </h3>

              {/* Location */}
              <p className="text-white/50 text-sm mt-2 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> {event.location || "No location available."}
              </p>

              {/* Description */}
              <p className="text-white/60 text-sm mt-4 leading-relaxed line-clamp-3 flex items-center gap-2">
                <  AlertCircle className="w-3.5 h-3.5" /> {event.description || "No description available."}
              </p>

              {/* Fee & Budget */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm flex items-center gap-2">  <CreditCard className="w-3.5 h-3.5" /> Event Fee</span>
                  <span className="text-gold font-bold flex items-center gap-2">
                    Rs. {Number(event.fee || 0).toLocaleString()}
                  </span>
                </div>

                {event.budget > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5" /> Budget Allocation
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-2">
                      Rs. {Number(event.budget).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}