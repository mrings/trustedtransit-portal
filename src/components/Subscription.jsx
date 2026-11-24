import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

const money = (cents) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const fmtDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleDateString([], { dateStyle: "long" });
};

const STATUS_BADGE = { trial: "badge-warning", active: "badge-success", canceled: "badge-danger", past_due: "badge-danger" };

// One-time notice from the Stripe redirect return.
function returnNotice() {
  const p = new URLSearchParams(window.location.search).get("sub");
  if (!p) return null;
  window.history.replaceState({}, "", window.location.pathname);
  return {
    success: "Subscription started — thank you!",
    cancel: "Checkout canceled.",
    portal: "Billing settings updated.",
  }[p];
}

export default function Subscription() {
  const [sub, setSub] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(returnNotice);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setSub(await api.getSubscription());
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const redirect = async (fn) => {
    setBusy(true);
    setError("");
    try {
      const { url } = await fn();
      window.location.assign(url);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const run = async (fn, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!sub) {
    return <div className="card"><p className="muted">{error || "Loading…"}</p></div>;
  }

  const {
    status, tier, planName, monthlyPriceCents, trialDaysLeft, trialEndsAt,
    renewsAt, cancelAtPeriodEnd, hasStripeSubscription, canManage, billingEnabled, plans,
    residentCount, residentLimit, recurringRidesAllowed,
  } = sub;

  const isPaid = status === "active" || status === "past_due";

  return (
    <>
      <div className="card">
        <h2>Subscription</h2>
        {notice && (
          <div className="alert alert-info">
            {notice} <button className="button secondary sm" onClick={() => setNotice(null)}>Dismiss</button>
          </div>
        )}
        {error && <div className="alert alert-danger">{error}</div>}
        {!billingEnabled && (
          <p className="section-note">
            Payments aren't configured on the server yet — plan changes apply locally and nothing is charged.
          </p>
        )}

        <div className="panel">
          <div style={{ fontSize: "22px", fontWeight: 700 }}>
            {planName}{" "}
            <span style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-muted)" }}>{money(monthlyPriceCents)}/mo</span>
          </div>
          <div style={{ marginTop: "8px" }}>
            Status: <span className={`badge ${STATUS_BADGE[status] || "badge-neutral"}`}>{status}</span>
          </div>
          {status === "trial" && (
            <div className={trialDaysLeft <= 5 ? "text-danger" : "muted"} style={{ marginTop: "8px" }}>
              {trialDaysLeft > 0
                ? `Trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} (${fmtDate(trialEndsAt)})`
                : `Trial ended ${fmtDate(trialEndsAt)}`}
            </div>
          )}
          {isPaid && renewsAt && (
            <div className="muted" style={{ marginTop: "8px" }}>
              {cancelAtPeriodEnd ? `Cancels on ${fmtDate(renewsAt)}` : `Renews ${fmtDate(renewsAt)}`}
            </div>
          )}
          {status === "past_due" && (
            <div className="text-danger" style={{ marginTop: "8px" }}>Payment failed — update your card in billing settings.</div>
          )}
          <div className="section-note" style={{ marginTop: "10px", marginBottom: 0 }}>
            Residents: {residentCount}
            {residentLimit ? ` / ${residentLimit}` : " (unlimited)"}
            {residentLimit && residentCount >= residentLimit && (
              <span className="text-danger" style={{ fontWeight: 600 }}> — limit reached</span>
            )}
            {" · "}Recurring rides: {recurringRidesAllowed ? "included" : "not on this plan"}
          </div>
        </div>

        {canManage && (
          <div className="row-actions" style={{ marginTop: "16px" }}>
            {!isPaid && billingEnabled && (
              <button className="button" disabled={busy} onClick={() => redirect(() => api.subscribeCheckout(tier))}>
                Subscribe to {planName}
              </button>
            )}
            {isPaid && hasStripeSubscription && (
              <button className="button secondary" disabled={busy} onClick={() => redirect(api.billingPortal)}>
                Manage billing
              </button>
            )}
            {isPaid && !cancelAtPeriodEnd && (
              <button
                className="button danger"
                disabled={busy}
                onClick={() => run(api.cancelSubscription, "Cancel the subscription at the end of the current period?")}
              >
                Cancel
              </button>
            )}
            {cancelAtPeriodEnd && (
              <button className="button" disabled={busy} onClick={() => run(api.resumeSubscription)}>
                Resume subscription
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Plans</h2>
        <div className="plan-grid">
          {plans.map((p) => {
            const current = p.key === tier;
            return (
              <div key={p.key} className={`plan-card ${current ? "current" : ""}`}>
                <div className="plan-name">{p.name}</div>
                <div className="plan-price">
                  {money(p.monthlyPriceCents)}<span>/mo</span>
                </div>
                <div className="muted" style={{ fontSize: "13px", marginBottom: "10px" }}>{p.description}</div>
                <ul>
                  <li>{p.residentLimit ? `Up to ${p.residentLimit} residents` : "Unlimited residents"}</li>
                  <li>{p.recurringRides ? "Recurring rides" : "One-time rides"}</li>
                  {p.features.filter((f) => !/resident|recurring/i.test(f)).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {current ? (
                  <span className="text-primary" style={{ fontWeight: 700 }}>Current plan</span>
                ) : canManage ? (
                  isPaid ? (
                    <button className="button secondary sm" disabled={busy} onClick={() => run(() => api.changePlan(p.key))}>
                      Switch to {p.name}
                    </button>
                  ) : billingEnabled ? (
                    <button className="button secondary sm" disabled={busy} onClick={() => redirect(() => api.subscribeCheckout(p.key))}>
                      Subscribe to {p.name}
                    </button>
                  ) : (
                    <button className="button secondary sm" disabled={busy} onClick={() => run(() => api.changePlan(p.key))}>
                      Choose {p.name}
                    </button>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
