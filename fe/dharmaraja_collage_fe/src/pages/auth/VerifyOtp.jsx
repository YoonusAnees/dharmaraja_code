import { useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { RefreshCw, ShieldCheck } from "lucide-react";
import api from "../../api/axios";
import image from "/dc_logo.png";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef([]);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value.slice(-1);

    setOtp(updatedOtp);

    // Move to next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move back on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const finalOtp = otp.join("");

    try {
      const res = await api.post("/auth/verify-otp", {
        email,
        otp: finalOtp,
      });

      if (res.status !== 200) {
        throw new Error("OTP verification failed");
      }

      navigate("/reset-password", {
        state: {
          email,
          otp: finalOtp,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />

      <form
        onSubmit={submitHandler}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative space-y-6 hover:border-gold/20 transition-all duration-500"
      >
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-gold animate-pulse">
            <img src={image} alt="Logo" className="w-6 h-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase">
            Verify <span className="text-gold">OTP</span>
          </h1>

          <p className="text-white/40 text-xs font-semibold tracking-wide uppercase">
            Enter the 6-digit verification code
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/15 text-red-200 border border-red-500/20 p-4 rounded-2xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* OTP Inputs */}
        <div className="space-y-2">
          <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block text-center">
            Verification Code
          </label>

          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 sm:w-14 sm:h-16 bg-slate-950/40 border border-white/10 rounded-2xl text-center text-white text-xl font-black focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-300"
              />
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-hover text-black font-extrabold rounded-2xl py-4 transition-all duration-300 shadow-lg shadow-gold/10 hover:shadow-gold/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs tracking-widest uppercase"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Verify OTP
            </>
          )}
        </button>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-white/5">
          <p className="text-white/40 text-xs font-semibold">
            Remembered your password?
            <Link
              to="/login"
              className="text-gold hover:underline transition-all font-bold ml-2"
            >
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}