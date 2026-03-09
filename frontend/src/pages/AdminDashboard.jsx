import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Wrench, Fuel, Activity, CheckCircle2, XCircle, Clock,
  AlertCircle, MapPin, Phone, Star, Loader2, Eye, Shield, ChevronDown,
  ChevronUp, FileText, IndianRupee, BarChart3, ThumbsDown,
} from "lucide-react";
import { adminAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "mechanics", label: "Approve Mechanics", icon: <Wrench className="w-4 h-4" /> },
  { id: "stations", label: "Approve Fuel Stations", icon: <Fuel className="w-4 h-4" /> },
];

export default function AdminDashboard() {
  const { session } = useAuth();
  const token = session?.token;
  const [activeTab, setActiveTab] = useState("overview");

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
            <p className="text-slate-400 text-sm">Approve or reject service providers</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800/50 border border-white/8 text-slate-400 hover:text-white hover:border-white/20"}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === "overview" && <OverviewTab token={token} />}
            {activeTab === "mechanics" && <MechanicsTab token={token} />}
            {activeTab === "stations" && <StationsTab token={token} />}
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

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.getDashboard(token);
        setStats(res.data);
      } catch { setStats(null); }
      finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
  if (!stats) return <p className="text-red-400 text-center py-10">Failed to load dashboard stats.</p>;

  const cards = [
    { label: "Registered Users", value: stats.users, icon: <Users className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Mechanics", value: stats.mechanics, icon: <Wrench className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: "Fuel Stations", value: stats.fuelStations, icon: <Fuel className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { label: "Pending Mechanics", value: stats.pendingMechanics, icon: <Clock className="w-5 h-5" />, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "Pending Stations", value: stats.pendingFuelStations, icon: <Clock className="w-5 h-5" />, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { label: "Active Mechanic Requests", value: stats.activeMechanicRequests, icon: <Activity className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Active Fuel Requests", value: stats.activeFuelRequests, icon: <Activity className="w-5 h-5" />, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { label: "Total Feedback", value: stats.feedbackCount, icon: <Star className="w-5 h-5" />, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`glass rounded-xl p-5 border ${c.border}`}>
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ${c.color} mb-3`}>
            {c.icon}
          </div>
          <p className="text-slate-500 text-xs">{c.label}</p>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
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
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    })();
  }, [token]);

  const handleReview = async (id, action) => {
    setActionLoading(id);
    try {
      await adminAPI.reviewMechanic(token, id, action);
      setMechanics(prev => prev.filter(m => m._id !== id));
    } catch (err) { setError(err.message); }
    finally { setActionLoading(null); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 border border-white/8">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2"><Wrench className="w-5 h-5 text-amber-400" /> Pending Mechanic Approvals</h2>
        <p className="text-slate-400 text-sm">Review and verify mechanic licensing before approval. {mechanics.length} pending.</p>
      </div>
      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {mechanics.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
          <p className="text-slate-400">All mechanics have been reviewed!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mechanics.map((m) => (
            <div key={m._id} className="glass rounded-xl border border-white/8 overflow-hidden">
              {/* Header row */}
              <div className="p-5 flex items-start justify-between gap-4 cursor-pointer" onClick={() => setExpandedId(expandedId === m._id ? null : m._id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-lg">{m.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">PENDING</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-400 flex-wrap">
                    {m.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{m.phone}</span>}
                    {m.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{m.address}</span>}
                    {m.experience && <span>{m.experience} yrs exp</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  {expandedId === m._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {expandedId === m._id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Detail label="Email" value={m.email} />
                        <Detail label="License" value={m.licenseNumber || "N/A"} />
                        <Detail label="Services" value={m.services?.join(", ") || "N/A"} />
                        <Detail label="Experience" value={m.experience ? `${m.experience} years` : "N/A"} />
                        <Detail label="Rating" value={m.rating ? `${m.rating}/5 (${m.totalReviews || 0} reviews)` : "New"} />
                        <Detail label="Location" value={m.location?.coordinates ? `${m.location.coordinates[1]}, ${m.location.coordinates[0]}` : "N/A"} />
                        <Detail label="Registered" value={new Date(m.createdAt).toLocaleDateString()} />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => handleReview(m._id, "approve")} disabled={actionLoading === m._id}
                          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                          {actionLoading === m._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
                        </button>
                        <button onClick={() => handleReview(m._id, "reject")} disabled={actionLoading === m._id}
                          className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50">
                          {actionLoading === m._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
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
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    })();
  }, [token]);

  const handleReview = async (id, action) => {
    setActionLoading(id);
    try {
      await adminAPI.reviewFuelStation(token, id, action);
      setStations(prev => prev.filter(s => s._id !== id));
    } catch (err) { setError(err.message); }
    finally { setActionLoading(null); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 border border-white/8">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2"><Fuel className="w-5 h-5 text-purple-400" /> Pending Fuel Station Approvals</h2>
        <p className="text-slate-400 text-sm">Verify fuel station details before making them visible to users. {stations.length} pending.</p>
      </div>
      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {stations.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
          <p className="text-slate-400">All fuel stations have been reviewed!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stations.map((s) => (
            <div key={s._id} className="glass rounded-xl border border-white/8 overflow-hidden">
              <div className="p-5 flex items-start justify-between gap-4 cursor-pointer" onClick={() => setExpandedId(expandedId === s._id ? null : s._id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-lg">{s.stationName || s.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">PENDING</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{s.ownerName || "—"}</span>
                    {s.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{s.phone}</span>}
                    {s.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{s.address}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  {expandedId === s._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === s._id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Detail label="Email" value={s.email} />
                        <Detail label="License" value={s.licenseNumber || "N/A"} />
                        <Detail label="Owner" value={s.ownerName || "N/A"} />
                        <Detail label="Opening Hours" value={s.openingHours || "N/A"} />
                        <Detail label="Delivery" value={s.deliveryAvailable ? `Yes (${s.deliveryRadius || 5} km)` : "No"} />
                        <Detail label="Delivery Charges" value={s.deliveryCharges ? `₹${s.deliveryCharges}` : "Free"} />
                        <Detail label="Location" value={s.location?.coordinates ? `${s.location.coordinates[1]}, ${s.location.coordinates[0]}` : "N/A"} />
                        <Detail label="Registered" value={new Date(s.createdAt).toLocaleDateString()} />
                      </div>
                      {/* Fuel types */}
                      {s.fuelTypes?.length > 0 && (
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Fuel Types</p>
                          <div className="flex flex-wrap gap-2">
                            {s.fuelTypes.map((ft, i) => (
                              <span key={i} className="px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-sm text-white flex items-center gap-1">
                                {ft.type} — <IndianRupee className="w-3 h-3" />{ft.price}/L
                                <span className={`text-[9px] ml-1 ${ft.available ? "text-emerald-400" : "text-red-400"}`}>{ft.available ? "avail" : "out"}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => handleReview(s._id, "approve")} disabled={actionLoading === s._id}
                          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                          {actionLoading === s._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
                        </button>
                        <button onClick={() => handleReview(s._id, "reject")} disabled={actionLoading === s._id}
                          className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-2.5 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50">
                          {actionLoading === s._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
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
