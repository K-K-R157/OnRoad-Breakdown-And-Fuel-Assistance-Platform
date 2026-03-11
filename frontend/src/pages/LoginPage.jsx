import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Wrench,
  Fuel,
  ShieldCheck,
  Briefcase,
  FileText,
  Clock,
  IndianRupee,
  Truck,
} from "lucide-react";
import { authAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  {
    value: "user",
    label: "User",
    icon: <User className="w-6 h-6" />,
    desc: "Need roadside help",
    color: "from-blue-500 to-blue-600",
  },
  {
    value: "mechanic",
    label: "Mechanic",
    icon: <Wrench className="w-6 h-6" />,
    desc: "Offer repair services",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    value: "fuelStation",
    label: "Fuel Station",
    icon: <Fuel className="w-6 h-6" />,
    desc: "Deliver fuel on demand",
    color: "from-amber-500 to-amber-600",
  },
  {
    value: "admin",
    label: "Admin",
    icon: <ShieldCheck className="w-6 h-6" />,
    desc: "Manage the platform",
    color: "from-purple-500 to-purple-600",
  },
];

function InputField({ icon, type = "text", placeholder, value, onChange }) {
  return (
    <div className="relative flex-1">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={type === "number" ? "any" : undefined}
        className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none transition-colors"
      />
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "user",
    servicesOffered: "",
    experience: "",
    licenseNumber: "",
    licenseCopy: "",
    longitude: "",
    latitude: "",
    stationName: "",
    ownerName: "",
    fuelTypes: [{ type: "Petrol", price: "", available: true }],
    openingHours: "",
    deliveryAvailable: true,
    deliveryRadius: "",
    deliveryCharges: "",
    minimumOrderQuantity: "",
  });
  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!isRegister) {
        const res = await authAPI.login({
          email: form.email,
          password: form.password,
          role: form.role,
        });
        login({
          token: res.token,
          user: { ...res.user, _id: res.user.id || res.user._id },
        });
        const redir = {
          user: "/dashboard",
          mechanic: "/mechanic",
          fuelStation: "/fuel-station",
          admin: "/admin",
        };
        navigate(redir[res.user.role] || "/dashboard");
      } else {
        const payload = {
          role: form.role,
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.address,
        };
        if (form.role === "mechanic") {
          payload.servicesOffered = form.servicesOffered
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          payload.experience = Number(form.experience);
          payload.licenseNumber = form.licenseNumber;
          payload.licenseCopy = form.licenseCopy || "pending-upload";
          payload.location = {
            type: "Point",
            coordinates: [
              Number(form.longitude) || 77.5946,
              Number(form.latitude) || 12.9716,
            ],
          };
        } else if (form.role === "fuelStation") {
          payload.stationName = form.stationName;
          payload.ownerName = form.ownerName || form.name;
          payload.fuelTypes = form.fuelTypes
            .filter((f) => f.type && f.price)
            .map((f) => ({
              type: f.type,
              price: Number(f.price),
              available: f.available,
            }));
          payload.location = {
            type: "Point",
            coordinates: [
              Number(form.longitude) || 77.5946,
              Number(form.latitude) || 12.9716,
            ],
          };
          payload.openingHours = form.openingHours;
          payload.deliveryAvailable = form.deliveryAvailable;
          payload.deliveryRadius = Number(form.deliveryRadius) || 5;
          payload.deliveryCharges = Number(form.deliveryCharges) || 50;
          payload.minimumOrderQuantity = Number(form.minimumOrderQuantity) || 5;
          payload.licenseNumber = form.licenseNumber;
          payload.licenseCopy = form.licenseCopy || "pending-upload";
        }
        const res = await authAPI.register(payload);
        if (form.role === "mechanic" || form.role === "fuelStation") {
          setSuccess(
            "Registration successful! Your account is pending admin approval. You can login once approved.",
          );
          setIsRegister(false);
        } else {
          login({
            token: res.token,
            user: { ...res.user, _id: res.user.id || res.user._id },
          });
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          set("latitude", pos.coords.latitude.toFixed(6));
          set("longitude", pos.coords.longitude.toFixed(6));
        },
        () => setError("Could not detect location. Enter manually."),
      );
    }
  };
  const addFuelType = () =>
    set("fuelTypes", [
      ...form.fuelTypes,
      { type: "Diesel", price: "", available: true },
    ]);
  const updateFuelType = (i, field, value) => {
    const u = [...form.fuelTypes];
    u[i] = { ...u[i], [field]: value };
    set("fuelTypes", u);
  };
  const removeFuelType = (i) =>
    set(
      "fuelTypes",
      form.fuelTypes.filter((_, idx) => idx !== i),
    );

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-blue-500/6 rounded-full blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500">
            <Zap className="w-6 h-6 text-slate-950" strokeWidth={2.5} />
          </span>
          <span className="font-display font-bold text-white text-2xl">
            On<span className="text-amber-500">Road</span>
          </span>
        </Link>
        <div className="glass rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-slate-400 text-center text-sm mb-6">
            {isRegister
              ? "Register to get started with OnRoad"
              : "Sign in to your account"}
          </p>
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div
            className={`grid ${isRegister ? "grid-cols-3" : "grid-cols-4"} gap-2 mb-6`}
          >
            {ROLES.filter((r) => (isRegister ? r.value !== "admin" : true)).map(
              (r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set("role", r.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${form.role === r.value ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-white/8 bg-slate-800/50 text-slate-400 hover:border-white/20 hover:text-white"}`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              ),
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                {form.role === "fuelStation" ? (
                  <>
                    <InputField
                      icon={<Fuel className="w-4 h-4" />}
                      placeholder="Station Name"
                      value={form.stationName}
                      onChange={(v) => set("stationName", v)}
                    />
                    <InputField
                      icon={<User className="w-4 h-4" />}
                      placeholder="Owner Name"
                      value={form.ownerName}
                      onChange={(v) => set("ownerName", v)}
                    />
                  </>
                ) : (
                  <InputField
                    icon={<User className="w-4 h-4" />}
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(v) => set("name", v)}
                  />
                )}
              </>
            )}
            <InputField
              icon={<Mail className="w-4 h-4" />}
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(v) => set("email", v)}
            />
            <div className="relative">
              <InputField
                icon={<Lock className="w-4 h-4" />}
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(v) => set("password", v)}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {isRegister && (
              <>
                <InputField
                  icon={<Phone className="w-4 h-4" />}
                  placeholder="Phone (+91 98765 43210)"
                  value={form.phone}
                  onChange={(v) => set("phone", v)}
                />
                <InputField
                  icon={<MapPin className="w-4 h-4" />}
                  placeholder="Address"
                  value={form.address}
                  onChange={(v) => set("address", v)}
                />
                <AnimatePresence>
                  {form.role === "mechanic" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="border-t border-white/8 pt-4">
                        <p className="text-amber-400 text-xs font-semibold mb-3 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5" /> Mechanic Details
                        </p>
                      </div>
                      <InputField
                        icon={<Wrench className="w-4 h-4" />}
                        placeholder="Services (Flat Tyre, Engine, Battery)"
                        value={form.servicesOffered}
                        onChange={(v) => set("servicesOffered", v)}
                      />
                      <InputField
                        icon={<Briefcase className="w-4 h-4" />}
                        type="number"
                        placeholder="Years of Experience"
                        value={form.experience}
                        onChange={(v) => set("experience", v)}
                      />
                      <InputField
                        icon={<FileText className="w-4 h-4" />}
                        placeholder="License Number"
                        value={form.licenseNumber}
                        onChange={(v) => set("licenseNumber", v)}
                      />
                      <div className="flex gap-3">
                        <InputField
                          icon={<MapPin className="w-4 h-4" />}
                          type="number"
                          placeholder="Latitude"
                          value={form.latitude}
                          onChange={(v) => set("latitude", v)}
                        />
                        <InputField
                          icon={<MapPin className="w-4 h-4" />}
                          type="number"
                          placeholder="Longitude"
                          value={form.longitude}
                          onChange={(v) => set("longitude", v)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={detectLocation}
                        className="w-full text-sm text-amber-400 hover:text-amber-300 border border-amber-500/20 rounded-xl py-2 transition-colors"
                      >
                        Auto-Detect My Location
                      </button>
                    </motion.div>
                  )}
                  {form.role === "fuelStation" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="border-t border-white/8 pt-4">
                        <p className="text-amber-400 text-xs font-semibold mb-3 flex items-center gap-1.5">
                          <Fuel className="w-3.5 h-3.5" /> Station Details
                        </p>
                      </div>
                      <InputField
                        icon={<FileText className="w-4 h-4" />}
                        placeholder="License Number"
                        value={form.licenseNumber}
                        onChange={(v) => set("licenseNumber", v)}
                      />
                      <InputField
                        icon={<Clock className="w-4 h-4" />}
                        placeholder="Opening Hours (6:00 AM - 10:00 PM)"
                        value={form.openingHours}
                        onChange={(v) => set("openingHours", v)}
                      />
                      <div className="space-y-2">
                        <p className="text-slate-300 text-xs font-medium">
                          Fuel Types & Prices
                        </p>
                        {form.fuelTypes.map((ft, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <select
                              value={ft.type}
                              onChange={(e) =>
                                updateFuelType(i, "type", e.target.value)
                              }
                              className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500/50 outline-none"
                            >
                              <option value="Petrol">Petrol</option>
                              <option value="Diesel">Diesel</option>
                              <option value="CNG">CNG</option>
                            </select>
                            <InputField
                              icon={<IndianRupee className="w-4 h-4" />}
                              type="number"
                              placeholder="Price/L"
                              value={ft.price}
                              onChange={(v) => updateFuelType(i, "price", v)}
                            />
                            {form.fuelTypes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeFuelType(i)}
                                className="text-red-400 hover:text-red-300 text-sm px-2"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addFuelType}
                          className="text-sm text-amber-400 hover:text-amber-300"
                        >
                          + Add Fuel Type
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <InputField
                          icon={<Truck className="w-4 h-4" />}
                          type="number"
                          placeholder="Delivery Radius (km)"
                          value={form.deliveryRadius}
                          onChange={(v) => set("deliveryRadius", v)}
                        />
                        <InputField
                          icon={<IndianRupee className="w-4 h-4" />}
                          type="number"
                          placeholder="Delivery Charges"
                          value={form.deliveryCharges}
                          onChange={(v) => set("deliveryCharges", v)}
                        />
                      </div>
                      <div className="flex gap-3">
                        <InputField
                          icon={<MapPin className="w-4 h-4" />}
                          type="number"
                          placeholder="Latitude"
                          value={form.latitude}
                          onChange={(v) => set("latitude", v)}
                        />
                        <InputField
                          icon={<MapPin className="w-4 h-4" />}
                          type="number"
                          placeholder="Longitude"
                          value={form.longitude}
                          onChange={(v) => set("longitude", v)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={detectLocation}
                        className="w-full text-sm text-amber-400 hover:text-amber-300 border border-amber-500/20 rounded-xl py-2 transition-colors"
                      >
                        Auto-Detect My Location
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : isRegister ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-6">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setSuccess("");
                setForm({
                  name: "",
                  email: "",
                  password: "",
                  phone: "",
                  address: "",
                  role: "user",
                  servicesOffered: "",
                  experience: "",
                  licenseNumber: "",
                  licenseCopy: "",
                  longitude: "",
                  latitude: "",
                  stationName: "",
                  ownerName: "",
                  fuelTypes: [{ type: "Petrol", price: "", available: true }],
                  openingHours: "",
                  deliveryAvailable: true,
                  deliveryRadius: "",
                  deliveryCharges: "",
                  minimumOrderQuantity: "",
                });
              }}
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              {isRegister ? "Sign In" : "Register"}
            </button>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
