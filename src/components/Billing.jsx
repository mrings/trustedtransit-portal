export default function Billing() {
  return (
    <div className="card">
      <h2>Billing & Invoices</h2>
      <div style={{ padding: "20px", background: "#f9f9f9", borderRadius: "8px", marginBottom: "20px" }}>
        <h3 style={{ marginBottom: "12px" }}>Current Month</h3>
        <p><strong>Total Rides:</strong> 42</p>
        <p><strong>Total Revenue:</strong> $2,340.50</p>
        <p><strong>Status:</strong> <span style={{ color: "green" }}>Paid</span></p>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: "12px" }}>Date</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Rides</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Amount</th>
            <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "12px" }}>August 2026</td>
            <td style={{ padding: "12px" }}>42</td>
            <td style={{ padding: "12px" }}>$2,340.50</td>
            <td style={{ padding: "12px", color: "green" }}>Paid</td>
          </tr>
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "12px" }}>July 2026</td>
            <td style={{ padding: "12px" }}>38</td>
            <td style={{ padding: "12px" }}>$2,120.00</td>
            <td style={{ padding: "12px", color: "green" }}>Paid</td>
          </tr>
          <tr>
            <td style={{ padding: "12px" }}>June 2026</td>
            <td style={{ padding: "12px" }}>35</td>
            <td style={{ padding: "12px" }}>$1,950.00</td>
            <td style={{ padding: "12px", color: "green" }}>Paid</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}