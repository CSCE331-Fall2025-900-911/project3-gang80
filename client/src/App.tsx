import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import MainMenu from "./pages/MainMenu";
import Inventory from "./pages/Inventory";
import Analytics from "./pages/Analytics";
import Kiosk from "./pages/Kiosk";


function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ marginLeft: "200px", padding: "20px" }}>
        <Routes>
          <Route path="/" element={<MainMenu/>} />
          <Route path="/inventory" element={<Inventory/>} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/kiosk" element={<Kiosk/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
