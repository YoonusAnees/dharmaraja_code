/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import socket from "../socket/socket";
import { useAuth } from "./useAuth";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [liveNotification, setLiveNotification] = useState(null);

  useEffect(() => {
    if (!user) return;

    socket.connect();
    socket.emit("join-user-room", user._id);

    socket.on("new-notification", (data) => {
      setLiveNotification(data);
    });

    return () => {
      socket.off("new-notification");
      socket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ liveNotification }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);