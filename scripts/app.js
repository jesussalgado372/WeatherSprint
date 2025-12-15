const button = document.getElementById("getLocationBtn");
const output = document.getElementById("output");

const API_KEY = "f2606f929b628e4a115736f3765473ca";

button.addEventListener("click", () => {
  output.textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(async (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    console.log("Geolocation success");
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
    console.log("Fetching weather from URL:");
    console.log(url);

    try {
      const response = await fetch(url);
      console.log("Fetch response object:", response);

      if (!response.ok) {
        console.error("API responded with error:", response.status);
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log("Weather API JSON data:", data);

      const city = data.name;
      const temp = data.main.temp;
      const description = data.weather[0].description;

      output.innerHTML = `
                     <strong>${city}</strong><br>
                     Temperature: ${temp}°C<br>
                     Weather: ${description}
                `;
    } catch (error) {
      console.error(" Fetch failed:", error);
      output.textContent = "Failed to fetch weather data.";
    }
  });
});
