import { useContrastMode } from '../contexts/ContrastModeContext';
import { useEffect, useState } from "react";
import "../css/Analytics.css";
import { API_URL } from '../globals';

type ReportData = {
  id: number;
  title: string;
  value: number | string | null;
};

function Analytics() {
  const { resetContrast } = useContrastMode();
  const [reports, setReports] = useState<ReportData[]>([]);
  
  useEffect(() => {
    localStorage.removeItem("cartItems");
    resetContrast(); // ensure contrast is OFF on non-kiosk routes
  }, []);

  // X-report
  const runXReport = async () => {
    const data = await fetchXReport();
    setReports(data);
  };

  // Z-report
  const runZReport = async () => {
    const data = await fetchZReport();
    setReports(data);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome to Analytics</h1>
      <div className="report-buttons">
        <button onClick={runXReport}>Generate X-Report</button>
        <button onClick={runZReport}>Generate Z-Report</button>
      </div>

      <div className="report-results">
        {reports.length === 0 ? (
          <p>No report data available. Please generate a report.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>{report.title}</td>
                  <td>{report.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Analytics;

async function fetchXReport() {
  const res = await fetch(`${API_URL}/api/analytics/x-report`);
  const json = await res.json();
  console.log("X-Report JSON:", json);
  return [
    { id: 1, title: 'Since', value: json.since || 'N/A' },
    { id: 2, title: 'Number of Sales', value: json.num_sales },
    { id: 3, title: 'Cash', value: json.cash_total != null ? `$${json.cash_total.toFixed(2)}` : "N/A"},
    { id: 4, title: 'Card', value: json.card_total != null ? `$${json.card_total.toFixed(2)}` : "N/A"},
    { id: 5, title: 'Voids', value: json.voids },
  ];
}

async function fetchZReport() {
  const res = await fetch(`${API_URL}/api/analytics/z-report`);
  const json = await res.json();
  console.log("Z-Report JSON:", json);
  return [
    { id: 1, title: 'Since', value: json.since },
    { id: 2, title: 'Sales', value: `$${json.sales.toFixed(2)}` },
    { id: 3, title: 'Tax (8.25%)', value: json.tax != null ? `$${json.tax.toFixed(2)}` : "N/A" },
    { id: 4, title: 'Total with Tax', value: json.total_with_tax != null ? `$${json.total_with_tax.toFixed(2)}` : "N/A" },
    { id: 5, title: 'Cash', value: json.cash_total != null ?
      `$${json.cash_total.toFixed(2)}` 
      : "N/A" },
    { id: 6, title: 'Card', value: json.card_total != null ?
      `$${json.card_total.toFixed(2)}` 
      : "N/A" },
    { id: 7, title: 'Voids', value: json.voids },
    { id: 8, title: 'Employees Served', value: json.employees.join(", ") },
  ];
}