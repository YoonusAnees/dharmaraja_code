import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function MemberNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/notifications").then((res) => {
      setNotifications(res.data.notifications || []);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">Notifications</h1>
        <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">
          Latest campaign, event, and Old Boys Association system notifications.
        </p>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl text-xs sm:text-sm bg-white/5">
            No notifications found.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className="rounded-2xl bg-white/5 border border-white/5 p-4 sm:p-5 hover:bg-white/10 hover:border-white/10 transition-all shadow-md space-y-2.5"
            >
              <h3 className="font-bold text-gold text-sm sm:text-base leading-snug">{n.title}</h3>
              <p className="text-white/70 text-xs sm:text-sm leading-relaxed">{n.message}</p>
              <p className="text-white/40 text-[10px] sm:text-xs font-semibold">
                🔔 Published on: {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}