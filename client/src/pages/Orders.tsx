import * as React from "react";
import Popup from "../components/Popup";
//import { useLocation } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Orders.css";
import languageIcon from '../assets/language.png';
import magnifyIcon from '../assets/magnify.png';
import contrastIcon from '../assets/contrast.png';
// import { API_URL } from "../globals";
import DrinkImage from "../components/DrinkImage";
import { MagnifierLens } from "../components/MagnifierLens";
import MagnifyToggle from "../components/MagnifyToggle";
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from '../contexts/TranslationContext';
import { useContrastMode } from '../contexts/ContrastModeContext';
import { useMagnifyMode } from '../contexts/MagnifyModeContext';
import { useMagnifier } from '../hooks/useMagnifier';
import Weather from "../components/Weather";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const startOrderTutorial = () => {
  const tour = driver({
    showProgress: true,
    steps: [
      {
        element: ".category-bar",
        popover: {
          title: "Drink Categories",
          description: "Select a category to view drinks in that category.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: ".drink-btn:nth-of-type(1)",
        popover: {
          title: "Select a Drink",
          description: "Click on a drink to customize and add it to your cart.",
          side: "top",
          align: "center",
        },
      },
      {
        element: ".view-cart-btn",
        popover: {
          title: "View Cart",
          description: "Click here to view your cart and proceed to checkout.",
          side: "top",
          align: "center",
        },
      },
    ],
  });
  tour.drive();
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  iceLevel?: number | null;
  sweetnessLevel?: number | null;
  sizeLevel?: number | null;
  toppings?: Array<{ id: number; name: string; price: number }>;
}

export default function Orders() {
  const API_URL = "https://project3-gang80.onrender.com"; // switch this to localhost 5000 when testing
  //const API_URL = "http://127.0.0.1:5000";
  const location = useLocation();
  const orderType =
  (location.state as { orderType?: string } | null)?.orderType ?? "Dine-In";

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
    "Recommended",
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
  const [translatedRecPrefix, setTranslatedRecPrefix] = useState<string | null>(null);
  const [translatedRecSuffix, setTranslatedRecSuffix] = useState<string | null>(null);
  const [recommendedTemp, setRecommendedTemp] = useState<number | null>(null);

  const { highContrast, setHighContrast } = useContrastMode();
  const { magnifyMode, useLens, setMagnifyMode } = useMagnifyMode();
  const { lensPos, lensText, lensImageSrc, lensImageAlt, handleMouseMove } = useMagnifier();
  const [showMagnifyToggle, setShowMagnifyToggle] = React.useState(false);



  // Fetch drinks when category changes
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        // If the user selected the "Recommended" tab, fetch temperature
        // and pick a single recommended category/drink based on it.
        if (selected === "Recommended") {
          try {
            const wresp = await fetch(`${API_URL}/api/weather`);
            if (!wresp.ok) throw new Error(`Weather fetch failed: ${wresp.status}`);
            const wdata = await wresp.json();
            const temp: number = wdata.temperature;
            if (active) setRecommendedTemp(temp);

            // Map temperature to a category
            let recCategory = "Milk Tea";
            if (temp >= 80) {
              recCategory = "Ice Blended"; 
            } else if (temp >= 65) {
              recCategory = "Fruit Tea"; 
            } else if (temp >= 50) {
              recCategory = "Milk Tea";
            } else {
              recCategory = "Coffee";
            }

            const resp = await fetch(
              `${API_URL}/api/db/menu_items_by_category?category=${encodeURIComponent(recCategory)}`
            );
            if (!resp.ok) {
              console.error("Failed to fetch recommended category items", resp.status);
              if (active) setDrinks([]);
              return;
            }
            const data = await resp.json();
            const items = data.items || [];
            // Choose one drink to recommend. Here we pick the first one (could be randomized).
            const pick = items.length > 0 ? [items[0]] : [];
            console.log("Temperature:", temp, "-> recommending category:", recCategory, "pick:", pick);
            if (active) setDrinks(pick);
            return;
          } catch (err) {
            console.error("Recommended selection error", err);
            if (active) {
              setDrinks([]);
              setRecommendedTemp(null);
            }
            return;
          }
        }

        // Default behavior: fetch items by the selected category.
        if (active) setRecommendedTemp(null);
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
        if (active) {
          setDrinks([]);
          setRecommendedTemp(null);
        }
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

  // Translate the Recommended label parts when language changes
  useEffect(() => {
    let mounted = true;
    async function run() {
      if (language === 'en') {
        setTranslatedRecPrefix(null);
        setTranslatedRecSuffix(null);
        return;
      }
      try {
        const [prefix, suffix] = await Promise.all([
          translate('Since it is'),
          translate('outside, this is the drink we recommend!')
        ]);
        if (!mounted) return;
        setTranslatedRecPrefix(prefix);
        setTranslatedRecSuffix(suffix);
      } catch (err) {
        console.error('Recommended label translate error', err);
      }
    }
    run();
    return () => { mounted = false; };
  }, [language, translate]);

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
    toppings?: Array<{ id: number; name: string; price: number }>,
    sizeLevel?: number | null,
  ) => {
    const existing = cartItems.findIndex(
      (item) =>
        item.id === drink.id &&
        item.iceLevel === iceLevel &&
        item.sweetnessLevel === sweetnessLevel &&
        item.sizeLevel === sizeLevel &&
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
          sizeLevel,
          toppings
        },
      ]);
    }

    handleClosePopup();
  };
  

  return (
    <div
      className={`orders-layout ${highContrast ? "high-contrast" : ""} ${magnifyMode ? 'magnify' : ''}`}
      onMouseMove={(e) => handleMouseMove(e, magnifyMode)}
    >      
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

        {selected === "Recommended" && (
          <div className="recommended-text">
            <label className="recommended-label">
              <span> {translatedRecPrefix ?? 'Since it is'} {recommendedTemp !== null ? `${recommendedTemp}°F` : '...'} {translatedRecSuffix ?? 'outside,'}</span>
              <span> {translatedRecSuffix ?? 'this is the drink we recommend!'}</span>
            </label>
          </div>
        )}

        <div className="accessibility-buttons">
          <button className="circle-btn" aria-label="Choose language" onClick={() => setShowLangSelector(true)}><img src={languageIcon} alt="Language Icon"/></button>
          <button
            className={`circle-btn ${magnifyMode ? 'active' : ''}`}
            aria-label="Enable text magnification"
            onClick={() => {
              if (magnifyMode) {
                setMagnifyMode(false);
              } else {
                setShowMagnifyToggle(true);
              }
            }}
            title={magnifyMode ? 'Disable Magnifier' : 'Enable Magnifier'}
          >
            <img src={magnifyIcon} alt="Magnify Icon" />
          </button>
          <button className="circle-btn contrast-btn" aria-label="Toggle high contrast" onClick={() => setHighContrast(prev => !prev)}><img src={contrastIcon} alt="Contrast Icon"/></button>
        </div>
        <div className = "weather-container">
          <Weather />
        </div>
        
        {/* Drink Grid */}
        <div className={`grid-container ${selected === "Recommended" && drinks.length === 1 ? "single-centered" : ""}`}>
          {drinks.map((d) => (
            <button
              key={d.id}
              className={`drink-btn ${d.name === 'Lava Flow' ? 'seasonal-item' : ''}`}
                title={d.description || d.name}
                onClick={() => handleOpenPopup(d)}
            >
              {/* Red star for seasonal item named "Lava Flow" */}
                {(d.name === 'Lava Flow') && (
                  <span aria-hidden="true" className="seasonal-star">★</span>
                )}
              <div className="drink-tile-img"><DrinkImage drink={d.img_name ?? ""} size={140}/></div>
              <div className="drink-tile-name">{translatedDrinkNames[d.id] ?? d.name}</div>
              <div className="drink-tile-price">${d.price.toFixed(2)}</div>
            </button>
          ))}

          {showPopup && selectedDrink && (
          <Popup
            onClose={handleClosePopup}
            onAdd={(ice, sweet, size, toppings) => handleDrinkSelect(selectedDrink!, ice, sweet, toppings, size)}
            title={selectedDrink.name}
            imgName={selectedDrink.img_name ?? ""}
            price={selectedDrink.price}
          />
        )}

        {drinks.length === 0 && (
          <div className="no-items">
            No items found.
          </div>
        )}
        </div>
        {showLangSelector && <LanguageSelector onClose={() => setShowLangSelector(false)} />}
        {showMagnifyToggle && <MagnifyToggle onClose={() => setShowMagnifyToggle(false)} />}
        <MagnifierLens 
          lensPos={lensPos}
          lensText={lensText}
          lensImageSrc={lensImageSrc}
          lensImageAlt={lensImageAlt}
          magnifyMode={magnifyMode}
          useLens={useLens}
        />
        <div className="action-buttons">
          <button
            onClick={() =>
              navigate("/kiosk/cart", { state: { orderType: orderType, cartItems: cartItems} })}
            className="view-cart-btn">
            Go to Cart ({totalCartItems})
          </button>

          <button
            onClick={() => navigate("/kiosk/menu-board")}
            className="view-menu-btn"
          >
            View Menu
          </button>
        </div>

        <div className="seasonal-legend" aria-hidden={false} role="note">
          <span className="seasonal-legend-star">★</span>
          <span>= Seasonal Drink</span>
        </div>
      </div>
      {!showPopup && (
        <button onClick={startOrderTutorial} className="floating-circle-btn">
          ?
        </button>
      )}
    </div>
  );
}
