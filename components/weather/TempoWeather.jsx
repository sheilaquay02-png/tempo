"use client";

import { useEffect, useRef, useState } from "react";
import { parseCurrentWeather, weatherCityUrl, weatherForecastUrl } from "../../utils/tempoWeather";

const CITY_STORAGE_KEY = "tempo-weather-manual-city-v1";
const errorMessage = "Weather unavailable. Try your location or enter a city.";

export function TempoWeather() {
  const [weather, setWeather] = useState(null);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const mounted = useRef(false);
  const requestId = useRef(0);

  async function loadForecast(lat, lon, place) {
    const id = ++requestId.current;
    setStatus("loading");
    setError("");
    try {
      const response = await fetch(weatherForecastUrl(lat, lon), {
        signal: AbortSignal.timeout(9000), cache: "no-store",
      });
      if (!response.ok) throw new Error("Weather request failed");
      const current = parseCurrentWeather(await response.json());
      if (!mounted.current || id !== requestId.current) return;
      setWeather(current);
      setLabel(place);
      setStatus("ready");
      setCityOpen(false);
    } catch {
      if (!mounted.current || id !== requestId.current) return;
      setStatus("error");
      setError(errorMessage);
    }
  }

  async function loadCity(city, remember = false) {
    const name = String(city || "").trim();
    if (!name) return;
    const id = ++requestId.current;
    setStatus("loading");
    setError("");
    try {
      const response = await fetch(weatherCityUrl(name), {
        signal: AbortSignal.timeout(9000), cache: "no-store",
      });
      if (!response.ok) throw new Error("City search failed");
      const results = (await response.json()).results;
      if (!Array.isArray(results) || !results.length) throw new Error("City not found");
      const place = results[0];
      if (!mounted.current || id !== requestId.current) return;
      if (remember) {
        try { window.localStorage.setItem(CITY_STORAGE_KEY, name); } catch {}
      }
      await loadForecast(place.latitude, place.longitude,
        [place.name, place.country_code].filter(Boolean).join(", "));
    } catch {
      if (!mounted.current || id !== requestId.current) return;
      setStatus("error");
      setError("City not found or weather unavailable. Try another city.");
      setCityOpen(true);
    }
  }

  function requestDeviceLocation() {
    if (!navigator.geolocation) {
      setError("Device location is unavailable. Enter a city instead.");
      setCityOpen(true);
      return;
    }
    setStatus("loading");
    setError("");
    navigator.geolocation.getCurrentPosition(position => {
      if (!mounted.current) return;
      try { window.localStorage.removeItem(CITY_STORAGE_KEY); } catch {}
      void loadForecast(position.coords.latitude, position.coords.longitude, "Near you");
    }, () => {
      if (!mounted.current) return;
      setStatus("error");
      setError("Location permission is unavailable. Enter a city instead.");
      setCityOpen(true);
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
  }

  useEffect(() => {
    mounted.current = true;
    let savedCity = "";
    try { savedCity = window.localStorage.getItem(CITY_STORAGE_KEY) || ""; } catch {}
    if (savedCity) {
      setCityInput(savedCity);
      void loadCity(savedCity);
    } else if (navigator.permissions?.query) {
      // Never trigger an unexpected location-permission prompt on page load.
      navigator.permissions.query({ name: "geolocation" })
        .then(permission => {
          if (mounted.current && permission.state === "granted") requestDeviceLocation();
        }).catch(() => {});
    }
    return () => { mounted.current = false; requestId.current += 1; };
  }, []);

  return (
    <div className="tempo-weather-line" aria-label="Today's weather">
      <div className="tempo-weather-summary" role="status">
        {weather && status !== "loading" ? (
          <span>{weather.icon} {label} · {weather.temperature}°C · {weather.label}</span>
        ) : status === "loading" ? (
          <span>{"🌤️ Checking today's weather…"}</span>
        ) : (
          <span>{"🌤️ Today's weather"}</span>
        )}
        <button type="button" onClick={requestDeviceLocation} title="Use device location for weather">Use location</button>
        <button type="button" onClick={() => setCityOpen(value => !value)}
          aria-expanded={cityOpen} aria-label="Set weather city">City</button>
      </div>
      {error && <small className="tempo-weather-error">{error}</small>}
      {cityOpen && (
        <form className="tempo-weather-city-form" onSubmit={event => {
          event.preventDefault();
          void loadCity(cityInput, true);
        }}>
          <input type="text" aria-label="Weather city" placeholder="City, e.g. Singapore"
            autoComplete="address-level2" maxLength={80}
            value={cityInput} onChange={event => setCityInput(event.target.value)} />
          <button type="submit" disabled={status === "loading" || cityInput.trim().length < 2}>Show</button>
        </form>
      )}
      {weather && status !== "loading" && <small className="tempo-weather-credit">Open-Meteo</small>}
    </div>
  );
}
