import * as React from "react";
import IngredientButton from "./IngredientButton";
import "../css/Inventory.css";

const INGREDIENTS = [
  ["Black Tea Leaves", "Green Tea Leaves", "Sugar", "Milk", "Condensed Milk"],
  ["Coconut Milk", "Matcha Powder", "Taro Powder", "Chocolate Syrup", "Mango Syrup"],
  ["Strawberry Syrup", "Lychee Syrup", "Lemon Juice", "Honey", "Coffee Beans"],
  ["Whipped Cream", "Oreo Crumbs", "Pudding Mix", "Jelly Mix", "Tapioca Pearls"],
  ["Ice Cubes", "Cups", "Lids", "Straws", "Napkins"]];

export default function IngredientGrid(props: {
  onIngredientClick: (name: string) => void;
  onAddNew?: () => void;
  // optional dynamic items; if not provided falls back to static INGREDIENTS
  items?: Array<{ id?: number; name: string }> | string[];
}) {
  const itemsList: string[] = React.useMemo(() => {
    if (props.items && props.items.length > 0) {
      // items can be array of strings or objects with name
      return (props.items as any[]).map((it) => (typeof it === 'string' ? it : it.name));
    }
    return INGREDIENTS.flat();
  }, [props.items]);

  return (
    <div className="ingredient-grid">
      {itemsList.map((ingredient) => (
        <IngredientButton
          key={ingredient}
          name={ingredient}
          onClick={() => props.onIngredientClick(ingredient)}
        />
      ))}

      {/* Add-new button at the end with a plus icon */}
      <button className="ingredient-button ingredient-add" onClick={() => props.onAddNew && props.onAddNew()} aria-label="Add new ingredient">
        <span className="ingredient-thumb plus-icon" aria-hidden>＋</span>
        <span className="ingredient-name">Add</span>
      </button>
    </div>
  );
}