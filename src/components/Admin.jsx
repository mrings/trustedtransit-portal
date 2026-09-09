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
  const [facility, setFacility] = useState(null);
  const [form, setForm] = useState(null);
  const [savingFacility, setSavingFacility] = useState(false);
  const [facilityMsg, setFacilityMsg] = useState("");

  const [staff, setStaff] = useState([]);
  const [staffMsg, setStaffMsg] = useState("");
  const [busyUser, setBusyUser] = useState(null);

  const loadFacility = () =>
    api
      .getFacility(me.facilityId)
      .then((f) => {
        setFacility(f);
        setForm({
          name: f.name || "",
          address: f.address || "",
          city: f.city || "",
          state: f.state || "",
          zip: f.zip || "",
          phone: f.phone || "",
          emailDomain: f.emailDomain || "",
        });
      })
      .catch(() => setFacilityMsg("Could not load facility."));

  const loadStaff = () =>
    api
      .getUsers()
      .then(setStaff)
      .catch((err) => setStaffMsg(err.message));

  useEffect(() => {
    if (me?.facilityId) {
      loadFacility();
      loadStaff();
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
      await loadFacility();
      onChange?.();
    } catch (err) {
      setFacilityMsg(err.message);
    } finally {
      setSavingFacility(false);
    }
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
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Staff email domain</label>
            <input
              type="text"
              placeholder="e.g. sunriseseniorliving.com"
              value={form.emailDomain}
              onChange={(e) => setForm({ ...form, emailDomain: e.target.value })}
              style={inputStyle}
            />
            <small style={{ color: "#666" }}>
              Anyone who signs in with a verified email at this domain automatically joins as a
              member. Personal-email providers (gmail.com, etc.) can't be used.
            </small>
          </div>
          <button className="button" type="submit" disabled={savingFacility}>
            {savingFacility ? "Saving…" : "Save changes"}
          </button>
          {facilityMsg && (
            <span style={{ marginLeft: "12px", color: facilityMsg === "Saved." ? "green" : "#d33" }}>
              {facilityMsg}
            </span>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Staff</h2>
        {staffMsg && <p style={{ color: "#d33" }}>{staffMsg}</p>}
        {staff.length === 0 ? (
          <p>No staff yet. Set the email domain above so colleagues auto-join when they sign in.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "12px" }}>Email</th>
                <th style={{ textAlign: "left", padding: "12px" }}>Role</th>
                <th style={{ textAlign: "left", padding: "12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>
                    {u.email || <em style={{ color: "#999" }}>(no email on file)</em>}
                    {u.id === me.id && <span style={{ color: "#999" }}> — you</span>}
                  </td>
                  <td style={{ padding: "12px" }}>
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
                  <td style={{ padding: "12px" }}>
                    {u.id !== me.id && (
                      <button
                        className="button secondary"
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
        )}
      </div>
    </>
  );
}
