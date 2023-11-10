import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

// No permitir modelos locales
env.allowLocalModels = false;

// Variables para manipular el DOM
const fileUpload = document.getElementById("file-upload");
const imageContainer = document.getElementById("image-container");
const status = document.getElementById("status");

// Mensaje de espera, luego llamar a la pipeline
status.textContent = "Cargando modelo...";
const detector = await pipeline("object-detection", "Xenova/detr-resnet-50");

// Cuando retorne el modelo, cambiar el mensaje
status.textContent = "¡Listo para detectar objetos!";

// Crear la logica para cargar la imagen
fileUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();

    // Configurar callback cuando el archivo se haya subido
    reader.onload = function (e2) {
        imageContainer.innerHTML = "";
        const image = document.createElement("img");
        image.src = e2.target.result;
        imageContainer.appendChild(image);
        detect(image);
        // Lo de arriba si se descomenta corre el modelo
    };
    reader.readAsDataURL(file);
});

// Con el modelo cargado, detectar objetos
async function detect(img) {
    status.textContent = 'Analysing...';
    const output = await detector(img.src, {
        threshold: 0.5,
        percentage: true,
    });
    status.textContent = '';
    output.forEach(renderBox);
}

// Esto genera el cuadro de la deteccion
function renderBox({ box, label }) {
    const { xmax, xmin, ymax, ymin } = box;

    // Generate a random color for the box
    const color = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, 0);

    // Draw the box
    const boxElement = document.createElement('div');
    boxElement.className = 'bounding-box';
    Object.assign(boxElement.style, {
        borderColor: color,
        left: 100 * xmin + '%',
        top: 100 * ymin + '%',
        width: 100 * (xmax - xmin) + '%',
        height: 100 * (ymax - ymin) + '%',
    });

    // Generar el label para el cuadro
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    labelElement.className = 'bounding-box-label';
    labelElement.style.backgroundColor = color;

    boxElement.appendChild(labelElement);
    imageContainer.appendChild(boxElement);
}