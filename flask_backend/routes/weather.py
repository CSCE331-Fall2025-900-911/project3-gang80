from helpers.weather_service import get_current_temperature
from flask import Blueprint, request, jsonify

weather_bp = Blueprint('weather', __name__)

@weather_bp.route("/api/weather")
def weather():
    # cstat coordinates
    LAT = 30.628
    LONG = -96.3344

    temp = get_current_temperature(LAT, LONG)

    if temp is None:
        return jsonify({"error": "Could not fetch temperature"}), 500
    
    return jsonify({"temperature": temp})