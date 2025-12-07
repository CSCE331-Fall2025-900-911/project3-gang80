import React, { useEffect, useState } from 'react';
import "../css/MenuBoard.css";
import { useNavigate } from 'react-router-dom';
import promoGif from "../assets/bobagif.gif";

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

    const toppingsAll = mods["Topping"] || [];

    const iceNames = ["No Ice", "Less Ice", "Regular Ice"];
    const sweetnessNames = ["No Sugar", "Half Sweetness", "Regular Sweetness"];

    const iceLevels = toppingsAll.filter(t => iceNames.includes(t.name));
    const sweetnessLevels = toppingsAll.filter(t => sweetnessNames.includes(t.name));
    const toppings = toppingsAll.filter(
        t => !iceNames.includes(t.name) && !sweetnessNames.includes(t.name)
    );

    const drinkCategories = [
        "Milk Tea",
        "Fruit Tea",
        "Matcha",
        "Coffee",
        "Ice Blended",
        "Non-Caffeinated",
    ];

    function chunkArray<T>(arr: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }

    const toppingChunks = chunkArray(toppings, 3); 


    return (
        <div className="menu-board-container">
            {/* Drinks */}
            <div className="drinks-grid">
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
            </div>

            <div className="promo-gif-container">
                <img src={promoGif} alt="Promo GIF" className="promo-gif" />
            </div>

            {/* Bottom sections for modifications */}
            <div className="mods-container">
                <div className="mod-column-toppings-columns">
                    <h2 className="mod-title-tops">Toppings</h2>

                    <div className="toppings-flex">
                        {toppingChunks.map((chunk, index) => (
                            <div key={index} className="toppings-col">
                                {chunk.map(t => (
                                    <div key={t.id} className="mod-item">{t.name}</div>
                                ))}
                            </div>
                        ))}
                    </div>
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

            <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        </div>
    );

}