import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import {
  Calendar,
  MapPin,
  CreditCard,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

const SESSION_KEY = "payhere_event_info";

export default function Events() {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingEventId, setLoadingEventId] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const [payhereFields, setPayhereFields] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const payhereFormRef = useRef(null);

  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");

  // ---- Load events + user's event payments ----
  const loadData = async () => {
    try {
      setLoadingPage(true);
      const [eventsRes, paymentsRes] = await Promise.all([
        api.get("/events"),
        api.get("/payments/my-payments"),
      ]);
      setEvents(eventsRes.data.events || []);
      setMyPayments(
        (paymentsRes.data.payments || []).filter((p) => p.type === "event")
      );
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoadingPage(false);
    }
  };

  // ---- On mount: handle PayHere return then load data ----
  useEffect(() => {
    const init = async () => {
      // Read payment info stored before PayHere redirect
      let stored = null;
      try {
        stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      } catch {
        void 0;
      }

      if (paymentStatus === "success" && (orderId || stored?.orderId)) {
        try {
          await api.patch("/payments/complete-success", {
            orderId: orderId || stored?.orderId,
            type: stored?.type,
            itemId: stored?.itemId,
            amount: stored?.amount,
          });
        } catch (err) {
          console.error("complete-success error:", err);
        }
        sessionStorage.removeItem(SESSION_KEY);
      }

      if (paymentStatus === "cancel" && stored?.orderId) {
        // Card declined / cancelled → save as "pending" so user can retry
        try {
          await api.post("/payments/mark-cancelled", {
            orderId: stored.orderId,
            type: stored.type,
            itemId: stored.itemId,
            amount: stored.amount,
          });
        } catch (err) {
          console.error("mark-cancelled error:", err);
        }
        sessionStorage.removeItem(SESSION_KEY);
      }

      await loadData();
    };
    init();
  }, [paymentStatus, orderId]);

  // ---- Submit PayHere form after React flushes it to DOM ----
  useEffect(() => {
    if (payhereFields && checkoutUrl && payhereFormRef.current) {
      const timer = setTimeout(() => {
        payhereFormRef.current?.submit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [payhereFields, checkoutUrl]);

  // ---- Get payment status for an event (paid takes priority over pending) ----
  const getEventPaymentStatus = (eventId) => {
    const id = eventId.toString();
    const matches = myPayments.filter(
      (p) =>
        p.item?._id?.toString() === id ||
        p.item?.toString() === id
    );
    if (matches.some((p) => p.status === "paid")) return "paid";
    if (matches.some((p) => p.status === "pending")) return "pending";
    return null;
  };

  // ---- Initiate / retry event payment ----
  const handlePay = async (eventItem) => {
    setMessage("");
    setError("");
    setLoadingEventId(eventItem._id);

    try {
      const res = await api.post("/payments/checkout", {
        type: "event",
        itemId: eventItem._id,
      });

      if (!res.data.success || !res.data.payhere) {
        setError("Failed to get payment details. Please try again.");
        return;
      }

      // Store payment info BEFORE redirecting — needed if webhook doesn't fire (sandbox)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(res.data.paymentInfo));

      setMessage("Redirecting to PayHere payment gateway...");
      setCheckoutUrl(res.data.checkoutUrl);
      setPayhereFields(res.data.payhere);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Payment initiation failed."
      );
    } finally {
      setLoadingEventId(null);
    }
  };

  // ---- Event card action button ----
  const EventButton = ({ event }) => {
    const status = getEventPaymentStatus(event._id);
    const isLoading = loadingEventId === event._id;

    if (status === "paid") {
      return (
        <button
          disabled
          className="w-full mt-5 flex items-center justify-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl py-3.5 text-sm cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4" />
          Registered
        </button>
      );
    }

    if (status === "pending") {
      return (
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Payment incomplete — retry below to complete registration.
          </div>
          <button
            disabled={isLoading}
            onClick={() => handlePay(event)}
            className="w-full flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 font-bold rounded-xl py-3.5 text-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <><CreditCard className="w-4 h-4" /> Retry Payment</>
            )}
          </button>
        </div>
      );
    }

    return (
      <button
        disabled={isLoading}
        onClick={() => handlePay(event)}
        className="w-full mt-5 flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 text-black font-bold rounded-xl py-3.5 text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-gold/10"
      >
        {isLoading ? (
          <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          <><CreditCard className="w-4 h-4" /> Register &amp; Pay</>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">Events</h1>
          <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">
            View and register for upcoming Old Boys Association events.
          </p>
        </div>
        <button onClick={loadData} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white/60 hover:text-white" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loadingPage ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Status banners */}
      {paymentStatus === "success" && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/15 text-emerald-200 p-4 border border-emerald-500/20 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          Event registration payment completed successfully!
        </div>
      )}
      {paymentStatus === "cancel" && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/15 text-amber-200 p-4 border border-amber-500/20 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          Payment was canceled or declined. Your registration is saved as pending — use the <strong>Retry Payment</strong> button below.
        </div>
      )}
      {message && (
        <div className="rounded-xl bg-blue-500/15 text-blue-200 p-4 border border-blue-500/20 text-sm">{message}</div>
      )}
      {error && (
        <div className="rounded-xl bg-red-500/15 text-red-200 p-4 border border-red-500/20 text-sm">{error}</div>
      )}

      {/* Events grid */}
      {loadingPage ? (
        <div className="py-20 text-center text-white/50 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gold mb-3" />
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center text-white/40 border border-dashed border-white/10 rounded-3xl text-sm bg-white/5">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
          No upcoming events at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const status = getEventPaymentStatus(event._id);
            return (
              <div
                key={event._id}
                className={`rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col shadow-xl ${
                  status === "paid"   ? "bg-emerald-500/[0.03] border-emerald-500/20"
                  : status === "pending" ? "bg-amber-500/[0.03] border-amber-500/20"
                  : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10"
                }`}
              >
                {event.image && (
                  <img
                    src={`${import.meta.env.VITE_API_URL.replace("/api", "")}${event.image}`}
                    alt={event.title}
                    loading="lazy"
                    className="w-full h-48 object-cover border-b border-white/5"
                  />
                )}
                <div className="p-6 space-y-4 flex-1">
                  {status === "paid" && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Registered
                    </span>
                  )}
                  {status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Payment Pending
                    </span>
                  )}
                  <h3 className="text-xl sm:text-2xl font-black text-gold leading-tight">{event.title}</h3>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed">{event.description}</p>

                  <div className="bg-slate-950/30 border border-white/5 rounded-2xl p-4 space-y-2.5 text-xs sm:text-sm text-white/70">
                    <div className="flex justify-between items-center gap-2">
                      <span className="flex items-center gap-1.5 text-white/40"><Calendar className="w-3.5 h-3.5" /> Date</span>
                      <span className="font-semibold text-right">
                        {event.eventDate ? new Date(event.eventDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "TBA"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="flex items-center gap-1.5 text-white/40"><MapPin className="w-3.5 h-3.5" /> Location</span>
                      <span className="font-semibold text-right max-w-[150px] truncate" title={event.location}>{event.location || "TBA"}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2 border-t border-white/5 pt-2.5">
                      <span className="flex items-center gap-1.5 text-white/40"><CreditCard className="w-3.5 h-3.5" /> Fee</span>
                      <span className="font-black text-white">LKR {(event.fee || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <EventButton event={event} />
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden PayHere form */}
      {payhereFields && checkoutUrl && (
        <form ref={payhereFormRef} action={checkoutUrl} method="POST" className="hidden">
          {Object.entries(payhereFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        </form>
      )}
    </div>
  );
}