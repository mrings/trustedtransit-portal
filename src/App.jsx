import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Dashboard from "./components/Dashboard";
import Rides from "./components/Rides";
import ResidentList from "./components/ResidentList";
import DriverTracking from "./components/DriverTracking";
import Billing from "./components/Billing";
import Admin from "./components/Admin";
import Subscription from "./components/Subscription";
import DriverView from "./components/DriverView";
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
  const [facilities, setFacilities] = useState([]);
  const [linking, setLinking] = useState(false);
  const [linkChoice, setLinkChoice] = useState("");

  // Give the API client a way to fetch the current access token.
  useEffect(() => {
    setTokenProvider(isAuthenticated ? getAccessTokenSilently : null);
  }, [isAuthenticated, getAccessTokenSilently]);

  const loadMe = () =>
    api
      .getMe()
      .then(setMe)
      .catch((err) => {
        console.error("Error loading current user:", err);
        setMeError("Could not load your account from the API.");
      });

  // Load the signed-in user (which carries their facilityId).
  useEffect(() => {
    if (!isAuthenticated) return;
    loadMe();
  }, [isAuthenticated]);

  // Offer a facility to link to when the user isn't matched to one.
  useEffect(() => {
    if (me && !me.facilityId) {
      api.getFacilities().then((f) => setFacilities(Array.isArray(f) ? f : [])).catch(() => {});
    }
  }, [me]);

  const handleLink = async () => {
    if (!linkChoice) return;
    setLinking(true);
    try {
      await api.linkMyFacility(linkChoice);
      await loadMe();
    } catch (err) {
      setMeError(err.message);
    } finally {
      setLinking(false);
    }
  };

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
  const isAdmin = me?.role === "admin";
  const isDriver = me?.role === "driver";
  const tabs = ["dashboard", "rides", "residents", "drivers", "billing", ...(isAdmin ? ["admin", "subscription"] : [])];
  const tabLabel = (t) =>
    t === "drivers" ? "Drivers" : t.charAt(0).toUpperCase() + t.slice(1);

  if (isDriver) {
    return (
      <div className="app">
        <header className="header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1>Trusted Transit — Driver</h1>
              <p>{user?.email}</p>
            </div>
            <button
              className="button"
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            >
              Log Out
            </button>
          </div>
        </header>
        <main className="content">
          <DriverView />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>Trusted Transit - Facility Portal</h1>
            <p>Transportation Management System</p>
          </div>
          <div style={{ textAlign: "right", fontSize: "14px" }}>
            <div>
              {user?.email}
              {me?.role && (
                <span style={{ opacity: 0.75 }}> · {me.role}</span>
              )}
            </div>
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
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </nav>

      <main className="content">
        {meError && (
          <div className="card" style={{ borderLeft: "4px solid #d33", color: "#d33" }}>
            {meError}
          </div>
        )}
        {me && facilityId && me.subscriptionActive === false && (
          <div className="card" style={{ borderLeft: "4px solid #d9453d", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <span>
              {me.subscriptionStatus === "trial" ? "Your free trial has ended." : "Your subscription is inactive."}{" "}
              {isAdmin ? "Subscribe to keep adding residents and rides." : "Ask an administrator to subscribe."}
            </span>
            {isAdmin && (
              <button className="button sm" onClick={() => setActiveTab("subscription")}>View plans</button>
            )}
          </div>
        )}
        {me && !facilityId && (
          <div className="card" style={{ borderLeft: "4px solid #e8a33d" }}>
            <p>
              Your account (<strong>{user?.email}</strong>) isn't linked to a facility yet.
            </p>
            {facilities.length > 0 ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={linkChoice}
                  onChange={(e) => setLinkChoice(e.target.value)}
                  style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                >
                  <option value="">Select a facility…</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <button className="button" onClick={handleLink} disabled={!linkChoice || linking}>
                  {linking ? "Linking…" : "Link my account"}
                </button>
              </div>
            ) : (
              <p>No facilities exist yet — an administrator needs to create one.</p>
            )}
          </div>
        )}

        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "rides" && facilityId && <Rides />}
        {activeTab === "residents" && facilityId && <ResidentList />}
        {activeTab === "drivers" && <DriverTracking isAdmin={isAdmin} />}
        {activeTab === "billing" && <Billing />}
        {activeTab === "admin" && isAdmin && <Admin me={me} onChange={loadMe} />}
        {activeTab === "subscription" && isAdmin && <Subscription />}
      </main>
    </div>
  );
}

export default App;
