import "./Popup.css";
import DrinkImage from "./DrinkImage";
import { useEffect, useState } from "react";
import { useTranslation } from "../contexts/TranslationContext";
import { useContrastMode } from "../contexts/ContrastModeContext";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const startPopupTutorial = () => {
  const tour = driver({
    showProgress: true,
    steps: [
      {
        element: ".popup h2", 
        popover: {
          title: "Customization",
          description: "Customize your drink by selecting ice level, sweetness level, and toppings.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: ".popup-bar button:nth-of-type(3)",
        popover: {
          title: "Add Button",
          description: "Click this button to add the customized drink to your cart after making your selections.",
          side: "top",
          align: "center",
        },
      },
      {
        element: ".popup-bar button:nth-of-type(1)",
        popover: {
          title: "Close Button",
          description: "Click this button to close the customization popup without adding the drink to your cart.",
          side: "top",
          align: "center",
        },
      },
    ],
  });
  tour.drive();
}

interface PopupProps {
  onClose: () => void;
  onAdd: (
    iceLevel: number | null,
    sweetnessLevel: number | null,
    sizeLevel: number | null,
    toppings: Array<{ id: number; name: string; price: number }>
  ) => void;
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
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const { highContrast } = useContrastMode();
  const { language, translate, t } = useTranslation();
  const [translatedNames, setTranslatedNames] = useState<Record<number, string>>({});
  const [translatedStatics, setTranslatedStatics] = useState<Record<string, string>>({});
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);


  useEffect(() => {
    // Fetch modification items grouped by category from backend
    // Assumption: backend runs on localhost:5000 during local development
    fetch("https://project3-gang80.onrender.com/api/db/menu_modifications")
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

  // Translate modification item names and static UI text when language changes
  useEffect(() => {
    let mounted = true;
    async function runTranslations() {
      if (language === 'en') {
        setTranslatedNames({});
        setTranslatedStatics({});
        setTranslatedTitle(null);
        return;
      }
      try {
        // collect unique names to translate
        const names: Array<{ id?: number; text: string }> = [];
        Object.values(mods).flat().forEach((m) => {
          if (m && m.name) names.push({ id: m.id, text: m.name });
        });

        const staticTexts = [
          'Customization',
          'Loading options...',
          'Please select both Sweetness Level and Ice Level.',
          'Sweetness Level',
          'Ice Level',
          'Toppings',
          'Add',
          'Close',
          'No customization options available.'
        ];

        const promises: Promise<string>[] = [];
        names.forEach(n => promises.push(translate(n.text)));
        staticTexts.forEach(s => promises.push(translate(s)));

        const results = await Promise.all(promises);
        if (!mounted) return;
        const nameMap: Record<number, string> = {};
        names.forEach((n, idx) => { if (n.id) nameMap[n.id] = results[idx]; });

        const staticsMap: Record<string, string> = {};
        staticTexts.forEach((s, i) => { staticsMap[s] = results[names.length + i]; });

        setTranslatedNames(nameMap);
        setTranslatedStatics(staticsMap);
        // also translate popup title if present in the current UI
        if (title) {
          try {
            const tt = await translate(title);
            if (mounted) setTranslatedTitle(tt);
          } catch (err) {
            console.error('Title translate error', err);
          }
        }
      } catch (err) {
        console.error('Popup translation error', err);
      }
    }
    runTranslations();
    return () => { mounted = false; };
  }, [language, mods]);


  const handleSelect = (item: ModificationItem) => {
    // Use the same categorize logic from inside the render
    const nameVal = item.name?.toLowerCase() || '';
    const catVal = (item.category || '')?.toLowerCase() || '';
    
    let kind: 'ice' | 'sweetness' | 'size' | 'toppings' | 'other';
    if (nameVal.includes('size') || catVal.includes('size')) {
        kind = 'size';
    }
    else if (nameVal.includes('ice') && !nameVal.includes('ice cream')) kind = 'ice';
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

    if (kind === 'size') {
        setSelectedSize(prev => (prev === item.id ? null : item.id));
        setValidationMsg(null);
    }
    else if (kind === 'ice') {
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


  const handleAdd = () => {
    if (!selectedIce || !selectedSweetness || !selectedSize) {
      setValidationMsg("Please select both Sweetness Level, Ice Level, and Drink Size");
      return;
    }
    setValidationMsg(null);

    const selectedToppingsArray = Object.entries(selectedToppings)
      .filter(([_, selected]) => selected)
      .map(([id]) => {
        const topping = Object.values(mods).flat().find((mod) => mod.id === Number(id));
        return { id: Number(id), name: topping?.name || "", price: topping?.price || 0 };
      });

    onAdd(selectedIce, selectedSweetness, selectedSize, selectedToppingsArray);
  };

  const selectionsComplete = !!selectedIce && !!selectedSweetness && !!selectedSize;

  return (
    <div className={`popup ${highContrast ? "high-contrast" : ""}`}>
      <div className="background">
        <div className="popup-bar">
            <button onClick={onClose} className="popup-button">{translatedStatics['Close'] ?? t('Close')}</button>
            <h2 className="text-xl font-semibold">{translatedStatics['Customization'] ?? t('Customization')}</h2>
            <button
              onClick={handleAdd}
              className={`popup-button-1 ${!selectionsComplete ? 'border-red-600' : ''}`}
            >
              {translatedStatics['Add'] ?? t('Add')}
            </button> 
        </div>

        {validationMsg && (
          <div className="mt-2 text-center text-red-600 font-semibold">
            {translatedStatics[validationMsg] ?? t(validationMsg)}
          </div>
        )}

        <div className="flex gap-4">
          <div className="drink-pic flex flex-col bg-gray-50 rounded p-4 justify-center items-center">
            <h2 className="text-3xl font-bold my-4">{translatedTitle ?? title}</h2>
              <div className="max-w-[240px] object-contain">
                <DrinkImage drink={imgName} size={192} fill variant="popup" className="mx-auto" />
              </div>
          </div>

          <div className="option-cont flex flex-1 bg-gray-50 rounded p-4 min-w-0">
            <div className="min-w-0 w-fit">
              {loading && <p className="text-center">{translatedStatics['Loading options...'] ?? t('Loading options...')}</p>}
              {error && <p className="text-red-600 text-center">{translatedStatics['Error loading options:'] ?? t('Error loading options:')} {error}</p>}

              {!loading && !error && (
                  Object.keys(mods).length === 0 ? (
                  <p className="text-center">{translatedStatics['No customization options available.'] ?? t('No customization options available.')}</p>
                ) : (
                  // Group into Ice, Sweetness, Toppings and then render other categories below
                  (() => {
                    let iceItems: ModificationItem[] = [];
                    let sizeItems: ModificationItem[] = [];
                    let sweetItems: ModificationItem[] = [];
                    const toppingItems: ModificationItem[] = [];
                    const otherGroups: Array<{ cat: string; items: ModificationItem[] }> = [];

                    Object.entries(mods).forEach(([category, items]) => {
                      function categorize(name: string, cat: string): 'ice' | 'sweetness' | 'size' | 'toppings' | 'other' {
                        const nameVal = name?.toLowerCase() || '';
                        const catVal = cat?.toLowerCase() || '';
                        
                        if (nameVal === 'hot') return 'ice';

                        // Check name first (more specific)
                        if (nameVal.includes('size') || catVal.includes('size')) return 'size';
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
                        if (kind === 'size') sizeItems.push(item);
                        else if (kind === 'ice') iceItems.push(item);
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

                    // Sort items by preferred order
                    const sortByPreference = (items: ModificationItem[], preference: string[]): ModificationItem[] => {
                      return items.sort((a, b) => {
                        const aIndex = preference.findIndex(p => a.name?.toLowerCase().includes(p));
                        const bIndex = preference.findIndex(p => b.name?.toLowerCase().includes(p));
                        if (aIndex === -1) return 1;
                        if (bIndex === -1) return -1;
                        return aIndex - bIndex;
                      });
                    };

                    sweetItems = sortByPreference(sweetItems, ['extra sweetness', 'regular', 'half', 'no sugar']);
                    iceItems = sortByPreference(iceItems, ['extra ice', 'regular', 'less', 'no ice', 'hot']);

                    // Prepare slices to match requested visual counts
                    const iceSlice = iceItems.slice(0, 5);
                    const sweetSlice = sweetItems.slice(0, 4);
                    const toppingSlice = toppingItems.slice(0, 10);

                    return (
                      <div>
                        {/* Three columns: Sweetness | Ice | Toppings */}
                        <div className="grid grid-cols-4 gap-4 mb-2">
                          <div className="category-col col-span-1 bg-white rounded p-3 max-w-[350px]">
                            <h2 className="text-lg font-medium mb-2">{translatedStatics['Sweetness Level'] ?? t('Sweetness Level')}</h2>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {sweetSlice.map((it) => {
                                const selected = selectedSweetness === it.id;
                                return (
                                  <button
                                    key={it.id}
                                    onClick={() => handleSelect(it)}
                                    className={`cat-butt ${selected ? "selected" : ""} w-full px-4 py-2 border rounded transition ${selected ? 'bg-red-600 text-white border-black' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                                  >
                                    {it.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="category-col col-span-1 bg-white rounded p-3 max-w-[350px]">
                            <h2 className="text-lg font-medium mb-2">{translatedStatics['Ice Level'] ?? t('Ice Level')}</h2>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {iceSlice.map((it) => {
                                const selected = selectedIce === it.id;
                                return (
                                  <button
                                    key={it.id}
                                    onClick={() => handleSelect(it)}
                                    className={`cat-butt ${selected ? "selected" : ""} w-full px-4 py-2 border rounded transition ${selected ? 'bg-red-600 text-white border-black' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                                  >
                                    {it.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="category-col col-span-1 bg-white rounded p-3 max-w-[350px]">
                            <h2 className="text-lg font-medium mb-2">
                              {translatedStatics['Drink Size'] ?? 'Drink Size'}
                            </h2>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {sizeItems.map((it) => {
                                const selected = selectedSize === it.id;
                                return (
                                  <button
                                    key={it.id}
                                    onClick={() => handleSelect(it)}
                                    className={`cat-butt ${selected ? "selected" : ""} w-full px-4 py-2 border rounded transition ${
                                      selected
                                        ? 'bg-red-600 text-white border-black'
                                        : 'bg-white border-gray-300 hover:bg-gray-100'
                                    }`}
                                  >
                                    {translatedNames[it.id] ?? it.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="category-col col-span-1 bg-white rounded p-3 max-w-[350px]">
                            <h2 className="text-lg font-medium mb-2">{translatedStatics['Toppings'] ?? t('Toppings')}</h2>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {toppingSlice.map((it) => {
                                const selected = !!selectedToppings[it.id];
                                return (
                                  <button
                                    key={it.id}
                                    onClick={() => handleSelect(it)}
                                    className={`cat-butt ${selected ? "selected" : ""} w-full px-4 py-2 border rounded transition ${selected ? 'bg-red-600 text-white border-black' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                                  >
                                    {translatedNames[it.id] ?? it.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Other categories rendered as generic groups below */}
                        {otherGroups.map((g) => (
                          <div key={g.cat} className="mb-6">
                            <h2 className="text-lg font-medium mb-2">{translatedStatics[g.cat] ?? g.cat}</h2>
                            <div className="flex flex-wrap gap-3">
                              {g.items.map((it) => {
                                const selected = !!selectedToppings[it.id];
                                return (
                                  <button
                                    key={it.id}
                                    onClick={() => handleSelect(it)}
                                    className={`px-4 py-2 border rounded transition ${selected ? 'bg-blue-600 text-white border-blue-700' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                                  >
                                    {translatedNames[it.id] ?? it.name}
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
        <button onClick={startPopupTutorial} className="popup-floating-btn">
          ?
        </button>

      </div>
    </div>
  );
}

export default Popup;
