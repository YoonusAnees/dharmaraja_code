import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function ManageBadges() {
  const [badges, setBadges] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    standardAmount: "",
    benefits: "",
  });

  const loadBadges = async () => {
    const res = await api.get("/badges");
    setBadges(res.data.badges || []);
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    await api.post("/badges", form);
    setForm({ name: "", description: "", standardAmount: "", benefits: "" });
    loadBadges();
  };

  return (
    <div>
      <h1 className="text-4xl font-black">Manage Badges</h1>

      <form onSubmit={submitHandler} className="grid md:grid-cols-2 gap-4 mt-8 bg-white/10 p-6 rounded-2xl">
        <input placeholder="Badge Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Standard Amount" value={form.standardAmount} onChange={(e) => setForm({ ...form, standardAmount: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <textarea placeholder="Benefits" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} />

        <button className="bg-gold text-black font-bold rounded-xl py-3 md:col-span-2">
          Create Badge
        </button>
      </form>

      <div className="grid md:grid-cols-3 gap-5 mt-8">
        {badges.map((badge) => (
          <div key={badge._id} className="bg-white/10 rounded-2xl p-5 border border-white/10">
            <h3 className="text-xl font-bold">{badge.name}</h3>
            <p className="text-gold mt-2">Rs. {badge.standardAmount}</p>
            <p className="text-white/60 mt-2">{badge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}