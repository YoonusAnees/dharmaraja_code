import { useEffect, useState } from "react";
import StatCard from "../../components/common/StatCard";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";
import { 
  HeartHandshake, 
  Award, 
  Calendar, 
  UserCheck, 
  CreditCard, 
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Megaphone
} from "lucide-react";

export default function MemberDashboard() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/payments/my-payments");
      setPayments(res.data.payments || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // ===================== STATS =====================
  const totalDonationsAmount = payments
    .filter((p) => p.type === "donation" && p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalBadges = payments.filter((p) => p.type === "badge" && p.status === "paid").length;
  const totalEvents = payments.filter((p) => p.type === "event" && p.status === "paid").length;

  // ===================== GROUP PAYMENTS BY TYPE =====================
  const registrationPayments = payments.filter((p) => p.type === "registration");
  const donationPayments = payments.filter((p) => p.type === "donation");
  const eventPayments = payments.filter((p) => p.type === "event");
  const badgePayments = payments.filter((p) => p.type === "badge");

  // ===================== STYLES =====================
  const getPaymentTypeStyles = (type) => {
    switch (type) {
      case "registration":
        return { icon: UserCheck, label: "Registration Fee", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
      case "donation":
        return { icon: HeartHandshake, label: "Donation", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "badge":
        return { icon: Award, label: "Badge Purchase", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      case "event":
        return { icon: Calendar, label: "Event Registration", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      default:
        return { icon: CreditCard, label: "Payment", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" };
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "paid":
        return { icon: CheckCircle2, label: "Paid", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
      case "pending":
        return { icon: Clock, label: "Pending", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
      default:
        return { icon: XCircle, label: "Failed", badge: "bg-red-500/20 text-red-300 border-red-500/30" };
    }
  };

  // ===================== PAYMENT CARD =====================
  const PaymentCard = ({ payment }) => {
    const typeStyle = getPaymentTypeStyles(payment.type);
    const statusStyle = getStatusStyles(payment.status);
    const TypeIcon = typeStyle.icon;
    const StatusIcon = statusStyle.icon;

    // For donations, show the campaign name if available
    const subtitle = payment.type === "donation" && payment.item?.name
      ? `Campaign: ${payment.item.name}`
      : payment.type === "event" && payment.item?.title
      ? `Event: ${payment.item.title}`
      : payment.type === "badge" && payment.item?.name
      ? `Badge: ${payment.item.name}`
      : null;

    return (
      <div 
        className="rounded-2xl bg-white/5 border border-white/5 p-3.5 flex justify-between items-center hover:border-white/10 hover:bg-white/10 hover:scale-[1.01] transition-all shadow-md"
      >
        <div className="flex items-center gap-3">
          {/* Payment Type Icon */}
          <div className={`p-2 sm:p-2.5 rounded-xl border ${typeStyle.color} shrink-0`}>
            <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          {/* Details */}
          <div className="min-w-0">
            <h4 className="font-bold text-white text-xs sm:text-sm truncate">
              {typeStyle.label}
            </h4>
            {subtitle && (
              <p className="text-white/40 text-[10px] sm:text-xs truncate max-w-[160px]">{subtitle}</p>
            )}
            <p className="text-white/40 text-[10px] sm:text-xs mt-0.5 font-medium">
              {payment.createdAt 
                ? new Date(payment.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
                : "N/A"
              }
            </p>
          </div>
        </div>

        {/* Pricing and Status */}
        <div className="text-right space-y-1.5 shrink-0 pl-2">
          <div className="font-black text-white text-xs sm:text-sm md:text-base">
            LKR {payment.amount.toLocaleString()}
          </div>
          
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-bold tracking-wide uppercase ${statusStyle.badge}`}>
            <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {statusStyle.label}
          </span>
        </div>
      </div>
    );
  };

  // ===================== SECTION =====================
  const PaymentSection = ({ title, icon: Icon, iconColor, items }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${iconColor}`}>
          <Icon className="w-3.5 h-3.5" />
          {title}
          <span className="ml-auto text-white/20 font-normal normal-case tracking-normal">
            {items.length} record{items.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid gap-2">
          {items.map((payment) => (
            <PaymentCard key={payment._id} payment={payment} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Heading */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-gold tracking-wide animate-fade-in">
          Welcome, {user?.fullName}
        </h1>
        <p className="text-white/60 text-xs sm:text-sm font-medium">
          Dharmaraja College Old Boys Association Member Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard title="Donated" value={`Rs. ${totalDonationsAmount.toLocaleString()}`} />
        <StatCard title="Badges" value={totalBadges.toString()} />
        <StatCard title="Events" value={totalEvents.toString()} />
      </div>

      {/* Account Info Box */}
      <div className="rounded-2xl bg-white/5 border border-white/5 p-4 sm:p-5 space-y-4 hover:border-white/10 transition-all shadow-lg">
        <h2 className="text-base sm:text-lg font-bold text-gold flex items-center gap-2">
          <UserCheck className="w-5 h-5" /> Account Details
        </h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs sm:text-sm text-white/70">
          <div className="bg-slate-950/20 p-2.5 rounded-xl border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">Role</span>
            <span className="font-semibold text-white capitalize">{user?.role}</span>
          </div>
          <div className="bg-slate-950/20 p-2.5 rounded-xl border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">Status</span>
            <span className="font-semibold text-white capitalize">{user?.status}</span>
          </div>
          {user?.batchYear && (
            <div className="bg-slate-950/20 p-2.5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">Batch Year</span>
              <span className="font-semibold text-white">{user?.batchYear}</span>
            </div>
          )}
          {user?.branch && (
            <div className="bg-slate-950/20 p-2.5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">Branch</span>
              <span className="font-semibold text-white">{user?.branch}</span>
            </div>
          )}
          
            <div className="bg-slate-950/20 p-2.5 rounded-xl border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">Job Role</span>
            <span className="font-semibold text-white capitalize">{user?.jobTitle}</span>
          </div>

            <div className="bg-slate-950/20 p-2.5 rounded-xl border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">NIC</span>
            <span className="font-semibold text-white capitalize">{user?.nic}</span>
          </div>

            <div className="bg-slate-950/20 p-2.5 rounded-xl border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">Address</span>
            <span className="font-semibold text-white capitalize">{user?.address}</span>
          </div>
         
        </div>
      </div>

      {/* Purchase History Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">My Payment History</h2>
          <button 
            onClick={fetchPayments} 
            className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white/60 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-200 border border-red-500/30 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading && payments.length === 0 ? (
          <div className="py-12 text-center text-white/50 text-sm">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gold mb-2" />
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl text-sm bg-white/5">
            No payments or purchases found.
          </div>
        ) : (
          <div className="space-y-5">

            {/* Registration */}
            <PaymentSection
              title="Registration Fee"
              icon={UserCheck}
              iconColor="text-blue-400"
              items={registrationPayments}
            />

            {/* Donations to Campaigns */}
            <PaymentSection
              title="Campaign Donations"
              icon={HeartHandshake}
              iconColor="text-emerald-400"
              items={donationPayments}
            />

            {/* Event Registrations */}
            <PaymentSection
              title="Event Registrations"
              icon={Calendar}
              iconColor="text-purple-400"
              items={eventPayments}
            />

            {/* Badge Purchases */}
            <PaymentSection
              title="Badge Purchases"
              icon={Award}
              iconColor="text-amber-400"
              items={badgePayments}
            />

          </div>
        )}
      </div>
    </div>
  );
}