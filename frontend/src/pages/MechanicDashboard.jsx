import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  User,
  MapPin,
  Phone,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Navigation,
  Save,
  AlertCircle,
  Eye,
  Send,
  MessageSquare,
  ChevronRight,
  Briefcase,
  FileText,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { mechanicAPI, feedbackAPI } from "../utils/api";
import LiveTrackingMap from "../components/LiveTrackingMap";

const TABS = [
  {
    id: "requests",
    label: "Incoming Requests",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  {
    id: "profile",
    label: "My Details",
    icon: <Settings className="w-4 h-4" />,
  },
  {
    id: "feedback",
    label: "View Feedback",
    icon: <Star className="w-4 h-4" />,
  },
];

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  accepted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "en-route": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  arrived: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "in-progress": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_FLOW = [
  "pending",
  "accepted",
  "en-route",
  "arrived",
  "in-progress",
  "completed",
];

export default function MechanicDashboard() {
  const { session } = useAuth();
  const token = session?.token;
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(location.search);
    return p.get("tab") || "requests";
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
            Mechanic <span className="text-emerald-400">Dashboard</span>
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your requests, profile, and feedback
          </p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-slate-950"
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
            {activeTab === "requests" && <RequestsTab token={token} />}
            {activeTab === "profile" && <ProfileTab token={token} />}
            {activeTab === "feedback" && (
              <FeedbackTab token={token} mechanicId={session?.user?._id} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ════════════════════════ REQUESTS TAB ════════════════════════ */
function RequestsTab({ token }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackingReq, setTrackingReq] = useState(null);
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    loadRequests();
    // Detect mechanic's location for tracking
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
      );
    }
  }, [token]);

  const loadRequests = async () => {
    try {
      const res = await mechanicAPI.getRequests(token);
      setRequests(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await mechanicAPI.updateRequestStatus(token, id, status);
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r)),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelRequest = async (id) => {
    try {
      await mechanicAPI.updateRequestStatus(token, id, "cancelled", {
        cancellationReason: "Cancelled by mechanic",
      });
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "cancelled" } : r)),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const getNextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx >= 0 && idx < STATUS_FLOW.length - 1
      ? STATUS_FLOW[idx + 1]
      : null;
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );

  const pending = requests.filter((r) => r.status === "pending");
  const active = requests.filter((r) =>
    ["accepted", "en-route", "arrived", "in-progress"].includes(r.status),
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
            bg: "bg-yellow-500/10",
          },
          {
            label: "Active",
            value: active.length,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Completed",
            value: history.filter((r) => r.status === "completed").length,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
          {
            label: "Total",
            value: requests.length,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
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

      {/* New Requests */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            New Requests ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((r) => (
              <RequestCard
                key={r._id}
                request={r}
                onUpdateStatus={updateStatus}
                onCancel={cancelRequest}
                onTrack={() => setTrackingReq(r)}
                getNextStatus={getNextStatus}
                userLoc={userLoc}
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
              <RequestCard
                key={r._id}
                request={r}
                onUpdateStatus={updateStatus}
                onCancel={cancelRequest}
                onTrack={() => setTrackingReq(r)}
                getNextStatus={getNextStatus}
                userLoc={userLoc}
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
              <RequestCard
                key={r._id}
                request={r}
                onUpdateStatus={updateStatus}
                onCancel={cancelRequest}
                onTrack={() => setTrackingReq(r)}
                getNextStatus={getNextStatus}
                userLoc={userLoc}
                isHistory
              />
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <p className="text-slate-500 text-center py-10">
          No requests yet. Users will send requests when they need help.
        </p>
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
                  Navigate to {trackingReq.user?.name || "User"}
                </h3>
                <button
                  onClick={() => setTrackingReq(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
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
                  providerLocation={userLoc}
                  providerName="You"
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

function RequestCard({
  request: r,
  onUpdateStatus,
  onCancel,
  onTrack,
  getNextStatus,
  userLoc,
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
          <p className="text-slate-300 text-sm">{r.problemDescription}</p>
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
        </div>
      </div>
      {!isHistory && (
        <div className="flex gap-2 mt-4 flex-wrap">
          {next && (
            <button
              onClick={() => onUpdateStatus(r._id, next)}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />{" "}
              {next === "accepted" ? "Accept" : `Mark ${next}`}
            </button>
          )}
          {r.location &&
            ["accepted", "en-route", "arrived", "in-progress"].includes(
              r.status,
            ) && (
              <button
                onClick={onTrack}
                className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm px-4 py-2 rounded-xl hover:bg-blue-500/20 transition-colors"
              >
                <Navigation className="w-4 h-4" /> Navigate
              </button>
            )}
          {["pending", "accepted"].includes(r.status) && (
            <button
              onClick={() => onCancel(r._id)}
              className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-sm px-4 py-2 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Decline
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

/* ════════════════════════ PROFILE TAB ════════════════════════ */
function ProfileTab({ token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await mechanicAPI.getProfile(token);
        setProfile(res.data);
        setEditForm({
          name: res.data.name || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
          servicesOffered: (res.data.servicesOffered || []).join(", "),
          experience: res.data.experience || 0,
          availability: res.data.availability !== false,
          serviceRadius: res.data.serviceRadius || 10,
          latitude: res.data.location?.coordinates?.[1] || "",
          longitude: res.data.location?.coordinates?.[0] || "",
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
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        servicesOffered: editForm.servicesOffered
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experience: Number(editForm.experience),
        availability: editForm.availability,
        serviceRadius: Number(editForm.serviceRadius) || 10,
      };
      if (editForm.latitude && editForm.longitude) {
        body.location = {
          type: "Point",
          coordinates: [Number(editForm.longitude), Number(editForm.latitude)],
        };
      }
      const res = await mechanicAPI.updateProfile(token, body);
      setProfile(res.data);
      setSuccess("Profile updated successfully!");
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
          setEditForm((p) => ({
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
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="glass rounded-2xl p-6 border border-white/8">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" /> Post / Update
          Details
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Keep your details up to date so users can find and contact you.
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
              ? "Your account is approved and visible to users"
              : "Your account is pending admin approval"}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">
              Full Name
            </label>
            <input
              value={editForm.name}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Phone</label>
              <input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Experience (years)
              </label>
              <input
                type="number"
                value={editForm.experience}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, experience: e.target.value }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">
              Service Radius (km) — how far you're willing to travel
            </label>
            <input
              type="number"
              min="1"
              value={editForm.serviceRadius}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, serviceRadius: e.target.value }))
              }
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Address</label>
            <input
              value={editForm.address}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, address: e.target.value }))
              }
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">
              Services Offered (comma separated)
            </label>
            <input
              value={editForm.servicesOffered}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, servicesOffered: e.target.value }))
              }
              placeholder="Flat Tyre, Engine Repair, Battery Jumpstart, Towing"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-emerald-500/50 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={editForm.latitude}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, latitude: e.target.value }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={editForm.longitude}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, longitude: e.target.value }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={detectLocation}
            className="text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded-xl py-2 px-4 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 inline mr-1.5" />
            Auto-Detect Location
          </button>
          <div className="flex items-center gap-3">
            <label className="text-slate-400 text-xs">Availability</label>
            <button
              onClick={() =>
                setEditForm((p) => ({ ...p, availability: !p.availability }))
              }
              className={`w-12 h-6 rounded-full transition-colors ${editForm.availability ? "bg-emerald-500" : "bg-slate-700"}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${editForm.availability ? "translate-x-6" : "translate-x-0.5"}`}
              />
            </button>
            <span
              className={`text-sm ${editForm.availability ? "text-emerald-400" : "text-slate-500"}`}
            >
              {editForm.availability ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Saving..." : "Save Details"}
        </button>
      </div>

      {/* Current stats */}
      {profile && (
        <div className="glass rounded-2xl p-6 border border-white/8">
          <h3 className="text-white font-semibold mb-3">Your Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">
                {(profile.rating || 0).toFixed(1)}
              </p>
              <p className="text-slate-500 text-xs">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {profile.totalRatings || 0}
              </p>
              <p className="text-slate-500 text-xs">Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {profile.experience || 0}
              </p>
              <p className="text-slate-500 text-xs">Years Exp.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════ FEEDBACK TAB ════════════════════════ */
function FeedbackTab({ token, mechanicId }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!mechanicId) return;
    (async () => {
      try {
        const res = await feedbackAPI.getProviderFeedback(mechanicId);
        setFeedbacks(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [mechanicId]);

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
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 border border-white/8">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" /> Customer Feedback
        </h2>
        <p className="text-slate-400 text-sm">
          View ratings and reviews from your customers. Respond to feedback to
          build trust.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {feedbacks.length === 0 && (
        <p className="text-slate-500 text-center py-10">
          No feedback yet. Complete service requests to receive reviews.
        </p>
      )}

      <div className="space-y-3">
        {feedbacks.map((f) => (
          <div
            key={f._id}
            className="glass rounded-xl p-5 border border-white/8"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">
                    {f.user?.name || "Anonymous"}
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
              </div>
            </div>
            {f.response?.message && (
              <div className="mt-3 ml-4 pl-3 border-l-2 border-emerald-500/30">
                <p className="text-emerald-400 text-xs font-medium mb-1">
                  Your Response
                </p>
                <p className="text-slate-300 text-sm">{f.response.message}</p>
              </div>
            )}
            {!f.response?.message && (
              <>
                {respondingTo === f._id ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write your response..."
                      className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder:text-slate-500 focus:border-emerald-500/50 outline-none"
                    />
                    <button
                      onClick={() => sendResponse(f._id)}
                      disabled={sending}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
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
                    className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" /> Respond
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
