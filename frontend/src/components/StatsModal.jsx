import {
  X,
  User,
  Phone,
  Calendar,
  MapPin,
  IndianRupee,
  Car,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function StatsModal({ isOpen, onClose, title, data, loading }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/95 backdrop-blur sticky top-0 z-10">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-88px)]">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-400 text-lg">No requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.map((item) => (
                  <div
                    key={item._id}
                    className="bg-slate-800/50 border border-white/5 rounded-xl p-4 hover:bg-slate-800/70 hover:border-white/10 transition-all"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm line-clamp-2">
                          {item.problemDescription ||
                            item.fuelType ||
                            item.vehicleType ||
                            "Service Request"}
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full border whitespace-nowrap ${
                          STATUS_COLORS[item.status] || STATUS_COLORS.pending
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* User */}
                      {item.user && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate">
                            {item.user.name || "Unknown"}
                          </span>
                        </div>
                      )}

                      {/* Phone */}
                      {item.user?.phone && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{item.user.phone}</span>
                        </div>
                      )}

                      {/* Vehicle Type for charging */}
                      {item.vehicleType && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Car className="w-3.5 h-3.5" />
                          <span className="capitalize">
                            {item.vehicleType.replace("-", " ")}
                          </span>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>

                      {/* Address/Location */}
                      {item.address && (
                        <div className="flex items-center gap-2 text-slate-400 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Price Row */}
                    {(item.estimatedCost ||
                      item.totalPrice ||
                      item.actualCost) && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-slate-500 text-xs">
                          {item.status === "completed" ||
                          item.status === "delivered"
                            ? "Final Cost"
                            : "Estimated Cost"}
                        </span>
                        <span className="text-emerald-400 font-semibold text-sm flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {item.actualCost ||
                            item.totalPrice ||
                            item.estimatedCost ||
                            0}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
