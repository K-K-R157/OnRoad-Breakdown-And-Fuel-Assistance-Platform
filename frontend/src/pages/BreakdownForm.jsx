/**
 * BreakdownForm – Multi-step breakdown reporting wizard.
 * Steps: Vehicle Type → Location → Issue Type → Photo + Urgency → Review & Submit
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  MapPin,
  Car,
  Truck,
  Bike,
  Upload,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Fuel,
  Wind,
  Wrench,
} from "lucide-react";
import { userAPI, mechanicAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/* ─── Step data ─── */
const STEPS = ["Vehicle", "Location", "Issue", "Details", "Review"];

const VEHICLE_TYPES = [
  {
    id: "car",
    label: "Car",
    icon: <Car className="w-8 h-8" />,
    desc: "Sedan, SUV, Hatchback",
  },
  {
    id: "truck",
    label: "Truck",
    icon: <Truck className="w-8 h-8" />,
    desc: "Pickup, Heavy Duty",
  },
  {
    id: "bike",
    label: "Bike",
    icon: <Bike className="w-8 h-8" />,
    desc: "Motorcycle, Scooter",
  },
];

const ISSUE_TYPES = [
  {
    id: "flat_tire",
    label: "Flat Tyre",
    icon: <Wind className="w-6 h-6" />,
    color: "blue",
  },
  {
    id: "engine_failure",
    label: "Engine Failure",
    icon: <Wrench className="w-6 h-6" />,
    color: "red",
  },
  {
    id: "out_of_fuel",
    label: "Out of Fuel",
    icon: <Fuel className="w-6 h-6" />,
    color: "amber",
  },
  {
    id: "accident",
    label: "Accident",
    icon: <AlertTriangle className="w-6 h-6" />,
    color: "orange",
  },
  {
    id: "battery_dead",
    label: "Battery Dead",
    icon: <Zap className="w-6 h-6" />,
    color: "yellow",
  },
  {
    id: "other",
    label: "Other",
    icon: <Car className="w-6 h-6" />,
    color: "slate",
  },
];

const URGENCY_LABELS = [
  "Low – I can wait",
  "Medium – Need help soon",
  "High – Urgent!",
  "Critical – Emergency!",
];

const colorMap = {
  blue: "border-blue-500/50   bg-blue-500/10   text-blue-400",
  red: "border-red-500/50    bg-red-500/10    text-red-400",
  amber: "border-amber-500/50  bg-amber-500/10  text-amber-400",
  orange: "border-orange-500/50 bg-orange-500/10 text-orange-400",
  yellow: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  slate: "border-slate-500/50  bg-slate-500/10  text-slate-400",
};

/* ─── Slide animation variants ─── */
const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (dir) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.25 },
  }),
};

/* ─── Step sub-components ─── */

// Step 1
function VehicleStep({ form, setForm }) {
  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-white mb-2">
        What are you driving?
      </h2>
      <p className="text-slate-400 mb-8 text-sm">
        Select your vehicle type to get matched with the right provider.
      </p>
      <div className="grid grid-cols-3 gap-4">
        {VEHICLE_TYPES.map(({ id, label, icon, desc }) => {
          const active = form.vehicleType === id;
          return (
            <button
              key={id}
              onClick={() => setForm((f) => ({ ...f, vehicleType: id }))}
              className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                active
                  ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20"
                  : "border-white/10 bg-slate-800/60 hover:border-white/25 hover:bg-slate-800"
              }`}
            >
              {active && (
                <span className="absolute top-2 right-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                </span>
              )}
              <span className={active ? "text-amber-400" : "text-slate-300"}>
                {icon}
              </span>
              <div className="text-center">
                <p
                  className={`font-semibold ${active ? "text-amber-400" : "text-white"}`}
                >
                  {label}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 2
function LocationStep({ form, setForm }) {
  const [detecting, setDetecting] = useState(false);

  const detect = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
          locationLabel: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        }));
        setDetecting(false);
      },
      () => {
        setDetecting(false);
        alert("Location access denied. Please type your location.");
      },
      { timeout: 8000 },
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-white mb-2">
        Where are you?
      </h2>
      <p className="text-slate-400 mb-8 text-sm">
        Share your location so providers can reach you quickly.
      </p>

      <button
        onClick={detect}
        disabled={detecting}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-amber-500/40 hover:border-amber-500/70 rounded-2xl p-5 text-amber-400 font-semibold transition-all mb-6 disabled:opacity-60"
      >
        <MapPin className={`w-5 h-5 ${detecting ? "animate-spin" : ""}`} />
        {detecting ? "Detecting location…" : "Auto-detect my GPS location"}
      </button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-900 px-4 text-slate-500 text-xs">
            or type manually
          </span>
        </div>
      </div>

      <input
        type="text"
        placeholder="Enter street address or landmark…"
        value={form.locationLabel || ""}
        onChange={(e) =>
          setForm((f) => ({ ...f, locationLabel: e.target.value }))
        }
        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors text-sm"
      />

      {/* Map preview placeholder */}
      {form.lat && (
        <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 h-48 relative bg-slate-800 flex items-center justify-center">
          <div className="absolute inset-0 bg-linear-to-br from-slate-800 to-slate-900" />
          <div className="relative text-center">
            <div className="inline-flex w-12 h-12 rounded-full bg-amber-500/20 items-center justify-center mb-2">
              <MapPin className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-white font-semibold text-sm">Location Pinned</p>
            <p className="text-slate-400 text-xs mt-1">
              {form.lat}, {form.lng}
            </p>
          </div>
          {/* Animated pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="absolute w-4 h-4 rounded-full bg-amber-500 animate-ping opacity-40" />
            <span className="w-3 h-3 rounded-full bg-amber-500 z-10" />
          </div>
        </div>
      )}
    </div>
  );
}

// Step 3
function IssueStep({ form, setForm }) {
  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-white mb-2">
        What's the issue?
      </h2>
      <p className="text-slate-400 mb-8 text-sm">
        Select the best description of your breakdown.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ISSUE_TYPES.map(({ id, label, icon, color }) => {
          const active = form.issueType === id;
          const cls = colorMap[color];
          return (
            <button
              key={id}
              onClick={() => setForm((f) => ({ ...f, issueType: id }))}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                active
                  ? cls
                  : "border-white/10 bg-slate-800/60 hover:border-white/25 text-slate-400"
              }`}
            >
              {icon}
              <span
                className={`text-sm font-medium ${active ? "" : "text-slate-300"}`}
              >
                {label}
              </span>
              {active && <CheckCircle2 className="w-4 h-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 4
function DetailsStep({ form, setForm }) {
  const urgency = form.urgency ?? 1;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm((f) => ({ ...f, photoFile: file, photoPreview: url }));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-white mb-2">
        Add details
      </h2>
      <p className="text-slate-400 mb-8 text-sm">
        A photo and urgency level help providers prepare before arriving.
      </p>

      {/* Photo upload */}
      <label className="block group cursor-pointer mb-8">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        {form.photoPreview ? (
          <div className="relative rounded-2xl overflow-hidden h-44 border-2 border-amber-500/40">
            <img
              src={form.photoPreview}
              alt="breakdown"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white font-semibold text-sm">Change photo</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 border-2 border-dashed border-white/15 group-hover:border-amber-500/40 rounded-2xl p-10 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Upload a photo</p>
              <p className="text-slate-500 text-xs mt-1">
                PNG, JPG up to 10 MB
              </p>
            </div>
          </div>
        )}
      </label>

      {/* Urgency slider */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-white font-semibold text-sm">
            Urgency Level
          </label>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              urgency === 0
                ? "bg-emerald-500/20 text-emerald-400"
                : urgency === 1
                  ? "bg-amber-500/20 text-amber-400"
                  : urgency === 2
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-red-500/20 text-red-400"
            }`}
          >
            {URGENCY_LABELS[urgency]}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={urgency}
          onChange={(e) =>
            setForm((f) => ({ ...f, urgency: Number(e.target.value) }))
          }
          className="w-full accent-amber-500 cursor-pointer"
        />
        <div className="flex justify-between text-slate-600 text-xs mt-1">
          <span>Low</span>
          <span>Critical</span>
        </div>
      </div>

      {/* Notes */}
      <textarea
        placeholder="Any additional notes for the provider? (optional)"
        rows={3}
        value={form.notes || ""}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        className="mt-6 w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors text-sm resize-none"
      />
    </div>
  );
}

// Step 5
function ReviewStep({ form }) {
  const issueLabel =
    ISSUE_TYPES.find((i) => i.id === form.issueType)?.label ?? "—";
  const vehicleLabel =
    VEHICLE_TYPES.find((v) => v.id === form.vehicleType)?.label ?? "—";

  const rows = [
    { label: "Vehicle", value: vehicleLabel },
    {
      label: "Location",
      value: form.locationLabel || `${form.lat}, ${form.lng}` || "—",
    },
    { label: "Issue", value: issueLabel },
    { label: "Urgency", value: URGENCY_LABELS[form.urgency ?? 1] },
    { label: "Notes", value: form.notes || "None" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-white mb-2">
        Review your request
      </h2>
      <p className="text-slate-400 mb-8 text-sm">
        Make sure everything looks correct before submitting.
      </p>

      <div className="space-y-3 mb-8">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between items-start gap-4 py-3 border-b border-white/8"
          >
            <span className="text-slate-500 text-sm w-24 shrink-0">
              {label}
            </span>
            <span className="text-white text-sm text-right">{value}</span>
          </div>
        ))}
      </div>

      {form.photoPreview && (
        <div className="rounded-xl overflow-hidden h-32 border border-white/10">
          <img
            src={form.photoPreview}
            alt="breakdown"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
        <p className="text-amber-400 text-xs font-medium">
          By submitting, you confirm this is a genuine roadside emergency and
          consent to sharing your location with our verified service providers.
        </p>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function BreakdownForm() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  const [form, setForm] = useState({
    vehicleType: "",
    locationLabel: "",
    lat: null,
    lng: null,
    issueType: "",
    urgency: 1,
    notes: "",
    photoFile: null,
    photoPreview: null,
  });

  const canNext = useCallback(() => {
    if (step === 0) return !!form.vehicleType;
    if (step === 1) return !!(form.locationLabel || form.lat);
    if (step === 2) return !!form.issueType;
    return true;
  }, [step, form]);

  const go = (next) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setLoading(true);
    try {
      const token = session?.token;
      const isFuel = form.issueType === "out_of_fuel";
      const loc =
        form.lat && form.lng
          ? {
              type: "Point",
              coordinates: [parseFloat(form.lng), parseFloat(form.lat)],
            }
          : undefined;

      if (isFuel) {
        // For fuel requests, try to find a nearby fuel station first
        // Then create a fuel request (simplified – picks first available if any)
        await userAPI.createFuelRequest(token, {
          fuelType: "Petrol",
          quantity: 5,
          deliveryLocation: loc,
          address: form.locationLabel || `${form.lat}, ${form.lng}`,
          specialInstructions: form.notes || "",
        });
      } else {
        // For mechanic requests, get nearby mechanics first, then pick one
        let mechanicId;
        if (form.lat && form.lng) {
          try {
            const nearby = await mechanicAPI.getNearby(token, {
              latitude: form.lat,
              longitude: form.lng,
            });
            if (nearby.data?.length) mechanicId = nearby.data[0]._id;
          } catch {
            // No nearby mechanics – still submit without a specific mechanic
          }
        }

        const issueLabel =
          ISSUE_TYPES.find((i) => i.id === form.issueType)?.label ??
          form.issueType;
        await userAPI.createMechanicRequest(token, {
          mechanicId,
          problemDescription:
            `${issueLabel} – ${form.vehicleType} – urgency ${form.urgency}. ${form.notes || ""}`.trim(),
          address: form.locationLabel || `${form.lat}, ${form.lng}`,
          location: loc,
        });
      }

      setSubmitted(true);
      setTimeout(() => navigate("/tracking"), 2500);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="text-center max-w-md"
        >
          <div className="inline-flex w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-3">
            Request Sent!
          </h2>
          <p className="text-slate-400 mb-2">
            We're connecting you with the nearest verified provider.
          </p>
          <p className="text-slate-500 text-sm">
            Redirecting to live tracking…
          </p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-amber-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const stepComponents = [
    <VehicleStep form={form} setForm={setForm} />,
    <LocationStep form={form} setForm={setForm} />,
    <IssueStep form={form} setForm={setForm} />,
    <DetailsStep form={form} setForm={setForm} />,
    <ReviewStep form={form} />,
  ];

  return (
    <div className="min-h-screen bg-slate-950 pt-16 pb-12 px-4 sm:px-6">
      {/* Background glow */}
      <div className="absolute top-32 right-1/3 w-72 h-72 bg-amber-500/6 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative">
        {/* Header */}
        <div className="pt-10 mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            <Zap className="w-3.5 h-3.5" />
            Report Breakdown
          </div>
          <h1 className="font-display font-bold text-3xl text-white">
            Request Roadside Help
          </h1>
        </div>

        {/* Progress stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <button
                onClick={() => i < step && go(i)}
                disabled={i > step}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step
                      ? "bg-amber-500 text-slate-950 cursor-pointer"
                      : i === step
                        ? "bg-amber-500 text-slate-950 ring-4 ring-amber-500/25"
                        : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs hidden sm:block ${
                    i <= step ? "text-amber-400" : "text-slate-600"
                  }`}
                >
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-all ${
                    i < step ? "bg-amber-500" : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 overflow-hidden">
          <div className="relative" style={{ minHeight: 360 }}>
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {stepComponents[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/8">
            <button
              onClick={() => go(step - 1)}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => go(step + 1)}
                disabled={!canNext()}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all text-sm active:scale-95 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all text-sm active:scale-95 hover:shadow-lg hover:shadow-amber-500/30"
              >
                <Zap className="w-4 h-4" />
                {loading ? "Submitting…" : "Submit Request"}
              </button>
            )}
          </div>

          {submitError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {submitError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
