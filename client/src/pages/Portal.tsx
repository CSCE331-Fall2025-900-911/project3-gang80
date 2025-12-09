import { useNavigate } from "react-router-dom";
import logo from "../assets/sharetea_logo.png";
import kioskIcon from "../assets/kiosk.png";
import cashierIcon from "../assets/cashier.png";
import inventoryIcon from "../assets/inventory.png";
import employeesIcon from "../assets/employees.png";
import analyticsIcon from "../assets/analytics.png";
import "../css/Portal.css";

export default function Portal() {
  const navigate = useNavigate();

  return (
    <div className="portal-page bg-gray-200">
      <div className="portal-logo-container">
        <img src={logo} alt="Sharetea Logo" className="portal-logo" />
      </div>
      <h1 className="portal-title">Welcome!</h1>
      <div className="portal-buttons-container">
        <div className="portal-buttons-row">
          <button
            className="portal-button"
            onClick={() => navigate("/cashier")}
          >
            <img src={cashierIcon} alt="Cashier" />
            <span className="mt-2 font-semibold text-lg">Cashier</span>
          </button>
          <button
            className="portal-button"
            onClick={() => navigate("/inventory")}
          >
            <img src={inventoryIcon} alt="Inventory" />
            <span className="mt-2 font-semibold text-lg">Inventory</span>
          </button>
          <button
            className="portal-button"
            onClick={() => navigate("/employees")}
          >
            <img src={employeesIcon} alt="Employees" />
            <span className="mt-2 font-semibold text-lg">Employees</span>
          </button>
        </div>
        <div className="portal-buttons-row">
          <button
            className="portal-button"
            onClick={() => navigate("/analytics")}
          >
            <img src={analyticsIcon} alt="Analytics" />
            <span className="mt-2 font-semibold text-lg">Analytics</span>
          </button>
          <button
            className="portal-button"
            onClick={() => navigate("/kiosk")}
          >
            <img src={kioskIcon} alt="Kiosk" />
            <span className="mt-2 font-semibold text-lg">Kiosk</span>
          </button>
        </div>
      </div>
    </div>
  );
}
