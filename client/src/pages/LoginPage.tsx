import * as React from "react";
import IngredientGrid from "../components/IngredientGrid";
import InventoryPopup from "../components/InventoryPopup";
import { useContrastMode } from '../contexts/ContrastModeContext';
import { useEffect } from "react";
import { API_URL } from "../globals";


export default function LoginPage() {
  // Blank placeholder page for /login route
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-center font-bold">Please log in to continue</h1>
    </div>
  );
}
