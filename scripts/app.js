import API_KEY from "./environment.js";

const STATE_ABBREVIATIONS = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

const STATE_ABBREVIATIONS_NORMALIZED = Object.fromEntries(
  Object.entries(STATE_ABBREVIATIONS).map(([state, abbr]) => [
    state.toLowerCase(),
    abbr,
  ])
);

const cityInput = document.getElementById("cityInput");

const currentCity = document.getElementById("currentCity");
const currentTemp = document.getElementById("currentTemp");

const highTempBox = document.getElementById("highTempBox");
const lowTempBox = document.getElementById("lowTempBox");
const windBox = document.getElementById("windBox");
const humidityBox = document.getElementById("humidityBox");

function formatCityState(city, state) {
  if (!state) return city;

  const normalized = state.trim().replace(/\s+/g, " ").toLowerCase();

  const abbr = STATE_ABBREVIATIONS_NORMALIZED[normalized];

  return abbr ? `${city}, ${abbr}` : city;
}

function updateCurrentWeather(data) {
  currentTemp.textContent = `${Math.round(data.main.temp)} °F`;
  highTempBox.textContent = `${Math.round(data.main.temp_max)} °F`;
  lowTempBox.textContent = `${Math.round(data.main.temp_min)} °F`;
  windBox.textContent = `${Math.round(data.wind.speed)} mph`;
  humidityBox.textContent = `${data.main.humidity}%`;
}

async function fetchLocationByCity(city) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    city
  )}&limit=1&appid=${API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.length) {
    alert("City not found");
    return null;
  }

  return data[0];
}

async function fetchWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;

  const response = await fetch(url);
  const data = await response.json();

  updateCurrentWeather(data);
  fetch5DayForecast(lat, lon);
}

async function fetchWeatherByCity(city) {
  if (!city) return;

  const location = await fetchLocationByCity(city);
  if (!location) return;

  const { lat, lon, name, state } = location;

  currentCity.textContent = formatCityState(name, state);
  fetchWeatherByCoords(lat, lon);
}

async function fetch5DayForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const dailyTemps = {};

    data.list.forEach((entry) => {
      const date = entry.dt_txt.split(" ")[0];

      if (!dailyTemps[date]) {
        dailyTemps[date] = {
          min: entry.main.temp_min,
          max: entry.main.temp_max,
        };
      } else {
        dailyTemps[date].min = Math.min(
          dailyTemps[date].min,
          entry.main.temp_min
        );
        dailyTemps[date].max = Math.max(
          dailyTemps[date].max,
          entry.main.temp_max
        );
      }
    });

    const days = Object.keys(dailyTemps).slice(0, 5);
    const classes = ["monday", "tuesday", "wednesday", "thursday", "friday"];

    days.forEach((day, index) => {
      if (!classes[index]) return;

      const hi = Math.round(dailyTemps[day].max);
      const lo = Math.round(dailyTemps[day].min);

      document.querySelector(
        `.forecast-day.${classes[index]} .hi`
      ).textContent = `Hi: ${hi} °F`;

      document.querySelector(
        `.forecast-day.${classes[index]} .lo`
      ).textContent = `Lo: ${lo} °F`;
    });
  } catch (error) {
    console.error("Forecast Error →", error);
  }
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const geoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
      const response = await fetch(geoUrl);
      const [location] = await response.json();

      if (location) {
        currentCity.textContent = formatCityState(
          location.name,
          location.state
        );
      }

      fetchWeatherByCoords(lat, lon);
    },
    () => console.log("Geolocation denied")
  );
}

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    fetchWeatherByCity(cityInput.value.trim());
    cityInput.value = "Search...";
  }
});
