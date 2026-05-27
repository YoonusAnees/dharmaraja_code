import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function ManageCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    campaignType: "fixed",
    fixedAmount: "",
    targetAmount: "",
    startDate: "",
    endDate: "",
  });

  const loadCampaigns = async () => {
    const res = await api.get("/campaigns");
    setCampaigns(res.data.campaigns || []);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCampaigns();
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

    await api.post("/campaigns", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    setForm({
      name: "",
      description: "",
      campaignType: "fixed",
      fixedAmount: "",
      targetAmount: "",
      startDate: "",
      endDate: "",
    });
    setImageFile(null);
    if (document.getElementById("campaignImageInput")) {
      document.getElementById("campaignImageInput").value = "";
    }
    loadCampaigns();
  };

  return (
    <div>
      <h1 className="text-4xl font-black">Manage Campaigns</h1>

     <form
  onSubmit={submitHandler}
  className="grid md:grid-cols-2 gap-6 mt-8 bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
>
  {/* Campaign Name */}
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-white/70">
      Campaign Name
    </label>
    <input
      type="text"
      placeholder="Enter campaign name"
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold transition"
    />
  </div>

  {/* Campaign Type */}
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-white/70">
      Campaign Type
    </label>
    <select
      value={form.campaignType}
      onChange={(e) =>
        setForm({ ...form, campaignType: e.target.value })
      }
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gold transition"
    >
      <option value="fixed" className="text-black">
        Fixed Amount Campaign
      </option>
      <option value="open" className="text-black">
        Open Contribution Campaign
      </option>
      <option value="event" className="text-black">
        Event Campaign
      </option>
    </select>
  </div>

  {/* Fixed Amount */}
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-white/70">
      Fixed Amount
    </label>
    <input
      type="number"
      placeholder="Enter fixed amount"
      value={form.fixedAmount}
      onChange={(e) =>
        setForm({ ...form, fixedAmount: e.target.value })
      }
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold transition"
    />
  </div>

  {/* Target Amount */}
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-white/70">
      Target Amount
    </label>
    <input
      type="number"
      placeholder="Enter target amount"
      value={form.targetAmount}
      onChange={(e) =>
        setForm({ ...form, targetAmount: e.target.value })
      }
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold transition"
    />
  </div>

  {/* Start Date */}
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-white/70">
      Start Date
    </label>
    <input
      type="date"
      value={form.startDate}
      onChange={(e) =>
        setForm({ ...form, startDate: e.target.value })
      }
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gold transition"
    />
  </div>

  {/* End Date */}
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-white/70">
      End Date
    </label>
    <input
      type="date"
      value={form.endDate}
      onChange={(e) =>
        setForm({ ...form, endDate: e.target.value })
      }
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-gold transition"
    />
  </div>

  {/* Description */}
  <div className="md:col-span-2 flex flex-col gap-2">
    <label className="text-sm font-semibold text-white/70">
      Description
    </label>
    <textarea
      rows={5}
      placeholder="Write campaign description..."
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
      Campaign Image
    </label>

    <input
      id="campaignImageInput"
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
    Create Campaign
  </button>
</form>

   <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
  {campaigns.map((c) => {
    const progress =
      c.targetAmount > 0
        ? Math.min((c.collectedAmount / c.targetAmount) * 100, 100)
        : 0;

    return (
      <div
        key={c._id}
        className="group overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 hover:border-gold/40 transition-all duration-300 shadow-xl hover:-translate-y-1"
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          {c.image ? (
            <img
              src={`${import.meta.env.VITE_API_URL.replace("/api", "")}${c.image}`}
              alt={c.name}
              loading="lazy"
              className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <div className="w-full h-56 bg-white/5 flex items-center justify-center text-white/30 text-sm">
              No Image Available
            </div>
          )}

          {/* Campaign Type Badge */}
          <div className="absolute top-4 right-4">
            <span className="bg-gold text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg capitalize">
              {c.campaignType} Campaign
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-2xl font-bold text-white line-clamp-1">
            {c.name}
          </h3>

          {/* Description */}
          <p className="text-white/60 text-sm mt-3 line-clamp-3 leading-relaxed">
            {c.description}
          </p>

          {/* Amount Section */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Collected</span>
              <span className="font-bold text-gold">
                Rs. {c.collectedAmount?.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Target</span>
              <span className="font-semibold text-white">
                Rs. {c.targetAmount?.toLocaleString()}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Progress Text */}
            <div className="flex justify-between text-xs text-white/40">
              <span>{progress.toFixed(0)}% completed</span>
              <span>
                {c.collectedAmount}/{c.targetAmount}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-white/40">
              {new Date(c.startDate).toLocaleDateString()} -{" "}
              {new Date(c.endDate).toLocaleDateString()}
            </div>

         
          </div>
        </div>
      </div>
    );
  })}
</div>
    </div>
  );
}