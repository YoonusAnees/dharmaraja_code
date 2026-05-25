import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/notifications").then((res) => {
      setNotifications(res.data.notifications || []);
    });
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-black">Notifications</h1>

      <div className="mt-8 space-y-4">
        {notifications.map((n) => (
          <div key={n._id} className="bg-white/10 border border-white/10 rounded-2xl p-5">
            <h3 className="font-bold text-gold">{n.title}</h3>
            <p className="text-white/70 mt-1">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}