import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../services/api";
import "../App.css";

const fmt = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const STATUS_LABEL = {
  scheduled: "Scheduled",
  assigned: "Driver assigned",
  in_progress: "On the way",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function TrackRide({ token }) {
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api
      .getPublicRideTracking(token)
      .then((d) => {
        setData(d);
        setNotFound(false);
        setError("");
      })
      .catch((e) => {
        if (e.message.includes("404")) setNotFound(true);
        else setError(e.message);
      });
  }, [token]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="app">
      <header className="header">
        <h1>Trusted Transit</h1>
        <p>Ride tracking</p>
      </header>
      <main className="content" style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 16px", width: "100%" }}>
        {notFound && (
          <div className="card">
            <p>This tracking link isn't valid, or the ride it points to no longer exists.</p>
          </div>
        )}
        {!notFound && error && (
          <div className="card">
            <p style={{ color: "#d9453d" }}>{error}</p>
          </div>
        )}
        {!notFound && !error && !data && (
          <div className="card">
            <p className="muted">Loading…</p>
          </div>
        )}
        {data && (
          <>
            <div className="card">
              <h2 style={{ marginBottom: "8px" }}>{data.residentFirstName}'s ride</h2>
              <p style={{ fontWeight: 600, marginBottom: "10px" }}>
                {STATUS_LABEL[data.status] || data.status}
              </p>
              <p className="muted">{fmt(data.scheduledPickupTime)}{data.appointmentType ? ` · ${data.appointmentType}` : ""}</p>
              <div style={{ margin: "14px 0" }}>
                <div>{data.pickupAddress || "—"}</div>
                <div className="muted">→ {data.destinationAddress || "—"}</div>
              </div>
              {data.driverName && (
                <p className="muted">
                  Driver: {data.driverName}
                  {data.vehicleType ? ` · ${data.vehicleType}` : ""}
                  {data.vehiclePlate ? ` (${data.vehiclePlate})` : ""}
                </p>
              )}
            </div>

            <div className="card">
              <h2 style={{ marginBottom: "8px" }}>Live location</h2>
              {data.locationLat != null && data.locationLng != null ? (
                <MapContainer
                  center={[Number(data.locationLat), Number(data.locationLng)]}
                  zoom={13}
                  style={{ height: "320px", borderRadius: "8px" }}
                >
                  <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <CircleMarker
                    center={[Number(data.locationLat), Number(data.locationLng)]}
                    radius={9}
                    pathOptions={{ color: "#667eea", fillColor: "#667eea", fillOpacity: 0.8 }}
                  >
                    <Popup>{data.driverName || "Driver"}</Popup>
                  </CircleMarker>
                </MapContainer>
              ) : (
                <p className="muted">Live location isn't available right now.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
