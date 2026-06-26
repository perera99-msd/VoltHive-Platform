import urllib.request
import json

def get_live_weather(lat=6.9271, lon=79.8612):
    """
    Fetches real-time weather from Open-Meteo API (Free, No API Key Required).
    Default coordinates: Colombo, Sri Lanka (VoltHive Network Hub)
    """
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code,precipitation"
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'VoltHive-AI-Microservice/1.0'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            current = data.get('current', {})
            temp_c = current.get('temperature_2m', 30.0)
            code = current.get('weather_code', 0)
            
            # WMO Weather interpretation codes
            condition = "Clear"
            if code in [1, 2, 3]:
                condition = "Cloudy"
            elif code in [45, 48]:
                condition = "Fog"
            elif code in [51, 53, 55, 61, 63, 65, 80, 81, 82]:
                condition = "Rain"
            elif code >= 95:
                condition = "Storm"
                
            return {
                "condition": condition,
                "temperature_c": temp_c,
                "source": "Open-Meteo Free API Feed"
            }
    except Exception as e:
        print(f"⚠️ Weather API Fetch Error: {e}. Falling back to default feed.")
        return {
            "condition": "Clear",
            "temperature_c": 31.0,
            "source": "Simulated Fallback Feed"
        }

if __name__ == "__main__":
    print(get_live_weather())
