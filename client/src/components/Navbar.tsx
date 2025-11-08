import { NavLink } from "react-router-dom";
import logo from "../assets/sharetea_logo.png";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="sidebar">
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      <ul className="nav-links">
        <li>
          <NavLink to="/" end>
            Main Menu
          </NavLink>
        </li>
        <li>
          <NavLink to="/inventory">
            Inventory
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
    </nav>
  );
}

export default Navbar;
