// initialize variable and elements of DOM in first
const citySelector = document.getElementById("citySelector");
const forecastContainer = document.getElementById("forecastContainer");
const timeDisplay = document.getElementById("timeDisplay");
const searchInput = document.getElementById('searchInput');
const suggestionsBox = document.getElementById('suggestions');
let currentTimeZone = null;
let allCities = [];


// we upload CSV file and convert it in JSON with library Papaparse
fetch('city_coordinates.csv')
  .then(response => response.text())
  .then(csvText => {
    const parsed = Papa.parse(csvText, {
      header: true, // considere first line of CSV line like table fields
      skipEmptyLines: true // to ignore empty lines
    });

    const cities = parsed.data;
    citySelector.innerHTML = "";

    cities.forEach(city => {
      const option = document.createElement("option");
      option.value = `${city.Longitude},${city.Latitude},${city.Fuseau}`;
      option.textContent = city.Nom;
      citySelector.appendChild(option);
    });

    // display weather of first element of the list
    fetchForecast();
  });

citySelector.addEventListener("change", fetchForecast); // for display info of city selected

function fetchForecast() { // for display weather send by API 7Timer
  const [lon, lat, timezone] = citySelector.value.split(",");
  currentTimeZone = timezone;

  const url = `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civillight&output=json`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      forecastContainer.innerHTML = "";
      const dailyData = data.dataseries;

      for (let i = 0; i < 7; i++) {
        const day = dailyData[i];
        const date = new Date();
        date.setDate(date.getDate() + i);

        forecastContainer.innerHTML += `
          <div class="card">
            <div><strong>${date.toDateString().slice(0, 10)}</strong></div>
            <img src="${getIcon(day.weather)}" alt="${day.weather}" />
            <div>${day.weather.toUpperCase()}</div>
            <div>High: ${day.temp2m?.max ?? '-'}°C</div>
            <div>Low: ${day.temp2m?.min ?? '-'}°C</div>
          </div>
        `;
      }
    });

  updateTimeDisplay();
}

function fetchForecastFromCoords(lon, lat, timezone = "UTC", label = "Votre position") { // same objective of fetchForecast but give weather relative of my position
  currentTimeZone = timezone;

  const url = `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civillight&output=json`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      forecastContainer.innerHTML = "";
      const dailyData = data.dataseries;

      for (let i = 0; i < 7; i++) {
        const day = dailyData[i];
        const date = new Date();
        date.setDate(date.getDate() + i);

        forecastContainer.innerHTML += `
          <div class="card">
            <div><strong>${label} - ${date.toDateString().slice(0, 10)}</strong></div>
            <img src="${getIcon(day.weather)}" alt="${day.weather}" />
            <div>${day.weather.toUpperCase()}</div>
            <div>High: ${day.temp2m?.max ?? '-'}°C</div>
            <div>Low: ${day.temp2m?.min ?? '-'}°C</div>
          </div>
        `;
      }

      updateTimeDisplay();
    });
}


function updateTimeDisplay() {
  if (!currentTimeZone) return;

  const date = new Date().toLocaleString('fr-FR', {
    timeZone: currentTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  timeDisplay.textContent = ` ${date}`;
  setTimeout(updateTimeDisplay, 1000);
}

function getIcon(condition) {
  return `./images/${condition}.png`;
}

async function populateCitiesFromCSV() {
  const response = await fetch('city_coordinates.csv');
  const text = await response.text();

  const lines = text.trim().split('\n');
  allCities = lines.map(line => {
    const [nom, lon, lat, fuseau] = line.split(',');
    return {
      name: nom.trim(),
      value: `${lon.trim()},${lat.trim()},${fuseau.trim()}`
    };
  });
}

const geoButton = document.getElementById('geoButton');

geoButton.addEventListener('click', () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchForecastFromCoords(lon, lat, "UTC", "Votre position");
      },
      error => {
        alert("La géolocalisation a échoué ou a été refusée.");
      }
    );
  } else {
    alert("La géolocalisation n’est pas disponible sur ce navigateur.");
  }
});


populateCitiesFromCSV();

// display suggestion of city
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  suggestionsBox.innerHTML = '';
  if (query.length === 0) {
    suggestionsBox.style.display = 'none';
    return;
  }

  const matches = allCities.filter(city => city.name.toLowerCase().includes(query));
  matches.forEach(city => {
    const div = document.createElement('div');
    div.textContent = city.name;
    div.dataset.value = city.value;
    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = matches.length > 0 ? 'block' : 'none';
});

// When user click on suggestion
suggestionsBox.addEventListener('click', (e) => {
  if (e.target && e.target.dataset.value) {
    const selectedName = e.target.textContent;
    const selectedValue = e.target.dataset.value;

    // update Input and Select
    searchInput.value = selectedName;
    const option = document.createElement('option');
    option.value = selectedValue;
    option.textContent = selectedName;
    citySelector.innerHTML = '';
    citySelector.appendChild(option);
    citySelector.value = selectedValue;

    suggestionsBox.style.display = 'none';

    // Call main function
    fetchForecast();
  }
});