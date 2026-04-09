// frontend/static/js/components/recommendationCard.js
export function recommendationCard(rec) {
  const el = document.createElement("div");
  el.className = "pp-reco";
  el.innerHTML = `
    <h3>Recomendación</h3>
    <p>${rec.texto}</p>
    <small>${rec.nota_guardarrail || ""}</small>
    <div class="pp-reco-actions">
      <button class="pp-btn-primary" id="pp-consultor">Hablar con un consultor</button>
      <button class="pp-btn-secondary" id="pp-team">Organizar mi equipo (TEAM)</button>
    </div>
  `;
  return el;
}
