const button = document.getElementById("getLocationBtn");
const output = document.getElementById("output");

const API_KEY = "f2606f929b628e4a115736f3765473ca";

button.addEventListener("click", () => {
  output.textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=imperial`;

      /* === API FETCH LOGS ONLY === */
      console.log("FETCH →", url);

      try {
        const response = await fetch(url);

        console.log("FETCH RESPONSE →", {
          status: response.status,
          ok: response.ok,
        });

        const data = await response.json();
        console.log("FETCH DATA →", data);

        const city = data.name;
        const temp = data.main.temp;
        const description = data.weather[0].description;

        output.innerHTML = `
                    <strong>${city}</strong><br>
                    Temperature: ${temp}°F<br>
                    Weather: ${description}
                `;
      } catch (error) {
        console.log("FETCH ERROR →", error);
        output.textContent = "Failed to fetch weather data.";
      }
    },
    () => {
      output.textContent = "Unable to retrieve location.";
    }
  );
});
