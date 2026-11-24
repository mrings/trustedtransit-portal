import { useState, useEffect } from "react";
import { api } from "../services/api";

function FacilitiesPanel({ onChange }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    api
      .getSupportFacilities()
      .then(setFacilities)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const impersonate = async (f) => {
    if (!window.confirm(`Log in as the admin of "${f.name}"?`)) return;
    setBusyId(f.id);
    setError("");
    try {
      await api.impersonateFacility(f.id);
      await onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="muted">Loading…</p>;
  if (facilities.length === 0) return <p className="muted">No facilities exist yet.</p>;

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Staff</th>
              <th>Residents</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td className="muted">{[f.city, f.state].filter(Boolean).join(", ") || "—"}</td>
                <td className="mono">{f.subscriptionTier}</td>
                <td>
                  <span className={`badge ${f.subscriptionStatus === "active" ? "badge-success" : "badge-danger"}`}>
                    {f.subscriptionStatus}
                  </span>
                </td>
                <td>{f.staffCount}</td>
                <td>{f.residentCount}</td>
                <td>
                  <button className="button sm" disabled={busyId === f.id} onClick={() => impersonate(f)}>
                    {busyId === f.id ? "Switching…" : "Log in as admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const COMPANY_STATUSES = ["pending", "active", "rejected"];
const DRIVER_STATUSES = ["pending", "approved", "rejected"];
const STATUS_BADGE = { pending: "badge-warning", active: "badge-success", approved: "badge-success", rejected: "badge-danger" };

function CompaniesPanel() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    api
      .getSupportCompanies()
      .then(setCompanies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (c, status) => {
    setBusyId(c.id);
    setError("");
    try {
      await api.vetCompany(c.id, status);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="muted">Loading…</p>;
  if (companies.length === 0) return <p className="muted">No transportation companies have registered yet.</p>;

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Domains</th>
              <th>Drivers</th>
              <th>Vetting</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="muted">{[c.city, c.state].filter(Boolean).join(", ") || "—"}</td>
                <td>{c.domainCount}</td>
                <td>{c.driverCount}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[c.status] || "badge-neutral"}`}>{c.status}</span>
                </td>
                <td>
                  <select
                    className="input"
                    style={{ width: "auto" }}
                    value={c.status}
                    disabled={busyId === c.id}
                    onChange={(e) => setStatus(c, e.target.value)}
                  >
                    {COMPANY_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="section-note" style={{ marginTop: "12px", marginBottom: 0 }}>
        Only "active" companies auto-join new drivers who sign in at a claimed email domain.
        Vetting a company doesn't vet its drivers — approve each driver separately below.
      </p>
    </>
  );
}

function DriversPanel() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    api
      .getSupportDrivers()
      .then(setDrivers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (d, status) => {
    setBusyId(d.id);
    setError("");
    try {
      await api.vetDriver(d.id, status);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="muted">Loading…</p>;
  if (drivers.length === 0) return <p className="muted">No drivers yet.</p>;

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>Roster status</th>
              <th>Vetting</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td>{d.firstName} {d.lastName}</td>
                <td className="muted">{d.transportCompanyName || "Independent"}</td>
                <td>{d.phone || "—"}</td>
                <td>{d.vehicleType || "—"} {d.vehiclePlate ? `(${d.vehiclePlate})` : ""}</td>
                <td className="muted">{d.status}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[d.backgroundCheckStatus] || "badge-neutral"}`}>
                    {d.backgroundCheckStatus}
                  </span>
                </td>
                <td>
                  <select
                    className="input"
                    style={{ width: "auto" }}
                    value={d.backgroundCheckStatus}
                    disabled={busyId === d.id}
                    onChange={(e) => setStatus(d, e.target.value)}
                  >
                    {DRIVER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="section-note" style={{ marginTop: "12px", marginBottom: 0 }}>
        Only drivers marked "approved" (and roster status "active") can be assigned to rides by
        any facility. New drivers default to "pending" and aren't bookable until vetted here.
      </p>
    </>
  );
}

function AuditLogPanel() {
  const ACTION_LABELS = {
    impersonate_facility: "Logged in as facility admin",
    exit_impersonation: "Exited impersonation",
    vet_driver: "Vetted driver",
    vet_company: "Vetted company",
  };

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getAuditLog()
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (entries.length === 0) return <p className="muted">No super-admin actions logged yet.</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="muted">{new Date(e.createdAt).toLocaleString()}</td>
              <td>{e.actorEmail}</td>
              <td>{ACTION_LABELS[e.action] || e.action}</td>
              <td className="muted">{e.detail || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TABS = ["facilities", "companies", "drivers", "audit log"];

export default function Support({ onChange }) {
  const [tab, setTab] = useState("facilities");

  return (
    <div className="card">
      <h2>Support</h2>
      <p className="section-note">
        Platform staff view — every facility, transportation company, and driver across TrustedTransit.
      </p>
      <div className="row-actions" style={{ marginBottom: "16px" }}>
        {TABS.map((t) => (
          <button
            key={t}
            className={tab === t ? "button sm" : "button secondary sm"}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "facilities" && <FacilitiesPanel onChange={onChange} />}
      {tab === "companies" && <CompaniesPanel />}
      {tab === "drivers" && <DriversPanel />}
      {tab === "audit log" && <AuditLogPanel />}
    </div>
  );
}
