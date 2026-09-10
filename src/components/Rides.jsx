import { useState, useEffect, useCallback, Fragment } from "react";
import { api } from "../services/api";
import RecurringRides from "./RecurringRides";

const STATUSES = ["scheduled", "assigned", "in_progress", "completed", "cancelled"];
const STATUS_COLOR = {
  scheduled: "#666",
  assigned: "#2f6fed",
  in_progress: "#e8a33d",
  completed: "green",
  cancelled: "#d9453d",
};

const EMPTY = {
  residentId: "",
  pickupAddress: "",
  destinationAddress: "",
  scheduledTime: "",
  appointmentType: "",
};

function ScheduleForm({ residents, onCreate, onCancel }) {
  const [data, setData] = useState(EMPTY);
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({
          residentId: data.residentId,
          pickupAddress: data.pickupAddress,
          destinationAddress: data.destinationAddress,
          scheduledPickupTime: new Date(data.scheduledTime).toISOString(),
          appointmentType: data.appointmentType,
          rideType: "one-time",
        });
      }}
      style={{ padding: "16px", background: "#f9f9f9", borderRadius: "8px", marginBottom: "16px" }}
    >
      <div className="form-grid">
        <div className="field">
          <label>Resident</label>
          <select className="input" value={data.residentId} onChange={set("residentId")} required>
            <option value="">Select a resident…</option>
            {residents.map((r) => (
              <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Appointment type</label>
          <select className="input" value={data.appointmentType} onChange={set("appointmentType")} required>
            <option value="">Select type</option>
            <option value="medical">Medical</option>
            <option value="shopping">Shopping</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Pickup address</label>
          <input className="input" value={data.pickupAddress} onChange={set("pickupAddress")} required />
        </div>
        <div className="field">
          <label>Destination address</label>
          <input className="input" value={data.destinationAddress} onChange={set("destinationAddress")} required />
        </div>
        <div className="field">
          <label>Scheduled pickup</label>
          <input className="input" type="datetime-local" value={data.scheduledTime} onChange={set("scheduledTime")} required />
        </div>
      </div>
      <div className="row-actions">
        <button type="submit" className="button">Schedule Ride</button>
        <button type="button" className="button secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

const fmt = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

export default function Rides() {
  const [rides, setRides] = useState([]);
  const [residents, setResidents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [recurringAllowed, setRecurringAllowed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const [r, res, drv, sub] = await Promise.all([
        api.getRides(),
        api.getResidents(),
        api.getDrivers(),
        api.getSubscription().catch(() => null),
      ]);
      setRides(r);
      setResidents(res);
      setDrivers(drv);
      if (sub) setRecurringAllowed(sub.recurringRidesAllowed);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (data) => {
    try {
      await api.createRide(data);
      setScheduling(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const patch = async (id, body) => {
    setBusy(id);
    setError("");
    try {
      await api.updateRide(id, body);
      await load();
    } catch (e) {
      setError(e.message);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (ride) => {
    if (!window.confirm(`Delete this ride for ${ride.residentName}?`)) return;
    setBusy(ride.id);
    try {
      await api.deleteRide(ride.id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const [expandedId, setExpandedId] = useState(null);
  const [notifs, setNotifs] = useState({});

  const toggleNotifs = async (rideId) => {
    if (expandedId === rideId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(rideId);
    if (!notifs[rideId]) {
      try {
        const list = await api.getRideNotifications(rideId);
        setNotifs((n) => ({ ...n, [rideId]: list }));
      } catch {
        setNotifs((n) => ({ ...n, [rideId]: [] }));
      }
    }
  };

  const activeDrivers = drivers.filter((d) => d.status === "active");

  return (
    <>
    <div className="card">
      <h2>Rides</h2>
      {error && <p style={{ color: "#d9453d", marginBottom: "12px" }}>{error}</p>}

      {!scheduling && (
        <button className="button" style={{ marginBottom: "16px" }} onClick={() => setScheduling(true)}>
          Schedule a Ride
        </button>
      )}
      {scheduling && (
        <ScheduleForm residents={residents} onCreate={create} onCancel={() => setScheduling(false)} />
      )}

      {loading ? (
        <p>Loading rides…</p>
      ) : rides.length === 0 ? (
        <p className="muted">No rides scheduled.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Resident</th>
                <th>Trip</th>
                <th>Scheduled</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Family</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <Fragment key={r.id}>
                <tr>
                  <td>
                    {r.residentName}
                    {r.recurring && (
                      <span className="mono" style={{ display: "block", color: "#2f6fed" }}>↻ recurring</span>
                    )}
                  </td>
                  <td>
                    <div>{r.pickupAddress || "—"}</div>
                    <div className="muted">→ {r.destinationAddress || "—"}</div>
                    {r.appointmentType && <div className="mono">{r.appointmentType}</div>}
                  </td>
                  <td>{fmt(r.scheduledPickupTime)}</td>
                  <td>
                    <select
                      value={r.driverId || ""}
                      disabled={busy === r.id}
                      onChange={(e) =>
                        e.target.value
                          ? patch(r.id, { driverId: e.target.value })
                          : patch(r.id, { unassignDriver: true })
                      }
                      style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ddd" }}
                    >
                      <option value="">— unassigned —</option>
                      {activeDrivers.map((d) => (
                        <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                      ))}
                      {r.driverId && !activeDrivers.some((d) => d.id === r.driverId) && (
                        <option value={r.driverId}>{r.driverName} (inactive)</option>
                      )}
                    </select>
                  </td>
                  <td>
                    <select
                      value={r.status}
                      disabled={busy === r.id}
                      onChange={(e) => patch(r.id, { status: e.target.value })}
                      style={{
                        padding: "6px",
                        borderRadius: "6px",
                        border: "1px solid #ddd",
                        fontWeight: 600,
                        color: STATUS_COLOR[r.status] || "#333",
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="button secondary sm"
                      title="Family notification history"
                      onClick={() => toggleNotifs(r.id)}
                    >
                      ✉ {r.notificationCount || 0}
                    </button>
                  </td>
                  <td>
                    <button className="button danger sm" disabled={busy === r.id} onClick={() => remove(r)}>
                      Delete
                    </button>
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr>
                    <td colSpan={7} style={{ background: "#fafafa" }}>
                      {!notifs[r.id] ? (
                        <span className="muted">Loading…</span>
                      ) : notifs[r.id].length === 0 ? (
                        <span className="muted">No family notifications sent for this ride.</span>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px" }}>
                          {notifs[r.id].map((n, i) => (
                            <li key={i} style={{ color: n.success ? "#333" : "#d9453d" }}>
                              {new Date(n.createdAt).toLocaleString()} · <strong>{n.event}</strong> · {n.channel} → {n.recipient}
                              {n.success ? " ✓" : ` ✗ ${n.error}`}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    <RecurringRides onChange={load} allowed={recurringAllowed} />
    </>
  );
}
