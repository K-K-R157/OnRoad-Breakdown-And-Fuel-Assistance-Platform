const DEFAULT_PROD_API_URL =
  "https://onroad-breakdown-g3brh6bbgqguefc3.southeastasia-01.azurewebsites.net/api";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(
  /\/+$/,
  "",
);
const FALLBACK_API_BASE_URL = DEFAULT_PROD_API_URL.replace(/\/+$/, "");
const BASE_URLS = API_BASE_URL
  ? API_BASE_URL === FALLBACK_API_BASE_URL
    ? [API_BASE_URL]
    : [API_BASE_URL, FALLBACK_API_BASE_URL]
  : [FALLBACK_API_BASE_URL];

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response = null;
  let lastError = null;

  for (const baseUrl of BASE_URLS) {
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!response) {
    throw new Error(
      lastError?.message || "Network request failed. Check API base URL.",
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

export const authAPI = {
  login: (body) => request("/auth/login", { method: "POST", body }),
  register: (body) => request("/auth/register", { method: "POST", body }),
  getMe: (token) => request("/auth/me", { token }),
};

export const userAPI = {
  getProfile: (token) => request("/users/me", { token }),

  updateProfile: (token, body) =>
    request("/users/me", { method: "PUT", token, body }),

  createMechanicRequest: (token, body) =>
    request("/users/requests/mechanic", { method: "POST", token, body }),

  getMyMechanicRequests: (token) =>
    request("/users/requests/mechanic", { token }),

  cancelMechanicRequest: (token, id) =>
    request(`/users/requests/mechanic/${id}/cancel`, {
      method: "PATCH",
      token,
    }),

  createFuelRequest: (token, body) =>
    request("/users/requests/fuel", { method: "POST", token, body }),

  getMyFuelRequests: (token) => request("/users/requests/fuel", { token }),

  cancelFuelRequest: (token, id) =>
    request(`/users/requests/fuel/${id}/cancel`, { method: "PATCH", token }),

  createChargingRequest: (token, body) =>
    request("/users/requests/charging", { method: "POST", token, body }),

  getMyChargingRequests: (token) =>
    request("/users/requests/charging", { token }),

  cancelChargingRequest: (token, id) =>
    request(`/users/requests/charging/${id}/cancel`, {
      method: "PATCH",
      token,
    }),
};

export const mechanicAPI = {
  getNearby: (longitude, latitude, maxDistance = 10000, filters = {}) => {
    const query = new URLSearchParams({
      longitude: String(longitude),
      latitude: String(latitude),
      maxDistance: String(maxDistance),
    });

    if (filters.mechanicType) {
      query.append("mechanicType", filters.mechanicType);
    }

    return request(`/mechanics/nearby?${query.toString()}`);
  },
  getMe: (token) => request("/mechanics/me", { token }),
  updateMe: (token, body) =>
    request("/mechanics/me", { method: "PUT", token, body }),
  getRequests: (token, status) => {
    const query = new URLSearchParams();
    if (status) query.append("status", status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/mechanics/requests${suffix}`, { token });
  },
  updateRequestStatus: (token, id, body) =>
    request(`/mechanics/requests/${id}/status`, {
      method: "PATCH",
      token,
      body,
    }),
  getStats: (token) => request("/mechanics/stats", { token }),
};

export const fuelStationAPI = {
  getNearby: (longitude, latitude, maxDistance = 10000, filters = {}) => {
    const query = new URLSearchParams({
      longitude: String(longitude),
      latitude: String(latitude),
      maxDistance: String(maxDistance),
    });

    if (filters.fuelType) {
      query.append("fuelType", filters.fuelType);
    }
    if (filters.deliveryOnly) {
      query.append("deliveryOnly", "true");
    }

    return request(`/fuel-stations/nearby?${query.toString()}`);
  },
  getMe: (token) => request("/fuel-stations/me", { token }),
  updateMe: (token, body) =>
    request("/fuel-stations/me", { method: "PUT", token, body }),
  updateFuelTypes: (token, fuelTypes) =>
    request("/fuel-stations/fuel-types", {
      method: "PATCH",
      token,
      body: { fuelTypes },
    }),
  getRequests: (token, status) => {
    const query = new URLSearchParams();
    if (status) query.append("status", status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/fuel-stations/requests${suffix}`, { token });
  },
  updateRequestStatus: (token, id, body) =>
    request(`/fuel-stations/requests/${id}/status`, {
      method: "PATCH",
      token,
      body,
    }),
  getStats: (token) => request("/fuel-stations/stats", { token }),
};

export const chargingStationAPI = {
  getNearby: (longitude, latitude, maxDistance = 10000, filters = {}) => {
    const query = new URLSearchParams({
      longitude: String(longitude),
      latitude: String(latitude),
      maxDistance: String(maxDistance),
    });

    if (filters.vehicleType) {
      query.append("vehicleType", filters.vehicleType);
    }
    if (filters.connectorType) {
      query.append("connectorType", filters.connectorType);
    }
    if (filters.mobileChargingOnly) {
      query.append("mobileChargingOnly", "true");
    }

    return request(`/charging-stations/nearby?${query.toString()}`);
  },
  getMe: (token) => request("/charging-stations/me", { token }),
  updateMe: (token, body) =>
    request("/charging-stations/me", { method: "PUT", token, body }),
  updateChargingTypes: (token, chargingTypes) =>
    request("/charging-stations/charging-types", {
      method: "PATCH",
      token,
      body: { chargingTypes },
    }),
  getRequests: (token, status) => {
    const query = new URLSearchParams();
    if (status) query.append("status", status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/charging-stations/requests${suffix}`, { token });
  },
  updateRequestStatus: (token, id, body) =>
    request(`/charging-stations/requests/${id}/status`, {
      method: "PATCH",
      token,
      body,
    }),
  getStats: (token) => request("/charging-stations/stats", { token }),
};

export const adminAPI = {
  getDashboard: (token) => request("/admin/dashboard", { token }),
  getUsers: (token) => request("/admin/users", { token }),

  getPendingMechanics: (token) =>
    request("/admin/mechanics/pending", { token }),
  getAllMechanics: (token) => request("/admin/mechanics/all", { token }),
  reviewMechanic: (token, id, action, rejectionReason = "") =>
    request(`/admin/mechanics/${id}/review`, {
      method: "PATCH",
      token,
      body: { action, rejectionReason },
    }),
  revokeMechanic: (token, id) =>
    request(`/admin/mechanics/${id}/revoke`, { method: "PATCH", token }),

  getPendingFuelStations: (token) =>
    request("/admin/fuel-stations/pending", { token }),
  getAllFuelStations: (token) => request("/admin/fuel-stations/all", { token }),
  reviewFuelStation: (token, id, action, rejectionReason = "") =>
    request(`/admin/fuel-stations/${id}/review`, {
      method: "PATCH",
      token,
      body: { action, rejectionReason },
    }),
  revokeFuelStation: (token, id) =>
    request(`/admin/fuel-stations/${id}/revoke`, { method: "PATCH", token }),

  getPendingChargingStations: (token) =>
    request("/admin/charging-stations/pending", { token }),
  getAllChargingStations: (token) =>
    request("/admin/charging-stations/all", { token }),
  reviewChargingStation: (token, id, action, rejectionReason = "") =>
    request(`/admin/charging-stations/${id}/review`, {
      method: "PATCH",
      token,
      body: { action, rejectionReason },
    }),
  revokeChargingStation: (token, id) =>
    request(`/admin/charging-stations/${id}/revoke`, {
      method: "PATCH",
      token,
    }),

  getActiveMechanicRequests: (token) =>
    request("/admin/mechanic-requests/active", { token }),
  getActiveFuelRequests: (token) =>
    request("/admin/fuel-requests/active", { token }),
  getActiveChargingRequests: (token) =>
    request("/admin/charging-requests/active", { token }),
  getFeedback: (token) => request("/admin/feedback/all", { token }),
};

export const feedbackAPI = {
  create: (token, body) =>
    request("/feedback", { method: "POST", token, body }),

  update: (token, id, body) =>
    request(`/feedback/${id}`, { method: "PUT", token, body }),

  getMyFeedback: (token) => request("/feedback/me", { token }),

  getProviderFeedback: (token, providerId) =>
    request(`/feedback/provider/${providerId}`, { token }),

  toggleHelpful: (token, id) =>
    request(`/feedback/${id}/helpful`, { method: "POST", token }),

  respond: (token, id, response) =>
    request(`/feedback/${id}/respond`, {
      method: "POST",
      token,
      body: { response },
    }),
};

export { API_BASE_URL, FALLBACK_API_BASE_URL };
