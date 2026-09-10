import { useState, useEffect } from "react";
import { api } from "../services/api";

const EMPTY = { firstName: "", lastName: "", phone: "", vehicleType: "", vehiclePlate: "" };

function DriverForm({ initial, onSubmit, onCancel, submitLabel, withStatus }) {
  const [data, setData] = useState(initial);
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
      }}
      style={{ padding: "16px", background: "#f9f9f9", borderRadius: "8px", marginBottom: "16px" }}
    >
      <div className="form-grid">
        <div className="field">
          <label>First name</label>
          <input className="input" value={data.firstName} onChange={set("firstName")} required />
        </div>
        <div className="field">
          <label>Last name</label>
          <input className="input" value={data.lastName} onChange={set("lastName")} required />
        </div>
        <div className="field">
          <label>Phone</label>
          <input className="input" type="tel" value={data.phone} onChange={set("phone")} required />
        </div>
        <div className="field">
          <label>Vehicle type</label>
          <input className="input" placeholder="Sedan, Wheelchair van…" value={data.vehicleType} onChange={set("vehicleType")} />
        </div>
        <div className="field">
          <label>Vehicle plate</label>
          <input className="input" value={data.vehiclePlate} onChange={set("vehiclePlate")} />
        </div>
        {withStatus && (
          <div className="field">
            <label>Status</label>
            <select className="input" value={data.status} onChange={set("status")}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
        )}
      </div>
      <div className="row-actions">
        <button type="submit" className="button">{submitLabel}</button>
        <button type="button" className="button secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function DriverTracking({ isAdmin }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try {
      setDrivers(await api.getDrivers());
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (data) => {
    try {
      await api.createDriver(data);
      setAdding(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const save = async (data) => {
    try {
      await api.updateDriver(editingId, data);
      setEditingId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete ${d.firstName} ${d.lastName}?`)) return;
    try {
      await api.deleteDriver(d.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="card">
      <h2>Drivers</h2>
      {error && <p style={{ color: "#d9453d", marginBottom: "12px" }}>{error}</p>}

      {isAdmin && !adding && !editingId && (
        <button className="button" style={{ marginBottom: "16px" }} onClick={() => setAdding(true)}>
          Add Driver
        </button>
      )}

      {adding && (
        <DriverForm key="add" initial={EMPTY} onSubmit={add} onCancel={() => setAdding(false)} submitLabel="Add Driver" />
      )}

      {loading ? (
        <p>Loading drivers…</p>
      ) : drivers.length === 0 ? (
        <p className="muted">No drivers yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {drivers.map((d) =>
            editingId === d.id ? (
              <DriverForm
                key={d.id}
                initial={{
                  firstName: d.firstName || "",
                  lastName: d.lastName || "",
                  phone: d.phone || "",
                  vehicleType: d.vehicleType || "",
                  vehiclePlate: d.vehiclePlate || "",
                  status: d.status || "active",
                }}
                withStatus
                onSubmit={save}
                onCancel={() => setEditingId(null)}
                submitLabel="Save changes"
              />
            ) : (
              <div key={d.id} style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", border: "1px solid #ddd" }}>
                <h3 style={{ marginBottom: "10px" }}>{d.firstName} {d.lastName}</h3>
                <p><strong>Phone:</strong> {d.phone || "—"}</p>
                <p><strong>Vehicle:</strong> {d.vehicleType || "—"} {d.vehiclePlate ? `(${d.vehiclePlate})` : ""}</p>
                <p><strong>Rating:</strong> ⭐ {d.rating}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: d.status === "active" ? "green" : "#d9453d", fontWeight: 600 }}>{d.status}</span>
                </p>
                <p className="mono" title="Driver ID">{d.id}</p>
                {isAdmin && (
                  <div className="row-actions" style={{ marginTop: "10px" }}>
                    <button className="button secondary sm" onClick={() => setEditingId(d.id)}>Edit</button>
                    <button className="button danger sm" onClick={() => remove(d)}>Delete</button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
