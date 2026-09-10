import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../services/api";

const fmt = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

// Next status a driver can move a ride to.
const NEXT = {
  scheduled: [["in_progress", "Start / picked up"]],
  assigned: [["in_progress", "Start / picked up"]],
  in_progress: [["completed", "Complete"]],
};

export default function DriverView() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [rides, setRides] = useState([]);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [lastPing, setLastPing] = useState(null);
  const watchId = useRef(null);
  const lastSent = useRef(0);

  const loadProfile = useCallback(
    () =>
      api
        .getMyDriver()
        .then((p) => {
          setProfile(p);
          setForm({
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            phone: p.phone || "",
            vehicleType: p.vehicleType || "",
            vehiclePlate: p.vehiclePlate || "",
          });
        })
        .catch((e) => setError(e.message)),
    []
  );
  const loadRides = useCallback(() => api.getRides().then(setRides).catch((e) => setError(e.message)), []);

  useEffect(() => {
    loadProfile();
    loadRides();
    const t = setInterval(loadRides, 20000);
    return () => clearInterval(t);
  }, [loadProfile, loadRides]);

  // Location sharing via the browser.
  useEffect(() => {
    if (!sharing) {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      return;
    }
    if (!navigator.geolocation) {
      setError("This device can't share location.");
      setSharing(false);
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent.current < 12000) return;
        lastSent.current = now;
        api
          .postMyLocation(pos.coords.latitude, pos.coords.longitude)
          .then(() => setLastPing(new Date()))
          .catch((e) => setError(e.message));
      },
      (e) => {
        setError(`Location: ${e.message}`);
        setSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [sharing]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.updateMyDriver(form);
      setEditing(false);
      loadProfile();
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = async (id, status) => {
    try {
      await api.updateRide(id, { status });
      loadRides();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card">
      <h2>My Driver Dashboard</h2>
      {error && <p style={{ color: "#d9453d" }}>{error}</p>}

      <div style={{ padding: "16px", background: "#f9f9f9", borderRadius: "8px", marginBottom: "20px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
          <input type="checkbox" checked={sharing} onChange={(e) => setSharing(e.target.checked)} />
          Share my location while driving
        </label>
        {sharing && (
          <p className="muted" style={{ fontSize: "13px", marginTop: "6px" }}>
            {lastPing ? `Last sent ${lastPing.toLocaleTimeString()}` : "Waiting for GPS…"}
          </p>
        )}
      </div>

      <h3 style={{ marginBottom: "8px" }}>Profile</h3>
      {!editing ? (
        <div style={{ marginBottom: "20px" }}>
          <p>{profile?.firstName} {profile?.lastName}</p>
          <p className="muted">{profile?.phone || "no phone"} · {profile?.vehicleType || "no vehicle"} {profile?.vehiclePlate}</p>
          <button className="button secondary sm" onClick={() => setEditing(true)}>Edit profile</button>
        </div>
      ) : (
        <form onSubmit={saveProfile} style={{ marginBottom: "20px" }} className="form-grid">
          {[
            ["firstName", "First name"],
            ["lastName", "Last name"],
            ["phone", "Phone"],
            ["vehicleType", "Vehicle type"],
            ["vehiclePlate", "Plate"],
          ].map(([k, label]) => (
            <div className="field" key={k}>
              <label>{label}</label>
              <input className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div className="row-actions" style={{ gridColumn: "1 / -1" }}>
            <button type="submit" className="button">Save</button>
            <button type="button" className="button secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      )}

      <h3 style={{ marginBottom: "8px" }}>My Rides</h3>
      {rides.length === 0 ? (
        <p className="muted">No rides assigned to you.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {rides.map((r) => (
            <div key={r.id} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontWeight: 700 }}>{r.residentName}</div>
              <div className="muted">{r.pickupAddress} → {r.destinationAddress}</div>
              <div className="mono">{fmt(r.scheduledPickupTime)} · {r.appointmentType}</div>
              <div style={{ margin: "6px 0" }}>
                Status: <strong>{r.status}</strong>
              </div>
              <div className="row-actions">
                {(NEXT[r.status] || []).map(([s, label]) => (
                  <button key={s} className="button sm" onClick={() => setStatus(r.id, s)}>{label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
