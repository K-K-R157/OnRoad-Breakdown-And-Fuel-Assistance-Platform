/**
 * api.js – Shared fetch wrapper for all backend calls.
 *
 * HOW IT WORKS:
 * ─────────────
 * 1. Reads the base URL from the VITE_API_BASE_URL env variable
 *    (set in frontend/.env → "http://localhost:5000/api")
 *
 * 2. Every function below builds the full URL, attaches the JWT token
 *    from localStorage (if the user is logged in), and calls fetch().
 *
 * 3. The backend responds with JSON like { success: true, data: { ... } }.
 *    We parse it and return the data or throw an error.
 */

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/* ─── Generic request helper ─── */
async function request(
  path,
  { method = "GET", body, token, isFormData = false } = {},
) {
  const headers = {};

  // If a JWT token exists, send it in the Authorization header
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Only set Content-Type for JSON bodies (FormData sets its own boundary)
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

/* ─── Auth ─── */
export const authAPI = {
  register: (payload) =>
    request("/auth/register", { method: "POST", body: payload }),

  login: (payload) => request("/auth/login", { method: "POST", body: payload }),

  getMe: (token) => request("/auth/me", { token }),
};

/* ─── User (stranded user) ─── */
export const userAPI = {
  getProfile: (token) => request("/users/me", { token }),

  updateProfile: (token, body) =>
    request("/users/me", { method: "PUT", token, body }),

  // Create a mechanic assistance request
  createMechanicRequest: (token, body) =>
    request("/users/requests/mechanic", { method: "POST", token, body }),

  getMyMechanicRequests: (token) =>
    request("/users/requests/mechanic", { token }),

  cancelMechanicRequest: (token, id) =>
    request(`/users/requests/mechanic/${id}/cancel`, {
      method: "PATCH",
      token,
    }),

  // Create a fuel delivery request
  createFuelRequest: (token, body) =>
    request("/users/requests/fuel", { method: "POST", token, body }),

  getMyFuelRequests: (token) => request("/users/requests/fuel", { token }),

  cancelFuelRequest: (token, id) =>
    request(`/users/requests/fuel/${id}/cancel`, { method: "PATCH", token }),
};

/* ─── Mechanics ─── */
export const mechanicAPI = {
  getNearby: (lng, lat, maxDistance = 10000) =>
    request(
      `/mechanics/nearby?longitude=${lng}&latitude=${lat}&maxDistance=${maxDistance}`,
    ),

  getProfile: (token) => request("/mechanics/me", { token }),

  updateProfile: (token, body) =>
    request("/mechanics/me", { method: "PUT", token, body }),

  getRequests: (token) => request("/mechanics/requests", { token }),

  updateRequestStatus: (token, id, status, extras = {}) =>
    request(`/mechanics/requests/${id}/status`, {
      method: "PATCH",
      token,
      body: { status, ...extras },
    }),
};

/* ─── Fuel Stations ─── */
export const fuelStationAPI = {
  getNearby: (lng, lat, maxDistance = 10000) =>
    request(
      `/fuel-stations/nearby?longitude=${lng}&latitude=${lat}&maxDistance=${maxDistance}`,
    ),

  getProfile: (token) => request("/fuel-stations/me", { token }),

  updateProfile: (token, body) =>
    request("/fuel-stations/me", { method: "PUT", token, body }),

  updateFuelTypes: (token, fuelTypes) =>
    request("/fuel-stations/fuel-types", {
      method: "PATCH",
      token,
      body: { fuelTypes },
    }),

  getRequests: (token) => request("/fuel-stations/requests", { token }),

  updateRequestStatus: (token, id, status, extras = {}) =>
    request(`/fuel-stations/requests/${id}/status`, {
      method: "PATCH",
      token,
      body: { status, ...extras },
    }),
};

/* ─── Admin ─── */
export const adminAPI = {
  getProfile: (token) => request("/admin/me", { token }),

  updateProfile: (token, body) =>
    request("/admin/me", { method: "PUT", token, body }),

  getDashboard: (token) => request("/admin/dashboard", { token }),

  getPendingMechanics: (token) =>
    request("/admin/mechanics/pending", { token }),

  reviewMechanic: (token, id, action) =>
    request(`/admin/mechanics/${id}/review`, {
      method: "PATCH",
      token,
      body: { action },
    }),

  getPendingFuelStations: (token) =>
    request("/admin/fuel-stations/pending", { token }),

  reviewFuelStation: (token, id, action) =>
    request(`/admin/fuel-stations/${id}/review`, {
      method: "PATCH",
      token,
      body: { action },
    }),

  getAllUsers: (token) => request("/admin/users", { token }),

  getAllMechanics: (token) => request("/admin/mechanics/all", { token }),

  getAllFuelStations: (token) => request("/admin/fuel-stations/all", { token }),

  revokeMechanic: (token, id) =>
    request(`/admin/mechanics/${id}/revoke`, { method: "PATCH", token }),

  revokeFuelStation: (token, id) =>
    request(`/admin/fuel-stations/${id}/revoke`, { method: "PATCH", token }),

  getActiveMechanicRequests: (token) =>
    request("/admin/mechanic-requests/active", { token }),

  getActiveFuelRequests: (token) =>
    request("/admin/fuel-requests/active", { token }),

  getAllFeedback: (token) => request("/admin/feedback/all", { token }),
};

/* ─── Feedback ─── */
export const feedbackAPI = {
  create: (token, body) =>
    request("/feedback", { method: "POST", token, body }),

  update: (token, id, body) =>
    request(`/feedback/${id}`, { method: "PUT", token, body }),

  getMyFeedback: (token) => request("/feedback/me", { token }),

  getProviderFeedback: (providerId) =>
    request(`/feedback/provider/${providerId}`),

  toggleHelpful: (token, id) =>
    request(`/feedback/${id}/helpful`, { method: "POST", token }),

  respond: (token, id, response) =>
    request(`/feedback/${id}/respond`, {
      method: "POST",
      token,
      body: { response },
    }),
};
