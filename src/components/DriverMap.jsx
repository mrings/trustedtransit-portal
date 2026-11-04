import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const RECENT_MS = 30 * 60 * 1000;
const ago = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} h ago`;
};

// Shared live-location map, used by both the facility Drivers tab (all drivers) and a
// transportation company's own view (just its roster) — callers pass whichever drivers list.
export default function DriverMap({ drivers, emptyMessage = "No drivers are sharing their location right now." }) {
  const live = useMemo(
    () =>
      drivers.filter(
        (d) =>
          d.locationLat != null &&
          d.locationLng != null &&
          d.lastLocationUpdate &&
          Date.now() - new Date(d.lastLocationUpdate) < RECENT_MS
      ),
    [drivers]
  );

  const center = live.length
    ? [
        live.reduce((s, d) => s + Number(d.locationLat), 0) / live.length,
        live.reduce((s, d) => s + Number(d.locationLng), 0) / live.length,
      ]
    : [39.5, -98.35];

  return (
    <div style={{ marginBottom: "20px" }}>
      {live.length === 0 && <p className="muted">{emptyMessage}</p>}
      <MapContainer
        center={center}
        zoom={live.length ? 11 : 4}
        style={{ height: "360px", borderRadius: "8px" }}
        key={live.map((d) => d.id).join(",")}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {live.map((d) => (
          <CircleMarker
            key={d.id}
            center={[Number(d.locationLat), Number(d.locationLng)]}
            radius={9}
            pathOptions={{ color: "#667eea", fillColor: "#667eea", fillOpacity: 0.8 }}
          >
            <Popup>
              <strong>{d.firstName} {d.lastName}</strong>
              <br />
              {d.vehicleType || "—"}
              <br />
              updated {ago(d.lastLocationUpdate)}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
