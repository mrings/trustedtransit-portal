import { useState, useEffect } from "react";
import { api } from "../services/api";

export default function Support({ onChange }) {
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

  return (
    <div className="card">
      <h2>Support — all facilities</h2>
      <p className="muted" style={{ fontSize: "13px", marginBottom: "12px" }}>
        Platform staff view. "Log in as admin" switches your account to that facility as its
        admin, bypassing subscription/plan limits, until you exit.
      </p>
      {error && <p style={{ color: "#d9453d", marginBottom: "12px" }}>{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : facilities.length === 0 ? (
        <p className="muted">No facilities exist yet.</p>
      ) : (
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
                    <span
                      style={{
                        fontWeight: 600,
                        color: f.subscriptionStatus === "active" ? "green" : "#d9453d",
                      }}
                    >
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
      )}
    </div>
  );
}
