import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

const money = (cents) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format((cents || 0) / 100);

const fmtDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleDateString([], { dateStyle: "long" });
};

const STATUS_COLOR = { trial: "#e8a33d", active: "green", canceled: "#d9453d", past_due: "#d9453d" };

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
    return <div className="card"><p>{error || "Loading…"}</p></div>;
  }

  const {
    status, tier, planName, monthlyPriceCents, trialDaysLeft, trialEndsAt,
    renewsAt, cancelAtPeriodEnd, hasStripeSubscription, canManage, billingEnabled, plans,
  } = sub;

  const isPaid = status === "active" || status === "past_due";

  return (
    <>
      <div className="card">
        <h2>Subscription</h2>
        {notice && (
          <div className="card" style={{ borderLeft: "4px solid #667eea", marginBottom: "12px" }}>
            {notice} <button className="button secondary sm" onClick={() => setNotice(null)}>Dismiss</button>
          </div>
        )}
        {error && <p style={{ color: "#d9453d" }}>{error}</p>}
        {!billingEnabled && (
          <p className="muted" style={{ fontSize: "13px" }}>
            Payments aren't configured on the server yet — plan changes apply locally and nothing is charged.
          </p>
        )}

        <div style={{ padding: "16px", background: "#f9f9f9", borderRadius: "8px" }}>
          <div style={{ fontSize: "22px", fontWeight: 700 }}>
            {planName}{" "}
            <span style={{ fontSize: "15px", fontWeight: 400, color: "#666" }}>{money(monthlyPriceCents)}/mo</span>
          </div>
          <div style={{ marginTop: "8px" }}>
            Status: <span style={{ fontWeight: 700, color: STATUS_COLOR[status] || "#333" }}>{status}</span>
          </div>
          {status === "trial" && (
            <div style={{ marginTop: "4px", color: trialDaysLeft <= 5 ? "#d9453d" : "#666" }}>
              {trialDaysLeft > 0
                ? `Trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} (${fmtDate(trialEndsAt)})`
                : `Trial ended ${fmtDate(trialEndsAt)}`}
            </div>
          )}
          {isPaid && renewsAt && (
            <div style={{ marginTop: "4px", color: "#666" }}>
              {cancelAtPeriodEnd ? `Cancels on ${fmtDate(renewsAt)}` : `Renews ${fmtDate(renewsAt)}`}
            </div>
          )}
          {status === "past_due" && (
            <div style={{ marginTop: "4px", color: "#d9453d" }}>Payment failed — update your card in billing settings.</div>
          )}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {plans.map((p) => {
            const current = p.key === tier;
            return (
              <div
                key={p.key}
                style={{ border: current ? "2px solid #667eea" : "1px solid #ddd", borderRadius: "8px", padding: "16px" }}
              >
                <div style={{ fontWeight: 700, fontSize: "18px" }}>{p.name}</div>
                <div style={{ color: "#667eea", fontWeight: 700, margin: "6px 0" }}>
                  {money(p.monthlyPriceCents)}<span style={{ color: "#666", fontWeight: 400 }}>/mo</span>
                </div>
                <div className="muted" style={{ fontSize: "13px", marginBottom: "10px" }}>{p.description}</div>
                <ul style={{ paddingLeft: "18px", fontSize: "13px", margin: "0 0 12px" }}>
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {current ? (
                  <span style={{ fontWeight: 700, color: "#667eea" }}>Current plan</span>
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
