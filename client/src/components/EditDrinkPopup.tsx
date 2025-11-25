import { useState } from "react";
import { makeApiCall } from "../globals";

interface EditDrinkPopupProps {
  onClose: () => void;
  onUpdated: () => void;
  categories: string[];
  item: {
    id: number;
    name: string;
    price: number;
    category: string;
    description?: string | null;
    img_name?: string | null;
  };
}

export default function EditDrinkPopup({ onClose, onUpdated, categories, item }: EditDrinkPopupProps) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price));
  const [category, setCategory] = useState(item.category);
  const [description, setDescription] = useState(item.description || "");
  const [imgName, setImgName] = useState(item.img_name || "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Name required"); return; }
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) { setError("Valid price required"); return; }
    setSubmitting(true);
    try {
      await makeApiCall(`/api/db/menu_items/${item.id}/update`, 'PATCH', {
        name: name.trim(),
        price: numericPrice,
        category,
        description: description.trim() || null,
        img_name: imgName.trim() || null,
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(`Update failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (deleting || submitting) return;
    const confirmed = window.confirm(`Delete '${item.name}'? This cannot be undone.`);
    if (!confirmed) return;
    setError(null);
    setDeleting(true);
    try {
      await makeApiCall(`/api/db/menu_items/${item.id}/delete`, 'DELETE', null);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[480px] max-w-[90vw] rounded-xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Drink</h2>
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
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Price ($)</label>
              <input
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
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
          <div className="pt-2 flex justify-between gap-3">
            <button
              type="button"
              disabled={deleting || submitting}
              onClick={handleDelete}
              className={`px-4 py-2 rounded border text-sm font-medium transition active:scale-[0.96] ${deleting ? 'bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed' : 'border-red-600 text-red-600 bg-white hover:bg-red-50 cursor-pointer'}`}
            >{deleting ? 'Deleting…' : 'Delete'}</button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-300 bg-white cursor-pointer hover:bg-gray-100 active:scale-[0.96] transition text-sm"
            >Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 rounded text-white text-sm font-medium transition active:scale-[0.97] ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:brightness-110 cursor-pointer'}`}
            >{submitting ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
