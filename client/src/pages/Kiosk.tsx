import { useNavigate } from "react-router-dom";
import dineInImg from "../assets/dine_in.png";
import takeOutImg from "../assets/takeout.png";
import "../css/kiosk.css";

export default function Kiosk() {
  const navigate = useNavigate();

  const handleSelect = (type: "dine-in" | "take-out") => {
    navigate("/kiosk/order", { state: { orderType: type } });
  };

  return (
    <div className="kiosk-page">
      <h1 className="kiosk-title">Dine In or Take Out?</h1>
      <div className="kiosk-buttons">
        <button className="kiosk-button" onClick={() => handleSelect("dine-in")}>
          <img src={dineInImg} alt="Dine In" />
        </button>
        <button className="kiosk-button" onClick={() => handleSelect("take-out")}>
          <img src={takeOutImg} alt="Take Out" />
        </button>
      </div>
    </div>
  );
}
