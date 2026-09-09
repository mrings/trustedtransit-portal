import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Dashboard from "./components/Dashboard";
import RideScheduler from "./components/RideScheduler";
import ResidentList from "./components/ResidentList";
import DriverTracking from "./components/DriverTracking";
import Billing from "./components/Billing";
import { api, setTokenProvider } from "./services/api";
import "./App.css";

function App() {
  const {
    isLoading,
    isAuthenticated,
    error: authError,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [me, setMe] = useState(null);
  const [meError, setMeError] = useState(null);

  // Give the API client a way to fetch the current access token.
  useEffect(() => {
    setTokenProvider(isAuthenticated ? getAccessTokenSilently : null);
  }, [isAuthenticated, getAccessTokenSilently]);

  // Load the signed-in user (which carries their facilityId).
  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .getMe()
      .then(setMe)
      .catch((err) => {
        console.error("Error loading current user:", err);
        setMeError("Could not load your account from the API.");
      });
  }, [isAuthenticated]);

  if (isLoading) {
    return <div className="app"><main className="content"><p>Loading…</p></main></div>;
  }

  if (authError) {
    return (
      <div className="app">
        <main className="content">
          <div className="card" style={{ borderLeft: "4px solid #d33", color: "#d33" }}>
            Sign-in error: {authError.message}
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <header className="header">
          <h1>Trusted Transit - Facility Portal</h1>
          <p>Transportation Management System</p>
        </header>
        <main className="content">
          <div className="card">
            <h2>Sign in</h2>
            <p>You need to sign in to manage your facility.</p>
            <button className="button" onClick={() => loginWithRedirect()}>
              Log In
            </button>
          </div>
        </main>
      </div>
    );
  }

  const facilityId = me?.facilityId ?? null;

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>Trusted Transit - Facility Portal</h1>
            <p>Transportation Management System</p>
          </div>
          <div style={{ textAlign: "right", fontSize: "14px" }}>
            <div>{user?.email}</div>
            <button
              className="button"
              style={{ marginTop: "6px" }}
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <nav className="tabs">
        {["dashboard", "rides", "residents", "drivers", "billing"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "rides"
              ? "Schedule Rides"
              : tab === "drivers"
              ? "Driver Tracking"
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main className="content">
        {meError && (
          <div className="card" style={{ borderLeft: "4px solid #d33", color: "#d33" }}>
            {meError}
          </div>
        )}
        {me && !facilityId && (
          <div className="card" style={{ borderLeft: "4px solid #e8a33d" }}>
            Your account (<strong>{user?.email}</strong>) isn't linked to a facility yet. An
            administrator needs to set your facility's email domain, or assign you to one.
          </div>
        )}

        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "rides" && facilityId && <RideScheduler facilityId={facilityId} />}
        {activeTab === "residents" && facilityId && <ResidentList facilityId={facilityId} />}
        {activeTab === "drivers" && <DriverTracking />}
        {activeTab === "billing" && <Billing />}
      </main>
    </div>
  );
}

export default App;
