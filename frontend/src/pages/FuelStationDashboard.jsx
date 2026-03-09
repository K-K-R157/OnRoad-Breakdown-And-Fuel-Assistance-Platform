import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Fuel,
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fuelStationAPI, feedbackAPI } from "../utils/api";

const TABS = [
  {
    id: "bookings",
    label: "Receive Bookings",
    icon: <Package className="w-4 h-4" />,
  },
  {
    id: "station",
    label: "Station Profile",
    icon: <Settings className="w-4 h-4" />,
  },
  { id: "fuel-types", label: "Fuel Types", icon: <Fuel className="w-4 h-4" /> },
  { id: "feedback", label: "Feedback", icon: <Star className="w-4 h-4" /> },
];

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  preparing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "out-for-delivery": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "preparing",
  "out-for-delivery",
  "delivered",
];

export default function FuelStationDashboard() {
  const { session } = useAuth();
  const token = session?.token;
  const [activeTab, setActiveTab] = useState("bookings");

  return (
    <main className="min-h-screen bg-slate-950 pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">
            Fuel Station <span className="text-amber-400">Dashboard</span>
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your station, fuel types, and bookings
          </p>
        </div>

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
            {activeTab === "fuel-types" && <FuelTypesTab token={token} />}
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

  useEffect(() => {
    loadBookings();
  }, [token]);

  const loadBookings = async () => {
    try {
      const res = await fuelStationAPI.getRequests(token);
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

  const updateStatus = async (id, status) => {
    try {
      await fuelStationAPI.updateRequestStatus(token, id, status);
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r)),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelBooking = async (id) => {
    try {
      await fuelStationAPI.updateRequestStatus(token, id, "cancelled", {
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
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );

  const pending = requests.filter((r) => r.status === "pending");
  const active = requests.filter((r) =>
    ["confirmed", "preparing", "out-for-delivery"].includes(r.status),
  );
  const history = requests.filter((r) =>
    ["delivered", "cancelled"].includes(r.status),
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
            label: "New Orders",
            value: pending.length,
            color: "text-yellow-400",
          },
          { label: "Active", value: active.length, color: "text-blue-400" },
          {
            label: "Delivered",
            value: history.filter((r) => r.status === "delivered").length,
            color: "text-green-400",
          },
          { label: "Total", value: requests.length, color: "text-amber-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="glass rounded-xl p-4 border border-white/8"
          >
            <p className="text-slate-500 text-xs">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* New Orders */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />{" "}
            New Orders ({pending.length})
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
            Active Orders ({active.length})
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
          No bookings yet. Users will book fuel delivery from your station.
        </p>
      )}
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
  const next = getNextStatus(r.status);
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
          <div className="flex items-center gap-3 text-sm">
            <span className="text-amber-400 font-semibold">{r.fuelType}</span>
            <span className="text-slate-300">{r.quantity}L</span>
            <span className="text-amber-400 font-bold flex items-center gap-0.5">
              <IndianRupee className="w-3 h-3" />
              {r.totalPrice}
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
          {r.specialInstructions && (
            <p className="text-slate-500 text-xs mt-1 italic">
              "{r.specialInstructions}"
            </p>
          )}
        </div>
      </div>
      {!isHistory && (
        <div className="flex gap-2 mt-4 flex-wrap">
          {next && (
            <button
              onClick={() => onUpdate(r._id, next)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />{" "}
              {next === "confirmed" ? "Confirm" : `Mark ${next}`}
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
    (async () => {
      try {
        const res = await fuelStationAPI.getProfile(token);
        const d = res.data;
        setProfile(d);
        setForm({
          stationName: d.stationName || "",
          ownerName: d.ownerName || "",
          phone: d.phone || "",
          address: d.address || "",
          openingHours: d.openingHours || "",
          deliveryAvailable: d.deliveryAvailable !== false,
          deliveryRadius: d.deliveryRadius || "",
          deliveryCharges: d.deliveryCharges || "",
          minimumOrderQuantity: d.minimumOrderQuantity || "",
          latitude: d.location?.coordinates?.[1] || "",
          longitude: d.location?.coordinates?.[0] || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const saveProfile = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body = {
        stationName: form.stationName,
        ownerName: form.ownerName,
        phone: form.phone,
        address: form.address,
        openingHours: form.openingHours,
        deliveryAvailable: form.deliveryAvailable,
        deliveryRadius: Number(form.deliveryRadius) || 5,
        deliveryCharges: Number(form.deliveryCharges) || 0,
        minimumOrderQuantity: Number(form.minimumOrderQuantity) || 5,
      };
      if (form.latitude && form.longitude) {
        body.location = {
          type: "Point",
          coordinates: [Number(form.longitude), Number(form.latitude)],
        };
      }
      const res = await fuelStationAPI.updateProfile(token, body);
      setProfile(res.data);
      setSuccess("Station profile updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setForm((p) => ({
            ...p,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          })),
        () => setError("Could not detect location."),
      );
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="glass rounded-2xl p-6 border border-white/8">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" /> Station Details
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Update your station info. All details are stored in the database.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            {success}
          </div>
        )}

        {/* Approval status */}
        {profile && (
          <div
            className={`mb-6 p-3 rounded-xl border flex items-center gap-2 text-sm ${profile.isApproved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"}`}
          >
            {profile.isApproved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            {profile.isApproved
              ? "Station is approved and visible to users"
              : "Station is pending admin verification"}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Station Name
              </label>
              <input
                value={form.stationName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stationName: e.target.value }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Owner Name
              </label>
              <input
                value={form.ownerName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, ownerName: e.target.value }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Phone</label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Opening Hours
              </label>
              <input
                value={form.openingHours}
                onChange={(e) =>
                  setForm((p) => ({ ...p, openingHours: e.target.value }))
                }
                placeholder="6:00 AM - 10:00 PM"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-amber-500/50 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Address</label>
            <input
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Delivery Radius (km)
              </label>
              <input
                type="number"
                value={form.deliveryRadius}
                onChange={(e) =>
                  setForm((p) => ({ ...p, deliveryRadius: e.target.value }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Delivery Charges (₹)
              </label>
              <input
                type="number"
                value={form.deliveryCharges}
                onChange={(e) =>
                  setForm((p) => ({ ...p, deliveryCharges: e.target.value }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Min Order (L)
              </label>
              <input
                type="number"
                value={form.minimumOrderQuantity}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    minimumOrderQuantity: e.target.value,
                  }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-slate-400 text-xs">Delivery Available</label>
            <button
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  deliveryAvailable: !p.deliveryAvailable,
                }))
              }
              className={`w-12 h-6 rounded-full transition-colors ${form.deliveryAvailable ? "bg-amber-500" : "bg-slate-700"}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${form.deliveryAvailable ? "translate-x-6" : "translate-x-0.5"}`}
              />
            </button>
            <span
              className={`text-sm ${form.deliveryAvailable ? "text-amber-400" : "text-slate-500"}`}
            >
              {form.deliveryAvailable ? "Yes" : "No"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) =>
                  setForm((p) => ({ ...p, latitude: e.target.value }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) =>
                  setForm((p) => ({ ...p, longitude: e.target.value }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={detectLocation}
            className="text-sm text-amber-400 hover:text-amber-300 border border-amber-500/20 rounded-xl py-2 px-4 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 inline mr-1.5" />
            Auto-Detect Location
          </button>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Saving..." : "Update Station"}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════ FUEL TYPES TAB ════════════════════════ */
function FuelTypesTab({ token }) {
  const [fuelTypes, setFuelTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fuelStationAPI.getProfile(token);
        setFuelTypes(res.data.fuelTypes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const updateType = (i, field, value) => {
    const u = [...fuelTypes];
    u[i] = { ...u[i], [field]: value };
    setFuelTypes(u);
  };

  const addType = () =>
    setFuelTypes([...fuelTypes, { type: "Diesel", price: 0, available: true }]);
  const removeType = (i) =>
    setFuelTypes(fuelTypes.filter((_, idx) => idx !== i));

  const saveFuelTypes = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const cleaned = fuelTypes.map((f) => ({
        type: f.type,
        price: Number(f.price),
        available: f.available,
      }));
      await fuelStationAPI.updateFuelTypes(token, cleaned);
      setSuccess("Fuel types updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="glass rounded-2xl p-6 border border-white/8">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Fuel className="w-5 h-5 text-amber-400" /> Manage Fuel Types
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Add, update prices, or remove fuel types. Changes are saved to the
          database.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-3">
          {fuelTypes.map((ft, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-4 border border-white/5"
            >
              <select
                value={ft.type}
                onChange={(e) => updateType(i, "type", e.target.value)}
                className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500/50 outline-none"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
              </select>
              <div className="flex-1">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    value={ft.price}
                    onChange={(e) => updateType(i, "price", e.target.value)}
                    placeholder="Price/L"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:border-amber-500/50 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => updateType(i, "available", !ft.available)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${ft.available ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
              >
                {ft.available ? "Available" : "Unavailable"}
              </button>
              <button
                onClick={() => removeType(i)}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addType}
          className="mt-4 flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Fuel Type
        </button>

        <button
          onClick={saveFuelTypes}
          disabled={saving || fuelTypes.length === 0}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Saving..." : "Save Fuel Types"}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════ FEEDBACK TAB ════════════════════════ */
function FeedbackViewTab({ token, stationId }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!stationId) return;
    (async () => {
      try {
        const res = await feedbackAPI.getProviderFeedback(stationId);
        setFeedbacks(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [stationId]);

  const sendResponse = async (id) => {
    if (!responseText.trim()) return;
    setSending(true);
    try {
      await feedbackAPI.respond(token, id, responseText);
      setFeedbacks((prev) =>
        prev.map((f) =>
          f._id === id
            ? {
                ...f,
                response: { message: responseText, respondedAt: new Date() },
              }
            : f,
        ),
      );
      setRespondingTo(null);
      setResponseText("");
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

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 border border-white/8">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" /> Customer Reviews
        </h2>
        <p className="text-slate-400 text-sm">
          See what users are saying about your service. Respond to improve your
          reputation.
        </p>
      </div>
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {feedbacks.length === 0 && (
        <p className="text-slate-500 text-center py-10">No reviews yet.</p>
      )}
      <div className="space-y-3">
        {feedbacks.map((f) => (
          <div
            key={f._id}
            className="glass rounded-xl p-5 border border-white/8"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-semibold">
                {f.user?.name || "User"}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < f.rating ? "fill-amber-500 text-amber-500" : "text-slate-700"}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-slate-300 text-sm">{f.comment}</p>
            <p className="text-slate-600 text-xs mt-2">
              {new Date(f.createdAt).toLocaleDateString()}
            </p>
            {f.response?.message && (
              <div className="mt-3 ml-4 pl-3 border-l-2 border-amber-500/30">
                <p className="text-amber-400 text-xs font-medium mb-1">
                  Your Response
                </p>
                <p className="text-slate-300 text-sm">{f.response.message}</p>
              </div>
            )}
            {!f.response?.message &&
              (respondingTo === f._id ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Reply..."
                    className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder:text-slate-500 outline-none"
                  />
                  <button
                    onClick={() => sendResponse(f._id)}
                    disabled={sending}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Reply"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setRespondingTo(null);
                      setResponseText("");
                    }}
                    className="text-slate-400 hover:text-white px-2"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setRespondingTo(f._id)}
                  className="mt-3 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> Respond
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
