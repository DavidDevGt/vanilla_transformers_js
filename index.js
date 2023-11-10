import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

// No permitir modelos locales
env.allowLocalModels = false;

// Variables para manipular el DOM
const fileUpload = document.getElementById("file-upload");
const clearSelectionButton = document.getElementById("clear-selection");
const imageContainer = document.getElementById("image-container");
const progressBar = document.getElementById("progress-bar");
const status = document.getElementById("status");
const resultsSummary = document.getElementById("results-summary");

// Mensaje de espera, luego llamar a la pipeline
status.textContent = "Cargando modelo de detección de objetos...";
const detector = await pipeline("object-detection", "Xenova/detr-resnet-50");

// Cuando retorne el modelo, cambiar el mensaje
status.textContent = "Modelo cargado. ¡Sube una imagen para empezar!";

// Crear la lógica para cargar la imagen
fileUpload.addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) {
    status.textContent = "No se seleccionó ninguna imagen.";
    progressBar.style.width = '0%';
    return;
  }
  status.textContent = "Cargando imagen...";
  progressBar.style.width = '50%'; // 50% para cargar imagen

  const reader = new FileReader();

  reader.onload = async function (e2) {
    imageContainer.innerHTML = "";
    const image = new Image();
    image.src = e2.target.result;
    image.onload = async () => {
      imageContainer.appendChild(image);
      status.textContent = "Analizando imagen...";
      progressBar.style.width = '75%'; // 75% para analizar imagen
      await detect(image);
    };
  };
  reader.readAsDataURL(file);
});

// Botón para limpiar selección
clearSelectionButton.addEventListener('click', function() {
  fileUpload.value = ''; // Limpiar input
  imageContainer.innerHTML = ''; // Limpiar contenedor de imagen
  status.textContent = 'Modelo cargado. ¡Sube una imagen para empezar!';
  progressBar.style.width = '0%'; // Reiniciar barra de progreso
  resultsSummary.innerHTML = ''; // Limpiar resumen de resultados
});

// Con el modelo cargado, detectar objetos
async function detect(img) {
  const output = await detector(img.src, {
    threshold: 0.5,
    percentage: true,
  });
  progressBar.style.width = '100%'; // 100% al finalizar análisis
  if (output.length === 0) {
    status.textContent = "No se detectaron objetos en la imagen.";
    resultsSummary.innerHTML = '<p>No se encontraron objetos.</p>';
  } else {
    status.textContent = `Se detectaron ${output.length} objetos.`;
    output.forEach(renderBox);
    resultsSummary.innerHTML = `<p>Se encontraron ${output.length} objetos.</p>`;
  }
}

// Esto genera el cuadro de la detección
function renderBox({ box, label }) {
  const { xmax, xmin, ymax, ymin } = box;
  const color = "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  const boxElement = document.createElement("div");
  boxElement.className = "bounding-box";
  Object.assign(boxElement.style, {
    borderColor: color,
    left: `${100 * xmin}%`,
    top: `${100 * ymin}%`,
    width: `${100 * (xmax - xmin)}%`,
    height: `${100 * (ymax - ymin)}%`,
  });

  const labelElement = document.createElement("span");
  labelElement.textContent = label;
  labelElement.className = "bounding-box-label";
  labelElement.style.backgroundColor = color;
  boxElement.appendChild(labelElement);
  imageContainer.appendChild(boxElement);
}
