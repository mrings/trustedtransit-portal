import { useState } from "react";
import { api } from "../services/api";

export default function RideScheduler({ facilityId }) {
  const [formData, setFormData] = useState({
    residentId: "",
    pickupAddress: "",
    destinationAddress: "",
    scheduledTime: "",
    appointmentType: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const rideData = {
        facilityId: facilityId,
        residentId: formData.residentId,
        pickupAddress: formData.pickupAddress,
        destinationAddress: formData.destinationAddress,
        scheduledPickupTime: new Date(formData.scheduledTime).toISOString(),
        appointmentType: formData.appointmentType,
        rideType: "one-time",
      };

      await api.createRide(rideData);
      setMessage("✅ Ride scheduled successfully!");
      setFormData({
        residentId: "",
        pickupAddress: "",
        destinationAddress: "",
        scheduledTime: "",
        appointmentType: "",
      });
    } catch (error) {
      setMessage("❌ Error scheduling ride: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Schedule a Ride</h2>
      {message && <p style={{ marginBottom: "16px", fontWeight: "bold" }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Resident ID</label>
          <input
            type="text"
            placeholder="Enter resident ID"
            value={formData.residentId}
            onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Pickup Address</label>
          <input
            type="text"
            placeholder="Pickup address"
            value={formData.pickupAddress}
            onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Destination Address</label>
          <input
            type="text"
            placeholder="Destination address"
            value={formData.destinationAddress}
            onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
          />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Appointment Type</label>
          <select
            value={formData.appointmentType}
            onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
          >
            <option value="">Select type</option>
            <option value="medical">Medical</option>
            <option value="shopping">Shopping</option>
            <option value="social">Social</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Scheduled Time</label>
          <input
            type="datetime-local"
            value={formData.scheduledTime}
            onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
          />
        </div>
        <button type="submit" className="button" disabled={loading}>
          {loading ? "Scheduling..." : "Schedule Ride"}
        </button>
      </form>
    </div>
  );
}