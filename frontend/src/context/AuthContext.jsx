/**
 * AuthContext – Provides login state to the entire app.
 *
 * HOW IT WORKS:
 * ─────────────
 * 1. When a user logs in, we store { token, user } in React state AND
 *    localStorage so it survives page refreshes.
 *
 * 2. Any component can call useAuth() to get:
 *    - session   → { token, user } or null
 *    - login()   → saves session
 *    - logout()  → clears session
 *
 * 3. Pages that need the token (like BreakdownForm, Admin) just do:
 *        const { session } = useAuth();
 *        const data = await someAPI(session.token, ...);
 */
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";

const AuthContext = createContext(null);

const STORAGE_KEY = "onroad-session";
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_URL = API_BASE.replace("/api", "");

export function AuthProvider({ children }) {
  // On first load, try to restore session from localStorage
  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Save/clear localStorage whenever session changes
  const login = (data) => {
    setSession(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // ── Socket.IO connection (auto-join room when logged in) ──
  useEffect(() => {
    if (!session?.token || !session?.user?._id) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.emit("join-room", {
      role: session.user.role,
      userId: session.user._id,
    });

    // You can listen for real-time events here globally
    // e.g. socket.on("request:status-updated", handler)

    return () => socket.disconnect();
  }, [session]);

  const value = useMemo(() => ({ session, login, logout }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
