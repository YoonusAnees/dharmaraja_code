import { Bell } from "lucide-react";
import { useState } from "react";
import api from "../api/axios";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);

    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        setUnreadCount, // 👈 IMPORTANT (add this in hook)
    } = useNotifications();

    // ================= OPEN TOGGLE =================
    const toggle = async () => {
        const newState = !open;
        setOpen(newState);

        if (newState) {
            await fetchNotifications();

            // 🔥 MARK AS READ WHEN OPENING
            try {
                await api.post("/notifications/mark-read");

                // instantly reset UI badge
                setUnreadCount(0);
            } catch (err) {
                console.error("mark read failed", err);
            }
        }
    };

    return (
        <div className="relative">

            {/* ================= BELL ================= */}
            <button onClick={toggle} className="relative">
                <Bell className="w-6 h-6 text-white" />

                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* ================= DROPDOWN ================= */}
            {open && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-white/10 rounded-xl shadow-lg z-50">

                    <div className="p-3 border-b border-white/10 text-gold font-bold text-sm">
                        Notifications
                    </div>

                    <div className="max-h-80 overflow-y-auto">

                        {loading ? (
                            <p className="p-3 text-xs text-white/50">Loading...</p>
                        ) : notifications.length === 0 ? (
                            <p className="p-3 text-xs text-white/40">No notifications</p>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    className="p-3 border-b border-white/5 hover:bg-white/5"
                                >
                                    <p className="text-sm font-semibold text-white">
                                        {n.title}
                                    </p>
                                    <p className="text-xs text-white/60">{n.message}</p>
                                    <p className="text-[10px] text-white/30 mt-1">
                                        {new Date(n.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}