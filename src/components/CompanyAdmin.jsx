import { useState, useEffect } from "react";
import { api } from "../services/api";
import DriverMap from "./DriverMap";

const FIELDS = [
  ["name", "Company name"],
  ["address", "Address"],
  ["city", "City"],
  ["state", "State"],
  ["zip", "ZIP"],
  ["phone", "Phone"],
];

const EMPTY_DRIVER = { firstName: "", lastName: "", phone: "", vehicleType: "", vehiclePlate: "", email: "" };

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ddd",
};

export default function CompanyAdmin({ me }) {
  const companyId = me.transportCompanyId;

  const [form, setForm] = useState(null);
  const [companyStatus, setCompanyStatus] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyMsg, setCompanyMsg] = useState("");

  const [domains, setDomains] = useState([]);
  const [domainInput, setDomainInput] = useState("");
  const [domainBusy, setDomainBusy] = useState(false);
  const [domainMsg, setDomainMsg] = useState("");

  const [drivers, setDrivers] = useState([]);
  const [driverMsg, setDriverMsg] = useState("");
  const [busyDriver, setBusyDriver] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newDriver, setNewDriver] = useState(EMPTY_DRIVER);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_DRIVER);

  const loadCompany = () =>
    api
      .getCompany(companyId)
      .then((c) => {
        setForm({
          name: c.name || "",
          address: c.address || "",
          city: c.city || "",
          state: c.state || "",
          zip: c.zip || "",
          phone: c.phone || "",
        });
        setCompanyStatus(c.status || "");
      })
      .catch(() => setCompanyMsg("Could not load company."));

  const loadDomains = () =>
    api.getCompanyDomains(companyId).then(setDomains).catch((err) => setDomainMsg(err.message));

  const loadDrivers = () =>
    api.getCompanyDrivers(companyId).then(setDrivers).catch((err) => setDriverMsg(err.message));

  useEffect(() => {
    if (companyId) {
      loadCompany();
      loadDomains();
      loadDrivers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Keep the live-tracking map fresh without re-fetching company/domain data too.
  useEffect(() => {
    if (!companyId) return;
    const t = setInterval(loadDrivers, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const saveCompany = async (e) => {
    e.preventDefault();
    setSaving(true);
    setCompanyMsg("");
    try {
      await api.updateCompany(companyId, form);
      setCompanyMsg("Saved.");
      setEditing(false);
      await loadCompany();
    } catch (err) {
      setCompanyMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setCompanyMsg("");
    loadCompany();
  };

  const addDomain = async (e) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    setDomainBusy(true);
    setDomainMsg("");
    try {
      await api.addCompanyDomain(companyId, domainInput.trim());
      setDomainInput("");
      await loadDomains();
    } catch (err) {
      setDomainMsg(err.message);
    } finally {
      setDomainBusy(false);
    }
  };

  const removeDomain = async (domainId) => {
    if (!window.confirm("Remove this domain? Drivers will no longer auto-join using it.")) return;
    setDomainBusy(true);
    setDomainMsg("");
    try {
      await api.removeCompanyDomain(companyId, domainId);
      await loadDomains();
    } catch (err) {
      setDomainMsg(err.message);
    } finally {
      setDomainBusy(false);
    }
  };

  const addDriver = async (e) => {
    e.preventDefault();
    setBusyDriver("new");
    setDriverMsg("");
    try {
      await api.createCompanyDriver(companyId, newDriver);
      setNewDriver(EMPTY_DRIVER);
      setAdding(false);
      await loadDrivers();
    } catch (err) {
      setDriverMsg(err.message);
    } finally {
      setBusyDriver(null);
    }
  };

  const startEditDriver = (d) => {
    setEditingId(d.id);
    setEditForm({
      firstName: d.firstName || "",
      lastName: d.lastName || "",
      phone: d.phone || "",
      vehicleType: d.vehicleType || "",
      vehiclePlate: d.vehiclePlate || "",
      email: d.email || "",
    });
    setDriverMsg("");
  };

  const saveEditDriver = async (e) => {
    e.preventDefault();
    setBusyDriver(editingId);
    setDriverMsg("");
    try {
      await api.updateDriver(editingId, editForm);
      setEditingId(null);
      await loadDrivers();
    } catch (err) {
      setDriverMsg(err.message);
    } finally {
      setBusyDriver(null);
    }
  };

  const changeDriverStatus = async (driverId, status) => {
    setBusyDriver(driverId);
    setDriverMsg("");
    try {
      await api.updateDriver(driverId, { status });
      await loadDrivers();
    } catch (err) {
      setDriverMsg(err.message);
    } finally {
      setBusyDriver(null);
    }
  };

  const removeDriver = async (driverId) => {
    if (!window.confirm("Remove this driver from your roster? (They'll be unassigned from any upcoming rides.)")) return;
    setBusyDriver(driverId);
    setDriverMsg("");
    try {
      await api.deleteDriver(driverId);
      await loadDrivers();
    } catch (err) {
      setDriverMsg(err.message);
    } finally {
      setBusyDriver(null);
    }
  };

  if (!form) {
    return <div className="card"><p>{companyMsg || "Loading…"}</p></div>;
  }

  return (
    <>
      <div className="card">
        <h2>Company settings</h2>
        {companyStatus && companyStatus !== "active" && (
          <p
            style={{
              marginBottom: "12px",
              color: companyStatus === "rejected" ? "#d9453d" : "#e8a33d",
              fontWeight: 600,
            }}
          >
            {companyStatus === "rejected"
              ? "This company was not approved by TrustedTransit."
              : "Pending TrustedTransit review — your drivers can still be added and vetted individually in the meantime."}
          </p>
        )}
        {!editing ? (
          <div>
            <p style={{ fontSize: "16px", fontWeight: 600 }}>{form.name || <span className="muted">(no name on file)</span>}</p>
            <p className="muted">
              {[form.address, form.city, [form.state, form.zip].filter(Boolean).join(" ")]
                .filter(Boolean)
                .join(", ") || "No address on file"}
            </p>
            <p className="muted">{form.phone || "No phone on file"}</p>
            <button className="button secondary sm" style={{ marginTop: "12px" }} onClick={() => setEditing(true)}>
              Edit
            </button>
            {companyMsg && (
              <p style={{ color: companyMsg === "Saved." ? "green" : "#d33", marginTop: "10px" }}>{companyMsg}</p>
            )}
          </div>
        ) : (
          <form onSubmit={saveCompany}>
            {FIELDS.map(([key, label]) => (
              <div key={key} style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={inputStyle}
                />
              </div>
            ))}
            <div className="row-actions">
              <button className="button" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" className="button secondary" onClick={cancelEdit} disabled={saving}>
                Cancel
              </button>
            </div>
            {companyMsg && (
              <p style={{ color: companyMsg === "Saved." ? "green" : "#d33", marginTop: "10px" }}>{companyMsg}</p>
            )}
          </form>
        )}
      </div>

      <div className="card">
        <h2>Driver email domains</h2>
        <p className="muted" style={{ fontSize: "13px" }}>
          Anyone who signs in with a verified email at one of these domains automatically joins
          your roster as a driver. Personal providers (gmail.com, etc.) can't be used — and to add
          a domain, you must be signed in with a verified email at that exact domain, which proves
          your company owns it.
        </p>
        {domains.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "12px" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Added by</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => (
                  <tr key={d.id}>
                    <td className="mono">{d.domain}</td>
                    <td className="muted">{d.addedByEmail || "—"}</td>
                    <td>
                      <button className="button danger sm" disabled={domainBusy} onClick={() => removeDomain(d.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form onSubmit={addDomain} className="row-actions" style={{ marginTop: "12px" }}>
          <input
            className="input"
            style={{ maxWidth: "280px" }}
            placeholder="yourcompany.com"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
          />
          <button className="button sm" type="submit" disabled={domainBusy}>
            {domainBusy ? "Adding…" : "Add domain"}
          </button>
        </form>
        {domainMsg && <p style={{ color: "#d9453d", marginTop: "8px" }}>{domainMsg}</p>}
      </div>

      <div className="card">
        <h2>Live tracking</h2>
        <DriverMap drivers={drivers} emptyMessage="None of your drivers are sharing their location right now." />
      </div>

      <div className="card">
        <h2>Driver roster</h2>
        <p className="muted" style={{ fontSize: "13px" }}>
          Facilities can book any of these drivers, same as independent ones, once TrustedTransit
          has approved their vetting — that's a platform review, not something you can set here.
          Give a placeholder driver their email and the first time they sign into the portal with
          it, their account links to this exact roster row — no claimed domain needed.
        </p>
        {driverMsg && <p style={{ color: "#d9453d", marginTop: "8px" }}>{driverMsg}</p>}

        {drivers.length === 0 ? (
          <p className="muted" style={{ marginTop: "12px" }}>No drivers on your roster yet.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "12px" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Vehicle</th>
                  <th>Login</th>
                  <th>Invite email</th>
                  <th>Vetting</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) =>
                  editingId === d.id ? (
                    <tr key={d.id}>
                      <td colSpan={8}>
                        <form
                          onSubmit={saveEditDriver}
                          style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", padding: "8px 0" }}
                        >
                          <input
                            className="input"
                            style={{ width: "120px" }}
                            placeholder="First name"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            required
                          />
                          <input
                            className="input"
                            style={{ width: "120px" }}
                            placeholder="Last name"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            required
                          />
                          <input
                            className="input"
                            style={{ width: "140px" }}
                            type="tel"
                            placeholder="Phone"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                          <input
                            className="input"
                            style={{ width: "140px" }}
                            placeholder="Vehicle type"
                            value={editForm.vehicleType}
                            onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })}
                          />
                          <input
                            className="input"
                            style={{ width: "100px" }}
                            placeholder="Plate"
                            value={editForm.vehiclePlate}
                            onChange={(e) => setEditForm({ ...editForm, vehiclePlate: e.target.value })}
                          />
                          <input
                            className="input"
                            style={{ width: "180px" }}
                            type="email"
                            placeholder="Invite email (optional)"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          />
                          <button className="button sm" type="submit" disabled={busyDriver === d.id}>
                            {busyDriver === d.id ? "Saving…" : "Save"}
                          </button>
                          <button type="button" className="button secondary sm" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={d.id}>
                      <td>{d.firstName} {d.lastName}</td>
                      <td>{d.phone || "—"}</td>
                      <td>{d.vehicleType || "—"} {d.vehiclePlate ? `(${d.vehiclePlate})` : ""}</td>
                      <td className="muted">{d.hasLogin ? "yes" : "no"}</td>
                      <td className="muted">{d.hasLogin ? "—" : (d.email || "none set")}</td>
                      <td>
                        <span style={{ color: d.backgroundCheckStatus === "approved" ? "green" : "#e8a33d", fontWeight: 600 }}>
                          {d.backgroundCheckStatus}
                        </span>
                      </td>
                      <td>
                        <select
                          value={d.status}
                          disabled={busyDriver === d.id}
                          onChange={(e) => changeDriverStatus(d.id, e.target.value)}
                          style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ddd" }}
                        >
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                        </select>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="button secondary sm" onClick={() => startEditDriver(d)}>Edit</button>
                          <button className="button danger sm" disabled={busyDriver === d.id} onClick={() => removeDriver(d.id)}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {!adding ? (
          <button className="button sm" style={{ marginTop: "16px" }} onClick={() => setAdding(true)}>
            Add Driver
          </button>
        ) : (
          <form onSubmit={addDriver} style={{ marginTop: "16px", padding: "16px", background: "#f9f9f9", borderRadius: "8px" }}>
            <div className="form-grid">
              <div className="field">
                <label>First name</label>
                <input className="input" value={newDriver.firstName} onChange={(e) => setNewDriver({ ...newDriver, firstName: e.target.value })} required />
              </div>
              <div className="field">
                <label>Last name</label>
                <input className="input" value={newDriver.lastName} onChange={(e) => setNewDriver({ ...newDriver, lastName: e.target.value })} required />
              </div>
              <div className="field">
                <label>Phone</label>
                <input className="input" type="tel" value={newDriver.phone} onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })} />
              </div>
              <div className="field">
                <label>Vehicle type</label>
                <input className="input" placeholder="Sedan, Wheelchair van…" value={newDriver.vehicleType} onChange={(e) => setNewDriver({ ...newDriver, vehicleType: e.target.value })} />
              </div>
              <div className="field">
                <label>Vehicle plate</label>
                <input className="input" value={newDriver.vehiclePlate} onChange={(e) => setNewDriver({ ...newDriver, vehiclePlate: e.target.value })} />
              </div>
              <div className="field">
                <label>Invite email (optional)</label>
                <input
                  className="input"
                  type="email"
                  placeholder="So they can sign in and claim this driver"
                  value={newDriver.email}
                  onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                />
              </div>
            </div>
            <div className="row-actions">
              <button className="button" type="submit" disabled={busyDriver === "new"}>
                {busyDriver === "new" ? "Adding…" : "Add Driver"}
              </button>
              <button type="button" className="button secondary" onClick={() => { setAdding(false); setNewDriver(EMPTY_DRIVER); }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
