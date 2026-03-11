/**
 * Navbar – Sticky top navigation bar.
 * Dark navy background with amber accent. Collapses to hamburger on mobile.
 */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Menu,
  X,
  ChevronRight,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_LINKS = {
  user: [
    { label: "Home", to: "/" },
    { label: "Dashboard", to: "/dashboard" },
  ],
  mechanic: [
    { label: "Home", to: "/" },
    { label: "Mechanic Panel", to: "/mechanic" },
  ],
  fuelStation: [
    { label: "Home", to: "/" },
    { label: "Station Panel", to: "/fuel-station" },
  ],
  admin: [
    { label: "Home", to: "/" },
    { label: "Admin Panel", to: "/admin" },
  ],
};

const PROFILE_NAV = {
  user: { path: "/dashboard?tab=profile", state: { tab: "profile" } },
  mechanic: { path: "/mechanic?tab=profile", state: { tab: "profile" } },
  fuelStation: { path: "/fuel-station?tab=station", state: { tab: "station" } },
  admin: { path: "/admin?tab=profile", state: { tab: "profile" } },
};

const GUEST_LINKS = [{ label: "Home", to: "/" }];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const dropdownRef = useRef(null);

  const role = session?.user?.role;
  const navLinks = role ? ROLE_LINKS[role] || GUEST_LINKS : GUEST_LINKS;

  /* Add shadow / blur when user scrolls down */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname, location.search]);

  /* Close profile dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/90 backdrop-blur-md shadow-lg shadow-black/40"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 group-hover:bg-amber-400 transition-colors">
            <Zap className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
          </span>
          <span className="font-display font-bold text-white text-lg leading-tight">
            On<span className="text-amber-500">Road</span>
          </span>
        </Link>

        {/* ── Desktop links ── */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map(({ label, to }) => {
            const active = location.pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "text-amber-500"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-amber-500/10 border border-amber-500/30"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ── CTA / Auth + hamburger ── */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              {/* ── Profile dropdown ── */}
              <div className="relative hidden sm:block" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-amber-400">
                    {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  {session.user?.name?.split(" ")[0]}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl shadow-black/40 overflow-hidden z-50"
                    >
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          const nav = PROFILE_NAV[role] || PROFILE_NAV.user;
                          navigate(nav.path, { state: nav.state });
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </button>
                      <div className="border-t border-white/5" />
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                          navigate("/");
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/30 active:scale-95"
            >
              Sign In
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/5 px-4 py-4 space-y-1"
          >
            {navLinks.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
            {session ? (
              <>
                <button
                  onClick={() => {
                    const nav = PROFILE_NAV[role] || PROFILE_NAV.user;
                    navigate(nav.path, { state: nav.state });
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  My Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                    setMenuOpen(false);
                  }}
                  className="block w-full mt-2 text-center bg-slate-800 border border-white/10 text-slate-300 font-semibold px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Logout ({session.user?.name?.split(" ")[0]})
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block mt-2 text-center bg-amber-500 text-slate-950 font-semibold px-4 py-3 rounded-xl hover:bg-amber-400 transition-colors"
              >
                Sign In
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
