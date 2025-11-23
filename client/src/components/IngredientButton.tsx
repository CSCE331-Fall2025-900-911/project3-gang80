import * as React from "react";
import "../css/Inventory.css";
import { getImageForName } from "../assets/imageMap";

export default function IngredientButton(props: { name: string; onClick: () => void }) {
    const img = getImageForName(props.name);
    return (
        <button className="ingredient-button" onClick={props.onClick}>
            {img && <img src={img} alt={props.name} className="ingredient-thumb" />}
            <span className="ingredient-name">{props.name}</span>
        </button>
    );
}