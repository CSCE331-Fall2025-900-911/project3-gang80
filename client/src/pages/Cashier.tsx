import { useEffect, useState } from "react";
import DrinkImage from "../components/DrinkImage";
import CashierPopup from "../components/CashierPopup";
import AddDrinkPopup from "../components/AddDrinkPopup";
import EditDrinkPopup from "../components/EditDrinkPopup";
import { useContrastMode } from '../contexts/ContrastModeContext';
import { makeApiCall } from "../globals";


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

	useEffect(() => {
		let cancelled = false;
		async function loadAll() {
			setLoading(true);
			setError(null);
			try {
				const results = await Promise.all(
					CATEGORIES.map(async (cat) => {
						const data = await makeApiCall(`/api/db/menu_items_by_category?category=${encodeURIComponent(cat)}`, "GET", null) as { items: any[] };
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
	const [contact, setContact] = useState("");
	const [contactType, setContactType] = useState<"email"|"phone"|null>(null);
	const [rewards, setRewards] = useState<number | null>(null);
	const [contactUserId, setContactUserId] = useState<number | null>(null);
	const [checkingRewards, setCheckingRewards] = useState(false);
	const [contactLookupError, setContactLookupError] = useState<string | null>(null);
	const [usePearls, setUsePearls] = useState(false);

	// helper: validate contact and fetch rewards
	async function validateAndFetchRewards() {
		const v = contact.trim();
		if (!v) { setRewards(null); setContactType(null); setContactLookupError(null); return; }
		const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const phoneDigits = v.replace(/[^0-9]/g, '');
		let detectedType: "email"|"phone"|null = null;
		if (emailRe.test(v)) {
			detectedType = 'email';
		} else if (phoneDigits.length >= 7 && phoneDigits.length <= 15) {
			detectedType = 'phone';
		} else {
			setContactType(null); setRewards(null); return;
		}
		setContactType(detectedType);
		setContactLookupError(null);
		setCheckingRewards(true);
		try {
			const data = await makeApiCall('/api/db/users', 'GET', null) as { users: any[] };
			const users = data?.users || [];
			let found = null;
			if (detectedType === 'email') {
				found = users.find(u => u.email && u.email.toLowerCase() === v.toLowerCase());
			}
			if (!found && detectedType === 'phone') {
				found = users.find(u => {
					if (!u.phone_number) return false;
					const d = (u.phone_number + '').replace(/[^0-9]/g, '');
					return d === phoneDigits;
				});
			}
			if (found) {
				setRewards(Number(found.rewards) || 0);
				setContactUserId(found.id || null);
				setContactLookupError(null);
			} else {
				setRewards(null);
				setContactUserId(null);
				setContactLookupError('No account found for that email or phone number');
			}
		} catch (e) {
			setRewards(null);
			setContactLookupError('Failed to check rewards');
		} finally {
			setCheckingRewards(false);
		}
	}
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

				const payload: any = {
				customer_id: contactUserId || null,
				employee_id: employeeId,
				payment_method: usePearls ? 'Pearls' : 'Cash',
				pearls_earned: pearlsEarned,
				total_price: totalWithTax, 
				items,
			};
			if (usePearls) {
				payload.pearls_redeemed = Math.ceil(totalWithTax);
				payload.payment_method = 'Pearls';
			}

		await makeApiCall('/api/db/orders/create', 'POST', payload);

		// Successful order; clear cart and customer info
		setCartItems([]);
		setContact('');
		setContactType(null);
		setRewards(null);
		setContactUserId(null);
		setContactLookupError(null);
		setUsePearls(false);
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
									<div key={c.id} className="flex flex-col bg-white/70 rounded px-2 py-2 mb-2">
										<div className="flex items-start justify-between mb-1">
											<div className="text-sm flex-1">
												<div className="font-medium">{c.name}</div>
												{selectionParts.length > 0 && (
													<div className="text-[11px] text-gray-700">{selectionParts.join(' · ')}</div>
												)}
											</div>
											<button
												aria-label="Remove item"
												className="w-6 h-6 leading-none flex items-center justify-center border border-gray-300 rounded text-red-600 bg-white hover:bg-gray-50 transition cursor-pointer ml-2"
												onClick={() => setCartItems((prev) => prev.filter((p) => p.id !== c.id))}
											>
												x
											</button>
										</div>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-1 border border-gray-300 rounded px-2 py-0.5">
												<button
													onClick={() => setCartItems((prev) => prev.map((item) => item.id === c.id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))}
													className="text-sm font-bold px-1 hover:bg-gray-100 rounded transition cursor-pointer"
												>
													−
												</button>
												<span className="text-sm font-semibold min-w-[1.5rem] text-center">{c.quantity}</span>
												<button
													onClick={() => setCartItems((prev) => prev.map((item) => item.id === c.id ? { ...item, quantity: Math.min(20, item.quantity + 1) } : item))}
													className="text-sm font-bold px-1 hover:bg-gray-100 rounded transition cursor-pointer"
												>
													+
												</button>
											</div>
											<div className="text-sm font-semibold">${(c.price * c.quantity).toFixed(2)}</div>
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
						{/* Rewards */}
						<div className="mb-4">
							<label className="block text-sm font-medium mb-1">Rewards (optional)</label>
							<input
								className="w-full px-3 py-2 border rounded"
								placeholder="you@example.com or 555-123-4567"
								value={contact}
								onChange={(e) => { setContact(e.target.value); setUsePearls(false); }}
								onBlur={async () => { await validateAndFetchRewards(); }}
								onKeyDown={async (e) => { if (e.key === 'Enter') { e.preventDefault(); await validateAndFetchRewards(); } }}
							/>
								<div className="mt-2 text-sm">
									{checkingRewards ? (
										<span>Checking rewards…</span>
									) : contactLookupError ? (
										<span className="text-sm text-red-600">{contactLookupError}</span>
									) : rewards === null ? (
										<span className="text-gray-600">Enter email or phone to check rewards</span>
									) : (
										<span>Rewards: <strong>{rewards}</strong> pearls</span>
									)}
								</div>
							{/* Invalid customer info */}
							{contact.trim() !== '' && contactType === null && !checkingRewards && (
								<div className="text-sm text-red-600 mt-2">Invalid email or phone number</div>
							)}
						{contactType !== null && rewards !== null && (
							<div className="mt-3">
								{(() => {
									const required = Math.ceil(totalWithTax);
									const available = typeof rewards === 'number' ? rewards : 0;
									const canCover = available >= required;
									return (
										<>
											<button
												className={`w-full px-4 py-2 rounded-xl text-white transition active:scale-[0.98] ${
													usePearls 
														? 'bg-green-600 hover:brightness-110 cursor-pointer' 
														: canCover 
															? 'bg-[#D3191C] hover:brightness-110 cursor-pointer' 
															: 'bg-gray-400 cursor-not-allowed'
												}`}
												onClick={() => { 
													if (canCover) {
														setUsePearls(!usePearls);
													}
												}}
												disabled={!canCover || checkingRewards}
												aria-disabled={!canCover || checkingRewards}
											>
												{usePearls ? '✓ Pearls Selected' : 'Use Pearls'}
											</button>
											{usePearls && (
												<div className="mt-2 text-sm text-green-700 font-medium">
													✓ {required} pearls will be used when you press Charge
												</div>
											)}
										</>
									);
								})()}
							</div>
						)}
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
					selectedItem={selectedItem}
					onEdit={() => {
						setEditingDrink(selectedItem);
						setEditDrinkOpen(true);
						setModalOpen(false);
					}}
					onAdd={(selection) => {
						const toppings_total = selection.toppings_total ?? 0;
						const unitPrice = Number(selectedItem.price) + Number(toppings_total);
						const addQuantity = selection.quantity ?? 1;
						const { quantity: _, ...selectionWithoutQuantity } = selection;
						setCartItems((prev) => {
							const matchIndex = prev.findIndex((c) => c.menu_item_id === selectedItem.id && JSON.stringify(c.selections) === JSON.stringify(selectionWithoutQuantity));
							if (matchIndex !== -1) {
								const next = [...prev];
								next[matchIndex] = { ...next[matchIndex], quantity: next[matchIndex].quantity + addQuantity };
								return next;
							}
							return [
								...prev,
								{
									id: Date.now(),
									menu_item_id: selectedItem.id,
									name: selectedItem.name,
									price: unitPrice,
									quantity: addQuantity,
									selections: selectionWithoutQuantity,
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
									const data = await makeApiCall(`/api/db/menu_items_by_category?category=${encodeURIComponent(cat)}`, "GET", null) as { items: any[] };
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
									const data = await makeApiCall(`/api/db/menu_items_by_category?category=${encodeURIComponent(cat)}`, "GET", null) as { items: any[] };
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
/>
)}
</>
);
}
