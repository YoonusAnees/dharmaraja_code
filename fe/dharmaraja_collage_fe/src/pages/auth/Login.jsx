import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Mail, Lock, RefreshCw } from "lucide-react";
import image from "/dc_logo.png";


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(form);

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/member");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Decorative mechanical aura glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />

      <form 
        onSubmit={submitHandler} 
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative space-y-6 hover:border-gold/20 transition-all duration-500"
      >
        {/* Logo/Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-gold animate-pulse">
            <img src={image} alt="Logo" className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase">
            DHARMARAJA COLLAGE OBA <span className="text-gold">Login</span>
          </h1>
          <p className="text-white/40 text-xs font-semibold tracking-wide uppercase">
            Old Boys Association Management System
          </p>
        </div>

        {error && (
          <div className="bg-red-500/15 text-red-200 border border-red-500/20 p-4 rounded-2xl text-xs font-medium">
             {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-hover text-black font-extrabold rounded-2xl py-4 transition-all duration-300 shadow-lg shadow-gold/10 hover:shadow-gold/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs tracking-widest uppercase mt-6"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </div>

        <div className="text-center pt-2 border-t border-white/5">
          <p className="text-white/40 text-xs font-semibold">
            <Link to="/forgot-password" className="text-gold hover:underline transition-all font-bold mr-2">
              Forgot Password?
            </Link>
            <span className="mx-1 text-gray-500">|</span>
            New member? <Link to="/register" className="text-gold hover:underline transition-all font-bold">
              Register & Sign Up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}