import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useSocket } from "../../context/SocketContext";
import NotificationBell from "../NotificationBell";
import {
  LayoutDashboard,
  HeartHandshake,
  Award,
  Calendar,
  FileText,
  Bell,
  LogOut,
  Users,
  User,
} from "lucide-react";

export default function MemberLayout() {
  const { logout } = useAuth();
  const { liveNotification } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { href: "/member", label: "Home", icon: LayoutDashboard },
    { href: "/member/directory", label: "Members", icon: Users },
    { href: "/member/campaigns", label: "Campaigns", icon: HeartHandshake },
    { href: "/member/badges", label: "Badges", icon: Award },
    { href: "/member/events", label: "Events", icon: Calendar },
    { href: "/member/reports", label: "Reports", icon: FileText },
    { href: "/member/profile", label: "Profile", icon: User },
  ];

  const { user } = useAuth();


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-72 bg-emerald-950 border-r border-white/5 h-screen sticky top-0 p-6 justify-between shrink-0">

        <div className="space-y-8">
          <Link to="/member" className="flex items-center gap-2">
            <span className="text-2xl font-black text-gold tracking-wider">OBAMS OBA</span>
          </Link>

          <nav className="space-y-1.5">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = location.pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all ${isActive
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
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3 rounded-xl cursor-pointer transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col bg-slate-900 pb-20 md:pb-0">

        {/* ================= DESKTOP HEADER ================= */}
        <header className="hidden md:flex items-center justify-end gap-4 px-6 py-4 border-b border-white/10">
          {/* NotificationBell handles all fetch, mark-as-read, count, dropdown */}
          <NotificationBell />

          <div className="text-right">
            <p className="text-sm font-bold">Hi! {user?.fullName}</p>
            <p className="text-xs text-white/40">Dharmaraja College OBA</p>
          </div>
        </header>

        {/* ================= MOBILE HEADER ================= */}
        <header className="md:hidden sticky top-0 z-40 bg-emerald-950/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <Link to="/member">
            <span className="text-xl font-black text-gold">OBAMS OBA</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Same NotificationBell component — works on mobile too */}
            <NotificationBell />

            <button
              onClick={logout}
              className="p-2 rounded-full text-red-400 hover:bg-red-500/20 cursor-pointer transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ================= LIVE NOTIFICATION BANNER ================= */}
        {liveNotification && (
          <div
            onClick={() => navigate("/member/notifications")}
            className="mx-6 mt-4 p-3 bg-gold text-black font-bold rounded-xl cursor-pointer hover:bg-yellow-400 transition-colors flex items-center gap-2"
          >
            <Bell className="w-4 h-4 shrink-0" />
            {liveNotification.title}: {liveNotification.message}
          </div>
        )}

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 px-5 py-6 md:p-10 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>

        {/* ================= MOBILE BOTTOM NAV ================= */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-emerald-950 border-t border-white/10 flex justify-around py-3 z-40">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={`flex flex-col items-center text-[10px] gap-0.5 ${isActive ? "text-gold" : "text-white/60"
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