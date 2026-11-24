import { useState, useEffect } from "react";
import { api } from "../services/api";
import { IconRoute, IconCalendar, IconCar, IconUsers, IconCheckCircle } from "./Icons";

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
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
      <h2>Overview</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {!data && !error ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="stat-grid">
          <Stat icon={IconRoute} value={data?.upcomingRides ?? 0} label="Upcoming Rides" />
          <Stat icon={IconCalendar} value={data?.ridesToday ?? 0} label="Rides Today" />
          <Stat icon={IconCar} value={data?.activeDrivers ?? 0} label="Active Drivers" />
          <Stat icon={IconUsers} value={data?.residents ?? 0} label="Residents" />
          <Stat icon={IconCheckCircle} value={data?.completedThisMonth ?? 0} label="Completed This Month" />
        </div>
      )}
    </div>
  );
}
