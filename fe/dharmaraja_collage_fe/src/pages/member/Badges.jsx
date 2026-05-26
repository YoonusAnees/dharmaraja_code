import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import {
  Award,
  CheckCircle,
  Clock,
  RefreshCw,
  CreditCard,
  AlertCircle,
  CalendarClock,
  ShieldCheck,
} from "lucide-react";

const SESSION_KEY = "payhere_badge_info";

export default function Badges() {
  const [searchParams] = useSearchParams();
  const [badges, setBadges] = useState([]);
  const [badgeHistory, setBadgeHistory] = useState([]); // user's purchased badges
  const [myPayments, setMyPayments] = useState([]); // pending payment records
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingBadgeId, setLoadingBadgeId] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const [payhereFields, setPayhereFields] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const payhereFormRef = useRef(null);

  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");

  // ── Load all data in parallel ────────────────────────────────────────────
  const loadData = async () => {
    try {
      setLoadingPage(true);
      const [badgesRes, historyRes, paymentsRes] = await Promise.all([
        api.get("/badges"),
        api.get("/badges/my-history"),
        api.get("/payments/my-payments"),
      ]);
      setBadges(badgesRes.data.badges || []);
      setBadgeHistory(historyRes.data.badgeHistory || []);
      setMyPayments(
        (paymentsRes.data.payments || []).filter((p) => p.type === "badge")
      );
    } catch (err) {
      console.error("Failed to load badges:", err);
    } finally {
      setLoadingPage(false);
    }
  };

  // ── Handle PayHere return URL ────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      let stored = null;
      try {
        stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      } catch (_) {}

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

  // ── Submit PayHere form after React flushes DOM ─────────────────────────
  useEffect(() => {
    if (payhereFields && checkoutUrl && payhereFormRef.current) {
      const timer = setTimeout(() => payhereFormRef.current?.submit(), 100);
      return () => clearTimeout(timer);
    }
  }, [payhereFields, checkoutUrl]);

  // ── Determine badge status for a given badgeId ───────────────────────────
  // Returns: { status: "active"|"expired"|"pending"|null, expiresAt, purchasedAt }
  const getBadgeStatus = (badgeId) => {
    const id = badgeId.toString();
    const now = new Date();

    // Check badge history (active or expired ownership)
    const owned = badgeHistory
      .filter((h) => h.badge?._id?.toString() === id || h.badge?.toString() === id)
      .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt)); // newest first

    if (owned.length > 0) {
      const latest = owned[0];
      const isExpired = latest.expiresAt && new Date(latest.expiresAt) <= now;
      return {
        status: isExpired ? "expired" : "active",
        expiresAt: latest.expiresAt,
        purchasedAt: latest.purchasedAt,
      };
    }

    // Check pending payment records
    const pendingPayment = myPayments.find(
      (p) =>
        (p.item?._id?.toString() === id || p.item?.toString() === id) &&
        p.status === "pending"
    );
    if (pendingPayment) return { status: "pending" };

    return { status: null };
  };

  // ── Initiate purchase ────────────────────────────────────────────────────
  const handlePurchase = async (badge) => {
    setMessage("");
    setError("");
    setLoadingBadgeId(badge._id);

    try {
      const res = await api.post("/payments/checkout", {
        type: "badge",
        itemId: badge._id,
      });

      if (!res.data.success || !res.data.payhere) {
        setError("Failed to get payment details. Please try again.");
        return;
      }

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(res.data.paymentInfo));
      setMessage("Redirecting to PayHere...");
      setCheckoutUrl(res.data.checkoutUrl);
      setPayhereFields(res.data.payhere);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Payment failed.");
    } finally {
      setLoadingBadgeId(null);
    }
  };

  // ── Format date helper ───────────────────────────────────────────────────
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  // ── Badge card action button ─────────────────────────────────────────────
  const BadgeButton = ({ badge }) => {
    const { status, expiresAt } = getBadgeStatus(badge._id);
    const isLoading = loadingBadgeId === badge._id;

    if (status === "active") {
      return (
        <button
          disabled
          className="w-full mt-5 flex items-center justify-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl py-3.5 text-sm cursor-not-allowed"
        >
          <ShieldCheck className="w-4 h-4" />
          Active Badge
        </button>
      );
    }

    if (status === "expired") {
      return (
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <CalendarClock className="w-3.5 h-3.5 shrink-0" />
            Expired on {fmtDate(expiresAt)} — renew now.
          </div>
          <button
            disabled={isLoading}
            onClick={() => handlePurchase(badge)}
            className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 text-black font-bold rounded-xl py-3.5 text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-gold/10"
          >
            {isLoading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <><CreditCard className="w-4 h-4" /> Renew Badge</>
            )}
          </button>
        </div>
      );
    }

    if (status === "pending") {
      return (
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Payment incomplete — retry below.
          </div>
          <button
            disabled={isLoading}
            onClick={() => handlePurchase(badge)}
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

    // Not owned — fresh purchase
    return (
      <button
        disabled={isLoading}
        onClick={() => handlePurchase(badge)}
        className="w-full mt-5 flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 text-black font-bold rounded-xl py-3.5 text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-gold/10"
      >
        {isLoading ? (
          <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          <><Award className="w-4 h-4" /> Purchase Badge</>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">
            Membership Badges
          </h1>
          <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">
            Purchase badges to unlock OBA benefits. Each badge is valid for its stated duration.
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white/60 hover:text-white"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loadingPage ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Status banners */}
      {paymentStatus === "success" && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/15 text-emerald-200 p-4 border border-emerald-500/20 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          Badge purchased successfully! Your membership has been upgraded.
        </div>
      )}
      {paymentStatus === "cancel" && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/15 text-amber-200 p-4 border border-amber-500/20 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          Payment was canceled or declined. Use the <strong>Retry Payment</strong> button below.
        </div>
      )}
      {message && (
        <div className="rounded-xl bg-blue-500/15 text-blue-200 p-4 border border-blue-500/20 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-500/15 text-red-200 p-4 border border-red-500/20 text-sm">
          {error}
        </div>
      )}

      {/* Badges grid */}
      {loadingPage ? (
        <div className="py-20 text-center text-white/50 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gold mb-3" />
          Loading badges...
        </div>
      ) : badges.length === 0 ? (
        <div className="py-16 text-center text-white/40 border border-dashed border-white/10 rounded-3xl text-sm bg-white/5">
          <Award className="w-10 h-10 mx-auto mb-3 opacity-20" />
          No badges available at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => {
            const { status, expiresAt, purchasedAt } = getBadgeStatus(badge._id);
            return (
              <div
                key={badge._id}
                className={`rounded-3xl border p-6 transition-all duration-300 flex flex-col shadow-xl ${
                  status === "active"
                    ? "bg-emerald-500/[0.03] border-emerald-500/20"
                    : status === "expired"
                    ? "bg-red-500/[0.03] border-red-500/20"
                    : status === "pending"
                    ? "bg-amber-500/[0.03] border-amber-500/20"
                    : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="space-y-3 flex-1">
                  {/* Status pill */}
                  {status === "active" && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Active
                    </span>
                  )}
                  {status === "expired" && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                      <CalendarClock className="w-3 h-3" /> Expired
                    </span>
                  )}
                  {status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Payment Pending
                    </span>
                  )}

                  <h3 className="text-xl sm:text-2xl font-black text-gold leading-tight">
                    {badge.name}
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                    {badge.description}
                  </p>

                  {/* Price + duration */}
                  <div className="bg-slate-950/30 border border-white/5 rounded-2xl p-4 space-y-2 text-xs sm:text-sm text-white/70">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">Price</span>
                      <span className="font-black text-white text-lg">
                        LKR {badge.standardAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-2">
                      <span className="text-white/40">Duration</span>
                      <span className="font-semibold">
                        {badge.durationMonths > 0
                          ? `${badge.durationMonths} month${badge.durationMonths !== 1 ? "s" : ""}`
                          : "Lifetime"}
                      </span>
                    </div>
                    {status === "active" && expiresAt && (
                      <div className="flex justify-between items-center border-t border-white/5 pt-2">
                        <span className="text-white/40">Expires</span>
                        <span className="font-semibold text-emerald-400">{fmtDate(expiresAt)}</span>
                      </div>
                    )}
                    {status === "active" && !expiresAt && (
                      <div className="flex justify-between items-center border-t border-white/5 pt-2">
                        <span className="text-white/40">Valid</span>
                        <span className="font-semibold text-emerald-400">Lifetime ∞</span>
                      </div>
                    )}
                    {purchasedAt && (
                      <div className="flex justify-between items-center border-t border-white/5 pt-2">
                        <span className="text-white/40">Purchased</span>
                        <span className="font-semibold">{fmtDate(purchasedAt)}</span>
                      </div>
                    )}
                  </div>

                  {badge.benefits && (
                    <p className="text-white/50 text-xs leading-relaxed border-t border-white/5 pt-3">
                      🎁 <span className="font-semibold">Benefits:</span> {badge.benefits}
                    </p>
                  )}
                </div>

                <BadgeButton badge={badge} />
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