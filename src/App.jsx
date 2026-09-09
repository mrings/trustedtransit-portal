import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import RideScheduler from "./components/RideScheduler";
import ResidentList from "./components/ResidentList";
import DriverTracking from "./components/DriverTracking";
import Billing from "./components/Billing";
import { api } from "./services/api";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [facility, setFacility] = useState(null);
  const [facilityError, setFacilityError] = useState(null);

  useEffect(() => {
    // No auth yet: load the facility from the API (prefer the default one).
    // Later, this will come from the logged-in user's token.
    api
      .getFacilities()
      .then((facilities) => {
        if (!Array.isArray(facilities) || facilities.length === 0) {
          setFacilityError("No facilities exist yet. Create one first.");
          return;
        }
        const preferred =
          facilities.find((f) => f.name?.includes("Default")) ?? facilities[0];
        setFacility(preferred);
      })
      .catch((err) => {
        console.error("Error loading facility:", err);
        setFacilityError("Could not load facility from the API.");
      });
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
        {facilityError && (
          <div className="card" style={{ borderLeft: "4px solid #d33", color: "#d33" }}>
            {facilityError}
          </div>
        )}
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