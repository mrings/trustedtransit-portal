const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

export const api = {
  // Facilities
  getFacilities: async () => {
    const res = await fetch(`${API_BASE_URL}/facilities`);
    return res.json();
  },

  getFacility: async (id) => {
    const res = await fetch(`${API_BASE_URL}/facilities/${id}`);
    return res.json();
  },

  createFacility: async (data) => {
    const res = await fetch(`${API_BASE_URL}/facilities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Residents
  getResidents: async (facilityId) => {
    const res = await fetch(`${API_BASE_URL}/residents?facilityId=${facilityId}`);
    return res.json();
  },

createResident: async (data) => {
  const res = await fetch(`${API_BASE_URL}/residents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error: ${res.status} - ${errorText}`);
  }
  
  try {
    return await res.json();
  } catch (e) {
    // If response isn't JSON, return success anyway
    return { success: true };
  }
},

  // Rides
  getRides: async (facilityId) => {
    const res = await fetch(`${API_BASE_URL}/rides?facilityId=${facilityId}`);
    return res.json();
  },

createRide: async (data) => {
  const res = await fetch(`${API_BASE_URL}/rides`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error: ${res.status} - ${errorText}`);
  }
  
  try {
    return await res.json();
  } catch (e) {
    return { success: true };
  }
},

  updateRideStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/rides/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Drivers
  getDrivers: async () => {
    const res = await fetch(`${API_BASE_URL}/drivers`);
    return res.json();
  },

  createDriver: async (data) => {
    const res = await fetch(`${API_BASE_URL}/drivers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};