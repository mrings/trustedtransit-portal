import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Dashboard from "./components/Dashboard";
import Rides from "./components/Rides";
import ResidentList from "./components/ResidentList";
import DriverTracking from "./components/DriverTracking";
import Admin from "./components/Admin";
import Subscription from "./components/Subscription";
import DriverView from "./components/DriverView";
import CompanyAdmin from "./components/CompanyAdmin";
import Support from "./components/Support";
import { BrandMark } from "./components/Brand";
import { IconDashboard, IconRoute, IconUsers, IconCar, IconSettings, IconCreditCard, IconShield, IconLogout } from "./components/Icons";
import { api, setTokenProvider } from "./services/api";
import "./App.css";

const TAB_ICONS = {
  dashboard: IconDashboard,
  rides: IconRoute,
  residents: IconUsers,
  drivers: IconCar,
  admin: IconSettings,
  subscription: IconCreditCard,
  support: IconShield,
};

// Shared chrome for the single-page views (driver / company admin / support-without-a-facility)
// — no sidebar tabs needed since each is one page, just the brand + user info + logout.
function SimpleShell({ title, email, onLogout, children }) {
  return (
    <div className="shell">
      <div className="main" style={{ width: "100%" }}>
        <header className="topbar">
          <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <BrandMark />
            <h1>{title}</h1>
          </span>
          <div className="topbar-user">
            <div className="topbar-user-info">
              <strong>{email}</strong>
            </div>
            <button className="button secondary sm" onClick={onLogout}>
              <IconLogout /> Log Out
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

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
  const [becomingDriver, setBecomingDriver] = useState(false);
  const [registeringCompany, setRegisteringCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [exitingSupport, setExitingSupport] = useState(false);

  // Captured from the sign-in page's "I'm a Driver" / "Facility or Transportation Company"
  // buttons (stashed in sessionStorage since loginWithRedirect does a full-page navigation,
  // losing React state). Read once on mount and consumed immediately — it only needs to
  // survive that one redirect round-trip, not linger across the session.
  const [signupIntent] = useState(() => {
    const v = sessionStorage.getItem("tt_signup_intent");
    if (v) sessionStorage.removeItem("tt_signup_intent");
    return v;
  });

  const startLogin = (intent) => {
    sessionStorage.setItem("tt_signup_intent", intent);
    loginWithRedirect();
  };

  const doLogout = () => logout({ logoutParams: { returnTo: window.location.origin } });

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

  const handleBecomeDriver = async () => {
    setBecomingDriver(true);
    try {
      await api.becomeDriver();
      await loadMe();
    } catch (err) {
      setMeError(err.message);
    } finally {
      setBecomingDriver(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setCreatingCompany(true);
    try {
      await api.createCompany({ name: companyName.trim() });
      await loadMe();
    } catch (err) {
      setMeError(err.message);
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleExitSupport = async () => {
    setExitingSupport(true);
    try {
      await api.exitSupportImpersonation();
      await loadMe();
    } catch (err) {
      setMeError(err.message);
    } finally {
      setExitingSupport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-shell">
        <p style={{ color: "#fff" }}>Loading…</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="alert alert-danger">Sign-in error: {authError.message}</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <BrandMark />
          <div className="auth-wordmark">TrustedTransit</div>
          <p>Are you signing in as a driver, or on behalf of a facility or transportation company?</p>
          <div className="auth-options">
            <button className="button" onClick={() => startLogin("driver")}>
              I'm a Driver
            </button>
            <button className="button secondary" onClick={() => startLogin("facility")}>
              Facility / Transportation Company
            </button>
          </div>
        </div>
      </div>
    );
  }

  const facilityId = me?.facilityId ?? null;
  const isAdmin = me?.role === "admin";
  const isDriver = me?.role === "driver";
  const isCompanyAdmin = isAdmin && !!me?.transportCompanyId;
  const isSuperAdmin = me?.isSuperAdmin === true;
  const tabs = [
    "dashboard",
    "rides",
    "residents",
    "drivers",
    ...(isAdmin ? ["admin", "subscription"] : []),
    ...(isSuperAdmin ? ["support"] : []),
  ];
  const tabLabel = (t) =>
    t === "drivers" ? "Drivers" : t.charAt(0).toUpperCase() + t.slice(1);

  if (isDriver) {
    return (
      <SimpleShell title="Driver" email={user?.email} onLogout={doLogout}>
        <DriverView />
      </SimpleShell>
    );
  }

  if (isCompanyAdmin) {
    return (
      <SimpleShell title="Transportation Company" email={user?.email} onLogout={doLogout}>
        <CompanyAdmin me={me} />
      </SimpleShell>
    );
  }

  // Platform staff with no facility currently selected — just the support picker, not the
  // join-a-facility/become-a-driver prompts meant for regular new accounts.
  if (isSuperAdmin && !facilityId) {
    return (
      <SimpleShell title="Support" email={user?.email} onLogout={doLogout}>
        <Support onChange={loadMe} />
      </SimpleShell>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <BrandMark />
          TrustedTransit
        </div>
        <nav className="sidebar-nav">
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab];
            return (
              <button
                key={tab}
                className={`sidebar-link ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                <Icon />
                {tabLabel(tab)}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{tabLabel(activeTab)}</h1>
          <div className="topbar-user">
            <div className="topbar-user-info">
              <strong>{user?.email}</strong>
              {me?.role && <div>{me.role}</div>}
            </div>
            <button className="button secondary sm" onClick={doLogout}>
              <IconLogout /> Log Out
            </button>
          </div>
        </header>

        <main className="content">
          {meError && <div className="alert alert-danger">{meError}</div>}

          {isSuperAdmin && facilityId && (
            <div className="alert alert-info">
              <span>
                Support mode — acting as <strong>{me.facilityName || "this facility"}</strong>'s admin.
              </span>
              <button className="button sm" onClick={handleExitSupport} disabled={exitingSupport}>
                {exitingSupport ? "Exiting…" : "Exit"}
              </button>
            </div>
          )}

          {me && facilityId && me.subscriptionActive === false && (
            <div className="alert alert-danger">
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
            <div className="card">
              <h2>Welcome to TrustedTransit</h2>
              <p className="section-note">
                Your account (<strong>{user?.email}</strong>) isn't linked to a facility yet.
              </p>

              {signupIntent !== "driver" && (
                <>
                  {facilities.length > 0 ? (
                    <div className="row-actions" style={{ marginBottom: "4px" }}>
                      <select
                        className="input"
                        style={{ width: "auto" }}
                        value={linkChoice}
                        onChange={(e) => setLinkChoice(e.target.value)}
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
                </>
              )}

              {signupIntent !== "facility" && (
                <div className="divider">
                  <p className="section-note">
                    {signupIntent === "driver"
                      ? "Drivers are independent — not part of any facility — and manage their own rides and location from a separate dashboard."
                      : "Not facility staff? Drivers are independent — not part of any facility — and manage their own rides and location from a separate dashboard."}
                  </p>
                  <button className="button secondary" onClick={handleBecomeDriver} disabled={becomingDriver}>
                    {becomingDriver ? "Setting up…" : "I'm an independent driver"}
                  </button>
                </div>
              )}

              {signupIntent !== "driver" && (
                <div className="divider">
                  <p className="section-note">
                    Run a transportation company? Register it to manage your own roster of drivers —
                    facilities can then book any of your drivers, same as independent ones.
                  </p>
                  {!registeringCompany ? (
                    <button className="button secondary" onClick={() => setRegisteringCompany(true)}>
                      Register my transportation company
                    </button>
                  ) : (
                    <form onSubmit={handleCreateCompany} className="row-actions">
                      <input
                        type="text"
                        className="input"
                        style={{ width: "auto" }}
                        placeholder="Company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        autoFocus
                      />
                      <button className="button" type="submit" disabled={!companyName.trim() || creatingCompany}>
                        {creatingCompany ? "Creating…" : "Create company"}
                      </button>
                      <button type="button" className="button secondary" onClick={() => setRegisteringCompany(false)}>
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "rides" && facilityId && <Rides />}
          {activeTab === "residents" && facilityId && <ResidentList />}
          {activeTab === "drivers" && facilityId && <DriverTracking isAdmin={isAdmin} facilityId={facilityId} />}
          {activeTab === "admin" && isAdmin && <Admin me={me} onChange={loadMe} />}
          {activeTab === "subscription" && isAdmin && <Subscription />}
          {activeTab === "support" && isSuperAdmin && <Support onChange={loadMe} />}
        </main>
      </div>
    </div>
  );
}

export default App;
