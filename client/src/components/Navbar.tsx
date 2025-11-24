import { NavLink } from "react-router-dom";
import logo from "../assets/sharetea_logo.png";
import "./Navbar.css";
import LoginButton from "./LoginButton"
import { useEffect, useState } from "react";

function Navbar() {
  // Define which role integers have access to each nav item.
  // Adjust these arrays to match your app's role integers.
  const ACCESS: Record<string, number[]> = {
    cashier: [3, 4, 5],
    inventory: [3, 4, 5],
    employees: [4, 5],
    analytics: [4, 5],
    kiosk: [1, 2, 3, 4, 5],
    login: [0, 1, 2, 3, 4, 5],
  };

  const [userRole, setUserRole] = useState<number | null>(null);

  const readRole = () => {
    setUserRole(Number(localStorage.getItem("user_role")));
      return;
    }

  useEffect(() => {
    // load once on mount
    readRole();

    // storage event (fires for other windows/tabs)
    const onStorage = (e: StorageEvent | null) => {
      console.log("Storage event detected, Other tab");
      if (e && e.key === "user_role") {
        readRole();
      }
    };
  

    // custom event listener: some parts of app may dispatch this after changing localStorage
    const onCustom = () => {
      console.log("Storage event detected, Same tab");
      readRole();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("storage_changed", onCustom as EventListener);

    // no polling: use storage event for cross-tab and a custom event for same-tab updates
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("storage_changed", onCustom as EventListener);
    };
    // Intentionally omit userRole from deps so polling closure compares against latest via setState
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seeNavButton = (key: string) => {
    const user_role = Number(localStorage.getItem("user_role"))
    const allowed = ACCESS[key] ?? [];
    console.log("Comparing ", user_role, " to list ", allowed, " for key ", key);
    return allowed.includes(user_role);
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return (
    <nav className="sidebar">
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      <ul className="nav-links">
        {seeNavButton("cashier") && (
          <li>
            <NavLink to="/" end>
              Cashier
            </NavLink>
          </li>
        )}

        {seeNavButton("inventory") && (
          <li>
            <NavLink to="/inventory">Inventory</NavLink>
          </li>
        )}

        {seeNavButton("employees") && (
          <li>
            <NavLink to="/employees">Employees</NavLink>
          </li>
        )}

        {seeNavButton("analytics") && (
          <li>
            <NavLink to="/analytics">Analytics</NavLink>
          </li>
        )}

        {seeNavButton("kiosk") && (
          <li>
            <NavLink to="/kiosk">Kiosk</NavLink>
          </li>
        )}

        {seeNavButton("login") && (
          <li>
            <a>
              <LoginButton />
            </a>
          </li>
        )}
      </ul>
      <div className="login-button-container">
        <LoginButton />
      </div>
    </nav>
  );
}

export default Navbar;
