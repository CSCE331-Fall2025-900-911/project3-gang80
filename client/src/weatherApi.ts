export async function fetchTemperature(): Promise<number> {
    const response = await fetch("http://localhost:5000/api/weather");

    if (!response.ok) {
        throw new Error("Failed to fetch temperature");
    }

    const data = await response.json();

    return data.temperature;  // number
}