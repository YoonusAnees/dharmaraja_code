import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Lock } from "lucide-react";
import image from "/dc_logo.png";

export default function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    branch: "",
    contactNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await api.post("/auth/register-admin", form);
      setMessage(res.data.message || "Admin registered successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />

      <form
        onSubmit={submitHandler}
        className="w-full max-w-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative space-y-6 hover:border-gold/20 transition-all duration-500"
      >
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-gold animate-pulse">
            <img src={image} alt="Logo" className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase">
            Dharmaraja College OBA <span className="text-gold">Admin Register</span>
          </h1>
          <p className="text-white/40 text-xs font-semibold tracking-wide uppercase">
            Create an admin account for the dashboard
          </p>
        </div>

        {/* Form fields */}
        <div className="grid gap-4">
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40"
          />
          <input
            type="text"
            name="branch"
            placeholder="Branch (e.g., Colombo Branch)"
            value={form.branch}
            onChange={handleChange}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40"
          />
          <input
            type="text"
            name="contactNumber"
            placeholder="Contact Number"
            value={form.contactNumber}
            onChange={handleChange}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gold text-slate-950 font-bold py-3 rounded-xl hover:bg-gold/80 transition-colors disabled:opacity-50"
        >
          {loading && <loading />}
          Register Admin
        </button>

        {/* Feedback messages */}
        {error && (
          <div className="bg-red-500/20 text-red-200 border border-red-500/30 rounded-xl p-3 text-sm mt-2">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded-xl p-3 text-sm mt-2">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
