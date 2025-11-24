import { useEffect, useState } from "react";
import DrinkImage from "../components/DrinkImage";
import CashierPopup from "../components/CashierPopup";


export default function Cashier() {
	const [modalOpen, setModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<Array<{ id: number; name: string; price: number; category: string; img_name?: string | null }>>([]);

	// Categories for base drinks; exclude toppings category explicitly.
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


	return (
		<div className="w-full h-screen flex bg-gray-100">
			<div className="flex-1 p-6 overflow-y-auto">
				{loading && <p className="text-center text-sm text-gray-600">Loading menu...</p>}
				{error && <p className="text-center text-red-600">{error}</p>}
				{!loading && !error && (
					<div className="grid grid-cols-6 gap-4">
								{items.map((item) => (
									<button
										key={item.id}
										onClick={() => setModalOpen(true)}
										className="group cursor-pointer bg-[#f3f3f3] border border-[#d0d5dd] rounded-lg min-h-44 w-full flex flex-col items-center px-2 pt-2 pb-3 shadow-sm transition-all duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-600 overflow-hidden"
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
						{items.length === 0 && (
							<div className="col-span-6 text-center text-gray-500 py-12">No menu items found.</div>
						)}
					</div>
				)}
			</div>

			<div className="w-80 bg-white border-l p-6 flex flex-col justify-between">
				<div>
					<div className="h-24 w-full bg-gray-200 rounded mb-6" />
					<div className="flex items-center justify-between mb-4">
						<span className="font-medium">Use Pearls?</span>
						<button className="px-4 py-2 bg-[#D3191C] text-white rounded-xl">Redeem</button>
					</div>
				</div>
				<button className="w-full py-4 bg-[#D3191C] text-white text-lg rounded-xl">
					Charge
				</button>
			</div>

			{modalOpen && (
				<CashierPopup
					onClose={() => setModalOpen(false)}
					onAdd={() => setModalOpen(false)}
				/>
			)}
		</div>
	);
}