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
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
  "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
  "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
  "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
  "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
  "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
  "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
  "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
  "Wisconsin": "WI", "Wyoming": "WY"
};

// -------------------- LOCAL STORAGE --------------------
const getLocalStorage = () => {
  const value = localStorage.getItem("favorites");
  return value ? JSON.parse(value) : [];
};

const saveToStorage = (cityState) => {
  let list = getLocalStorage();
  if (!list.includes(cityState)) {
    if (list.length >= 3) list.shift(); // Limit to 3 favorites
    list.push(cityState);
  }
  localStorage.setItem("favorites", JSON.stringify(list));
};

const removeFromStorage = (cityState) => {
  let list = getLocalStorage();
  list = list.filter(item => item !== cityState);
  localStorage.setItem("favorites", JSON.stringify(list));
};

// -------------------- FAVORITES UI --------------------
function displayFavorites() {
  favoritesList.innerHTML = "<strong>Favorites:</strong><br>";
  const favorites = getLocalStorage();
  favorites.forEach(cityState => {
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
    favoriteBtn.src = "/assets/star-outline-2-removebg-filled.png"; // filled star image
    favoriteBtn.classList.add("filled");
  } else {
    favoriteBtn.src = "/assets/star-outline-2-removebg-preview.png"; // outline image
    favoriteBtn.classList.remove("filled");
  }
}

// -------------------- WEATHER FUNCTIONS --------------------
function formatCityState(city, stateOrCountry) {
  if (STATE_ABBREVIATIONS[stateOrCountry]) {
    return `${city}, ${STATE_ABBREVIATIONS[stateOrCountry]}`;
  }
  return `${city}, ${stateOrCountry}`;
}

function updateCurrentWeather(data) {
  currentCity.textContent = formatCityState(data.name, data.sys.state || data.sys.country);
  currentTemp.textContent = `${Math.round(data.main.temp)} °F`;

  highTempBox.textContent = `${Math.round(data.main.temp_max)} °F`;
  lowTempBox.textContent = `${Math.round(data.main.temp_min)} °F`;
  windBox.textContent = `${Math.round(data.wind.speed)} mph`;
  humidityBox.textContent = `${data.main.humidity}%`;

  updateStarButton(); // Update star whenever weather changes
}

// -------------------- FETCH WEATHER --------------------
async function fetchWeatherByCity(city) {
  if (!city) return;
  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();
    if (!geoData.length) return alert("City not found");

    const { lat, lon, name, state } = geoData[0];
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    weatherData.sys.state = state; // Add state for formatting
    updateCurrentWeather(weatherData);
    fetch5DayForecast(lat, lon);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;
    const response = await fetch(url);
    const data = await response.json();

    updateCurrentWeather(data);
    cityInput.value = data.name;

    fetch5DayForecast(lat, lon);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

async function fetch5DayForecast(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;
    const response = await fetch(url);
    const data = await response.json();

    const dailyTemps = {};
    data.list.forEach(entry => {
      const date = entry.dt_txt.split(" ")[0];
      if (!dailyTemps[date]) {
        dailyTemps[date] = { min: entry.main.temp_min, max: entry.main.temp_max };
      } else {
        dailyTemps[date].min = Math.min(dailyTemps[date].min, entry.main.temp_min);
        dailyTemps[date].max = Math.max(dailyTemps[date].max, entry.main.temp_max);
      }
    });

    const days = Object.keys(dailyTemps).slice(0, 5);
    const classes = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    days.forEach((day, index) => {
      if (!classes[index]) return;
      document.querySelector(`.forecast-day.${classes[index]} .hi`).textContent =
        `Hi: ${Math.round(dailyTemps[day].max)} °F`;
      document.querySelector(`.forecast-day.${classes[index]} .lo`).textContent =
        `Lo: ${Math.round(dailyTemps[day].min)} °F`;
    });
  } catch (err) {
    console.error("Forecast Error:", err);
  }
}

// -------------------- EVENT LISTENERS --------------------
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    fetchWeatherByCity(cityInput.value.trim());
    cityInput.value = "";
  }
});

favoriteBtn.addEventListener("click", () => {
  const cityState = currentCity.textContent;
  if (!cityState) return;

  if (isFavorited(cityState)) {
    removeFromStorage(cityState);
  } else {
    saveToStorage(cityState);
  }

  displayFavorites();
  updateStarButton();
});

// -------------------- GEOLOCATION --------------------
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
    () => console.log("Geolocation denied")
  );
}

// -------------------- INITIALIZATION --------------------
displayFavorites();
