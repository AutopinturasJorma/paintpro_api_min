// frontend/static/js/components/semaphoreCard.js
export function semaphoreCard(title, pct, detail) {
  const el = document.createElement("div");
  el.className = "pp-semaphore";
  let cls = "green";
  if (pct >= 98) cls = "red";
  else if (pct >= 90) cls = "orange";
  el.innerHTML = `
    <div class="pp-semaphore-box ${cls}">
      <div class="pp-semaphore-title">${title}</div>
      <div class="pp-semaphore-pct">${pct}%</div>
      <div class="pp-semaphore-detail">${detail}</div>
    </div>`;
  return el;
}
