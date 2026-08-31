import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import RideScheduler from "./components/RideScheduler";
import ResidentList from "./components/ResidentList";
import DriverTracking from "./components/DriverTracking";
import Billing from "./components/Billing";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [facility, setFacility] = useState(null);

  useEffect(() => {
    // For now, use a hardcoded facility ID
    // Later, you'll get this from Auth0 or URL params
    setFacility({ id: "123e4567-e89b-12d3-a456-426614174000" });
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Trusted Transit - Facility Portal</h1>
        <p>Transportation Management System</p>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={activeTab === "rides" ? "active" : ""}
          onClick={() => setActiveTab("rides")}
        >
          Schedule Rides
        </button>
        <button
          className={activeTab === "residents" ? "active" : ""}
          onClick={() => setActiveTab("residents")}
        >
          Residents
        </button>
        <button
          className={activeTab === "drivers" ? "active" : ""}
          onClick={() => setActiveTab("drivers")}
        >
          Driver Tracking
        </button>
        <button
          className={activeTab === "billing" ? "active" : ""}
          onClick={() => setActiveTab("billing")}
        >
          Billing
        </button>
      </nav>

      <main className="content">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "rides" && facility && <RideScheduler facilityId={facility.id} />}
        {activeTab === "residents" && facility && <ResidentList facilityId={facility.id} />}
        {activeTab === "drivers" && <DriverTracking />}
        {activeTab === "billing" && <Billing />}
      </main>
    </div>
  );
}

export default App;