import { useState, useEffect } from "react";
import { api } from "../services/api";

export default function ResidentList({ facilityId }) {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    mobilityRequirements: "",
  });

  useEffect(() => {
    loadResidents();
  }, [facilityId]);

  const loadResidents = async () => {
    try {
      const data = await api.getResidents(facilityId);
      setResidents(data);
    } catch (error) {
      console.error("Error loading residents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResident = async (e) => {
    e.preventDefault();
    try {
      await api.createResident({
        facilityId: facilityId,
        ...formData,
      });
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        dateOfBirth: "",
        mobilityRequirements: "",
      });
      setShowForm(false);
      loadResidents();
    } catch (error) {
      console.error("Error adding resident:", error);
    }
  };

  return (
    <div className="card">
      <h2>Residents</h2>
      <button 
        className="button" 
        style={{ marginBottom: "20px" }}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Cancel" : "Add Resident"}
      </button>

      {showForm && (
        <form onSubmit={handleAddResident} style={{ marginBottom: "20px", padding: "16px", background: "#f9f9f9", borderRadius: "8px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>Mobility Requirements</label>
            <input
              type="text"
              placeholder="e.g., Wheelchair, Walker"
              value={formData.mobilityRequirements}
              onChange={(e) => setFormData({ ...formData, mobilityRequirements: e.target.value })}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
          </div>
          <button type="submit" className="button">Add Resident</button>
        </form>
      )}

      {loading ? (
        <p>Loading residents...</p>
      ) : residents.length === 0 ? (
        <p>No residents yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd" }}>
              <th style={{ textAlign: "left", padding: "12px" }}>Name</th>
              <th style={{ textAlign: "left", padding: "12px" }}>Phone</th>
              <th style={{ textAlign: "left", padding: "12px" }}>Mobility</th>
              <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {residents.map((resident) => (
              <tr key={resident.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}>{resident.firstName} {resident.lastName}</td>
                <td style={{ padding: "12px" }}>{resident.phone}</td>
                <td style={{ padding: "12px" }}>{resident.mobilityRequirements || "None"}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{ color: resident.status === "active" ? "green" : "red" }}>
                    {resident.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}