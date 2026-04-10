import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "onroad-mobile-session";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw || !isMounted) {
          return;
        }

        const saved = JSON.parse(raw);
        if (!saved?.token) {
          return;
        }

        const me = await authAPI.getMe(saved.token);
        if (!isMounted) {
          return;
        }

        setSession({
          token: saved.token,
          user: {
            ...(saved.user || {}),
            ...(me?.user || {}),
          },
        });
      } catch {
        if (isMounted) {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async ({ email, password, role }) => {
    const response = await authAPI.login({ email, password, role });
    const nextSession = {
      token: response.token,
      user: {
        ...response.user,
        _id: response.user?.id || response.user?._id,
      },
    };

    setSession(nextSession);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    return nextSession;
  };

  const register = async (payload) => {
    return authAPI.register(payload);
  };

  const logout = async () => {
    setSession(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      session,
      isBootstrapping,
      login,
      register,
      logout,
    }),
    [session, isBootstrapping],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
