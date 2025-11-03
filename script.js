let getUserLocation = function (callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      callback(lat, lon);
    });
  }
};

let map; // Déclaration globale pour la carte
let marker; // Déclaration du marqueur

const initMap = function (lat, lon) {
  // Vérifie si la carte existe déjà, si oui, on la supprime
  if (map) {
    map.remove(); // Supprime l'ancienne carte
  }

  // Création de la nouvelle carte centrée sur les coordonnées fournies
  map = L.map("map").setView([lat, lon], 12);

  // Ajout des tuiles OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Ajout d’un marqueur
  marker = L.marker([lat, lon]).addTo(map);
};

const displayMeteo = function (data) {
  const html = `
    <h1>${data.name}</h1>
    <h2>${ new Intl.DateTimeFormat(navigator.language, {hour:"numeric", minute: "numeric", day:"2-digit", month:"2-digit", year:"numeric"}).format(new Date())}</h2>
    <div id="temperature">${Math.round(data.main.temp - 273.15)} C°</div>
    <div id="description">${data.weather[0].description}</div>
    <div id="humidity">${data.main.humidity}% humidity</div>
    <div id="wind-speed">${data.wind.speed} Km/h</div>
    <div id="map"></div>
  `;

  const container = document.getElementById("weather-container");
  container.innerHTML = html; // Remplace le contenu au lieu d'empiler

  // Mise à jour de la carte avec les nouvelles coordonnées
  initMap(data.coord.lat, data.coord.lon);
};

const meteo = function (lat, lon, key_meteo) {
  document.getElementById("weather-container").innerHTML =
    "<h2>Loading...</h2>";

  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key_meteo}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Impossible de récupérer les données météo");
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      displayMeteo(data);
    })
    .catch((err) => {
      document.getElementById(
        "weather-container"
      ).innerHTML = `<h2>Erreur: ${err.message}</h2>`;
    });
};

const coordGPS = function (city, key_location) {
  document.getElementById("weather-container").innerHTML =
    "<h2>Loading...</h2>";

  fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${city}&key=${key_location}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Ville introuvable");
      }
      return response.json();
    })
    .then((data) => {
      if (data.results.length === 0) {
        throw new Error("Ville non reconnue");
      }
      console.log(data);
      meteo(
        data.results[0].geometry.lat,
        data.results[0].geometry.lng,
        API_KEYS.openweathermap
      );
    })
    .catch((err) => {
      document.getElementById(
        "weather-container"
      ).innerHTML = `<h2>Erreur: ${err.message}</h2>`;
    })
    .finally(() => {
      document.querySelector(".location").value = "";
    });
};

const performSearch = function () {
  const cityUser = document.querySelector(".location").value;
  if (cityUser.trim() === "") {
    document.getElementById("weather-container").innerHTML =
      "<h2>Veuillez entrer un nom de ville</h2>";
    return;
  }

  coordGPS(cityUser, API_KEYS.opencagedata);
};

document.querySelector(".send_location").addEventListener("click", performSearch);

document.querySelector(".location").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    performSearch();
  }
});
