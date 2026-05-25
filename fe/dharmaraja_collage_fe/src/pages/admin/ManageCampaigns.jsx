import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function ManageCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    campaignType: "fixed",
    fixedAmount: "",
    targetAmount: "",
    deadline: "",
  });

  const loadCampaigns = async () => {
    const res = await api.get("/campaigns");
    setCampaigns(res.data.campaigns || []);
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    await api.post("/campaigns", form);
    setForm({
      name: "",
      description: "",
      campaignType: "fixed",
      fixedAmount: "",
      targetAmount: "",
      deadline: "",
    });
    loadCampaigns();
  };

  return (
    <div>
      <h1 className="text-4xl font-black">Manage Campaigns</h1>

      <form onSubmit={submitHandler} className="grid md:grid-cols-2 gap-4 mt-8 bg-white/10 p-6 rounded-2xl">
        <input placeholder="Campaign Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

        <select value={form.campaignType} onChange={(e) => setForm({ ...form, campaignType: e.target.value })}>
          <option value="fixed">Fixed Amount Campaign</option>
          <option value="open">Open Contribution Campaign</option>
          <option value="event">Event Campaign</option>
        </select>

        <input placeholder="Fixed Amount" value={form.fixedAmount} onChange={(e) => setForm({ ...form, fixedAmount: e.target.value })} />
        <input placeholder="Target Amount" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
        <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />

        <textarea className="md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <button className="bg-gold text-black font-bold rounded-xl py-3 md:col-span-2">
          Create Campaign
        </button>
      </form>

      <div className="grid md:grid-cols-3 gap-5 mt-8">
        {campaigns.map((c) => (
          <div key={c._id} className="bg-white/10 rounded-2xl p-5 border border-white/10">
            <h3 className="text-xl font-bold">{c.name}</h3>
            <p className="text-gold mt-2">{c.campaignType}</p>
            <p className="text-white/60 mt-2">{c.description}</p>
            <p className="mt-3">Collected: Rs. {c.collectedAmount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}