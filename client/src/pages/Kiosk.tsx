import { useNavigate } from "react-router-dom";
import dineInImg from "../assets/dine_in.png";
import takeOutImg from "../assets/takeout.png";
import "../css/kiosk.css";
import logo from "../assets/sharetea_logo.png";

export default function Kiosk() {
  const navigate = useNavigate();

  const handleSelect = (type: "Dine-In" | "Take-Out") => {
    navigate("/kiosk/order", { state: { orderType: type } });
  };

  return (
    <div className="kiosk-page bg-gray-200">
      <div className="logo-container1">
        <img src={logo} alt="Logo" className="kiosk-logo" />
      </div>
      <h1 className="kiosk-title">Dine In or Take Out?</h1>
      <div className="kiosk-buttons">
        <button className="kiosk-button" onClick={() => handleSelect("Dine-In")}>
          <img src={dineInImg} alt="Dine In" />
        </button>
        <button className="kiosk-button" onClick={() => handleSelect("Take-Out")}>
          <img src={takeOutImg} alt="Take Out" />
        </button>
      </div>
    </div>
  );
}
