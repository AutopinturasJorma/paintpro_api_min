// frontend/static/js/components/scenario_buttons.js
window.renderScenarioButtons = function(rootEl, store){
  rootEl = rootEl || document.getElementById('app');   // ✅ fallback
  if (!rootEl) return;

  const hasOpt = !!(store && store.results && store.results.optimicer);
  let html = `
    <div class="pp-cta" style="margin:16px 0 6px; display:flex; gap:8px; flex-wrap:wrap">
      <button class="pp-btn pp-ghost" onclick="window.setScenario('actual')">Situación actual</button>
      <button class="pp-btn" onclick="window.viewOpSetup()">Optimizar el taller</button>
      ${hasOpt ? `<button class="pp-btn" onclick="window.goPaintPro()">PaintPro</button>` : ``}
    </div>`;
  rootEl.insertAdjacentHTML('beforeend', html);
};
