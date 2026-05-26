import { useState } from "react";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";
import { User, Phone, Calendar, Landmark, Lock, RefreshCw, Check } from "lucide-react";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    contactNumber: user?.contactNumber || "",
    batchYear: user?.batchYear || "",
    branch: user?.branch || "",
    password: "",
    confirmPassword: "",
  });

  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePicture ? `${import.meta.env.VITE_API_URL.replace("/api", "")}${user.profilePicture}` : null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (form.password && form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key] !== undefined && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });
      if (profilePictureFile) {
        formData.append("profilePicture", profilePictureFile);
      }

      const res = await api.put("/auth/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.message || "Profile updated successfully!");
      setUser(res.data.user); // Update global state
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" })); // Clear passwords
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">My Profile</h1>
        <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">Update your membership information and account credentials.</p>
      </div>

      {message && (
        <div className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm">
          <Check className="w-5 h-5 bg-emerald-500 text-black rounded-full p-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/15 text-red-200 border border-red-500/20 p-4 rounded-2xl text-xs sm:text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Main Profile Card Container */}
      <div className="bg-white/5 border border-white/5 rounded-3xl p-5 sm:p-8 shadow-2xl relative">
        <form onSubmit={submitHandler} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Profile Picture */}
            <div className="sm:col-span-2 flex flex-col items-center sm:items-start gap-4">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Profile Picture</label>
              <div className="flex items-center gap-5">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gold/50 bg-slate-800 flex items-center justify-center shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-white/20" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="profilePictureInput"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setProfilePictureFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gold file:text-black hover:file:bg-yellow-400 transition-all cursor-pointer"
                  />
                  <p className="text-[10px] text-white/40 mt-2 font-medium">Upload a square image. Max size 2MB.</p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
                />
              </div>
            </div>

            {/* Email (Disabled, cannot be edited for integrity) */}
            <div className="space-y-1.5 sm:col-span-2 opacity-50">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Email Address (Non-editable)</label>
              <input
                type="email"
                disabled
                value={user?.email}
                className="w-full bg-slate-950/20 border border-white/5 rounded-2xl px-4 py-3.5 text-white/60 text-sm cursor-not-allowed font-medium"
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Contact Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  placeholder="Your contact number"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
                />
              </div>
            </div>

            {/* Batch Year */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Batch Year</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. 2018"
                  value={form.batchYear}
                  onChange={(e) => setForm({ ...form, batchYear: e.target.value })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
                />
              </div>
            </div>

            {/* Branch */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">OBA Branch</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <Landmark className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Colombo Branch"
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
                />
              </div>
            </div>

            {/* Password Section divider */}
            <div className="sm:col-span-2 border-t border-white/5 pt-4 mt-2">
              <h3 className="text-sm font-bold text-gold">Change Account Password</h3>
              <p className="text-white/40 text-[11px] mt-0.5 font-medium">Leave password fields blank if you do not want to change it.</p>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
                />
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-gold hover:bg-gold-hover text-black font-extrabold rounded-2xl px-8 py-4 transition-all duration-300 shadow-lg shadow-gold/10 hover:shadow-gold/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs tracking-widest uppercase"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
