import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Checkout.css";

export default function Cart() {
    // const API_URL = "https://project3-gang80.onrender.com"; // switch this to localhost 5000 when testing
  const API_URL = "http://localhost:5000";
  const location = useLocation();
  const navigate = useNavigate();
  const orderType = (location.state as { orderType: string })?.orderType || "unknown";
  const [cartItems, setCartItems] = useState<Array<{ name: string; price: number; quantity: number }>>([]);
  useEffect(() => { const items = (location.state as { cartItems: Array<{ name: string; price: number; quantity: number }> })?.cartItems || []; setCartItems(items); }, [location.state]);

  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
    const orderData = {
      orderType: orderType,
      items: cartItems,
      paymentMethod: paymentMethod,
      totalAmount: total,
    };
    // Here you would typically send orderData to the backend API
    try {
      const resp = await fetch(`${API_URL}/api/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      if (!resp.ok) {
        console.error("Failed to create order", resp.status);
        alert("There was an error processing your order. Please try again.");
        return;
      }
      const data = await resp.json();
      console.log("Order confirmed!", {state: {orderData}});
      alert(`Order confirmed! Payment method: ${paymentMethod}`);
      navigate("/kiosk/confirmation", {});
    } catch (err) {
      console.error("Fetch error", err);
      alert("There was an error processing your order. Please try again.");
      return;
    }
    
  };

  const handleBack = () => {
    navigate("/kiosk/cart", { state: { orderType: orderType, cartItems: cartItems } });
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <p>Order type: {orderType}</p>
      <div className="checkout-summary">
        <h2>Order Summary</h2>
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>
              {item.name} - ${item.price} x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
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
        <button className="back-btn" onClick={handleBack}>Back to Cart</button>
        <button className="confirm-btn" onClick={handleConfirmOrder}>Confirm Order</button>
      </div>
    </div>
  );
}