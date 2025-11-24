import { NavLink } from "react-router-dom";
import logo from "../assets/sharetea_logo.png";
import "./Navbar.css";
import LoginButton from "./LoginButton"
import { useEffect } from "react";

function Navbar() {

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
        <li>
          <NavLink to="/" end>
            Cashier
          </NavLink>
        </li>
        <li>
          <NavLink to="/inventory">
            Inventory
          </NavLink>
        </li>
        <li>
          <NavLink to="/employees">
            Employees
          </NavLink>
        </li>
        <li>
          <NavLink to="/analytics">
            Analytics
          </NavLink>
        </li>
        <li>
          <NavLink to="/kiosk">
            Kiosk
          </NavLink>
        </li>
      </ul>
      <div className="login-button-container">
        <LoginButton />
      </div>
    </nav>
  );
}

export default Navbar;
