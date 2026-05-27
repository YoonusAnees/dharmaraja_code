import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useSocket } from "../../context/SocketContext";
import {
  LayoutDashboard,
  Award,
  HeartHandshake,
  Calendar,
  FileText,
  Bell,
  LogOut,
  BellRing
} from "lucide-react";
import image from "/dc_logo.png";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const { liveNotification } = useSocket();
  const location = useLocation();

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/badges", label: "Badges", icon: Award },
    { href: "/admin/campaigns", label: "Campaigns", icon: HeartHandshake },
    { href: "/admin/events", label: "Events", icon: Calendar },
    { href: "/admin/reports", label: "Reports", icon: FileText },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-72 bg-emerald-950 border-r border-white/5 h-screen sticky top-0 p-6 justify-between shrink-0">
        <div className="space-y-8">
          <Link to="/admin" className="flex items-center justify-center gap-2">
            <img src={image} alt="OBAMS OBA" className="w-30 h-30" />
          </Link>

          <nav className="space-y-1.5">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = location.pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all cursor-pointer ${isActive
                    ? "bg-gold text-black font-bold shadow-lg shadow-gold/20 scale-[1.02]"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-sm">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold rounded-xl py-3.5 border border-red-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </aside>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900 pb-20 md:pb-0">

        {/* DESKTOP HEADER */}
        <header className="hidden md:flex items-center justify-end gap-6 bg-slate-950/80 backdrop-blur border-b border-white/5 px-8 py-4.5 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-white">Administrator</p>
              <p className="text-xs text-white/40">OBAMS Control Panel</p>
            </div>
            <Link to="/admin/profile">
              {user?.profilePicture ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL.replace("/api", "")}${user.profilePicture}`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-gold shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center border-2 border-gold/50 text-gold font-bold shrink-0">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* MOBILE STICKY TOP HEADER */}
        <header className="sticky top-0 z-40 bg-emerald-950/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-md md:hidden">
          <Link to="/admin" className="flex items-center gap-2">
            <img src={image} alt="OBAMS OBA" className="w-12 h-12" />
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/admin/profile">
              {user?.profilePicture ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL.replace("/api", "")}${user.profilePicture}`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover border border-gold shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center border border-gold/50 text-gold font-bold shrink-0 text-xs">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
                </div>
              )}
            </Link>

            <button
            onClick={logout}
            className="p-2 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            title="Logout"
            >
              <LogOut className="w-5.5 h-5.5" />
            </button>
          </div>
        </header>

        {/* Scrollable Responsive Main Content */}
        <main className="flex-1 px-5 py-6 md:p-10 max-w-6xl w-full mx-auto">
          {liveNotification && (
            <div className="mb-6 rounded-2xl bg-gold text-black p-4 text-sm font-semibold shadow-lg animate-bounce flex items-center gap-2">
              <BellRing className="w-5 h-5" />
              <span>{liveNotification.title}: {liveNotification.message}</span>
            </div>
          )}
          <Outlet />
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-emerald-950/95 backdrop-blur border-t border-white/10 py-3 px-2 flex justify-around shadow-2xl rounded-t-3xl md:hidden">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${isActive
                  ? "text-gold scale-105 font-bold"
                  : "text-white/60 hover:text-white"
                  }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span className="text-[8.5px] tracking-tight font-semibold mt-0.5">{label}</span>
              </Link>
            );
          })}
        </nav>

      </div >
    </div >
  );
}