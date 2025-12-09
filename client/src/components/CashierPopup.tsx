import { useEffect, useState } from "react";
import { makeApiCall } from "../globals";

interface CashierPopupProps {
    onClose: () => void;
    selectedItem?: { id: number; name: string; price: number; category: string; img_name?: string | null };
    onEdit?: () => void;
    onAdd: (selection: {
        ice_level_id: number | null;
        sweetness_level_id: number | null;
        topping_ids: number[];
        ice_label?: string;
        sweetness_label?: string;
        topping_names?: string[];
        toppings_total?: number;
        quantity?: number;
    }) => void;
}

interface ModificationItem {
    id: number;
    name: string;
    price?: number | null;
    description?: string | null;
    category?: string | null;
    img_name?: string | null;
}

export default function CashierPopup({ onClose, selectedItem, onEdit, onAdd }: CashierPopupProps) {
    const [mods, setMods] = useState<Record<string, ModificationItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedIce, setSelectedIce] = useState<number | null>(null);
    const [selectedSweetness, setSelectedSweetness] = useState<number | null>(null);
    const [selectedToppings, setSelectedToppings] = useState<Record<number, boolean>>({});
    const [quantity, setQuantity] = useState<number>(1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        makeApiCall('/api/db/menu_modifications', 'GET', null)
            .then((data: any) => {
                if (!cancelled) {
                    setMods(data?.categories || {});
                }
            })
            .catch((e) => {
                if (!cancelled) setError(String(e));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSelect = (item: ModificationItem) => {
        const nameVal = item.name?.toLowerCase() || "";
        const catVal = (item.category || "").toLowerCase();
        let kind: "ice" | "sweetness" | "toppings" | "other";
        if ((nameVal.includes("ice") || nameVal.includes("hot")) && !nameVal.includes("ice cream")) kind = "ice";
        else if (nameVal.includes("sweetness") || nameVal.includes("sweet") || nameVal.includes("no sugar") || nameVal.includes("sugar")) kind = "sweetness";
        else if (
            nameVal.includes("topping") ||
            nameVal.includes("boba") ||
            nameVal.includes("jelly") ||
            nameVal.includes("pudding") ||
            nameVal.includes("crema") ||
            nameVal.includes("cream") ||
            nameVal.includes("ice cream")
        )
            kind = "toppings";
        else if (catVal.includes("ice")) kind = "ice";
        else if (catVal.includes("sweetness") || catVal.includes("sweet")) kind = "sweetness";
        else if (catVal.includes("topping") || catVal.includes("boba") || catVal.includes("jelly") || catVal.includes("pudding")) kind = "toppings";
        else kind = "other";

        if (kind === "ice") {
            setSelectedIce((prev) => (prev === item.id ? null : item.id));
        } else if (kind === "sweetness") {
            setSelectedSweetness((prev) => (prev === item.id ? null : item.id));
        } else if (kind === "toppings") {
            setSelectedToppings((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
        } else {
            setSelectedToppings((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
        }
    };

    const selectionsComplete = !!selectedIce && !!selectedSweetness;

    // Categorize modifications
    const iceItems: ModificationItem[] = [];
    const sweetItems: ModificationItem[] = [];
    const toppingItems: ModificationItem[] = [];
    const otherGroups: Array<{ cat: string; items: ModificationItem[] }> = [];

    Object.entries(mods || {}).forEach(([category, items]) => {
        items.forEach((item) => {
            const nameVal = item.name?.toLowerCase() || "";
            const catVal = (item.category || category || "").toLowerCase();
            let kind: "ice" | "sweetness" | "toppings" | "other";
            if ((nameVal.includes("ice") || nameVal.includes("hot")) && !nameVal.includes("ice cream")) kind = "ice";
            else if (nameVal.includes("sweetness") || nameVal.includes("sweet") || nameVal.includes("no sugar") || nameVal.includes("sugar")) kind = "sweetness";
            else if (nameVal.includes("topping") || nameVal.includes("boba") || nameVal.includes("jelly") || nameVal.includes("pudding") || nameVal.includes("crema") || nameVal.includes("cream") || nameVal.includes("ice cream")) kind = "toppings";
            else if (catVal.includes("ice")) kind = "ice";
            else if (catVal.includes("sweetness") || catVal.includes("sweet")) kind = "sweetness";
            else if (catVal.includes("topping") || catVal.includes("boba") || catVal.includes("jelly") || catVal.includes("pudding")) kind = "toppings";
            else kind = "other";

            if (kind === "ice") iceItems.push(item);
            else if (kind === "sweetness") sweetItems.push(item);
            else if (kind === "toppings") toppingItems.push(item);
            else {
                const existing = otherGroups.find((g) => g.cat === category);
                if (existing) existing.items.push(item);
                else otherGroups.push({ cat: category, items: [item] });
            }
        });
    });

    // Order the ice and sweetness levels from regular -> less/half -> none
    const orderPreferenceScore = (name: string) => {
        const n = (name || '').toLowerCase();
        if (/\b(more|extra|120%)\b/.test(n)) return 0;
        if (/\b(regular|normal|full|100%|default)\b/.test(n)) return 1;
        if (/\b(half|50%|medium|less)\b/.test(n)) return 2;
        if (/\b(no|none|0%|zero|no sugar|no ice)\b/.test(n)) return 3;
        if (/\b(hot)\b/.test(n)) return 4;
        // if (/\bless\b/.test(n)) return 0.5;
        return 5;
    };

    const sortByPreference = (arr: ModificationItem[]) => {
        return arr.slice().sort((a, b) => {
            const sa = orderPreferenceScore(a.name || '');
            const sb = orderPreferenceScore(b.name || '');
            if (sa === sb) return (a.name || '').localeCompare(b.name || '');
            return sa < sb ? -1 : 1;
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white w-3/4 p-6 rounded-xl shadow-xl max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Customize Your Drink</h2>
                    <div className="flex items-center gap-3">
                        {/* Quantity Selector */}
                        <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-1">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="text-lg font-bold px-2 hover:bg-gray-100 rounded transition"
                            >
                                −
                            </button>
                            <span className="text-lg font-semibold min-w-[2rem] text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(20, quantity + 1))}
                                className="text-lg font-bold px-2 hover:bg-gray-100 rounded transition"
                            >
                                +
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                if (!selectionsComplete) return;
                                const topping_ids = Object.entries(selectedToppings).filter(([_, v]) => v).map(([k]) => Number(k));

                                // Resolve labels and topping prices from available items
                                const allItems = [...iceItems, ...sweetItems, ...toppingItems, ...otherGroups.flatMap((g) => g.items)];
                                const ice_label = allItems.find((it) => it.id === selectedIce)?.name ?? undefined;
                                const sweetness_label = allItems.find((it) => it.id === selectedSweetness)?.name ?? undefined;
                                const topping_names = topping_ids.map((id) => allItems.find((it) => it.id === id)?.name ?? String(id));
                                // Each topping adds $0.75
                                const TOPPING_PRICE = 0.75;
                                const toppings_total = topping_ids.length * TOPPING_PRICE;

                                onAdd({
                                    ice_level_id: selectedIce,
                                    sweetness_level_id: selectedSweetness,
                                    topping_ids,
                                    ice_label,
                                    sweetness_label,
                                    topping_names,
                                    toppings_total,
                                    quantity,
                                });
                            }}
                            className={`px-4 py-2 rounded cursor-pointer transition active:scale-[0.97] ${!selectionsComplete ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-red-600 text-white hover:brightness-110"}`}
                        >
                            Add
                        </button>
                        {onEdit && selectedItem && (
                            <button
                                onClick={onEdit}
                                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 active:scale-[0.97] transition"
                            >
                                Edit Drink
                            </button>
                        )}
                        <button onClick={onClose} className="px-3 py-2 rounded border border-gray-300 bg-white cursor-pointer hover:bg-gray-100 active:scale-[0.96] transition">X</button>
                    </div>
                </div>

                {loading && <p>Loading options...</p>}
                {error && <p className="text-red-600">Error loading options: {error}</p>}

                {!loading && !error && (
                    <>
                        <h2 className="font-semibold mb-2">Ice Level (Choose One)</h2>
                        <div className="grid grid-cols-4 gap-3 mb-6">
                            {iceItems.length === 0 ? (
                                <div className="text-sm text-gray-500">No ice options available.</div>
                            ) : (
                                    sortByPreference(iceItems).map((it) => {
                                    const selected = selectedIce === it.id;
                                    return (
                                        <button key={it.id} onClick={() => handleSelect(it)} className={`w-full px-4 py-3 border rounded cursor-pointer transition active:scale-[0.97] ${selected ? "bg-red-600 text-white" : "bg-white hover:bg-gray-50"}`}>
                                            {it.name}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <h2 className="font-semibold mb-2">Sweetness Level (Choose One)</h2>
                        <div className="grid grid-cols-5 gap-3 mb-6">
                            {sweetItems.length === 0 ? (
                                <div className="text-sm text-gray-500">No sweetness options available.</div>
                            ) : (
                                sortByPreference(sweetItems).map((it) => {
                                    const selected = selectedSweetness === it.id;
                                    return (
                                        <button key={it.id} onClick={() => handleSelect(it)} className={`w-full px-4 py-3 border rounded cursor-pointer transition active:scale-[0.97] ${selected ? "bg-red-600 text-white" : "bg-white hover:bg-gray-50"}`}>
                                            {it.name}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <h2 className="font-semibold mb-2">Toppings</h2>
                        <div className="grid grid-cols-4 gap-3 mb-6">
                            {toppingItems.length === 0 ? (
                                <div className="text-sm text-gray-500">No toppings available.</div>
                            ) : (
                                toppingItems.map((it) => {
                                    const selected = !!selectedToppings[it.id];
                                    return (
                                        <button key={it.id} onClick={() => handleSelect(it)} className={`w-full px-4 py-3 border rounded cursor-pointer transition active:scale-[0.97] ${selected ? "bg-red-600 text-white" : "bg-white hover:bg-gray-50"}`}>
                                            {it.name}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {otherGroups.map((g) => (
                            <div key={g.cat} className="mb-4">
                                <h3 className="font-medium">{g.cat}</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {g.items.map((it) => {
                                        const selected = !!selectedToppings[it.id];
                                        return (
                                            <button key={it.id} onClick={() => handleSelect(it)} className={`px-3 py-2 border rounded cursor-pointer transition active:scale-[0.97] ${selected ? "bg-red-600 text-white" : "bg-white hover:bg-gray-50"}`}>
                                                {it.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
