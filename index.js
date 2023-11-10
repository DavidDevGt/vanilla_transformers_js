import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

env.allowLocalModels = false;

const fileUpload = document.getElementById("file-upload");
const clearSelectionButton = document.getElementById("clear-selection");
const imageContainer = document.getElementById("image-container");
const status = document.getElementById("status");

let detector;

async function loadModel() {
  updateStatus("Cargando modelo de detección de objetos...");
  detector = await pipeline("object-detection", "Xenova/detr-resnet-50");
  updateStatus("Modelo cargado. ¡Sube una imagen para empezar!");
}

function updateStatus(message) {
  status.textContent = message;
}

function resetApplication() {
  fileUpload.value = "";
  imageContainer.innerHTML = "";
  updateStatus("Modelo cargado. ¡Sube una imagen para empezar!");
}

fileUpload.addEventListener("change", async function (e) {
  const file = e.target.files[0];
  if (!file) {
    updateStatus("No se seleccionó ninguna imagen.");
    return;
  }
  readAndDetectImage(file);
});

clearSelectionButton.addEventListener("click", resetApplication);

async function readAndDetectImage(file) {
  updateStatus("Cargando imagen...");
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
  updateStatus("Imagen cargada. Analizando...");
}

async function detectObjects(imageSrc) {
  const output = await detector(imageSrc, { threshold: 0.5, percentage: true });
  if (output.length === 0) {
    updateStatus("No se detectaron objetos en la imagen.");
  } else {
    updateStatus(`Se detectaron ${output.length} objetos.`);
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