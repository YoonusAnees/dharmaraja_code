import { Bell, CheckCheck, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markOneAsRead,
        markAllRead,
    } = useNotifications();

    // ---- Close dropdown when clicking outside ----
    useEffect(() => {
        const handleOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [open]);

    // ---- Toggle open / close ----
    const toggle = async () => {
        const next = !open;
        setOpen(next);
        if (next) await fetchNotifications();
    };

    // ---- Is this notification unread for the current user? ----
    const isUnread = (n) => {
        if (n._localRead) return false;
        if (!n.readBy || n.readBy.length === 0) return true;
        if (!user?._id) return true;
        return !n.readBy.some((id) => id?.toString() === user._id.toString());
    };

    // ---- Click notification row → navigate to full notifications page ----
    const handleRowClick = (n) => {
        // Mark as read optimistically
        if (isUnread(n)) markOneAsRead(n._id);
        setOpen(false);
        navigate("/member/notifications");
    };

    // ---- Mark single via button (don't navigate) ----
    const handleMarkOne = (e, n) => {
        e.stopPropagation();
        if (isUnread(n)) markOneAsRead(n._id);
    };

    return (
        <div className="relative" ref={dropdownRef}>

            {/* ===== BELL ===== */}
            <button onClick={toggle} className="relative p-1 hover:opacity-80 transition-opacity">
                <Bell className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* ===== DROPDOWN ===== */}
            {open && (
                <div className="absolute right-0 mt-3 w-80 sm:w-[22rem] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">

                    {/* Header */}
                    <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/[0.03]">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-gold" />
                            <span className="text-white font-bold text-sm">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold">
                                    {unreadCount} unread
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-1 text-[10px] text-white/50 hover:text-emerald-400 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-500/10 cursor-pointer border border-white/5 hover:border-emerald-500/20"
                            >
                                <CheckCheck className="w-3 h-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List — max 5 items, click goes to full page */}
                    <div className="max-h-[22rem] overflow-y-auto divide-y divide-white/5">
                        {loading ? (
                            <div className="p-6 text-center text-xs text-white/40">
                                <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-2" />
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-white/30">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                No notifications yet
                            </div>
                        ) : (
                            notifications.slice(0, 5).map((n) => {
                                const unread = isUnread(n);
                                return (
                                    <div
                                        key={n._id}
                                        onClick={() => handleRowClick(n)}
                                        className={`px-4 py-3.5 cursor-pointer transition-all duration-150 ${
                                            unread
                                                ? "border-l-[3px] border-l-gold bg-gold/[0.04] hover:bg-gold/[0.08]"
                                                : "border-l-[3px] border-l-transparent hover:bg-white/5"
                                        }`}
                                    >
                                        {/* Row: dot + content + mark-read button */}
                                        <div className="flex items-start gap-2.5">
                                            <span className={`shrink-0 block w-2 h-2 rounded-full mt-1.5 ${
                                                unread ? "bg-gold animate-pulse" : "bg-white/15"
                                            }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold leading-snug ${
                                                    unread ? "text-white" : "text-white/50"
                                                }`}>
                                                    {n.title}
                                                </p>
                                                <p className="text-xs text-white/40 mt-0.5 leading-relaxed line-clamp-2">
                                                    {n.message}
                                                </p>
                                                <p className="text-[10px] text-white/25 mt-1">
                                                    {new Date(n.createdAt).toLocaleString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>

                                            {/* Inline mark-as-read ✓ button */}
                                            {unread && (
                                                <button
                                                    onClick={(e) => handleMarkOne(e, n)}
                                                    title="Mark as read"
                                                    className="shrink-0 mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 transition-all cursor-pointer"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer → View all */}
                    {notifications.length > 0 && (
                        <button
                            onClick={() => { setOpen(false); navigate("/member/notifications"); }}
                            className="w-full px-4 py-3 border-t border-white/5 text-center text-xs text-white/40 hover:text-gold hover:bg-white/5 transition-all font-semibold cursor-pointer"
                        >
                            View all notifications →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}