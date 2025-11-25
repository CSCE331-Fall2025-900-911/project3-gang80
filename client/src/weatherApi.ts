export async function fetchTemperature(): Promise<number> {
    const response = await fetch("https://project3-gang80.onrender.com/api/weather");

    if (!response.ok) {
        throw new Error("Failed to fetch temperature");
    }

    const data = await response.json();

    return data.temperature;  // number
}