import { useState, useEffect } from "react";
import { api } from "../services/api";

const money = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

function Stat({ value, label }) {
  return (
    <div style={{ padding: "20px", background: "#f0f0f0", borderRadius: "8px", textAlign: "center" }}>
      <div style={{ fontSize: "32px", fontWeight: "bold", color: "#667eea" }}>{value}</div>
      <div style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="card">
      <h2>Dashboard</h2>
      {error && <p style={{ color: "#d9453d" }}>{error}</p>}
      {!data && !error ? (
        <p>Loading…</p>
      ) : (
        <div
          style={{
            marginTop: "12px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "16px",
          }}
        >
          <Stat value={data?.upcomingRides ?? 0} label="Upcoming Rides" />
          <Stat value={data?.ridesToday ?? 0} label="Rides Today" />
          <Stat value={data?.activeDrivers ?? 0} label="Active Drivers" />
          <Stat value={data?.residents ?? 0} label="Residents" />
          <Stat value={data?.completedThisMonth ?? 0} label="Completed This Month" />
          <Stat value={money(data?.billedThisMonth)} label="Billed This Month" />
        </div>
      )}
    </div>
  );
}
