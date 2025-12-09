import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const userRole = Number(localStorage.getItem("user_role"));
  
  // If not logged in (role is 0 or doesn't exist), redirect to login
  if (userRole === 0 || isNaN(userRole)) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  const location = useLocation();

  const hideNavBarRoutes = [
    "/",
    "/login",
    "/portal",
    "/menu-board",
    "/kiosk/menu-board"
  ];

  const hideNavbar = hideNavBarRoutes.includes(location.pathname);

  useEffect(() => {
    localStorage.removeItem("cartItems");
  }, []);

  return (
    <>
      {!hideNavbar && <Navbar />}

      <div 
        className="app-container" 
        style={{ 
          marginLeft: hideNavbar ? "0" : "250px",
          width: hideNavbar ? "100vw" : "calc(100vw - 250px)"
        }}
      >
        <Routes>
          {/* Login is the default route */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Portal is protected - only accessible after login */}
          <Route 
            path="/portal" 
            element={
              <ProtectedRoute>
                <Portal />
              </ProtectedRoute>
            } 
          />
          
          {/* All other routes are also protected */}
          <Route 
            path="/cashier" 
            element={
              <ProtectedRoute>
                <Cashier />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employees" 
            element={
              <ProtectedRoute>
                <Employees />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kiosk" 
            element={
              <ProtectedRoute>
                <Kiosk />
              </ProtectedRoute>
            } 
          />
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