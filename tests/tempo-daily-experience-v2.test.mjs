import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { weatherCityUrl, weatherForecastUrl, weatherDescription, parseCurrentWeather } from "../utils/tempoWeather.js";

const read = path => readFileSync(path, "utf8");

test("Weather URLs use Open-Meteo with coarse coordinates and Celsius", () => {
  const url = new URL(weatherForecastUrl(1.352083, 103.819836));
  assert.equal(url.origin, "https://api.open-meteo.com");
  assert.equal(url.searchParams.get("latitude"), "1.35");
  assert.equal(url.searchParams.get("longitude"), "103.82");
  assert.equal(url.searchParams.get("current"), "temperature_2m,weather_code");
  assert.equal(url.searchParams.get("temperature_unit"), "celsius");
  for (const input of [[91, 0], [1, -181], [Infinity, 0]]) {
    assert.throws(() => weatherForecastUrl(...input), /Invalid weather location/);
  }
  const cityUrl = new URL(weatherCityUrl(" Singapore "));
  assert.equal(cityUrl.origin, "https://geocoding-api.open-meteo.com");
  assert.equal(cityUrl.searchParams.get("name"), "Singapore");
  assert.throws(() => weatherCityUrl(""), /Enter a city name/);
});

test("Weather descriptions safely normalize current conditions without a false temperature", () => {
  assert.deepEqual(weatherDescription(95), { icon: "⛈️", label: "Thunderstorm" });
  assert.deepEqual(weatherDescription(61), { icon: "🌧️", label: "Rain" });
  assert.deepEqual(parseCurrentWeather({ current: { temperature_2m: 27.5, weather_code: 3 } }),
    { temperature: 28, icon: "☁️", label: "Overcast" });
  assert.throws(() => parseCurrentWeather({ current: {} }), /Weather temporarily unavailable/);
});

test("Both Tempo interfaces display weather beneath the same daily affirmation", () => {
  const fullCard = read("components/affirmations/Affirmations.jsx");
  const mini = read("components/mini/MiniTempoPanel.jsx");
  const app = read("components/TempoApp.jsx");
  const weather = read("components/weather/TempoWeather.jsx");
  assert.match(fullCard, /affirmationForDate\(affirmations, TODAY\)/);
  assert.match(fullCard, /<TempoWeather \/>/);
  assert.match(mini, /Core\.affirmationForDate\(affirmations, Core\.TODAY\)/);
  assert.match(mini, /<TempoWeather \/>/);
  assert.match(app, /upcomingEvent=\{miniUpcomingEvent\} affirmations=\{affirmations\}/);
  assert.match(weather, /navigator\.permissions\.query\(\{ name: "geolocation" \}\)/);
  assert.match(weather, /permission\.state === "granted"/);
  assert.match(weather, /getCurrentPosition/);
  assert.match(weather, /Weather city/);
  assert.match(weather, /Weather unavailable/);
  assert.doesNotMatch(weather, /supabase|persistSettings|queueCloudSave|dailyCheckIns/i);
});

test("Mini's three cards collapse independently and persist only presentation preferences", () => {
  const mini = read("components/mini/MiniTempoPanel.jsx");
  const css = read("styles/miniTempoReleaseStyles.js");
  for (const id of ["affirmation", "tasks", "event"]) {
    assert.match(mini, new RegExp('toggleCard\\("'+id+'"\\)'));
    assert.match(mini, new RegExp('aria-expanded=\\{expanded\\.'+id+'\\}'));
  }
  assert.match(mini, /tempo-mini-expanded-cards-v1/);
  assert.match(mini, /miniTaskRows\(tasks, lastCompletedId\)/);
  assert.match(css, /\.mini-collapse-toggle/);
  assert.match(css, /\.tempo-weather-line/);
  assert.doesNotMatch(mini, /onExpense|expense recorder|budget recorder/i);
});

test("Check-in and Rhythm Stats are hidden without dropping historical records or Budget", () => {
  const shell = read("components/layout/AppShell.jsx");
  const today = read("components/today/TodayDashboard.jsx");
  const app = read("components/TempoApp.jsx");
  const sidebar = shell.split('<nav className="sidebar-nav">')[1]?.split("</nav>")[0] || "";
  assert.ok(sidebar.includes("Today") && sidebar.includes("Calendar") &&
    sidebar.includes("Tasks") && sidebar.includes("Settings"));
  for (const retired of [">Main<", ">Personal<", "Rhythm Stats", "onNavigate(\"rhythm\")"]) {
    assert.ok(!sidebar.includes(retired), "Retired sidebar item: " + retired);
  }
  assert.doesNotMatch(shell, /onOpenCheckIn|mood-bar/);
  assert.doesNotMatch(today, /today-checkin-card|onOpenCheckIn|DailyCheckInModal/);
  assert.doesNotMatch(app, /<DailyCheckInModal|<RhythmStatsPage/);
  assert.match(app, /setDailyCheckInsRaw/);
  assert.match(app, /dailyCheckIns: normalizeDailyCheckIns/);
  assert.match(app, /<BudgetApp activePage=\{budgetPage\}/);
  assert.match(app, /onPlanToday=\{\(\) => setDayPlan/);
});
