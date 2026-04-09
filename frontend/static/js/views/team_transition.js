// frontend/static/js/views/team_transition.js
export function renderTeamTransition(onNext){
  const el = document.createElement("div");
  el.className = "pp-screen";
  el.innerHTML = `
    <h2>TEAM</h2>
    <p>Comparamos tu forma habitual de trabajo con nuestra organización para producir más sin ampliar personal.</p>
    <button class="pp-btn-primary" id="pp-next">Ver resultados</button>
  `;
  el.querySelector("#pp-next").onclick = onNext;
  return el;
}
