// frontend/static/js/views/team_results.js
export function renderTeamResults(model, onCTA){
  const {coches_dia_actual, coches_dia_team, coches_mes_actual, coches_mes_team, delta_coches_dia, delta_coches_mes, impacto_eur_mes, escenario} = model;

  const el = document.createElement("div");
  el.className = "pp-screen";

  const grid = document.createElement("div");
  grid.className = "pp-compare-grid";
  grid.innerHTML = `
    <div class="pp-card orange">
      <h3>Hoy (método habitual)</h3>
      <div class="pp-kpi">${coches_dia_actual} <small>coches/día</small></div>
      <div class="pp-subkpi">${coches_mes_actual} coches/mes</div>
    </div>
    <div class="pp-card green">
      <h3>Con TEAM (organizado)</h3>
      <div class="pp-kpi">${coches_dia_team} <small>coches/día</small></div>
      <div class="pp-subkpi">${coches_mes_team} coches/mes</div>
    </div>
  `;

  const delta = document.createElement("div");
  delta.className = "pp-delta";
  let msg = "Con pequeños ajustes puedes ganar";
  if (escenario==="alto") msg = "Estás dejando mucho en la mesa. Puedes ganar";
  if (escenario==="bajo") msg = "Ya lo haces bien. Aún así puedes ganar";
  if (escenario==="irreal") msg = "Tus cifras parecen por encima de la capacidad estimada.";
  delta.innerHTML = (escenario==="irreal")
    ? `<p>${msg} Solicita un diagnóstico con un consultor.</p>`
    : `<p>${msg} <strong>+${delta_coches_dia} coches/día</strong> (≈ +${delta_coches_mes}/mes) → <strong>+${impacto_eur_mes.toLocaleString()} € / mes</strong></p>`;

  const cta = document.createElement("div");
  cta.className = "pp-cta";
  cta.innerHTML = `<button class="pp-btn-primary">Activar Maestro / Consultoría TEAM</button>`;
  cta.querySelector("button").onclick = onCTA;

  el.appendChild(grid);
  el.appendChild(delta);
  el.appendChild(cta);
  return el;
}
