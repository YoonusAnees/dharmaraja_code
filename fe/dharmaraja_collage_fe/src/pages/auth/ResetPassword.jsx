import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import api from "../../api/axios";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const otp = location.state?.otp || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      // Axios resolves non‑2xx as an exception, so reaching here means success
      setSuccess(data.message || "Password reset successful");
      // Redirect to login after short delay
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form onSubmit={submitHandler} className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Reset Password</h2>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/10 rounded-xl p-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Confirm Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/10 rounded-xl p-2 text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-black font-bold py-2 rounded hover:bg-gold-hover flex items-center justify-center"
        >
          {loading ? <RefreshCw className="animate-spin" /> : "Reset Password"}
        </button>
        <p className="text-center text-sm text-white/50">
          Remembered? <Link to="/login" className="text-gold hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
