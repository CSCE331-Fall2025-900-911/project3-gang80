import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Cart.css";
//import { API_URL } from "../globals";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  iceLevel?: number | null;
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
  // const API_URL = "https://project3-gang80.onrender.com"; // switch this to localhost 5000 when testing
  const API_URL = "http://127.0.0.1:5000";
  const location = useLocation();
  const navigate = useNavigate();
  const orderType = (location.state as { orderType: string })?.orderType || "unknown";
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [menuMap, setMenuMap] = useState<Record<number, string>>({});

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
            toppings: item.toppings?.map(t => ({
              ...t,
              name: map[t.id] || t.name
            }))
          }))
        );
      })
      .catch(err => console.error("Failed to fetch menu items:", err));
  }, []);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleOrder = () => {
    navigate("/kiosk/order", { state: { orderType: orderType } });
  };

  const handleCheckout = () => {
    navigate("/kiosk/checkout", { state: { orderType: orderType } });
  };

  const getItemDetails = (item: CartItem & { iceLevelName?: string; sweetnessLevelName?: string }) => {
    const mods: string[] = [];

    if (item.iceLevelName) mods.push(`Ice: ${item.iceLevelName}`);
    if (item.sweetnessLevelName) mods.push(`Sweetness: ${item.sweetnessLevelName}`);
    if (item.toppings && item.toppings.length > 0) {
      mods.push(`Toppings: ${item.toppings.map(t => t.name).join(", ")}`);
    }

    return mods.length > 0 ? ` (${mods.join(", ")})` : "";
  }

  return (
    <div className="cart-page">
      <h1>Cart</h1>
      <p>Order type: {orderType}</p>
      {cartItems.length === 0 ? (<p>Your cart is empty.</p>) : (
        <>
        <div className="cart-items">
          {cartItems.map((item, index) => (
            <div key={index} className="cart-item">
              <div className="cart-item-content">
                <span className="base-drink">{item.name} - ${item.price.toFixed(2)} x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}</span>
                  {getItemDetails(item) && (
                    <span className="customizations">{getItemDetails(item)}</span>
                )}
              </div>
              
              <button onClick={() => removeFromCart(index)} className="remove-btn">
                Remove
              </button>
            </div>
          ))}
        </div>
        
        </>
      )}
        <h3 className="cart-total">Total: ${total.toFixed(2)}</h3>
        <div className="cart-actions">
          <button className="back-btn" onClick={handleOrder}>Continue Ordering</button>
          <button className="checkout-btn" onClick={handleCheckout}>Checkout</button>
       
        </div>
    </div>
  );
}