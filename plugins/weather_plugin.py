"""Example weather plugin for Jarvis Assistant."""

def get_weather() -> str:
    """Fetch the current weather mock data."""
    # In a real production plugin, you would use an HTTP client to query a weather API 
    # like OpenWeatherMap or WeatherAPI using your developer token!
    current_degrees = 72
    conditions = "sunny"
    return f"The weather is currently {current_degrees} degrees and {conditions}."

def register() -> dict:
    """Register weather commands to the plugin loader."""
    return {
        "what is the weather": get_weather,
        "check the weather": get_weather,
        "how is the weather": get_weather
    }
