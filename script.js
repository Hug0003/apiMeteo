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
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Ajout d’un marqueur
  marker = L.marker([lat, lon]).addTo(map);
};

// Les réponses des API sont insérées en texte, jamais en HTML (pas d'injection possible).
const el = function (tag, attrs, text) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, value));
  if (text !== undefined) node.textContent = text;
  return node;
};

const showStatus = function (text) {
  document.getElementById("weather-container").replaceChildren(el("h2", {}, text));
};

const displayMeteo = function (data) {
  // L'icône vient d'OpenWeatherMap : on n'accepte qu'un code du type « 04d ».
  const icon = /^\d{2}[dn]$/.test(data.weather[0].icon) ? data.weather[0].icon : "01d";
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  const date = new Intl.DateTimeFormat(navigator.language, {hour:"numeric", minute: "numeric", day:"2-digit", month:"2-digit", year:"numeric"}).format(new Date());

  const iconContainer = el("div", { id: "weather-icon-container" });
  iconContainer.append(el("img", { src: iconUrl, alt: data.weather[0].description, id: "weather-icon" }));

  document.getElementById("weather-container").replaceChildren(
    el("h1", {}, data.name),
    el("h2", {}, date),
    iconContainer,
    el("div", { id: "temperature" }, `${Math.round(data.main.temp - 273.15)}°C`),
    el("div", { id: "description" }, data.weather[0].description),
    el("div", { id: "humidity" }, `💧 ${data.main.humidity}% humidité`),
    el("div", { id: "wind-speed" }, `💨 ${data.wind.speed} Km/h`),
    el("div", { id: "map" })
  );

  initMap(data.coord.lat, data.coord.lon);
};

// Les clés d'API restent sur le serveur : Nginx relaie api/weather et api/geocode
// en y ajoutant la clé (voir docker/nginx.conf.template). Chemins relatifs pour
// fonctionner sous hugomeuriel.fr/projets/sunorcloud/.
const meteo = function (lat, lon) {
  showStatus("Loading...");

  fetch(`api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`)
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
      showStatus(`Erreur: ${err.message}`);
    });
};

const coordGPS = function (city) {
  showStatus("Loading...");

  fetch(`api/geocode?q=${encodeURIComponent(city)}`)
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
      meteo(data.results[0].geometry.lat, data.results[0].geometry.lng);
    })
    .catch((err) => {
      showStatus(`Erreur: ${err.message}`);
    })
    .finally(() => {
      document.querySelector(".location").value = "";
    });
};

const performSearch = function () {
  const cityUser = document.querySelector(".location").value;
  if (cityUser.trim() === "") {
    showStatus("Veuillez entrer un nom de ville");
    return;
  }

  coordGPS(cityUser.trim().slice(0, 100));
};

document.querySelector(".send_location").addEventListener("click", performSearch);

document.querySelector(".location").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    performSearch();
  }
});
