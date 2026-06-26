// Visor de Cobertura Municipal - El Maíz es la Raíz
// Versión 7: actualiza directorio de Coordinaciones, agrega Quintana Roo y asigna México a Oficinas Centrales.

const CAMPOS = {
  estado: "ESTADO",
  municipio: "Municipio",
  cobertura: "COB_BIN",
  coordinacion: "COORDINACI"
};

const COLORES = {
  emr: "#9b2247",        // Pantone 7420 C
  emrBorde: "#611232",   // Pantone 7421 C
  comaleras: "#cfb579",  // Pantone 1255 C al 60%
  comalerasBorde: "#9f7f35",
  seleccionado: "#ffd24a"
};

const map = L.map("map", { zoomControl: true, preferCanvas: true }).setView([19.4, -99.1], 5);

const mapaBase = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
  attribution: "&copy; OpenTopoMap contributors"
});

const esriSat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  maxZoom: 19,
  attribution: "Tiles &copy; Esri"
});

L.control.layers({ "Mapa base": mapaBase, "Topográfico": topo, "Satélite": esriSat }).addTo(map);
L.control.scale({ imperial: false, metric: true }).addTo(map);

let geojsonData = null;
let coordinaciones = {};
let capaMunicipios = null;
let capaSeleccionada = null;

function normalizar(valor) {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function valorCobertura(feature) { return Number(feature?.properties?.[CAMPOS.cobertura] ?? 0); }
function esCoberturaVisible(feature) { const cob = valorCobertura(feature); return cob === 1 || cob === 2; }
function obtenerCoordinacion(nombre) {
  if (!nombre) return null;
  if (coordinaciones[nombre]) return coordinaciones[nombre];
  const keyNorm = normalizar(nombre);
  const k = Object.keys(coordinaciones).find(x => normalizar(x) === keyNorm);
  return k ? coordinaciones[k] : null;
}
function primerOficina(coord, estadoMunicipio = "") {
  const oficinas = coord?.oficinas || [];
  if (!oficinas.length) return null;
  const edoNorm = normalizar(estadoMunicipio);
  const encontrada = oficinas.find(of => {
    const estadoOf = normalizar(of.estado);
    const municipioOf = normalizar(of.municipio_sede);
    const localidadOf = normalizar(of.localidad);
    return estadoOf === edoNorm || estadoOf.includes(edoNorm) || edoNorm.includes(estadoOf) || municipioOf === edoNorm || localidadOf === edoNorm;
  });
  return encontrada || oficinas[0];
}

function estiloMunicipio(feature) {
  const cob = valorCobertura(feature);
  if (cob === 1) return { color: COLORES.emrBorde, weight: 1, fillColor: COLORES.emr, fillOpacity: 0.56 };
  if (cob === 2) return { color: COLORES.comalerasBorde, weight: 1, fillColor: COLORES.comaleras, fillOpacity: 0.76 };
  return { color: "transparent", weight: 0, fillColor: "transparent", fillOpacity: 0 };
}
function estiloSeleccionado(feature) {
  const cob = valorCobertura(feature);
  return { color: "#f2c94c", weight: 3, fillColor: cob === 2 ? COLORES.comaleras : COLORES.emr, fillOpacity: cob === 2 ? 0.9 : 0.72 };
}

function crearPopup(feature) {
  const p = feature.properties || {};
  const municipio = p[CAMPOS.municipio] || "Sin dato";
  const estado = p[CAMPOS.estado] || "Sin dato";
  const coordNombre = p[CAMPOS.coordinacion] || "";
  const coord = obtenerCoordinacion(coordNombre);
  const responsable = coord?.responsable ? `<p><strong>Responsable:</strong> ${coord.responsable}</p>` : "";
  return `
    <div class="popup-card">
      <img src="img/logo.png" alt="El Maíz es la Raíz" class="popup-logo" />
      <div class="popup-divider"></div>
      <h3 class="popup-title">${municipio}</h3>
      <p><strong>Estado:</strong> ${estado}</p>
      <div class="popup-coord">
        <p><strong>Coordinación:</strong> ${coord?.coordinacion || coordNombre || "No disponible"}</p>
        ${responsable}
      </div>
    </div>`;
}

function enlacesCoordinacion(coord, estadoMunicipio = "") {
  const oficina = primerOficina(coord, estadoMunicipio);
  const tel = coord?.telefono || "";
  const correo = coord?.correo || "";
  const maps = oficina?.maps || "";
  const links = [];
  if (tel) links.push(`<a href="tel:${tel.replace(/[^0-9+]/g, '')}">☎ Llamar</a>`);
  if (correo) links.push(`<a class="mail" href="mailto:${correo}">✉ Enviar correo</a>`);
  if (maps) links.push(`<a class="map" href="${maps}" target="_blank" rel="noopener">📍 Cómo llegar</a>`);
  return links.length ? `<div class="coord-actions">${links.join("")}</div>` : "";
}

function actualizarResultado(feature) {
  const box = document.getElementById("resultadoBox");
  const p = feature.properties || {};
  box.innerHTML = `
    <h3>Municipio seleccionado</h3>
    <div class="result-title">${p[CAMPOS.municipio] || "Municipio"}</div>
    <p><strong>Estado:</strong> ${p[CAMPOS.estado] || "Sin dato"}</p>
    <p><strong>Cobertura:</strong> ${valorCobertura(feature) === 2 ? "Comaleras Bienestar" : "El Maíz es la Raíz"}</p>`;
}

function actualizarCoordinacion(feature) {
  const box = document.getElementById("coordinacionBox");
  const p = feature.properties || {};
  const coordNombre = p[CAMPOS.coordinacion] || "";
  const coord = obtenerCoordinacion(coordNombre);
  const oficina = primerOficina(coord, p[CAMPOS.estado]);
  if (!coord) {
    box.innerHTML = `<h3>Coordinación Estatal</h3><p>No hay información de coordinación disponible para <strong>${coordNombre || "este municipio"}</strong>.</p>`;
    return;
  }
  box.innerHTML = `
    <h3>Coordinación Estatal</h3>
    <div class="coord-name">${coord.coordinacion}</div>
    ${coord.responsable ? `<p class="coord-detail"><strong>Responsable:</strong><br>${coord.responsable}</p>` : ""}
    ${coord.telefono ? `<p class="coord-detail"><strong>Teléfono:</strong><br>${coord.telefono}</p>` : ""}
    ${coord.correo ? `<p class="coord-detail"><strong>Correo:</strong><br>${coord.correo}</p>` : ""}
    ${oficina?.direccion ? `<p class="coord-detail"><strong>Dirección:</strong><br>${oficina.direccion}</p>` : ""}
    ${enlacesCoordinacion(coord, p[CAMPOS.estado])}`;
}

function seleccionarLayer(layer) {
  if (capaSeleccionada && capaMunicipios) capaMunicipios.resetStyle(capaSeleccionada);
  capaSeleccionada = layer;
  layer.setStyle(estiloSeleccionado(layer.feature));
  layer.bringToFront();
  actualizarResultado(layer.feature);
  actualizarCoordinacion(layer.feature);
  layer.openPopup();
}

function cargarEstados(data) {
  const select = document.getElementById("estadoSelect");
  const estados = [...new Set(data.features.map(f => f.properties?.[CAMPOS.estado]))]
    .filter(e => e && normalizar(e) !== "")
    .sort((a, b) => a.localeCompare(b, "es"));
  estados.forEach(estado => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    select.appendChild(option);
  });
}

function filtrarFeatures() {
  const estado = document.getElementById("estadoSelect").value;
  return geojsonData.features.filter(f => esCoberturaVisible(f) && (estado ? f.properties?.[CAMPOS.estado] === estado : true));
}

function renderizarCapa() {
  if (capaMunicipios) map.removeLayer(capaMunicipios);
  capaSeleccionada = null;
  const featureCollection = { type: "FeatureCollection", features: filtrarFeatures() };
  capaMunicipios = L.geoJSON(featureCollection, {
    style: estiloMunicipio,
    onEachFeature: (feature, layer) => {
      layer.bindPopup(crearPopup(feature));
      layer.on("click", () => seleccionarLayer(layer));
      layer.on("mouseover", () => {
        if (layer !== capaSeleccionada) {
          const estilo = estiloMunicipio(feature);
          layer.setStyle({ weight: 2, fillOpacity: Math.min((estilo.fillOpacity || 0.5) + 0.12, 0.92) });
        }
      });
      layer.on("mouseout", () => { if (layer !== capaSeleccionada) capaMunicipios.resetStyle(layer); });
    }
  }).addTo(map);
  if (capaMunicipios.getBounds().isValid()) map.fitBounds(capaMunicipios.getBounds(), { padding: [25, 25] });
}

function buscarMunicipio() {
  const texto = normalizar(document.getElementById("municipioInput").value);
  if (!texto) { alert("Escribe el nombre de un municipio."); return; }
  let encontrado = null;
  capaMunicipios.eachLayer(layer => {
    const p = layer.feature.properties || {};
    const muni = normalizar(p[CAMPOS.municipio]);
    const edo = normalizar(p[CAMPOS.estado]);
    const coord = normalizar(p[CAMPOS.coordinacion]);
    if (!encontrado && (muni.includes(texto) || edo.includes(texto) || coord.includes(texto))) encontrado = layer;
  });
  if (!encontrado) { alert("No se encontró coincidencia en la cobertura mostrada."); return; }
  seleccionarLayer(encontrado);
  map.fitBounds(encontrado.getBounds(), { padding: [40, 40], maxZoom: 10 });
}

function limpiarConsulta() {
  document.getElementById("municipioInput").value = "";
  document.getElementById("estadoSelect").value = "";
  document.getElementById("resultadoBox").innerHTML = `<h3>Resultado</h3><p>Haz clic sobre un municipio o usa el buscador.</p>`;
  document.getElementById("coordinacionBox").innerHTML = `<h3>Coordinación Estatal</h3><p>Selecciona un municipio para consultar la coordinación correspondiente.</p>`;
  renderizarCapa();
}

function irUbicacion() {
  if (!navigator.geolocation) { alert("Tu navegador no permite geolocalización."); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    L.marker([latitude, longitude]).addTo(map).bindPopup("Tu ubicación aproximada").openPopup();
    map.setView([latitude, longitude], 10);
  }, () => alert("No fue posible obtener tu ubicación."));
}
function compartir() {
  const url = window.location.href;
  if (navigator.share) navigator.share({ title: document.title, url });
  else { navigator.clipboard?.writeText(url); alert("Enlace copiado al portapapeles."); }
}

Promise.all([
  fetch("data/cobertura.geojson").then(r => { if (!r.ok) throw new Error("No se pudo cargar cobertura.geojson"); return r.json(); }),
  fetch("data/coordinaciones.json").then(r => { if (!r.ok) throw new Error("No se pudo cargar coordinaciones.json"); return r.json(); })
]).then(([geo, coords]) => {
  geojsonData = geo;
  coordinaciones = coords;
  cargarEstados(geojsonData);
  renderizarCapa();
  document.getElementById("loading").classList.add("hidden");
}).catch(err => {
  console.error(err);
  document.getElementById("loading").textContent = "Error al cargar los datos del visor.";
  alert("Error al cargar la información del visor. Verifica que los archivos estén en las carpetas data/ y que uses Live Server.");
});

document.getElementById("buscarBtn").addEventListener("click", buscarMunicipio);
document.getElementById("limpiarBtn").addEventListener("click", limpiarConsulta);
document.getElementById("estadoSelect").addEventListener("change", renderizarCapa);
document.getElementById("municipioInput").addEventListener("keydown", e => { if (e.key === "Enter") buscarMunicipio(); });
document.getElementById("ubicacionBtn").addEventListener("click", irUbicacion);
document.getElementById("compartirBtn").addEventListener("click", compartir);
document.getElementById("imprimirBtn").addEventListener("click", () => window.print());
