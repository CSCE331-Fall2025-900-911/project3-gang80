import React, { useEffect, useState } from 'react';
import "../css/MenuBoard.css";
import { useNavigate, useLocation } from 'react-router-dom';

interface MenuItem {
    id: number;
    name: string;
    price: number | null;
    description: string | null;
    category: string;
    img_name?: string | null;
}

interface ModificationGroups {
    [category: string]: MenuItem[];
}

// const API_URL = "https://project3-gang80.onrender.com";
const API_URL = "http://127.0.0.1:5000";

export default function MenuBoard() {
    const navigate = useNavigate();
    const { search } = useLocation();

    const [items, setItems] = useState<MenuItem[]>([]);
    const [mods, setMods] = useState<ModificationGroups>({});

    useEffect(() => {
        async function loadAll() {
            try {
                const res = await fetch(`${API_URL}/api/db/menu_items_all`);
                const data = await res.json();
                setItems(data.items || []);
            } catch (error) {
                console.error("Error fetching menu items:", error);
            }
        }

        loadAll();
    }, []);


    useEffect(() => {
        async function loadMods() {
            try {
                const res = await fetch(`${API_URL}/api/db/menu_modifications`);
                const data = await res.json();
                setMods(data.categories || {});
            } catch (e) {
                console.error("fail to load mods", e);
            }
        }

        loadMods();
    }, []);

    const toppings = mods["Topping"] || [];
    const sweetnessLevels = mods["Sweetness Level"] || [];
    const iceLevels = mods["Ice"] || [];

    const drinkCategories = [
        "Milk Tea",
        "Fruit Tea",
        "Matcha",
        "Coffee",
        "Ice Blended",
        "Non-Caffeinated",
    ];

    return (
        <div className="menu-board-container">
            <button className="back-button" onClick={() => navigate(-1)}>Back</button>

            {drinkCategories.map(cat => {
                const group = items.filter(i => i.category === cat);
                if (group.length === 0) return null;

                return (
                    <div key={cat} className="drinks-section">
                        <h1 className="section-title">{cat}</h1>
                        {group.map(item => (
                            <div key={item.id} className="item-row">{item.name}</div>
                        ))}
                    </div>
                );
            })}

            {/* Bottom sections for modifications */}
            <div className="mods-container">
                <div className="mod-column">
                    <h2 className="mod-title">Toppings</h2>
                    {toppings.map(t => <div key={t.id} className="mod-item">{t.name}</div>)}
                </div>
                <div className="mod-column">
                    <h2 className="mod-title">Sweetness Level</h2>
                    {sweetnessLevels.map(s => <div key={s.id} className="mod-item">{s.name}</div>)}
                </div>
                <div className="mod-column">
                    <h2 className="mod-title">Ice Level</h2>
                    {iceLevels.map(i => <div key={i.id} className="mod-item">{i.name}</div>)}
                </div>
            </div>
        </div>
    );

}