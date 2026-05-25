import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useSocket } from "../../context/SocketContext";
import api from "../../api/axios";
import {
  LayoutDashboard,
  HeartHandshake,
  Award,
  Calendar,
  FileText,
  Bell,
  LogOut,
  Users,
  RefreshCw,
  User
} from "lucide-react";

export default function MemberLayout() {
  const { logout } = useAuth();
  const { liveNotification } = useSocket();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const links = [
    { href: "/member", label: "Home", icon: LayoutDashboard },
    { href: "/member/directory", label: "Members", icon: Users },
    { href: "/member/campaigns", label: "Campaigns", icon: HeartHandshake },
    { href: "/member/badges", label: "Badges", icon: Award },
    { href: "/member/events", label: "Events", icon: Calendar },
    { href: "/member/reports", label: "Reports", icon: FileText },
    { href: "/member/profile", label: "Profile", icon: User }
  ];

  // ================= FETCH NOTIFICATIONS =================
  const fetchNotifs = async () => {
    try {
      setNotifLoading(true);
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setNotifLoading(false);
    }
  };

  // ================= FETCH UNREAD COUNT =================
  const fetchUnread = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  // initial load
  useEffect(() => {
    fetchUnread();
  }, []);

  // open dropdown
  useEffect(() => {
    if (isNotifOpen) fetchNotifs();
  }, [isNotifOpen]);

  // live socket updates
  useEffect(() => {
    if (!liveNotification) return;

    setUnreadCount((prev) => prev + 1);

    setNotifications((prev) => [
      {
        _id: Date.now(),
        title: liveNotification.title,
        message: liveNotification.message,
        createdAt: new Date()
      },
      ...prev
    ]);
  }, [liveNotification]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-72 bg-emerald-950 border-r border-white/5 h-screen sticky top-0 p-6 justify-between shrink-0">

        <div className="space-y-8">
          <Link to="/member" className="flex items-center gap-2">
            <span className="text-2xl font-black text-gold tracking-wider">
              OBAMS OBA
            </span>
          </Link>

          <nav className="space-y-1.5">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = location.pathname === href;

              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-gold text-black font-bold shadow-lg"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3 rounded-xl"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col relative bg-slate-900 pb-20 md:pb-0">

        {/* ================= DESKTOP HEADER ================= */}
        <header className="hidden md:flex items-center justify-end gap-6 p-4 border-b border-white/10">

          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl bg-white/5"
          >
            <Bell className="w-5 h-5" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="text-right">
            <p className="text-sm font-bold">Member Space</p>
            <p className="text-xs text-white/40">Dharmaraja College OBA</p>
          </div>
        </header>

        {/* ================= MOBILE HEADER ================= */}
        <header className="md:hidden sticky top-0 z-40 bg-emerald-950/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">

          <Link to="/member">
            <span className="text-xl font-black text-gold">OBAMS OBA</span>
          </Link>

          <div className="flex items-center gap-3">

            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-full hover:bg-white/10"
            >
              <Bell className="w-5 h-5 text-white/70" />

              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-full text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ================= LIVE BANNER ================= */}
        {liveNotification && (
          <div className="mx-6 mt-4 p-3 bg-gold text-black font-bold rounded-xl">
            🔔 {liveNotification.title}: {liveNotification.message}
          </div>
        )}

        {/* ================= NOTIFICATION DROPDOWN ================= */}
        {isNotifOpen && (
          <div className="absolute right-4 top-16 w-[340px] bg-slate-900 border border-white/10 rounded-2xl z-50 shadow-2xl">

            <div className="p-3 border-b text-gold font-bold">
              Notifications
            </div>

            <div className="max-h-80 overflow-y-auto">

              {notifLoading ? (
                <div className="p-3 flex items-center gap-2 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <p className="p-3 text-xs text-white/50">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className="p-3 border-b border-white/5 hover:bg-white/5"
                  >
                    <p className="font-bold text-sm">{n.title}</p>
                    <p className="text-xs text-white/60">{n.message}</p>
                    <p className="text-[10px] text-white/30">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 px-5 py-6 md:p-10 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>

        {/* ================= MOBILE BOTTOM NAV ================= */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-emerald-950 border-t border-white/10 flex justify-around py-3">

          {links.map(({ href, label, icon: Icon }) => {
            const isActive = location.pathname === href;

            return (
              <Link
                key={href}
                to={href}
                className={`flex flex-col items-center text-[10px] ${
                  isActive ? "text-gold" : "text-white/60"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
  );
}