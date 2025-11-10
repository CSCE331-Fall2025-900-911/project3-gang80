import * as React from "react";
import Popup from "../components/Popup";
//import { useLocation } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Orders.css";

export default function Orders() {
  const API_URL = "https://project3-gang80.onrender.com"; // switch this to localhost 5000 when testing
  const location = useLocation();
  const orderType = (location.state as { orderType: string })?.orderType || "unknown";
  const [selected, setSelected] = useState<string>("Milk Tea");
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<Array<{ name: string; price: number; quantity: number }>>([]);

  const drinkCategories = [
    "Milk Tea",
    "Fruit Tea",
    "Matcha",
    "Coffee",
    "Ice Blended",
    "Non-Caffeinated",
  ];

  const [drinks, setDrinks] = useState<
    { id: number; name: string; price: number; description: string | null; category: string }[]
  >([]);

  const [showPopup, setShowPopup] = React.useState(false);

  // Fetch drinks when category changes
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const resp = await fetch(
          `${API_URL}/api/db/menu_items_by_category?category=${encodeURIComponent(selected)}`
        );
        if (!resp.ok) {
          console.error("Failed to fetch items", resp.status);
          if (active) setDrinks([]);
          return;
        }
        const data = await resp.json();
        if (active) setDrinks(data.items || []);
      } catch (err) {
        console.error("Fetch error", err);
        if (active) setDrinks([]);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [selected]);

  // Handle drink selection
  const handleDrinkSelect = (drink: { id: number; name: string; price: number }) => {
    console.log("Selected drink:", drink);
    // TODO: display modifications popup

    // For now, just add to cart directly
    const existing = cartItems.findIndex((item) => item.name === drink.name);
    if (existing) {
      setCartItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[existing].quantity += 1;
        return newItems;
      });
    } else {
      setCartItems((prevItems) => [
        ...prevItems,
        { name: drink.name, price: drink.price, quantity: 1 },
      ]);
    }
  };

  return (
    <div className="orders-layout">
      <div className="orders-content">
        {/* Category Bar */}
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

        {/* For later sprint */}
        {/* Accessibility Buttons
        <div className="accessibility-buttons">
          <button className="circle-btn" aria-label="Accessibility option 1"></button>
          <button className="circle-btn" aria-label="Accessibility option 2"></button>
        </div> */}

        {/* Drink Grid */}
        <div className="grid-container">
          {drinks.map((d) => (
            <button
              key={d.id}
              className="drink-btn"
              title={d.description || d.name}
              onClick={() => handleDrinkSelect(d)}
            >
              <div className="drink-tile-name">{d.name}</div>
              <div className="drink-tile-price">${d.price.toFixed(2)}</div>
            </button>
          ))}

          {drinks.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", opacity: 0.7 }}>
              No items found.
            </div>
          )}
        </div>
        <div>
          <button
            style={{ marginTop: "20px" }}
            onClick={() =>
              navigate("/kiosk/cart", { state: { orderType: orderType, cartItems: cartItems } })}
              className="view-cart-btn"
          >
            Go to Cart ({cartItems.length})
          </button>
        </div>
      </div>
    </div>
  );
}
