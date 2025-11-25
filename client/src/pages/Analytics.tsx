import { useContrastMode } from '../contexts/ContrastModeContext';
import { useEffect } from "react";

function Analytics() {
  const { resetContrast } = useContrastMode();
  
  useEffect(() => {
    localStorage.removeItem("cartItems");
    resetContrast(); // ensure contrast is OFF on non-kiosk routes
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome to Analytics</h1>
    </div>
  );
}

export default Analytics;
