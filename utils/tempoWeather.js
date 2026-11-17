// Weather helpers are display-only and never persist coordinates or mutate Tempo records.
export function weatherDescription(code) {
  const n = Number(code);
  if (n === 0) return { icon: "☀️", label: "Clear sky" };
  if (n === 1 || n === 2) return { icon: "🌤️", label: "Partly cloudy" };
  if (n === 3) return { icon: "☁️", label: "Overcast" };
  if (n === 45 || n === 48) return { icon: "🌫️", label: "Fog" };
  if ([51, 53, 55, 56, 57].includes(n)) return { icon: "🌦️", label: "Drizzle" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(n)) return { icon: "🌧️", label: "Rain" };
  if ([71, 73, 75, 77, 85, 86].includes(n)) return { icon: "🌨️", label: "Snow" };
  if ([95, 96, 99].includes(n)) return { icon: "⛈️", label: "Thunderstorm" };
  return { icon: "🌤️", label: "Weather" };
}

export function weatherForecastUrl(latitude, longitude) {
  const lat = Number(latitude), lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error("Invalid weather location");
  }
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  // Coarse coordinates are sufficient for weather; do not send exact GPS precision.
  url.searchParams.set("latitude", lat.toFixed(2));
  url.searchParams.set("longitude", lon.toFixed(2));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "1");
  return url.toString();
}

export function weatherCityUrl(city) {
  const query = String(city || "").trim();
  if (query.length < 2 || query.length > 80) throw new Error("Enter a city name (2–80 characters)");
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  return url.toString();
}

export function parseCurrentWeather(payload) {
  const temp = Number(payload?.current?.temperature_2m);
  const code = Number(payload?.current?.weather_code);
  if (!Number.isFinite(temp) || !Number.isFinite(code) || temp < -100 || temp > 70) {
    throw new Error("Weather temporarily unavailable");
  }
  return { temperature: Math.round(temp), ...weatherDescription(code) };
}
