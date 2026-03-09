/**
 * ServiceProviderCard – Reusable card component for mechanics / fuel stations.
 * Shows provider photo (avatar), name, rating, distance, specialties,
 * and "Call Now" / "Chat" action buttons.
 */
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  Zap,
} from "lucide-react";

/**
 * @param {object} props
 * @param {string}   props.name          – Provider full name
 * @param {string}   props.avatar        – Initials fallback (e.g. "JD")
 * @param {string}   [props.photoUrl]    – Optional photo URL
 * @param {number}   props.rating        – 0–5 (supports decimals)
 * @param {number}   props.reviewCount   – Total reviews
 * @param {string}   props.distance      – e.g. "1.2 km"
 * @param {string}   props.eta           – e.g. "~8 min"
 * @param {string}   props.type          – "mechanic" | "fuelStation"
 * @param {string[]} props.specialties   – e.g. ["Flat Tyre", "Engine"]
 * @param {boolean}  [props.isOnline]    – Online/available indicator
 * @param {boolean}  [props.highlighted] – Amber highlighted border (nearest)
 * @param {function} [props.onCall]
 * @param {function} [props.onChat]
 */
export default function ServiceProviderCard({
  name = "Provider",
  avatar = "??",
  photoUrl,
  rating = 4.5,
  reviewCount = 0,
  distance = "—",
  eta = "—",
  type = "mechanic",
  specialties = [],
  isOnline = true,
  highlighted = false,
  onCall,
  onChat,
}) {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`glass rounded-2xl p-5 flex flex-col gap-4 transition-all hover:shadow-xl hover:-translate-y-0.5 ${
        highlighted
          ? "border-2 border-amber-500/60 shadow-lg shadow-amber-500/15"
          : "border border-white/8 hover:border-white/20"
      }`}
    >
      {/* ── Header row ── */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-14 h-14 rounded-xl object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-lg">
              {avatar}
            </div>
          )}
          {/* Online dot */}
          <span
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
              isOnline ? "bg-emerald-500" : "bg-slate-500"
            }`}
          />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold truncate">{name}</h3>
            {highlighted && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                <Zap className="w-2.5 h-2.5" />
                Nearest
              </span>
            )}
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: fullStars }).map((_, i) => (
                <Star
                  key={`f${i}`}
                  className="w-3.5 h-3.5 fill-amber-500 text-amber-500"
                />
              ))}
              {halfStar && (
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/40" />
              )}
              {Array.from({ length: emptyStars }).map((_, i) => (
                <Star key={`e${i}`} className="w-3.5 h-3.5 text-slate-600" />
              ))}
            </div>
            <span className="text-amber-400 text-xs font-semibold">
              {rating.toFixed(1)}
            </span>
            <span className="text-slate-600 text-xs">({reviewCount})</span>
          </div>

          {/* Distance + ETA */}
          <div className="flex items-center gap-3 mt-2 text-slate-400 text-xs">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {distance}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              ETA {eta}
            </span>
          </div>
        </div>

        {/* Type badge */}
        <span
          className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg ${
            type === "mechanic"
              ? "bg-blue-500/15 text-blue-400"
              : "bg-amber-500/15 text-amber-400"
          }`}
        >
          {type === "mechanic" ? "Mechanic" : "Fuel Station"}
        </span>
      </div>

      {/* ── Specialties ── */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {specialties.map((s) => (
            <span
              key={s}
              className="text-xs text-slate-400 bg-slate-800 border border-white/8 px-2.5 py-1 rounded-lg"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onCall}
          className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95 hover:shadow-lg hover:shadow-amber-500/25"
        >
          <Phone className="w-4 h-4" />
          Call Now
        </button>
        <button
          onClick={onChat}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95"
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
      </div>
    </motion.div>
  );
}
