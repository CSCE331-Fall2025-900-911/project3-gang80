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
import DrinkImage from "../components/DrinkImage";
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from '../contexts/TranslationContext';
import { useContrastMode } from '../contexts/ContrastModeContext';

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
  const [showLangSelector, setShowLangSelector] = React.useState(false);
  const { language, translate } = useTranslation();
  const [translatedCategories, setTranslatedCategories] = useState<string[] | null>(null);
  const [translatedDrinkNames, setTranslatedDrinkNames] = useState<Record<number, string>>({});

  const { highContrast, setHighContrast } = useContrastMode();



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

  // Translate category labels when language changes
  useEffect(() => {
    let mounted = true;
    async function run() {
      if (language === 'en') {
        setTranslatedCategories(null);
        return;
      }
      try {
        const results = await Promise.all(drinkCategories.map((c) => translate(c)));
        if (mounted) setTranslatedCategories(results);
      } catch (err) {
        console.error('Category translate error', err);
      }
    }
    run();
    return () => { mounted = false; };
  }, [language]);

  // Translate drink names when drinks list or language changes
  useEffect(() => {
    let mounted = true;
    async function run() {
      if (language === 'en' || drinks.length === 0) {
        setTranslatedDrinkNames({});
        return;
      }
      try {
        const pairs = await Promise.all(drinks.map(async (d) => {
          const tn = await translate(d.name);
          return { id: d.id, name: tn };
        }));
        if (!mounted) return;
        const map: Record<number, string> = {};
        pairs.forEach((p) => { map[p.id] = p.name; });
        setTranslatedDrinkNames(map);
      } catch (err) {
        console.error('Drink translate error', err);
      }
    }
    run();
    return () => { mounted = false; };
  }, [drinks, language]);

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
    <div className={`orders-layout ${highContrast ? "high-contrast" : ""}`}>
      <div className="orders-content">
        {/* Category Bar */}
        {!showPopup && (
        <div className="category-bar">
          {drinkCategories.map((s, idx) => {
            const label = (translatedCategories && translatedCategories[idx]) ? translatedCategories[idx] : s;
            return (
              <button
                key={s}
                className={`category-btn ${s === selected ? "active" : ""}`}
                onClick={() => setSelected(s)}
              >
                {label}
              </button>
            );
          })}
        </div>
        )}

        <div className="accessibility-buttons">
          <button className="circle-btn" aria-label="Choose language" onClick={() => setShowLangSelector(true)}><img src={languageIcon}></img></button>
          <button className="circle-btn" aria-label="Accessibility option 2"><img src={magnifyIcon}></img></button>
          <button className="circle-btn contrast-btn" aria-label="Accessibility option 2" onClick={() => setHighContrast(prev => !prev)}><img src={contrastIcon}></img></button>
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
              <div className="drink-tile-img"><DrinkImage drink={d.img_name ?? ""} size={140}/></div>
              <div className="drink-tile-name">{translatedDrinkNames[d.id] ?? d.name}</div>
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
        {showLangSelector && <LanguageSelector onClose={() => setShowLangSelector(false)} />}
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
