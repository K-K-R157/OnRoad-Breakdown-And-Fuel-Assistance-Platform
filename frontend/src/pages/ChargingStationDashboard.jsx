import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BatteryCharging,
  Settings,
  Clock,
  MapPin,
  Phone,
  User,
  Star,
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
  Truck,
  Navigation,
  Plus,
  Trash2,
  Package,
  Eye,
  Zap,
  Battery,
  Plug,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { chargingStationAPI, feedbackAPI } from "../utils/api";
import StatsModal from "../components/StatsModal";

const TABS = [
  {
    id: "bookings",
    label: "Charging Requests",
    icon: <Package className="w-4 h-4" />,
  },
  {
    id: "station",
    label: "Station Profile",
    icon: <Settings className="w-4 h-4" />,
  },
  {
    id: "charging-types",
    label: "Charging Types",
    icon: <BatteryCharging className="w-4 h-4" />,
  },
  { id: "feedback", label: "Feedback", icon: <Star className="w-4 h-4" /> },
];

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  dispatched: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  arrived: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  charging: "bg-green-500/10 text-green-400 border-green-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "dispatched",
  "arrived",
  "charging",
  "completed",
];

const VEHICLE_TYPE_LABELS = {
  "2-wheeler": "🛵 2-Wheeler",
  "3-wheeler": "🛺 3-Wheeler",
  "4-wheeler": "🚗 4-Wheeler",
  commercial: "🚛 Commercial",
};

const CONNECTOR_TYPE_LABELS = {
  Type2: "Type 2 (AC)",
  CCS2: "CCS2 (DC Fast)",
  CHAdeMO: "CHAdeMO",
  GBT: "GB/T",
};

export default function ChargingStationDashboard() {
  const { session } = useAuth();
  const token = session?.token;
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(location.search);
    return p.get("tab") || "bookings";
  });

  useEffect(() => {
    const tab =
      new URLSearchParams(location.search).get("tab") || location.state?.tab;
    if (tab) setActiveTab(tab);
  }, [location]);

  return (
    <main className="min-h-screen bg-slate-950 pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">
            Charging Station <span className="text-green-400">Dashboard</span>
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your station, charging types, and requests
          </p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-green-500 text-slate-950"
                  : "bg-slate-800/50 border border-white/8 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "bookings" && <BookingsTab token={token} />}
            {activeTab === "station" && <StationProfileTab token={token} />}
            {activeTab === "charging-types" && (
              <ChargingTypesTab token={token} />
            )}
            {activeTab === "feedback" && (
              <FeedbackViewTab token={token} stationId={session?.user?._id} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ════════════════════════ BOOKINGS TAB ════════════════════════ */
function BookingsTab({ token }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalTitle, setModalTitle] = useState("");

  useEffect(() => {
    loadBookings();
  }, [token]);

  const loadBookings = async () => {
    try {
      const res = await chargingStationAPI.getRequests(token);
      setRequests(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getNextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx >= 0 && idx < STATUS_FLOW.length - 1
      ? STATUS_FLOW[idx + 1]
      : null;
  };

  const updateStatus = async (id, status, extras = {}) => {
    try {
      await chargingStationAPI.updateRequestStatus(token, id, status, extras);
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status, ...extras } : r)),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelBooking = async (id) => {
    try {
      await chargingStationAPI.updateRequestStatus(token, id, "cancelled", {
        cancellationReason: "Cancelled by station",
      });
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "cancelled" } : r)),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );

  const pending = requests.filter((r) => r.status === "pending");
  const active = requests.filter((r) =>
    ["confirmed", "dispatched", "arrived", "charging"].includes(r.status),
  );
  const history = requests.filter((r) =>
    ["completed", "cancelled"].includes(r.status),
  );

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "New Requests",
            value: pending.length,
            color: "text-yellow-400",
            filter: "pending",
          },
          {
            label: "Active",
            value: active.length,
            color: "text-blue-400",
            filter: "active",
          },
          {
            label: "Completed Today",
            value: requests.filter((r) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return (
                r.status === "completed" && new Date(r.updatedAt || r.createdAt) >= today
              );
            }).length,
            color: "text-green-400",
            filter: "completedToday",
          },
          {
            label: "Total Completed",
            value: requests.filter((r) => r.status === "completed").length,
            color: "text-slate-400",
            filter: "totalCompleted",
          },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => {
              let filtered = [];
              let title = s.label;

              if (s.filter === "pending") {
                filtered = pending;
              } else if (s.filter === "active") {
                filtered = active;
              } else if (s.filter === "completedToday") {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                filtered = requests.filter(
                  (r) =>
                    r.status === "completed" &&
                    new Date(r.updatedAt || r.createdAt) >= today,
                );
              } else if (s.filter === "totalCompleted") {
                filtered = requests.filter((r) => r.status === "completed");
                title = "All Completed Requests";
              }

              setModalTitle(title);
              setModalData(filtered);
              setShowStatsModal(true);
            }}
            className="glass rounded-xl p-4 border border-white/8 hover:bg-white/5 transition-all cursor-pointer text-left"
          >
            <p className="text-slate-500 text-xs">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* New Requests */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />{" "}
            New Requests ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((r) => (
              <BookingCard
                key={r._id}
                request={r}
                getNextStatus={getNextStatus}
                onUpdate={updateStatus}
                onCancel={cancelBooking}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">
            Active Requests ({active.length})
          </h3>
          <div className="space-y-3">
            {active.map((r) => (
              <BookingCard
                key={r._id}
                request={r}
                getNextStatus={getNextStatus}
                onUpdate={updateStatus}
                onCancel={cancelBooking}
              />
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 className="text-slate-400 font-semibold mb-3">
            History ({history.length})
          </h3>
          <div className="space-y-3">
            {history.slice(0, 10).map((r) => (
              <BookingCard
                key={r._id}
                request={r}
                getNextStatus={getNextStatus}
                onUpdate={updateStatus}
                onCancel={cancelBooking}
                isHistory
              />
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <p className="text-slate-500 text-center py-10">
          No charging requests yet. Users will request mobile charging from your
          station.
        </p>
      )}

      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title={modalTitle}
        data={modalData}
        loading={false}
      />
    </div>
  );
}

function BookingCard({
  request: r,
  getNextStatus,
  onUpdate,
  onCancel,
  isHistory,
}) {
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [techForm, setTechForm] = useState({
    technicianName: r.technicianName || "",
    technicianPhone: r.technicianPhone || "",
    vehicleNumber: r.vehicleNumber || "",
  });
  const next = getNextStatus(r.status);

  const handleConfirmWithTech = () => {
    if (!techForm.technicianName || !techForm.technicianPhone) {
      alert("Please fill technician details");
      return;
    }
    onUpdate(r._id, "confirmed", techForm);
    setShowTechDetails(false);
  };

  return (
    <div
      className={`glass rounded-xl p-5 border ${r.status === "pending" ? "border-yellow-500/30 shadow-lg shadow-yellow-500/5" : "border-white/8"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-white font-semibold flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              {r.user?.name || "User"}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status] || ""}`}
            >
              {r.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-green-400 font-semibold flex items-center gap-1">
              <Battery className="w-4 h-4" />
              {VEHICLE_TYPE_LABELS[r.vehicleType] || r.vehicleType}
            </span>
            <span className="text-slate-300 flex items-center gap-1">
              <Plug className="w-4 h-4" />
              {CONNECTOR_TYPE_LABELS[r.connectorType] || r.connectorType}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm">
            <span className="text-slate-400">
              {r.currentBatteryPercent}% → {r.targetBatteryPercent}%
            </span>
            <span className="text-slate-400">
              ~{r.estimatedEnergyNeeded?.toFixed(1)} kWh
            </span>
            <span className="text-green-400 font-bold flex items-center gap-0.5">
              <IndianRupee className="w-3 h-3" />
              {r.totalPrice?.toFixed(0)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-slate-500 text-xs flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {r.address}
            </span>
            {r.user?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {r.user.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(r.createdAt).toLocaleString()}
            </span>
          </div>
          {r.paymentMethod && (
            <p className="text-slate-600 text-xs mt-1">
              Payment: {r.paymentMethod}
            </p>
          )}
          {r.technicianName && (
            <p className="text-slate-500 text-xs mt-1">
              Technician: {r.technicianName} ({r.technicianPhone}) - Vehicle:{" "}
              {r.vehicleNumber}
            </p>
          )}
        </div>
      </div>

      {/* Technician details form for confirmation */}
      {showTechDetails && (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl space-y-3">
          <p className="text-white text-sm font-medium">
            Enter Technician Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Technician Name"
              value={techForm.technicianName}
              onChange={(e) =>
                setTechForm({ ...techForm, technicianName: e.target.value })
              }
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
            />
            <input
              type="text"
              placeholder="Technician Phone"
              value={techForm.technicianPhone}
              onChange={(e) =>
                setTechForm({ ...techForm, technicianPhone: e.target.value })
              }
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
            />
            <input
              type="text"
              placeholder="Vehicle Number"
              value={techForm.vehicleNumber}
              onChange={(e) =>
                setTechForm({ ...techForm, vehicleNumber: e.target.value })
              }
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmWithTech}
              className="bg-green-500 hover:bg-green-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl"
            >
              Confirm Request
            </button>
            <button
              onClick={() => setShowTechDetails(false)}
              className="bg-slate-700 text-white text-sm px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isHistory && !showTechDetails && (
        <div className="flex gap-2 mt-4 flex-wrap">
          {r.status === "pending" && (
            <button
              onClick={() => setShowTechDetails(true)}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm
            </button>
          )}
          {next && r.status !== "pending" && (
            <button
              onClick={() => onUpdate(r._id, next)}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark {next}
            </button>
          )}
          {["pending", "confirmed"].includes(r.status) && (
            <button
              onClick={() => onCancel(r._id)}
              className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-sm px-4 py-2 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          )}
          {r.user?.phone && (
            <a
              href={`tel:${r.user.phone}`}
              className="flex items-center gap-1.5 bg-slate-800 border border-white/10 text-white text-sm px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════ STATION PROFILE TAB ════════════════════════ */
function StationProfileTab({ token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({});

  useEffect(() => {
    loadProfile();
  }, [token]);

  const loadProfile = async () => {
    try {
      const res = await chargingStationAPI.getProfile(token);
      setProfile(res.data);
      setForm({
        stationName: res.data.stationName || "",
        ownerName: res.data.ownerName || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
        mobileChargingAvailable: res.data.mobileChargingAvailable ?? true,
        serviceRadius: res.data.serviceRadius || 10,
        serviceCharges: res.data.serviceCharges || 100,
        estimatedResponseTime: res.data.estimatedResponseTime || 30,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await chargingStationAPI.updateProfile(token, form);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );

  return (
    <div className="glass rounded-xl p-6 border border-white/8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5 text-green-400" /> Station Profile
      </h2>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {success}
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-medium mb-1 block">
              Station Name
            </label>
            <input
              type="text"
              value={form.stationName}
              onChange={(e) =>
                setForm({ ...form, stationName: e.target.value })
              }
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-green-500/50 outline-none"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium mb-1 block">
              Owner Name
            </label>
            <input
              type="text"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-green-500/50 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium mb-1 block">
            Phone
          </label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-green-500/50 outline-none"
          />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium mb-1 block">
            Address
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-green-500/50 outline-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-medium mb-1 block">
              Service Radius (km)
            </label>
            <input
              type="number"
              value={form.serviceRadius}
              onChange={(e) =>
                setForm({ ...form, serviceRadius: e.target.value })
              }
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-green-500/50 outline-none"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium mb-1 block">
              Service Charges (₹)
            </label>
            <input
              type="number"
              value={form.serviceCharges}
              onChange={(e) =>
                setForm({ ...form, serviceCharges: e.target.value })
              }
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-green-500/50 outline-none"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-medium mb-1 block">
              Response Time (min)
            </label>
            <input
              type="number"
              value={form.estimatedResponseTime}
              onChange={(e) =>
                setForm({ ...form, estimatedResponseTime: e.target.value })
              }
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-green-500/50 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="mobileCharging"
            checked={form.mobileChargingAvailable}
            onChange={(e) =>
              setForm({ ...form, mobileChargingAvailable: e.target.checked })
            }
            className="w-4 h-4 accent-green-500"
          />
          <label htmlFor="mobileCharging" className="text-slate-300 text-sm">
            Mobile Charging Available (dispatch vehicle to user location)
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-slate-950 font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </form>

      {/* Stats Display */}
      {profile && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-white font-semibold mb-4">Station Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {profile.rating?.toFixed(1) || "0.0"}
              </p>
              <p className="text-slate-500 text-xs">Rating</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {profile.totalRatings || 0}
              </p>
              <p className="text-slate-500 text-xs">Reviews</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {profile.chargingTypes?.length || 0}
              </p>
              <p className="text-slate-500 text-xs">Charging Types</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {profile.isApproved ? "✓" : "⏳"}
              </p>
              <p className="text-slate-500 text-xs">
                {profile.isApproved ? "Approved" : "Pending"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════ CHARGING TYPES TAB ════════════════════════ */
function ChargingTypesTab({ token }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadTypes();
  }, [token]);

  const loadTypes = async () => {
    try {
      const res = await chargingStationAPI.getProfile(token);
      setTypes(res.data.chargingTypes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addType = () => {
    setTypes([
      ...types,
      {
        vehicleType: "4-wheeler",
        connectorType: "Type2",
        pricePerKwh: 10,
        available: true,
      },
    ]);
  };

  const updateType = (i, field, value) => {
    const u = [...types];
    u[i] = { ...u[i], [field]: value };
    setTypes(u);
  };

  const removeType = (i) => {
    setTypes(types.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await chargingStationAPI.updateChargingTypes(token, types);
      setSuccess("Charging types updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );

  return (
    <div className="glass rounded-xl p-6 border border-white/8 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <BatteryCharging className="w-5 h-5 text-green-400" /> Charging Types &
        Pricing
      </h2>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {success}
        </div>
      )}
      <div className="space-y-4">
        {types.map((ct, i) => (
          <div
            key={i}
            className="bg-slate-800/50 rounded-xl p-4 border border-white/5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1 block">
                  Vehicle Type
                </label>
                <select
                  value={ct.vehicleType}
                  onChange={(e) => updateType(i, "vehicleType", e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm"
                >
                  <option value="2-wheeler">🛵 2-Wheeler</option>
                  <option value="3-wheeler">🛺 3-Wheeler</option>
                  <option value="4-wheeler">🚗 4-Wheeler</option>
                  <option value="commercial">🚛 Commercial</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1 block">
                  Connector Type
                </label>
                <select
                  value={ct.connectorType}
                  onChange={(e) =>
                    updateType(i, "connectorType", e.target.value)
                  }
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm"
                >
                  <option value="Type2">Type 2 (AC)</option>
                  <option value="CCS2">CCS2 (DC Fast)</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                  <option value="GBT">GB/T</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1 block">
                  Price (₹/kWh)
                </label>
                <input
                  type="number"
                  value={ct.pricePerKwh}
                  onChange={(e) =>
                    updateType(i, "pricePerKwh", Number(e.target.value))
                  }
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ct.available}
                    onChange={(e) =>
                      updateType(i, "available", e.target.checked)
                    }
                    className="w-4 h-4 accent-green-500"
                  />
                  <span className="text-slate-300 text-sm">Available</span>
                </label>
                <button
                  onClick={() => removeType(i)}
                  className="text-red-400 hover:text-red-300 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={addType}
          className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Charging Type
        </button>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 flex items-center gap-2 bg-green-500 hover:bg-green-400 text-slate-950 font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Save Charging Types
      </button>
    </div>
  );
}

/* ════════════════════════ FEEDBACK VIEW TAB ════════════════════════ */
function FeedbackViewTab({ token, stationId }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFeedback();
  }, [stationId]);

  const loadFeedback = async () => {
    try {
      const res = await feedbackAPI.getProviderFeedback(stationId);
      setFeedback(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );

  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(
          1,
        )
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="glass rounded-xl p-6 border border-white/8">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-green-400">{avgRating}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
                />
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-1">
              {feedback.length} reviews
            </p>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = feedback.filter((f) => f.rating === star).length;
              const pct =
                feedback.length > 0 ? (count / feedback.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 w-3">{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-slate-500 w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {feedback.length === 0 ? (
        <p className="text-slate-500 text-center py-10">No feedback yet.</p>
      ) : (
        <div className="space-y-4">
          {feedback.map((f) => (
            <div
              key={f._id}
              className="glass rounded-xl p-5 border border-white/8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-medium">
                    {f.user?.name || "User"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= f.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-slate-500 text-xs">
                  {new Date(f.createdAt).toLocaleDateString()}
                </span>
              </div>
              {f.comment && (
                <p className="text-slate-300 text-sm mt-3">{f.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
