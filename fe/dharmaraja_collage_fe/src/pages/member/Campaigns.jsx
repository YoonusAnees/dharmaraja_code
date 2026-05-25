import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";

export default function Campaigns() {
  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [payhereData, setPayhereData] = useState(null);
  const [loading, setLoading] = useState(false);
  const payhereFormRef = useRef(null);

  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");
  const paymentMessage = paymentStatus === "success"
    ? "Payment completed successfully. Campaign progress was updated."
    : paymentStatus === "cancel"
    ? "Payment canceled. Please try again."
    : "";

  const loadCampaigns = async () => {
    const res = await api.get("/campaigns");
    setCampaigns(res.data.campaigns || []);
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
      await loadCampaigns();
    };
    load();
  }, [paymentStatus, orderId]);

  useEffect(() => {
    if (payhereData && payhereFormRef.current) {
      payhereFormRef.current.submit();
    }
  }, [payhereData]);

  const donateHandler = async (e) => {
    e.preventDefault();

    if (!selectedCampaign) return;

    const finalAmount =
      selectedCampaign.campaignType === "fixed"
        ? selectedCampaign.fixedAmount
        : amount;

    if (!finalAmount || Number(finalAmount) <= 0) {
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">Campaigns</h1>
        <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">
          Donate to fixed, open contribution or event campaigns.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map((campaign) => {
          const percentage =
            campaign.targetAmount > 0
              ? Math.min(
                  100,
                  Math.round(
                    (campaign.collectedAmount / campaign.targetAmount) * 100
                  )
                )
              : 0;

          return (
            <div
              key={campaign._id}
              className="rounded-3xl bg-white/10 border border-white/10 p-6"
            >
              <span className="text-xs uppercase tracking-widest text-gold">
                {campaign.campaignType}
              </span>

              <h3 className="text-2xl font-bold mt-3">{campaign.name}</h3>

              <p className="text-white/60 mt-3">
                {campaign.description}
              </p>

              <div className="mt-5">
                <div className="flex justify-between text-sm text-white/60">
                  <span>Rs. {campaign.collectedAmount}</span>
                  <span>Rs. {campaign.targetAmount}</span>
                </div>

                <div className="h-3 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <p className="text-sm mt-2 text-white/60">
                  {percentage}% funded
                </p>
              </div>

              <button
                onClick={() => setSelectedCampaign(campaign)}
                className="w-full mt-6 bg-gold text-black font-bold rounded-xl py-3"
              >
                Donate Now
              </button>
            </div>
          );
        })}
      </div>

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
                <span className="text-xl font-black text-white mt-1 block">Rs. {selectedCampaign.fixedAmount.toLocaleString()}</span>
              </div>
            ) : (
              <div>
                <label className="text-xs text-white/50 font-bold uppercase tracking-wider block mb-2">Donation Amount (LKR)</label>
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

            <div className="flex gap-3 pt-2">
              <button 
                disabled={loading} 
                className="flex-grow bg-gold hover:bg-gold-hover text-black font-bold rounded-xl py-3.5 text-sm transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-gold/10"
              >
                {loading ? "Processing..." : "Confirm Donation"}
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