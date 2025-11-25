import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContrastMode } from "../contexts/ContrastModeContext";
import { useMagnifyMode } from "../contexts/MagnifyModeContext";
import { useMagnifier } from "../hooks/useMagnifier";
import { MagnifierLens } from "../components/MagnifierLens";
import { makeApiCall } from "../globals";
import "../css/Confirmation.css";

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
    const { highContrast } = useContrastMode();
    const { magnifyMode, useLens } = useMagnifyMode();
    const { lensPos, lensText, lensImageSrc, lensImageAlt, handleMouseMove } = useMagnifier();
    const navigate = useNavigate();
    const [latestOrderNumber, setLatestOrderNumber] = useState<number | null>(null);


    useEffect(() => {
    async function fetchOrders() {
        try {
            const data = (await makeApiCall("/api/db/orders", "GET", null)) as
                | { orders: Order[] }
                | undefined;

            if (!data || !data.orders || data.orders.length === 0) return;

            // Find newest order by timestamp
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
        <div className={`confirmation-page absolute top-0 w-[calc(100%-250px)] h-screen flex flex-col items-center justify-center text-center gap-6 ${highContrast ? "high-contrast" : ""} ${magnifyMode ? 'magnify' : ''}`} onMouseMove={(e) => handleMouseMove(e, magnifyMode)}>
            <h1 className="text-3xl font-bold">Order confirmed!</h1>
            <h2 className="text-xl">Order Number: {latestOrderNumber ?? "Loading..."}</h2>
            <button
                className="px-6 py-3 bg-white text-black rounded-lg hover:bg-[#D3191C] hover:text-white transition-colors shadow-lg border border-black"
                onClick={() => navigate("/kiosk")}
            >
                Order More
            </button>
            <MagnifierLens 
                lensPos={lensPos}
                lensText={lensText}
                lensImageSrc={lensImageSrc}
                lensImageAlt={lensImageAlt}
                magnifyMode={magnifyMode}
                useLens={useLens}
            />
        </div>
    );
}
