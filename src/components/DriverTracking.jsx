import { useState, useEffect } from "react";
import { api } from "../services/api";
import DriverMap from "./DriverMap";
import { IconPlus } from "./Icons";

const STATUS_BADGE = { pending: "badge-warning", approved: "badge-success", active: "badge-success", rejected: "badge-danger" };

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
    <div className="panel">
      <div className="row-actions" style={{ marginBottom: "12px" }}>
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
      {error && <div className="alert alert-danger">{error}</div>}
      {results && (
        <>
          <h4 style={{ marginBottom: "6px", fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Independent drivers
          </h4>
          {results.drivers.length === 0 ? (
            <p className="section-note">
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
                        <IconPlus /> Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h4 style={{ marginBottom: "6px", fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Transport companies
          </h4>
          {results.companies.length === 0 ? (
            <p className="section-note" style={{ marginBottom: 0 }}>None in range.</p>
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
                        <IconPlus /> Add
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
    <div className="panel" style={{ marginBottom: 0 }}>
      <h3>{d.firstName} {d.lastName}</h3>
      <p className="muted" style={{ marginBottom: "10px" }}>Independent driver</p>
      <p><strong>Phone:</strong> {d.phone || "—"}</p>
      <p><strong>Vehicle:</strong> {d.vehicleType || "—"} {d.vehiclePlate ? `(${d.vehiclePlate})` : ""}</p>
      <p style={{ margin: "8px 0" }}>
        <strong>Status:</strong>{" "}
        <span className={`badge ${d.status === "active" ? "badge-success" : "badge-danger"}`}>{d.status}</span>
      </p>
      <p>
        <strong>Vetting:</strong>{" "}
        <span className={`badge ${STATUS_BADGE[d.backgroundCheckStatus] || "badge-neutral"}`}>
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
    <div className="panel" style={{ marginBottom: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3>{c.name}</h3>
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
            <li key={d.driverId} style={{ marginBottom: "4px" }}>
              {d.firstName} {d.lastName}{" "}
              <span className={`badge ${STATUS_BADGE[d.backgroundCheckStatus] || "badge-neutral"}`}>
                {d.backgroundCheckStatus}
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
        <p className="section-note">
          Your facility's own picks from TrustedTransit's vetted driver/company pool — not every provider on the platform.
        </p>
        {error && <div className="alert alert-danger">{error}</div>}

        {isAdmin && !adding && (
          <button className="button" style={{ marginBottom: "16px" }} onClick={() => setAdding(true)}>
            <IconPlus /> Add Driver
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
          <p className="muted">Loading drivers…</p>
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
