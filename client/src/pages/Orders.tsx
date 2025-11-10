import { useLocation } from "react-router-dom";
import { useState } from "react";
import "../css/Orders.css";

export default function Orders() {
  const location = useLocation();
  const orderType = (location.state as { orderType: string })?.orderType || "unknown";
  const [selected, setSelected] = useState<string>("Milk Tea");

  const drinkCategories = [
    "Milk Tea",
    "Fruit Tea",
    "Matcha",
    "Coffee",
    "Ice Blended",
    "Non-Caffeinated",
  ];

  // placeholder drink buttons
  const drinks = Array(12).fill(null);

  return (
    <div className="orders-layout">
      <div className="orders-content">
        <div className="category-bar">
          {drinkCategories.map((s) => (
            <button
              key={s}
              className={`category-btn ${s === selected ? "active" : ""}`}
              onClick={() => setSelected(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {/* accessibility buttons */}
        <div className="accessibility-buttons">
          <button className="circle-btn" aria-label="Accessibility option 1"></button>
          <button className="circle-btn" aria-label="Accessibility option 2"></button>
        </div>

        <div className="grid-container">
          {drinks.map((_, i) => (
            <div key={i} className="grid-item"></div>
          ))}
        </div>
      </div>
    </div>
  );
}