import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";

export default function Badges() {
  const [searchParams] = useSearchParams();
  const [badges, setBadges] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [payhereData, setPayhereData] = useState(null);
  const [loading, setLoading] = useState(false);
  const payhereFormRef = useRef(null);

  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");
  const paymentMessage = paymentStatus === "success"
    ? "Payment completed successfully. Check your membership status in the dashboard."
    : paymentStatus === "cancel"
    ? "Payment canceled. Please try again."
    : "";

  const loadBadges = async () => {
    const res = await api.get("/badges");
    setBadges(res.data.badges || []);
  };

  useEffect(() => {
    const load = async () => {
      if (paymentStatus === "success" && orderId) {
        try {
          await api.patch("/payments/complete-success", { orderId });
        } catch (err) {
          console.error("Failed to complete local checkout:", err);
        }
      }
      await loadBadges();
    };
    load();
  }, [paymentStatus, orderId]);

  useEffect(() => {
    if (payhereData && payhereFormRef.current) {
      payhereFormRef.current.submit();
    }
  }, [payhereData]);

  const purchaseBadge = async (badge) => {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/payments/checkout", {
        type: "badge",
        itemId: badge._id,
      });

      setMessage(res.data.message || "Redirecting to payment gateway...");
      setPayhereData({ ...res.data.payhere, checkoutUrl: res.data.checkoutUrl });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Payment initiation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">Membership Badges</h1>
        <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">
          View and purchase membership badges to unlock premium OBA benefits.
        </p>
      </div>

      {(message || paymentMessage) && (
        <div className="rounded-xl bg-green-500/20 text-green-200 p-4 border border-green-500/20 text-xs sm:text-sm">
          {message || paymentMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/20 text-red-200 p-4 border border-red-500/20 text-xs sm:text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge) => (
          <div
            key={badge._id}
            className="rounded-3xl bg-white/5 border border-white/5 p-6 hover:border-white/10 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between shadow-xl"
          >
            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-black text-gold leading-tight">{badge.name}</h3>
              <p className="text-white/60 text-xs sm:text-sm leading-relaxed">{badge.description}</p>
              <div className="text-2xl sm:text-3xl font-black text-white py-1">
                LKR {badge.standardAmount.toLocaleString()}
              </div>
              <p className="text-white/50 text-xs font-semibold leading-relaxed border-t border-white/5 pt-3">
                🎁 Benefits: {badge.benefits}
              </p>
            </div>

            <button
              onClick={() => purchaseBadge(badge)}
              disabled={loading}
              className="w-full mt-6 bg-gold hover:bg-gold-hover text-black font-bold rounded-xl py-3.5 text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-gold/10"
            >
              {loading ? "Processing..." : "Purchase Badge"}
            </button>
          </div>
        ))}
      </div>

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