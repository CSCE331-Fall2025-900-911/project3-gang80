import { useEffect, useState } from "react";
import DrinkImage from "../components/DrinkImage";
import CashierPopup from "../components/CashierPopup";
import AddDrinkPopup from "../components/AddDrinkPopup";
import EditDrinkPopup from "../components/EditDrinkPopup";
import { useContrastMode } from '../contexts/ContrastModeContext';


export default function Cashier() {
	const [modalOpen, setModalOpen] = useState(false);
	const [addDrinkOpen, setAddDrinkOpen] = useState(false);
	const [editDrinkOpen, setEditDrinkOpen] = useState(false);
	const [editingDrink, setEditingDrink] = useState<null | { id: number; name: string; price: number; category: string; description?: string | null; img_name?: string | null }>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<Array<{ id: number; name: string; price: number; category: string; img_name?: string | null }>>([]);
	const [selectedItem, setSelectedItem] = useState<null | { id: number; name: string; price: number; category: string; img_name?: string | null }>(null);
	const [cartItems, setCartItems] = useState<Array<{
		id: number; // internal cart id
		menu_item_id: number;
		name: string;
		price: number; // price per unit (base + toppings)
		quantity: number;
		selections: {
			ice_level_id: number | null;
			sweetness_level_id: number | null;
			topping_ids: number[];
			ice_label?: string;
			sweetness_label?: string;
			topping_names?: string[];
			toppings_total?: number;
		};
	}>>([]);

	const { resetContrast } = useContrastMode();

	useEffect(() => {
		localStorage.removeItem("cartItems");
		resetContrast(); // ensure contrast is OFF on non-kiosk routes
	}, []);

	// Categories for base drinks
	const CATEGORIES = [
		"Milk Tea",
		"Fruit Tea",
		"Matcha",
		"Coffee",
		"Ice Blended",
		"Non-Caffeinated",
	];

	const API_BASE = (import.meta.env.VITE_API_BASE as string) || '';

	useEffect(() => {
		let cancelled = false;
		async function loadAll() {
			setLoading(true);
			setError(null);
			try {
				const results = await Promise.all(
					CATEGORIES.map(async (cat) => {
						const resp = await fetch(`${API_BASE}/api/db/menu_items_by_category?category=${encodeURIComponent(cat)}`);
						if (!resp.ok) throw new Error(`Failed ${cat}: ${resp.status}`);
						const data = await resp.json();
						return (data.items || []).map((d: any) => ({
							id: d.id,
							name: d.name,
							price: d.price,
							category: d.category,
							img_name: d.img_name,
						}));
					})
				);
				if (!cancelled) {
					// Flatten arrays
						setItems(results.flat());
				}
			} catch (e: any) {
				if (!cancelled) setError(String(e));
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		loadAll();
		return () => {
			cancelled = true;
		};
	}, []);

	const [submitting, setSubmitting] = useState(false);
	// Pricing calculations
	const TAX_RATE = 0.0825;
	const subtotal = cartItems.reduce((sum, c) => sum + c.price * c.quantity, 0);
	const tax = Number((subtotal * TAX_RATE).toFixed(2));
	const totalWithTax = Number((subtotal + tax).toFixed(2));

	async function handleCharge() {
		if (cartItems.length === 0 || submitting) return;
		setSubmitting(true);
		setError(null);
		// Retrieve logged in user id for employee_id
		const storedUserId = localStorage.getItem('user_id');
		if (!storedUserId) {
			setError('No logged in user. Please sign in first.');
			alert('Please sign in before charging.');
			setSubmitting(false);
			return;
		}
		const employeeId = Number(storedUserId);
		if (Number.isNaN(employeeId)) {
			setError('Invalid stored user id.');
			alert('Invalid user id; cannot submit order.');
			setSubmitting(false);
			return;
		}
		try {
			// Build a new array items that contains one entry per physical drink being ordered
			const items: Array<{ menu_item_id: number; toppings?: { id: number }[] }> = [];
			cartItems.forEach((c) => {
				const toppingIds = c.selections.topping_ids || [];
				const toppings = toppingIds.map((id) => ({ id }));
				for (let i = 0; i < c.quantity; i++) {
					items.push({ menu_item_id: c.menu_item_id, toppings });
				}
			});

			// Pearls earned: one per drink ordered
			const pearlsEarned = cartItems.reduce((sum, c) => sum + c.quantity, 0);

			const payload = {
				customer_id: null, // TODO: Extend later to include customer flow
				employee_id: employeeId,
				payment_method: "Cash",
				pearls_earned: pearlsEarned,
				total_price: totalWithTax, 
				items,
			};

			const resp = await fetch(`${API_BASE}/api/db/orders/create`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!resp.ok) {
				const txt = await resp.text();
				throw new Error(`Charge failed (${resp.status}): ${txt}`);
			}

			// Successful order and clear cart
			setCartItems([]);
			alert('Order submitted successfully.');
		} catch (e: any) {
			console.error('Charge error:', e);
			setError(e?.message || 'Failed to submit order');
			alert('Failed to submit order. See console for details.');
		} finally {
			setSubmitting(false);
		}
	}


	return (
		<>
			<div className="w-full h-screen flex bg-gray-100">
				<div className="flex-1 p-6 overflow-y-auto">
					{loading && <p className="text-center text-sm text-gray-600">Loading menu...</p>}
					{error && <p className="text-center text-red-600">{error}</p>}
					{!loading && !error && (
						<div className="grid grid-cols-6 gap-4">
							{items.map((item) => (
								<button
									key={item.id}
									onClick={() => { setSelectedItem(item); setModalOpen(true); }}
									className="relative group cursor-pointer bg-[#f3f3f3] border border-[#d0d5dd] rounded-lg min-h-44 w-full flex flex-col items-center px-2 pt-2 pb-3 shadow-sm transition-all duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 overflow-hidden"
									title={item.name}
								>
									<div
										onClick={(e) => { e.stopPropagation(); setEditingDrink(item); setEditDrinkOpen(true); }}
										className="absolute top-1 right-1 px-2 py-1 text-[10px] leading-none bg-white border border-gray-300 rounded shadow cursor-pointer hover:bg-gray-50 active:scale-[0.95]"
										role="button"
										tabIndex={0}
										onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setEditingDrink(item); setEditDrinkOpen(true); } }}
										aria-label={`Edit ${item.name}`}
									>
										Edit
									</div>
									<div className="flex items-center justify-center h-32 w-full overflow-hidden px-2">
										{item.img_name ? (
											<DrinkImage drink={item.img_name} size={220} fill className="object-contain" />
										) : (
											<div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-[11px] text-gray-600 rounded-md">
												{item.category.split(' ')[0]}
											</div>
										)}
									</div>
									<div className="mt-2 w-full flex flex-col items-center flex-1">
										<div className="drink-tile-name text-[12px] font-semibold text-center whitespace-normal break-words leading-tight w-full flex-1 flex items-center justify-center">
											{item.name}
										</div>
										<div className="drink-tile-price text-[11px] text-gray-600 mt-2">${item.price.toFixed(2)}</div>
									</div>
								</button>
							))}
							<button
								onClick={() => setAddDrinkOpen(true)}
								className="w-full min-h-44 flex flex-col items-center justify-center rounded-2xl shadow bg-white border-2 border-dashed hover:bg-gray-100 text-4xl cursor-pointer transition"
							>
								<div className="text-5xl leading-none">+</div>
								<div className="mt-2 text-sm font-medium">Add Drink</div>
							</button>
							{items.length === 0 && (
								<div className="col-span-6 text-center text-gray-500 py-12">No menu items found.</div>
							)}
						</div>
					)}
				</div>

				<div className="w-80 bg-white border-l p-6 flex flex-col justify-between">
					<div>
						<div className="h-48 w-full bg-gray-200 rounded mb-2 p-3 overflow-y-auto">
						{cartItems.length === 0 ? (
							<div className="text-xs text-gray-600">Cart is empty</div>
						) : (
							cartItems.map((c) => {
								const iceLabel = c.selections.ice_label ?? '';
								const sweetLabel = c.selections.sweetness_label ?? '';
								const toppingNames = c.selections.topping_names || [];
								const selectionParts: string[] = [];
								if (iceLabel) selectionParts.push(`Ice: ${iceLabel}`);
								if (sweetLabel) selectionParts.push(`Sweet: ${sweetLabel}`);
								if (toppingNames.length) selectionParts.push(toppingNames.join(', '));
								return (
									<div key={c.id} className="flex items-center justify-between bg-white/70 rounded px-2 py-1 mb-2">
										<div className="text-sm">
											<div className="font-medium">{c.name} x{c.quantity}</div>
											{selectionParts.length > 0 && (
												<div className="text-[11px] text-gray-700">{selectionParts.join(' · ')}</div>
											)}
										</div>
										<div className="flex items-center gap-2">
											<div className="text-sm">${(c.price * c.quantity).toFixed(2)}</div>
											<button
												aria-label="Remove item"
												className="w-6 h-6 leading-none flex items-center justify-center border border-gray-300 rounded text-red-600 bg-white"
												onClick={() => setCartItems((prev) => prev.filter((p) => p.id !== c.id))}
											>
												x
											</button>
										</div>
									</div>
								);
							})
						)}
					</div>
					<div className="flex items-center justify-between mb-4">
						<span className="font-medium">Subtotal</span>
						<span className="font-semibold">${subtotal.toFixed(2)}</span>
					</div>
						<div className="flex items-center justify-between mb-2">
							<span className="font-medium">Tax (8.25%)</span>
							<span className="font-semibold">${tax.toFixed(2)}</span>
						</div>
						<div className="flex items-center justify-between mb-4">
							<span className="font-medium">Total</span>
							<span className="font-semibold">${totalWithTax.toFixed(2)}</span>
						</div>
						<div className="flex items-center justify-between mb-4">
						{/* <span className="font-medium">Use Pearls?</span>
						<button className="px-4 py-2 bg-[#D3191C] text-white rounded-xl cursor-pointer hover:brightness-110 active:scale-[0.98] transition">Redeem</button> */}
					</div>
					</div>
					<button
						className={`w-full py-4 text-white text-lg rounded-xl ${cartItems.length === 0 || submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#D3191C] cursor-pointer hover:brightness-110 active:scale-[0.98]'} transition`}
						onClick={handleCharge}
						disabled={cartItems.length === 0 || submitting}
					>
						{submitting ? 'Charging…' : `Charge $${totalWithTax.toFixed(2)}`}
					</button>
				</div>
			</div>

			{modalOpen && selectedItem && (
				<CashierPopup
					onClose={() => setModalOpen(false)}
					onAdd={(selection) => {
						const toppings_total = selection.toppings_total ?? 0;
						const unitPrice = Number(selectedItem.price) + Number(toppings_total);
						setCartItems((prev) => {
							const matchIndex = prev.findIndex((c) => c.menu_item_id === selectedItem.id && JSON.stringify(c.selections) === JSON.stringify(selection));
							if (matchIndex !== -1) {
								const next = [...prev];
								next[matchIndex] = { ...next[matchIndex], quantity: next[matchIndex].quantity + 1 };
								return next;
							}
							return [
								...prev,
								{
									id: Date.now(),
									menu_item_id: selectedItem.id,
									name: selectedItem.name,
									price: unitPrice,
									quantity: 1,
									selections: selection,
								},
							];
						});
						setModalOpen(false);
					}}
				/>
				)}

			{editDrinkOpen && editingDrink && (
				<EditDrinkPopup
					onClose={() => { setEditDrinkOpen(false); setEditingDrink(null); }}
					onUpdated={() => {
						(async () => {
							try {
								const results = await Promise.all(
									CATEGORIES.map(async (cat) => {
										const resp = await fetch(`${API_BASE}/api/db/menu_items_by_category?category=${encodeURIComponent(cat)}`);
										if (!resp.ok) throw new Error(`Failed ${cat}: ${resp.status}`);
										const data = await resp.json();
										return (data.items || []).map((d: any) => ({
											id: d.id,
											name: d.name,
											price: d.price,
											category: d.category,
											img_name: d.img_name,
											description: d.description,
										}));
									})
								);
								setItems(results.flat());
							} catch (e:any) {
								console.error('Reload failed', e);
							}
						})();
					}}
					categories={CATEGORIES}
					apiBase={API_BASE}
					item={editingDrink}
				/>
			)}

			{addDrinkOpen && (
				<AddDrinkPopup
					onClose={() => setAddDrinkOpen(false)}
					onCreated={() => {
						(async () => {
							try {
								const results = await Promise.all(
									CATEGORIES.map(async (cat) => {
										const resp = await fetch(`${API_BASE}/api/db/menu_items_by_category?category=${encodeURIComponent(cat)}`);
										if (!resp.ok) throw new Error(`Failed ${cat}: ${resp.status}`);
										const data = await resp.json();
										return (data.items || []).map((d: any) => ({
											id: d.id,
											name: d.name,
											price: d.price,
											category: d.category,
											img_name: d.img_name,
										}));
									})
								);
								setItems(results.flat());
							} catch (e:any) {
								console.error('Reload failed', e);
							}
						})();
					}}
					categories={CATEGORIES}
					apiBase={API_BASE}
				/>
			)}
		</>
	);
}