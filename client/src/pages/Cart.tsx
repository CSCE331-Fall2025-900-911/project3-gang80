import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Cart.css";
//import { API_URL } from "../globals";

export default function Cart() {
  // const API_URL = "https://project3-gang80.onrender.com"; // switch this to localhost 5000 when testing
  const location = useLocation();
  const navigate = useNavigate();
  const orderType = (location.state as { orderType: string })?.orderType || "unknown";
  const [cartItems, setCartItems] = useState<Array<{ id: number; name: string; price: number; quantity: number }>>([]);

  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    if (saved) {
      setCartItems(JSON.parse(saved));
    } else {
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const removeFromCart = (index: number) => {
    setCartItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const handleOrder = () => {
    navigate("/kiosk/order", { state: { orderType: orderType } });
  };

  const handleCheckout = () => {
    navigate("/kiosk/checkout", { state: { orderType: orderType } });
  };

  return (
    <div className="cart-page">
      <h1>Cart</h1>
      <p>Order type: {orderType}</p>
      {cartItems.length === 0 ? (<p>Your cart is empty.</p>) : (
        <>
        <div className="cart-items">
          {cartItems.map((item, index) => (
            <div key={index} className="cart-item">
              <span>
                {item.name} - ${item.price} x {item.quantity}
              </span>
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