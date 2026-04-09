// frontend/static/js/components/loading.js
export function renderLoading(message="Analizando datos...") {
  const el = document.createElement("div");
  el.className = "pp-loading";
  el.innerHTML = `<div class="spinner"></div><p>${message}</p>`;
  return el;
}
