const imageUpload = document.getElementById("image-system-upload");
const imageUrl = document.getElementById("image-url-upload");
const predictButton = document.getElementById("predict-button");
const clearButton = document.getElementById("clear-button");
const displayButton = document.getElementById("display-button");
const resultText = document.getElementById("result-text");
const featureMapContainer = document.getElementById("fmap-container");

// Event listener image upload from system
imageUpload.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    imageUrl.value = null;
    imageUrl.disabled = true;
  }
});

// Button Click Event Listeners
clearButton.addEventListener("click", clearAll);
predictButton.addEventListener("click", handlePredict);
displayButton.addEventListener("click", handleDisplay);

async function handleDisplay() {
  const url = imageUrl.value;
  const file = imageUpload.files[0];

  if (!url && !file) {
    return;
  }

  clearDisplay();
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      displayImage(e.target.result);
    };
    reader.readAsDataURL(file);
  } else if (url) {
    if (!(await fetchImageFromURL(url))) {
      return;
    }
    displayImage(url);
  }
}

async function handlePredict() {
  document.getElementById("prediction-result").style.display = "block";
  const data = await getPrediction();
  if (data) {
    setPredictionResult(data.prediction);
    setFeatureMaps(data.features);
    clearImageUpload();
    hidePredict();
  }
}

function setPredictionResult(value) {
  const resultSpan = document.createElement("span");
  resultSpan.setAttribute("class", "pred-result");

  if (value) {
    resultSpan.textContent = "Wearing Mask";
    resultSpan.style.color = "#4caf50";
  } else {
    resultSpan.textContent = "Not Wearing Mask";
    resultSpan.style.color = "#af504c";
  }

  resultText.innerHTML = `Result: `;
  resultText.append(resultSpan);
}

async function getPrediction() {
  try {
    const formData = new FormData();
    const url = imageUrl.value;
    if (url) {
      const imgBlob = await fetchImageFromURL(url);
      formData.append("file", imgBlob, "image");
    } else {
      const imgFile = imageUpload.files[0];
      formData.append("file", imgFile);
    }
    const response = await fetch(
      "https://mansaridev.pythonanywhere.com/api/v1/predict",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    return data;
  } catch (e) {
    clearAll();
    if (e.toString().toLowerCase().includes("fetch")) {
      window.alert("Something went wrong, could not get prediction...");
    }
  }
}

async function fetchImageFromURL(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw "Could not fetch image from url. Please enter a valid image url or try another image.";
    }
    return await response.blob();
  } catch (e) {
    clearAll();
    window.alert(e.toString());
  }
}

function displayImage(src) {
  const img = document.getElementById("uploaded-image");
  const currentImageSrc = img.getAttribute("src");
  if (currentImageSrc !== src) {
    img.setAttribute("src", src);
  }
  img.style.display = "block";
  showPredict();
}

function hidePredict() {
  predictButton.style.display = "none";
}

function showPredict() {
  predictButton.style.display = "block";
}

function clearFeatureMaps() {
  featureMapContainer.innerHTML = null;
}

function clearResult() {
  document.getElementById("prediction-result").style.display = "none";
  resultText.innerHTML = null;
}

function clearImageUpload() {
  imageUpload.value = null;
  imageUrl.value = null;
  imageUrl.disabled = false;
}

function clearAll() {
  clearResult();
  clearImageUpload();
  clearFeatureMaps();
  document.getElementById("uploaded-image").setAttribute("src", "");
  hidePredict();
}

function clearDisplay() {
  clearResult();
  clearFeatureMaps();
}

function setFeatureMaps(featureMaps) {
  const fmapTitle = document.createElement("h2");
  fmapTitle.id = "fmap-title";
  fmapTitle.innerHTML = "Feature Maps";
  featureMapContainer.append(fmapTitle);
  for (const fm of featureMaps) {
    const [layerName, layerFeatures] = fm;
    layerTitle = document.createElement("p");
    layerTitle.setAttribute("class", "layer-label");
    layerTitle.innerHTML = `${layerName} [out_channels=${layerFeatures.length}]`;
    layerDiv = document.createElement("div");
    layerDiv.setAttribute("class", "layer");
    layerDiv.append(layerTitle);
    featureMapContainer.append(layerDiv);
    drawFeatureMapLayer(layerFeatures, layerDiv);
  }
}

function drawFeatureMapLayer(layerFeatures, layerDiv) {
  for (const feature of layerFeatures) {
    drawFeatureMap(feature, layerDiv);
  }
}

function drawFeatureMap(feature, layerDiv) {
  const height = feature.length;
  const width = feature[0].length;

  const canvas = createFeatureMap(height, width, layerDiv);
  const context = canvas.getContext("2d");
  const image = context.createImageData(width, height);

  populateImageData(image, feature);
  context.putImageData(image, 0, 0);
}

function populateImageData(image, src) {
  let pixelIdx = 0;
  for (const val of src.flat()) {
    image.data[pixelIdx] = val;
    image.data[pixelIdx + 1] = val;
    image.data[pixelIdx + 2] = val;
    image.data[pixelIdx + 3] = 255;
    pixelIdx += 4;
  }
}

function createFeatureMap(height, width, layerDiv) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("class", "fmap");
  canvas.width = width;
  canvas.height = height;
  layerDiv.append(canvas);
  return canvas;
}
