import { Bell, CheckCheck, Check, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useNotifications } from "../../hooks/useNotifications";

export default function MemberNotifications() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, fetchNotifications, markOneAsRead, markAllRead } =
    useNotifications();

  // ---- Is this notification unread for the current user? ----
  const isUnread = (n) => {
    if (n._localRead) return false;
    if (!n.readBy || n.readBy.length === 0) return true;
    if (!user?._id) return true;
    return !n.readBy.some((id) => id?.toString() === user._id.toString());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">
            Notifications
          </h1>
          <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">
            Campaign, event, and system announcements from the OBA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-xs font-bold transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white/60 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-bold">
          <Bell className="w-3.5 h-3.5" />
          {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
        </div>
      )}

      {/* Notification list */}
      {loading && notifications.length === 0 ? (
        <div className="py-20 text-center text-white/50 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gold mb-3" />
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-white/40 border border-dashed border-white/10 rounded-3xl text-sm bg-white/5">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const unread = isUnread(n);
            return (
              <div
                key={n._id}
                className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
                  unread
                    ? "bg-gold/[0.04] border-gold/20 border-l-4 border-l-gold"
                    : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: dot + content */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className={`shrink-0 mt-1.5 block w-2.5 h-2.5 rounded-full ${
                        unread ? "bg-gold animate-pulse" : "bg-white/15"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold text-sm sm:text-base leading-snug ${
                          unread ? "text-white" : "text-white/60"
                        }`}
                      >
                        {n.title}
                      </h3>
                      <p className="text-white/50 text-xs sm:text-sm mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-white/30 text-[10px] sm:text-xs mt-2 font-medium">
                        {new Date(n.createdAt).toLocaleString("en-US", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Right: Mark as read button */}
                  {unread && (
                    <button
                      onClick={() => markOneAsRead(n._id)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark as read
                    </button>
                  )}

                  {/* Already read check */}
                  {!unread && (
                    <span className="shrink-0 flex items-center gap-1 text-white/20 text-[10px] font-medium">
                      <Check className="w-3 h-3" /> Read
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}