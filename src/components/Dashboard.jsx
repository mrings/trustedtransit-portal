export default function Dashboard() {
  return (
    <div className="card">
      <h2>Dashboard</h2>
      <p>Welcome to Trusted Transit Facility Portal</p>
      <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
        <div style={{ padding: "20px", background: "#f0f0f0", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#667eea" }}>12</div>
          <div style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>Active Rides</div>
        </div>
        <div style={{ padding: "20px", background: "#f0f0f0", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#667eea" }}>8</div>
          <div style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>Available Drivers</div>
        </div>
        <div style={{ padding: "20px", background: "#f0f0f0", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#667eea" }}>45</div>
          <div style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>Residents</div>
        </div>
        <div style={{ padding: "20px", background: "#f0f0f0", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#667eea" }}>$2,340</div>
          <div style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>This Month</div>
        </div>
      </div>
    </div>
  );
}