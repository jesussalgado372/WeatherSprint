import API_KEY from "./environment.js";

// -------------------- DOM ELEMENTS --------------------
const cityInput = document.getElementById("cityInput");
const currentCity = document.getElementById("currentCity");
const currentTemp = document.getElementById("currentTemp");

const highTempBox = document.getElementById("highTempBox");
const lowTempBox = document.getElementById("lowTempBox");
const windBox = document.getElementById("windBox");
const humidityBox = document.getElementById("humidityBox");

const favoriteBtn = document.getElementById("favoriteBtn");
const favoritesList = document.getElementById("favoritesList");

// -------------------- STATE ABBREVIATIONS --------------------
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

// -------------------- LOCAL STORAGE --------------------
const getLocalStorage = () => {
  const value = localStorage.getItem("favorites");
  return value ? JSON.parse(value) : [];
};

const saveToStorage = (cityState) => {
  let list = getLocalStorage();
  if (!list.includes(cityState)) {
    if (list.length >= 3) list.shift();
    list.push(cityState);
  }
  localStorage.setItem("favorites", JSON.stringify(list));
};

const removeFromStorage = (cityState) => {
  const list = getLocalStorage().filter((item) => item !== cityState);
  localStorage.setItem("favorites", JSON.stringify(list));
};

// -------------------- FAVORITES UI --------------------
function displayFavorites() {
  favoritesList.innerHTML = "<strong>Favorites:</strong><br>";
  getLocalStorage().forEach((cityState) => {
    const div = document.createElement("div");
    div.textContent = cityState;
    favoritesList.appendChild(div);
  });
}

function isFavorited(cityState) {
  return getLocalStorage().includes(cityState);
}

function updateStarButton() {
  const cityState = currentCity.textContent;
  if (!cityState) return;

  if (isFavorited(cityState)) {
    favoriteBtn.src = "/assets/star-outline-2-removebg-filled.png";
    favoriteBtn.classList.add("filled");
  } else {
    favoriteBtn.src = "/assets/star-outline-2-removebg-preview.png";
    favoriteBtn.classList.remove("filled");
  }
}

// -------------------- HELPERS --------------------
function formatCityState(city, stateOrCountry) {
  if (STATE_ABBREVIATIONS[stateOrCountry]) {
    return `${city}, ${STATE_ABBREVIATIONS[stateOrCountry]}`;
  }
  return `${city}, ${stateOrCountry}`;
}

function getNextFiveDays() {
  const days = [];
  const today = new Date();

  for (let i = 1; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }

  return days;
}

// -------------------- CURRENT WEATHER --------------------
function updateCurrentWeather(data) {
  currentCity.textContent = formatCityState(
    data.name,
    data.sys.state || data.sys.country
  );

  currentTemp.textContent = `${Math.round(data.main.temp)} °F`;
  highTempBox.textContent = `${Math.round(data.main.temp_max)} °F`;
  lowTempBox.textContent = `${Math.round(data.main.temp_min)} °F`;
  windBox.textContent = `${Math.round(data.wind.speed)} mph`;
  humidityBox.textContent = `${data.main.humidity}%`;

  updateStarButton();
}

// -------------------- FETCH WEATHER --------------------
async function fetchWeatherByCity(city) {
  if (!city) return;

  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
      city
    )}&limit=1&appid=${API_KEY}`;

    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.length) return alert("City not found");

    const { lat, lon, state } = geoData[0];

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    weatherData.sys.state = state;
    updateCurrentWeather(weatherData);
    fetch5DayForecast(lat, lon);
  } catch (err) {
    console.error(err);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;
    const res = await fetch(url);
    const data = await res.json();

    updateCurrentWeather(data);
    cityInput.value = data.name;
    fetch5DayForecast(lat, lon);
  } catch (err) {
    console.error(err);
  }
}

// -------------------- 5 DAY FORECAST --------------------
async function fetch5DayForecast(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;
    const res = await fetch(url);
    const data = await res.json();

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

    const nextDays = getNextFiveDays();
    const dayClasses = ["monday", "tuesday", "wednesday", "thursday", "friday"];

    nextDays.forEach((dateObj, index) => {
      const dateKey = dateObj.toISOString().split("T")[0];
      const forecast = dailyTemps[dateKey];
      if (!forecast) return;

      const dayName = dateObj.toLocaleDateString("en-US", {
        weekday: "long",
      });

      const container = document.querySelector(
        `.forecast-day.${dayClasses[index]}`
      );

      container.querySelector(".day-name").textContent = dayName;
      container.querySelector(".hi").textContent = `Hi: ${Math.round(
        forecast.max
      )} °F`;
      container.querySelector(".lo").textContent = `Lo: ${Math.round(
        forecast.min
      )} °F`;
    });
  } catch (err) {
    console.error(err);
  }
}

// -------------------- EVENTS --------------------
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    fetchWeatherByCity(cityInput.value.trim());
    cityInput.value = "";
  }
});

favoriteBtn.addEventListener("click", () => {
  const cityState = currentCity.textContent;
  if (!cityState) return;

  isFavorited(cityState)
    ? removeFromStorage(cityState)
    : saveToStorage(cityState);

  displayFavorites();
  updateStarButton();
});

// -------------------- INIT --------------------
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
    () => console.log("Geolocation denied")
  );
}

displayFavorites();
