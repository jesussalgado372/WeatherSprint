import API_KEY from "./environment.js";

const cityInput = document.getElementById("cityInput");

const currentCity = document.getElementById("currentCity");
const currentTemp = document.getElementById("currentTemp");

const highTempBox = document.getElementById("highTempBox");
const lowTempBox = document.getElementById("lowTempBox");
const windBox = document.getElementById("windBox");
const humidityBox = document.getElementById("humidityBox");

function updateCurrentWeather(data) {
  currentCity.textContent = `${data.name}, ${data.sys.country}`;
  currentTemp.textContent = `${Math.round(data.main.temp)} °F`;

  highTempBox.textContent = `${Math.round(data.main.temp_max)} °F`;
  lowTempBox.textContent = `${Math.round(data.main.temp_min)} °F`;
  windBox.textContent = `${Math.round(data.wind.speed)} mph`;
  humidityBox.textContent = `${data.main.humidity}%`;
}

async function fetchWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;

  const response = await fetch(url);
  const data = await response.json();

  updateCurrentWeather(data);
  cityInput.value = data.name;

  fetch5DayForecast(lat, lon);
}

async function fetchWeatherByCity(city) {
  if (!city) return;

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=imperial`;

  const response = await fetch(url);
  if (!response.ok) {
    alert("City not found");
    return;
  }

  const data = await response.json();
  updateCurrentWeather(data);

  fetch5DayForecast(data.coord.lat, data.coord.lon);
}

async function fetch5DayForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const dailyTemps = {};

    // Group 3-hour data into days
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
    (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
    () => console.log("Geolocation denied")
  );
}

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    fetchWeatherByCity(cityInput.value.trim());
    cityInput.value = "Search...";
  }
});
