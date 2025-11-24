import * as React from "react";
import "../css/Inventory.css";
import { getImageForName } from "../assets/imageMap";

interface InventoryPopupProps {
  item: string;
  price: number;
  quantity: number;
  // optional editable name (for creating new ingredients)
  editableName?: boolean;
  setName?: (name: string) => void;
  setPrice: (price: number) => void;
  setQuantity: (quantity: number) => void;
  onClose: () => void;
  onAdd: () => void;
}

export default function InventoryPopup({ 
  item,
  price,
  quantity,
  editableName = false,
  setName,
  setPrice,
  setQuantity,
  onClose,
  onAdd,
}: InventoryPopupProps) {
  return (
    <div className="inventory-popup-backdrop">
      <div className="inventory-popup">

        <div className="inventory-popup-header">
          <button onClick={onClose}>Exit</button>
          <h2>Adjustments</h2>
          <button onClick={onAdd}>Add</button>
        </div>

        {editableName ? (
          <div className="inventory-popup-name">
            <label>Name:</label>
            <input type="text" value={item} onChange={(e) => setName && setName(e.target.value)} />
          </div>
        ) : (
          <h3>{item}</h3>
        )}

        <div className="inventory-popup-body">

          <img src={getImageForName(item)} alt={item} className="inventory-popup-image" />

          <div className="inventory-popup-info">
            <label>Price:</label>
            <input 
              type="number" 
              value={price} 
              onChange={e => setPrice(Number(e.target.value))} 
            />

            <label>Quantity:</label>
            <input 
              type="number" 
              value={quantity} 
              onChange={e => setQuantity(Number(e.target.value))} 
            />

            <p>Total: ${(price * quantity).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
