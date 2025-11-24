import { useEffect, useState } from "react";

interface CashierPopupProps {
    onClose: () => void;
    onAdd: () => void;
}

interface ModificationItem {
    id: number;
    name: string;
    price?: number | null;
    description?: string | null;
    category?: string | null;
    img_name?: string | null;
}

export default function CashierPopup({ onClose, onAdd }: CashierPopupProps) {
    const [mods, setMods] = useState<Record<string, ModificationItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedIce, setSelectedIce] = useState<number | null>(null);
    const [selectedSweetness, setSelectedSweetness] = useState<number | null>(null);
    const [selectedToppings, setSelectedToppings] = useState<Record<number, boolean>>({});

    const API_BASE = (import.meta.env.VITE_API_BASE as string) || "";

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(`${API_BASE}/api/db/menu_modifications`)
            .then((res) => {
                if (!res.ok) throw new Error(`Status ${res.status}`);
                return res.json();
            })
            .then((data) => {
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
        if (nameVal.includes("ice") && !nameVal.includes("ice cream")) kind = "ice";
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

    // categorize fetched mods
    const iceItems: ModificationItem[] = [];
    const sweetItems: ModificationItem[] = [];
    const toppingItems: ModificationItem[] = [];
    const otherGroups: Array<{ cat: string; items: ModificationItem[] }> = [];

    Object.entries(mods || {}).forEach(([category, items]) => {
        items.forEach((item) => {
            const nameVal = item.name?.toLowerCase() || "";
            const catVal = (item.category || category || "").toLowerCase();
            let kind: "ice" | "sweetness" | "toppings" | "other";
            if (nameVal.includes("ice") && !nameVal.includes("ice cream")) kind = "ice";
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white w-3/4 p-6 rounded-xl shadow-xl max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between mb-4">
                    <button onClick={onClose}>X</button>
                    <button
                        onClick={() => {
                            if (selectionsComplete) onAdd();
                        }}
                        className={`px-4 py-2 ${!selectionsComplete ? "bg-gray-300 text-gray-600" : "bg-red-600 text-white"} rounded`}
                    >
                        Add
                    </button>
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
                                iceItems.map((it) => {
                                    const selected = selectedIce === it.id;
                                    return (
                                        <button key={it.id} onClick={() => handleSelect(it)} className={`w-full px-4 py-3 border rounded ${selected ? "bg-red-600 text-white" : "bg-white"}`}>
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
                                sweetItems.map((it) => {
                                    const selected = selectedSweetness === it.id;
                                    return (
                                        <button key={it.id} onClick={() => handleSelect(it)} className={`w-full px-4 py-3 border rounded ${selected ? "bg-red-600 text-white" : "bg-white"}`}>
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
                                        <button key={it.id} onClick={() => handleSelect(it)} className={`w-full px-4 py-3 border rounded ${selected ? "bg-red-600 text-white" : "bg-white"}`}>
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
                                            <button key={it.id} onClick={() => handleSelect(it)} className={`px-3 py-2 border rounded ${selected ? "bg-red-600 text-white" : "bg-white"}`}>
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
