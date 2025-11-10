import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Cart.css";

export default function Cart() {
  const location = useLocation();
  const orderType = (location.state as { orderType: string })?.orderType || "unknown";
  const [cartItems, setCartItems] = useState<Array<{ name: string; price: number; quantity: number }>>([]);
  useEffect(() => { const items = (location.state as { cartItems: Array<{ name: string; price: number; quantity: number }> })?.cartItems || []; setCartItems(items); }, [location.state]);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const removeFromCart = (index: number) => {
    setCartItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  return (
    <div style={{ paddingLeft: "250px", height: "100vh" }}>
      <h1>Cart</h1>
      <p>Order type: {orderType}</p>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>
              {item.name} - ${item.price} x {item.quantity}
              <button 
                style={{ marginLeft: "10px" }}
                onClick={() => removeFromCart(index)}
              >
                Remove
              </button>
              </li>
          ))}
        </ul>
        <h3>Total: ${total.toFixed(2)}</h3>
        {/* <button onClick={clearCart}>Clear Cart</button> */}
        <button style={{ marginLeft: "10px" }}>Checkout</button>
        </>
      )}
    </div>
  );
}
