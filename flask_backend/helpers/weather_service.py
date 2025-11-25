import requests

with open("weather_api_key.txt") as f:
    API_KEY = f.read().strip()

def get_current_temperature(latitude, longitude):
    url = f"http://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={API_KEY}&units=imperial"
    response = requests.get(url)

    if response.status_code != 200:
        print(f"Error fetching weather data: {response.status_code}")
        return None
    
    data = response.json()

    try:
        temp = data["main"]["temp"]
        return temp
    except KeyError:
        print("Temperature data not found in response.")
        return None