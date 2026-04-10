import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const DEFAULT_PROD_API_URL =
  "https://onroad-breakdown-g3brh6bbgqguefc3.southeastasia-01.azurewebsites.net/api";

const SOCKET_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_PROD_API_URL
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");
const isDev =
  typeof __DEV__ !== "undefined"
    ? __DEV__
    : process.env.NODE_ENV !== "production";
const debugLog = (...args) => {
  if (isDev) console.log(...args);
};
const debugError = (...args) => {
  if (isDev) console.warn(...args);
};

export function SocketProvider({ children }) {
  const { session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [providerLocation, setProviderLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const socketRef = useRef(null);
  const locationWatchRef = useRef(null);

  // Connect to socket when user is logged in
  useEffect(() => {
    if (session?.token && session?.user) {
      const socket = io(SOCKET_URL, {
        transports: ["polling", "websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        debugLog("Socket connected:", socket.id);
        setIsConnected(true);

        // Join room based on user role
        const role = session.user.role;
        const userId = session.user._id;
        socket.emit("join-room", { role, userId });
        debugLog(`Joined room: ${role}:${userId}`);
      });

      socket.on("disconnect", () => {
        debugLog("Socket disconnected");
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        debugError("Socket connection error:", error.message);
        setIsConnected(false);
      });

      // Listen for provider location updates (for users)
      socket.on("location:tracking", (data) => {
        debugLog("Provider location received:", data);
        setProviderLocation({
          requestId: data.requestId,
          latitude: data.coords.lat,
          longitude: data.coords.lng,
          timestamp: data.timestamp,
        });
      });

      // Listen for user location updates (for providers)
      socket.on("location:user-update", (data) => {
        debugLog("User location received:", data);
        setUserLocation({
          requestId: data.requestId,
          latitude: data.coords.lat,
          longitude: data.coords.lng,
          timestamp: data.timestamp,
        });
      });

      // Listen for request status updates
      socket.on("request:status-updated", (data) => {
        debugLog("Request status updated:", data);
        setRequestStatus(data);
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [session?.token, session?.user?._id, session?.user?.role]);

  // Send provider location to user (for mechanics/fuel/charging providers)
  const sendProviderLocation = useCallback((requestId, userId, coords) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("location:update", {
        requestId,
        userId,
        coords: { lat: coords.latitude, lng: coords.longitude },
      });
    }
  }, []);

  // Send user location to provider (for users tracking)
  const sendUserLocation = useCallback(
    (requestId, providerId, providerRole, coords) => {
      if (socketRef.current?.connected) {
        // Determine the correct event based on provider role
        const eventData = {
          requestId,
          coords: { lat: coords.latitude, lng: coords.longitude },
        };

        if (providerRole === "mechanic") {
          eventData.mechanicId = providerId;
          socketRef.current.emit("location:share-user", eventData);
        } else if (providerRole === "fuelStation") {
          eventData.fuelStationId = providerId;
          socketRef.current.emit("location:share-user-fuel", eventData);
        } else if (providerRole === "chargingStation") {
          eventData.chargingStationId = providerId;
          socketRef.current.emit("location:share-user-charging", eventData);
        }
      }
    },
    [],
  );

  // Clear location data
  const clearProviderLocation = useCallback(() => {
    setProviderLocation(null);
  }, []);

  const clearUserLocation = useCallback(() => {
    setUserLocation(null);
  }, []);

  const clearRequestStatus = useCallback(() => {
    setRequestStatus(null);
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected,
    providerLocation,
    userLocation,
    requestStatus,
    sendProviderLocation,
    sendUserLocation,
    clearProviderLocation,
    clearUserLocation,
    clearRequestStatus,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

export default SocketContext;
