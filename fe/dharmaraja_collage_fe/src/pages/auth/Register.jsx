import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import { User, Mail, Phone, Calendar, Lock, UserPlus, RefreshCw, IdCard } from "lucide-react";
import image from "/dc_logo.png";

export default function Register() {
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    batchYear: "",
    password: "",
    address: "",
    nic: "",
    jobTitle: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [payhereData, setPayhereData] = useState(null);
  const [loading, setLoading] = useState(false);
  const payhereFormRef = useRef(null);

  const paymentSuccessMessage = paymentStatus === "success"
    ? "Payment completed successfully. Your registration is now pending admin approval."
    : "";

  const paymentCancelError = paymentStatus === "cancel"
    ? "Payment was canceled. Please try again to complete registration."
    : "";

  useEffect(() => {
    if (payhereData && payhereFormRef.current) {
      payhereFormRef.current.submit();
    }
  }, [payhereData]);

  useEffect(() => {
    const handleReturnStatus = async () => {
      const orderId = searchParams.get("order_id");
      if (paymentStatus === "success" && orderId) {
        try {
          await api.patch("/payments/complete-success", { orderId });
        } catch (err) {
          console.error("Local sandbox checkout verification error:", err);
        }
      }
    };
    handleReturnStatus();
  }, [paymentStatus, searchParams]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/payments/registration", form);
      setMessage(res.data.message || "Redirecting to payment gateway...");
      setPayhereData({ ...res.data.payhere, checkoutUrl: res.data.checkoutUrl });
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
            Dharmaraja College OBA <span className="text-gold">Register</span>
          </h1>
          <p className="text-white/40 text-xs font-semibold tracking-wide uppercase">
            Join the Dharmaraja College Old Boys Association
          </p>
        </div>

        {(message || paymentSuccessMessage) && (
          <div className="bg-emerald-500/15 text-emerald-200 border border-emerald-500/20 p-4 rounded-2xl text-xs font-medium">
            {message || paymentSuccessMessage}
          </div>
        )}
        {(error || paymentCancelError) && (
          <div className="bg-red-500/15 text-red-200 border border-red-500/20 p-4 rounded-2xl text-xs font-medium">
            {error || paymentCancelError}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
                />
              </div>
            </div>

            {/* Email Address */}
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

            {/* Contact Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Contact Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  placeholder="0771234567"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
                />
              </div>
            </div>

            {/* Batch Year */}
            <div className="space-y-2">
              <label className="text-[11px] text-white/60 font-semibold uppercase tracking-[0.15em] block">
                Batch Year
              </label>

              <div className="relative group">

                {/* Left Icon */}
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gold/70 group-focus-within:text-gold transition-colors duration-300">
                  <Calendar className="w-4 h-4" />
                </span>

                {/* Custom Dropdown Icon */}
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-gold transition-colors duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>

                <select
                  value={form.batchYear}
                  onChange={(e) =>
                    setForm({ ...form, batchYear: e.target.value })
                  }
                  className="
        w-full
        appearance-none
        bg-gradient-to-br from-slate-900/90 to-slate-950/90
        border border-white/10
        hover:border-gold/40
        focus:border-gold
        rounded-2xl
        pl-11
        pr-12
        py-3.5
        text-white
        text-sm
        font-medium
        shadow-lg shadow-black/20
        backdrop-blur-xl
        transition-all duration-300
        focus:outline-none
        focus:ring-4 focus:ring-gold/10
        cursor-pointer
      "
                >
                  <option
                    value=""
                    className="bg-slate-900 text-white"
                  >
                    Select Batch Year
                  </option>

                  {Array.from({ length: 100 }, (_, i) => {
                    const year = new Date().getFullYear() - i;

                    return (
                      <option
                        key={year}
                        value={year}
                        className="bg-slate-900 text-white"
                      >
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Job Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Job Title</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Job Title"
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
                />
              </div>
            </div>

            {/* NIC */}

            <div className="space-y-1.5">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">NIC</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <IdCard className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="NIC"
                  value={form.nic}
                  onChange={(e) => setForm({ ...form, nic: e.target.value })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
                />
              </div>
            </div>

            {/* Address */}

            <div className="space-y-1.5">
              <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-300 placeholder-white/20 font-medium"
                />
              </div>
            </div>




          </div>

          {/* Password */}
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
              "Register & Pay LKR 1,000"
            )}
          </button>
        </div>

        <div className="text-center pt-2 border-t border-white/5">
          <p className="text-white/40 text-xs font-semibold">
            Already registered?{" "}
            <Link to="/login" className="text-gold hover:underline transition-all font-bold">
              Sign In here
            </Link>
          </p>
        </div>
      </form>

      {payhereData?.checkoutUrl && (
        <form ref={payhereFormRef} action={payhereData.checkoutUrl} method="post" className="hidden">
          {Object.entries(payhereData).map(([name, value]) =>
            name === "checkoutUrl" ? null : (
              <input key={name} type="hidden" name={name} value={value} />
            )
          )}
        </form>
      )}
    </div>
  );
}