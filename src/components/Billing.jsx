import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

const money = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0);

const PAYMENT_STATUSES = ["pending", "invoiced", "paid", "waived"];
const PAY_COLOR = { pending: "#666", invoiced: "#e8a33d", paid: "green", waived: "#999" };

const fmtDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleDateString([], { dateStyle: "medium" });
};

function Stat({ value, label }) {
  return (
    <div style={{ padding: "16px 20px", background: "#f0f0f0", borderRadius: "8px", textAlign: "center" }}>
      <div style={{ fontSize: "26px", fontWeight: "bold", color: "#667eea" }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#666", marginTop: "6px" }}>{label}</div>
    </div>
  );
}

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function Billing() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [edit, setEdit] = useState(null); // { id, baseFare, mileageCharge }

  const load = useCallback(async () => {
    try {
      setData(await api.getBilling(month));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const setPayment = async (id, paymentStatus) => {
    setBusy(id);
    try {
      await api.updateRide(id, { paymentStatus });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const saveCharge = async () => {
    setBusy(edit.id);
    try {
      await api.updateRide(edit.id, {
        baseFare: Number(edit.baseFare) || 0,
        mileageCharge: Number(edit.mileageCharge) || 0,
      });
      setEdit(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const rides = data?.rides ?? [];

  return (
    <div className="card">
      <h2>Billing</h2>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <label style={{ fontWeight: 600 }}>Month</label>
        <input
          type="month"
          value={month}
          max={currentMonth()}
          onChange={(e) => setMonth(e.target.value)}
          style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
        />
      </div>

      {error && <p style={{ color: "#d9453d" }}>{error}</p>}

      {!data ? (
        <p>Loading…</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <Stat value={data.rideCount} label="Completed Rides" />
            <Stat value={money(data.totalBilled)} label="Total Billed" />
            <Stat value={money(data.paidAmount)} label="Paid" />
            <Stat value={money(data.outstandingAmount)} label="Outstanding" />
          </div>

          {rides.length === 0 ? (
            <p className="muted">No completed rides in {data.month}.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Completed</th>
                    <th>Resident</th>
                    <th>Trip</th>
                    <th>Base</th>
                    <th>Mileage</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((r) =>
                    edit?.id === r.id ? (
                      <tr key={r.id}>
                        <td>{fmtDate(r.completedAt)}</td>
                        <td>{r.residentName}</td>
                        <td className="muted">{r.pickupAddress} → {r.destinationAddress}</td>
                        <td>
                          <input
                            type="number" step="0.01" min="0"
                            value={edit.baseFare}
                            onChange={(e) => setEdit({ ...edit, baseFare: e.target.value })}
                            style={{ width: "80px", padding: "4px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="number" step="0.01" min="0"
                            value={edit.mileageCharge}
                            onChange={(e) => setEdit({ ...edit, mileageCharge: e.target.value })}
                            style={{ width: "80px", padding: "4px" }}
                          />
                        </td>
                        <td>{money((Number(edit.baseFare) || 0) + (Number(edit.mileageCharge) || 0))}</td>
                        <td>—</td>
                        <td>
                          <div className="row-actions">
                            <button className="button sm" disabled={busy === r.id} onClick={saveCharge}>Save</button>
                            <button className="button secondary sm" onClick={() => setEdit(null)}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={r.id}>
                        <td>{fmtDate(r.completedAt)}</td>
                        <td>{r.residentName}</td>
                        <td className="muted">{r.pickupAddress} → {r.destinationAddress}</td>
                        <td>{money(r.baseFare)}</td>
                        <td>{money(r.mileageCharge)}</td>
                        <td><strong>{money(r.totalCharge)}</strong></td>
                        <td>
                          <select
                            value={r.paymentStatus}
                            disabled={busy === r.id}
                            onChange={(e) => setPayment(r.id, e.target.value)}
                            style={{
                              padding: "5px", borderRadius: "6px", border: "1px solid #ddd",
                              fontWeight: 600, color: PAY_COLOR[r.paymentStatus] || "#333",
                            }}
                          >
                            {PAYMENT_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="button secondary sm"
                            onClick={() => setEdit({ id: r.id, baseFare: r.baseFare, mileageCharge: r.mileageCharge })}
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
