import { createContext, useEffect, useRef, useState } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const hasLoadedMe = useRef(false);

  const loadMe = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async (form) => {
    const res = await api.post("/auth/login", form);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  useEffect(() => {
    if (hasLoadedMe.current) return;
    hasLoadedMe.current = true;
    loadMe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        authLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};