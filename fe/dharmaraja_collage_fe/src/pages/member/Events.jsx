import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";

export default function Events() {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [payhereData, setPayhereData] = useState(null);
  const [loading, setLoading] = useState(false);
  const payhereFormRef = useRef(null);

  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");
  const paymentMessage = paymentStatus === "success"
    ? "Event registration payment completed successfully."
    : paymentStatus === "cancel"
    ? "Payment canceled. Please try again."
    : "";

  const loadEvents = async () => {
    const res = await api.get("/events");
    setEvents(res.data.events || []);
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
      await loadEvents();
    };
    load();
  }, [paymentStatus, orderId]);

  useEffect(() => {
    if (payhereData && payhereFormRef.current) {
      payhereFormRef.current.submit();
    }
  }, [payhereData]);

  const registerEvent = async (eventItem) => {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/payments/checkout", {
        type: "event",
        itemId: eventItem._id,
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">Events</h1>
        <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">
          View and register for upcoming Old Boys Association events.
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
        {events.map((event) => (
          <div
            key={event._id}
            className="rounded-3xl bg-white/5 border border-white/5 p-6 hover:border-white/10 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between shadow-xl"
          >
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-black text-gold leading-tight">{event.title}</h3>
              <p className="text-white/60 text-xs sm:text-sm leading-relaxed">{event.description}</p>
              
              <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-4 space-y-2 text-xs sm:text-sm text-white/70">
                <div className="flex justify-between">
                  <span className="text-white/40">Date:</span>
                  <span className="font-semibold">{event.eventDate ? new Date(event.eventDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Location:</span>
                  <span className="font-semibold text-right max-w-[150px] truncate" title={event.location}>{event.location}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2 mt-1">
                  <span className="text-white/40">Fee:</span>
                  <span className="font-black text-white">LKR {(event.fee || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              onClick={() => registerEvent(event)}
              className="w-full mt-6 bg-gold hover:bg-gold-hover text-black font-bold rounded-xl py-3.5 text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-gold/10"
            >
              {loading ? "Processing..." : "Register & Pay"}
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