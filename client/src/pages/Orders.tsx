import * as React from "react";
import Popup from "../components/Popup";
//import { useLocation } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Orders.css";
import languageIcon from '../assets/language.png';
import magnifyIcon from '../assets/magnify.png';
import contrastIcon from '../assets/contrast.png';
import { API_URL } from "../globals";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  iceLevel?: number | null;
  sweetnessLevel?: number | null;
  toppings?: Array<{ id: number; name: string; price: number }>;
}

export default function Orders() {
  //const API_URL = "https://project3-gang80.onrender.com"; // switch this to localhost 5000 when testing
  const API_URL = "http://127.0.0.1:5000";
  const location = useLocation();
  const orderType = (location.state as { orderType: string })?.orderType || "unknown";
  const [selected, setSelected] = useState<string>("Milk Tea");
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  });

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    setCartItems(saved ? JSON.parse(saved) : []);
  }, []);


  const drinkCategories = [
    "Milk Tea",
    "Fruit Tea",
    "Matcha",
    "Coffee",
    "Ice Blended",
    "Non-Caffeinated",
  ];

  const [drinks, setDrinks] = useState<
    { id: number; name: string; price: number; description: string | null; category: string; img_name?: string | null }[]
  >([]);

  const [showPopup, setShowPopup] = React.useState(false);
  const [selectedDrink, setSelectedDrink] = React.useState<{ id: number; name: string; price: number; img_name?: string | null; } | null>(null);

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
        console.log("Fetched drinks:", data.items);
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

  const handleOpenPopup = (drink: { id: number; name: string; price: number; img_name?: string | null; }) => {
    setSelectedDrink(drink);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
      setShowPopup(false);
      setSelectedDrink(null);
    };

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // Handle drink selection
  const handleDrinkSelect = (
    drink: { id: number; name: string; price: number; img_name?: string | null; },
    iceLevel?: number | null,
    sweetnessLevel?: number | null,
    toppings?: Array<{ id: number; name: string; price: number }>
  ) => {
    const existing = cartItems.findIndex(
      (item) =>
        item.id === drink.id &&
        item.iceLevel === iceLevel &&
        item.sweetnessLevel === sweetnessLevel &&
        JSON.stringify(item.toppings?.map(t => t.id).sort()) === JSON.stringify(toppings?.map(t => t.id).sort())
    );

    console.log("Selected drink:", drink);

    if (existing !== -1) {
      setCartItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[existing].quantity += 1;
        return newItems;
      });
    } else {
      setCartItems((prevItems) => [
        ...prevItems,
        { 
          id: drink.id, 
          name: drink.name, 
          price: drink.price + (toppings?.reduce((sum, t) => sum + (t.price || 0), 0) || 0), 
          quantity: 1,
          iceLevel,
          sweetnessLevel,
          toppings
        },
      ]);
    }

    handleClosePopup();
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

        <div className="accessibility-buttons">
          <button className="circle-btn" aria-label="Accessibility option 1"><img src={languageIcon}></img></button>
          <button className="circle-btn" aria-label="Accessibility option 2"><img src={magnifyIcon}></img></button>
          <button className="circle-btn" aria-label="Accessibility option 2"><img src={contrastIcon}></img></button>
        </div>
        {/* Drink Grid */}
        <div className="grid-container">
          {drinks.map((d) => (
            <button
              key={d.id}
              className="drink-btn"
              title={d.description || d.name}
              onClick={() => handleOpenPopup(d)}
            >
              <div className="drink-tile-name">{d.name}</div>
              <div className="drink-tile-price">${d.price.toFixed(2)}</div>
            </button>
          ))}

          {showPopup && selectedDrink && (
          <Popup
            onClose={handleClosePopup}
            onAdd={(ice, sweet, toppings) => handleDrinkSelect(selectedDrink!, ice, sweet, toppings)}
            title={selectedDrink.name}
            imgName={selectedDrink.img_name ?? ""}
          />
        )}

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
              navigate("/kiosk/cart", { state: { orderType: orderType, cartItems: cartItems} })}
            className="view-cart-btn">
            Go to Cart ({totalCartItems})
          </button>
        </div>
      </div>
    </div>
  );
}
