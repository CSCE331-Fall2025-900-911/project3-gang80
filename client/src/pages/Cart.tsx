import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Cart.css";
//import { API_URL } from "../globals";
import { useContrastMode } from "../contexts/ContrastModeContext";
import { useMagnifyMode } from "../contexts/MagnifyModeContext";
import { useMagnifier } from "../hooks/useMagnifier";
import { MagnifierLens } from "../components/MagnifierLens";
import { useTranslation } from "../contexts/TranslationContext";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const startCartTutorial = () => {
  const tour = driver({
    showProgress: true,
    steps: [
      {
        element: ".cart-page h1",
        popover: {
          title: "Welcome to Your Cart!",
          description: "Here you can review the items you've added to your order.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: ".cart-items",
        popover: {
          title: "Cart Items",
          description: "This section lists all the items in your cart along with their details.",
          side: "top",
          align: "center",
        },
      },
      {
        element: ".cart-total",
        popover: {
          title: "Total Amount",
          description: "This shows the total cost of all items in your cart.",  
          side: "top",
          align: "center",
        },
      },
      {
        element: ".cart-actions",
        popover: {
          title: "Actions",
          description: "Use these buttons to continue ordering or proceed to checkout.",
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
  sizeLevel?: number | null;
  sweetnessLevel?: number | null;
  toppings?: Array<{ id: number; name: string; price?: number }>;
}

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
}

export default function Cart() {
  const API_URL = "https://project3-gang80.onrender.com"; // switch this to localhost 5000 when testing
  //const API_URL = "http://127.0.0.1:5000";
  const location = useLocation();
  const navigate = useNavigate();
  const orderType = (location.state as { orderType: string })?.orderType || "unknown";
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [menuMap, setMenuMap] = useState<Record<number, string>>({});

  const { highContrast } = useContrastMode();
  const { magnifyMode, useLens } = useMagnifyMode();
  const { lensPos, lensText, lensImageSrc, lensImageAlt, handleMouseMove } = useMagnifier();
  const { language, translate, t } = useTranslation();
  const [translatedMenuMap, setTranslatedMenuMap] = useState<Record<number, string>>({});
  const [translatedStatics, setTranslatedStatics] = useState<Record<string, string>>({});


  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    setCartItems(saved ? JSON.parse(saved) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    fetch(`${API_URL}/api/db/menu_items`)
      .then(res => res.json())
      .then(data => {
        const map: Record<number, string> = {}
        data.items.forEach((item: MenuItem) => {
          map[item.id] = item.name;
        });
        setMenuMap(map);

        setCartItems(prevItems =>
          prevItems.map(item => ({
            ... item,
            iceLevelName: item.iceLevel != null ? map[item.iceLevel] : undefined,
            sweetnessLevelName: item.sweetnessLevel != null ? map[item.sweetnessLevel] : undefined,
            sizeLevelName: item.sizeLevel != null ? map[item.sizeLevel] : undefined,
            toppings: item.toppings?.map(t => ({
              ...t,
              name: map[t.id] || t.name
            }))
          }))
        );
      })
      .catch(err => console.error("Failed to fetch menu items:", err));
  }, []);

  // Translate menu item names and static labels when language changes or menuMap updates
  useEffect(() => {
    let mounted = true;
    async function run() {
      if (language === 'en') {
        setTranslatedMenuMap({});
        setTranslatedStatics({});
        return;
      }
      try {
        const ids = Object.keys(menuMap).map(k => Number(k));
        const names = ids.map(id => menuMap[id]);
        const staticTexts = [
          'Cart', 'Order type:', 'Your cart is empty.', 'Remove', 'Continue Ordering', 'Checkout',
          'Ice:', 'Sweetness:', 'Size:', 'Toppings:', 'Total:'
        ];
        const promises: Promise<string>[] = [];
        names.forEach(n => promises.push(translate(n)));
        staticTexts.forEach(s => promises.push(translate(s)));
        const results = await Promise.all(promises);
        if (!mounted) return;
        const map: Record<number, string> = {};
        ids.forEach((id, idx) => { map[id] = results[idx]; });
        const staticsMap: Record<string, string> = {};
        staticTexts.forEach((s, i) => { staticsMap[s] = results[names.length + i]; });
        setTranslatedMenuMap(map);
        setTranslatedStatics(staticsMap);
      } catch (err) {
        console.error('Cart translation error', err);
      }
    }
    run();
    return () => { mounted = false; };
  }, [language, menuMap]);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const increaseQuantity = (index: number) => {
    setCartItems(prev =>
      prev.map((it, i) => (i === index ? { ...it, quantity: it.quantity + 1 } : it))
    );
  };

  const decreaseQuantity = (index: number) => {
    setCartItems(prev => {
      const item = prev[index];
      if (!item) return prev;
      if (item.quantity > 1) {
        return prev.map((it, i) => (i === index ? { ...it, quantity: it.quantity - 1 } : it));
      }
      // if quantity would go to 0, remove the item
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleOrder = () => {
    navigate("/kiosk/order", { state: { orderType: orderType } });
  };

  const handleCheckout = () => {
    navigate("/kiosk/checkout", { state: { orderType: orderType } });
  };

  const getItemDetails = (item: CartItem & { iceLevelName?: string; sweetnessLevelName?: string; sizeLevelName?: string }) => {
    const mods: string[] = [];

    if (item.iceLevelName) mods.push(`${translatedStatics['Ice:'] ?? t('Ice:')} ${translatedMenuMap[item.iceLevel as number] ?? item.iceLevelName}`);
    if (item.sweetnessLevelName) mods.push(`${translatedStatics['Sweetness:'] ?? t('Sweetness:')} ${translatedMenuMap[item.sweetnessLevel as number] ?? item.sweetnessLevelName}`);
    if (item.sizeLevelName) {
      mods.push(`${translatedStatics['Size:'] ?? t('Size:')} ${translatedMenuMap[item.sizeLevel as number] ?? item.sizeLevelName}`);
    }
    if (item.toppings && item.toppings.length > 0) {
      mods.push(`${translatedStatics['Toppings:'] ?? t('Toppings:')} ${item.toppings.map(t => translatedMenuMap[t.id] ?? t.name).join(", ")}`);
    }

    return mods.length > 0 ? ` (${mods.join(", ")})` : "";
  }

  return (
    <div className={`cart-page ${highContrast ? "high-contrast" : ""} ${magnifyMode ? 'magnify' : ''}`} onMouseMove={(e) => handleMouseMove(e, magnifyMode)}>
      <h1>{translatedStatics['Cart'] ?? t('Cart')}</h1>
      <p>{(translatedStatics['Order type:'] ?? t('Order type:'))} {orderType}</p>
      {cartItems.length === 0 ? (<p>Your cart is empty.</p>) : (
        <>
        <div className="cart-items">
          {cartItems.map((item, index) => (
            <div key={index} className="cart-item">
              <div className="cart-item-content">
                <span className="base-drink">{translatedMenuMap[item.id] ?? item.name} - ${item.price.toFixed(2)} x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}</span>
                  {getItemDetails(item) && (
                    <span className="customizations">{getItemDetails(item)}</span>
                )}
              </div>
              
              <div className="quantity-controls">
                <button onClick={() => decreaseQuantity(index)} className="qty-btn decrement" aria-label="Decrease quantity">-</button>
                <span className="qty-display" aria-hidden="true">{item.quantity}</span>
                <button onClick={() => increaseQuantity(index)} className="qty-btn increment" aria-label="Increase quantity">+</button>
              </div>

              <button onClick={() => removeFromCart(index)} className="remove-btn">
                {translatedStatics['Remove'] ?? t('Remove')}
              </button>
            </div>
          ))}
        </div>
        
        </>
      )}

        <h3 className="cart-total">{(translatedStatics['Total:'] ?? t('Total:'))} ${total.toFixed(2)}</h3>
        <div className="cart-actions">
          <button className="back-btn" onClick={handleOrder}>{translatedStatics['Continue Ordering'] ?? t('Continue Ordering')}</button>
          <button className="checkout-btn" onClick={handleCheckout}>{translatedStatics['Checkout'] ?? t('Checkout')}</button>
       
        </div>
      <MagnifierLens 
        lensPos={lensPos}
        lensText={lensText}
        lensImageSrc={lensImageSrc}
        lensImageAlt={lensImageAlt}
        magnifyMode={magnifyMode}
        useLens={useLens}
      />
      <button onClick={startCartTutorial} className="floating-circle-btn">
        ?
      </button>
    </div>
  );
}