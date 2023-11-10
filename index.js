import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

env.allowLocalModels = false;

const fileUpload = document.getElementById("file-upload");
const clearSelectionButton = document.getElementById("clear-selection");
const imageContainer = document.getElementById("image-container");
const progressBar = document.getElementById("progress-bar");
const status = document.getElementById("status");

let detector;

async function loadModel() {
  status.textContent = "Cargando modelo de detección de objetos...";
  detector = await pipeline("object-detection", "Xenova/detr-resnet-50");
  status.textContent = "Modelo cargado. ¡Sube una imagen para empezar!";
}

function updateProgressBar(progress) {
  progressBar.style.width = `${progress}%`;
}

function resetApplication() {
  fileUpload.value = "";
  imageContainer.innerHTML = "";
  status.textContent = "Modelo cargado. ¡Sube una imagen para empezar!";
  updateProgressBar(0);
}

fileUpload.addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) {
    status.textContent = "No se seleccionó ninguna imagen.";
    updateProgressBar(0);
    return;
  }
  readAndDetectImage(file);
});

clearSelectionButton.addEventListener("click", resetApplication);

async function readAndDetectImage(file) {
  status.textContent = "Cargando imagen...";
  updateProgressBar(10); // pequeño progreso por la carga de la imagen

  const reader = new FileReader();
  reader.onload = async function (e) {
    displayImage(e.target.result);
    await detectObjects(e.target.result);
  };
  reader.readAsDataURL(file);
}

function displayImage(imageSrc) {
  imageContainer.innerHTML = "";
  const image = new Image();
  image.src = imageSrc;
  imageContainer.appendChild(image);
  updateProgressBar(30); // Progreso por haber cargado la imagen en el contenedor
}

async function detectObjects(imageSrc) {
  status.textContent = "Analizando imagen...";
  updateProgressBar(50); // Progreso inicial del análisis

  const output = await detector(imageSrc, { threshold: 0.5, percentage: true });
  updateProgressBar(100); // Completar la barra al terminar el análisis

  if (output.length === 0) {
    status.textContent = "No se detectaron objetos en la imagen.";
  } else {
    status.textContent = `Se detectaron ${output.length} objetos.`;
    output.forEach(renderBox);
  }
}
function renderBox({ box, label }) {
  const { xmax, xmin, ymax, ymin } = box;
  const color =
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0");
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

loadModel();
