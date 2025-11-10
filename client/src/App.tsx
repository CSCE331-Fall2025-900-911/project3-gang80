import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Cashier from "./pages/Cashier";
import Inventory from "./pages/Inventory";
import Employees from "./pages/Employees";
import Analytics from "./pages/Analytics";
import Kiosk from "./pages/Kiosk";
import Test from "./pages/Test";
import Orders from "./pages/Orders";
import './App.css'
import Cart from "./pages/Cart";



function App() {
  return (
    <Router>
      <Navbar />
      <div className="app-container" style={{ marginLeft: "250px" }}>
        <Routes>
          <Route path="/" element={<Cashier/>} />
          <Route path="/inventory" element={<Inventory/>} />
          <Route path="/employees" element={<Employees/>} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/kiosk" element={<Kiosk/>} />
          <Route path="/test" element={<Test/>} />
          <Route path="/kiosk/order" element={<Orders />} />
          <Route path="/kiosk/cart" element={<Cart />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
