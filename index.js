import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

// No permitir modelos locales
env.allowLocalModels = false;

// Variables para manipular el DOM
const fileUpload = document.getElementById("file-upload");
const imageContainer = document.getElementById("image-container");
const status = document.getElementById("status");

// Mensaje de espera
status.textContent = "Cargando modelo...";

// Llamar a la pipeline
const detector = await pipeline("object-detection", "Xenova/detr-resnet-50");

// Cuando retorne el modelo, cambiar el mensaje
status.textContent = "¡Listo para detectar objetos!";

// Crear la logica para cargar la imagen