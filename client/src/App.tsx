import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Portal from "./pages/Portal";
import Cashier from "./pages/Cashier";
import Inventory from "./pages/Inventory";
import Employees from "./pages/Employees";
import Analytics from "./pages/Analytics";
import Kiosk from "./pages/Kiosk";
import Orders from "./pages/Orders";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import MenuBoard from "./pages/MenuBoard";
import LoginPage from "./pages/LoginPage";
import './App.css'
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const location = useLocation();

  const hideNavBarRoutes = [
    "/",
    "/menu-board",
    "/kiosk/menu-board"
  ];

  const hideNavbar = hideNavBarRoutes.includes(location.pathname);

  useEffect(() => {
    localStorage.removeItem("cartItems");
  }, []);


  return (
    <>
      {!hideNavbar && <Navbar />}   {/* Only show if NOT hidden */}

      <div className="app-container" style={{ marginLeft: hideNavbar ? "0px" : "250px" }}>
        <Routes>
          <Route path="/" element={<Portal />} />
          <Route path="/cashier" element={<Cashier />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/kiosk/order" element={<Orders />} />
          <Route path="/kiosk/cart" element={<Cart />} />
          <Route path="/kiosk/checkout" element={<Checkout />} />
          <Route path="/kiosk/confirmation" element={<Confirmation />} />
          <Route path="/kiosk/menu-board" element={<MenuBoard />} />
        </Routes>
      </div>
    </>
  );
}

export default AppWrapper;
