import { useNavigate } from "react-router-dom";
import dineInImg from "../assets/dine_in.png";
import takeOutImg from "../assets/takeout.png";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "../css/kiosk.css";
import logo from "../assets/sharetea_logo.png";

const startTutorial = () => {
  const tour = driver({
    showProgress: true,
    steps: [
      {
        element: ".kiosk-title",
        popover: {
          title: "Welcome to Sharetea Kiosk!",
          description: "Please select whether you would like to Dine In or Take Out.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: ".kiosk-button:nth-of-type(1)",
        popover: {
          title: "Dine In",
          description: "Select this option if you plan to enjoy your drink inside the store.",
          side: "top",
          align: "center",
        },
      },
      {
        element: ".kiosk-button:nth-of-type(2)",
        popover: {
          title: "Take Out",
          description: "Select this option if you would like to take your drink to go.",
          side: "top",
          align: "center",
        },
      },
    ],
  });
  tour.drive();
};

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
      <button onClick={startTutorial} className="floating-circle-btn">
        ?
      </button>
    </div>
  );
}
