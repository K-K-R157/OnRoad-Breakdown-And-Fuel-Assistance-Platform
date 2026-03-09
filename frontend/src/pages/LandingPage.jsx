/**
 * LandingPage – Marketing home page.
 * Sections: Hero, Features, How It Works, Testimonials, CTA Footer.
 */
import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  MapPin,
  Zap,
  Clock,
  ShieldCheck,
  Star,
  ArrowRight,
  Wrench,
  Fuel,
  Phone,
  ChevronDown,
  Car,
  Users,
  CheckCircle2,
} from "lucide-react";

/* ─── Animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Data ─── */
const FEATURES = [
  {
    icon: <MapPin className="w-7 h-7" />,
    title: "GPS Live Tracking",
    desc: "Know exactly where your rescuer is with real-time GPS updates every 5 seconds.",
    color: "from-blue-500/20 to-blue-600/5",
    iconBg: "bg-blue-500/20 text-blue-400",
  },
  {
    icon: <Zap className="w-7 h-7" />,
    title: "Lightning Fast Response",
    desc: "Average response time under 15 minutes. Our network covers 500+ cities.",
    color: "from-amber-500/20 to-amber-600/5",
    iconBg: "bg-amber-500/20 text-amber-400",
  },
  {
    icon: <Clock className="w-7 h-7" />,
    title: "24/7 Support",
    desc: "Day or night, rain or shine — help is always one tap away for every breakdown.",
    color: "from-emerald-500/20 to-emerald-600/5",
    iconBg: "bg-emerald-500/20 text-emerald-400",
  },
  {
    icon: <ShieldCheck className="w-7 h-7" />,
    title: "Verified Providers",
    desc: "All mechanics and fuel stations are background-checked, rated, and insured.",
    color: "from-purple-500/20 to-purple-600/5",
    iconBg: "bg-purple-500/20 text-purple-400",
  },
];

const STEPS = [
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Share Location",
    desc: "One tap to auto-detect your GPS position.",
  },
  {
    icon: <Wrench className="w-6 h-6" />,
    title: "Describe Issue",
    desc: "Select your vehicle type and breakdown category.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Match Provider",
    desc: "We find the nearest verified mechanic or fuel station.",
  },
  {
    icon: <CheckCircle2 className="w-6 h-6" />,
    title: "Track & Resolve",
    desc: "Live map tracking until your issue is fully resolved.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah K.",
    role: "Stranded on I-95",
    avatar: "SK",
    rating: 5,
    text: "My car died at midnight on the highway. OnRoad had a mechanic to me in 12 minutes. Absolutely saved my night — I can't recommend this enough!",
  },
  {
    name: "David M.",
    role: "Fleet Manager",
    avatar: "DM",
    rating: 5,
    text: "We manage 40 vehicles and OnRoad has cut our breakdown response time by 60%. The admin dashboard and real-time tracking are game-changers for operations.",
  },
  {
    name: "Priya S.",
    role: "Daily Commuter",
    avatar: "PS",
    rating: 5,
    text: "Ran out of fuel on an empty road. OnRoad connected me to a fuel station that delivered to my exact location. Simple, fast, and professional.",
  },
];

const STATS = [
  { value: "50K+", label: "Drivers Helped" },
  { value: "500+", label: "Cities Covered" },
  { value: "< 15min", label: "Avg Response" },
  { value: "4.9★", label: "App Rating" },
];

/* ─── Sub-components ─── */
function FeatureCard({ icon, title, desc, color, iconBg, i }) {
  return (
    <Reveal delay={i * 0.1}>
      <div
        className={`group relative rounded-2xl bg-linear-to-br ${color} border border-white/8 p-6 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 cursor-default`}
      >
        <div className={`inline-flex p-3 rounded-xl ${iconBg} mb-4`}>
          {icon}
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

function TestimonialCard({ name, role, avatar, rating, text, i }) {
  return (
    <Reveal delay={i * 0.12}>
      <div className="glass rounded-2xl p-6 h-full flex flex-col justify-between hover:border-amber-500/20 transition-colors">
        <div>
          <div className="flex gap-1 mb-4">
            {Array.from({ length: rating }).map((_, k) => (
              <Star key={k} className="w-4 h-4 fill-amber-500 text-amber-500" />
            ))}
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            "{text}"
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-sm">
            {avatar}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{name}</p>
            <p className="text-slate-500 text-xs">{role}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <main className="bg-slate-950 min-h-screen overflow-x-hidden">
      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl" />
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-amber-500/40 to-transparent" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold px-4 py-2 rounded-full mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Live — Providers active in your area
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-white leading-tight tracking-tight mb-6"
          >
            Stranded?
            <br />
            <span className="gradient-text">Help is 1 Tap Away.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Connect with verified mechanics and fuel providers instantly.
            Real-time GPS tracking, 24/7 coverage, and average arrival in under
            15 minutes.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/report"
              className="group flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 hover:shadow-2xl hover:shadow-amber-500/40 active:scale-95"
            >
              <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Request Help Now
            </Link>
            <Link
              to="/tracking"
              className="flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 text-white font-semibold text-base px-8 py-4 rounded-2xl transition-all duration-200 hover:bg-white/5"
            >
              <MapPin className="w-5 h-5 text-amber-400" />
              Live Tracking
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-amber-400 font-display font-bold text-2xl sm:text-3xl">
                  {value}
                </p>
                <p className="text-slate-500 text-xs mt-1">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500"
          >
            <span className="text-xs">Scroll to explore</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ FEATURES ══════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase">
              Why OnRoad
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mt-3 mb-4">
              Built for the moment things go wrong
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Every feature is designed to get you safe as fast as possible.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ SERVICE TYPES ══════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/40">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-white">
              What We Handle
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <Wrench className="w-8 h-8" />,
                label: "Engine Failure",
                sub: "On-site repair",
              },
              {
                icon: <Car className="w-8 h-8" />,
                label: "Flat Tyre",
                sub: "Tyre change & pump",
              },
              {
                icon: <Fuel className="w-8 h-8" />,
                label: "Out of Fuel",
                sub: "Fuel delivery",
              },
              {
                icon: <Phone className="w-8 h-8" />,
                label: "Accident",
                sub: "Emergency assist",
              },
            ].map(({ icon, label, sub }, i) => (
              <Reveal key={label} delay={i * 0.08}>
                <div className="glass rounded-2xl p-6 text-center hover:border-amber-500/30 transition-all hover:-translate-y-1 group cursor-default">
                  <div className="inline-flex p-4 rounded-xl bg-amber-500/10 text-amber-400 mb-4 group-hover:bg-amber-500/20 transition-colors">
                    {icon}
                  </div>
                  <p className="text-white font-semibold">{label}</p>
                  <p className="text-slate-500 text-xs mt-1">{sub}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase">
              Process
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mt-3">
              How it works in 4 steps
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-linear-to-r from-amber-500/40 via-amber-500/60 to-amber-500/40" />
            {STEPS.map(({ icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <div className="relative text-center">
                  <div className="inline-flex w-16 h-16 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 mb-4 font-bold shadow-lg shadow-amber-500/30 relative z-10">
                    {icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-500 text-amber-500 text-xs font-bold flex items-center justify-center z-20">
                    {i + 1}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ TESTIMONIALS ══════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/40">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase">
              Testimonials
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mt-3">
              Real drivers, real stories
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} {...t} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FINAL CTA ══════════════════════ */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-amber-500/40 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 via-transparent to-blue-500/5" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <Reveal>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-6">
              Don't wait until
              <br />
              <span className="gradient-text">you're stranded.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10">
              Sign up free and have instant access to thousands of verified
              roadside professionals wherever you drive.
            </p>
            <Link
              to="/report"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg px-10 py-4 rounded-2xl transition-all duration-200 hover:shadow-2xl hover:shadow-amber-500/40 active:scale-95"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer className="border-t border-white/8 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500">
              <Zap className="w-4 h-4 text-slate-950" />
            </span>
            <span className="font-display font-bold text-white">
              On<span className="text-amber-500">Road</span>
            </span>
          </div>
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} OnRoad Assistance Platform. All rights
            reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
