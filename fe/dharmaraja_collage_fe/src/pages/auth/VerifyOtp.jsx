import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import api from "../../api/axios";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        email,
        otp,
      });
      if (!res.status === 200) throw new Error(res.message || "OTP verification failed");
      // proceed to reset password page, passing email and otp via state
      navigate("/reset-password", { state: { email, otp } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form onSubmit={submitHandler} className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Verify OTP</h2>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">OTP</label>
          <input
            type="text"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/10 rounded-xl p-2 text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-black font-bold py-2 rounded hover:bg-gold-hover flex items-center justify-center"
        >
          {loading ? <RefreshCw className="animate-spin" /> : "Verify OTP"}
        </button>
        <p className="text-center text-sm text-white/50">
          Remembered? <Link to="/login" className="text-gold hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
