/**
 * App.jsx - Root component.
 * Wraps the whole app in BrowserRouter + AuthProvider, mounts the sticky Navbar,
 * and declares all page routes with Framer Motion page transitions.
 */
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import UserDashboard from "./pages/UserDashboard";
import MechanicDashboard from "./pages/MechanicDashboard";
import FuelStationDashboard from "./pages/FuelStationDashboard";
import AdminDashboard from "./pages/AdminDashboard";

/* Page transition wrapper */
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Redirect to /login if user is not authenticated */
function ProtectedRoute({ children, allowedRoles }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(session.user.role))
    return <Navigate to="/" replace />;
  return children;
}

/* Inner component so useLocation works inside BrowserRouter */
function AppRoutes() {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <LandingPage />
              </PageTransition>
            }
          />
          <Route
            path="/login"
            element={
              <PageTransition>
                <LoginPage />
              </PageTransition>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PageTransition>
                <ProtectedRoute allowedRoles={["user"]}>
                  <UserDashboard />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/mechanic"
            element={
              <PageTransition>
                <ProtectedRoute allowedRoles={["mechanic"]}>
                  <MechanicDashboard />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/fuel-station"
            element={
              <PageTransition>
                <ProtectedRoute allowedRoles={["fuelStation"]}>
                  <FuelStationDashboard />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/admin"
            element={
              <PageTransition>
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="*"
            element={
              <PageTransition>
                <LandingPage />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
