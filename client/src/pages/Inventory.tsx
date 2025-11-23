import * as React from "react";
import IngredientGrid from "../components/IngredientGrid";
import InventoryPopup from "../components/InventoryPopup";
import "../css/Inventory.css";
import { API_URL } from "../globals";

interface InventoryItem {
  id?: number;
  name: string;
  quantity: number;
  restockPrice: number;
}
interface CartItem {
  id?: number;
  name: string;
  quantity: number;
  price: number;
}

export async function fetchItem(name: string) {
  return {
    id: 1,
    name: name,
    quantity: 10,
    restockPrice: 5.0,  
  };
}
export async function insertItem(item: InventoryItem) {
  console.log("Inserting item:", item);
  return { success: true };
}

export default function Inventory() {
  const [popupVisible, setPopupVisible] = React.useState(false);
  const [currentItem, setCurrentItem] = React.useState<InventoryItem | null>(null);
  const [itemName, setItemName] = React.useState("");
  const [itemQuantity, setItemQuantity] = React.useState(0);
  const [itemPrice, setItemPrice] = React.useState(0.0);
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [createMode, setCreateMode] = React.useState(false);

  const totalPrice = cartItems.reduce((total, item) => total + item.quantity * item.price, 0);

  async function handleIngredientClick(name: string) {
    let item;

    try {
      const res = await fetch(`${API_URL}/api/db/inventory/item?name=${encodeURIComponent(name)}`);
      if (!res.ok) {
        throw new Error(`Inventory fetch failed: ${res.status}`);
      }
      item = await res.json();
    } catch (error) {
      console.error("Error fetching item:", error);
      // fallback with same property shape as backend -> map restock_price to restockPrice below
      item = { name, quantity: 1, restock_price: 0.0 };
    }
    setCurrentItem(item);
    setItemName(item.name);
    setItemQuantity(1);
    // backend uses restock_price; keep backward compatibility with restockPrice
    setItemPrice((item as any).restock_price ?? (item as any).restockPrice ?? 0.0);
    setPopupVisible(true);
  }
  const [submitting, setSubmitting] = React.useState(false);

  async function handleAddToCart() {
    if (itemQuantity > 0 && itemPrice >= 0) {
      setCartItems([
        ...cartItems,
        { id: (currentItem as any)?.id, name: itemName, quantity: itemQuantity, price: itemPrice },
      ]);
      setPopupVisible(false);
    }
  }

  async function handleCreateNewItem() {
    // Validate
    if (!itemName || itemQuantity < 0 || itemPrice < 0) {
      alert('Please provide a valid name, quantity and price');
      return;
    }

    try {
      const payload = {
        name: itemName,
        quantity: itemQuantity,
        restock_price: itemPrice,
      };
      const resp = await fetch(`${API_URL}/api/db/inventory/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.status === 409) {
        const body = await resp.json().catch(() => ({}));
        alert(`Item already exists (id=${body.id || 'unknown'})`);
        return;
      }

      if (!resp.ok) {
        const txt = await resp.text();
        console.error('Create inventory failed:', resp.status, txt);
        alert('Failed to create inventory item. See console for details.');
        return;
      }

      const data = await resp.json();
      console.log('Created inventory item:', data);
      alert('Inventory item created successfully');
      setPopupVisible(false);
      setCreateMode(false);
      // Optionally add created item to the cart
      setCartItems([...cartItems, { id: data.id, name: data.name, quantity: data.quantity, price: data.restock_price ?? 0 }]);
    } catch (err) {
      console.error('Create error:', err);
      alert('Error creating inventory item. See console for details.');
    }
  }

  async function handleSubmitOrder() {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        items: cartItems.map((c) => ({ inventory_id: c.id, name: c.name, quantity: c.quantity, price: c.price })),
      };

      const resp = await fetch(`${API_URL}/api/db/inventory/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error('Inventory order failed:', resp.status, txt);
        alert('Failed to submit inventory order. See console for details.');
        return;
      }

      const data = await resp.json();
      console.log('Inventory order response:', data);
      // Clear cart on success
      setCartItems([]);
      alert('Inventory order submitted successfully');
    } catch (err) {
      console.error('Submit error:', err);
      alert('Error submitting inventory order. See console for details.');
    } finally {
      setSubmitting(false);
    }
  }
  function handleOpenCreate() {
    setCreateMode(true);
    setItemName("");
    setItemQuantity(1);
    setItemPrice(0.0);
    setCurrentItem(null);
    setPopupVisible(true);
  }

  return (
    <div className="inventory-layout">
      <div className="inventory-page">
        <h2>Ingredients</h2>
        <IngredientGrid onIngredientClick={handleIngredientClick} onAddNew={handleOpenCreate} />
      </div>
      <div className="inventory-cart">
        <h2 className="inventory-cart-title">Cart</h2>
        <div className="inventory-cart-scroll">
          {cartItems.map((item, index) => (
            <div key={index} className="inventory-cart-item">
              <span>{item.name} x {item.quantity}</span>
              <span>${(item.quantity * item.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="inventory-cart-total">
          <strong>Total: ${totalPrice.toFixed(2)}</strong>
        </div>
        <button
          className="inventory-checkout-button"
          disabled={cartItems.length === 0 || submitting}
          onClick={handleSubmitOrder}
        >
          {submitting ? 'Submitting...' : 'Submit Order'}
        </button>
      </div>

      {popupVisible && (
        <InventoryPopup
          item={itemName}
          editableName={createMode}
          setName={setItemName}
          quantity={itemQuantity}
          price={itemPrice}
          setQuantity={setItemQuantity}
          setPrice={setItemPrice}
          onAdd={createMode ? handleCreateNewItem : handleAddToCart}
          onClose={() => { setPopupVisible(false); setCreateMode(false); }}
        />
      )}
      {/* <Cart cartItems={cartItems} totalPrice={totalPrice} /> */}
    </div>
  )
}