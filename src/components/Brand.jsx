// Shared wordmark + icon mark — no logo file exists yet, so this is the one place the visual
// brand identity lives. Used in the sidebar, the sign-in page, and the simplified single-page
// shells (driver/company/support/public-tracking views).
export function BrandMark() {
  return (
    <span className="brand-mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s7-6.8 7-11.5a7 7 0 1 0-14 0C5 14.2 12 21 12 21Z" fill="currentColor" fillOpacity="0.18" />
        <circle cx="12" cy="9.5" r="2.6" fill="currentColor" />
      </svg>
    </span>
  );
}

export default function Brand({ size = "md" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
      <BrandMark />
      <span style={{ fontSize: size === "lg" ? "20px" : "16px", fontWeight: 700 }}>TrustedTransit</span>
    </span>
  );
}
