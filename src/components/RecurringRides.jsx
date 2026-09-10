import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const daysToLabel = (csv) =>
  (csv || "")
    .split(",")
    .filter((s) => s !== "")
    .map((n) => DAY_LABELS[Number(n)])
    .join(" ");

const EMPTY = {
  residentId: "",
  driverId: "",
  pickupAddress: "",
  destinationAddress: "",
  appointmentType: "",
  days: [],
  pickupTime: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
};

function SeriesForm({ residents, drivers, initial, onSubmit, onCancel, submitLabel }) {
  const [data, setData] = useState(initial);
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value });
  const toggleDay = (n) =>
    setData({
      ...data,
      days: data.days.includes(n) ? data.days.filter((d) => d !== n) : [...data.days, n].sort(),
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (data.days.length === 0) return;
        onSubmit({
          residentId: data.residentId,
          driverId: data.driverId || null,
          driverIdSet: true,
          pickupAddress: data.pickupAddress,
          destinationAddress: data.destinationAddress,
          appointmentType: data.appointmentType,
          daysOfWeek: data.days.join(","),
          pickupTime: data.pickupTime,
          startDate: data.startDate,
          endDate: data.endDate || null,
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
            <option value="dialysis">Dialysis</option>
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
          <label>Pickup time</label>
          <input className="input" type="time" value={data.pickupTime} onChange={set("pickupTime")} required />
        </div>
        <div className="field">
          <label>Driver (optional)</label>
          <select className="input" value={data.driverId} onChange={set("driverId")}>
            <option value="">— unassigned —</option>
            {drivers.filter((d) => d.status === "active").map((d) => (
              <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Start date</label>
          <input className="input" type="date" value={data.startDate} onChange={set("startDate")} required />
        </div>
        <div className="field">
          <label>End date (optional)</label>
          <input className="input" type="date" value={data.endDate} onChange={set("endDate")} />
        </div>
      </div>
      <div className="field">
        <label>Days</label>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {DAY_LABELS.map((lbl, n) => (
            <button
              type="button"
              key={n}
              onClick={() => toggleDay(n)}
              className={data.days.includes(n) ? "button sm" : "button secondary sm"}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <div className="row-actions">
        <button type="submit" className="button" disabled={data.days.length === 0}>{submitLabel}</button>
        <button type="button" className="button secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function RecurringRides({ onChange }) {
  const [series, setSeries] = useState([]);
  const [residents, setResidents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, res, drv] = await Promise.all([api.getRideSeries(), api.getResidents(), api.getDrivers()]);
      setSeries(s);
      setResidents(res);
      setDrivers(drv);
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

  const afterWrite = async () => {
    await load();
    onChange?.();
  };

  const create = async (body) => {
    try {
      await api.createRideSeries(body);
      setAdding(false);
      afterWrite();
    } catch (e) {
      setError(e.message);
    }
  };

  const saveEdit = async (body) => {
    try {
      await api.updateRideSeries(editingId, body);
      setEditingId(null);
      afterWrite();
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleActive = async (s) => {
    setBusy(s.id);
    try {
      await api.updateRideSeries(s.id, { active: !s.active });
      afterWrite();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete this recurring ride for ${s.residentName}? Upcoming un-started rides from it are removed too.`)) return;
    setBusy(s.id);
    try {
      await api.deleteRideSeries(s.id);
      afterWrite();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const editInitial = (s) => ({
    residentId: s.residentId,
    driverId: s.driverId || "",
    pickupAddress: s.pickupAddress,
    destinationAddress: s.destinationAddress,
    appointmentType: s.appointmentType,
    days: (s.daysOfWeek || "").split(",").filter((x) => x !== "").map(Number),
    pickupTime: s.pickupTime,
    startDate: s.startDate,
    endDate: s.endDate || "",
  });

  return (
    <div className="card">
      <h2>Recurring Rides</h2>
      {error && <p style={{ color: "#d9453d", marginBottom: "12px" }}>{error}</p>}

      {!adding && !editingId && (
        <button className="button" style={{ marginBottom: "16px" }} onClick={() => setAdding(true)}>
          Add Recurring Ride
        </button>
      )}
      {adding && (
        <SeriesForm
          key="add"
          residents={residents}
          drivers={drivers}
          initial={EMPTY}
          onSubmit={create}
          onCancel={() => setAdding(false)}
          submitLabel="Create"
        />
      )}

      {loading ? (
        <p>Loading…</p>
      ) : series.length === 0 ? (
        <p className="muted">No recurring rides.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Resident</th>
                <th>Days</th>
                <th>Time</th>
                <th>Trip</th>
                <th>Driver</th>
                <th>Dates</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) =>
                editingId === s.id ? (
                  <tr key={s.id}>
                    <td colSpan={7}>
                      <SeriesForm
                        key={s.id}
                        residents={residents}
                        drivers={drivers}
                        initial={editInitial(s)}
                        onSubmit={saveEdit}
                        onCancel={() => setEditingId(null)}
                        submitLabel="Save changes"
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id} style={{ opacity: s.active ? 1 : 0.5 }}>
                    <td>{s.residentName}</td>
                    <td>{daysToLabel(s.daysOfWeek)}</td>
                    <td>{s.pickupTime}</td>
                    <td>
                      <div>{s.pickupAddress}</div>
                      <div className="muted">→ {s.destinationAddress}</div>
                    </td>
                    <td>{s.driverName || <span className="muted">unassigned</span>}</td>
                    <td className="mono">
                      {s.startDate}
                      {s.endDate ? ` → ${s.endDate}` : " → open"}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="button secondary sm" disabled={busy === s.id} onClick={() => toggleActive(s)}>
                          {s.active ? "Pause" : "Resume"}
                        </button>
                        <button className="button secondary sm" onClick={() => setEditingId(s.id)}>Edit</button>
                        <button className="button danger sm" disabled={busy === s.id} onClick={() => remove(s)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
