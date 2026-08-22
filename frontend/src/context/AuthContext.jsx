import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { api, getToken } from "../api/client.js";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const persist = (token, nextUser) => {
    if (token) localStorage.setItem("agriflow_token", token);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("agriflow_token");
    setUser(null);
    socket?.disconnect();
    setSocket(null);
  };

  useEffect(() => {
    const boot = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.me();
        setUser(data.user);
      } catch {
        localStorage.removeItem("agriflow_token");
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const next = io("/", { transports: ["websocket", "polling"] });
    next.emit("join", `user:${user._id}`);
    setSocket(next);
    return () => next.disconnect();
  }, [user?._id]);

  const value = useMemo(
    () => ({
      user,
      loading,
      socket,
      setUser,
      persist,
      logout,
    }),
    [user, loading, socket]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
