import { useEffect, useState } from "react";

interface AddDrinkPopupProps {
  onClose: () => void;
  onCreated: () => void;
  categories: string[];
  apiBase: string;
}

export default function AddDrinkPopup({ onClose, onCreated, categories, apiBase }: AddDrinkPopupProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [description, setDescription] = useState("");
  const [imgName, setImgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inventory, setInventory] = useState<Array<{id:number; name:string;}>>([]);
  const [ingredients, setIngredients] = useState<Array<{inventory_item_id:number|null; quantity_used:string}>>([
    { inventory_item_id: null, quantity_used: "" }
  ]);

  useEffect(() => {
    // Fetch inventory for ingredient selection
    (async () => {
      try {
        const resp = await fetch(`${apiBase}/api/db/inventory`);
        if (resp.ok) {
          const data = await resp.json();
            setInventory((data.inventory || []).map((i: any) => ({ id: i.id, name: i.name })));
        }
      } catch {}
    })();
  }, [apiBase]);

  function addIngredientRow() {
    setIngredients(prev => [...prev, { inventory_item_id: null, quantity_used: "" }]);
  }
  function updateIngredient(index:number, field:'inventory_item_id'|'quantity_used', value:string) {
    setIngredients(prev => prev.map((row,i) => i===index ? {
      ...row,
      [field]: field==='inventory_item_id' ? (value? Number(value): null) : value
    } : row));
  }
  function removeIngredient(index:number) {
    setIngredients(prev => prev.filter((_,i)=>i!==index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Name required"); return; }
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) { setError("Valid price required"); return; }
    setSubmitting(true);
    try {
      // Create menu item first
      const resp = await fetch(`${apiBase}/api/db/menu_items/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          price: numericPrice,
          category,
          description: description.trim() || null,
          img_name: imgName.trim() || null,
          is_modification: false,
        })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `Status ${resp.status}`);
      }
      const created = await resp.json();
      const newId = created.id;

      // Prepare recipe ingredients: filter valid rows
      const validIngredients = ingredients
        .filter(r => r.inventory_item_id !== null && r.quantity_used.trim() !== "")
        .map(r => ({
          inventory_item_id: r.inventory_item_id as number,
          quantity_used: Number(r.quantity_used)
        }))
        .filter(r => r.quantity_used > 0);

      if (validIngredients.length > 0) {
        const recipeResp = await fetch(`${apiBase}/api/db/menu_items/${newId}/recipe/set`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients: validIngredients })
        });
        if (!recipeResp.ok) {
          const txt = await recipeResp.text();
          throw new Error(`Recipe set failed: ${txt || recipeResp.status}`);
        }
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(`Create failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[480px] max-w-[90vw] rounded-xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Drink</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded border border-gray-300 bg-white cursor-pointer hover:bg-gray-100 active:scale-[0.96] transition"
          >X</button>
        </div>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Drink name"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Price ($)</label>
              <input
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="e.g. 5.99"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image Name</label>
            <input
              value={imgName}
              onChange={e => setImgName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Optional (e.g. mango_milk_tea.png)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Ingredients (Recipe)</label>
            <div className="space-y-2 mb-4">
              {ingredients.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={row.inventory_item_id ?? ''}
                    onChange={e => updateIngredient(idx, 'inventory_item_id', e.target.value)}
                    className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">Select Item</option>
                    {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                  </select>
                  <input
                    value={row.quantity_used}
                    onChange={e => updateIngredient(idx, 'quantity_used', e.target.value)}
                    placeholder="Qty"
                    className="w-20 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="px-2 py-1 text-xs rounded border border-gray-300 bg-white cursor-pointer hover:bg-gray-100 active:scale-[0.96]"
                  >Remove</button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredientRow}
              className="mb-6 px-3 py-1 rounded border border-red-600 text-red-600 text-xs font-medium cursor-pointer hover:bg-red-50 active:scale-[0.96]"
            >Add Ingredient</button>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-300 bg-white cursor-pointer hover:bg-gray-100 active:scale-[0.96] transition text-sm"
            >Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 rounded text-white text-sm font-medium transition active:scale-[0.97] ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:brightness-110 cursor-pointer'}`}
            >{submitting ? 'Saving…' : 'Create Drink'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
