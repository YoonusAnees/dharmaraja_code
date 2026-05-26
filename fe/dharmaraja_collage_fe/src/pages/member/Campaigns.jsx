import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import { HeartHandshake, RefreshCw, CheckCircle, AlertCircle, Trophy } from "lucide-react";


const SESSION_KEY = "payhere_campaign_info";

export default function Campaigns() {
  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // PayHere form state
  const [payhereFields, setPayhereFields] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const payhereFormRef = useRef(null);

  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");

  // ---- Load campaigns ----
  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const res = await api.get("/campaigns");
      setCampaigns(res.data.campaigns || []);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // ---- On mount: handle payment return + load campaigns ----
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

      await loadCampaigns();
    };
    init();
  }, [paymentStatus, orderId]);

  // ---- Submit PayHere form once fields are ready ----
  useEffect(() => {
    if (payhereFields && checkoutUrl && payhereFormRef.current) {
      // Small timeout to ensure React has flushed the hidden form to the DOM
      const timer = setTimeout(() => {
        payhereFormRef.current?.submit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [payhereFields, checkoutUrl]);

  // ---- Donate handler ----
  const donateHandler = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    const finalAmount =
      selectedCampaign.campaignType === "fixed"
        ? selectedCampaign.fixedAmount
        : Number(amount);

    if (!finalAmount || finalAmount <= 0) {
      setError("Please enter a valid donation amount.");
      return;
    }

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/payments/checkout", {
        type: "donation",
        itemId: selectedCampaign._id,
        amount: finalAmount,
      });

      if (!res.data.success || !res.data.payhere) {
        setError("Failed to get payment details. Please try again.");
        return;
      }

      // Store payment info BEFORE redirecting (needed for sandbox return URL fallback)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(res.data.paymentInfo));

      setMessage("Redirecting to PayHere payment gateway...");
      setSelectedCampaign(null);
      setCheckoutUrl(res.data.checkoutUrl);
      setPayhereFields(res.data.payhere);

    } catch (err) {
      setError(err.response?.data?.message || err.message || "Payment initiation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">
            Campaigns
          </h1>
          <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">
            Donate to fixed or open contribution campaigns.
          </p>
        </div>
        <button
          onClick={loadCampaigns}
          className="p-2.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white/60 hover:text-white"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loadingCampaigns ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Payment return messages */}
      {paymentStatus === "success" && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/15 text-emerald-200 p-4 border border-emerald-500/20 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          Payment completed successfully! Campaign progress has been updated.
        </div>
      )}
      {paymentStatus === "cancel" && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/15 text-amber-200 p-4 border border-amber-500/20 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          Payment was canceled or declined. You can try donating again anytime.
        </div>
      )}

      {/* General messages */}
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

      {/* Campaigns grid */}
      {loadingCampaigns ? (
        <div className="py-20 text-center text-white/50 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gold mb-2" />
          Loading campaigns...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-16 text-center text-white/40 border border-dashed border-white/10 rounded-3xl text-sm bg-white/5">
          No active campaigns at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((campaign) => {
            const percentage =
              campaign.targetAmount > 0
                ? Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100))
                : 0;

            const isCompleted =
              campaign.status === "completed" ||
              (campaign.targetAmount > 0 && campaign.collectedAmount >= campaign.targetAmount);

            return (
              <div
                key={campaign._id}
                className={`rounded-3xl border p-6 transition-all duration-300 space-y-4 flex flex-col ${
                  isCompleted
                    ? "bg-emerald-500/[0.04] border-emerald-500/25"
                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div>
                  {/* Completed banner */}
                  {isCompleted && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-bold">
                      <Trophy className="w-4 h-4 shrink-0" />
                      Goal Reached! This campaign has been fully funded.
                    </div>
                  )}
                  <span className="text-xs uppercase tracking-widest text-gold font-bold">
                    {campaign.campaignType}
                  </span>
                  <h3 className="text-xl font-bold mt-2 text-white">{campaign.name}</h3>
                  <p className="text-white/60 mt-2 text-sm leading-relaxed">
                    {campaign.description}
                  </p>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-white/50 font-medium">
                    <span>Rs. {campaign.collectedAmount.toLocaleString()} raised</span>
                    <span>Goal: Rs. {campaign.targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? "bg-emerald-400" : "bg-gold"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className={`text-xs ${isCompleted ? "text-emerald-400 font-semibold" : "text-white/40"}`}>
                    {isCompleted ? `✓ 100% funded — Goal reached!` : `${percentage}% funded`}
                  </p>
                </div>

                {/* Donate button — disabled when completed */}
                {isCompleted ? (
                  <button
                    disabled
                    className="mt-auto w-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold rounded-xl py-3 text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Goal Reached
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setAmount("");
                      setError("");
                      setMessage("");
                    }}
                    className="mt-auto w-full bg-gold hover:bg-yellow-400 text-black font-bold rounded-xl py-3 text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    Donate Now
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Donate Modal ===== */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/80 grid place-items-center p-4 z-50 backdrop-blur-sm">
          <form
            onSubmit={donateHandler}
            className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 p-6 space-y-5 shadow-2xl"
          >
            <div>
              <h2 className="text-xl font-black text-gold">
                Donate to {selectedCampaign.name}
              </h2>
              <p className="text-white/40 text-xs mt-1 font-medium capitalize">
                Campaign type: {selectedCampaign.campaignType}
              </p>
            </div>

            {selectedCampaign.campaignType === "fixed" ? (
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                <span className="text-xs text-white/40 block uppercase tracking-wider font-semibold">Fixed Amount</span>
                <span className="text-2xl font-black text-white mt-1 block">
                  Rs. {selectedCampaign.fixedAmount.toLocaleString()}
                </span>
              </div>
            ) : (
              <div>
                <label className="text-xs text-white/50 font-bold uppercase tracking-wider block mb-2">
                  Donation Amount (LKR)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-gold transition-colors text-sm font-semibold"
                  placeholder="Enter donation amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs font-medium">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-grow bg-gold hover:bg-yellow-400 text-black font-bold rounded-xl py-3.5 text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-gold/10 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <HeartHandshake className="w-4 h-4" />
                    Confirm Donation
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="flex-grow bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl py-3.5 text-sm border border-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== Hidden PayHere Form (submits automatically) ===== */}
      {payhereFields && checkoutUrl && (
        <form
          ref={payhereFormRef}
          action={checkoutUrl}
          method="POST"
          className="hidden"
        >
          {Object.entries(payhereFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        </form>
      )}
    </div>
  );
}