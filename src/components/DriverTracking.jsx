import { useState, useEffect } from "react";
import { api } from "../services/api";
import DriverMap from "./DriverMap";

const STATUS_COLOR = { pending: "#e8a33d", approved: "green", active: "green", rejected: "#d9453d" };

function NearbySearch({ facilityId, onAdded }) {
  const [radius, setRadius] = useState(25);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const search = async () => {
    setSearching(true);
    setError("");
    try {
      setResults(await api.getNearbyProviders(facilityId, radius));
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const add = async (body, key) => {
    setBusyId(key);
    setError("");
    try {
      await api.addFacilityProvider(facilityId, body);
      setResults((r) =>
        r && {
          drivers: r.drivers.filter((d) => d.id !== body.driverId),
          companies: r.companies.filter((c) => c.id !== body.transportCompanyId),
        }
      );
      await onAdded();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ padding: "16px", background: "#f9f9f9", borderRadius: "8px", marginBottom: "16px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
        <label>Within</label>
        <input
          type="number"
          min="1"
          max="500"
          className="input"
          style={{ width: "80px" }}
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
        />
        <label>miles of your facility</label>
        <button className="button sm" onClick={search} disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </button>
      </div>
      {error && <p style={{ color: "#d9453d", marginBottom: "12px" }}>{error}</p>}
      {results && (
        <>
          <h4 style={{ marginBottom: "6px" }}>Independent drivers</h4>
          {results.drivers.length === 0 ? (
            <p className="muted" style={{ marginBottom: "12px", fontSize: "13px" }}>
              None in range. (Only drivers who've shared a location at least once can be placed.)
            </p>
          ) : (
            <table className="data-table" style={{ marginBottom: "12px" }}>
              <tbody>
                {results.drivers.map((d) => (
                  <tr key={d.id}>
                    <td>{d.firstName} {d.lastName}</td>
                    <td className="muted">{d.vehicleType || "—"}</td>
                    <td className="muted">{d.distanceMiles} mi</td>
                    <td>
                      <button className="button sm" disabled={busyId === d.id} onClick={() => add({ driverId: d.id }, d.id)}>
                        + Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h4 style={{ marginBottom: "6px" }}>Transport companies</h4>
          {results.companies.length === 0 ? (
            <p className="muted" style={{ fontSize: "13px" }}>None in range.</p>
          ) : (
            <table className="data-table">
              <tbody>
                {results.companies.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className="muted">{c.driverCount} driver{c.driverCount === 1 ? "" : "s"}</td>
                    <td className="muted">{c.distanceMiles} mi</td>
                    <td>
                      <button className="button sm" disabled={busyId === c.id} onClick={() => add({ transportCompanyId: c.id }, c.id)}>
                        + Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

function IndependentDriverCard({ d, isAdmin, busyId, onRemove }) {
  return (
    <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", border: "1px solid #ddd" }}>
      <h3 style={{ marginBottom: "4px" }}>{d.firstName} {d.lastName}</h3>
      <p className="muted" style={{ marginBottom: "10px" }}>Independent driver</p>
      <p><strong>Phone:</strong> {d.phone || "—"}</p>
      <p><strong>Vehicle:</strong> {d.vehicleType || "—"} {d.vehiclePlate ? `(${d.vehiclePlate})` : ""}</p>
      <p>
        <strong>Status:</strong>{" "}
        <span style={{ color: d.status === "active" ? "green" : "#d9453d", fontWeight: 600 }}>{d.status}</span>
      </p>
      <p>
        <strong>Vetting:</strong>{" "}
        <span style={{ color: STATUS_COLOR[d.backgroundCheckStatus] || "#333", fontWeight: 600 }}>
          {d.backgroundCheckStatus}
        </span>
      </p>
      {isAdmin && (
        <div className="row-actions" style={{ marginTop: "10px" }}>
          <button className="button danger sm" disabled={busyId === d.providerLinkId} onClick={onRemove}>
            {busyId === d.providerLinkId ? "Removing…" : "Remove"}
          </button>
        </div>
      )}
    </div>
  );
}

function CompanyCard({ c, isAdmin, busyId, onRemove }) {
  return (
    <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", border: "1px solid #ddd" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ marginBottom: "4px" }}>{c.name}</h3>
          <p className="muted" style={{ marginBottom: "10px" }}>
            Transport company · {c.drivers.length} driver{c.drivers.length === 1 ? "" : "s"}
          </p>
        </div>
        {isAdmin && (
          <button className="button danger sm" disabled={busyId === c.providerLinkId} onClick={onRemove}>
            {busyId === c.providerLinkId ? "Removing…" : "Remove"}
          </button>
        )}
      </div>
      {c.drivers.length === 0 ? (
        <p className="muted">No drivers on their roster yet.</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: "18px" }}>
          {c.drivers.map((d) => (
            <li key={d.driverId}>
              {d.firstName} {d.lastName}{" "}
              <span style={{ color: STATUS_COLOR[d.backgroundCheckStatus] || "#333", fontWeight: 600 }}>
                ({d.backgroundCheckStatus})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DriverTracking({ isAdmin, facilityId }) {
  const [data, setData] = useState({ independentDrivers: [], companies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      setData(await api.getFacilityProviders(facilityId));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!facilityId) return;
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [facilityId]);

  const remove = async (providerLinkId, label) => {
    if (!window.confirm(`Remove ${label} from your providers?`)) return;
    setBusyId(providerLinkId);
    setError("");
    try {
      await api.removeFacilityProvider(facilityId, providerLinkId);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const allDrivers = [...data.independentDrivers, ...data.companies.flatMap((c) => c.drivers)];
  const isEmpty = data.independentDrivers.length === 0 && data.companies.length === 0;

  return (
    <>
      <div className="card">
        <h2>Live Tracking</h2>
        <DriverMap drivers={allDrivers} />
      </div>
      <div className="card">
        <h2>Drivers</h2>
        <p className="muted" style={{ fontSize: "13px", marginBottom: "12px" }}>
          Your facility's own picks from TrustedTransit's vetted driver/company pool — not every provider on the platform.
        </p>
        {error && <p style={{ color: "#d9453d", marginBottom: "12px" }}>{error}</p>}

        {isAdmin && !adding && (
          <button className="button" style={{ marginBottom: "16px" }} onClick={() => setAdding(true)}>
            Add Driver
          </button>
        )}
        {isAdmin && adding && (
          <>
            <NearbySearch facilityId={facilityId} onAdded={load} />
            <button className="button secondary sm" style={{ marginBottom: "16px" }} onClick={() => setAdding(false)}>
              Done
            </button>
          </>
        )}

        {loading ? (
          <p>Loading drivers…</p>
        ) : isEmpty ? (
          <p className="muted">No providers added yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {data.independentDrivers.map((d) => (
              <IndependentDriverCard
                key={d.driverId}
                d={d}
                isAdmin={isAdmin}
                busyId={busyId}
                onRemove={() => remove(d.providerLinkId, `${d.firstName} ${d.lastName}`)}
              />
            ))}
            {data.companies.map((c) => (
              <CompanyCard
                key={c.companyId}
                c={c}
                isAdmin={isAdmin}
                busyId={busyId}
                onRemove={() => remove(c.providerLinkId, c.name)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
