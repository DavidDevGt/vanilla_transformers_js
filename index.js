
import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

const APP_STATUS = {
  INITIALIZING: "Inicializando aplicación...",
  LOADING_MODEL: "Cargando modelo de detección de objetos...",
  MODEL_READY: "Modelo cargado. ¡Sube una imagen para empezar!",
  NO_IMAGE: "No se seleccionó ninguna imagen.",
  LOADING_IMAGE: "Cargando imagen...",
  ANALYZING_IMAGE: "Imagen cargada. Analizando...",
  NO_OBJECTS: "No se detectaron objetos en la imagen.",
  OBJECTS_FOUND: (count) => `Se detectaron ${count} objeto${count !== 1 ? 's' : ''}.`
};

const MODEL_CONFIG = {
  name: "object-detection",
  path: "Xenova/detr-resnet-50",
  threshold: 0.6,
  usePercentage: true
};

const elements = {
  fileUpload: document.getElementById("file-upload"),
  clearButton: document.getElementById("clear-selection"),
  imageContainer: document.getElementById("image-container"),
  statusElement: document.getElementById("status"),
  loaderElement: document.getElementById("loader")
};

const appState = {
  detector: null,
  isModelLoaded: false
};

/**
 * Inicializa la aplicación
 * @returns {Promise<void>}
 */
async function initializeApplication() {
  try {
    validateDomElements();
    setupEventListeners();
    resetApplication();
    await loadModel();
  } catch (error) {
    handleError("Error al inicializar la aplicación", error);
  }
}

/**
 * Valida que todos los elementos DOM necesarios estén presentes
 * @throws {Error} Si algún elemento DOM requerido no existe
 */
function validateDomElements() {
  const requiredElements = ["fileUpload", "clearButton", "imageContainer", "statusElement", "loaderElement"];
  
  for (const element of requiredElements) {
    if (!elements[element]) {
      throw new Error(`Elemento DOM requerido no encontrado: ${element}`);
    }
  }
}

function setupEventListeners() {
  elements.fileUpload.addEventListener("change", handleFileSelection);
  elements.clearButton.addEventListener("click", resetApplication);
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => e.preventDefault());
}

/**
 * Carga el modelo de detección de objetos
 * @returns {Promise<void>}
 */
async function loadModel() {
  try {
    updateStatus(APP_STATUS.LOADING_MODEL);
    
    env.allowLocalModels = false;
    
    const modelLoadPromise = pipeline(MODEL_CONFIG.name, MODEL_CONFIG.path);
    const timeoutPromise = createTimeout(30000, "Tiempo de espera agotado al cargar el modelo");
    
    appState.detector = await Promise.race([modelLoadPromise, timeoutPromise]);
    appState.isModelLoaded = true;
    
    updateStatus(APP_STATUS.MODEL_READY);
  } catch (error) {
    appState.isModelLoaded = false;
    handleError("Error al cargar el modelo", error);
  }
}

/**
 * Crea una promesa que se rechaza después de un tiempo de espera
 * @param {number} ms - Tiempo de espera en milisegundos
 * @param {string} message - Mensaje de error
 * @returns {Promise<never>} - Promesa que siempre se rechaza después del tiempo de espera
 */
function createTimeout(ms, message) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Actualiza el mensaje de estado en la interfaz
 * @param {string} message - Mensaje de estado para mostrar
 */
function updateStatus(message) {
  if (!elements.statusElement) {
    console.error("Elemento de estado no encontrado");
    return;
  }
  
  elements.statusElement.textContent = message;
}

/**
 * Maneja errores mostrando mensajes apropiados
 * @param {string} context - Contexto donde ocurrió el error
 * @param {Error} error - Objeto de error
 */
function handleError(context, error) {
  const errorMessage = `${context}: ${error.message || "Error desconocido"}`;
  console.error(errorMessage, error);
  updateStatus(`⚠️ ${errorMessage}`);
}

/**
 * Resetea la aplicación a su estado inicial
 */
function resetApplication() {
  try {
    if (elements.fileUpload) {
      elements.fileUpload.value = "";
    }
    
    if (elements.imageContainer) {
      elements.imageContainer.innerHTML = "";
    }
    
    if (elements.clearButton) {
      elements.clearButton.style.display = "none";
    }
    
    const statusMessage = appState.isModelLoaded ? 
      APP_STATUS.MODEL_READY : 
      APP_STATUS.LOADING_MODEL;
    
    updateStatus(statusMessage);
  } catch (error) {
    handleError("Error al resetear la aplicación", error);
  }
}

/**
 * Muestra el loader
 */
function showLoader() {
  elements.loaderElement.style.display = "block";
}

/**
 * Oculta el loader
 */
function hideLoader() {
  elements.loaderElement.style.display = "none";
}

/**
 * Maneja la selección de archivo
 * @param {Event} event - Evento de cambio del input de archivo
 */
async function handleFileSelection(event) {
  try {
    if (!appState.isModelLoaded) {
      alert("Por favor espera a que el modelo termine de cargar.");
      return;
    }
    
    const file = event.target.files[0];
    if (!file) {
      updateStatus(APP_STATUS.NO_IMAGE);
      return;
    }
    
    if (!file.type.startsWith("image/")) {
      updateStatus("Error: El archivo seleccionado no es una imagen.");
      return;
    }
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      updateStatus("Error: La imagen es demasiado grande. Máximo 10MB.");
      return;
    }
    showLoader();
    await processImage(file);
    hideLoader();
  } catch (error) {
    hideLoader();
    handleError("Error al seleccionar archivo", error);
  }
}

/**
 * Procesa la imagen seleccionada
 * @param {File} file - Archivo de imagen
 * @returns {Promise<void>}
 */
async function processImage(file) {
  try {
    updateStatus(APP_STATUS.LOADING_IMAGE);
    
    const imageSrc = await readFileAsDataURL(file);
    displayImage(imageSrc);
    await detectObjects(imageSrc);
  } catch (error) {
    handleError("Error al procesar la imagen", error);
  }
}

/**
 * Lee un archivo como Data URL
 * @param {File} file - Archivo para leer
 * @returns {Promise<string>} - Data URL del archivo
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(new Error("Error al leer el archivo: " + error));
    
    reader.readAsDataURL(file);
  });
}

/**
 * Muestra la imagen en el contenedor
 * @param {string} imageSrc - URL de la imagen
 */
function displayImage(imageSrc) {
  try {
    if (!elements.imageContainer) {
      throw new Error("Contenedor de imagen no encontrado");
    }
    
    elements.imageContainer.innerHTML = "";
    
    const image = new Image();
    image.alt = "Imagen subida para análisis";
    image.src = imageSrc;
    
    elements.imageContainer.appendChild(image);
    elements.clearButton.style.display = "block";
    
    updateStatus(APP_STATUS.ANALYZING_IMAGE);
  } catch (error) {
    handleError("Error al mostrar la imagen", error);
  }
}

/**
 * Detecta objetos en la imagen
 * @param {string} imageSrc - URL de la imagen
 * @returns {Promise<void>}
 */
async function detectObjects(imageSrc) {
  try {
    if (!appState.detector) {
      throw new Error("Detector no inicializado");
    }
    
    const detectionOptions = {
      threshold: MODEL_CONFIG.threshold,
      percentage: MODEL_CONFIG.usePercentage
    };
    
    const detectionPromise = appState.detector(imageSrc, detectionOptions);
    const timeoutPromise = createTimeout(15000, "La detección de objetos está tomando demasiado tiempo");
    
    const detectedObjects = await Promise.race([detectionPromise, timeoutPromise]);
    
    if (!Array.isArray(detectedObjects)) {
      throw new Error("Formato de respuesta inesperado del detector");
    }
    
    if (detectedObjects.length === 0) {
      updateStatus(APP_STATUS.NO_OBJECTS);
    } else {
      updateStatus(APP_STATUS.OBJECTS_FOUND(detectedObjects.length));
      detectedObjects.forEach(renderDetectionBox);
    }
  } catch (error) {
    handleError("Error en la detección de objetos", error);
  }
}

/**
 * Genera un color aleatorio para las cajas de detección
 * @returns {string} - Color en formato hexadecimal
 */
function generateRandomColor() {
  const predefinedColors = [
    "#FF5733", "#33FF57", "#3357FF", "#F3FF33", 
    "#FF33F3", "#33FFF3", "#FF8C33", "#8C33FF"
  ];
  
  return predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
}

/**
 * Renderiza una caja de detección en la imagen
 * @param {Object} detection - Objeto de detección
 * @param {Object} detection.box - Coordenadas de la caja
 * @param {number} detection.box.xmin - Coordenada X mínima (0-1)
 * @param {number} detection.box.ymin - Coordenada Y mínima (0-1)
 * @param {number} detection.box.xmax - Coordenada X máxima (0-1)
 * @param {number} detection.box.ymax - Coordenada Y máxima (0-1)
 * @param {string} detection.label - Etiqueta del objeto detectado
 */
function renderDetectionBox({ box, label, score }) {
  try {
    if (!elements.imageContainer) {
      throw new Error("Contenedor de imagen no encontrado");
    }
    
    const { xmin, ymin, xmax, ymax } = box;
    if (xmin < 0 || ymin < 0 || xmax > 1 || ymax > 1 || xmin >= xmax || ymin >= ymax) {
      console.warn("Coordenadas de caja inválidas:", box);
      return;
    }
    
    const color = generateRandomColor();
    
    const boxElement = document.createElement("div");
    boxElement.className = "bounding-box";
    
    const styles = {
      borderColor: color,
      left: `${Math.max(0, Math.min(100, 100 * xmin))}%`,
      top: `${Math.max(0, Math.min(100, 100 * ymin))}%`,
      width: `${Math.max(0, Math.min(100, 100 * (xmax - xmin)))}%`,
      height: `${Math.max(0, Math.min(100, 100 * (ymax - ymin)))}%`
    };
    
    Object.assign(boxElement.style, styles);
    
    const labelElement = document.createElement("span");
    labelElement.className = "bounding-box-label";
    labelElement.style.backgroundColor = color;
    
    const formattedScore = score ? ` (${Math.round(score * 100)}%)` : '';
    labelElement.textContent = `${label}${formattedScore}`;
    
    boxElement.appendChild(labelElement);
    elements.imageContainer.appendChild(boxElement);
  } catch (error) {
    handleError("Error al renderizar caja de detección", error);
  }
}
document.addEventListener("DOMContentLoaded", initializeApplication);
