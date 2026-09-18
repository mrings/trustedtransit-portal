import { useState, useEffect } from "react";
import { api } from "../services/api";

const FIELDS = [
  ["name", "Facility name"],
  ["address", "Address"],
  ["city", "City"],
  ["state", "State"],
  ["zip", "ZIP"],
  ["phone", "Phone"],
];

const ROLES = ["admin", "user", "driver"];

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ddd",
};

export default function Admin({ me, onChange }) {
  const [form, setForm] = useState(null);
  const [editingFacility, setEditingFacility] = useState(false);
  const [savingFacility, setSavingFacility] = useState(false);
  const [facilityMsg, setFacilityMsg] = useState("");

  const [domains, setDomains] = useState([]);
  const [domainInput, setDomainInput] = useState("");
  const [domainBusy, setDomainBusy] = useState(false);
  const [domainMsg, setDomainMsg] = useState("");

  const [staff, setStaff] = useState([]);
  const [unlinked, setUnlinked] = useState([]);
  const [staffMsg, setStaffMsg] = useState("");
  const [busyUser, setBusyUser] = useState(null);

  const [notif, setNotif] = useState(null);

  const loadNotif = () => api.getNotificationSettings().then(setNotif).catch(() => {});

  const toggleNotif = async () => {
    try {
      await api.updateNotificationSettings(!notif.enabled);
      loadNotif();
    } catch (e) {
      setFacilityMsg(e.message);
    }
  };

  const loadFacility = () =>
    api
      .getFacility(me.facilityId)
      .then((f) => {
        setForm({
          name: f.name || "",
          address: f.address || "",
          city: f.city || "",
          state: f.state || "",
          zip: f.zip || "",
          phone: f.phone || "",
        });
      })
      .catch(() => setFacilityMsg("Could not load facility."));

  const loadDomains = () =>
    api
      .getFacilityDomains(me.facilityId)
      .then(setDomains)
      .catch((err) => setDomainMsg(err.message));

  const addDomain = async (e) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    setDomainBusy(true);
    setDomainMsg("");
    try {
      await api.addFacilityDomain(me.facilityId, domainInput.trim());
      setDomainInput("");
      await loadDomains();
    } catch (err) {
      setDomainMsg(err.message);
    } finally {
      setDomainBusy(false);
    }
  };

  const removeDomain = async (domainId) => {
    if (!window.confirm("Remove this domain? Staff will no longer auto-join using it.")) return;
    setDomainBusy(true);
    setDomainMsg("");
    try {
      await api.removeFacilityDomain(me.facilityId, domainId);
      await loadDomains();
    } catch (err) {
      setDomainMsg(err.message);
    } finally {
      setDomainBusy(false);
    }
  };

  const loadStaff = () => {
    api.getUsers().then(setStaff).catch((err) => setStaffMsg(err.message));
    api.getUnlinkedUsers().then(setUnlinked).catch(() => {});
  };

  const addMember = async (userId) => {
    setBusyUser(userId);
    try {
      await api.addUserToFacility(userId);
      loadStaff();
    } catch (err) {
      setStaffMsg(err.message);
    } finally {
      setBusyUser(null);
    }
  };

  useEffect(() => {
    if (me?.facilityId) {
      loadFacility();
      loadDomains();
      loadStaff();
      loadNotif();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.facilityId]);

  const saveFacility = async (e) => {
    e.preventDefault();
    setSavingFacility(true);
    setFacilityMsg("");
    try {
      await api.updateFacility(me.facilityId, form);
      setFacilityMsg("Saved.");
      setEditingFacility(false);
      await loadFacility();
      onChange?.();
    } catch (err) {
      setFacilityMsg(err.message);
    } finally {
      setSavingFacility(false);
    }
  };

  const cancelEditFacility = () => {
    setEditingFacility(false);
    setFacilityMsg("");
    loadFacility();
  };

  const changeRole = async (userId, role) => {
    setBusyUser(userId);
    setStaffMsg("");
    try {
      await api.updateUser(userId, { role });
      await loadStaff();
      if (userId === me.id) onChange?.();
    } catch (err) {
      setStaffMsg(err.message);
      await loadStaff();
    } finally {
      setBusyUser(null);
    }
  };

  const changeStatus = async (userId, status) => {
    setBusyUser(userId);
    setStaffMsg("");
    try {
      await api.updateUser(userId, { status });
      await loadStaff();
    } catch (err) {
      setStaffMsg(err.message);
      await loadStaff();
    } finally {
      setBusyUser(null);
    }
  };

  const remove = async (userId) => {
    if (!window.confirm("Remove this person from the facility?")) return;
    setBusyUser(userId);
    setStaffMsg("");
    try {
      await api.removeUser(userId);
      await loadStaff();
    } catch (err) {
      setStaffMsg(err.message);
    } finally {
      setBusyUser(null);
    }
  };

  if (!form) {
    return <div className="card"><p>{facilityMsg || "Loading…"}</p></div>;
  }

  return (
    <>
      <div className="card">
        <h2>Facility settings</h2>
        {!editingFacility ? (
          <div>
            <p style={{ fontSize: "16px", fontWeight: 600 }}>{form.name || <span className="muted">(no name on file)</span>}</p>
            <p className="muted">
              {[form.address, form.city, [form.state, form.zip].filter(Boolean).join(" ")]
                .filter(Boolean)
                .join(", ") || "No address on file"}
            </p>
            <p className="muted">{form.phone || "No phone on file"}</p>
            <button className="button secondary sm" style={{ marginTop: "12px" }} onClick={() => setEditingFacility(true)}>
              Edit
            </button>
            {facilityMsg && (
              <p style={{ color: facilityMsg === "Saved." ? "green" : "#d33", marginTop: "10px" }}>{facilityMsg}</p>
            )}
          </div>
        ) : (
          <form onSubmit={saveFacility}>
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
              <button className="button" type="submit" disabled={savingFacility}>
                {savingFacility ? "Saving…" : "Save changes"}
              </button>
              <button type="button" className="button secondary" onClick={cancelEditFacility} disabled={savingFacility}>
                Cancel
              </button>
            </div>
            {facilityMsg && (
              <p style={{ color: facilityMsg === "Saved." ? "green" : "#d33", marginTop: "10px" }}>{facilityMsg}</p>
            )}
          </form>
        )}
      </div>

      <div className="card">
        <h2>Staff email domains</h2>
        <p className="muted" style={{ fontSize: "13px" }}>
          Anyone who signs in with a verified email at one of these domains automatically joins as
          a member. Personal providers (gmail.com, etc.) can't be used — and to add a domain, you
          must be signed in with a verified email at that exact domain, which proves your
          organization owns it.
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

      {notif && (
        <div className="card">
          <h2>Family notifications</h2>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" checked={notif.enabled} onChange={toggleNotif} />
            Send ride-status updates to residents' families
          </label>
          <p className="muted" style={{ fontSize: "13px", marginTop: "10px" }}>
            Channels: email {notif.emailChannel ? "✓ active" : "— not configured"} · SMS{" "}
            {notif.smsChannel ? "✓ active" : "— not configured"}
            {!notif.emailChannel && !notif.smsChannel && " (no delivery until the server is configured)"}
          </p>
          <p className="muted" style={{ fontSize: "13px" }}>
            Families are notified when a driver is assigned, the resident is picked up, the ride
            completes, or a ride is cancelled — using the family email/phone on each resident.
          </p>
        </div>
      )}

      {unlinked.length > 0 && (
        <div className="card" style={{ borderLeft: "4px solid #e8a33d" }}>
          <h2>People waiting to join</h2>
          <p className="muted" style={{ fontSize: "13px" }}>
            These accounts have signed in but aren't in any facility. Add the ones who belong to yours.
          </p>
          <table className="data-table">
            <tbody>
              {unlinked.map((u) => (
                <tr key={u.id}>
                  <td>{u.email || <em className="muted">(no email on file)</em>}</td>
                  <td>
                    <button className="button sm" disabled={busyUser === u.id} onClick={() => addMember(u.id)}>
                      Add to facility
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2>Staff</h2>
        {staffMsg && <p style={{ color: "#d33" }}>{staffMsg}</p>}
        {staff.length === 0 ? (
          <p>No staff yet. Set the email domain above so colleagues auto-join when they sign in, or add them from "People waiting to join".</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.email || <em className="muted">(no email on file)</em>}
                      {u.id === me.id && <span className="muted"> — you</span>}
                    </td>
                    <td>
                      <select
                        value={u.role}
                        disabled={busyUser === u.id}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ddd" }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={u.status}
                        disabled={busyUser === u.id}
                        onChange={(e) => changeStatus(u.id, e.target.value)}
                        style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ddd" }}
                      >
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                      </select>
                    </td>
                    <td>
                      {u.id !== me.id && (
                        <button
                          className="button danger sm"
                          disabled={busyUser === u.id}
                          onClick={() => remove(u.id)}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
