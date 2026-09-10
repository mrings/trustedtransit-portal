const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

// Auth0's getAccessTokenSilently is a hook value, so a component registers it here
// (see App.jsx) and every request pulls a fresh token from it.
let tokenProvider = null;
export function setTokenProvider(fn) {
  tokenProvider = fn;
}

async function authHeaders(extra = {}) {
  const headers = { ...extra };
  if (tokenProvider) {
    try {
      const token = await tokenProvider();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // not logged in / token unavailable — send the request unauthenticated
    }
  }
  return headers;
}

async function parseError(res) {
  const text = await res.text();
  return new Error(`API error: ${res.status} - ${text}`);
}

export const api = {
  // Facilities
  getFacilities: async () => {
    const res = await fetch(`${API_BASE_URL}/facilities`, { headers: await authHeaders() });
    return res.json();
  },

  getFacility: async (id) => {
    const res = await fetch(`${API_BASE_URL}/facilities/${id}`, { headers: await authHeaders() });
    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  createFacility: async (data) => {
    const res = await fetch(`${API_BASE_URL}/facilities`, {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateFacility: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/facilities/${id}`, {
      method: "PATCH",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await parseError(res);
  },

  // Current user
  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/users/me`, { headers: await authHeaders() });
    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  linkMyFacility: async (facilityId) => {
    const res = await fetch(`${API_BASE_URL}/users/me/facility`, {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ facilityId }),
    });
    if (!res.ok) throw await parseError(res);
  },

  // Staff (admin)
  getUsers: async () => {
    const res = await fetch(`${API_BASE_URL}/users`, { headers: await authHeaders() });
    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  updateUser: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PATCH",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await parseError(res);
  },

  removeUser: async (id) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) throw await parseError(res);
  },

  // Residents
  getResidents: async () => {
    const res = await fetch(`${API_BASE_URL}/residents`, { headers: await authHeaders() });
    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  getResident: async (id) => {
    const res = await fetch(`${API_BASE_URL}/residents/${id}`, { headers: await authHeaders() });
    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  createResident: async (data) => {
    const res = await fetch(`${API_BASE_URL}/residents`, {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await parseError(res);
    try {
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  updateResident: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/residents/${id}`, {
      method: "PATCH",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await parseError(res);
  },

  deleteResident: async (id) => {
    const res = await fetch(`${API_BASE_URL}/residents/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) throw await parseError(res);
  },

  // Rides
  getRides: async () => {
    const res = await fetch(`${API_BASE_URL}/rides`, { headers: await authHeaders() });
    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  createRide: async (data) => {
    const res = await fetch(`${API_BASE_URL}/rides`, {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await parseError(res);
    try {
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  updateRide: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/rides/${id}`, {
      method: "PATCH",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await parseError(res);
  },

  deleteRide: async (id) => {
    const res = await fetch(`${API_BASE_URL}/rides/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) throw await parseError(res);
  },

  // Drivers
  getDrivers: async () => {
    const res = await fetch(`${API_BASE_URL}/drivers`, { headers: await authHeaders() });
    return res.json();
  },

  createDriver: async (data) => {
    const res = await fetch(`${API_BASE_URL}/drivers`, {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  updateDriver: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      method: "PATCH",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await parseError(res);
  },

  deleteDriver: async (id) => {
    const res = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) throw await parseError(res);
  },
};
