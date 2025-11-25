import { useEffect, useState } from "react";
import { fetchTemperature } from "../weatherApi";
import "../css/Weather.css";

export default function Weather() {
    const [temperature, setTemperature] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTemperature()
            .then((temp) => setTemperature(temp))
            .catch((err) => setError(err.message));
    }, []);

    if (error) {
        return <p>Error: {error}</p>;
    }

    if (temperature === null) {
        return <p>Loading temperature...</p>;
    }

    return (
        <div className={temperature < 50
        ? "weather-background-cold"
        : temperature < 80
            ? "weather-background-mild"
            : "weather-background-hot"}>
            <h2>{temperature}°F</h2>
        </div>
    );
}
