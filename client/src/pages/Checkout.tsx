import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Checkout.css";
import { useContrastMode } from "../contexts/ContrastModeContext";


export default function Cart() {
  // const API_URL = "https://project3-gang80.onrender.com";
  const API_URL = "http://127.0.0.1:5000";
  const location = useLocation();
  const navigate = useNavigate();
  const { highContrast } = useContrastMode();

  const orderType = (location.state as { orderType: string })?.orderType || "unknown";

  interface CartItem {
    id?: number;
    name: string;
    price: number;
    quantity: number;
    toppings?: Array<{ id: number; name: string; price: number }>;
  }

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    setCartItems(saved ? JSON.parse(saved) : []);
  }, []);


  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentMethod(e.target.value);
  };

  const handleConfirmOrder = async () => {
    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    // Build order payload for Flask backend
    const orderData = {
      customer_id: null, // guest checkout
      total_price: total,
      pearls_earned: Math.floor(total / 10),
      payment_method: paymentMethod,
      order_type: orderType, // dine-in / takeout
      employee_id: 1, // default employee
      items: cartItems.map((item) => ({
        menu_item_id: item.id || null, // you may need to ensure ID exists
        quantity: item.quantity,
      })),
    };

    try {
      const resp = await fetch(`${API_URL}/api/db/orders/create`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      // Log the actual response for debugging
      console.log("Response status:", resp.status);

      if (!resp.ok) {
        const text = await resp.text();
        console.error("Failed to create order:", text);
        alert("There was an error processing your order. Please try again.");
        return;
      }

      const data = await resp.json();
      console.log("Order confirmed!", data);

      localStorage.removeItem("cartItems");
      setCartItems([]);

      alert(`Order confirmed! Payment method: ${paymentMethod}`);
      navigate("/kiosk/confirmation", {});
    } catch (err) {
      console.error("Fetch error:", err);
      alert("There was an error processing your order. Please try again.");
    }
  };

  const handleBack = () => {
    navigate("/kiosk/cart", {
      state: { orderType: orderType, cartItems: cartItems },
    });
  };

  return (
    <div className={`checkout-page ${highContrast ? "high-contrast" : ""}`}>
      <h1>Checkout</h1>
      <p>Order type: {orderType}</p>

      <div className="checkout-summary">
        <h2>Order Summary</h2>
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>
              {item.name} 
              {item.toppings && item.toppings.length > 0 && (
                <> + {item.toppings.map(t => t.name).join(", ")}</>
              )}
              {" - $"}
              {item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
            </li>
          ))}
        </ul>
        <h3>Subtotal: ${subtotal.toFixed(2)}</h3>
        <h3>Tax: ${tax.toFixed(2)}</h3>
        <h2>Total: ${total.toFixed(2)}</h2>
      </div>

      <div className="payment-section">
        <h2>Select Payment Method</h2>
        <select value={paymentMethod} onChange={handlePaymentChange}>
          <option value="">--Select--</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Cash">Cash</option>
        </select>
      </div>

      <div className="checkout-actions">
        <button className="back-btn" onClick={handleBack}>
          Back to Cart
        </button>
        <button className="confirm-btn" onClick={handleConfirmOrder}>
          Confirm Order
        </button>
      </div>
    </div>
  );
}
