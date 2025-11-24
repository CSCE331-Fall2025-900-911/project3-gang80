import { useEffect, useState } from "react";
import { fetchTemperature } from "../weatherApi";

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
        <div>
            <h2>Current Temperature</h2>
            <p>{temperature}°F</p>
        </div>
    );
}
