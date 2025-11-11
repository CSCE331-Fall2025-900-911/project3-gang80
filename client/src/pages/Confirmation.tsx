import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Order {
    id: number;
    customer_id: number | null;
    employee_id: number;
    timestamp: string;
    total_price: number;
    pearls_earned: number | null;
    payment_method: string;
}

export default function Confirmation() {
    const navigate = useNavigate();
    const [latestOrderNumber, setLatestOrderNumber] = useState<number | null>(null);
    const API_URL = "https://project3-gang80.onrender.com"; // change to deployed URL in production

    useEffect(() => {
    async function fetchOrders() {
        try {
        const resp = await fetch(`${API_URL}/api/db/orders`);
        if (!resp.ok) {
            console.error("Failed to fetch orders", resp.status);
            return;
        }
        const data: { orders: Order[] } = await resp.json();

        if (data.orders.length === 0) return;

        const latestOrder = data.orders.reduce((prev, curr) =>
            curr.timestamp > prev.timestamp ? curr : prev
        );

        setLatestOrderNumber(latestOrder.id);
        } catch (err) {
        console.error("Error fetching orders", err);
        }
    }

    fetchOrders();
    }, []);

    return (
        <div className="absolute top-0 w-[calc(100%-250px)] h-screen flex flex-col items-center justify-center text-center gap-6">
            <h1 className="text-3xl font-bold">Order confirmed!</h1>
            <h2 className="text-xl">Order Number: {latestOrderNumber ?? "Loading..."}</h2>
            <button
                className="px-6 py-3 bg-white text-black rounded-lg hover:bg-[#D3191C] hover:text-white transition-colors shadow-lg border border-black"
                onClick={() => navigate("/kiosk")}
            >
                Order More
            </button>
        </div>
    );
}
