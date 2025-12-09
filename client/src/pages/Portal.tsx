import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../assets/sharetea_logo.png";
import kioskIcon from "../assets/kiosk.png";
import cashierIcon from "../assets/cashier.png";
import inventoryIcon from "../assets/inventory.png";
import employeesIcon from "../assets/employees.png";
import analyticsIcon from "../assets/analytics.png";
import "../css/Portal.css";

export default function Portal() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<number | null>(null);

  // Define which role integers have access to each portal button
  const ACCESS: Record<string, number[]> = {
    cashier: [3, 4, 5],      // EMPLOYEE, MANAGER, SUPERUSER
    inventory: [3, 4, 5],    // EMPLOYEE, MANAGER, SUPERUSER
    employees: [4, 5],       // MANAGER, SUPERUSER
    analytics: [4, 5],       // MANAGER, SUPERUSER
    kiosk: [1, 2, 3, 4, 5],  // CUSTOMER, KIOSK, EMPLOYEE, MANAGER, SUPERUSER
  };

  const readRole = () => {
    const role = Number(localStorage.getItem("user_role"));
    setUserRole(role);
  };

  useEffect(() => {
    // Load role on mount
    readRole();

    // Check if user is logged in, if not redirect to login
    const role = Number(localStorage.getItem("user_role"));
    if (role === 0 || isNaN(role)) {
      navigate("/login");
    }

    // Listen for storage changes (cross-tab)
    const onStorage = (e: StorageEvent | null) => {
      if (e && e.key === "user_role") {
        readRole();
      }
    };

    // Listen for custom storage events (same-tab)
    const onCustom = () => {
      readRole();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("storage_changed", onCustom as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("storage_changed", onCustom as EventListener);
    };
  }, [navigate]);

  const hasAccess = (key: string) => {
    if (userRole === null) return false;
    const allowed = ACCESS[key] ?? [];
    return allowed.includes(userRole);
  };

  return (
    <div className="portal-page bg-gray-200">
      <div className="portal-logo-container">
        <img src={logo} alt="Sharetea Logo" className="portal-logo" />
      </div>
      <h1 className="portal-title">Welcome!</h1>
      <div className="portal-buttons-container">
        <div className="portal-buttons-row">
          {hasAccess("cashier") && (
            <button
              className="portal-button"
              onClick={() => navigate("/cashier")}
            >
              <img src={cashierIcon} alt="Cashier" />
              <span className="mt-2 font-semibold text-lg">Cashier</span>
            </button>
          )}
          {hasAccess("inventory") && (
            <button
              className="portal-button"
              onClick={() => navigate("/inventory")}
            >
              <img src={inventoryIcon} alt="Inventory" />
              <span className="mt-2 font-semibold text-lg">Inventory</span>
            </button>
          )}
          {hasAccess("employees") && (
            <button
              className="portal-button"
              onClick={() => navigate("/employees")}
            >
              <img src={employeesIcon} alt="Employees" />
              <span className="mt-2 font-semibold text-lg">Employees</span>
            </button>
          )}
        </div>
        <div className="portal-buttons-row">
          {hasAccess("analytics") && (
            <button
              className="portal-button"
              onClick={() => navigate("/analytics")}
            >
              <img src={analyticsIcon} alt="Analytics" />
              <span className="mt-2 font-semibold text-lg">Analytics</span>
            </button>
          )}
          {hasAccess("kiosk") && (
            <button
              className="portal-button"
              onClick={() => navigate("/kiosk")}
            >
              <img src={kioskIcon} alt="Kiosk" />
              <span className="mt-2 font-semibold text-lg">Kiosk</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}