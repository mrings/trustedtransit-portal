import { useState, useEffect } from "react";
import { api } from "../services/api";

export default function DriverTracking() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const data = await api.getDrivers();
      setDrivers(data);
    } catch (error) {
      console.error("Error loading drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Driver Tracking</h2>
      {loading ? (
        <p>Loading drivers...</p>
      ) : drivers.length === 0 ? (
        <p>No drivers available</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {drivers.map((driver) => (
            <div key={driver.id} style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", border: "1px solid #ddd" }}>
              <h3 style={{ marginBottom: "12px" }}>{driver.firstName} {driver.lastName}</h3>
              <p><strong>Phone:</strong> {driver.phone}</p>
              <p><strong>Vehicle:</strong> {driver.vehicleType}</p>
              <p><strong>Rating:</strong> ⭐ {driver.rating}</p>
              <p>
                <strong>Status:</strong> 
                <span style={{ 
                  marginLeft: "8px",
                  color: driver.status === "active" ? "green" : "red",
                  fontWeight: "600"
                }}>
                  {driver.status}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}