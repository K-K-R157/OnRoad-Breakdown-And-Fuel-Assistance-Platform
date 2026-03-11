import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Wrench,
  Fuel,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  Star,
  Loader2,
  Eye,
  Shield,
  ChevronDown,
  ChevronUp,
  FileText,
  IndianRupee,
  BarChart3,
  ThumbsDown,
  User,
  Save,
  Ban,
  ArrowLeft,
  Mail,
  MessageSquare,
} from "lucide-react";
import { adminAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    id: "mechanics",
    label: "Approve Mechanics",
    icon: <Wrench className="w-4 h-4" />,
  },
  {
    id: "stations",
    label: "Approve Fuel Stations",
    icon: <Fuel className="w-4 h-4" />,
  },
];

export default function AdminDashboard() {
  const { session } = useAuth();
  const token = session?.token;
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(location.search);
    return p.get("tab") || "overview";
  });

  useEffect(() => {
    const tab =
      new URLSearchParams(location.search).get("tab") || location.state?.tab;
    if (tab) setActiveTab(tab);
  }, [location]);

  return (
    <main className="min-h-screen bg-slate-950 pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">
              Admin <span className="text-emerald-400">Panel</span>
            </h1>
            <p className="text-slate-400 text-sm">
              Approve or reject service providers
            </p>
          </div>
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
            {activeTab === "overview" && <OverviewTab token={token} />}
            {activeTab === "mechanics" && <MechanicsTab token={token} />}
            {activeTab === "stations" && <StationsTab token={token} />}
            {activeTab === "profile" && <AdminProfileTab token={token} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ════════════════════════ OVERVIEW TAB ════════════════════════ */
function OverviewTab({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [listData, setListData] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const refreshStats = async () => {
    try {
      const r = await adminAPI.getDashboard(token);
      setStats(r.data);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.getDashboard(token);
        setStats(res.data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const fetcherMap = {
    users: () => adminAPI.getAllUsers(token),
    mechanics: () => adminAPI.getAllMechanics(token),
    fuelStations: () => adminAPI.getAllFuelStations(token),
    pendingMechanics: () => adminAPI.getPendingMechanics(token),
    pendingFuelStations: () => adminAPI.getPendingFuelStations(token),
    activeMechanicRequests: () => adminAPI.getActiveMechanicRequests(token),
    activeFuelRequests: () => adminAPI.getActiveFuelRequests(token),
    feedbackCount: () => adminAPI.getAllFeedback(token),
  };

  const fetchList = async (key) => {
    if (selectedCard === key) {
      setSelectedCard(null);
      setListData([]);
      return;
    }
    setSelectedCard(key);
    setListLoading(true);
    try {
      const res = await fetcherMap[key]();
      setListData(res.data || []);
    } catch {
      setListData([]);
    } finally {
      setListLoading(false);
    }
  };

  const handleRevoke = async (type, id) => {
    setActionLoading(id);
    try {
      if (type === "mechanics") await adminAPI.revokeMechanic(token, id);
      else await adminAPI.revokeFuelStation(token, id);
      setListData((prev) =>
        prev.map((item) =>
          item._id === id
            ? { ...item, isApproved: false, isVerified: false }
            : item,
        ),
      );
      await refreshStats();
    } catch {
      /* silent */
    } finally {
      setActionLoading(null);
    }
  };

  const handleReview = async (type, id, action) => {
    setActionLoading(id);
    try {
      if (type === "pendingMechanics")
        await adminAPI.reviewMechanic(token, id, action);
      else await adminAPI.reviewFuelStation(token, id, action);
      setListData((prev) => prev.filter((item) => item._id !== id));
      await refreshStats();
    } catch {
      /* silent */
    } finally {
      setActionLoading(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  if (!stats)
    return (
      <p className="text-red-400 text-center py-10">
        Failed to load dashboard stats.
      </p>
    );

  const cards = [
    {
      key: "users",
      label: "Registered Users",
      value: stats.users,
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      ring: "ring-blue-500/40",
    },
    {
      key: "mechanics",
      label: "Mechanics",
      value: stats.mechanics,
      icon: <Wrench className="w-5 h-5" />,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      ring: "ring-amber-500/40",
    },
    {
      key: "fuelStations",
      label: "Fuel Stations",
      value: stats.fuelStations,
      icon: <Fuel className="w-5 h-5" />,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      ring: "ring-purple-500/40",
    },
    {
      key: "pendingMechanics",
      label: "Pending Mechanics",
      value: stats.pendingMechanics,
      icon: <Clock className="w-5 h-5" />,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      ring: "ring-yellow-500/40",
    },
    {
      key: "pendingFuelStations",
      label: "Pending Stations",
      value: stats.pendingFuelStations,
      icon: <Clock className="w-5 h-5" />,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      ring: "ring-orange-500/40",
    },
    {
      key: "activeMechanicRequests",
      label: "Active Mechanic Requests",
      value: stats.activeMechanicRequests,
      icon: <Activity className="w-5 h-5" />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      ring: "ring-emerald-500/40",
    },
    {
      key: "activeFuelRequests",
      label: "Active Fuel Requests",
      value: stats.activeFuelRequests,
      icon: <Activity className="w-5 h-5" />,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      ring: "ring-cyan-500/40",
    },
    {
      key: "feedbackCount",
      label: "Total Feedback",
      value: stats.feedbackCount,
      icon: <Star className="w-5 h-5" />,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
      ring: "ring-pink-500/40",
    },
  ];

  const listTitles = {
    users: "All Registered Users",
    mechanics: "All Mechanics",
    fuelStations: "All Fuel Stations",
    pendingMechanics: "Pending Mechanic Approvals",
    pendingFuelStations: "Pending Fuel Station Approvals",
    activeMechanicRequests: "Active Mechanic Requests",
    activeFuelRequests: "Active Fuel Requests",
    feedbackCount: "All Feedback",
  };

  const renderList = () => {
    if (listLoading)
      return (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      );
    if (listData.length === 0)
      return (
        <p className="text-slate-500 text-center py-8">No records found.</p>
      );

    switch (selectedCard) {
      case "users":
        return <UsersList data={listData} />;
      case "mechanics":
        return (
          <MechanicsList
            data={listData}
            onRevoke={(id) => handleRevoke("mechanics", id)}
            actionLoading={actionLoading}
          />
        );
      case "fuelStations":
        return (
          <StationsList
            data={listData}
            onRevoke={(id) => handleRevoke("fuelStations", id)}
            actionLoading={actionLoading}
          />
        );
      case "pendingMechanics":
        return (
          <PendingMechanicsList
            data={listData}
            onReview={(id, action) =>
              handleReview("pendingMechanics", id, action)
            }
            actionLoading={actionLoading}
          />
        );
      case "pendingFuelStations":
        return (
          <PendingStationsList
            data={listData}
            onReview={(id, action) =>
              handleReview("pendingFuelStations", id, action)
            }
            actionLoading={actionLoading}
          />
        );
      case "activeMechanicRequests":
        return <ActiveMechanicRequestsList data={listData} />;
      case "activeFuelRequests":
        return <ActiveFuelRequestsList data={listData} />;
      case "feedbackCount":
        return <FeedbackList data={listData} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const active = selectedCard === c.key;
          return (
            <div
              key={c.key}
              onClick={() => fetchList(c.key)}
              className={`glass rounded-xl p-5 border ${c.border} transition-all cursor-pointer hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] ${active ? `ring-2 ${c.ring}` : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ${c.color} mb-3`}
              >
                {c.icon}
              </div>
              <p className="text-slate-500 text-xs">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-[10px] text-slate-600 mt-1">
                Click to view all
              </p>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedCard && (
          <motion.div
            key={selectedCard}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl border border-white/8 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white">
                  {listTitles[selectedCard]}
                </h3>
                <button
                  onClick={() => {
                    setSelectedCard(null);
                    setListData([]);
                  }}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>
              {renderList()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Users list ── */
function UsersList({ data }) {
  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
      {data.map((u) => (
        <div
          key={u._id}
          className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-white/5"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
            {u.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{u.name}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {u.email}
              </span>
              {u.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {u.phone}
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-600">
            {new Date(u.createdAt).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── All Mechanics list (with revoke) ── */
function MechanicsList({ data, onRevoke, actionLoading }) {
  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
      {data.map((m) => (
        <div
          key={m._id}
          className="p-4 rounded-xl bg-slate-800/40 border border-white/5"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
              {m.name?.charAt(0)?.toUpperCase() || "M"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-medium truncate">{m.name}</p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.isApproved
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  }`}
                >
                  {m.isApproved ? "APPROVED" : "PENDING"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap mt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {m.email}
                </span>
                {m.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {m.phone}
                  </span>
                )}
                {m.specialization && (
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    {m.specialization}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-slate-600">
                {new Date(m.createdAt).toLocaleDateString()}
              </span>
              {m.isApproved && (
                <button
                  onClick={() => onRevoke(m._id)}
                  disabled={actionLoading === m._id}
                  className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  {actionLoading === m._id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Ban className="w-3 h-3" />
                  )}
                  Revoke
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── All Fuel Stations list (with revoke) ── */
function StationsList({ data, onRevoke, actionLoading }) {
  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
      {data.map((s) => (
        <div
          key={s._id}
          className="p-4 rounded-xl bg-slate-800/40 border border-white/5"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm shrink-0">
              {(s.stationName || s.name)?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-medium truncate">
                  {s.stationName || s.name}
                </p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.isApproved
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  }`}
                >
                  {s.isApproved ? "APPROVED" : "PENDING"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap mt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {s.email}
                </span>
                {s.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {s.phone}
                  </span>
                )}
                {s.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {s.address}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-slate-600">
                {new Date(s.createdAt).toLocaleDateString()}
              </span>
              {s.isApproved && (
                <button
                  onClick={() => onRevoke(s._id)}
                  disabled={actionLoading === s._id}
                  className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  {actionLoading === s._id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Ban className="w-3 h-3" />
                  )}
                  Revoke
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Pending Mechanics list (with expandable details + approve/reject) ── */
function PendingMechanicsList({ data, onReview, actionLoading }) {
  const [expandedId, setExpandedId] = useState(null);
  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      {data.map((m) => (
        <div
          key={m._id}
          className="rounded-xl bg-slate-800/40 border border-white/5 overflow-hidden"
        >
          <div
            className="p-4 flex items-start justify-between gap-4 cursor-pointer"
            onClick={() => setExpandedId(expandedId === m._id ? null : m._id)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-sm shrink-0">
                {m.name?.charAt(0)?.toUpperCase() || "M"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium truncate">{m.name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    PENDING
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap mt-0.5">
                  {m.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {m.phone}
                    </span>
                  )}
                  {m.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {m.address}
                    </span>
                  )}
                  {m.experience && <span>{m.experience} yrs exp</span>}
                </div>
              </div>
            </div>
            <div className="text-slate-500 shrink-0">
              {expandedId === m._id ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {expandedId === m._id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Detail label="Email" value={m.email} />
                    <Detail label="License" value={m.licenseNumber || "N/A"} />
                    <Detail
                      label="Services"
                      value={m.services?.join(", ") || "N/A"}
                    />
                    <Detail
                      label="Experience"
                      value={m.experience ? `${m.experience} years` : "N/A"}
                    />
                    <Detail
                      label="Specialization"
                      value={m.specialization || "N/A"}
                    />
                    <Detail
                      label="Rating"
                      value={
                        m.rating
                          ? `${m.rating}/5 (${m.totalReviews || 0} reviews)`
                          : "New"
                      }
                    />
                    <Detail
                      label="Location"
                      value={
                        m.location?.coordinates
                          ? `${m.location.coordinates[1]}, ${m.location.coordinates[0]}`
                          : "N/A"
                      }
                    />
                    <Detail
                      label="Registered"
                      value={new Date(m.createdAt).toLocaleDateString()}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => onReview(m._id, "approve")}
                      disabled={actionLoading === m._id}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-sm"
                    >
                      {actionLoading === m._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}{" "}
                      Approve
                    </button>
                    <button
                      onClick={() => onReview(m._id, "reject")}
                      disabled={actionLoading === m._id}
                      className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-5 py-2 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50 text-sm"
                    >
                      {actionLoading === m._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}{" "}
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ── Pending Stations list (with expandable details + approve/reject) ── */
function PendingStationsList({ data, onReview, actionLoading }) {
  const [expandedId, setExpandedId] = useState(null);
  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      {data.map((s) => (
        <div
          key={s._id}
          className="rounded-xl bg-slate-800/40 border border-white/5 overflow-hidden"
        >
          <div
            className="p-4 flex items-start justify-between gap-4 cursor-pointer"
            onClick={() => setExpandedId(expandedId === s._id ? null : s._id)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">
                {(s.stationName || s.name)?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium truncate">
                    {s.stationName || s.name}
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    PENDING
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap mt-0.5">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {s.ownerName || "—"}
                  </span>
                  {s.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {s.phone}
                    </span>
                  )}
                  {s.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {s.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-slate-500 shrink-0">
              {expandedId === s._id ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {expandedId === s._id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Detail label="Email" value={s.email} />
                    <Detail label="License" value={s.licenseNumber || "N/A"} />
                    <Detail label="Owner" value={s.ownerName || "N/A"} />
                    <Detail
                      label="Opening Hours"
                      value={s.openingHours || "N/A"}
                    />
                    <Detail
                      label="Delivery"
                      value={
                        s.deliveryAvailable
                          ? `Yes (${s.deliveryRadius || 5} km)`
                          : "No"
                      }
                    />
                    <Detail
                      label="Delivery Charges"
                      value={
                        s.deliveryCharges ? `₹${s.deliveryCharges}` : "Free"
                      }
                    />
                    <Detail
                      label="Location"
                      value={
                        s.location?.coordinates
                          ? `${s.location.coordinates[1]}, ${s.location.coordinates[0]}`
                          : "N/A"
                      }
                    />
                    <Detail
                      label="Registered"
                      value={new Date(s.createdAt).toLocaleDateString()}
                    />
                  </div>
                  {s.fuelTypes?.length > 0 && (
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Fuel Types</p>
                      <div className="flex flex-wrap gap-2">
                        {s.fuelTypes.map((ft, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-sm text-white flex items-center gap-1"
                          >
                            {ft.type} — <IndianRupee className="w-3 h-3" />
                            {ft.price}/L
                            <span
                              className={`text-[9px] ml-1 ${ft.available ? "text-emerald-400" : "text-red-400"}`}
                            >
                              {ft.available ? "avail" : "out"}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => onReview(s._id, "approve")}
                      disabled={actionLoading === s._id}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-sm"
                    >
                      {actionLoading === s._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}{" "}
                      Approve
                    </button>
                    <button
                      onClick={() => onReview(s._id, "reject")}
                      disabled={actionLoading === s._id}
                      className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-5 py-2 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50 text-sm"
                    >
                      {actionLoading === s._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}{" "}
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ── Active Mechanic Requests list ── */
function ActiveMechanicRequestsList({ data }) {
  const statusColors = {
    pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    accepted: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    "en-route": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    arrived: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    "in-progress": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };
  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
      {data.map((r) => (
        <div
          key={r._id}
          className="p-4 rounded-xl bg-slate-800/40 border border-white/5"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-white font-medium">
                  {r.user?.name || "User"}
                </span>
                <span className="text-slate-600">→</span>
                <span className="text-amber-400 font-medium">
                  {r.mechanic?.name || "Mechanic"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[r.status] || "text-slate-400 bg-slate-500/10 border-slate-500/20"}`}
                >
                  {r.status?.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {r.problemDescription}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                {r.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {r.address}
                  </span>
                )}
                <span>{new Date(r.createdAt).toLocaleString()}</span>
                {r.estimatedCost > 0 && (
                  <span className="flex items-center gap-0.5">
                    <IndianRupee className="w-3 h-3" />
                    {r.estimatedCost}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Active Fuel Requests list ── */
function ActiveFuelRequestsList({ data }) {
  const statusColors = {
    pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    confirmed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    preparing: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    "out-for-delivery": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  };
  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
      {data.map((r) => (
        <div
          key={r._id}
          className="p-4 rounded-xl bg-slate-800/40 border border-white/5"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-white font-medium">
                  {r.user?.name || "User"}
                </span>
                <span className="text-slate-600">→</span>
                <span className="text-purple-400 font-medium">
                  {r.fuelStation?.stationName ||
                    r.fuelStation?.name ||
                    "Station"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[r.status] || "text-slate-400 bg-slate-500/10 border-slate-500/20"}`}
                >
                  {r.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Fuel className="w-3 h-3" />
                  {r.fuelType} · {r.quantity}L
                </span>
                <span className="flex items-center gap-0.5">
                  <IndianRupee className="w-3 h-3" />
                  {r.totalPrice}
                </span>
                {r.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {r.address}
                  </span>
                )}
                <span>{new Date(r.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Feedback list ── */
function FeedbackList({ data }) {
  const renderStars = (n) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < n ? "text-yellow-400 fill-yellow-400" : "text-slate-700"}`}
      />
    ));
  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
      {data.map((f) => (
        <div
          key={f._id}
          className="p-4 rounded-xl bg-slate-800/40 border border-white/5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-xs shrink-0">
              {f.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-white font-medium text-sm">
                  {f.user?.name || "User"}
                </span>
                <span className="text-slate-600 text-xs">→</span>
                <span className="text-slate-400 text-sm">
                  {f.serviceProvider?.stationName ||
                    f.serviceProvider?.name ||
                    "Provider"}
                </span>
                <span className="text-[10px] text-slate-600 px-1.5 py-0.5 rounded bg-slate-800 border border-white/5">
                  {f.serviceType}
                </span>
              </div>
              <div className="flex items-center gap-0.5 mb-1">
                {renderStars(f.rating)}
              </div>
              {f.comment && (
                <p className="text-xs text-slate-500 line-clamp-2">
                  {f.comment}
                </p>
              )}
              <span className="text-[10px] text-slate-600 mt-1 block">
                {new Date(f.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════ MECHANICS TAB ════════════════════════ */
function MechanicsTab({ token }) {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.getPendingMechanics(token);
        setMechanics(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleReview = async (id, action) => {
    setActionLoading(id);
    try {
      await adminAPI.reviewMechanic(token, id, action);
      setMechanics((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
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
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" /> Pending Mechanic
          Approvals
        </h2>
        <p className="text-slate-400 text-sm">
          Review and verify mechanic licensing before approval.{" "}
          {mechanics.length} pending.
        </p>
      </div>
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {mechanics.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
          <p className="text-slate-400">All mechanics have been reviewed!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mechanics.map((m) => (
            <div
              key={m._id}
              className="glass rounded-xl border border-white/8 overflow-hidden"
            >
              {/* Header row */}
              <div
                className="p-5 flex items-start justify-between gap-4 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === m._id ? null : m._id)
                }
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-lg">
                      {m.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      PENDING
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-400 flex-wrap">
                    {m.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {m.phone}
                      </span>
                    )}
                    {m.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {m.address}
                      </span>
                    )}
                    {m.experience && <span>{m.experience} yrs exp</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  {expandedId === m._id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {expandedId === m._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Detail label="Email" value={m.email} />
                        <Detail
                          label="License"
                          value={m.licenseNumber || "N/A"}
                        />
                        <Detail
                          label="Services"
                          value={m.services?.join(", ") || "N/A"}
                        />
                        <Detail
                          label="Experience"
                          value={m.experience ? `${m.experience} years` : "N/A"}
                        />
                        <Detail
                          label="Rating"
                          value={
                            m.rating
                              ? `${m.rating}/5 (${m.totalReviews || 0} reviews)`
                              : "New"
                          }
                        />
                        <Detail
                          label="Location"
                          value={
                            m.location?.coordinates
                              ? `${m.location.coordinates[1]}, ${m.location.coordinates[0]}`
                              : "N/A"
                          }
                        />
                        <Detail
                          label="Registered"
                          value={new Date(m.createdAt).toLocaleDateString()}
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleReview(m._id, "approve")}
                          disabled={actionLoading === m._id}
                          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                          {actionLoading === m._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}{" "}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(m._id, "reject")}
                          disabled={actionLoading === m._id}
                          className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === m._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}{" "}
                          Reject
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════ FUEL STATIONS TAB ════════════════════════ */
function StationsTab({ token }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.getPendingFuelStations(token);
        setStations(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleReview = async (id, action) => {
    setActionLoading(id);
    try {
      await adminAPI.reviewFuelStation(token, id, action);
      setStations((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
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
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Fuel className="w-5 h-5 text-purple-400" /> Pending Fuel Station
          Approvals
        </h2>
        <p className="text-slate-400 text-sm">
          Verify fuel station details before making them visible to users.{" "}
          {stations.length} pending.
        </p>
      </div>
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {stations.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
          <p className="text-slate-400">
            All fuel stations have been reviewed!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {stations.map((s) => (
            <div
              key={s._id}
              className="glass rounded-xl border border-white/8 overflow-hidden"
            >
              <div
                className="p-5 flex items-start justify-between gap-4 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === s._id ? null : s._id)
                }
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-lg">
                      {s.stationName || s.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      PENDING
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {s.ownerName || "—"}
                    </span>
                    {s.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {s.phone}
                      </span>
                    )}
                    {s.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {s.address}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  {expandedId === s._id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === s._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Detail label="Email" value={s.email} />
                        <Detail
                          label="License"
                          value={s.licenseNumber || "N/A"}
                        />
                        <Detail label="Owner" value={s.ownerName || "N/A"} />
                        <Detail
                          label="Opening Hours"
                          value={s.openingHours || "N/A"}
                        />
                        <Detail
                          label="Delivery"
                          value={
                            s.deliveryAvailable
                              ? `Yes (${s.deliveryRadius || 5} km)`
                              : "No"
                          }
                        />
                        <Detail
                          label="Delivery Charges"
                          value={
                            s.deliveryCharges ? `₹${s.deliveryCharges}` : "Free"
                          }
                        />
                        <Detail
                          label="Location"
                          value={
                            s.location?.coordinates
                              ? `${s.location.coordinates[1]}, ${s.location.coordinates[0]}`
                              : "N/A"
                          }
                        />
                        <Detail
                          label="Registered"
                          value={new Date(s.createdAt).toLocaleDateString()}
                        />
                      </div>
                      {/* Fuel types */}
                      {s.fuelTypes?.length > 0 && (
                        <div>
                          <p className="text-slate-500 text-xs mb-1">
                            Fuel Types
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {s.fuelTypes.map((ft, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-sm text-white flex items-center gap-1"
                              >
                                {ft.type} — <IndianRupee className="w-3 h-3" />
                                {ft.price}/L
                                <span
                                  className={`text-[9px] ml-1 ${ft.available ? "text-emerald-400" : "text-red-400"}`}
                                >
                                  {ft.available ? "avail" : "out"}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleReview(s._id, "approve")}
                          disabled={actionLoading === s._id}
                          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                          {actionLoading === s._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}{" "}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(s._id, "reject")}
                          disabled={actionLoading === s._id}
                          className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === s._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}{" "}
                          Reject
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────── Shared Detail component ────── */
function Detail({ label, value }) {
  return (
    <div>
      <p className="text-slate-600 text-xs">{label}</p>
      <p className="text-slate-300">{value}</p>
    </div>
  );
}

/* ════════════════════════ ADMIN PROFILE TAB ════════════════════════ */
function AdminProfileTab({ token }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminAPI.getProfile(token);
        setProfile(data);
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      } catch (e) {
        setMsg({ type: "error", text: e.message });
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const { data } = await adminAPI.updateProfile(token, form);
      setProfile(data);
      setMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-3xl font-bold text-slate-950">
          {profile?.name?.charAt(0)?.toUpperCase() || "A"}
        </div>
        <p className="text-slate-400 text-sm">{profile?.email}</p>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          Admin
        </span>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm text-slate-400 mb-1 block">Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400 mb-1 block">Phone</span>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400 mb-1 block">Address</span>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none resize-none h-24"
          />
        </label>
      </div>

      {msg && (
        <div
          className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl ${
            msg.type === "success"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {msg.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
