import { useState, useEffect } from "react";
import { api } from "../services/api";

const EMPTY = {
  firstName: "",
  lastName: "",
  phone: "",
  dateOfBirth: "",
  mobilityRequirements: "",
  medicalInfo: "",
  familyEmail: "",
  familyPhone: "",
  notes: "",
};

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function ResidentForm({ initial, onSubmit, onCancel, submitLabel }) {
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
        <Field label="First name">
          <input className="input" value={data.firstName} onChange={set("firstName")} required />
        </Field>
        <Field label="Last name">
          <input className="input" value={data.lastName} onChange={set("lastName")} required />
        </Field>
        <Field label="Phone">
          <input className="input" type="tel" value={data.phone} onChange={set("phone")} required />
        </Field>
        <Field label="Date of birth">
          <input className="input" type="date" value={data.dateOfBirth} onChange={set("dateOfBirth")} required />
        </Field>
        <Field label="Mobility requirements">
          <input className="input" placeholder="Wheelchair, Walker…" value={data.mobilityRequirements} onChange={set("mobilityRequirements")} />
        </Field>
        <Field label="Family email">
          <input className="input" type="email" value={data.familyEmail} onChange={set("familyEmail")} />
        </Field>
        <Field label="Family phone">
          <input className="input" type="tel" placeholder="for SMS updates" value={data.familyPhone} onChange={set("familyPhone")} />
        </Field>
      </div>
      <Field label="Medical info">
        <input className="input" value={data.medicalInfo} onChange={set("medicalInfo")} />
      </Field>
      <Field label="Notes">
        <input className="input" value={data.notes} onChange={set("notes")} />
      </Field>
      <div className="row-actions">
        <button type="submit" className="button">{submitLabel}</button>
        <button type="button" className="button secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function ResidentList() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editInitial, setEditInitial] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const load = async () => {
    try {
      setResidents(await api.getResidents());
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
      await api.createResident(data);
      setAdding(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const startEdit = async (id) => {
    try {
      const r = await api.getResident(id);
      setEditInitial({
        firstName: r.firstName || "",
        lastName: r.lastName || "",
        phone: r.phone || "",
        dateOfBirth: (r.dateOfBirth || "").slice(0, 10),
        mobilityRequirements: r.mobilityRequirements || "",
        medicalInfo: r.medicalInfo || "",
        familyEmail: r.familyEmail || "",
        familyPhone: r.familyPhone || "",
        notes: r.notes || "",
      });
      setEditingId(id);
    } catch (e) {
      setError(e.message);
    }
  };

  const saveEdit = async (data) => {
    try {
      await api.updateResident(editingId, data);
      setEditingId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.firstName} ${r.lastName}? This also removes their rides.`)) return;
    try {
      await api.deleteResident(r.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const copyId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  return (
    <div className="card">
      <h2>Residents</h2>
      {error && <p style={{ color: "#d9453d", marginBottom: "12px" }}>{error}</p>}

      {!adding && !editingId && (
        <button className="button" style={{ marginBottom: "16px" }} onClick={() => setAdding(true)}>
          Add Resident
        </button>
      )}

      {adding && (
        <ResidentForm key="add" initial={EMPTY} onSubmit={add} onCancel={() => setAdding(false)} submitLabel="Add Resident" />
      )}

      {editingId && editInitial && (
        <ResidentForm
          key={editingId}
          initial={editInitial}
          onSubmit={saveEdit}
          onCancel={() => setEditingId(null)}
          submitLabel="Save changes"
        />
      )}

      {loading ? (
        <p>Loading residents…</p>
      ) : residents.length === 0 ? (
        <p className="muted">No residents yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Mobility</th>
                <th>Status</th>
                <th>ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r.id}>
                  <td>{r.firstName} {r.lastName}</td>
                  <td>{r.phone}</td>
                  <td>{r.mobilityRequirements || <span className="muted">None</span>}</td>
                  <td style={{ color: r.status === "active" ? "green" : "#d9453d" }}>{r.status}</td>
                  <td>
                    <button className="mono" style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }} onClick={() => copyId(r.id)} title="Copy ID">
                      {copiedId === r.id ? "copied ✓" : r.id.slice(0, 8) + "…"}
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="button secondary sm" onClick={() => startEdit(r.id)}>Edit</button>
                      <button className="button danger sm" onClick={() => remove(r)}>Delete</button>
                    </div>
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
