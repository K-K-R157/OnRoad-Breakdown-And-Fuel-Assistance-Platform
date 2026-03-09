/**
 * TrackingDashboard – Live tracking page.
 * Shows: Google Maps with real-time markers, ETA, driving route,
 * 4-step status bar, and nearby service provider cards.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation2,
  Clock,
  Phone,
  MessageSquare,
  ChevronRight,
  Zap,
  CheckCircle2,
  Circle,
  RefreshCw,
} from "lucide-react";
import ServiceProviderCard from "../components/ServiceProviderCard";
import LiveTrackingMap from "../components/LiveTrackingMap";
import { userAPI, mechanicAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/* ─── Status steps ─── */
const STATUS_STEPS = [
  { id: "reported", label: "Reported", icon: <Circle className="w-4 h-4" /> },
  { id: "assigned", label: "Assigned", icon: <Zap className="w-4 h-4" /> },
  {
    id: "en_route",
    label: "En Route",
    icon: <Navigation2 className="w-4 h-4" />,
  },
  {
    id: "arrived",
    label: "Arrived",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

const STATUS_MESSAGES = {
  reported: "Your request has been received. Finding the nearest provider…",
  assigned: "James M. has accepted your request and is preparing to depart.",
  en_route:
    "Your mechanic is on the way! Real-time GPS updates every 5 seconds.",
  arrived: "James M. has arrived at your location. Help is here!",
};

/* ─── Fallback providers shown when backend is unreachable ─── */
const FALLBACK_PROVIDERS = [
  {
    id: 1,
    name: "Rajesh Kumar",
    avatar: "RK",
    rating: 4.9,
    reviewCount: 142,
    distance: "0.8 km",
    eta: "~6 min",
    type: "mechanic",
    specialties: ["Engine Repair", "Tyre Change", "Battery"],
    isOnline: true,
    highlighted: true,
  },
  {
    id: 2,
    name: "Bharat Petroleum",
    avatar: "BP",
    rating: 4.7,
    reviewCount: 89,
    distance: "1.4 km",
    eta: "~12 min",
    type: "fuelStation",
    specialties: ["Petrol Delivery", "Diesel"],
    isOnline: true,
    highlighted: false,
  },
  {
    id: 3,
    name: "Suresh Auto Works",
    avatar: "SA",
    rating: 4.6,
    reviewCount: 57,
    distance: "2.1 km",
    eta: "~18 min",
    type: "mechanic",
    specialties: ["Flat Tyre", "Jump Start", "Towing"],
    isOnline: true,
    highlighted: false,
  },
];

/* ─── ETA Countdown (receives seconds from Google Maps Directions) ─── */
function ETATimer({ seconds }) {
  const m = Math.floor((seconds || 0) / 60);
  const s = (seconds || 0) % 60;

  return (
    <div className="flex items-baseline gap-1 font-display">
      <span className="text-4xl font-bold text-white tabular-nums">
        {String(m).padStart(2, "0")}
      </span>
      <span className="text-2xl text-amber-500 font-bold">:</span>
      <span className="text-4xl font-bold text-white tabular-nums">
        {String(s).padStart(2, "0")}
      </span>
    </div>
  );
}

/* ─── Page ─── */
export default function TrackingDashboard() {
  const { session } = useAuth();
  const token = session?.token;

  const [status, setStatus] = useState("reported");
  const [providers, setProviders] = useState(FALLBACK_PROVIDERS);
  const [latestRequest, setLatestRequest] = useState(null);
  const [etaSeconds, setEtaSeconds] = useState(0);
  const currentIndex = STATUS_STEPS.findIndex((s) => s.id === status);

  // Live location state
  const [userLocation, setUserLocation] = useState(null);
  const [providerLocation, setProviderLocation] = useState(null);
  const [providerName, setProviderName] = useState("Mechanic");

  // Get the user's current position via browser Geolocation API
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);

        // Share our location with the mechanic via Socket.IO
        if (session?.socket && latestRequest) {
          session.socket.emit("location:share-user", {
            requestId: latestRequest._id,
            mechanicId: latestRequest.mechanic?._id || latestRequest.mechanic,
            coords: loc,
          });
        }
      },
      () => {
        // Fallback to Bangalore center if geolocation denied
        setUserLocation({ lat: 12.9716, lng: 77.5946 });
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [session?.socket, latestRequest]);

  // Fetch the user's most recent mechanic request + nearby providers
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await userAPI.getMyMechanicRequests(token);
        if (res.data?.length) {
          const req = res.data[0]; // latest
          setLatestRequest(req);

          // Extract provider name
          if (req.mechanic?.name) setProviderName(req.mechanic.name);

          // If the request has mechanic location, use it as initial provider position
          if (req.mechanic?.location?.coordinates) {
            const [lng, lat] = req.mechanic.location.coordinates;
            setProviderLocation({ lat, lng });
          }

          // If request has user location, use that too
          if (req.location?.coordinates) {
            const [lng, lat] = req.location.coordinates;
            setUserLocation((prev) => prev || { lat, lng });
          }

          const statusMap = {
            pending: "reported",
            accepted: "assigned",
            "en-route": "en_route",
            arrived: "arrived",
            "in-progress": "en_route",
            completed: "arrived",
          };
          setStatus(statusMap[req.status] || "reported");
        }
      } catch {
        // keep fallback
      }

      // Get nearby mechanics
      try {
        const nearby = await mechanicAPI.getNearby(token, {
          latitude: userLocation?.lat || 12.9716,
          longitude: userLocation?.lng || 77.5946,
        });
        if (nearby.data?.length) {
          setProviders(
            nearby.data.map((m, i) => ({
              id: m._id,
              name: m.name,
              avatar:
                m.name
                  ?.split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2) || "?",
              rating: m.rating || 4.5,
              reviewCount: m.totalReviews || 0,
              distance: "—",
              eta: "—",
              type: "mechanic",
              specialties: m.servicesOffered || [],
              isOnline: m.availability ?? true,
              highlighted: i === 0,
            })),
          );
        }
      } catch {
        // keep fallback
      }
    })();
  }, [token]);

  // Listen for real-time status updates via Socket.IO
  useEffect(() => {
    if (!session?.socket) return;
    const socket = session.socket;

    const handleStatusUpdate = (data) => {
      if (!data) return;
      const statusMap = {
        pending: "reported",
        accepted: "assigned",
        "en-route": "en_route",
        arrived: "arrived",
        "in-progress": "en_route",
        completed: "arrived",
      };
      if (statusMap[data.status]) setStatus(statusMap[data.status]);
    };

    // Listen for mechanic's live location
    const handleLocationTracking = (data) => {
      if (data?.coords) {
        setProviderLocation({ lat: data.coords.lat, lng: data.coords.lng });
      }
    };

    socket.on("request:status-updated", handleStatusUpdate);
    socket.on("location:tracking", handleLocationTracking);
    return () => {
      socket.off("request:status-updated", handleStatusUpdate);
      socket.off("location:tracking", handleLocationTracking);
    };
  }, [session?.socket]);

  const handleEtaUpdate = useCallback((secs) => {
    setEtaSeconds(secs);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 pt-16 pb-12">
      {/* Background glow */}
      <div className="absolute top-40 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Live Assistance
          </div>
          <h1 className="font-display font-bold text-3xl text-white">
            Tracking Your Request
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {latestRequest
              ? `Request #${latestRequest._id?.slice(-6).toUpperCase()} · ${latestRequest.problemDescription?.slice(0, 40) || "Assistance"} · ${latestRequest.address || ""}`
              : "Request #ONR-20482 · Flat Tyre · Koramangala, Bangalore"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left column: Map + Status ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div
              className="glass rounded-2xl overflow-hidden"
              style={{ height: 380 }}
            >
              <LiveTrackingMap
                userLocation={userLocation}
                providerLocation={providerLocation}
                providerName={providerName}
                status={status}
                onEtaUpdate={handleEtaUpdate}
              />
            </div>

            {/* Status progress */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-semibold">Request Status</h2>
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors">
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              {/* Step track */}
              <div className="relative flex justify-between">
                {/* Track bar */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-800">
                  <motion.div
                    className="h-full bg-amber-500"
                    animate={{
                      width: `${(currentIndex / (STATUS_STEPS.length - 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.6 }}
                  />
                </div>

                {STATUS_STEPS.map(({ id, label, icon }, i) => {
                  const done = i < currentIndex;
                  const active = i === currentIndex;
                  return (
                    <div
                      key={id}
                      className="relative flex flex-col items-center gap-2 z-10"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                          done
                            ? "bg-amber-500 border-amber-500 text-slate-950"
                            : active
                              ? "bg-amber-500/20 border-amber-500 text-amber-400 ring-4 ring-amber-500/20"
                              : "bg-slate-800 border-slate-700 text-slate-600"
                        }`}
                      >
                        {done ? <CheckCircle2 className="w-4 h-4" /> : icon}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          done || active ? "text-white" : "text-slate-600"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status message */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={status}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-slate-400 text-sm mt-6 text-center"
                >
                  {STATUS_MESSAGES[status]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right column: ETA + Provider cards ── */}
          <div className="space-y-5">
            {/* ETA card */}
            <div className="glass rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-3">
                <Clock className="w-4 h-4" />
                Estimated Arrival
              </div>
              <ETATimer seconds={etaSeconds} />
              <p className="text-slate-500 text-xs mt-2">minutes : seconds</p>

              <div className="mt-5 pt-5 border-t border-white/8 flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95">
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </button>
              </div>
            </div>

            {/* Assigned provider */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <span>Your Provider</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <ServiceProviderCard {...providers[0]} highlighted />
            </div>

            {/* Nearby providers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">
                  Nearby Providers
                </h3>
                <button className="text-amber-400 text-xs flex items-center gap-0.5 hover:text-amber-300 transition-colors">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-4">
                {providers.slice(1).map((p) => (
                  <ServiceProviderCard key={p.id} {...p} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
