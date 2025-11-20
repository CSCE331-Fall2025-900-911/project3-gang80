import "./Popup.css";
import DrinkImage from "./DrinkImage";
import { useEffect, useState } from "react";

interface PopupProps {
  onClose: () => void;
  onAdd: () => void;
  title: string;
  imgName: string;
}

interface ModificationItem {
  id: number;
  name: string;
  price?: number | null;
  description?: string | null;
  category?: string | null;
  img_name?: string | null;
}

function Popup({ onClose, onAdd, title, imgName }: PopupProps) {
  const [mods, setMods] = useState<Record<string, ModificationItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIce, setSelectedIce] = useState<number | null>(null);
  const [selectedSweetness, setSelectedSweetness] = useState<number | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<Record<number, boolean>>({});
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    // Fetch modification items grouped by category from backend
    // Assumption: backend runs on localhost:5000 during local development
    fetch("http://127.0.0.1:5000/api/db/menu_modifications")
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.categories) setMods(data.categories);
        else setMods({});
      })
      .catch((e) => {
        console.error("Failed to load modifications", e);
        setError(String(e));
      })
      .finally(() => setLoading(false));
  }, []);


  const handleSelect = (item: ModificationItem) => {
    // Use the same categorize logic from inside the render
    const nameVal = item.name?.toLowerCase() || '';
    const catVal = (item.category || '')?.toLowerCase() || '';
    
    let kind: 'ice' | 'sweetness' | 'toppings' | 'other';
    if (nameVal.includes('ice') && !nameVal.includes('ice cream')) kind = 'ice';
    else if (nameVal.includes('sweetness') || nameVal.includes('sweet') || nameVal.includes('no sugar') || nameVal.includes('sugar')) kind = 'sweetness';
    else if (
      nameVal.includes('topping') ||
      nameVal.includes('boba') ||
      nameVal.includes('jelly') ||
      nameVal.includes('pudding') ||
      nameVal.includes('crema') ||
      nameVal.includes('cream') ||
      nameVal.includes('ice cream')
    ) kind = 'toppings';
    else if (catVal.includes('ice')) kind = 'ice';
    else if (catVal.includes('sweetness') || catVal.includes('sweet')) kind = 'sweetness';
    else if (catVal.includes('topping') || catVal.includes('boba') || catVal.includes('jelly') || catVal.includes('pudding')) kind = 'toppings';
    else kind = 'other';

    if (kind === 'ice') {
      setSelectedIce((prev) => (prev === item.id ? null : item.id));
      setValidationMsg(null);
    } else if (kind === 'sweetness') {
      setSelectedSweetness((prev) => (prev === item.id ? null : item.id));
      setValidationMsg(null);
    } else if (kind === 'toppings') {
      setSelectedToppings((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    } else {
      // default to toppings-style multi-select for unknown categories
      setSelectedToppings((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    }
  };

  // const handleAdd = () => {
  //   // Build a summary of selections
  //   const toppings = Object.entries(selectedToppings)
  //     .filter(([_, v]) => v)
  //     .map(([k]) => Number(k));

  //   const summary = {
  //     ice_level_id: selectedIce,
  //     sweetness_level_id: selectedSweetness,
  //     topping_ids: toppings,
  //   };
  //   console.log('Adding with selections', summary);
  //   // keep existing signature: call onAdd without args
  //   onAdd();
  // };

  const handleAdd = () => {
    if (!selectedIce || !selectedSweetness) {
      setValidationMsg("Please select both Sweetness Level and Ice Level.");
      return;
    }
    setValidationMsg(null);
    onAdd();
  };

  const selectionsComplete = !!selectedIce && !!selectedSweetness;

  return (
    <div className="popup">
      <div className="background">

        <div className="popup-bar">
            <button onClick={onClose} className="popup-button">Close</button>
            <h2 className="text-xl font-semibold">Customization</h2>
            <button
              onClick={handleAdd}
              className={`popup-button-1 ${!selectionsComplete ? 'border-red-600' : ''}`}
            >
              Add
            </button> 
        </div>

        {validationMsg && (
          <div className="mt-2 text-center text-red-600 font-semibold">
            {validationMsg}
          </div>
        )}

        <div className="flex gap-4">
          <div className="flex flex-col bg-gray-50 rounded p-4 justify-center items-center">
            <h2 className="text-3xl font-bold my-4">{title}</h2>
            <div className="max-w-[200px] object-contain">
              <DrinkImage drink={imgName} />
            </div>
          </div>

          <div className="flex flex-1 bg-gray-50 rounded p-4 min-w-0">
            <div className="min-w-0 w-fit">
              {loading && <p className="text-center">Loading options...</p>}
              {error && <p className="text-red-600 text-center">Error loading options: {error}</p>}

              {!loading && !error && (
                Object.keys(mods).length === 0 ? (
                  <p className="text-center">No customization options available.</p>
                ) : (
                  // Group into Ice, Sweetness, Toppings and then render other categories below
                  (() => {
                    const iceItems: ModificationItem[] = [];
                    const sweetItems: ModificationItem[] = [];
                    const toppingItems: ModificationItem[] = [];
                    const otherGroups: Array<{ cat: string; items: ModificationItem[] }> = [];

                    Object.entries(mods).forEach(([category, items]) => {
                      function categorize(name: string, cat: string): 'ice' | 'sweetness' | 'toppings' | 'other' {
                        const nameVal = name?.toLowerCase() || '';
                        const catVal = cat?.toLowerCase() || '';
                        
                        // Check name first (more specific)
                        if (nameVal.includes('ice') && !nameVal.includes('ice cream')) return 'ice';
                        if (nameVal.includes('sweetness') || nameVal.includes('sweet') || nameVal.includes('no sugar') || nameVal.includes('sugar')) return 'sweetness';
                        if (
                          nameVal.includes('topping') ||
                          nameVal.includes('boba') ||
                          nameVal.includes('jelly') ||
                          nameVal.includes('pudding') ||
                          nameVal.includes('crema') ||
                          nameVal.includes('cream') ||
                          nameVal.includes('ice cream')
                        )
                          return 'toppings';

                        // Fall back to category field
                        if (catVal.includes('ice')) return 'ice';
                        if (catVal.includes('sweetness') || catVal.includes('sweet')) return 'sweetness';
                        if (catVal.includes('topping') || catVal.includes('boba') || catVal.includes('jelly') || catVal.includes('pudding'))
                          return 'toppings';

                        return 'other';
                      }
                      // Categorize each item individually (more robust than using the group key)
                      items.forEach((item) => {
                        const kind = categorize(item.name, item.category || category);

                        if (kind === 'ice') iceItems.push(item);
                        else if (kind === 'sweetness') sweetItems.push(item);
                        else if (kind === 'toppings') toppingItems.push(item);
                        else {
                          // Put into "other" group under the original category name
                          const existing = otherGroups.find((g) => g.cat === category);
                          if (existing) existing.items.push(item);
                          else otherGroups.push({ cat: category, items: [item] });
                        }
                      });
                    });

                    // Prepare slices to match requested visual counts
                    const iceSlice = iceItems.slice(0, 4);
                    const sweetSlice = sweetItems.slice(0, 4);
                    const toppingSlice = toppingItems.slice(0, 10);

                    return (
                      <div>
                        {/* Three columns: Sweetness | Ice | Toppings */}
                        <div className="grid grid-cols-3 gap-4 mb-2">
                          <div className="col-span-1 bg-white rounded p-3 max-w-[350px]">
                            <h2 className="text-lg font-medium mb-2">Sweetness Level</h2>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {sweetSlice.map((it) => {
                                const selected = selectedSweetness === it.id;
                                return (
                                  <button
                                    key={it.id}
                                    onClick={() => handleSelect(it)}
                                    className={`w-full px-4 py-2 border rounded transition ${selected ? 'bg-red-600 text-white border-black' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                                  >
                                    {it.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="col-span-1 bg-white rounded p-3 max-w-[350px]">
                            <h2 className="text-lg font-medium mb-2">Ice Level</h2>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {iceSlice.map((it) => {
                                const selected = selectedIce === it.id;
                                return (
                                  <button
                                    key={it.id}
                                    onClick={() => handleSelect(it)}
                                    className={`w-full px-4 py-2 border rounded transition ${selected ? 'bg-red-600 text-white border-black' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                                  >
                                    {it.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="col-span-1 bg-white rounded p-3 max-w-[350px]">
                            <h2 className="text-lg font-medium mb-2">Toppings</h2>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {toppingSlice.map((it) => {
                                const selected = !!selectedToppings[it.id];
                                return (
                                  <button
                                    key={it.id}
                                    onClick={() => handleSelect(it)}
                                    className={`w-full px-4 py-2 border rounded transition ${selected ? 'bg-red-600 text-white border-black' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                                  >
                                    {it.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Other categories rendered as generic groups below */}
                        {otherGroups.map((g) => (
                          <div key={g.cat} className="mb-6">
                            <h2 className="text-lg font-medium mb-2">{g.cat}</h2>
                            <div className="flex flex-wrap gap-3">
                              {g.items.map((it) => {
                                const selected = !!selectedToppings[it.id];
                                return (
                                  <button
                                    key={it.id}
                                    onClick={() => handleSelect(it)}
                                    className={`px-4 py-2 border rounded transition ${selected ? 'bg-blue-600 text-white border-blue-700' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                                  >
                                    {it.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Popup;
