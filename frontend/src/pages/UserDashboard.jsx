import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Wrench,
  Fuel,
  Star,
  Clock,
  Phone,
  MessageSquare,
  Send,
  Navigation,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Filter,
  IndianRupee,
  Truck,
  Eye,
  X,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  mechanicAPI,
  fuelStationAPI,
  userAPI,
  feedbackAPI,
} from "../utils/api";
import LiveTrackingMap from "../components/LiveTrackingMap";

const TABS = [
  {
    id: "mechanics",
    label: "Search Mechanic",
    icon: <Wrench className="w-4 h-4" />,
  },
  { id: "fuel", label: "Fuel Stations", icon: <Fuel className="w-4 h-4" /> },
  { id: "requests", label: "My Requests", icon: <Clock className="w-4 h-4" /> },
  { id: "feedback", label: "Feedback", icon: <Star className="w-4 h-4" /> },
];

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  accepted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "en-route": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  arrived: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "in-progress": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  preparing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "out-for-delivery": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function UserDashboard() {
  const { session } = useAuth();
  const token = session?.token;
  const [activeTab, setActiveTab] = useState("mechanics");

  return (
    <main className="min-h-screen bg-slate-950 pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">
            Welcome,{" "}
            <span className="text-amber-400">
              {session?.user?.name?.split(" ")[0]}
            </span>
          </h1>
          <p className="text-slate-400 mt-1">
            Find mechanics, fuel stations, and manage your requests
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800/50 border border-white/8 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "mechanics" && <SearchMechanicsTab token={token} />}
            {activeTab === "fuel" && <SearchFuelTab token={token} />}
            {activeTab === "requests" && <MyRequestsTab token={token} />}
            {activeTab === "feedback" && <FeedbackTab token={token} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ════════════════════════ SEARCH MECHANICS TAB ════════════════════════ */
function SearchMechanicsTab({ token }) {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLoc, setUserLoc] = useState(null);
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    problemDescription: "",
    address: "",
  });
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState("");

  const searchNearby = useCallback(async (lat, lng) => {
    setLoading(true);
    setError("");
    try {
      const res = await mechanicAPI.getNearby(lng, lat, 50000);
      setMechanics(res.data || []);
      if ((res.data || []).length === 0)
        setError("No mechanics found nearby. Try increasing the search range.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const detectAndSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc);
          searchNearby(loc.lat, loc.lng);
        },
        () => setError("Location access denied. Please enable GPS."),
        { enableHighAccuracy: true },
      );
    } else {
      setError("Geolocation not supported by your browser.");
    }
  };

  const sendRequest = async () => {
    if (!selectedMechanic || !requestForm.problemDescription) return;
    setSending(true);
    try {
      await userAPI.createMechanicRequest(token, {
        mechanicId: selectedMechanic._id,
        problemDescription: requestForm.problemDescription,
        address: requestForm.address || selectedMechanic.address,
        location: userLoc
          ? { type: "Point", coordinates: [userLoc.lng, userLoc.lat] }
          : undefined,
      });
      setSentSuccess(
        `Request sent to ${selectedMechanic.name}! Check "My Requests" tab for updates.`,
      );
      setShowRequestForm(false);
      setSelectedMechanic(null);
      setRequestForm({ problemDescription: "", address: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search box */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-amber-400" /> Find Nearby Mechanics
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Share your location to find approved mechanics near you. You can then
          share your problem and send a request.
        </p>
        <button
          onClick={detectAndSearch}
          disabled={loading}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          {loading ? "Searching..." : "Detect Location & Search"}
        </button>
        {userLoc && (
          <p className="text-slate-500 text-xs mt-2">
            📍 Location: {userLoc.lat.toFixed(4)}, {userLoc.lng.toFixed(4)}
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {sentSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {sentSuccess}
        </div>
      )}

      {/* Results */}
      {mechanics.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-4">
            {mechanics.length} Mechanics Found
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {mechanics.map((m) => (
              <div
                key={m._id}
                className="glass rounded-2xl p-5 border border-white/8 hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                    {m.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold">{m.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < Math.round(m.rating || 0) ? "fill-amber-500 text-amber-500" : "text-slate-700"}`}
                          />
                        ))}
                      </div>
                      <span className="text-amber-400 text-xs">
                        {(m.rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {m.address}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {m.experience} yrs experience
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${m.availability ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                  >
                    {m.availability ? "Available" : "Busy"}
                  </span>
                </div>
                {m.servicesOffered?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {m.servicesOffered.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-white/5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedMechanic(m);
                      setShowRequestForm(true);
                      setSentSuccess("");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" /> Send Request
                  </button>
                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl transition-all"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Modal */}
      <AnimatePresence>
        {showRequestForm && selectedMechanic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">
                  Send Request to {selectedMechanic.name}
                </h3>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Share your location and describe your problem. The mechanic will
                receive your request.
              </p>
              <div className="space-y-3">
                <textarea
                  placeholder="Describe your problem (e.g., Flat tyre on NH-44, engine not starting...)"
                  value={requestForm.problemDescription}
                  onChange={(e) =>
                    setRequestForm((p) => ({
                      ...p,
                      problemDescription: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-amber-500/50 outline-none resize-none h-28"
                />
                <input
                  placeholder="Your address (optional - we'll use GPS)"
                  value={requestForm.address}
                  onChange={(e) =>
                    setRequestForm((p) => ({ ...p, address: e.target.value }))
                  }
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-amber-500/50 outline-none"
                />
                {userLoc && (
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    GPS Location will be shared: {userLoc.lat.toFixed(4)},{" "}
                    {userLoc.lng.toFixed(4)}
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 bg-slate-800 border border-white/10 text-white font-medium py-2.5 rounded-xl hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={sendRequest}
                  disabled={sending || !requestForm.problemDescription}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? "Sending..." : "Send Request"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════ SEARCH FUEL STATIONS TAB ════════════════════════ */
function SearchFuelTab({ token }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLoc, setUserLoc] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookForm, setBookForm] = useState({
    fuelType: "Petrol",
    quantity: 10,
    address: "",
    paymentMethod: "cash",
  });
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState("");

  const searchNearby = useCallback(async (lat, lng) => {
    setLoading(true);
    setError("");
    try {
      const res = await fuelStationAPI.getNearby(lng, lat, 50000);
      setStations(res.data || []);
      if ((res.data || []).length === 0)
        setError("No fuel stations found nearby.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const detectAndSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc);
          searchNearby(loc.lat, loc.lng);
        },
        () => setError("Location access denied."),
        { enableHighAccuracy: true },
      );
    }
  };

  const bookFuel = async () => {
    if (!selectedStation) return;
    setSending(true);
    try {
      await userAPI.createFuelRequest(token, {
        fuelStationId: selectedStation._id,
        fuelType: bookForm.fuelType,
        quantity: Number(bookForm.quantity),
        deliveryLocation: userLoc
          ? { type: "Point", coordinates: [userLoc.lng, userLoc.lat] }
          : undefined,
        address: bookForm.address || selectedStation.address,
        paymentMethod: bookForm.paymentMethod,
      });
      setSentSuccess(
        `Fuel delivery booked from ${selectedStation.stationName}! Check "My Requests" tab.`,
      );
      setShowBooking(false);
      setSelectedStation(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Fuel className="w-5 h-5 text-amber-400" /> Find Nearby Fuel Stations
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Locate the nearest fuel station, view fuel prices, and book fuel
          delivery to your location.
        </p>
        <button
          onClick={detectAndSearch}
          disabled={loading}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          {loading ? "Searching..." : "Find Fuel Stations"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {sentSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {sentSuccess}
        </div>
      )}

      {stations.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-4">
            {stations.length} Fuel Stations Found
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {stations.map((s) => (
              <div
                key={s._id}
                className="glass rounded-2xl p-5 border border-white/8 hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold">
                    <Fuel className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold">
                      {s.stationName}
                    </h4>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Owner: {s.ownerName}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {s.address}
                    </p>
                    {s.openingHours && (
                      <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.openingHours}
                      </p>
                    )}
                  </div>
                  {s.deliveryAvailable && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Delivery
                    </span>
                  )}
                </div>
                {/* Fuel prices */}
                {s.fuelTypes?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {s.fuelTypes.map((ft, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2.5 py-1 rounded-lg border ${ft.available ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-red-500/5 border-red-500/20 text-red-400 line-through"}`}
                      >
                        {ft.type}: ₹{ft.price}/L
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedStation(s);
                      setShowBooking(true);
                      setSentSuccess("");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95"
                  >
                    <Truck className="w-4 h-4" /> Book Delivery
                  </button>
                  {s.phone && (
                    <a
                      href={`tel:${s.phone}`}
                      className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl transition-all"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <AnimatePresence>
        {showBooking && selectedStation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">
                  Book from {selectedStation.stationName}
                </h3>
                <button
                  onClick={() => setShowBooking(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">
                    Fuel Type
                  </label>
                  <select
                    value={bookForm.fuelType}
                    onChange={(e) =>
                      setBookForm((p) => ({ ...p, fuelType: e.target.value }))
                    }
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
                  >
                    {(selectedStation.fuelTypes || [])
                      .filter((f) => f.available)
                      .map((f) => (
                        <option key={f.type} value={f.type}>
                          {f.type} - ₹{f.price}/L
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">
                    Quantity (Liters)
                  </label>
                  <input
                    type="number"
                    value={bookForm.quantity}
                    onChange={(e) =>
                      setBookForm((p) => ({ ...p, quantity: e.target.value }))
                    }
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
                  />
                </div>
                <input
                  placeholder="Delivery address"
                  value={bookForm.address}
                  onChange={(e) =>
                    setBookForm((p) => ({ ...p, address: e.target.value }))
                  }
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-amber-500/50 outline-none"
                />
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">
                    Payment Method
                  </label>
                  <select
                    value={bookForm.paymentMethod}
                    onChange={(e) =>
                      setBookForm((p) => ({
                        ...p,
                        paymentMethod: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
                  >
                    <option value="cash">Cash on Delivery</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>
                {/* Price estimate */}
                {selectedStation.fuelTypes && (
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                    <div className="flex justify-between text-sm text-slate-300">
                      <span>Fuel Cost</span>
                      <span>
                        ₹
                        {(
                          (selectedStation.fuelTypes.find(
                            (f) => f.type === bookForm.fuelType,
                          )?.price || 0) * Number(bookForm.quantity || 0)
                        ).toFixed(0)}
                      </span>
                    </div>
                    {selectedStation.deliveryCharges > 0 && (
                      <div className="flex justify-between text-sm text-slate-300 mt-1">
                        <span>Delivery</span>
                        <span>₹{selectedStation.deliveryCharges}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold text-amber-400 mt-2 pt-2 border-t border-white/5">
                      <span>Total</span>
                      <span>
                        ₹
                        {(
                          (selectedStation.fuelTypes.find(
                            (f) => f.type === bookForm.fuelType,
                          )?.price || 0) *
                            Number(bookForm.quantity || 0) +
                          (selectedStation.deliveryCharges || 0)
                        ).toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBooking(false)}
                  className="flex-1 bg-slate-800 border border-white/10 text-white font-medium py-2.5 rounded-xl hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={bookFuel}
                  disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Truck className="w-4 h-4" />
                  )}
                  {sending ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════ MY REQUESTS TAB ════════════════════════ */
function MyRequestsTab({ token }) {
  const [mechanicReqs, setMechanicReqs] = useState([]);
  const [fuelReqs, setFuelReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subTab, setSubTab] = useState("mechanic");
  const [trackingReq, setTrackingReq] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [mRes, fRes] = await Promise.all([
          userAPI.getMyMechanicRequests(token),
          userAPI.getMyFuelRequests(token),
        ]);
        setMechanicReqs(mRes.data || []);
        setFuelReqs(fRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const cancelMechanicReq = async (id) => {
    try {
      await userAPI.cancelMechanicRequest(token, id);
      setMechanicReqs((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "cancelled" } : r)),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelFuelReq = async (id) => {
    try {
      await userAPI.cancelFuelRequest(token, id);
      setFuelReqs((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "cancelled" } : r)),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab("mechanic")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${subTab === "mechanic" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-slate-800/50 text-slate-400 border border-white/8"}`}
        >
          <Wrench className="w-4 h-4 inline mr-1.5" />
          Mechanic Requests ({mechanicReqs.length})
        </button>
        <button
          onClick={() => setSubTab("fuel")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${subTab === "fuel" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-800/50 text-slate-400 border border-white/8"}`}
        >
          <Fuel className="w-4 h-4 inline mr-1.5" />
          Fuel Orders ({fuelReqs.length})
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {subTab === "mechanic" && (
        <div className="space-y-3">
          {mechanicReqs.length === 0 && (
            <p className="text-slate-500 text-center py-10">
              No mechanic requests yet. Search for a mechanic and send a
              request.
            </p>
          )}
          {mechanicReqs.map((r) => (
            <div
              key={r._id}
              className="glass rounded-xl p-5 border border-white/8"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-semibold">
                      {r.mechanic?.name || "Mechanic"}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status] || "bg-slate-500/10 text-slate-400"}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {r.problemDescription}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">{r.address}</p>
                  <p className="text-slate-600 text-xs mt-1">
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {["en-route", "arrived", "in-progress"].includes(
                    r.status,
                  ) && (
                    <button
                      onClick={() => setTrackingReq(r)}
                      className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >
                      <MapPin className="w-3 h-3 inline mr-1" />
                      Track
                    </button>
                  )}
                  {["pending", "accepted"].includes(r.status) && (
                    <button
                      onClick={() => cancelMechanicReq(r._id)}
                      className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <XCircle className="w-3 h-3 inline mr-1" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              {r.mechanic?.phone && (
                <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {r.mechanic.phone}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {subTab === "fuel" && (
        <div className="space-y-3">
          {fuelReqs.length === 0 && (
            <p className="text-slate-500 text-center py-10">
              No fuel orders yet. Search for a fuel station and book delivery.
            </p>
          )}
          {fuelReqs.map((r) => (
            <div
              key={r._id}
              className="glass rounded-xl p-5 border border-white/8"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-semibold">
                      {r.fuelStation?.stationName || "Fuel Station"}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status] || "bg-slate-500/10 text-slate-400"}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">
                    {r.fuelType} — {r.quantity}L
                  </p>
                  <p className="text-amber-400 text-sm font-semibold">
                    ₹{r.totalPrice}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">{r.address}</p>
                  <p className="text-slate-600 text-xs mt-1">
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                {["pending", "confirmed"].includes(r.status) && (
                  <button
                    onClick={() => cancelFuelReq(r._id)}
                    className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <XCircle className="w-3 h-3 inline mr-1" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tracking Modal */}
      <AnimatePresence>
        {trackingReq && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-white font-semibold">
                  Tracking: {trackingReq.mechanic?.name}
                </h3>
                <button
                  onClick={() => setTrackingReq(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1">
                <LiveTrackingMap
                  userLocation={
                    trackingReq.location
                      ? {
                          lat: trackingReq.location.coordinates[1],
                          lng: trackingReq.location.coordinates[0],
                        }
                      : null
                  }
                  providerName={trackingReq.mechanic?.name || "Mechanic"}
                  status={trackingReq.status}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════ FEEDBACK TAB ════════════════════════ */
function FeedbackTab({ token }) {
  const [mechanicReqs, setMechanicReqs] = useState([]);
  const [fuelReqs, setFuelReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [feedbackForm, setFeedbackForm] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [mRes, fRes] = await Promise.all([
          userAPI.getMyMechanicRequests(token),
          userAPI.getMyFuelRequests(token),
        ]);
        setMechanicReqs(
          (mRes.data || []).filter((r) => r.status === "completed"),
        );
        setFuelReqs((fRes.data || []).filter((r) => r.status === "delivered"));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submitFeedback = async () => {
    if (!feedbackForm) return;
    setSending(true);
    try {
      await feedbackAPI.create(token, {
        requestId: feedbackForm._id,
        requestType: feedbackForm._type,
        serviceType: feedbackForm._serviceType,
        serviceProviderId: feedbackForm._providerId,
        rating,
        comment,
      });
      setSuccess("Feedback submitted successfully! Thank you.");
      setFeedbackForm(null);
      setRating(5);
      setComment("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );

  const completedItems = [
    ...mechanicReqs.map((r) => ({
      ...r,
      _type: "MechanicRequest",
      _serviceType: "Mechanic",
      _providerId: r.mechanic?._id || r.mechanic,
      _providerName: r.mechanic?.name || "Mechanic",
    })),
    ...fuelReqs.map((r) => ({
      ...r,
      _type: "FuelRequest",
      _serviceType: "FuelStation",
      _providerId: r.fuelStation?._id || r.fuelStation,
      _providerName: r.fuelStation?.stationName || "Fuel Station",
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" /> Post Feedback
        </h2>
        <p className="text-slate-400 text-sm">
          Rate and review the service providers you've used. Your feedback helps
          improve service quality.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {success}
        </div>
      )}

      {completedItems.length === 0 && (
        <p className="text-slate-500 text-center py-10">
          No completed requests to review yet. Complete a service to leave
          feedback.
        </p>
      )}

      <div className="space-y-3">
        {completedItems.map((item) => (
          <div
            key={item._id}
            className="glass rounded-xl p-5 border border-white/8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-semibold">
                  {item._providerName}
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  {item._serviceType === "Mechanic"
                    ? item.problemDescription
                    : `${item.fuelType} — ${item.quantity}L`}
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setFeedbackForm(item);
                  setRating(5);
                  setComment("");
                  setSuccess("");
                }}
                className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-500/20 transition-colors"
              >
                <Star className="w-4 h-4" /> Write Review
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">
                  Review {feedbackForm._providerName}
                </h3>
                <button
                  onClick={() => setFeedbackForm(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-xs mb-2">Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setRating(s)}
                        className="p-1"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${s <= rating ? "fill-amber-500 text-amber-500" : "text-slate-700"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  placeholder="Write your review..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-amber-500/50 outline-none resize-none h-28"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setFeedbackForm(null)}
                  className="flex-1 bg-slate-800 border border-white/10 text-white font-medium py-2.5 rounded-xl hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedback}
                  disabled={sending || !comment}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
