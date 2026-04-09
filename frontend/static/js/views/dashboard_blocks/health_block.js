function renderHealthBlock(root, store) {

store.results?.finance?.indice_global

  root.innerHTML = `
    <h2>Salud general del taller</h2>
    <div class="card big center">
      <div class="kpi pp-skel">–%</div>
      <div class="label">ÍNDICE GLOBAL (0–100)</div>
    </div>
  `;
}
window.renderHealthBlock = renderHealthBlock;
